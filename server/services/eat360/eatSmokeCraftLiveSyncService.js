/**
 * E.A.T. SmokeCraft Live Sync Service — Phase F.7
 *
 * Real database-backed sync for SmokeCraft → E.A.T. management activity.
 * Falls back to safe local-only responses when database is unavailable.
 * Never fakes backendConnected: true.
 */

const SAFE_CLAIM = 'eat_smokecraft_live_sync'

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
    syncStatus: 'fallback',
    persistenceMode: 'local_fallback',
    error: 'database_not_configured',
    safeClaim: SAFE_CLAIM,
    area,
    ...extra,
  }
}

// ── Health ────────────────────────────────────────────────────

export async function getEATSmokeCraftSyncHealth() {
  const available = await isDbAvailable()
  if (!available) {
    return {
      ok: true,
      backendConnected: false,
      syncStatus: 'not_connected',
      persistenceMode: 'local_fallback',
      safeClaim: SAFE_CLAIM,
      message: 'Database not configured. E.A.T. SmokeCraft sync running in local-fallback mode.',
    }
  }
  try {
    await dbQuery('SELECT 1')
    return {
      ok: true,
      backendConnected: true,
      syncStatus: 'connected',
      persistenceMode: 'database',
      safeClaim: SAFE_CLAIM,
    }
  } catch (err) {
    return {
      ok: false,
      backendConnected: false,
      syncStatus: 'error',
      persistenceMode: 'local_fallback',
      error: err.message,
      safeClaim: SAFE_CLAIM,
    }
  }
}

// ── Session sync ──────────────────────────────────────────────

export async function syncSmokeCraftSessionToEAT({
  tenantId, venueId, guestId, smokecraftSessionId, passportSessionId,
  sessionStatus, completedRoute, completedSteps, xpSummary, stampSummary,
  tasteProfile,
}) {
  if (!await isDbAvailable()) return localFallback('syncSmokeCraftSessionToEAT')
  try {
    const result = await dbQuery(
      `INSERT INTO eat_smokecraft_session_sync
         (tenant_id, venue_id, guest_id, smokecraft_session_id, passport_session_id,
          session_status, completed_route, completed_steps_json, xp_summary_json,
          stamp_summary_json, taste_profile_json, sync_status, backend_connected)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'ok',true)
       RETURNING sync_id, session_status, sync_status, created_at`,
      [
        tenantId || 'novee-default',
        venueId  || 'novee-grand-lounge',
        guestId  || null,
        smokecraftSessionId || null,
        passportSessionId   || null,
        sessionStatus       || 'completed',
        completedRoute      || null,
        JSON.stringify(completedSteps || []),
        JSON.stringify(xpSummary     || {}),
        JSON.stringify(stampSummary  || []),
        JSON.stringify(tasteProfile  || {}),
      ]
    )
    return {
      ok: true, backendConnected: true, syncStatus: 'ok',
      persistenceMode: 'database', safeClaim: SAFE_CLAIM,
      sync: result.rows[0],
    }
  } catch (err) {
    return { ok: false, backendConnected: false, syncStatus: 'failed', persistenceMode: 'local_fallback', error: err.message, safeClaim: SAFE_CLAIM, area: 'syncSmokeCraftSessionToEAT' }
  }
}

// ── Guest activity ────────────────────────────────────────────

export async function recordSmokeCraftGuestActivity({
  tenantId, venueId, guestId, smokecraftSessionId, activityType,
  activitySummary, flavorTags, loyaltySignal, vipSignal, managerVisibility,
}) {
  if (!await isDbAvailable()) return localFallback('recordSmokeCraftGuestActivity')
  try {
    const result = await dbQuery(
      `INSERT INTO eat_smokecraft_guest_activity
         (tenant_id, venue_id, guest_id, smokecraft_session_id, activity_type,
          activity_summary, flavor_tags_json, loyalty_signal, vip_signal, manager_visibility)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING activity_id, activity_type, created_at`,
      [
        tenantId || 'novee-default',
        venueId  || 'novee-grand-lounge',
        guestId  || null,
        smokecraftSessionId || null,
        activityType,
        activitySummary     || null,
        JSON.stringify(flavorTags || []),
        loyaltySignal       || 'none',
        vipSignal           || false,
        managerVisibility   !== false,
      ]
    )
    return {
      ok: true, backendConnected: true, syncStatus: 'ok',
      persistenceMode: 'database', safeClaim: SAFE_CLAIM,
      activity: result.rows[0],
    }
  } catch (err) {
    return { ok: false, backendConnected: false, syncStatus: 'failed', persistenceMode: 'local_fallback', error: err.message, safeClaim: SAFE_CLAIM, area: 'recordSmokeCraftGuestActivity' }
  }
}

// ── Handoff queue ─────────────────────────────────────────────

