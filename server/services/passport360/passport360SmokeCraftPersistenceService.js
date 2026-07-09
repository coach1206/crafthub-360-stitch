/**
 * Passport 360 SmokeCraft Persistence Service — Phase F.5
 *
 * Real database-backed persistence for SmokeCraft 360 Passport data.
 * Falls back to safe local-only responses when database is unavailable.
 * Never fakes backendConnected: true.
 */

const SAFE_CLAIM = 'passport_360_smokecraft_persistence'

// Dynamic DB import — safe in prototype/no-DB mode
async function isDbAvailable() {
  try {
    const { isDbAvailable: check } = await import('../../db/connection.js')
    return check()
  } catch {
    return false
  }
}

async function dbQuery(sql, params = []) {
  const { query } = await import('../../db/connection.js')
  return query(sql, params)
}

function localFallback(area, extra = {}) {
  return {
    ok: false,
    backendConnected: false,
    persistenceMode: 'local_fallback',
    error: 'database_not_configured',
    safeClaim: SAFE_CLAIM,
    area,
    ...extra,
  }
}

// ── Health ────────────────────────────────────────────────────

export async function getPassportBackendHealth() {
  const available = await isDbAvailable()
  if (!available) {
    return {
      ok: true,
      backendConnected: false,
      persistenceMode: 'local_fallback',
      status: 'not_connected',
      safeClaim: SAFE_CLAIM,
      message: 'Database not configured. Passport 360 persistence running in local-fallback mode.',
    }
  }
  try {
    await dbQuery('SELECT 1')
    return {
      ok: true,
      backendConnected: true,
      persistenceMode: 'database',
      status: 'connected',
      safeClaim: SAFE_CLAIM,
    }
  } catch (err) {
    return {
      ok: false,
      backendConnected: false,
      persistenceMode: 'local_fallback',
      status: 'error',
      error: err.message,
      safeClaim: SAFE_CLAIM,
    }
  }
}

// ── Guest profile ─────────────────────────────────────────────

export async function createOrResolveGuestProfile({ tenantId, venueId, guestReference, displayName, emailHash, phoneHash }) {
  if (!await isDbAvailable()) return localFallback('createOrResolveGuestProfile')
  const tId = tenantId || 'novee-default'
  const vId = venueId  || 'novee-grand-lounge'
  const ref = guestReference || `guest_${Date.now()}`
  try {
    const existing = await dbQuery(
      `SELECT guest_id, guest_reference, profile_status FROM passport_360_guest_profiles
       WHERE tenant_id = $1 AND venue_id = $2 AND guest_reference = $3`,
      [tId, vId, ref]
    )
    if (existing.rows.length > 0) {
      return { ok: true, backendConnected: true, persistenceMode: 'database', safeClaim: SAFE_CLAIM, guest: existing.rows[0], created: false }
    }
    const ins = await dbQuery(
      `INSERT INTO passport_360_guest_profiles (tenant_id, venue_id, guest_reference, display_name, email_hash, phone_hash)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING guest_id, guest_reference, profile_status, created_at`,
      [tId, vId, ref, displayName || null, emailHash || null, phoneHash || null]
    )
    return { ok: true, backendConnected: true, persistenceMode: 'database', safeClaim: SAFE_CLAIM, guest: ins.rows[0], created: true }
  } catch (err) {
    return { ok: false, backendConnected: false, persistenceMode: 'local_fallback', error: err.message, safeClaim: SAFE_CLAIM, area: 'createOrResolveGuestProfile' }
  }
}

// ── Session save ──────────────────────────────────────────────

export async function saveSmokeCraftSessionToPassport({
  tenantId, venueId, guestId, smokecraftSessionId, sessionStatus = 'completed',
  completedRoute, completedSteps, tasteProfile, xpSummary, stampSummary,
  startedAt, completedAt,
}) {
  if (!await isDbAvailable()) return localFallback('saveSmokeCraftSessionToPassport')
  try {
    const result = await dbQuery(
      `INSERT INTO passport_360_smokecraft_sessions
         (tenant_id, venue_id, guest_id, smokecraft_session_id, session_status, completed_route,
          completed_steps_json, taste_profile_json, xp_summary_json, stamp_summary_json, started_at, completed_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING passport_session_id, session_status, completed_at`,
      [
        tenantId || 'novee-default',
        venueId  || 'novee-grand-lounge',
        guestId,
        smokecraftSessionId || null,
        sessionStatus,
        completedRoute || null,
        JSON.stringify(completedSteps || []),
        JSON.stringify(tasteProfile   || {}),
        JSON.stringify(xpSummary      || {}),
        JSON.stringify(stampSummary   || []),
        startedAt   ? new Date(startedAt)   : null,
        completedAt ? new Date(completedAt) : new Date(),
      ]
    )
    return { ok: true, backendConnected: true, persistenceMode: 'database', safeClaim: SAFE_CLAIM, session: result.rows[0] }
  } catch (err) {
    return { ok: false, backendConnected: false, persistenceMode: 'local_fallback', error: err.message, safeClaim: SAFE_CLAIM, area: 'saveSmokeCraftSessionToPassport' }
  }
}

