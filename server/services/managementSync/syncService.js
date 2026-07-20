/**
 * SmokeCraft Management Sync — idempotent sync-event service.
 * Idempotency is enforced at the DATABASE level (unique constraint
 * uq_sms_events_idempotency on (venue_id, journey_id, destination,
 * payload_version), migration 074) — this service relies on that
 * constraint via INSERT ... ON CONFLICT, not an application-level check
 * that could race under concurrency.
 */
import crypto from 'crypto'
import { getDb } from '../../db/connection.js'

/**
 * Requests a sync for a completed journey. Only 'venue_insights' is a
 * currently supported destination (enforced upstream by validation) —
 * this service never calls or claims success for any external
 * integration (E.A.T./POS360/NOVEE OS/inventory/staff_handoff) since
 * none is verified live (SMOKECRAFT_MANAGEMENT_SYNC_DESTINATION_AUDIT.md).
 */
export async function requestManagementSync({ journey, snapshot, destination, guestReference }) {
  const db = getDb()
  if (!db) throw Object.assign(new Error('database_unavailable'), { code: 'database_unavailable' })

  if (journey.status !== 'completed') {
    return { ok: false, error: 'journey_incomplete' }
  }

  const payloadVersion = snapshot.snapshot_version
  const idempotencyKey = crypto
    .createHash('sha256')
    .update(`${journey.venue_id}:${journey.journey_id}:${destination}:${payloadVersion}`)
    .digest('hex')

  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const inserted = await client.query(
      `INSERT INTO smokecraft_management_sync_events
         (journey_id, snapshot_id, venue_id, guest_reference, destination, payload_version, idempotency_key, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'pending')
       ON CONFLICT (venue_id, journey_id, destination, payload_version) DO NOTHING
       RETURNING *`,
      [journey.journey_id, snapshot.snapshot_id, journey.venue_id, guestReference, destination, payloadVersion, idempotencyKey]
    )

    let event
    let created
    if (inserted.rows.length > 0) {
      event = inserted.rows[0]
      created = true
    } else {
      const existing = await client.query(
        `SELECT * FROM smokecraft_management_sync_events
          WHERE venue_id = $1 AND journey_id = $2 AND destination = $3 AND payload_version = $4`,
        [journey.venue_id, journey.journey_id, destination, payloadVersion]
      )
      event = existing.rows[0]
      created = false
    }

    if (created) {
      // Internal venue_insights sync is the only real, currently-supported
      // processing path — it marks the event completed immediately since
      // there is no external system to wait on (data just becomes
      // available for venue-manager read queries in a later package).
      // Any other destination would remain 'pending' forever without a
      // real integration, which is exactly the honest behavior wanted.
      if (destination === 'venue_insights') {
        const completed = await client.query(
          `UPDATE smokecraft_management_sync_events
              SET status = 'completed', started_at = NOW(), completed_at = NOW()
            WHERE event_id = $1 RETURNING *`,
          [event.event_id]
        )
        event = completed.rows[0]
      }
    }

    await client.query('COMMIT')
    return { ok: true, event, created }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

export async function getSyncStatus(journeyId) {
  const db = getDb()
  if (!db) return []
  const result = await db.query(
    `SELECT * FROM smokecraft_management_sync_events WHERE journey_id = $1 ORDER BY created_at DESC`,
    [journeyId]
  )
  return result.rows
}