export async function createSmokeCraftHandoffQueueItem({
  tenantId, venueId, guestId, smokecraftSessionId, handoffType,
  targetSystem, handoffPayload, staffActionRequired,
}) {
  if (!await isDbAvailable()) return localFallback('createSmokeCraftHandoffQueueItem')
  try {
    const result = await dbQuery(
      `INSERT INTO eat_smokecraft_handoff_queue
         (tenant_id, venue_id, guest_id, smokecraft_session_id, handoff_type,
          target_system, handoff_payload_json, staff_action_required, backend_connected)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true)
       RETURNING handoff_id, handoff_type, handoff_status, created_at`,
      [
        tenantId || 'novee-default',
        venueId  || 'novee-grand-lounge',
        guestId  || null,
        smokecraftSessionId || null,
        handoffType         || 'pos360_preview',
        targetSystem        || 'pos360',
        JSON.stringify(handoffPayload || {}),
        staffActionRequired !== false,
      ]
    )
    return {
      ok: true, backendConnected: true, syncStatus: 'ok',
      persistenceMode: 'database', safeClaim: SAFE_CLAIM,
      handoff: result.rows[0],
    }
  } catch (err) {
    return { ok: false, backendConnected: false, syncStatus: 'failed', persistenceMode: 'local_fallback', error: err.message, safeClaim: SAFE_CLAIM, area: 'createSmokeCraftHandoffQueueItem' }
  }
}

// ── Manager alert ─────────────────────────────────────────────

export async function createSmokeCraftManagerAlert({
  tenantId, venueId, guestId, smokecraftSessionId, alertType, alertPriority, alertMessage,
}) {
  if (!await isDbAvailable()) return localFallback('createSmokeCraftManagerAlert')
  try {
    const result = await dbQuery(
      `INSERT INTO eat_smokecraft_manager_alerts
         (tenant_id, venue_id, guest_id, smokecraft_session_id, alert_type, alert_priority, alert_message)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING alert_id, alert_type, alert_priority, created_at`,
      [
        tenantId || 'novee-default',
        venueId  || 'novee-grand-lounge',
        guestId  || null,
        smokecraftSessionId || null,
        alertType,
        alertPriority || 'normal',
        alertMessage  || null,
      ]
    )
    return {
      ok: true, backendConnected: true, syncStatus: 'ok',
      persistenceMode: 'database', safeClaim: SAFE_CLAIM,
      alert: result.rows[0],
    }
  } catch (err) {
    return { ok: false, backendConnected: false, syncStatus: 'failed', persistenceMode: 'local_fallback', error: err.message, safeClaim: SAFE_CLAIM, area: 'createSmokeCraftManagerAlert' }
  }
}

// ── Inventory signal ──────────────────────────────────────────

export async function createSmokeCraftInventorySignal({
  tenantId, venueId, smokecraftSessionId, cigarReference,
  menuItemReference, inventorySignalType, quantitySignal, reorderSignal,
}) {
  if (!await isDbAvailable()) return localFallback('createSmokeCraftInventorySignal')
  try {
    const result = await dbQuery(
      `INSERT INTO eat_smokecraft_inventory_signals
         (tenant_id, venue_id, smokecraft_session_id, cigar_reference, menu_item_reference,
          inventory_signal_type, quantity_signal, reorder_signal)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING signal_id, inventory_signal_type, signal_status, created_at`,
      [
        tenantId || 'novee-default',
        venueId  || 'novee-grand-lounge',
        smokecraftSessionId   || null,
        cigarReference        || null,
        menuItemReference     || null,
        inventorySignalType   || 'interest',
        quantitySignal        || null,
        reorderSignal         || false,
      ]
    )
    return {
      ok: true, backendConnected: true, syncStatus: 'ok',
      persistenceMode: 'database', safeClaim: SAFE_CLAIM,
      signal: result.rows[0],
    }
  } catch (err) {
    return { ok: false, backendConnected: false, syncStatus: 'failed', persistenceMode: 'local_fallback', error: err.message, safeClaim: SAFE_CLAIM, area: 'createSmokeCraftInventorySignal' }
  }
}

// ── Read: session sync status ─────────────────────────────────

export async function getSmokeCraftSessionSyncStatus({ sessionId }) {
  if (!await isDbAvailable()) return localFallback('getSmokeCraftSessionSyncStatus')
  try {
    const result = await dbQuery(
      `SELECT * FROM eat_smokecraft_session_sync WHERE smokecraft_session_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [sessionId]
    )
    return {
      ok: true, backendConnected: true, syncStatus: 'ok',
      persistenceMode: 'database', safeClaim: SAFE_CLAIM,
      sync: result.rows[0] || null,
    }
  } catch (err) {
    return { ok: false, backendConnected: false, syncStatus: 'failed', persistenceMode: 'local_fallback', error: err.message, safeClaim: SAFE_CLAIM, area: 'getSmokeCraftSessionSyncStatus' }
  }
}

// ── Read: guest activity ──────────────────────────────────────

export async function getSmokeCraftGuestActivity({ guestId, limit = 20 }) {
  if (!await isDbAvailable()) return localFallback('getSmokeCraftGuestActivity')
  try {
    const result = await dbQuery(
      `SELECT * FROM eat_smokecraft_guest_activity WHERE guest_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [guestId, Math.min(limit, 100)]
    )
    return {
      ok: true, backendConnected: true, syncStatus: 'ok',
      persistenceMode: 'database', safeClaim: SAFE_CLAIM,
      activities: result.rows,
    }
  } catch (err) {
    return { ok: false, backendConnected: false, syncStatus: 'failed', persistenceMode: 'local_fallback', error: err.message, safeClaim: SAFE_CLAIM, area: 'getSmokeCraftGuestActivity' }
  }
}