// ── Stamp award (dedupe_key prevents duplicates) ──────────────

export async function awardPassportStampLive({ tenantId, venueId, guestId, stampId, moduleKey, sourceSessionId, sourceRoute, xpAwarded }) {
  if (!await isDbAvailable()) return localFallback('awardPassportStampLive')
  const dedupeKey = `${guestId}:${stampId}:${moduleKey || 'smokecraft-360'}`
  try {
    const result = await dbQuery(
      `INSERT INTO passport_360_earned_stamps
         (tenant_id, venue_id, guest_id, stamp_id, module_key, source_session_id, source_route, xp_awarded, dedupe_key)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (dedupe_key) DO NOTHING
       RETURNING earned_stamp_id, stamp_id, earned_at`,
      [
        tenantId || 'novee-default',
        venueId  || 'novee-grand-lounge',
        guestId,
        stampId,
        moduleKey     || 'smokecraft-360',
        sourceSessionId || null,
        sourceRoute     || null,
        xpAwarded       || 0,
        dedupeKey,
      ]
    )
    const duplicate = result.rows.length === 0
    return { ok: true, backendConnected: true, persistenceMode: 'database', safeClaim: SAFE_CLAIM, stamp: result.rows[0] || null, duplicate }
  } catch (err) {
    return { ok: false, backendConnected: false, persistenceMode: 'local_fallback', error: err.message, safeClaim: SAFE_CLAIM, area: 'awardPassportStampLive' }
  }
}

// ── XP award (upsert progress) ────────────────────────────────

export async function awardPassportXP({ tenantId, venueId, guestId, moduleKey, xpAmount, lastSessionKey, lastCompletedRoute }) {
  if (!await isDbAvailable()) return localFallback('awardPassportXP')
  const mKey = moduleKey || 'smokecraft-360'
  try {
    const result = await dbQuery(
      `INSERT INTO passport_360_guest_progress
         (tenant_id, venue_id, guest_id, module_key, total_xp, completed_sessions_count, last_session_key, last_completed_route, return_visit_count)
       VALUES ($1,$2,$3,$4,$5,1,$6,$7,0)
       ON CONFLICT (guest_id, module_key) DO UPDATE SET
         total_xp             = passport_360_guest_progress.total_xp + EXCLUDED.total_xp,
         completed_sessions_count = passport_360_guest_progress.completed_sessions_count + 1,
         last_session_key     = EXCLUDED.last_session_key,
         last_completed_route = EXCLUDED.last_completed_route,
         return_visit_count   = passport_360_guest_progress.return_visit_count + 1,
         updated_at           = NOW()
       RETURNING progress_id, total_xp, completed_sessions_count, return_visit_count, updated_at`,
      [
        tenantId || 'novee-default',
        venueId  || 'novee-grand-lounge',
        guestId,
        mKey,
        xpAmount || 0,
        lastSessionKey     || null,
        lastCompletedRoute || null,
      ]
    )
    return { ok: true, backendConnected: true, persistenceMode: 'database', safeClaim: SAFE_CLAIM, progress: result.rows[0] }
  } catch (err) {
    return { ok: false, backendConnected: false, persistenceMode: 'local_fallback', error: err.message, safeClaim: SAFE_CLAIM, area: 'awardPassportXP' }
  }
}

// ── Flavor memory ─────────────────────────────────────────────

export async function saveSmokeCraftFlavorMemory({ tenantId, venueId, guestId, sourceSessionId, tasteTags, tastingNotes, flavorProfileSource, dataQualityStatus }) {
  if (!await isDbAvailable()) return localFallback('saveSmokeCraftFlavorMemory')
  try {
    const result = await dbQuery(
      `INSERT INTO passport_360_smokecraft_flavor_memory
         (tenant_id, venue_id, guest_id, source_session_id, taste_tags_json, tasting_notes_json, flavor_profile_source, data_quality_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING flavor_memory_id, data_quality_status, created_at`,
      [
        tenantId || 'novee-default',
        venueId  || 'novee-grand-lounge',
        guestId,
        sourceSessionId        || null,
        JSON.stringify(tasteTags     || []),
        JSON.stringify(tastingNotes  || {}),
        flavorProfileSource    || 'not_collected',
        dataQualityStatus      || 'observe_confirm_only',
      ]
    )
    return { ok: true, backendConnected: true, persistenceMode: 'database', safeClaim: SAFE_CLAIM, flavorMemory: result.rows[0] }
  } catch (err) {
    return { ok: false, backendConnected: false, persistenceMode: 'local_fallback', error: err.message, safeClaim: SAFE_CLAIM, area: 'saveSmokeCraftFlavorMemory' }
  }
}

// ── Taste profile (alias: used in session complete) ───────────

export async function saveSmokeCraftTastingProfile(opts) {
  return saveSmokeCraftFlavorMemory(opts)
}

