/**
 * SmokeCraft canonical player-state — controllers.
 * Ownership (guest_reference/venue_id) is always taken from
 * req.smokecraftIdentity / req.validatedVenue (server-verified), never
 * trusted from the request body — matches the existing Management Sync
 * convention (managementSyncController.js).
 */
import { getPlayerState, completeSession, grantAward, getJourneySnapshot, saveJourneySnapshot, convertGuestToAccount, getLeaderboard, setLeaderboardPreference, submitKnowledgeCheck, submitLeafChallenge, correctReward, submitBlendSelection, getTastingDraft, saveTastingDraft, submitTastingCompletion, submitCultivatorEvidence } from '../services/smokecraft/playerStateService.js'
import { submitTastingObservation, TastingObservationError } from '../services/smokecraft/tastingObservationService.js'
import { submitScorecardCompletion, ScorecardError } from '../services/smokecraft/scorecardEvaluationService.js'
import { submitSelectionAttempt, SelectionError } from '../services/smokecraft/selectionClassificationService.js'
import { getDb } from '../db/connection.js'

function ownerGuestReference(identity) {
  return identity.type === 'user' ? `user:${identity.id}` : identity.id
}

// Truth Gate — Session 2 hardening. A generic kebab-case slug shape guard
// for :activityKey on the tasting-draft routes. Not tied to any single
// hardcoded activity list (new tasting activities are added over time),
// but rejects anything that could not plausibly be a real activity key —
// empty, overlong, or containing characters no real activityKey ever
// uses — with a clear 400 instead of letting a malformed value reach the
// database as a query parameter.
const ACTIVITY_KEY_SLUG_RE = /^[a-z][a-z0-9-]{0,63}$/

function isValidActivityKeySlug(activityKey) {
  return typeof activityKey === 'string' && ACTIVITY_KEY_SLUG_RE.test(activityKey)
}

// Truth Gate — structured, secret-free server-side error logging for the
// Session 2 (tasting draft) read/write path specifically, since this is
// the exact endpoint the production incident traced to. One JSON line per
// failure with everything needed to diagnose it from Railway logs alone:
// request id, route, player-resolution status, session slug, a safe
// database error category (never the raw SQL error message/stack, which
// can include table/column names or fragments of query text).
function safeDbErrorCategory(err) {
  if (!err) return 'unknown'
  if (err.code === 'database_unavailable') return 'database_unavailable'
  if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') return 'connection_failure'
  if (typeof err.code === 'string' && /^[0-9A-Z]{5}$/.test(err.code)) return `postgres_${err.code}` // real Postgres SQLSTATE code, safe to expose (not a message)
  return 'unexpected_defect'
}

function logSession2Failure({ req, route, playerResolutionStatus, sessionSlug, err }) {
  console.error(JSON.stringify({
    event: 'session2_tasting_draft_error',
    requestId: req.id || req.headers['x-request-id'] || null,
    route,
    playerResolutionStatus,
    sessionSlug,
    dbErrorCategory: safeDbErrorCategory(err),
    ts: new Date().toISOString(),
  }))
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
    if (err.code === 'tasting_observation_required') {
      return res.status(400).json({ success: false, error: 'tasting_observation_required' })
    }
    if (err.code === 'scorecard_evidence_required') {
      return res.status(400).json({ success: false, error: 'scorecard_evidence_required' })
    }
    if (err.code === 'selection_evidence_required') {
      return res.status(400).json({ success: false, error: 'selection_evidence_required' })
    }
    if (err.code === 'passport_stamp_evidence_required') {
      return res.status(400).json({ success: false, error: 'passport_stamp_evidence_required' })
    }
    dbErrorResponse(res, err)
  }
}

/**
 * Required-Interaction Closure Package A — records real tasting-
 * observation evidence for Sessions 8/12/16 before their completion
 * call is allowed to succeed. See tastingObservationService.js.
 */
