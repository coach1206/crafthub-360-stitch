/**
 * SmokeCraft Canonical Player State — Holistic Fix 4.
 *
 * Server-authoritative session completion + award (XP/badge/Passport
 * stamp) mutations, backed by migration 092
 * (smokecraft_player_state / smokecraft_session_completions /
 * smokecraft_awards / smokecraft_award_audit).
 *
 * Idempotency model (two independent layers, both enforced by real
 * database UNIQUE constraints, not application-level checks alone):
 *   1. idempotency_key UNIQUE on the mutation table — protects against
 *      exact request replay (same client request retried/duplicated:
 *      double-click, network retry, two tabs racing the same click).
 *   2. (guest_reference, session_id) / (guest_reference, award_type,
 *      award_key) UNIQUE — protects against two *logically identical*
 *      awards issued under two different idempotency keys (e.g. a
 *      client bug that generates a fresh key per request instead of
 *      reusing one).
 * Both layers raise a Postgres unique_violation (23505), which this
 * service catches and turns into a `duplicate_replay` result rather
 * than an error — the caller (route/controller) always gets a
 * well-formed response, never a 500 for a legitimate duplicate.
 *
 * Follows the exact transactional pattern already established in
 * managementSync/journeyService.js (BEGIN/COMMIT/ROLLBACK with
 * client.release() in finally), reusing its ownerGuestReference()
 * convention (`user:${id}` for an authenticated account, raw
 * cookie-issued id for a guest) so this composes with the existing
 * ensureSmokeCraftGuestIdentity middleware without modification.
 */
import { getDb } from '../../db/connection.js'
import { recalculate as recalculateSkillTree } from './skillTreeService.js'
import { transferSavedPairings } from './pairingEngineService.js'
import { getSessionBadgeIds, getRankForXp } from './sessionRewardTable.js'
import { KNOWLEDGE_CHECK_SETS } from '../../../src/data/knowledgeCheckQuestions.js'
import { scoreQuestionSet } from '../../../src/utils/smokecraftQuizScoring.js'
import { scoreLeafChallenge } from '../../../src/data/leafChallengeRounds.js'
import { getSampleInventory, VENUE_ID as DEFAULT_TASTING_VENUE_ID } from '../../../src/data/venueInventoryData.js'
import { CULTIVATION_STAGE_IDS } from '../../../src/data/cultivationStages.js'
import { hasTastingObservationEvidence, validateTastingDraftPayload, TASTING_OBSERVATION_SESSIONS } from './tastingObservationService.js'
import { hasScorecardEvidence, validateScorecardDraftPayload } from './scorecardEvaluationService.js'
import { hasSelectionEvidence, validateSelectionDraftPayload, PACKAGE_C_SESSIONS } from './selectionClassificationService.js'

const UNIQUE_VIOLATION = '23505'
const STALE_VERSION = 'stale_version'

// Holistic Fix 5A: session id -> Passport stamp id, for the one
// curriculum session whose completion is also a Passport-stamp
// criterion (SESSION_REWARDS['session-complete'].unlockSignal ===
// 'journey-complete', matching the existing awardStamp('journey-
// complete', 'session-complete') call in SessionComplete.jsx — this
// server-side table makes that same criterion authoritative instead of
// only client-decided).
const SESSION_PASSPORT_STAMPS = {
  'session-complete': 'journey-complete',
}

/** Server-side, transaction-scoped: grants every badge tied to a
 * session's completion, idempotent via ON CONFLICT DO NOTHING (the
 * existing (guest_reference, award_type, award_key) UNIQUE index). */
async function grantSessionBadgesInTx(client, guestReference, sessionId, completionIdempotencyKey, requestId, deviceId) {
  const badgeIds = getSessionBadgeIds(sessionId)
  const granted = []
  for (const badgeId of badgeIds) {
    const result = await client.query(
      `INSERT INTO smokecraft_awards (guest_reference, award_type, award_key, amount, idempotency_key, source_route, request_id, device_id)
       VALUES ($1, 'badge', $2, 0, $3, $4, $5, $6)
       ON CONFLICT (guest_reference, award_type, award_key) DO NOTHING
       RETURNING *`,
      [guestReference, badgeId, `${completionIdempotencyKey}:badge:${badgeId}`, sessionId, requestId || null, deviceId || null]
    )
    if (result.rows.length > 0) granted.push(result.rows[0])
  }
  return granted
}

/** Server-side, transaction-scoped: grants the Passport stamp tied to a
 * session's completion, if any, idempotent the same way as badges. */
async function grantSessionPassportStampInTx(client, guestReference, sessionId, completionIdempotencyKey, requestId, deviceId) {
  const stampId = SESSION_PASSPORT_STAMPS[sessionId]
  if (!stampId) return null
  const result = await client.query(
    `INSERT INTO smokecraft_awards (guest_reference, award_type, award_key, amount, idempotency_key, source_route, request_id, device_id)
     VALUES ($1, 'passport_stamp', $2, 0, $3, $4, $5, $6)
     ON CONFLICT (guest_reference, award_type, award_key) DO NOTHING
     RETURNING *`,
    [guestReference, stampId, `${completionIdempotencyKey}:stamp:${stampId}`, sessionId, requestId || null, deviceId || null]
  )
  return result.rows[0] || null
}

/** Server-side, transaction-scoped: recomputes rank from the guest's
 * CURRENT xp_total (post-update) and records a promotion event if it
 * changed. Idempotent via UNIQUE(guest_reference, rank_label) — a
 * promotion to a given rank is only ever recorded once, even if this
 * function runs again after the guest's XP later drops (no automatic
 * demotion is ever applied — matches the mandate's "no automatic
 * demotion unless an approved reversal requires it"). */
async function recomputeRankInTx(client, guestReference) {
  const stateResult = await client.query(`SELECT xp_total, rank_label FROM smokecraft_player_state WHERE guest_reference = $1`, [guestReference])
  const state = stateResult.rows[0]
  if (!state) return null
  const newRank = getRankForXp(state.xp_total)
  if (newRank === state.rank_label) return null
  await client.query(`UPDATE smokecraft_player_state SET rank_label = $2, updated_at = now() WHERE guest_reference = $1`, [guestReference, newRank])
  const inserted = await client.query(
    `INSERT INTO smokecraft_rank_history (guest_reference, rank_label, xp_at_promotion)
     VALUES ($1, $2, $3)
     ON CONFLICT (guest_reference, rank_label) DO NOTHING
     RETURNING *`,
    [guestReference, newRank, state.xp_total]
  )
  return inserted.rows[0] || null
}

