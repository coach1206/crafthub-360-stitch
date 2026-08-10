/**
 * SmokeCraft Management Sync — management action service.
 * actor_user_id always server-derived from the resolved identity, never
 * from the request body.
 */
import { getDb } from '../../db/connection.js'

export async function createManagementAction({ venueId, journeyId, syncEventId, actorId, actionType, metadata }) {
  const db = getDb()
  if (!db) throw Object.assign(new Error('database_unavailable'), { code: 'database_unavailable' })

  const result = await db.query(
    `INSERT INTO smokecraft_management_sync_actions
       (venue_id, journey_id, sync_event_id, actor_user_id, action_type, action_status, metadata)
     VALUES ($1,$2,$3,$4,$5,'completed',$6)
     RETURNING *`,
    [venueId, journeyId || null, syncEventId || null, actorId, actionType, metadata ? JSON.stringify(metadata) : null]
  )
  return result.rows[0]
}

export async function listManagementActions(venueId) {
  const db = getDb()
  if (!db) return []
  const result = await db.query(
    `SELECT * FROM smokecraft_management_sync_actions WHERE venue_id = $1 ORDER BY created_at DESC LIMIT 100`,
    [venueId]
  )
  return result.rows
}