export async function handleSubmitTastingObservation(req, res) {
  const idempotencyKey = requireIdempotencyKey(req, res)
  if (!idempotencyKey) return
  const sessionId = req.params.sessionId
  const { notesSelected, personalNotes } = req.body || {}
  try {
    const guestReference = ownerGuestReference(req.smokecraftIdentity)
    const result = await submitTastingObservation({
      guestReference, venueId: req.smokecraftIdentity.venueId || null, sessionId,
      notesSelected, personalNotes, idempotencyKey,
      sourceRoute: req.body?.sourceRoute || null, requestId: req.id || null, deviceId: req.body?.deviceId || null,
    })
    res.status(result.alreadyRecorded ? 200 : 201).json({ success: true, alreadyRecorded: result.alreadyRecorded })
  } catch (err) {
    if (err instanceof TastingObservationError) {
      return res.status(400).json({ success: false, error: err.code })
    }
    dbErrorResponse(res, err)
  }
}

/**
 * Required-Interaction Closure Package B — records the real 6-category
 * scorecard rating for Session 19 as server-verified evidence (with a
 * server-computed weighted overall) before its completion call is
 * allowed to succeed. See scorecardEvaluationService.js.
 */
export async function handleSubmitScorecard(req, res) {
  const idempotencyKey = requireIdempotencyKey(req, res)
  if (!idempotencyKey) return
  const { categories, personalNotes, meta } = req.body || {}
  try {
    const guestReference = ownerGuestReference(req.smokecraftIdentity)
    const result = await submitScorecardCompletion({
      guestReference, venueId: req.smokecraftIdentity.venueId || null,
      categories, personalNotes, meta, idempotencyKey,
      sourceRoute: req.body?.sourceRoute || null, requestId: req.id || null, deviceId: req.body?.deviceId || null,
    })
    res.status(result.alreadyRecorded ? 200 : 201).json({ success: true, alreadyRecorded: result.alreadyRecorded, overall: result.overall })
  } catch (err) {
    if (err instanceof ScorecardError) {
      return res.status(400).json({ success: false, error: err.code })
    }
    dbErrorResponse(res, err)
  }
}

/**
 * Required-Interaction Closure Package C — records one selection/
 * sequencing/matching/hotspot attempt for Sessions 2/5/6/10. Every
 * attempt (correct or not) is audited; only a correct attempt records
 * winning evidence that completeSession() will require.
 */
export async function handleSubmitSelectionAttempt(req, res) {
  const idempotencyKey = requireIdempotencyKey(req, res)
  if (!idempotencyKey) return
  const sessionId = req.params.sessionId
  const { payload } = req.body || {}
  try {
    const guestReference = ownerGuestReference(req.smokecraftIdentity)
    const result = await submitSelectionAttempt({
      guestReference, venueId: req.smokecraftIdentity.venueId || null, sessionId,
      payload, idempotencyKey,
      sourceRoute: req.body?.sourceRoute || null, requestId: req.id || null, deviceId: req.body?.deviceId || null,
    })
    res.status(result.alreadyRecorded ? 200 : (result.correct ? 201 : 200)).json({ success: true, correct: result.correct, alreadyRecorded: result.alreadyRecorded })
  } catch (err) {
    if (err instanceof SelectionError) {
      return res.status(400).json({ success: false, error: err.code })
    }
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
    // Holistic Fix 5A-3H: the viewer's own identity (when present — this
    // route is public/no-login-required, so an identity may be absent) is
    // used only to mark isCurrentUser on a matching row server-side; it is
    // never itself included in the response payload.
    const viewerGuestReference = req.smokecraftIdentity ? ownerGuestReference(req.smokecraftIdentity) : null
    const entries = await getLeaderboard({ limit, offset, venueId: req.query.venueId || null, viewerGuestReference })
    res.json({ success: true, entries, limit, offset })
  } catch (err) {
    dbErrorResponse(res, err)
  }
}