// ── Read: guest progress ──────────────────────────────────────

export async function getGuestPassportProgress({ guestId, moduleKey }) {
  if (!await isDbAvailable()) return localFallback('getGuestPassportProgress')
  try {
    const result = await dbQuery(
      `SELECT * FROM passport_360_guest_progress WHERE guest_id = $1 AND module_key = $2`,
      [guestId, moduleKey || 'smokecraft-360']
    )
    return { ok: true, backendConnected: true, persistenceMode: 'database', safeClaim: SAFE_CLAIM, progress: result.rows[0] || null }
  } catch (err) {
    return { ok: false, backendConnected: false, persistenceMode: 'local_fallback', error: err.message, safeClaim: SAFE_CLAIM, area: 'getGuestPassportProgress' }
  }
}

// ── Read: earned stamps ───────────────────────────────────────

export async function getGuestEarnedStamps({ guestId, moduleKey }) {
  if (!await isDbAvailable()) return localFallback('getGuestEarnedStamps')
  try {
    const result = await dbQuery(
      `SELECT * FROM passport_360_earned_stamps WHERE guest_id = $1 AND module_key = $2 ORDER BY earned_at ASC`,
      [guestId, moduleKey || 'smokecraft-360']
    )
    return { ok: true, backendConnected: true, persistenceMode: 'database', safeClaim: SAFE_CLAIM, stamps: result.rows }
  } catch (err) {
    return { ok: false, backendConnected: false, persistenceMode: 'local_fallback', error: err.message, safeClaim: SAFE_CLAIM, area: 'getGuestEarnedStamps' }
  }
}

// ── Read: badges ──────────────────────────────────────────────

export async function getGuestBadges({ guestId, moduleKey }) {
  if (!await isDbAvailable()) return localFallback('getGuestBadges')
  try {
    const result = await dbQuery(
      `SELECT * FROM passport_360_badges WHERE guest_id = $1 AND module_key = $2 ORDER BY earned_at ASC`,
      [guestId, moduleKey || 'smokecraft-360']
    )
    return { ok: true, backendConnected: true, persistenceMode: 'database', safeClaim: SAFE_CLAIM, badges: result.rows }
  } catch (err) {
    return { ok: false, backendConnected: false, persistenceMode: 'local_fallback', error: err.message, safeClaim: SAFE_CLAIM, area: 'getGuestBadges' }
  }
}

// ── Read: return visit progress ───────────────────────────────

export async function getReturnVisitProgress({ guestId, moduleKey }) {
  if (!await isDbAvailable()) return localFallback('getReturnVisitProgress')
  try {
    const result = await dbQuery(
      `SELECT return_visit_count, completed_sessions_count, last_session_key, last_completed_route, updated_at
       FROM passport_360_guest_progress WHERE guest_id = $1 AND module_key = $2`,
      [guestId, moduleKey || 'smokecraft-360']
    )
    const row = result.rows[0] || null
    return { ok: true, backendConnected: true, persistenceMode: 'database', safeClaim: SAFE_CLAIM, returnVisitCount: row?.return_visit_count || 0, lastSessionKey: row?.last_session_key || null, progress: row }
  } catch (err) {
    return { ok: false, backendConnected: false, persistenceMode: 'local_fallback', error: err.message, safeClaim: SAFE_CLAIM, area: 'getReturnVisitProgress' }
  }
}

// ── Audit log ─────────────────────────────────────────────────

export async function writePassportSyncAuditEvent({ tenantId, venueId, guestId, eventType, syncStatus, backendConnected, summary, metadata }) {
  if (!await isDbAvailable()) return { ok: false, backendConnected: false, notice: 'audit_skipped_no_db' }
  try {
    await dbQuery(
      `INSERT INTO passport_360_sync_audit_log (tenant_id, venue_id, guest_id, event_type, sync_status, backend_connected, summary, metadata_json)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        tenantId || 'novee-default',
        venueId  || 'novee-grand-lounge',
        guestId  || null,
        eventType,
        syncStatus       || 'ok',
        backendConnected || false,
        summary          || null,
        JSON.stringify(metadata || {}),
      ]
    )
    return { ok: true, backendConnected: true }
  } catch {
    return { ok: false, backendConnected: false, notice: 'audit_write_failed' }
  }
}

export async function getPassportAuditLog({ guestId, tenantId, limit = 50 }) {
  if (!await isDbAvailable()) return localFallback('getPassportAuditLog')
  try {
    const result = await dbQuery(
      `SELECT * FROM passport_360_sync_audit_log WHERE guest_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [guestId, Math.min(limit, 200)]
    )
    return { ok: true, backendConnected: true, persistenceMode: 'database', safeClaim: SAFE_CLAIM, auditLog: result.rows }
  } catch (err) {
    return { ok: false, backendConnected: false, persistenceMode: 'local_fallback', error: err.message, safeClaim: SAFE_CLAIM, area: 'getPassportAuditLog' }
  }
}
