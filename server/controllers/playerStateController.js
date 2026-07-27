/**
 * SmokeCraft canonical player-state — controllers.
 * Ownership (guest_reference/venue_id) is always taken from
 * req.smokecraftIdentity / req.validatedVenue (server-verified), never
 * trusted from the request body — matches the existing Management Sync
 * convention (managementSyncController.js).
 */
import { getPlayerState, completeSession, grantAward, getJourneySnapshot, saveJourneySnapshot, convertGuestToAccount, getLeaderboard, setLeaderboardPreference } from '../services/smokecraft/playerStateService.js'
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
    res.status(result.alreadyCompleted ? 200 : 201).json({
      success: true, alreadyCompleted: result.alreadyCompleted, completion: result.completion,
      badgesGranted: result.badgesGranted || [], passportStampGranted: result.passportStampGranted || null, rankPromotion: result.rankPromotion || null,
    })
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

export async function handleGetJourneySnapshot(req, res) {
  try {
    const guestReference = ownerGuestReference(req.smokecraftIdentity)
    const result = await getJourneySnapshot(guestReference)
    res.json({ success: true, snapshot: result.snapshot, version: result.version, updatedAt: result.updatedAt })
  } catch (err) {
    dbErrorResponse(res, err)
  }
}

export async function handleSaveJourneySnapshot(req, res) {
  const { snapshot, expectedVersion } = req.body || {}
  if (typeof snapshot !== 'object' || snapshot === null) {
    return res.status(400).json({ success: false, error: 'snapshot_object_required' })
  }
  if (typeof expectedVersion !== 'number' || expectedVersion < 0) {
    return res.status(400).json({ success: false, error: 'expected_version_required', message: 'Optimistic-concurrency save requires the version you last read (0 for a brand-new record).' })
  }
  try {
    const guestReference = ownerGuestReference(req.smokecraftIdentity)
    const result = await saveJourneySnapshot({ guestReference, venueId: req.smokecraftIdentity.venueId || null, snapshot, expectedVersion })
    if (result.conflict) {
      return res.status(409).json({ success: false, error: 'stale_version', current: result.current })
    }
    res.json({ success: true, current: result.current })
  } catch (err) {
    dbErrorResponse(res, err)
  }
}

/**
 * POST /api/smokecraft/player-state/convert-guest
 *
 * Requires BOTH a real authenticated account (req.user, via requireAuth
 * — a completely separate cookie/JWT from the guest identity) AND a
 * verified guest cookie (req.smokecraftGuestCookieIdentity, set by
 * attachSmokeCraftIdentity only when a valid smokecraft_guest_session
 * JWT was independently verified on THIS SAME request) — never a
 * client-submitted guest reference. This structurally proves the caller
 * actually controls both identities simultaneously, not merely claims
 * to.
 */
export async function handleGetLeaderboard(req, res) {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100)
  const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0)
  try {
    const entries = await getLeaderboard({ limit, offset, venueId: req.query.venueId || null })
    res.json({ success: true, entries, limit, offset })
  } catch (err) {
    dbErrorResponse(res, err)
  }
}

export async function handleSetLeaderboardPreference(req, res) {
  const { displayName, eligible } = req.body || {}
  if (displayName !== undefined && (typeof displayName !== 'string' || displayName.length > 40)) {
    return res.status(400).json({ success: false, error: 'invalid_display_name' })
  }
  if (eligible !== undefined && typeof eligible !== 'boolean') {
    return res.status(400).json({ success: false, error: 'invalid_eligible_flag' })
  }
  try {
    const guestReference = ownerGuestReference(req.smokecraftIdentity)
    await setLeaderboardPreference({ guestReference, displayName, eligible })
    res.json({ success: true })
  } catch (err) {
    dbErrorResponse(res, err)
  }
}

export async function handleConvertGuest(req, res) {
  const idempotencyKey = requireIdempotencyKey(req, res)
  if (!idempotencyKey) return
  if (!req.user || req.user.mode === 'prototype' || req.user.role !== 'passport_member') {
    return res.status(401).json({ success: false, error: 'account_required', message: 'Sign in to an account before converting guest progress.' })
  }
  if (!req.smokecraftGuestCookieIdentity) {
    return res.status(400).json({ success: false, error: 'no_guest_session', message: 'No verified guest session on this browser to convert.' })
  }
  try {
    const result = await convertGuestToAccount({
      guestReference: req.smokecraftGuestCookieIdentity,
      userReference: `user:${req.user.id}`,
      venueId: null,
      idempotencyKey,
      requestId: req.id || null,
      deviceId: req.body?.deviceId || null,
    })
    res.status(result.alreadyConverted ? 200 : 201).json({ success: true, alreadyConverted: result.alreadyConverted, conversion: result.conversion })
  } catch (err) {
    dbErrorResponse(res, err)
  }
}
