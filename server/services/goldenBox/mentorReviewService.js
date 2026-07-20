/**
 * Package 7A — mentor review for Golden Box entries. Structurally
 * separate from official scoring (golden_box_scores) — same isolation
 * pattern as golden_box_ai_analyses. Authorization (is this user really
 * a mentor, does the entry belong to a competition they can review) is
 * enforced by the controller via requireMentor + entry lookup.
 */
import { getDb } from '../../db/connection.js'
import { logActivity } from './activityLogService.js'

export class MentorReviewError extends Error {
  constructor(code) { super(code); this.code = code }
}

const FIELDS = [
  'readiness_status', 'strengths', 'component_feedback', 'construction_feedback',
  'flavor_feedback', 'pairing_feedback', 'presentation_feedback', 'common_mistakes',
  'improvement_areas', 'questions_for_learner', 'final_guidance',
]

function toSnakeFields(payload) {
  const out = {}
  for (const f of FIELDS) {
    const camel = f.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
    if (payload[camel] !== undefined) out[f] = payload[camel]
  }
  return out
}

export async function saveDraft(entryId, mentorUserId, payload) {
  const db = getDb()
  const fields = toSnakeFields(payload)
  const { rows: existing } = await db.query(
    `SELECT * FROM golden_box_mentor_reviews WHERE entry_id = $1 AND mentor_user_id = $2 AND status = 'draft'`,
    [entryId, mentorUserId]
  )
  if (existing[0]) {
    const setClauses = Object.keys(fields).map((k, i) => `${k} = $${i + 3}`).join(', ')
    if (!setClauses) return existing[0]
    const { rows } = await db.query(
      `UPDATE golden_box_mentor_reviews SET ${setClauses}, updated_at = now() WHERE entry_id = $1 AND mentor_user_id = $2 AND status = 'draft' RETURNING *`,
      [entryId, mentorUserId, ...Object.values(fields)]
    )
    return rows[0]
  }
  const cols = ['entry_id', 'mentor_user_id', ...Object.keys(fields)]
  const placeholders = cols.map((_, i) => `$${i + 1}`).join(',')
  const { rows } = await db.query(
    `INSERT INTO golden_box_mentor_reviews (${cols.join(',')}) VALUES (${placeholders}) RETURNING *`,
    [entryId, mentorUserId, ...Object.values(fields)]
  )
  return rows[0]
}

export async function submitReview(entryId, mentorUserId, actorId) {
  const db = getDb()
  const { rows } = await db.query(
    `UPDATE golden_box_mentor_reviews SET status = 'submitted', submitted_at = now(), updated_at = now()
     WHERE entry_id = $1 AND mentor_user_id = $2 AND status = 'draft' RETURNING *`,
    [entryId, mentorUserId]
  )
  if (!rows[0]) throw new MentorReviewError('no_draft_review_to_submit')
  await logActivity({ entryId, actorId, action: 'mentor_review_submitted', metadata: { mentorUserId } })
  return rows[0]
}

// Entrant-visible reads only ever return submitted reviews — a mentor's
// in-progress draft is never shown to the learner.
export async function getReviewsForEntrant(entryId) {
  const db = getDb()
  const { rows } = await db.query(
    `SELECT id, entry_id, mentor_user_id, readiness_status, strengths, component_feedback,
            construction_feedback, flavor_feedback, pairing_feedback, presentation_feedback,
            common_mistakes, improvement_areas, questions_for_learner, final_guidance, submitted_at
     FROM golden_box_mentor_reviews WHERE entry_id = $1 AND status IN ('submitted', 'amended') ORDER BY submitted_at DESC`,
    [entryId]
  )
  return rows
}

export async function getOwnDraft(entryId, mentorUserId) {
  const db = getDb()
  const { rows } = await db.query(
    `SELECT * FROM golden_box_mentor_reviews WHERE entry_id = $1 AND mentor_user_id = $2 AND status = 'draft'`,
    [entryId, mentorUserId]
  )
  return rows[0] || null
}
