/**
 * Required-Interaction Closure Package B — server-authoritative
 * multi-category scorecard evaluation for Session 19 (Rate Every
 * Category, sessionId='scorecard').
 *
 * Reuses the exact same append-only, idempotent evidence ledger
 * (smokecraft_activity_attempts) established by Package A
 * (tastingObservationService.js) — a different activity_type on the
 * SAME shared table, not a second competing persistence system — and
 * the exact same server-authoritative draft table/routes
 * (smokecraft_tasting_drafts, activityKey='scorecard') already used by
 * Mini Tasting and Sessions 8/12/16.
 *
 * A cigar-quality rating is inherently subjective — there is no
 * objectively "correct" appearance/draw/burn score to grade against, so
 * "server evaluation" here means the same thing Package A's tasting-
 * observation evidence means: the server independently validates that
 * a complete, well-formed, in-range rating was actually submitted
 * (rather than trusting a client-computed "done" flag) before granting
 * completion. The server also independently computes the weighted
 * overall score — the client never gets to submit its own "overall" or
 * "passed" value.
 *
 * This function intentionally awards NO XP of its own (xp_awarded
 * stays 0) — session-level XP remains solely owned by
 * completeSession()/sessionRewardTable.js, exactly as Package A.
 */
import { getDb } from '../../db/connection.js'

export class ScorecardError extends Error {
  constructor(code) { super(code); this.code = code }
}

const UNIQUE_VIOLATION = '23505'
const ACTIVITY_TYPE = 'scorecard'
const ACTIVITY_KEY = 'scorecard'
const SESSION_ID = 'scorecard'

// The server's own copy of the real rating categories rendered
// client-side in Scorecard.jsx — a rating for a category not in this
// list, or outside 1-5, is never trusted as real evidence.
export const SCORECARD_CATEGORIES = Object.freeze(['appearance', 'construction', 'draw', 'burn', 'flavor', 'pairing'])

// Same weighting the app's existing (now-superseded) in-memory
// scorecard route already used (server/routes/smokecraftScorecardRoutes.js)
// — reused as the one canonical weighting, not reinvented.
const WEIGHTS = Object.freeze({ flavor: 0.30, draw: 0.20, burn: 0.15, construction: 0.15, appearance: 0.10, pairing: 0.10 })

const META_FIELDS = {
  durationMinutes: { min: 0, max: 1440 },
  puffCount: { min: 0, max: 2000 },
  relightCount: { min: 0, max: 50 },
}
const DRAFT_ALLOWED_FIELDS = new Set(['categories', 'personalNotes', 'meta'])

function computeOverall(categories) {
  let total = 0, totalWeight = 0
  for (const [key, weight] of Object.entries(WEIGHTS)) {
    const val = categories[key]
    if (typeof val === 'number' && val > 0) { total += val * weight; totalWeight += weight }
  }
  if (totalWeight === 0) return null
  return Math.round((total / totalWeight) * 100) / 100
}

function isValidCategoryValue(v) {
  return v === null || v === undefined || (Number.isInteger(v) && v >= 1 && v <= 5)
}

function isValidMetaValue(key, v) {
  if (v === null || v === undefined) return true
  const range = META_FIELDS[key]
  return range && Number.isInteger(v) && v >= range.min && v <= range.max
}

function validateCategoriesObject(categories) {
  if (typeof categories !== 'object' || categories === null || Array.isArray(categories)) return false
  const keys = Object.keys(categories)
  if (!keys.every(k => SCORECARD_CATEGORIES.includes(k))) return false
  return keys.every(k => isValidCategoryValue(categories[k]))
}

function validateMetaObject(meta) {
  if (meta === undefined) return true
  if (typeof meta !== 'object' || meta === null || Array.isArray(meta)) return false
  const keys = Object.keys(meta)
  if (!keys.every(k => k in META_FIELDS)) return false
  return keys.every(k => isValidMetaValue(k, meta[k]))
}

/**
 * Package B draft-persistence — narrow, session-scoped validation for
 * the shared smokecraft_tasting_drafts table, same pattern as Package
 * A's validateTastingDraftPayload. Only applies when activityKey is
 * 'scorecard'; every other activityKey is untouched.
 */
