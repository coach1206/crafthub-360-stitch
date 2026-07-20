import { getDb } from '../../db/connection.js'
import { logActivity } from './activityLogService.js'

export class CompetitionError extends Error {
  constructor(code) { super(code); this.code = code }
}

const SCOPES = new Set(['global', 'venue', 'cohort', 'event', 'private_invitation'])

export async function createCompetition({ competitionKey, title, description, scope, scopeVenueId, scopeCohortId, scopeEventId, maxEntriesPerEntrant, blindJudging, createdBy }) {
  if (!SCOPES.has(scope)) throw new CompetitionError('invalid_scope')
  if (scope === 'venue' && !scopeVenueId) throw new CompetitionError('scope_venue_id_required')
  const db = getDb()
  const { rows } = await db.query(
    `INSERT INTO golden_box_competitions
       (competition_key, title, description, scope, scope_venue_id, scope_cohort_id, scope_event_id, max_entries_per_entrant, blind_judging, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [competitionKey, title, description || null, scope, scopeVenueId || null, scopeCohortId || null,
     scopeEventId || null, maxEntriesPerEntrant || 1, blindJudging !== false, createdBy]
  )
  await logActivity({ competitionId: rows[0].id, actorId: createdBy, action: 'competition_created' })
  return rows[0]
}

export async function getCompetition(competitionId) {
  const db = getDb()
  const { rows } = await db.query(`SELECT * FROM golden_box_competitions WHERE id = $1`, [competitionId])
  return rows[0] || null
}

export async function listCompetitions({ scope, scopeVenueId, status } = {}) {
  const db = getDb()
  const clauses = []
  const values = []
  if (scope) { values.push(scope); clauses.push(`scope = $${values.length}`) }
  if (scopeVenueId) { values.push(scopeVenueId); clauses.push(`scope_venue_id = $${values.length}`) }
  if (status) { values.push(status); clauses.push(`status = $${values.length}`) }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
  const { rows } = await db.query(`SELECT * FROM golden_box_competitions ${where} ORDER BY created_at DESC`, values)
  return rows
}

export async function isInvitedEntrant(competitionId, identity) {
  const db = getDb()
  const { rows } = await db.query(
    `SELECT 1 FROM golden_box_competition_invitations
     WHERE competition_id = $1 AND (invited_user_id = $2 OR invited_guest_reference = $3)`,
    [competitionId, identity.userId || null, identity.guestReference || null]
  )
  return rows.length > 0
}