export async function handleSetLeaderboardPreference(req, res) {
  const { displayName, eligible, venueId } = req.body || {}
  if (displayName !== undefined && (typeof displayName !== 'string' || displayName.length > 40)) {
    return res.status(400).json({ success: false, error: 'invalid_display_name' })
  }
  if (eligible !== undefined && typeof eligible !== 'boolean') {
    return res.status(400).json({ success: false, error: 'invalid_eligible_flag' })
  }
  if (venueId !== undefined && venueId !== null && (typeof venueId !== 'string' || venueId.length > 100)) {
    return res.status(400).json({ success: false, error: 'invalid_venue_id' })
  }
  try {
    const guestReference = ownerGuestReference(req.smokecraftIdentity)
    await setLeaderboardPreference({ guestReference, displayName, eligible, venueId })
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
    res.status(result.alreadyConverted ? 200 : 201).json({
      success: true, alreadyConverted: result.alreadyConverted, conversion: result.conversion,
      collectionsTransferred: result.collectionsTransferred || 0, collectionsMergedDuplicate: result.collectionsMergedDuplicate || 0,
      skillTreeEvidenceRowsTransferred: result.skillTreeEvidenceRowsTransferred || 0, skillTreeCompletedNodes: result.skillTreeCompletedNodes || 0,
      leaderboardPreferenceTransferred: result.leaderboardPreferenceTransferred || false,
      pairingSavesTransferred: result.pairingSavesTransferred || 0, pairingSavesMergedDuplicate: result.pairingSavesMergedDuplicate || 0,
      challengeStateTransferred: result.challengeStateTransferred || 0, challengeRewardsTransferred: result.challengeRewardsTransferred || 0,
      blendFaultAttemptsTransferred: result.blendFaultAttemptsTransferred || 0,
      goldenBoxEntriesTransferred: result.goldenBoxEntriesTransferred || 0,
    })
  } catch (err) {
    dbErrorResponse(res, err)
  }
}

/**
 * Holistic Fix 5A-2: the client submits raw per-question responses only
 * — never a score/correctness value. The server re-derives the score
 * from the real question data and is the sole authority for the XP
 * grant (see submitKnowledgeCheck in playerStateService.js).
 */
export async function handleSubmitKnowledgeCheck(req, res) {
  const idempotencyKey = requireIdempotencyKey(req, res)
  if (!idempotencyKey) return
  const moduleId = req.params.moduleId
  const responses = req.body?.responses
  const completionStepId = req.body?.completionStepId
  if (!responses || typeof responses !== 'object') {
    return res.status(400).json({ success: false, error: 'responses_required' })
  }
  try {
    const guestReference = ownerGuestReference(req.smokecraftIdentity)
    const result = await submitKnowledgeCheck({
      guestReference,
      venueId: req.smokecraftIdentity.venueId || null,
      moduleId, responses, completionStepId,
      idempotencyKey,
      sourceRoute: req.body?.sourceRoute || null,
      requestId: req.id || null,
      deviceId: req.body?.deviceId || null,
    })
    if (!result.ok) return res.status(400).json({ success: false, error: result.error })
    res.status(result.alreadyScored ? 200 : 201).json({
      success: true, alreadyScored: result.alreadyScored, score: result.score, total: result.total,
      xpAwarded: result.xpAwarded || 0, rankPromotion: result.rankPromotion || null,
    })
  } catch (err) {
    dbErrorResponse(res, err)
  }
}

/**
 * Holistic Fix 5A-2: the client submits the 5 raw leaf-id answers only —
 * never a score. The server scores against the real answer key and is
 * the sole authority for XP, the botanist/leaf-scholar badges, and the
 * leaf-recognition Passport stamp.
 */
export async function handleSubmitLeafChallenge(req, res) {
  const idempotencyKey = requireIdempotencyKey(req, res)
  if (!idempotencyKey) return
  const answers = req.body?.answers
  if (!Array.isArray(answers) || answers.length !== 5) {
    return res.status(400).json({ success: false, error: 'five_answers_required' })
  }
  try {
    const guestReference = ownerGuestReference(req.smokecraftIdentity)
    const result = await submitLeafChallenge({
      guestReference,
      venueId: req.smokecraftIdentity.venueId || null,
      answers,
      idempotencyKey,
      sourceRoute: req.body?.sourceRoute || null,
      requestId: req.id || null,
      deviceId: req.body?.deviceId || null,
    })
    res.status(result.alreadyScored ? 200 : 201).json({
      success: true, alreadyScored: result.alreadyScored, score: result.score, total: result.total,
      xpAwarded: result.xpAwarded || 0, badgesGranted: result.badgesGranted || [],
      passportStampGranted: result.passportStampGranted || null, rankPromotion: result.rankPromotion || null,
    })
  } catch (err) {
    dbErrorResponse(res, err)
  }
}

/**
 * Holistic Fix 5A-2: protected, staff-only reward correction/reversal.
 * Route is gated by requireStaff (see routes file) — never reachable by
 * an ordinary learner identity. Requires an explicit reason; the
 * authorized-by identity is taken from the server-verified staff
 * session, never the request body.
 */