// ── Read: handoff queue ───────────────────────────────────────

export async function getSmokeCraftHandoffQueue({ venueId, status }) {
  if (!await isDbAvailable()) return localFallback('getSmokeCraftHandoffQueue')
  try {
    const result = await dbQuery(
      `SELECT * FROM eat_smokecraft_handoff_queue WHERE venue_id = $1${status ? ' AND handoff_status = $2' : ''} ORDER BY created_at DESC LIMIT 50`,
      status ? [venueId || 'novee-grand-lounge', status] : [venueId || 'novee-grand-lounge']
    )
    return {
      ok: true, backendConnected: true, syncStatus: 'ok',
      persistenceMode: 'database', safeClaim: SAFE_CLAIM,
      handoffs: result.rows,
    }
  } catch (err) {
    return { ok: false, backendConnected: false, syncStatus: 'failed', persistenceMode: 'local_fallback', error: err.message, safeClaim: SAFE_CLAIM, area: 'getSmokeCraftHandoffQueue' }
  }
}

// ── Read: manager alerts ──────────────────────────────────────

export async function getSmokeCraftManagerAlerts({ venueId, resolved }) {
  if (!await isDbAvailable()) return localFallback('getSmokeCraftManagerAlerts')
  try {
    const params = [venueId || 'novee-grand-lounge']
    const resolvedClause = resolved !== undefined ? ` AND resolved = $2` : ''
    if (resolved !== undefined) params.push(resolved)
    const result = await dbQuery(
      `SELECT * FROM eat_smokecraft_manager_alerts WHERE venue_id = $1${resolvedClause} ORDER BY created_at DESC LIMIT 50`,
      params
    )
    return {
      ok: true, backendConnected: true, syncStatus: 'ok',
      persistenceMode: 'database', safeClaim: SAFE_CLAIM,
      alerts: result.rows,
    }
  } catch (err) {
    return { ok: false, backendConnected: false, syncStatus: 'failed', persistenceMode: 'local_fallback', error: err.message, safeClaim: SAFE_CLAIM, area: 'getSmokeCraftManagerAlerts' }
  }
}

// ── Read: inventory signals ───────────────────────────────────

export async function getSmokeCraftInventorySignals({ venueId, status }) {
  if (!await isDbAvailable()) return localFallback('getSmokeCraftInventorySignals')
  try {
    const params = [venueId || 'novee-grand-lounge']
    const statusClause = status ? ' AND signal_status = $2' : ''
    if (status) params.push(status)
    const result = await dbQuery(
      `SELECT * FROM eat_smokecraft_inventory_signals WHERE venue_id = $1${statusClause} ORDER BY created_at DESC LIMIT 50`,
      params
    )
    return {
      ok: true, backendConnected: true, syncStatus: 'ok',
      persistenceMode: 'database', safeClaim: SAFE_CLAIM,
      signals: result.rows,
    }
  } catch (err) {
    return { ok: false, backendConnected: false, syncStatus: 'failed', persistenceMode: 'local_fallback', error: err.message, safeClaim: SAFE_CLAIM, area: 'getSmokeCraftInventorySignals' }
  }
}

// ── Audit log ─────────────────────────────────────────────────

export async function writeEATSmokeCraftSyncAuditEvent({
  tenantId, venueId, guestId, eventType, syncStatus, backendConnected, summary, metadata,
}) {
  if (!await isDbAvailable()) return { ok: false, backendConnected: false, notice: 'audit_skipped_no_db' }
  try {
    await dbQuery(
      `INSERT INTO eat_smokecraft_sync_audit_log
         (tenant_id, venue_id, guest_id, event_type, sync_status, backend_connected, summary, metadata_json)
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

export async function getEATSmokeCraftAuditLog({ guestId, venueId, limit = 50 }) {
  if (!await isDbAvailable()) return localFallback('getEATSmokeCraftAuditLog')
  try {
    const result = await dbQuery(
      `SELECT * FROM eat_smokecraft_sync_audit_log WHERE guest_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [guestId, Math.min(limit, 200)]
    )
    return {
      ok: true, backendConnected: true, syncStatus: 'ok',
      persistenceMode: 'database', safeClaim: SAFE_CLAIM,
      auditLog: result.rows,
    }
  } catch (err) {
    return { ok: false, backendConnected: false, syncStatus: 'failed', persistenceMode: 'local_fallback', error: err.message, safeClaim: SAFE_CLAIM, area: 'getEATSmokeCraftAuditLog' }
  }
}
