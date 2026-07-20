/**
 * SmokeCraft Management Sync — journey service.
 * Uses smokecraft_management_sync_journeys (migration 074) exclusively.
 */
import { getDb } from '../../db/connection.js'

export async function getJourneyById(journeyId) {
  if (!journeyId) return null
  const db = getDb()
  if (!db) return null
  const result = await db.query(
    `SELECT * FROM smokecraft_management_sync_journeys WHERE journey_id = $1`,
    [journeyId]
  )
  return result.rows[0] || null
}

/**
 * Creates a new authoritative journey. Ownership (user_id/guest_reference)
 * and venue_id are always taken from server-verified context, never from
 * the request body.
 */
export async function createJourney({ identity, venueId, tenantId, sessionNumber, phase, sourceVersion }) {
  const db = getDb()
  if (!db) throw Object.assign(new Error('database_unavailable'), { code: 'database_unavailable' })

  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const result = await client.query(
      `INSERT INTO smokecraft_management_sync_journeys
         (tenant_id, venue_id, user_id, guest_reference, session_number, phase, status, source_version)
       VALUES ($1, $2, $3, $4, $5, $6, 'in_progress', $7)
       RETURNING *`,
      [
        tenantId,
        venueId,
        identity.type === 'user' ? identity.id : null,
        identity.type === 'user' ? `user:${identity.id}` : identity.id,
        sessionNumber,
        phase,
        sourceVersion,
      ]
    )
    await client.query('COMMIT')
    return result.rows[0]
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

/**
 * Completion is idempotent: if the journey is already 'completed', the
 * existing record is returned unchanged rather than re-processed —
 * matches the mandate's "repeated completion is idempotent" requirement
 * and prevents duplicate downstream side effects (rewards/XP/passport
 * are explicitly NOT touched by this service at all — that remains
 * frontend/GuestSessionContext-owned, per this package's scope limit).
 */
export async function completeJourney(journeyId) {
  const db = getDb()
  if (!db) throw Object.assign(new Error('database_unavailable'), { code: 'database_unavailable' })

  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const existing = await client.query(
      `SELECT * FROM smokecraft_management_sync_journeys WHERE journey_id = $1 FOR UPDATE`,
      [journeyId]
    )
    if (existing.rows.length === 0) {
      await client.query('ROLLBACK')
      return { ok: false, error: 'journey_not_found' }
    }
    const journey = existing.rows[0]
    if (journey.status === 'completed') {
      await client.query('ROLLBACK')
      return { ok: true, journey, alreadyCompleted: true }
    }
    if (journey.status === 'abandoned') {
      await client.query('ROLLBACK')
      return { ok: false, error: 'invalid_status_transition' }
    }
    const updated = await client.query(
      `UPDATE smokecraft_management_sync_journeys
          SET status = 'completed', completed_at = NOW(), updated_at = NOW()
        WHERE journey_id = $1
        RETURNING *`,
      [journeyId]
    )
    await client.query('COMMIT')
    return { ok: true, journey: updated.rows[0], alreadyCompleted: false }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}