export async function handleCorrectReward(req, res) {
  const idempotencyKey = requireIdempotencyKey(req, res)
  if (!idempotencyKey) return
  const { guestReference, correctionType, targetTable, targetId, targetAwardKey, deltaXp, reversed, reason } = req.body || {}
  if (!guestReference || typeof guestReference !== 'string') {
    return res.status(400).json({ success: false, error: 'guest_reference_required' })
  }
  if (!correctionType || !targetTable || !reason) {
    return res.status(400).json({ success: false, error: 'correction_type_target_table_and_reason_required' })
  }
  try {
    const result = await correctReward({
      guestReference, correctionType, targetTable, targetId: targetId || null, targetAwardKey: targetAwardKey || null,
      deltaXp: Number.isFinite(deltaXp) ? deltaXp : 0, reversed: reversed === true, reason, authorizedBy: req.user?.id || 'unknown-staff',
      idempotencyKey,
    })
    if (!result.ok) return res.status(400).json({ success: false, error: result.error })
    res.status(result.alreadyApplied ? 200 : 201).json({ success: true, alreadyApplied: result.alreadyApplied, correction: result.correction, rankPromotion: result.rankPromotion || null })
  } catch (err) {
    dbErrorResponse(res, err)
  }
}

/**
 * Holistic Fix 5A-3: closes the master-blend Passport stamp's previously
 * client-decided eligibility. The client submits its raw wrapper/binder/
 * filler selection (structured evidence) — the server independently
 * verifies it is a well-formed, complete selection before granting
 * anything.
 */
export async function handleSubmitBlend(req, res) {
  const idempotencyKey = requireIdempotencyKey(req, res)
  if (!idempotencyKey) return
  const { wrapperIndex, binderIndex, fillerIndices } = req.body || {}
  if (typeof wrapperIndex !== 'number' || typeof binderIndex !== 'number' || !Array.isArray(fillerIndices)) {
    return res.status(400).json({ success: false, error: 'wrapper_binder_filler_selection_required' })
  }
  try {
    const guestReference = ownerGuestReference(req.smokecraftIdentity)
    const result = await submitBlendSelection({
      guestReference, venueId: req.smokecraftIdentity.venueId || null,
      wrapperIndex, binderIndex, fillerIndices,
      idempotencyKey, sourceRoute: req.body?.sourceRoute || null, requestId: req.id || null, deviceId: req.body?.deviceId || null,
    })
    if (!result.ok) return res.status(400).json({ success: false, error: result.error })
    res.status(result.alreadyScored ? 200 : 201).json({
      success: true, alreadyScored: result.alreadyScored, xpAwarded: result.xpAwarded || 0,
      passportStampGranted: result.passportStampGranted || null, rankPromotion: result.rankPromotion || null,
    })
  } catch (err) {
    dbErrorResponse(res, err)
  }
}

/** Holistic Fix 5A-3D: server-authoritative tasting draft read/write + completion. */
export async function handleGetTastingDraft(req, res) {
  const sessionSlug = req.params.activityKey
  if (!isValidActivityKeySlug(sessionSlug)) {
    return res.status(400).json({ success: false, error: 'invalid_session_slug' })
  }
  if (!req.smokecraftIdentity) {
    logSession2Failure({ req, route: 'GET /tasting/:activityKey/draft', playerResolutionStatus: 'unresolved', sessionSlug, err: null })
    return res.status(401).json({ success: false, error: 'unauthenticated' })
  }
  try {
    const guestReference = ownerGuestReference(req.smokecraftIdentity)
    const result = await getTastingDraft({ guestReference, activityKey: sessionSlug })
    // No saved draft yet is NOT an error — getTastingDraft() already
    // returns a valid initialized draft ({}, version 0) for a brand-new
    // player, so this 200 covers both "existing draft" and "freshly
    // initialized draft" per the Truth Gate contract.
    res.json({ success: true, draftData: result.draftData, version: result.version, updatedAt: result.updatedAt })
  } catch (err) {
    logSession2Failure({ req, route: 'GET /tasting/:activityKey/draft', playerResolutionStatus: 'resolved', sessionSlug, err })
    dbErrorResponse(res, err)
  }
}

