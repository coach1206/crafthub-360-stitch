/**
 * Required-Interaction Closure Package A — server-authoritative
 * tasting-observation evidence for Sessions 8 (First Third), 12
 * (Second Third), and 16 (Final Third).
 *
 * Reuses the exact same append-only, idempotent evidence ledger
 * (smokecraft_activity_attempts) and validate-then-record pattern
 * already established by submitCultivatorEvidence() (Holistic Fix
 * 5A-3E) — a different activity_type on the SAME shared table, not a
 * second competing persistence system. No new migration needed.
 *
 * This function intentionally awards NO XP of its own (xp_awarded
 * stays 0) — session-level XP remains solely owned by
 * completeSession()/sessionRewardTable.js, exactly as before. This
 * function's only job is to give completeSession() something real to
 * verify before it will complete one of these three sessions — see
 * requireTastingObservationEvidence() below, called from
 * completeSession().
 */
import { getDb } from '../../db/connection.js'

export class TastingObservationError extends Error {
  constructor(code) { super(code); this.code = code }
}

const UNIQUE_VIOLATION = '23505'
const ACTIVITY_TYPE = 'tasting_observation'

// The server's own copy of each session's real, selectable observation
// vocabulary — mirrors the exact EXPLORE_ZONES/flavor ids already
// rendered client-side in FirstThird.jsx/SecondThird.jsx/FinalThird.jsx.
// A submitted note id not in this list is rejected — the server never
// trusts an arbitrary client-supplied id as real evidence, the same
// principle submitTastingCompletion() already applies to selectedCigarId.
const VALID_NOTE_IDS = {
  'first-third': new Set(['Aroma Opening', 'Draw Ease', 'Body Start', 'Flavor Notes', 'Burn Line', 'Ash Quality']),
  'second-third': new Set(['Flavor Development', 'Body Evolution', 'Aroma Depth', 'Burn Stability', 'Smoke Texture', 'Complexity Shift']),
  'final-third': new Set([
    'aroma-strength', 'flavor-intensity', 'burn-quality', 'aftertaste',
    'earth', 'leather', 'wood', 'spice', 'coffee', 'cocoa',
  ]),
}

export const TASTING_OBSERVATION_SESSIONS = Object.freeze(Object.keys(VALID_NOTE_IDS))

export async function submitTastingObservation({ guestReference, venueId, sessionId, notesSelected, personalNotes, idempotencyKey, sourceRoute, requestId, deviceId }) {
  const validIds = VALID_NOTE_IDS[sessionId]
  if (!validIds) throw new TastingObservationError('unsupported_session')
  if (!Array.isArray(notesSelected) || notesSelected.length === 0) {
    throw new TastingObservationError('at_least_one_observation_required')
  }
  const deduped = [...new Set(notesSelected)]
  if (!deduped.every(id => validIds.has(id))) {
    throw new TastingObservationError('invalid_observation_id')
  }
  if (personalNotes != null && typeof personalNotes !== 'string') {
    throw new TastingObservationError('invalid_personal_notes')
  }
  if (typeof personalNotes === 'string' && personalNotes.length > 2000) {
    throw new TastingObservationError('personal_notes_too_long')
  }

  const db = getDb()

  const existing = await db.query(
    `SELECT * FROM smokecraft_activity_attempts WHERE guest_reference = $1 AND activity_type = $2 AND activity_key = $3`,
    [guestReference, ACTIVITY_TYPE, sessionId]
  )
  if (existing.rows.length > 0) {
    return { ok: true, alreadyRecorded: true, attempt: existing.rows[0] }
  }

  try {
    const inserted = await db.query(
      `INSERT INTO smokecraft_activity_attempts
         (guest_reference, activity_type, activity_key, evidence, xp_awarded, idempotency_key, source_route, request_id, device_id)
       VALUES ($1, $2, $3, $4, 0, $5, $6, $7, $8)
       RETURNING *`,
      [guestReference, ACTIVITY_TYPE, sessionId, JSON.stringify({ notesSelected: deduped, personalNotes: personalNotes || null }), idempotencyKey, sourceRoute || null, requestId || null, deviceId || null]
    )
    return { ok: true, alreadyRecorded: false, attempt: inserted.rows[0] }
  } catch (err) {
    if (err.code === UNIQUE_VIOLATION) {
      const dup = await db.query(
        `SELECT * FROM smokecraft_activity_attempts WHERE guest_reference = $1 AND activity_type = $2 AND activity_key = $3`,
        [guestReference, ACTIVITY_TYPE, sessionId]
      )
      return { ok: true, alreadyRecorded: true, attempt: dup.rows[0] }
    }
    throw err
  }
}

/**
 * Called from playerStateService.completeSession() before it completes
 * one of the three target sessions — returns true only if real,
 * server-recorded tasting evidence already exists for this guest and
 * session. Sessions outside TASTING_OBSERVATION_SESSIONS are
 * unaffected (always returns true) — this gate is additive and scoped
 * to exactly the three sessions this package targets.
 */
export async function hasTastingObservationEvidence(guestReference, sessionId) {
  if (!VALID_NOTE_IDS[sessionId]) return true
  const db = getDb()
  const { rows } = await db.query(
    `SELECT 1 FROM smokecraft_activity_attempts WHERE guest_reference = $1 AND activity_type = $2 AND activity_key = $3`,
    [guestReference, ACTIVITY_TYPE, sessionId]
  )
  return rows.length > 0
}
