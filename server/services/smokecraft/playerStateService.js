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

const UNIQUE_VIOLATION = '23505'

async function recordAudit(client, { guestReference, mutationType, idempotencyKey, outcome, rejectReason, requestId, deviceId }) {
  await client.query(
    `INSERT INTO smokecraft_award_audit
       (guest_reference, mutation_type, idempotency_key, outcome, reject_reason, request_id, device_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [guestReference, mutationType, idempotencyKey, outcome, rejectReason || null, requestId || null, deviceId || null]
  )
}

async function ensurePlayerStateRow(client, guestReference, venueId) {
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
    await recordAudit(client, { guestReference, mutationType: 'session_complete', idempotencyKey, outcome: 'applied', requestId, deviceId })
    await client.query('COMMIT')
    return { ok: true, alreadyCompleted: false, completion }
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
