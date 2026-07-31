/**
 * Required-Interaction Closure Package C — server-authoritative
 * selection/sequencing/matching/hotspot evaluation for Sessions 2
 * (Humidor Match — image-based selection), 5 (Format — sequencing), 6
 * (Cut-Toast-Light — matching/classification), and 10 (Flavor Memory —
 * hotspot identification).
 *
 * Reuses the exact same append-only, idempotent evidence ledger
 * (smokecraft_activity_attempts, one activity_type per session) and
 * validate-then-record pattern established by Package A/B — a shared
 * architecture across all four interaction types, not four separate
 * progression systems. Draft persistence reuses the existing
 * smokecraft_tasting_drafts table/routes (activityKey = sessionId).
 *
 * Unlike Package A/B (inherently subjective sensory content, where
 * "evaluation" means real-vocabulary validity), Sessions 2, 5, and 6
 * have real, defensible, data-derived correct answers documented below
 * — the server independently evaluates correctness and NEVER records
 * evidence for an incorrect attempt (so completion cannot happen on a
 * wrong answer). Session 10 (Flavor Memory) is genuinely subjective
 * sensory content — see its definition below for the same principled
 * resolution already used by Package A for tasting notes.
 *
 * Every attempt (correct or not) is recorded to the existing audit
 * table (recordAudit, shared with every other mutation in this app) —
 * real attempt history without a new table.
 */
import { getDb } from '../../db/connection.js'

export class SelectionError extends Error {
  constructor(code) { super(code); this.code = code }
}

const UNIQUE_VIOLATION = '23505'

// ── Session 2 — Humidor Match: image-based selection ──────────────────
// The 3 real storage-environment zones already rendered client-side
// (HumidorMatch.jsx HUMIDOR_ZONES). Correct answer: 'virtual_humidor' —
// the only one of the three that is climate-controlled (65-70°F /
// 68-72% RH); a Dry Box and a Travel Case are real, named, INCORRECT
// long-term storage choices per the same humidor-environment knowledge
// this session's own learning objective names. Not an arbitrary pick —
// the one factually correct answer among three real, named options.
const HUMIDOR_OPTIONS = new Set(['virtual_humidor', 'dry_box', 'travel_case'])
const HUMIDOR_CORRECT = 'virtual_humidor'

// ── Session 5 — Format: sequencing ─────────────────────────────────────
// The 6 real cigar shapes already rendered client-side (Format.jsx
// FORMAT_ZONES), each with a real, documented burnTime range. Correct
// order: shortest to longest burn time, using each range's midpoint —
// derived directly from the existing content, not invented:
//   corona 35-45 (mid 40) < robusto 45-60 (mid 52.5) < toro 60-75 (mid 67.5)
//   < torpedo 70-85 (mid 77.5) < churchill 75-90 (mid 82.5) < gordo 90-120 (mid 105)
const FORMAT_IDS = ['corona', 'robusto', 'toro', 'torpedo', 'churchill', 'gordo']
const FORMAT_CORRECT_ORDER = ['corona', 'robusto', 'toro', 'torpedo', 'churchill', 'gordo']

// ── Session 6 — Cut-Toast-Light: matching/classification ──────────────
// The 3 real cut methods and their defining characteristic, condensed
// directly from the existing METHOD_TIPS content in CutToastLight.jsx
// (not invented): Straight Cut removes the full cap; V-Cut creates a
// wedge channel; Punch Cut removes a small circular plug.
const CUT_ITEM_IDS = ['straight-cut', 'v-cut', 'punch-cut']
const CUT_CATEGORY_IDS = ['full-cap-removal', 'wedge-channel', 'circular-plug']
const CUT_CORRECT_MAP = { 'straight-cut': 'full-cap-removal', 'v-cut': 'wedge-channel', 'punch-cut': 'circular-plug' }

// ── Session 10 — Flavor Memory: hotspot/visual identification ─────────
// The 8 real flavor-wheel hotspots already rendered client-side
// (FlavorMemory.jsx FLAVOR_ZONES). A specific "correct" flavor cannot
// be graded — sensory perception of a real cigar is inherently
// subjective, exactly the same principle already established for
// Package A's tasting-observation sessions (8/12/16). "Correct" here
// means the same thing it means there: a real, in-vocabulary hotspot
// selection was actually made — an out-of-vocabulary/fabricated
// hotspot id is the only thing treated as "incorrect." At least 2
// selections are required to satisfy "the required hotspot set."
const FLAVOR_HOTSPOT_IDS = new Set(['earth', 'wood', 'spice', 'cocoa', 'coffee', 'sweet', 'nuts', 'floral'])