export function validateScorecardDraftPayload(activityKey, draftData) {
  if (activityKey !== ACTIVITY_KEY) return { ok: true }
  if (typeof draftData !== 'object' || draftData === null || Array.isArray(draftData)) {
    return { ok: false, error: 'draft_data_object_required' }
  }
  const keys = Object.keys(draftData)
  if (!keys.every(k => DRAFT_ALLOWED_FIELDS.has(k))) {
    return { ok: false, error: 'unknown_draft_field' }
  }
  if (draftData.categories !== undefined && !validateCategoriesObject(draftData.categories)) {
    return { ok: false, error: 'invalid_category_value' }
  }
  if (draftData.personalNotes !== undefined && draftData.personalNotes !== null) {
    if (typeof draftData.personalNotes !== 'string') return { ok: false, error: 'invalid_personal_notes' }
    if (draftData.personalNotes.length > 2000) return { ok: false, error: 'personal_notes_too_long' }
  }
  if (!validateMetaObject(draftData.meta)) {
    return { ok: false, error: 'invalid_meta_value' }
  }
  return { ok: true }
}

export async function submitScorecardCompletion({ guestReference, venueId, categories, personalNotes, meta, idempotencyKey, sourceRoute, requestId, deviceId }) {
  if (!validateCategoriesObject(categories)) {
    throw new ScorecardError('invalid_category_value')
  }
  const missing = SCORECARD_CATEGORIES.filter(c => categories[c] === null || categories[c] === undefined)
  if (missing.length > 0) {
    throw new ScorecardError('all_categories_required')
  }
  if (personalNotes != null && typeof personalNotes !== 'string') {
    throw new ScorecardError('invalid_personal_notes')
  }
  if (typeof personalNotes === 'string' && personalNotes.length > 2000) {
    throw new ScorecardError('personal_notes_too_long')
  }
  if (!validateMetaObject(meta)) {
    throw new ScorecardError('invalid_meta_value')
  }

  const overall = computeOverall(categories)
  const db = getDb()

  const existing = await db.query(
    `SELECT * FROM smokecraft_activity_attempts WHERE guest_reference = $1 AND activity_type = $2 AND activity_key = $3`,
    [guestReference, ACTIVITY_TYPE, ACTIVITY_KEY]
  )
  if (existing.rows.length > 0) {
    return { ok: true, alreadyRecorded: true, attempt: existing.rows[0], overall: existing.rows[0].evidence?.overall ?? overall }
  }

  try {
    const inserted = await db.query(
      `INSERT INTO smokecraft_activity_attempts
         (guest_reference, activity_type, activity_key, evidence, xp_awarded, idempotency_key, source_route, request_id, device_id)
       VALUES ($1, $2, $3, $4, 0, $5, $6, $7, $8)
       RETURNING *`,
      [guestReference, ACTIVITY_TYPE, ACTIVITY_KEY, JSON.stringify({ categories, overall, personalNotes: personalNotes || null, meta: meta || null }), idempotencyKey, sourceRoute || null, requestId || null, deviceId || null]
    )
    return { ok: true, alreadyRecorded: false, attempt: inserted.rows[0], overall }
  } catch (err) {
    if (err.code === UNIQUE_VIOLATION) {
      const dup = await db.query(
        `SELECT * FROM smokecraft_activity_attempts WHERE guest_reference = $1 AND activity_type = $2 AND activity_key = $3`,
        [guestReference, ACTIVITY_TYPE, ACTIVITY_KEY]
      )
      return { ok: true, alreadyRecorded: true, attempt: dup.rows[0], overall: dup.rows[0]?.evidence?.overall ?? overall }
    }
    throw err
  }
}

/**
 * Called from playerStateService.completeSession() before it completes
 * the 'scorecard' session — returns true only if a real, complete,
 * server-recorded scorecard already exists for this guest. Every other
 * sessionId is unaffected (always returns true).
 */
export async function hasScorecardEvidence(guestReference, sessionId) {
  if (sessionId !== SESSION_ID) return true
  const db = getDb()
  const { rows } = await db.query(
    `SELECT 1 FROM smokecraft_activity_attempts WHERE guest_reference = $1 AND activity_type = $2 AND activity_key = $3`,
    [guestReference, ACTIVITY_TYPE, ACTIVITY_KEY]
  )
  return rows.length > 0
}
