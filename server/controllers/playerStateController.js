/**
 * SmokeCraft canonical player-state — controllers.
 * Ownership (guest_reference/venue_id) is always taken from
 * req.smokecraftIdentity / req.validatedVenue (server-verified), never
 * trusted from the request body — matches the existing Management Sync
 * convention (managementSyncController.js).
 */
import { getPlayerState, completeSession, grantAward } from '../services/smokecraft/playerStateService.js'
import { getDb } from '../db/connection.js'

function ownerGuestReference(identity) {
  return identity.type === 'user' ? `user:${identity.id}` : identity.id
}

function dbErrorResponse(res, err) {
  if (err.code === 'database_unavailable') return res.status(503).json({ success: false, error: 'database_unavailable' })
  return res.status(500).json({ success: false, error: 'internal_error' })
}

function requireIdempotencyKey(req, res) {
  const key = req.body?.idempotencyKey
  if (!key || typeof key !== 'string' || key.length < 8) {
    res.status(400).json({ success: false, error: 'idempotency_key_required', message: 'A client-generated idempotencyKey (>= 8 chars) is required for this mutation.' })
    return null
  }
  return key
}

/**
 * Observability endpoint (mandate Task 12): database connectivity + the
 * two migrations this feature depends on. Never exposes secrets or
 * connection strings — only booleans and migration filenames.
 */
export async function handleHealth(req, res) {
  const db = getDb()
  if (!db) return res.json({ success: true, dbConnected: false, migrationsApplied: [] })
  try {
    const result = await db.query(
      `SELECT filename FROM schema_migrations WHERE filename IN ($1, $2) ORDER BY filename`,
      ['092_smokecraft_canonical_player_state.sql', '093_smokecraft_player_state_idempotency_key_guest_scope.sql']
    )
    res.json({ success: true, dbConnected: true, migrationsApplied: result.rows.map(r => r.filename) })
  } catch (err) {
    res.status(503).json({ success: false, dbConnected: false, error: 'health_check_failed' })
  }
}

export async function handleGetPlayerState(req, res) {
  try {
    const guestReference = ownerGuestReference(req.smokecraftIdentity)
    const state = await getPlayerState(guestReference)
    res.json({ success: true, state })
  } catch (err) {
    dbErrorResponse(res, err)
  }
}

export async function handleCompleteSession(req, res) {
  const idempotencyKey = requireIdempotencyKey(req, res)
  if (!idempotencyKey) return
  const sessionId = req.params.sessionId
  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ success: false, error: 'invalid_session_id' })
  }
  // xpAwarded comes from the server's own reward table, never the client
  // body — the client may only ever request "complete this session",
  // never dictate how much XP that's worth.
  const { getSessionRewardXp } = await import('../services/smokecraft/sessionRewardTable.js')
  const xpAwarded = getSessionRewardXp(sessionId)
  try {
    const guestReference = ownerGuestReference(req.smokecraftIdentity)
    const result = await completeSession({
      guestReference,
      venueId: req.smokecraftIdentity.venueId || null,
      sessionId,
      xpAwarded,
      idempotencyKey,
      sourceRoute: req.body?.sourceRoute || null,
      requestId: req.id || null,
      deviceId: req.body?.deviceId || null,
    })
    res.status(result.alreadyCompleted ? 200 : 201).json({ success: true, alreadyCompleted: result.alreadyCompleted, completion: result.completion })
  } catch (err) {
    dbErrorResponse(res, err)
  }
}

async function handleAward(req, res, awardType, amountFromClient) {
  const idempotencyKey = requireIdempotencyKey(req, res)
  if (!idempotencyKey) return
  const awardKey = req.body?.awardKey
  if (!awardKey || typeof awardKey !== 'string') {
    return res.status(400).json({ success: false, error: 'award_key_required' })
  }
  try {
    const guestReference = ownerGuestReference(req.smokecraftIdentity)
    const result = await grantAward({
      guestReference,
      venueId: req.smokecraftIdentity.venueId || null,
      awardType,
      awardKey,
      amount: amountFromClient,
      idempotencyKey,
      sourceRoute: req.body?.sourceRoute || null,
      requestId: req.id || null,
      deviceId: req.body?.deviceId || null,
    })
    res.status(result.alreadyAwarded ? 200 : 201).json({ success: true, alreadyAwarded: result.alreadyAwarded, award: result.award })
  } catch (err) {
    dbErrorResponse(res, err)
  }
}

export async function handleAwardXp(req, res) {
  // XP amount for a named, server-known source is validated against the
  // same server-owned reward table as session completion — no
  // client-controlled XP amount, per the mandate's explicit security
  // requirement ("no client-controlled XP or awards").
  const { getNamedXpAmount } = await import('../services/smokecraft/sessionRewardTable.js')
  const amount = getNamedXpAmount(req.body?.awardKey)
  if (amount === null) return res.status(400).json({ success: false, error: 'unknown_xp_source' })
  return handleAward(req, res, 'xp', amount)
}

export async function handleAwardBadge(req, res) {
  return handleAward(req, res, 'badge', 0)
}

export async function handleAwardPassportStamp(req, res) {
  return handleAward(req, res, 'passport_stamp', 0)
}