function arraysEqual(a, b) {
  return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => v === b[i])
}

const SESSION_DEFS = {
  'humidor-match': {
    activityType: 'selection_image',
    draftAllowedFields: new Set(['selectedId']),
    validateDraft(draftData) {
      if (draftData.selectedId !== undefined && draftData.selectedId !== null && !HUMIDOR_OPTIONS.has(draftData.selectedId)) {
        return { ok: false, error: 'invalid_selection_id' }
      }
      return { ok: true }
    },
    validateSubmission(payload) {
      if (typeof payload?.selectedId !== 'string' || !HUMIDOR_OPTIONS.has(payload.selectedId)) {
        return { ok: false, error: 'invalid_selection_id' }
      }
      return { ok: true }
    },
    evaluate(payload) { return payload.selectedId === HUMIDOR_CORRECT },
  },
  format: {
    activityType: 'sequence',
    draftAllowedFields: new Set(['orderedIds']),
    validateDraft(draftData) {
      if (draftData.orderedIds !== undefined) {
        if (!Array.isArray(draftData.orderedIds) || !draftData.orderedIds.every(id => FORMAT_IDS.includes(id))) {
          return { ok: false, error: 'invalid_sequence_ids' }
        }
        if (new Set(draftData.orderedIds).size !== draftData.orderedIds.length) {
          return { ok: false, error: 'duplicate_sequence_id' }
        }
      }
      return { ok: true }
    },
    validateSubmission(payload) {
      const ids = payload?.orderedIds
      if (!Array.isArray(ids) || ids.length !== FORMAT_IDS.length) {
        return { ok: false, error: 'incomplete_sequence' }
      }
      if (!ids.every(id => FORMAT_IDS.includes(id))) {
        return { ok: false, error: 'unknown_sequence_id' }
      }
      if (new Set(ids).size !== ids.length) {
        return { ok: false, error: 'duplicate_sequence_id' }
      }
      return { ok: true }
    },
    evaluate(payload) { return arraysEqual(payload.orderedIds, FORMAT_CORRECT_ORDER) },
  },
  'cut-toast-light': {
    activityType: 'match',
    draftAllowedFields: new Set(['matches']),
    validateDraft(draftData) {
      if (draftData.matches !== undefined) {
        const v = validateMatchesShape(draftData.matches, { partial: true })
        if (!v.ok) return v
      }
      return { ok: true }
    },
    validateSubmission(payload) {
      const v = validateMatchesShape(payload?.matches, { partial: false })
      if (!v.ok) return v
      return { ok: true }
    },
    evaluate(payload) {
      return CUT_ITEM_IDS.every(item => payload.matches[item] === CUT_CORRECT_MAP[item])
    },
  },
  'flavor-memory': {
    activityType: 'hotspot',
    draftAllowedFields: new Set(['selectedHotspotIds']),
    validateDraft(draftData) {
      if (draftData.selectedHotspotIds !== undefined) {
        if (!Array.isArray(draftData.selectedHotspotIds) || !draftData.selectedHotspotIds.every(id => FLAVOR_HOTSPOT_IDS.has(id))) {
          return { ok: false, error: 'invalid_hotspot_id' }
        }
      }
      return { ok: true }
    },
    validateSubmission(payload) {
      const ids = payload?.selectedHotspotIds
      if (!Array.isArray(ids) || ids.length < 2) {
        return { ok: false, error: 'at_least_two_hotspots_required' }
      }
      const deduped = [...new Set(ids)]
      if (!deduped.every(id => FLAVOR_HOTSPOT_IDS.has(id))) {
        return { ok: false, error: 'invalid_hotspot_id' }
      }
      return { ok: true }
    },
    evaluate(payload) {
      const deduped = [...new Set(payload.selectedHotspotIds)]
      return deduped.length >= 2 && deduped.every(id => FLAVOR_HOTSPOT_IDS.has(id))
    },
  },
}

function validateMatchesShape(matches, { partial }) {
  if (typeof matches !== 'object' || matches === null || Array.isArray(matches)) {
    return { ok: false, error: 'matches_object_required' }
  }
  const keys = Object.keys(matches)
  if (!keys.every(k => CUT_ITEM_IDS.includes(k))) {
    return { ok: false, error: 'unknown_match_item' }
  }
  const values = keys.map(k => matches[k])
  if (!values.every(v => v === null || v === undefined || CUT_CATEGORY_IDS.includes(v))) {
    return { ok: false, error: 'unknown_match_category' }
  }
  const assigned = values.filter(v => v != null)
  if (new Set(assigned).size !== assigned.length) {
    return { ok: false, error: 'duplicate_match_category' }
  }
  if (!partial && (keys.length !== CUT_ITEM_IDS.length || assigned.length !== CUT_ITEM_IDS.length)) {
    return { ok: false, error: 'incomplete_matching' }
  }
  return { ok: true }
}