export async function handleSaveTastingDraft(req, res) {
  const sessionSlug = req.params.activityKey
  if (!isValidActivityKeySlug(sessionSlug)) {
    return res.status(400).json({ success: false, error: 'invalid_session_slug' })
  }
  const { draftData, expectedVersion } = req.body || {}
  if (typeof draftData !== 'object' || draftData === null) {
    return res.status(400).json({ success: false, error: 'draft_data_object_required' })
  }
  if (typeof expectedVersion !== 'number' || expectedVersion < 0) {
    return res.status(400).json({ success: false, error: 'expected_version_required' })
  }
  if (!req.smokecraftIdentity) {
    logSession2Failure({ req, route: 'PUT /tasting/:activityKey/draft', playerResolutionStatus: 'unresolved', sessionSlug, err: null })
    return res.status(401).json({ success: false, error: 'unauthenticated' })
  }
  try {
    // guestReference is always derived server-side from the verified
    // identity, never from the request body — this is what prevents
    // cross-player writes; saveTastingDraft() then upserts (ON CONFLICT)
    // scoped to (guest_reference, activity_key), so a save is idempotent
    // and safe to retry after a refresh.
    const guestReference = ownerGuestReference(req.smokecraftIdentity)
    const result = await saveTastingDraft({ guestReference, activityKey: sessionSlug, draftData, expectedVersion })
    if (result.ok === false) {
      const status = result.error === 'already_completed' ? 409 : 400
      return res.status(status).json({ success: false, error: result.error })
    }
    if (result.conflict) return res.status(409).json({ success: false, error: 'stale_version', current: result.current })
    res.json({ success: true, current: result.current })
  } catch (err) {
    logSession2Failure({ req, route: 'PUT /tasting/:activityKey/draft', playerResolutionStatus: 'resolved', sessionSlug, err })
    dbErrorResponse(res, err)
  }
}

export async function handleSubmitTasting(req, res) {
  const idempotencyKey = requireIdempotencyKey(req, res)
  if (!idempotencyKey) return
  const { selectedCigarId, compareIds } = req.body || {}
  try {
    const guestReference = ownerGuestReference(req.smokecraftIdentity)
    const result = await submitTastingCompletion({
      guestReference, venueId: req.smokecraftIdentity.venueId || null, activityKey: req.params.activityKey,
      selectedCigarId, compareIds,
      idempotencyKey, sourceRoute: req.body?.sourceRoute || null, requestId: req.id || null, deviceId: req.body?.deviceId || null,
    })
    if (!result.ok) return res.status(400).json({ success: false, error: result.error })
    res.status(result.alreadyCompleted ? 200 : 201).json({
      success: true, alreadyCompleted: result.alreadyCompleted, xpAwarded: result.xpAwarded || 0, rankPromotion: result.rankPromotion || null,
    })
  } catch (err) {
    dbErrorResponse(res, err)
  }
}

/**
 * Holistic Fix 5A-3E: closes the cultivator Passport stamp's previously
 * client-decided eligibility. The client submits its raw set of
 * viewed-stage ids as evidence — the server independently verifies it
 * covers all 7 real cultivation stages before granting anything.
 */
export async function handleSubmitCultivator(req, res) {
  const idempotencyKey = requireIdempotencyKey(req, res)
  if (!idempotencyKey) return
  const { viewedStageIds } = req.body || {}
  if (!Array.isArray(viewedStageIds)) {
    return res.status(400).json({ success: false, error: 'viewed_stage_ids_required' })
  }
  try {
    const guestReference = ownerGuestReference(req.smokecraftIdentity)
    const result = await submitCultivatorEvidence({
      guestReference, venueId: req.smokecraftIdentity.venueId || null, viewedStageIds,
      idempotencyKey, sourceRoute: req.body?.sourceRoute || null, requestId: req.id || null, deviceId: req.body?.deviceId || null,
    })
    if (!result.ok) return res.status(400).json({ success: false, error: result.error })
    res.status(result.alreadyScored ? 200 : 201).json({
      success: true, alreadyScored: result.alreadyScored, xpAwarded: result.xpAwarded || 0,
      passportStampGranted: result.passportStampGranted || null, rankPromotion: result.rankPromotion || null,
    })
  } catch (err) {
    dbErrorResponse(res, err)
  }
}
