/**
 * Package 1 — single central lifecycle-transition service (Step 3).
 * All competition/entry/scorecard status mutations go through here so
 * invalid transitions cannot happen silently from a route file.
 */
import { getDb } from '../../db/connection.js'
import { logActivity } from './activityLogService.js'

export class LifecycleError extends Error {
  constructor(code) { super(code); this.code = code }
}

const COMPETITION_TRANSITIONS = {
  draft: ['scheduled', 'cancelled'],
  scheduled: ['registration_open', 'cancelled'],
  registration_open: ['registration_closed', 'cancelled'],
  registration_closed: ['active', 'cancelled'],
  active: ['submission_closed', 'cancelled'],
  submission_closed: ['judging', 'cancelled'],
  judging: ['results_pending', 'cancelled'],
  results_pending: ['completed', 'cancelled'],
  completed: ['archived'],
  cancelled: ['archived'],
  archived: [],
}

// Note: 'draft'/'incomplete' -> 'submitted' is allowed directly rather
// than forcing every entry through an 'eligible' status transition first
// — eligibility is evaluated and recorded (golden_box_eligibility_results)
// as its own advisory signal (Step 7), while the real submission gate is
// entryService.submitEntry's own component-completeness validation
// (Step 8). Competitions that require pre-submission eligibility
// enforcement should call the eligibility endpoint and check `.eligible`
// in the caller before allowing the submit action to be reachable at all
// — the same "server computes, client displays" pattern used throughout
// this codebase, not a state-machine block.
const ENTRY_TRANSITIONS = {
  draft: ['incomplete', 'eligible', 'ineligible', 'submitted', 'withdrawn'],
  incomplete: ['draft', 'eligible', 'ineligible', 'submitted', 'withdrawn'],
  eligible: ['submitted', 'withdrawn'],
  ineligible: ['eligible', 'withdrawn'],
  submitted: ['locked', 'withdrawn', 'disqualified'],
  locked: ['under_review', 'disqualified'],
  under_review: ['finalist', 'not_selected', 'disqualified'],
  finalist: ['winner', 'not_selected', 'disqualified'],
  winner: [],
  not_selected: [],
  withdrawn: [],
  disqualified: [],
}

const SCORECARD_TRANSITIONS = {
  draft: ['submitted', 'voided'],
  submitted: ['locked', 'amended', 'voided'],
  locked: ['amended'],
  amended: ['locked'],
  voided: [],
}

async function transition(table, idColumn, id, transitions, toStatus, actorId, extra = {}) {
  const db = getDb()
  const { rows } = await db.query(`SELECT status FROM ${table} WHERE ${idColumn} = $1`, [id])
  const current = rows[0]
  if (!current) throw new LifecycleError('record_not_found')
  const allowed = transitions[current.status] || []
  if (!allowed.includes(toStatus)) {
    throw new LifecycleError(`invalid_transition_from_${current.status}_to_${toStatus}`)
  }
  const extraCols = Object.keys(extra)
  const setParts = ['status = $2']
  const values = [id, toStatus]
  extraCols.forEach((col) => { values.push(extra[col]); setParts.push(`${col} = $${values.length}`) })
  const { rows: updated } = await db.query(
    `UPDATE ${table} SET ${setParts.join(', ')} WHERE ${idColumn} = $1 RETURNING *`,
    values
  )
  await logActivity({ actorId, action: `${table}_transition_${current.status}_to_${toStatus}` })
  return updated[0]
}

export const transitionCompetition = (id, toStatus, actorId) =>
  transition('golden_box_competitions', 'id', id, COMPETITION_TRANSITIONS, toStatus, actorId, { updated_at: new Date() })

export const transitionEntry = (entryId, toStatus, actorId, extra = {}) =>
  transition('golden_box_entries', 'entry_id', entryId, ENTRY_TRANSITIONS, toStatus, actorId, { updated_at: new Date(), ...extra })

export const transitionScorecard = (id, toStatus, actorId) =>
  transition('golden_box_scorecards', 'id', id, SCORECARD_TRANSITIONS, toStatus, actorId)

export { COMPETITION_TRANSITIONS, ENTRY_TRANSITIONS, SCORECARD_TRANSITIONS }