export const PACKAGE_C_SESSIONS = Object.freeze(Object.keys(SESSION_DEFS))

/**
 * Package C draft-persistence — narrow, session-scoped validation for
 * the shared smokecraft_tasting_drafts table, same dispatch pattern as
 * Package A/B. Only applies when activityKey is one of the 4 Package C
 * sessions; every other activityKey is untouched.
 */
export function validateSelectionDraftPayload(activityKey, draftData) {
  const def = SESSION_DEFS[activityKey]
  if (!def) return { ok: true }
  if (typeof draftData !== 'object' || draftData === null || Array.isArray(draftData)) {
    return { ok: false, error: 'draft_data_object_required' }
  }
  const keys = Object.keys(draftData)
  if (!keys.every(k => def.draftAllowedFields.has(k))) {
    return { ok: false, error: 'unknown_draft_field' }
  }
  return def.validateDraft(draftData)
}

async function recordAttemptAudit(guestReference, sessionId, correct, idempotencyKey, sourceRoute, requestId, deviceId) {
  const db = getDb()
  await db.query(
    `INSERT INTO smokecraft_award_audit (guest_reference, mutation_type, idempotency_key, outcome, reject_reason, request_id, device_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [guestReference, `selection_attempt:${sessionId}`, idempotencyKey, correct ? 'applied' : 'rejected', correct ? null : 'incorrect_attempt', requestId || null, deviceId || null]
  )
}

/**
 * Submits one player attempt for a Package C session. Always records
 * attempt history (audit row). Only records winning evidence — and
 * only then does completeSession() become able to complete this
 * session — when the attempt is actually correct; an incorrect attempt
 * changes nothing and may be retried.
 */
export async function submitSelectionAttempt({ guestReference, venueId, sessionId, payload, idempotencyKey, sourceRoute, requestId, deviceId }) {
  const def = SESSION_DEFS[sessionId]
  if (!def) throw new SelectionError('unsupported_session')
  const validation = def.validateSubmission(payload || {})
  if (!validation.ok) throw new SelectionError(validation.error)

  const db = getDb()
  const activityType = def.activityType

  const existing = await db.query(
    `SELECT * FROM smokecraft_activity_attempts WHERE guest_reference = $1 AND activity_type = $2 AND activity_key = $3`,
    [guestReference, activityType, sessionId]
  )
  if (existing.rows.length > 0) {
    return { ok: true, correct: true, alreadyRecorded: true, attempt: existing.rows[0] }
  }

  const isCorrect = def.evaluate(payload)
  await recordAttemptAudit(guestReference, sessionId, isCorrect, idempotencyKey, sourceRoute, requestId, deviceId)

  if (!isCorrect) {
    return { ok: true, correct: false, alreadyRecorded: false }
  }

  try {
    const inserted = await db.query(
      `INSERT INTO smokecraft_activity_attempts
         (guest_reference, activity_type, activity_key, evidence, xp_awarded, idempotency_key, source_route, request_id, device_id)
       VALUES ($1, $2, $3, $4, 0, $5, $6, $7, $8)
       RETURNING *`,
      [guestReference, activityType, sessionId, JSON.stringify({ payload, correct: true }), idempotencyKey, sourceRoute || null, requestId || null, deviceId || null]
    )
    return { ok: true, correct: true, alreadyRecorded: false, attempt: inserted.rows[0] }
  } catch (err) {
    if (err.code === UNIQUE_VIOLATION) {
      const dup = await db.query(
        `SELECT * FROM smokecraft_activity_attempts WHERE guest_reference = $1 AND activity_type = $2 AND activity_key = $3`,
        [guestReference, activityType, sessionId]
      )
      return { ok: true, correct: true, alreadyRecorded: true, attempt: dup.rows[0] }
    }
    throw err
  }
}

/**
 * Called from playerStateService.completeSession() before it completes
 * one of the 4 Package C sessions — returns true only if a real,
 * correct, server-recorded attempt already exists. Every other
 * sessionId is unaffected (always returns true).
 */
export async function hasSelectionEvidence(guestReference, sessionId) {
  const def = SESSION_DEFS[sessionId]
  if (!def) return true
  const db = getDb()
  const { rows } = await db.query(
    `SELECT 1 FROM smokecraft_activity_attempts WHERE guest_reference = $1 AND activity_type = $2 AND activity_key = $3`,
    [guestReference, def.activityType, sessionId]
  )
  return rows.length > 0
}
