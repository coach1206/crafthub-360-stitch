/**
 * Shared, reusable progression-event log (migration 085). Real, idempotent
 * (unique on idempotency_key — a duplicate submission is a silent no-op,
 * not a second row), intended as the foundation for Skill Tree/
 * Collections/Challenge Hub event coordination in a future controlled
 * pass. This pass only writes into it from Filler Arrangement's real
 * lesson_completed/knowledge_check_submitted moments.
 */
import { getDb } from '../../db/connection.js'

export async function recordEvent({ guestReference, venueId, sourceScreen, sourceRoute, eventType, payload, idempotencyKey }) {
  const db = getDb()
  const { rows } = await db.query(
    `INSERT INTO smokecraft_progression_events
       (guest_reference, venue_id, source_screen, source_route, event_type, payload, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (idempotency_key) DO NOTHING
     RETURNING *`,
    [guestReference, venueId || null, sourceScreen, sourceRoute, eventType, payload || {}, idempotencyKey]
  )
  if (rows[0]) return { event: rows[0], deduplicated: false }
  const { rows: existing } = await db.query(
    `SELECT * FROM smokecraft_progression_events WHERE idempotency_key = $1`,
    [idempotencyKey]
  )
  return { event: existing[0], deduplicated: true }
}

export async function getEventsForGuest(guestReference, eventType) {
  const db = getDb()
  const params = [guestReference]
  let where = 'guest_reference = $1'
  if (eventType) { params.push(eventType); where += ` AND event_type = $${params.length}` }
  const { rows } = await db.query(
    `SELECT * FROM smokecraft_progression_events WHERE ${where} ORDER BY created_at DESC`,
    params
  )
  return rows
}