async function recordAudit(client, { guestReference, mutationType, idempotencyKey, outcome, rejectReason, requestId, deviceId }) {
  await client.query(
    `INSERT INTO smokecraft_award_audit
       (guest_reference, mutation_type, idempotency_key, outcome, reject_reason, request_id, device_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [guestReference, mutationType, idempotencyKey, outcome, rejectReason || null, requestId || null, deviceId || null]
  )
}

export async function ensurePlayerStateRow(client, guestReference, venueId) {
  await client.query(
    `INSERT INTO smokecraft_player_state (guest_reference, venue_id)
     VALUES ($1, $2)
     ON CONFLICT (guest_reference) DO NOTHING`,
    [guestReference, venueId || null]
  )
}

function dbOrThrow() {
  const db = getDb()
  if (!db) throw Object.assign(new Error('database_unavailable'), { code: 'database_unavailable' })
  return db
}

/**
 * Loads the full authoritative player state: root record, all session
 * completions, and all awards (XP/badges/Passport stamps). Never returns
 * a fabricated/default state — a guest with no record yet gets an
 * honest empty shape (xpTotal 0, no completions, no awards), never a
 * pre-populated fake one.
 */
export async function getPlayerState(guestReference) {
  const db = dbOrThrow()
  const [rootResult, completionsResult, awardsResult] = await Promise.all([
    db.query(`SELECT * FROM smokecraft_player_state WHERE guest_reference = $1`, [guestReference]),
    db.query(`SELECT session_id, xp_awarded, completed_at, source_route FROM smokecraft_session_completions WHERE guest_reference = $1 ORDER BY completed_at ASC`, [guestReference]),
    db.query(`SELECT award_type, award_key, amount, created_at FROM smokecraft_awards WHERE guest_reference = $1 ORDER BY created_at ASC`, [guestReference]),
  ])
  const root = rootResult.rows[0] || null
  return {
    guestReference,
    xpTotal: root?.xp_total ?? 0,
    rankLabel: root?.rank_label ?? null,
    lastSyncedAt: root?.last_synced_at ?? null,
    schemaVersion: root?.schema_version ?? 1,
    completedSessions: completionsResult.rows.map(r => ({ sessionId: r.session_id, xpAwarded: r.xp_awarded, completedAt: r.completed_at, sourceRoute: r.source_route })),
    awards: awardsResult.rows.map(r => ({ type: r.award_type, key: r.award_key, amount: r.amount, createdAt: r.created_at })),
  }
}

/**
 * Marks a curriculum session complete and (optionally, atomically)
 * awards XP for it in the same transaction — idempotent per
 * (guest_reference, session_id) AND per idempotency_key.
 */
export async function completeSession({ guestReference, venueId, sessionId, xpAwarded = 0, idempotencyKey, sourceRoute, requestId, deviceId }) {
  // Required-Interaction Closure Package A: for Sessions 8/12/16
  // (first-third/second-third/final-third) only, completion requires
  // real, server-recorded tasting-observation evidence first — a
  // player cannot complete these three sessions merely by opening the
  // route and clicking Continue. Every other session is unaffected
  // (hasTastingObservationEvidence returns true immediately for any
  // sessionId outside this package's scope).
  const hasEvidence = await hasTastingObservationEvidence(guestReference, sessionId)
  if (!hasEvidence) {
    const err = new Error('tasting_observation_required')
    err.code = 'tasting_observation_required'
    throw err
  }
  // Required-Interaction Closure Package B: 'scorecard' (Session 19)
  // completion requires a real, complete, server-recorded scorecard
  // first — same additive gate pattern as Package A, scoped only to
  // this one sessionId.
  const hasScorecard = await hasScorecardEvidence(guestReference, sessionId)
  if (!hasScorecard) {
    const err = new Error('scorecard_evidence_required')
    err.code = 'scorecard_evidence_required'
    throw err
  }
  // Required-Interaction Closure Package C: Sessions 2/5/6/10 completion
  // requires a real, CORRECT, server-recorded attempt first — same
  // additive gate pattern as Packages A/B, scoped only to these 4
  // sessionIds.
  const hasSelection = await hasSelectionEvidence(guestReference, sessionId)
  if (!hasSelection) {
    const err = new Error('selection_evidence_required')
    err.code = 'selection_evidence_required'
    throw err
  }

  const db = dbOrThrow()
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    await ensurePlayerStateRow(client, guestReference, venueId)

    const existing = await client.query(
      `SELECT * FROM smokecraft_session_completions WHERE guest_reference = $1 AND session_id = $2`,
      [guestReference, sessionId]
    )
    if (existing.rows.length > 0) {
      await recordAudit(client, { guestReference, mutationType: 'session_complete', idempotencyKey, outcome: 'duplicate_replay', requestId, deviceId })
      await client.query('COMMIT')
      return { ok: true, alreadyCompleted: true, completion: existing.rows[0] }
    }

    let completion
    try {
      const inserted = await client.query(
        `INSERT INTO smokecraft_session_completions
           (guest_reference, session_id, idempotency_key, xp_awarded, source_route, request_id, device_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [guestReference, sessionId, idempotencyKey, xpAwarded, sourceRoute || null, requestId || null, deviceId || null]
      )
      completion = inserted.rows[0]
    } catch (err) {
      if (err.code === UNIQUE_VIOLATION) {
        // Postgres aborts the whole transaction on any error — no further
        // command (including a lookup SELECT) can run on this client
        // until ROLLBACK. Roll back first, then look up the row that won
        // the race using a fresh, non-transactional read.
        await client.query('ROLLBACK').catch(() => {})
        const dup = await db.query(`SELECT * FROM smokecraft_session_completions WHERE guest_reference = $1 AND session_id = $2`, [guestReference, sessionId])
        await db.query(
          `INSERT INTO smokecraft_award_audit (guest_reference, mutation_type, idempotency_key, outcome, request_id, device_id) VALUES ($1, $2, $3, 'duplicate_replay', $4, $5)`,
          [guestReference, 'session_complete', idempotencyKey, requestId || null, deviceId || null]
        )
        return { ok: true, alreadyCompleted: true, completion: dup.rows[0] }
      }
      throw err
    }

    if (xpAwarded > 0) {
      await client.query(
        `UPDATE smokecraft_player_state SET xp_total = xp_total + $2, last_synced_at = now(), updated_at = now() WHERE guest_reference = $1`,
        [guestReference, xpAwarded]
      )
    }

    // Holistic Fix 5A: badges, the tied Passport stamp (if any), and a
    // rank recompute all happen automatically, server-side, in this
    // SAME atomic transaction as the completion itself — the client
    // never separately claims any of these.
    const badgesGranted = await grantSessionBadgesInTx(client, guestReference, sessionId, idempotencyKey, requestId, deviceId)
    const passportStampGranted = await grantSessionPassportStampInTx(client, guestReference, sessionId, idempotencyKey, requestId, deviceId)
    const rankPromotion = await recomputeRankInTx(client, guestReference)

    await recordAudit(client, { guestReference, mutationType: 'session_complete', idempotencyKey, outcome: 'applied', requestId, deviceId })
    await client.query('COMMIT')
    return { ok: true, alreadyCompleted: false, completion, badgesGranted, passportStampGranted, rankPromotion }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

/**
 * Generic idempotent award mutation, shared by XP/badge/Passport-stamp
 * award endpoints. `awardType` in ('xp','badge','passport_stamp').
 */
export async function grantAward({ guestReference, venueId, awardType, awardKey, amount = 0, idempotencyKey, sourceRoute, requestId, deviceId }) {
  const db = dbOrThrow()
  const client = await db.connect()
  const mutationType = `award_${awardType}`
  try {
    await client.query('BEGIN')
    await ensurePlayerStateRow(client, guestReference, venueId)

    const existing = await client.query(
      `SELECT * FROM smokecraft_awards WHERE guest_reference = $1 AND award_type = $2 AND award_key = $3`,
      [guestReference, awardType, awardKey]
    )
    if (existing.rows.length > 0) {
      await recordAudit(client, { guestReference, mutationType, idempotencyKey, outcome: 'duplicate_replay', requestId, deviceId })
      await client.query('COMMIT')
      return { ok: true, alreadyAwarded: true, award: existing.rows[0] }
    }

    let award
    try {
      const inserted = await client.query(
        `INSERT INTO smokecraft_awards
           (guest_reference, award_type, award_key, amount, idempotency_key, source_route, request_id, device_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [guestReference, awardType, awardKey, amount, idempotencyKey, sourceRoute || null, requestId || null, deviceId || null]
      )
      award = inserted.rows[0]
    } catch (err) {
      if (err.code === UNIQUE_VIOLATION) {
        // See completeSession's identical fix: the transaction is aborted
        // after a unique_violation, so roll back before any further read.
        await client.query('ROLLBACK').catch(() => {})
        const dup = await db.query(`SELECT * FROM smokecraft_awards WHERE guest_reference = $1 AND award_type = $2 AND award_key = $3`, [guestReference, awardType, awardKey])
        await db.query(
          `INSERT INTO smokecraft_award_audit (guest_reference, mutation_type, idempotency_key, outcome, request_id, device_id) VALUES ($1, $2, $3, 'duplicate_replay', $4, $5)`,
          [guestReference, mutationType, idempotencyKey, requestId || null, deviceId || null]
        )
        return { ok: true, alreadyAwarded: true, award: dup.rows[0] }
      }
      throw err
    }

    if (awardType === 'xp' && amount > 0) {
      await client.query(
        `UPDATE smokecraft_player_state SET xp_total = xp_total + $2, last_synced_at = now(), updated_at = now() WHERE guest_reference = $1`,
        [guestReference, amount]
      )
    }
    await recordAudit(client, { guestReference, mutationType, idempotencyKey, outcome: 'applied', requestId, deviceId })
    await client.query('COMMIT')
    return { ok: true, alreadyAwarded: false, award }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

/**
 * Holistic Fix 5A-2: server-authoritative Knowledge Check quiz scoring.
 * The client submits raw per-question responses only (never a score or
 * correctness flag) — this function independently re-derives the score
 * from the same real question data the client rendered, and is the sole
 * authority for the XP grant. Idempotent per (guest_reference, moduleId):
 * a module can be scored/rewarded at most once ever.
 */
export async function submitKnowledgeCheck({ guestReference, venueId, moduleId, responses, completionStepId, idempotencyKey, sourceRoute, requestId, deviceId }) {
  const set = KNOWLEDGE_CHECK_SETS[moduleId]
  if (!set) return { ok: false, error: 'unknown_quiz_module' }
  const { getSessionRewardXp } = await import('./sessionRewardTable.js')
  const xpAmount = completionStepId ? getSessionRewardXp(completionStepId) : 0
  const { score, total } = scoreQuestionSet(set.questions, responses || {})

  const db = dbOrThrow()
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    await ensurePlayerStateRow(client, guestReference, venueId)

    const existing = await client.query(
      `SELECT * FROM smokecraft_activity_attempts WHERE guest_reference = $1 AND activity_type = 'quiz' AND activity_key = $2`,
      [guestReference, moduleId]
    )
    if (existing.rows.length > 0) {
      await recordAudit(client, { guestReference, mutationType: 'quiz_submit', idempotencyKey, outcome: 'duplicate_replay', requestId, deviceId })
      await client.query('COMMIT')
      return { ok: true, alreadyScored: true, attempt: existing.rows[0], score: existing.rows[0].score, total: existing.rows[0].total }
    }

    let attempt
    try {
      const inserted = await client.query(
        `INSERT INTO smokecraft_activity_attempts
           (guest_reference, activity_type, activity_key, evidence, score, total, xp_awarded, idempotency_key, source_route, request_id, device_id)
         VALUES ($1, 'quiz', $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [guestReference, moduleId, JSON.stringify(responses || {}), score, total, xpAmount, idempotencyKey, sourceRoute || null, requestId || null, deviceId || null]
      )
      attempt = inserted.rows[0]
    } catch (err) {
      if (err.code === UNIQUE_VIOLATION) {
        await client.query('ROLLBACK').catch(() => {})
        const dup = await db.query(`SELECT * FROM smokecraft_activity_attempts WHERE guest_reference = $1 AND activity_type = 'quiz' AND activity_key = $2`, [guestReference, moduleId])
        await db.query(
          `INSERT INTO smokecraft_award_audit (guest_reference, mutation_type, idempotency_key, outcome, request_id, device_id) VALUES ($1, 'quiz_submit', $2, 'duplicate_replay', $3, $4)`,
          [guestReference, idempotencyKey, requestId || null, deviceId || null]
        )
        return { ok: true, alreadyScored: true, attempt: dup.rows[0], score: dup.rows[0].score, total: dup.rows[0].total }
      }
      throw err
    }

    if (xpAmount > 0) {
      await client.query(
        `UPDATE smokecraft_player_state SET xp_total = xp_total + $2, last_synced_at = now(), updated_at = now() WHERE guest_reference = $1`,
        [guestReference, xpAmount]
      )
    }
    const rankPromotion = await recomputeRankInTx(client, guestReference)
    await recordAudit(client, { guestReference, mutationType: 'quiz_submit', idempotencyKey, outcome: 'applied', requestId, deviceId })
    await client.query('COMMIT')
    return { ok: true, alreadyScored: false, attempt, score, total, xpAwarded: xpAmount, rankPromotion }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

/**
 * Holistic Fix 5A-2: server-authoritative Leaf Challenge (Origins module)
 * scoring. The client submits the 5 raw leaf-id answers only — this
 * function scores them against the real answer key
 * (src/data/leafChallengeRounds.js), computes the tiered XP, and grants
 * the botanist badge (+ leaf-scholar on a perfect score) and the
 * leaf-recognition Passport stamp, all in the same atomic transaction.
 * Idempotent: at most one scored attempt per guest, ever.
 */
export async function submitLeafChallenge({ guestReference, venueId, answers, idempotencyKey, sourceRoute, requestId, deviceId }) {
  const { score, total, xp: xpAmount, perfect } = scoreLeafChallenge(answers)

  const db = dbOrThrow()
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    await ensurePlayerStateRow(client, guestReference, venueId)

    const existing = await client.query(
      `SELECT * FROM smokecraft_activity_attempts WHERE guest_reference = $1 AND activity_type = 'leaf_challenge' AND activity_key = 'leaf-challenge'`,
      [guestReference]
    )
    if (existing.rows.length > 0) {
      await recordAudit(client, { guestReference, mutationType: 'leaf_challenge_submit', idempotencyKey, outcome: 'duplicate_replay', requestId, deviceId })
      await client.query('COMMIT')
      return { ok: true, alreadyScored: true, attempt: existing.rows[0], score: existing.rows[0].score, total: existing.rows[0].total }
    }

    let attempt
    try {
      const inserted = await client.query(
        `INSERT INTO smokecraft_activity_attempts
           (guest_reference, activity_type, activity_key, evidence, score, total, xp_awarded, idempotency_key, source_route, request_id, device_id)
         VALUES ($1, 'leaf_challenge', 'leaf-challenge', $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [guestReference, JSON.stringify(answers || []), score, total, xpAmount, idempotencyKey, sourceRoute || null, requestId || null, deviceId || null]
      )
      attempt = inserted.rows[0]
    } catch (err) {
      if (err.code === UNIQUE_VIOLATION) {
        await client.query('ROLLBACK').catch(() => {})
        const dup = await db.query(`SELECT * FROM smokecraft_activity_attempts WHERE guest_reference = $1 AND activity_type = 'leaf_challenge' AND activity_key = 'leaf-challenge'`, [guestReference])
        await db.query(
          `INSERT INTO smokecraft_award_audit (guest_reference, mutation_type, idempotency_key, outcome, request_id, device_id) VALUES ($1, 'leaf_challenge_submit', $2, 'duplicate_replay', $3, $4)`,
          [guestReference, idempotencyKey, requestId || null, deviceId || null]
        )
        return { ok: true, alreadyScored: true, attempt: dup.rows[0], score: dup.rows[0].score, total: dup.rows[0].total }
      }
      throw err
    }

    if (xpAmount > 0) {
      await client.query(
        `UPDATE smokecraft_player_state SET xp_total = xp_total + $2, last_synced_at = now(), updated_at = now() WHERE guest_reference = $1`,
        [guestReference, xpAmount]
      )
    }

    const badgesGranted = []
    const botanist = await client.query(
      `INSERT INTO smokecraft_awards (guest_reference, award_type, award_key, amount, idempotency_key, source_route, request_id, device_id)
       VALUES ($1, 'badge', 'botanist', 0, $2, $3, $4, $5) ON CONFLICT (guest_reference, award_type, award_key) DO NOTHING RETURNING *`,
      [guestReference, `${idempotencyKey}:badge:botanist`, sourceRoute || null, requestId || null, deviceId || null]
    )
    if (botanist.rows.length > 0) badgesGranted.push(botanist.rows[0])
    if (perfect) {
      const scholar = await client.query(
        `INSERT INTO smokecraft_awards (guest_reference, award_type, award_key, amount, idempotency_key, source_route, request_id, device_id)
         VALUES ($1, 'badge', 'leaf-scholar', 0, $2, $3, $4, $5) ON CONFLICT (guest_reference, award_type, award_key) DO NOTHING RETURNING *`,
        [guestReference, `${idempotencyKey}:badge:leaf-scholar`, sourceRoute || null, requestId || null, deviceId || null]
      )
      if (scholar.rows.length > 0) badgesGranted.push(scholar.rows[0])
    }
    const stampResult = await client.query(
      `INSERT INTO smokecraft_awards (guest_reference, award_type, award_key, amount, idempotency_key, source_route, request_id, device_id)
       VALUES ($1, 'passport_stamp', 'leaf-recognition', 0, $2, $3, $4, $5) ON CONFLICT (guest_reference, award_type, award_key) DO NOTHING RETURNING *`,
      [guestReference, `${idempotencyKey}:stamp:leaf-recognition`, sourceRoute || null, requestId || null, deviceId || null]
    )
    const passportStampGranted = stampResult.rows[0] || null

    const rankPromotion = await recomputeRankInTx(client, guestReference)
    await recordAudit(client, { guestReference, mutationType: 'leaf_challenge_submit', idempotencyKey, outcome: 'applied', requestId, deviceId })
    await client.query('COMMIT')
    return { ok: true, alreadyScored: false, attempt, score, total, xpAwarded: xpAmount, badgesGranted, passportStampGranted, rankPromotion }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

/**
 * Holistic Fix 5A-2: protected, staff/admin-only correction/reversal.
 * Never deletes or edits the original award/attempt row — records a new,
 * separately traceable correction event, then recalculates the affected
 * player-state totals transactionally from the full history (the
 * original row + this correction), so nothing is silently rewritten.
 */
export async function correctReward({ guestReference, correctionType, targetTable, targetId, targetAwardKey, deltaXp = 0, reversed = false, reason, authorizedBy, idempotencyKey }) {
  if (!reason || !authorizedBy) return { ok: false, error: 'reason_and_authorizedBy_required' }
  const db = dbOrThrow()
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    let correction
    try {
      const inserted = await client.query(
        `INSERT INTO smokecraft_reward_corrections
           (guest_reference, correction_type, target_table, target_id, target_award_key, delta_xp, reversed, reason, authorized_by, idempotency_key)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [guestReference, correctionType, targetTable, targetId || null, targetAwardKey || null, deltaXp, reversed, reason, authorizedBy, idempotencyKey]
      )
      correction = inserted.rows[0]
    } catch (err) {
      if (err.code === UNIQUE_VIOLATION) {
        await client.query('ROLLBACK').catch(() => {})
        const dup = await db.query(`SELECT * FROM smokecraft_reward_corrections WHERE idempotency_key = $1`, [idempotencyKey])
        return { ok: true, alreadyApplied: true, correction: dup.rows[0] }
      }
      throw err
    }

    if (deltaXp !== 0) {
      await client.query(
        `UPDATE smokecraft_player_state SET xp_total = GREATEST(0, xp_total + $2), last_synced_at = now(), updated_at = now() WHERE guest_reference = $1`,
        [guestReference, deltaXp]
      )
    }
    const rankPromotion = await recomputeRankInTx(client, guestReference)
    await recordAudit(client, { guestReference, mutationType: `correction_${correctionType}`, idempotencyKey, outcome: 'applied' })
    await client.query('COMMIT')
    return { ok: true, alreadyApplied: false, correction, rankPromotion }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

const VALID_WRAPPER_INDICES = new Set([0, 1])
const VALID_BINDER_INDICES = new Set([0, 1])
const VALID_FILLER_INDICES = new Set([0, 1, 2])

/**
 * Holistic Fix 5A-3: server-verifiable evidence for the master-blend
 * Passport stamp. The client submits its raw wrapper/binder/filler
 * selection (structured evidence, not a claim of "I completed the
 * blend") — the server independently checks it is a well-formed,
 * complete selection (a valid wrapper, a valid binder, exactly 3 valid
 * distinct fillers) before granting anything. Not a subjective-quality
 * judgment (which would be genuinely unverifiable server-side) — a real,
 * mechanical completeness check, closing the previously-disclosed
 * "unverified free-form client claim" gap for this specific stamp.
 */
export async function submitBlendSelection({ guestReference, venueId, wrapperIndex, binderIndex, fillerIndices, idempotencyKey, sourceRoute, requestId, deviceId }) {
  const fillers = Array.isArray(fillerIndices) ? [...new Set(fillerIndices)] : []
  const valid = VALID_WRAPPER_INDICES.has(wrapperIndex) && VALID_BINDER_INDICES.has(binderIndex)
    && fillers.length === 3 && fillers.every(i => VALID_FILLER_INDICES.has(i))
  if (!valid) return { ok: false, error: 'incomplete_blend_selection' }

  const xpAmount = 150 // XP_AWARDS.BLEND_CREATED, server-owned copy — see sessionRewardTable.js NAMED_XP_SOURCES['blend-created']

  const db = dbOrThrow()
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    await ensurePlayerStateRow(client, guestReference, venueId)

    const existing = await client.query(
      `SELECT * FROM smokecraft_activity_attempts WHERE guest_reference = $1 AND activity_type = 'skill_checkpoint' AND activity_key = 'master-blend'`,
      [guestReference]
    )
    if (existing.rows.length > 0) {
      await recordAudit(client, { guestReference, mutationType: 'blend_submit', idempotencyKey, outcome: 'duplicate_replay', requestId, deviceId })
      await client.query('COMMIT')
      return { ok: true, alreadyScored: true, attempt: existing.rows[0] }
    }

    let attempt
    try {
      const inserted = await client.query(
        `INSERT INTO smokecraft_activity_attempts
           (guest_reference, activity_type, activity_key, evidence, score, total, xp_awarded, idempotency_key, source_route, request_id, device_id)
         VALUES ($1, 'skill_checkpoint', 'master-blend', $2, 1, 1, $3, $4, $5, $6, $7)
         RETURNING *`,
        [guestReference, JSON.stringify({ wrapperIndex, binderIndex, fillerIndices: fillers }), xpAmount, idempotencyKey, sourceRoute || null, requestId || null, deviceId || null]
      )
      attempt = inserted.rows[0]
    } catch (err) {
      if (err.code === UNIQUE_VIOLATION) {
        await client.query('ROLLBACK').catch(() => {})
        const dup = await db.query(`SELECT * FROM smokecraft_activity_attempts WHERE guest_reference = $1 AND activity_type = 'skill_checkpoint' AND activity_key = 'master-blend'`, [guestReference])
        return { ok: true, alreadyScored: true, attempt: dup.rows[0] }
      }
      throw err
    }

    await client.query(
      `UPDATE smokecraft_player_state SET xp_total = xp_total + $2, last_synced_at = now(), updated_at = now() WHERE guest_reference = $1`,
      [guestReference, xpAmount]
    )
    const stampResult = await client.query(
      `INSERT INTO smokecraft_awards (guest_reference, award_type, award_key, amount, idempotency_key, source_route, request_id, device_id)
       VALUES ($1, 'passport_stamp', 'master-blend', 0, $2, $3, $4, $5) ON CONFLICT (guest_reference, award_type, award_key) DO NOTHING RETURNING *`,
      [guestReference, `${idempotencyKey}:stamp:master-blend`, sourceRoute || null, requestId || null, deviceId || null]
    )
    const rankPromotion = await recomputeRankInTx(client, guestReference)
    await recordAudit(client, { guestReference, mutationType: 'blend_submit', idempotencyKey, outcome: 'applied', requestId, deviceId })
    await client.query('COMMIT')
    return { ok: true, alreadyScored: false, attempt, xpAwarded: xpAmount, passportStampGranted: stampResult.rows[0] || null, rankPromotion }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

/**
 * Holistic Fix 5A-3E — closes the cultivator Passport stamp's previously
 * client-decided eligibility (previously granted on any "Save to
 * Passport" click, regardless of whether the guest had actually viewed
 * anything). The client submits its raw set of viewed-stage ids as
 * evidence — the server independently verifies it is a superset of all
 * 7 real, canonical cultivation stages (src/data/cultivationStages.js,
 * dual-imported) before granting anything. A real, mechanical
 * completeness check (all required steps completed) — not a subjective
 * judgment, matching the same evidence pattern already proven for
 * master-blend.
 */
export async function submitCultivatorEvidence({ guestReference, venueId, viewedStageIds, idempotencyKey, sourceRoute, requestId, deviceId }) {
  const viewed = new Set(Array.isArray(viewedStageIds) ? viewedStageIds : [])
  const complete = CULTIVATION_STAGE_IDS.every(id => viewed.has(id))
  if (!complete) return { ok: false, error: 'incomplete_cultivation_stages' }

  const xpAmount = 50 // matches the existing cultivation-seed named-XP amount (sessionRewardTable.js)

  const db = dbOrThrow()
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    await ensurePlayerStateRow(client, guestReference, venueId)

    const existing = await client.query(
      `SELECT * FROM smokecraft_activity_attempts WHERE guest_reference = $1 AND activity_type = 'skill_checkpoint' AND activity_key = 'cultivator'`,
      [guestReference]
    )
    if (existing.rows.length > 0) {
      await recordAudit(client, { guestReference, mutationType: 'cultivator_submit', idempotencyKey, outcome: 'duplicate_replay', requestId, deviceId })
      await client.query('COMMIT')
      return { ok: true, alreadyScored: true, attempt: existing.rows[0] }
    }

    let attempt
    try {
      const inserted = await client.query(
        `INSERT INTO smokecraft_activity_attempts
           (guest_reference, activity_type, activity_key, evidence, score, total, xp_awarded, idempotency_key, source_route, request_id, device_id)
         VALUES ($1, 'skill_checkpoint', 'cultivator', $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [guestReference, JSON.stringify({ viewedStageIds: [...viewed] }), viewed.size, CULTIVATION_STAGE_IDS.length, xpAmount, idempotencyKey, sourceRoute || null, requestId || null, deviceId || null]
      )
      attempt = inserted.rows[0]
    } catch (err) {
      if (err.code === UNIQUE_VIOLATION) {
        await client.query('ROLLBACK').catch(() => {})
        const dup = await db.query(`SELECT * FROM smokecraft_activity_attempts WHERE guest_reference = $1 AND activity_type = 'skill_checkpoint' AND activity_key = 'cultivator'`, [guestReference])
        return { ok: true, alreadyScored: true, attempt: dup.rows[0] }
      }
      throw err
    }

    await client.query(
      `UPDATE smokecraft_player_state SET xp_total = xp_total + $2, last_synced_at = now(), updated_at = now() WHERE guest_reference = $1`,
      [guestReference, xpAmount]
    )
    const stampResult = await client.query(
      `INSERT INTO smokecraft_awards (guest_reference, award_type, award_key, amount, idempotency_key, source_route, request_id, device_id)
       VALUES ($1, 'passport_stamp', 'cultivator', 0, $2, $3, $4, $5) ON CONFLICT (guest_reference, award_type, award_key) DO NOTHING RETURNING *`,
      [guestReference, `${idempotencyKey}:stamp:cultivator`, sourceRoute || null, requestId || null, deviceId || null]
    )
    const rankPromotion = await recomputeRankInTx(client, guestReference)
    await recordAudit(client, { guestReference, mutationType: 'cultivator_submit', idempotencyKey, outcome: 'applied', requestId, deviceId })
    await client.query('COMMIT')
    return { ok: true, alreadyScored: false, attempt, xpAwarded: xpAmount, passportStampGranted: stampResult.rows[0] || null, rankPromotion }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

const STALE_DRAFT_VERSION = 'stale_version'

/**
 * Holistic Fix 5A-3D — server-authoritative tasting draft persistence.
 * Learner observations only (which cigar was selected/compared) —
 * never completion validity, score, or XP. Same optimistic-concurrency
 * pattern as saveJourneySnapshot: caller supplies expectedVersion, a
 * stale write is rejected with the server's current state rather than
 * silently overwritten (real cross-device/two-tab safety).
 */
export async function getTastingDraft({ guestReference, activityKey }) {
  const db = dbOrThrow()
  const result = await db.query(
    `SELECT draft_data, version, updated_at FROM smokecraft_tasting_drafts WHERE guest_reference = $1 AND activity_key = $2`,
    [guestReference, activityKey]
  )
  const row = result.rows[0]
  return { draftData: row?.draft_data || {}, version: row?.version ?? 0, updatedAt: row?.updated_at || null }
}

export async function saveTastingDraft({ guestReference, activityKey, draftData, expectedVersion }) {
  // Package A draft-persistence correction: for Sessions 8/12/16 only,
  // validate the draft's field names/types/vocabulary server-side
  // (never trust arbitrary client fields), and refuse to accept a draft
  // write once real completion evidence already exists for this guest
  // and session — a stale draft must never be able to overwrite
  // completed state. Other activityKeys (e.g. 'mini-tasting') are
  // unaffected by either check.
  // Package B draft-persistence: the 'scorecard' activityKey gets its
  // own narrow field/vocabulary validation and completed-state check,
  // via the same dispatch pattern — every other activityKey is
  // unaffected by either branch.
  // Package C draft-persistence: Sessions 2/5/6/10 get their own narrow
  // field/vocabulary validation and completed-state check, via the same
  // dispatch pattern — every other activityKey is unaffected.
  const validation = activityKey === 'scorecard'
    ? validateScorecardDraftPayload(activityKey, draftData)
    : PACKAGE_C_SESSIONS.includes(activityKey)
    ? validateSelectionDraftPayload(activityKey, draftData)
    : validateTastingDraftPayload(activityKey, draftData)
  if (!validation.ok) {
    return { ok: false, error: validation.error }
  }
  if (TASTING_OBSERVATION_SESSIONS.includes(activityKey)) {
    const alreadyCompleted = await hasTastingObservationEvidence(guestReference, activityKey)
    if (alreadyCompleted) {
      return { ok: false, error: 'already_completed' }
    }
  }
  if (PACKAGE_C_SESSIONS.includes(activityKey)) {
    const alreadyCompleted = await hasSelectionEvidence(guestReference, activityKey)
    if (alreadyCompleted) {
      return { ok: false, error: 'already_completed' }
    }
  }
  if (activityKey === 'scorecard') {
    const alreadyCompleted = await hasScorecardEvidence(guestReference, activityKey)
    if (alreadyCompleted) {
      return { ok: false, error: 'already_completed' }
    }
  }

  const db = dbOrThrow()
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const existing = await client.query(
      `SELECT version FROM smokecraft_tasting_drafts WHERE guest_reference = $1 AND activity_key = $2 FOR UPDATE`,
      [guestReference, activityKey]
    )
    const currentVersion = existing.rows[0]?.version ?? 0
    if (currentVersion !== expectedVersion) {
      await client.query('ROLLBACK')
      return { conflict: true, current: { draftData: existing.rows[0] ? (await db.query(`SELECT draft_data FROM smokecraft_tasting_drafts WHERE guest_reference=$1 AND activity_key=$2`, [guestReference, activityKey])).rows[0].draft_data : {}, version: currentVersion } }
    }
    const upserted = await client.query(
      `INSERT INTO smokecraft_tasting_drafts (guest_reference, activity_key, draft_data, version, updated_at)
       VALUES ($1, $2, $3, 1, now())
       ON CONFLICT (guest_reference, activity_key)
       DO UPDATE SET draft_data = $3, version = smokecraft_tasting_drafts.version + 1, updated_at = now()
       RETURNING draft_data, version, updated_at`,
      [guestReference, activityKey, JSON.stringify(draftData)]
    )
    await client.query('COMMIT')
    const row = upserted.rows[0]
    return { conflict: false, current: { draftData: row.draft_data, version: row.version, updatedAt: row.updated_at } }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

/**
 * Holistic Fix 5A-3D — server-authoritative Mini Tasting completion. The
 * client submits its raw selection (selectedCigarId + compareIds) as
 * evidence, never a completion claim — the server independently
 * verifies selectedCigarId is a real id from the server's own copy of
 * the venue's flight inventory (never trusting an arbitrary client id)
 * before granting XP. Idempotent: at most one completion per guest,
 * ever, via smokecraft_activity_attempts' existing UNIQUE constraint.
 */
export async function submitTastingCompletion({ guestReference, venueId, activityKey, selectedCigarId, compareIds, idempotencyKey, sourceRoute, requestId, deviceId }) {
  if (!selectedCigarId || typeof selectedCigarId !== 'string') {
    return { ok: false, error: 'selected_cigar_required' }
  }
  const house = getSampleInventory(DEFAULT_TASTING_VENUE_ID, 'house_cigar')
  const featured = getSampleInventory(DEFAULT_TASTING_VENUE_ID, 'featured_cigar')
  const flight = [...house, ...featured].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).slice(0, 3)
  const validIds = new Set(flight.map(c => c.item_id))
  if (!validIds.has(selectedCigarId)) {
    return { ok: false, error: 'invalid_cigar_selection' }
  }

  const { getNamedXpAmount } = await import('./sessionRewardTable.js')
  const xpAmount = getNamedXpAmount('mini-tasting-begin') || 0

  const db = dbOrThrow()
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    await ensurePlayerStateRow(client, guestReference, venueId)

    const existing = await client.query(
      `SELECT * FROM smokecraft_activity_attempts WHERE guest_reference = $1 AND activity_type = 'tasting' AND activity_key = $2`,
      [guestReference, activityKey]
    )
    if (existing.rows.length > 0) {
      await recordAudit(client, { guestReference, mutationType: 'tasting_complete', idempotencyKey, outcome: 'duplicate_replay', requestId, deviceId })
      await client.query('COMMIT')
      return { ok: true, alreadyCompleted: true, xpAwarded: 0 }
    }

    let attempt
    try {
      const inserted = await client.query(
        `INSERT INTO smokecraft_activity_attempts
           (guest_reference, activity_type, activity_key, evidence, xp_awarded, idempotency_key, source_route, request_id, device_id)
         VALUES ($1, 'tasting', $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [guestReference, activityKey, JSON.stringify({ selectedCigarId, compareIds: Array.isArray(compareIds) ? compareIds : [] }), xpAmount, idempotencyKey, sourceRoute || null, requestId || null, deviceId || null]
      )
      attempt = inserted.rows[0]
    } catch (err) {
      if (err.code === UNIQUE_VIOLATION) {
        await client.query('ROLLBACK').catch(() => {})
        await db.query(
          `INSERT INTO smokecraft_award_audit (guest_reference, mutation_type, idempotency_key, outcome, request_id, device_id) VALUES ($1, 'tasting_complete', $2, 'duplicate_replay', $3, $4)`,
          [guestReference, idempotencyKey, requestId || null, deviceId || null]
        )
        return { ok: true, alreadyCompleted: true, xpAwarded: 0 }
      }
      throw err
    }

    if (xpAmount > 0) {
      await client.query(
        `UPDATE smokecraft_player_state SET xp_total = xp_total + $2, last_synced_at = now(), updated_at = now() WHERE guest_reference = $1`,
        [guestReference, xpAmount]
      )
    }
    const rankPromotion = await recomputeRankInTx(client, guestReference)
    await recordAudit(client, { guestReference, mutationType: 'tasting_complete', idempotencyKey, outcome: 'applied', requestId, deviceId })
    await client.query('COMMIT')
    return { ok: true, alreadyCompleted: false, attempt, xpAwarded: xpAmount, rankPromotion }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

/**
 * Loads the journey content snapshot for a guest/account reference.
 */
export async function getJourneySnapshot(guestReference) {
  const db = dbOrThrow()
  const result = await db.query(
    `SELECT journey_snapshot, journey_version, journey_updated_at FROM smokecraft_player_state WHERE guest_reference = $1`,
    [guestReference]
  )
  const row = result.rows[0]
  return {
    snapshot: row?.journey_snapshot ?? {},
    version: row?.journey_version ?? 0,
    updatedAt: row?.journey_updated_at ?? null,
  }
}

/**
 * Saves the journey content snapshot with real optimistic-concurrency
 * control: the caller must supply the version it last read
 * (`expectedVersion`). If the server's current version has moved on
 * (another device/tab saved in the meantime), this returns
 * `{ ok: false, conflict: true, current }` with the latest server state
 * — it NEVER silently overwrites a newer write with a stale one.
 */
export async function saveJourneySnapshot({ guestReference, venueId, snapshot, expectedVersion }) {
  const db = dbOrThrow()
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    await ensurePlayerStateRow(client, guestReference, venueId)
    const current = await client.query(
      `SELECT journey_snapshot, journey_version, journey_updated_at FROM smokecraft_player_state WHERE guest_reference = $1 FOR UPDATE`,
      [guestReference]
    )
    const currentVersion = current.rows[0]?.journey_version ?? 0
    if (currentVersion !== expectedVersion) {
      await client.query('ROLLBACK')
      return {
        ok: false, conflict: true,
        current: { snapshot: current.rows[0]?.journey_snapshot ?? {}, version: currentVersion, updatedAt: current.rows[0]?.journey_updated_at ?? null },
      }
    }
    const updated = await client.query(
      `UPDATE smokecraft_player_state
          SET journey_snapshot = $2, journey_version = journey_version + 1, journey_updated_at = now(), last_synced_at = now(), updated_at = now()
        WHERE guest_reference = $1
        RETURNING journey_snapshot, journey_version, journey_updated_at`,
      [guestReference, JSON.stringify(snapshot)]
    )
    await client.query('COMMIT')
    return { ok: true, conflict: false, current: { snapshot: updated.rows[0].journey_snapshot, version: updated.rows[0].journey_version, updatedAt: updated.rows[0].journey_updated_at } }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

/**
 * Atomic guest-to-account conversion, implementing
 * SMOKECRAFT_GUEST_ACCOUNT_MERGE_POLICY.md exactly:
 *   - session completions: set union, keep-earliest on conflict
 *   - XP: recomputed from the merged completions+awards, never summed
 *   - badges/stamps: set union by (type, key)
 *   - journey snapshot: account's own wins if it has one (version > 0),
 *     else the guest's is adopted
 * Idempotent: smokecraft_guest_conversions.guest_reference UNIQUE means
 * a given guest identity can be converted at most once, ever — a repeat
 * request (any idempotency key) returns the original result.
 */
export async function convertGuestToAccount({ guestReference, userReference, venueId, idempotencyKey, requestId, deviceId }) {
  const db = dbOrThrow()
  const client = await db.connect()
  try {
    await client.query('BEGIN')

    const existingConversion = await client.query(
      `SELECT * FROM smokecraft_guest_conversions WHERE guest_reference = $1`,
      [guestReference]
    )
    if (existingConversion.rows.length > 0) {
      await client.query('COMMIT')
      return { ok: true, alreadyConverted: true, conversion: existingConversion.rows[0] }
    }

    await ensurePlayerStateRow(client, guestReference, venueId)
    await ensurePlayerStateRow(client, userReference, venueId)

    // ── Session completions: set union, keep-earliest on conflict ──
    const guestCompletions = await client.query(`SELECT * FROM smokecraft_session_completions WHERE guest_reference = $1`, [guestReference])
    let sessionsTransferred = 0, sessionsMergedDuplicate = 0
    for (const gc of guestCompletions.rows) {
      const existing = await client.query(`SELECT * FROM smokecraft_session_completions WHERE guest_reference = $1 AND session_id = $2`, [userReference, gc.session_id])
      if (existing.rows.length > 0) {
        // Account already completed this session — keep whichever is
        // earlier (real first-completion time), never fabricate a merge.
        if (new Date(gc.completed_at) < new Date(existing.rows[0].completed_at)) {
          await client.query(
            `UPDATE smokecraft_session_completions SET completed_at = $3, xp_awarded = $4, source_route = $5 WHERE guest_reference = $1 AND session_id = $2`,
            [userReference, gc.session_id, gc.completed_at, gc.xp_awarded, gc.source_route]
          )
        }
        sessionsMergedDuplicate++
      } else {
        await client.query(
          `INSERT INTO smokecraft_session_completions (guest_reference, session_id, idempotency_key, xp_awarded, completed_at, source_route, request_id, device_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [userReference, gc.session_id, `converted:${gc.idempotency_key}`, gc.xp_awarded, gc.completed_at, gc.source_route, requestId || null, deviceId || null]
        )
        sessionsTransferred++
      }
    }

    // ── Awards: set union by (type, key) ──
    const guestAwards = await client.query(`SELECT * FROM smokecraft_awards WHERE guest_reference = $1`, [guestReference])
    let awardsTransferred = 0, awardsMergedDuplicate = 0
    for (const ga of guestAwards.rows) {
      const existing = await client.query(`SELECT * FROM smokecraft_awards WHERE guest_reference = $1 AND award_type = $2 AND award_key = $3`, [userReference, ga.award_type, ga.award_key])
      if (existing.rows.length > 0) {
        awardsMergedDuplicate++
      } else {
        await client.query(
          `INSERT INTO smokecraft_awards (guest_reference, award_type, award_key, amount, idempotency_key, source_route, request_id, device_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [userReference, ga.award_type, ga.award_key, ga.amount, `converted:${ga.idempotency_key}`, ga.source_route, requestId || null, deviceId || null]
        )
        awardsTransferred++
      }
    }

    // ── XP: recomputed from the merged source of truth, never summed ──
    const xpFromCompletions = await client.query(`SELECT COALESCE(SUM(xp_awarded), 0) AS total FROM smokecraft_session_completions WHERE guest_reference = $1`, [userReference])
    const xpFromAwards = await client.query(`SELECT COALESCE(SUM(amount), 0) AS total FROM smokecraft_awards WHERE guest_reference = $1 AND award_type = 'xp'`, [userReference])
    const recomputedXp = Number(xpFromCompletions.rows[0].total) + Number(xpFromAwards.rows[0].total)
    await client.query(`UPDATE smokecraft_player_state SET xp_total = $2, last_synced_at = now(), updated_at = now() WHERE guest_reference = $1`, [userReference, recomputedXp])

    // ── Journey snapshot: account's own wins if it has one ──
    const guestState = await client.query(`SELECT journey_snapshot, journey_version FROM smokecraft_player_state WHERE guest_reference = $1`, [guestReference])
    const userState = await client.query(`SELECT journey_version FROM smokecraft_player_state WHERE guest_reference = $1`, [userReference])
    let journeyMergeOutcome
    const guestHasSnapshot = (guestState.rows[0]?.journey_version ?? 0) > 0
    const userHasSnapshot = (userState.rows[0]?.journey_version ?? 0) > 0
    if (userHasSnapshot) {
      journeyMergeOutcome = 'account_snapshot_used'
    } else if (guestHasSnapshot) {
      await client.query(
        `UPDATE smokecraft_player_state SET journey_snapshot = $2, journey_version = $3, journey_updated_at = now(), updated_at = now() WHERE guest_reference = $1`,
        [userReference, guestState.rows[0].journey_snapshot, guestState.rows[0].journey_version]
      )
      journeyMergeOutcome = 'guest_snapshot_used'
    } else {
      journeyMergeOutcome = 'no_guest_snapshot'
    }

    // ── Collections ownership: set union by collection_item_key ──
    // Holistic Fix 5A-3F: was previously never transferred at all — a
    // real gap (Collections used an unprefixed guest_reference for
    // accounts, so conversion had nothing matching `userReference` to
    // find). Same keep-both-sides-idempotent pattern as awards above.
    let collectionsTransferred = 0, collectionsMergedDuplicate = 0
    const guestCollections = await client.query(`SELECT * FROM smokecraft_collection_ownership WHERE guest_reference = $1`, [guestReference])
    for (const gc of guestCollections.rows) {
      const existing = await client.query(`SELECT id FROM smokecraft_collection_ownership WHERE guest_reference = $1 AND collection_item_key = $2`, [userReference, gc.collection_item_key])
      if (existing.rows.length > 0) {
        collectionsMergedDuplicate++
      } else {
        await client.query(
          `INSERT INTO smokecraft_collection_ownership
             (guest_reference, collection_item_key, ownership_status, earned_at, earn_source, source_progression_event_id, source_record_id, idempotency_key, metadata)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [userReference, gc.collection_item_key, gc.ownership_status, gc.earned_at, gc.earn_source, gc.source_progression_event_id, gc.source_record_id, `converted:${gc.idempotency_key}`, gc.metadata]
        )
        collectionsTransferred++
      }
    }

    // ── Skill Tree evidence: transfer the underlying evidence tables so
    // recalculate() (which always re-derives node state from evidence,
    // never trusts a cached flag) reports the same node states under the
    // new account identity. Holistic Fix 5A-3G: previously NONE of these
    // were transferred at all, so all Skill Tree progress was silently
    // lost on every guest-to-account conversion — a real found gap.
    const skillTreeEvidenceCopies = [
      { table: 'smokecraft_seed_soil_progress', cols: 'component_id, viewed_at', conflict: '(guest_reference, component_id)' },
      { table: 'smokecraft_filler_arrangement_completion', cols: 'completed_at, xp_awarded', conflict: '(guest_reference)' },
      { table: 'smokecraft_rolling_progress', cols: 'step_key, status, updated_at', conflict: '(guest_reference, step_key)' },
      { table: 'smokecraft_flavor_stage_observations', cols: 'stage, flavor_notes, intensity, strength_perception, body, balance, complexity, burn, draw, temperature, personal_notes, updated_at', conflict: '(guest_reference, stage)' },
      { table: 'smokecraft_pairing_drafts', cols: 'cigar_reference, pairing_category, pairing_item, intensity, sweetness, acidity, bitterness, texture, temperature, strategy, reasoning, status, created_at, updated_at', conflict: null },
    ]
    let skillTreeEvidenceRowsTransferred = 0
    for (const spec of skillTreeEvidenceCopies) {
      const conflictClause = spec.conflict ? `ON CONFLICT ${spec.conflict} DO NOTHING` : ''
      const result = await client.query(
        `INSERT INTO ${spec.table} (guest_reference, ${spec.cols})
         SELECT $2, ${spec.cols} FROM ${spec.table} WHERE guest_reference = $1
         ${conflictClause}`,
        [guestReference, userReference]
      )
      skillTreeEvidenceRowsTransferred += result.rowCount
    }
    // Also copy the learner-state cache rows themselves (history/completedAt
    // preservation) — harmless even though the next GET re-derives them
    // from the evidence just transferred above (deterministic recalculation).
    await client.query(
      `INSERT INTO smokecraft_skill_tree_learner_state
         (guest_reference, node_key, state, unlock_source, completion_source, completed_at, progress_percent, last_calculated_at)
       SELECT $2, node_key, state, unlock_source, completion_source, completed_at, progress_percent, last_calculated_at
       FROM smokecraft_skill_tree_learner_state WHERE guest_reference = $1
       ON CONFLICT (guest_reference, node_key) DO NOTHING`,
      [guestReference, userReference]
    )
    // ── Leaderboard preference: transfer opt-out/display-name/venue-scope
    // choice. Holistic Fix 5A-3H: previously never transferred at all — a
    // real found gap. Without this, a guest who explicitly opted OUT of
    // the leaderboard would revert to the default-visible state under
    // their new account identity (a genuine privacy-preference loss, not
    // merely a cosmetic gap), and any venue scope they set would be lost.
    // The account's own existing preference (if it already set one) wins.
    const guestPref = await client.query(`SELECT * FROM smokecraft_leaderboard_eligibility WHERE guest_reference = $1`, [guestReference])
    let leaderboardPreferenceTransferred = false
    if (guestPref.rows.length > 0) {
      const gp = guestPref.rows[0]
      await client.query(
        `INSERT INTO smokecraft_leaderboard_eligibility (guest_reference, eligible, display_name, venue_id)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (guest_reference) DO NOTHING`,
        [userReference, gp.eligible, gp.display_name, gp.venue_id]
      )
      leaderboardPreferenceTransferred = true
    }

    // ── Saved pairings: Holistic Fix 5B-1, transferred from day one (this
    // is a brand-new system — never had a chance to accumulate the
    // "never transferred" defect class seen in earlier passes). ──
    const pairingTransfer = await transferSavedPairings(client, guestReference, userReference)

    // ── Challenge Hub state + rewards, Blend Fault attempts: Holistic
    // Fix 5C-1A found this was never transferred at all — the same
    // recurring defect class as SC-D046/047/048 (Skill Tree evidence,
    // Collections, leaderboard preference never transferred). Without
    // this, a learner who started/completed a Daily/Weekly challenge or
    // passed a Blend Fault Identification assessment as a guest would
    // silently lose that state converting to an account. Set-union by
    // the real natural key, keep-both-idempotent, same pattern as every
    // other table above. ──
    let challengeStateTransferred = 0
    const guestChallengeState = await client.query(`SELECT * FROM smokecraft_challenge_learner_state WHERE guest_reference = $1`, [guestReference])
    for (const gs of guestChallengeState.rows) {
      const existing = await client.query(`SELECT id FROM smokecraft_challenge_learner_state WHERE guest_reference = $1 AND challenge_instance_key = $2`, [userReference, gs.challenge_instance_key])
      if (existing.rows.length === 0) {
        await client.query(
          `INSERT INTO smokecraft_challenge_learner_state
             (guest_reference, challenge_instance_key, participation_state, progress_value, target_value_snapshot, started_at, completed_at, completion_source, supporting_progression_event_id, idempotency_key)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [userReference, gs.challenge_instance_key, gs.participation_state, gs.progress_value, gs.target_value_snapshot, gs.started_at, gs.completed_at, gs.completion_source, gs.supporting_progression_event_id, `converted:${gs.idempotency_key}`]
        )
        challengeStateTransferred++
      }
    }
    let challengeRewardsTransferred = 0
    const guestChallengeRewards = await client.query(`SELECT * FROM smokecraft_challenge_rewards WHERE guest_reference = $1`, [guestReference])
    for (const gr of guestChallengeRewards.rows) {
      const existing = await client.query(`SELECT id FROM smokecraft_challenge_rewards WHERE guest_reference = $1 AND challenge_instance_key = $2`, [userReference, gr.challenge_instance_key])
      if (existing.rows.length === 0) {
        await client.query(
          `INSERT INTO smokecraft_challenge_rewards (guest_reference, challenge_key, challenge_instance_key, rule_version, xp_awarded, idempotency_key)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [userReference, gr.challenge_key, gr.challenge_instance_key, gr.rule_version, gr.xp_awarded, `converted:${gr.idempotency_key}`]
        )
        challengeRewardsTransferred++
      }
    }
    let blendFaultAttemptsTransferred = 0
    const guestBlendFaultAttempts = await client.query(`SELECT * FROM smokecraft_blend_fault_attempts WHERE guest_reference = $1`, [guestReference])
    for (const ba of guestBlendFaultAttempts.rows) {
      const existing = await client.query(`SELECT attempt_id FROM smokecraft_blend_fault_attempts WHERE guest_reference = $1 AND assessment_key = $2 AND attempt_number = $3`, [userReference, ba.assessment_key, ba.attempt_number])
      if (existing.rows.length === 0) {
        const inserted = await client.query(
          `INSERT INTO smokecraft_blend_fault_attempts
             (guest_reference, assessment_key, attempt_number, assessment_version, status, started_at, submitted_at, score_earned, score_possible, percentage, pass_fail, completion_source, idempotency_key)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING attempt_id`,
          [userReference, ba.assessment_key, ba.attempt_number, ba.assessment_version, ba.status, ba.started_at, ba.submitted_at, ba.score_earned, ba.score_possible, ba.percentage, ba.pass_fail, ba.completion_source, `converted:${ba.idempotency_key}`]
        )
        const newAttemptId = inserted.rows[0].attempt_id
        await client.query(
          `INSERT INTO smokecraft_blend_fault_answers (attempt_id, question_key, submitted_answer, is_correct, points_earned, answered_at)
           SELECT $2, question_key, submitted_answer, is_correct, points_earned, answered_at FROM smokecraft_blend_fault_answers WHERE attempt_id = $1`,
          [ba.attempt_id, newAttemptId]
        )
        blendFaultAttemptsTransferred++
      }
    }

    // ── Golden Box entries + drafts + submissions: Holistic Fix 5C-1B
    // found this was transferred INCORRECTLY, not just missing —
    // golden_box_entries was previously included in the generic
    // set-union copy loop above, which lets entry_id auto-generate a
    // NEW UUID for the copied row. Every entry_versions/
    // blend_components/submissions row that referenced the OLD
    // entry_id (via a real FK) was silently orphaned — the account
    // would see an empty draft with no history and no submission
    // record, even though `entryStateTransferred` would have (wrongly)
    // reported success. Fixed with a bespoke transfer that preserves
    // the parent/child relationship by remapping entry_id (and each
    // version's id) to the newly-created rows, the same pattern used
    // for Blend Fault attempts/answers above. ──
    let goldenBoxEntriesTransferred = 0
    const guestGoldenBoxEntries = await client.query(`SELECT * FROM golden_box_entries WHERE guest_reference = $1`, [guestReference])
    for (const ge of guestGoldenBoxEntries.rows) {
      const existingEntry = await client.query(`SELECT entry_id FROM golden_box_entries WHERE competition_id = $1 AND guest_reference = $2`, [ge.competition_id, userReference])
      if (existingEntry.rows.length > 0) continue
      const insertedEntry = await client.query(
        `INSERT INTO golden_box_entries (competition_id, round_id, user_id, guest_reference, cigar_name, status, current_version, submitted_at, locked_at, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING entry_id`,
        [ge.competition_id, ge.round_id, ge.user_id, userReference, ge.cigar_name, ge.status, ge.current_version, ge.submitted_at, ge.locked_at, ge.created_at, ge.updated_at]
      )
      const newEntryId = insertedEntry.rows[0].entry_id
      goldenBoxEntriesTransferred++

      const versions = await client.query(`SELECT * FROM golden_box_entry_versions WHERE entry_id = $1 ORDER BY version_number`, [ge.entry_id])
      const versionIdMap = new Map()
      for (const v of versions.rows) {
        const insertedVersion = await client.query(
          `INSERT INTO golden_box_entry_versions (entry_id, version_number, presentation_payload, pairing_selection, pairing_defense, predicted_profile, created_by, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
          [newEntryId, v.version_number, v.presentation_payload, v.pairing_selection, v.pairing_defense, v.predicted_profile, v.created_by, v.created_at]
        )
        versionIdMap.set(v.id, insertedVersion.rows[0].id)
      }
      for (const [oldVersionId, newVersionId] of versionIdMap) {
        await client.query(
          `INSERT INTO golden_box_blend_components (entry_version_id, component_type, component_key, component_value, display_order)
           SELECT $2, component_type, component_key, component_value, display_order FROM golden_box_blend_components WHERE entry_version_id = $1`,
          [oldVersionId, newVersionId]
        )
      }
      const submission = await client.query(`SELECT * FROM golden_box_submissions WHERE entry_id = $1`, [ge.entry_id])
      if (submission.rows[0] && versionIdMap.has(submission.rows[0].entry_version_id)) {
        const s = submission.rows[0]
        await client.query(
          `INSERT INTO golden_box_submissions (entry_id, entry_version_id, submitted_at, validation_passed, validation_errors)
           VALUES ($1,$2,$3,$4,$5)`,
          [newEntryId, versionIdMap.get(s.entry_version_id), s.submitted_at, s.validation_passed, s.validation_errors]
        )
      }
    }

    const conversion = await client.query(
      `INSERT INTO smokecraft_guest_conversions
         (guest_reference, user_id, idempotency_key, sessions_transferred, sessions_merged_duplicate, awards_transferred, awards_merged_duplicate, journey_merge_outcome, request_id, device_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [guestReference, userReference, idempotencyKey, sessionsTransferred, sessionsMergedDuplicate, awardsTransferred, awardsMergedDuplicate, journeyMergeOutcome, requestId || null, deviceId || null]
    )

    await recordAudit(client, { guestReference: userReference, mutationType: 'guest_conversion', idempotencyKey, outcome: 'applied', requestId, deviceId })

    await client.query('COMMIT')

    // Recalculate AFTER commit, on a fresh connection — recalculateSkillTree
    // uses its own db handle (via getDb()), which inside the transaction
    // above would not yet see the just-transferred, uncommitted evidence
    // rows (transaction isolation), and touching the same
    // smokecraft_skill_tree_learner_state rows from two connections at once
    // risked a row-lock stall against this same transaction.
    let skillTreeCompletedNodes = 0
    try {
      const recalculated = await recalculateSkillTree(userReference)
      skillTreeCompletedNodes = recalculated.filter(r => r.learnerState.state === 'completed').length
    } catch { /* non-fatal — conversion itself already succeeded */ }

    return { ok: true, alreadyConverted: false, conversion: conversion.rows[0], collectionsTransferred, collectionsMergedDuplicate, skillTreeEvidenceRowsTransferred, skillTreeCompletedNodes, leaderboardPreferenceTransferred, pairingSavesTransferred: pairingTransfer.transferred, pairingSavesMergedDuplicate: pairingTransfer.mergedDuplicate, challengeStateTransferred, challengeRewardsTransferred, blendFaultAttemptsTransferred, goldenBoxEntriesTransferred }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    if (err.code === UNIQUE_VIOLATION) {
      // Concurrent conversion request for the same guest raced us —
      // Postgres aborts the transaction; look up the winner fresh.
      const dup = await db.query(`SELECT * FROM smokecraft_guest_conversions WHERE guest_reference = $1`, [guestReference])
      return { ok: true, alreadyConverted: true, conversion: dup.rows[0] }
    }
    throw err
  } finally {
    client.release()
  }
}

/**
 * Holistic Fix 5A — authoritative leaderboard. Derives entirely from
 * real server data (smokecraft_player_state + a completed-session
 * count from smokecraft_session_completions + badge count from
 * smokecraft_awards) — no mock/hardcoded entries. Only guests with an
 * explicit eligibility row marked eligible=true (or no row at all —
 * defaults to eligible, matching the pre-existing product behavior of
 * showing all active guests, per smokecraft_leaderboard_eligibility's
 * DEFAULT true) appear. Tie-break: xp_total DESC, then completed-
 * session count DESC (more genuine gameplay activity ranks higher on a
 * tie), then guest_reference ASC (fully deterministic, never
 * order-unstable across repeated identical queries).
 */
export async function getLeaderboard({ limit = 50, offset = 0, venueId = null, viewerGuestReference = null } = {}) {
  const db = dbOrThrow()
  const params = [limit, offset]
  let venueFilter = ''
  if (venueId) { params.push(venueId); venueFilter = `AND (le.venue_id = $${params.length} OR le.venue_id IS NULL)` }
  const result = await db.query(
    `SELECT
       ps.guest_reference,
       ps.xp_total,
       ps.rank_label,
       COALESCE(le.display_name, 'Guest ' || RIGHT(ps.guest_reference, 4)) AS display_name,
       (SELECT COUNT(*) FROM smokecraft_session_completions sc WHERE sc.guest_reference = ps.guest_reference) AS completed_session_count,
       (SELECT COUNT(*) FROM smokecraft_awards a WHERE a.guest_reference = ps.guest_reference AND a.award_type = 'badge') AS badge_count
     FROM smokecraft_player_state ps
     LEFT JOIN smokecraft_leaderboard_eligibility le ON le.guest_reference = ps.guest_reference
     WHERE COALESCE(le.eligible, true) = true
       AND ps.xp_total > 0
       ${venueFilter}
     ORDER BY ps.xp_total DESC, completed_session_count DESC, ps.guest_reference ASC
     LIMIT $1 OFFSET $2`,
    params
  )
  // guest_reference is used only for the viewer-match comparison below and
  // is never included in the returned payload — the public leaderboard
  // response exposes no raw identity, only the opt-in display_name.
  return result.rows.map((r, i) => ({
    position: offset + i + 1,
    displayName: r.display_name,
    xpTotal: r.xp_total,
    rankLabel: r.rank_label,
    completedSessionCount: Number(r.completed_session_count),
    badgeCount: Number(r.badge_count),
    isCurrentUser: viewerGuestReference != null && r.guest_reference === viewerGuestReference,
  }))
}

/** Sets a guest's leaderboard display name, eligibility, and/or venue scope (self-service, own identity only — enforced by the caller passing only their own guestReference). */
export async function setLeaderboardPreference({ guestReference, displayName, eligible, venueId }) {
  const db = dbOrThrow()
  await db.query(
    `INSERT INTO smokecraft_leaderboard_eligibility (guest_reference, display_name, eligible, venue_id)
     VALUES ($1, $2, COALESCE($3, true), $4)
     ON CONFLICT (guest_reference) DO UPDATE SET
       display_name = COALESCE(EXCLUDED.display_name, smokecraft_leaderboard_eligibility.display_name),
       eligible = COALESCE(EXCLUDED.eligible, smokecraft_leaderboard_eligibility.eligible),
       venue_id = COALESCE(EXCLUDED.venue_id, smokecraft_leaderboard_eligibility.venue_id),
       updated_at = now()`,
    [guestReference, displayName || null, eligible === undefined ? null : eligible, venueId || null]
  )
}
