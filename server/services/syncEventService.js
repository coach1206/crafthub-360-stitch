/**
 * Sync Event Service — Phase 6B
 * Backend event store for internal multi-device sync (POS3/E.A.T./SmokeCraft/Passport).
 *
 * NOT the third-party POS provider bridge (pos3IntegrationService.js) —
 * that framework is unrelated and is not reused here (Phase 6 finding).
 *
 * Honesty rule (Phase 6B task #6): if the database is unavailable, this
 * service NEVER claims an event was synced. There is no in-memory fallback
 * standing in for durable storage — callers receive a clear degraded-mode
 * result and must retry later via the client outbox (Phase 6A, Section G).
 */

import { query, isDbAvailable } from '../db/connection.js'

export const VALID_SOURCE_SYSTEMS = [
  'POS3', 'EAT', 'KITCHEN', 'BAR', 'HUMIDOR', 'INVENTORY', 'SMOKECRAFT', 'PASSPORT',
]

// Source systems that represent staff/E.A.T./operational POS actions.
export const STAFF_SOURCE_SYSTEMS = ['POS3', 'EAT', 'KITCHEN', 'BAR', 'HUMIDOR', 'INVENTORY']

// Source systems that represent guest-facing flows with no backend identity,
// mirroring the existing passportRoutes.js / smokecraftOrders.js design
// (capability-scoped by passportId/sessionId, not by JWT — Phase 4 finding).
export const GUEST_SOURCE_SYSTEMS = ['SMOKECRAFT', 'PASSPORT']

const QUEUE_TABLES = { KITCHEN: 'kitchen_queue', BAR: 'bar_queue', HUMIDOR: 'humidor_queue' }

export class DbUnavailableError extends Error {
  constructor() {
    super('Database unavailable — sync degraded')
    this.code = 'DB_UNAVAILABLE'
  }
}

function assertDb() {
  if (!isDbAvailable()) throw new DbUnavailableError()
}

/** Validates the minimal shape of an inbound SyncEvent (Phase 6A, Section D). */
export function validateEventShape(evt) {
  if (!evt || typeof evt !== 'object') return 'Event must be an object'
  if (!evt.eventId) return 'eventId is required'
  if (!VALID_SOURCE_SYSTEMS.includes(evt.sourceSystem)) return `Unknown sourceSystem: ${evt.sourceSystem}`
  if (!evt.eventType) return 'eventType is required'
  if (!evt.clientCreatedAt) return 'clientCreatedAt is required'
  return null
}

/**
 * Inserts one event idempotently. On a duplicate eventId, returns the
 * existing row (with duplicate: true) instead of erroring or re-applying
 * side effects — Phase 6A Section H ("eventId uniqueness").
 * Throws DbUnavailableError if no DB connection exists — never silently
 * pretends success.
 */
export async function recordEvent(evt, { sourceDeviceId, userId = null, userRole = null }) {
  assertDb()

  const existing = await query(`SELECT * FROM sync_events WHERE event_id = $1`, [evt.eventId])
  if (existing.rows.length > 0) {
    return { event: existing.rows[0], duplicate: true }
  }

  const inserted = await query(
    `INSERT INTO sync_events
       (event_id, source_device_id, source_system, event_type, entity_id,
        payload, sync_status, client_created_at, created_by_user_id, created_by_role)
     VALUES ($1,$2,$3,$4,$5,$6,'synced',$7,$8,$9)
     ON CONFLICT (event_id) DO NOTHING
     RETURNING *`,
    [
      evt.eventId, sourceDeviceId, evt.sourceSystem, evt.eventType, evt.entityId || null,
      JSON.stringify(evt.payload || {}), new Date(evt.clientCreatedAt), userId, userRole,
    ]
  )

  if (inserted.rows.length === 0) {
    // Lost a race against a concurrent identical insert — treat as duplicate, not an error.
    const row = await query(`SELECT * FROM sync_events WHERE event_id = $1`, [evt.eventId])
    return { event: row.rows[0], duplicate: true }
  }

  const event = inserted.rows[0]

  try {
    await applyEvent(event)
  } catch (err) {
    await recordFailure(event.event_id, sourceDeviceId, `apply_failed: ${err.message}`, evt.payload)
  }

  return { event, duplicate: false }
}

/**
 * Projects a recorded sync_event into the relevant materialized table.
 * Stale-update guard (Phase 6A Section H, "newest timestamp wins"):
 * an event older than the entity's current updated_at is recorded for
 * audit (sync_events row already exists) but does not overwrite state —
 * it is logged to sync_failures with reason 'stale_update' instead.
 */
async function applyEvent(event) {
  const { event_id, event_type, entity_id, payload, client_created_at, source_device_id } = event
  const p = payload || {}

  switch (event_type) {
    case 'OrderCreated': {
      await query(
        `INSERT INTO pos_orders (order_id, venue_id, table_id, staff_id, status, opened_at, updated_at)
         VALUES ($1,$2,$3,$4,'open',$5,$5)
         ON CONFLICT (order_id) DO NOTHING`,
        [entity_id, p.venueId || 'novee-grand-lounge', p.tableId || null, p.staffId || null, client_created_at]
      )
      await logOrderEvent(entity_id, event_id, event_type)
      break
    }
    case 'OrderUpdated': {
      const updated = await query(
        `UPDATE pos_orders SET status = COALESCE($2, status), updated_at = $3
         WHERE order_id = $1 AND updated_at <= $3
         RETURNING order_id`,
        [entity_id, p.status || null, client_created_at]
      )
      if (updated.rows.length === 0) {
        await recordFailure(event_id, source_device_id, 'stale_update', p)
      }
      if (Array.isArray(p.items)) {
        for (const item of p.items) {
          await query(
            `INSERT INTO pos_order_items (order_id, item_id, name, qty, price, status)
             VALUES ($1,$2,$3,$4,$5,$6)`,
            [entity_id, item.id, item.name || null, item.qty || 1, item.price || null, item.status || 'ordered']
          )
        }
      }
      await logOrderEvent(entity_id, event_id, event_type)
      break
    }
    case 'OrderClosed': {
      await query(
        `UPDATE pos_orders SET status = 'closed', closed_at = $2, updated_at = $2 WHERE order_id = $1`,
        [entity_id, client_created_at]
      )
      await logOrderEvent(entity_id, event_id, event_type)
      break
    }
    case 'ReceiptGenerated': {
      await logOrderEvent(entity_id, event_id, event_type)
      break
    }
    case 'KitchenAccepted':
    case 'KitchenCompleted':
    case 'BarAccepted':
    case 'BarCompleted':
    case 'HumidorAccepted':
    case 'HumidorCompleted': {
      const station = event_type.startsWith('Kitchen') ? 'KITCHEN'
        : event_type.startsWith('Bar') ? 'BAR' : 'HUMIDOR'
      const table = QUEUE_TABLES[station]
      const status = event_type.endsWith('Accepted') ? 'accepted' : 'completed'
      await query(
        `INSERT INTO ${table} (order_id, item_id, status, accepted_by, updated_at)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (order_id, item_id) DO UPDATE
           SET status = EXCLUDED.status, accepted_by = EXCLUDED.accepted_by, updated_at = EXCLUDED.updated_at
           WHERE ${table}.updated_at <= EXCLUDED.updated_at`,
        [entity_id, p.itemId || null, status, p.staffId || null, client_created_at]
      )
      break
    }
    case 'InventoryAdjusted':
    case 'ReorderRequested': {
      await query(
        `INSERT INTO inventory_events (event_id, sku, delta, reason) VALUES ($1,$2,$3,$4)`,
        [event_id, p.sku || entity_id, p.delta || 0, p.reason || event_type]
      )
      break
    }
    case 'SmokeCraftStarted':
    case 'SmokeCraftCompleted': {
      await query(
        `INSERT INTO smokecraft_events (event_id, session_id, event_type, payload) VALUES ($1,$2,$3,$4)`,
        [event_id, entity_id, event_type, JSON.stringify(p)]
      )
      break
    }
    case 'PassportStampAwarded':
    case 'MentorAssigned': {
      await query(
        `INSERT INTO passport_events (event_id, passport_id, event_type, payload) VALUES ($1,$2,$3,$4)`,
        [event_id, entity_id, event_type, JSON.stringify(p)]
      )
      break
    }
    default:
      await recordFailure(event_id, source_device_id, `unknown_event_type: ${event_type}`, p)
  }
}

async function logOrderEvent(orderId, eventId, eventType) {
  if (!orderId) return
  await query(
    `INSERT INTO pos_order_events (order_id, event_id, event_type) VALUES ($1,$2,$3)`,
    [orderId, eventId, eventType]
  )
}

export async function recordFailure(eventId, sourceDeviceId, reason, payload) {
  if (!isDbAvailable()) return
  await query(
    `INSERT INTO sync_failures (event_id, source_device_id, reason, payload) VALUES ($1,$2,$3,$4)`,
    [eventId || null, sourceDeviceId || null, reason, JSON.stringify(payload || {})]
  ).catch(() => {})
}

/** Catch-up pull — events received after `since` (ms epoch or ISO timestamp). */
export async function getEventsSince(since) {
  assertDb()
  const sinceDate = new Date(Number(since) || since)
  const result = await query(
    `SELECT * FROM sync_events WHERE received_at > $1 ORDER BY received_at ASC LIMIT 500`,
    [sinceDate]
  )
  return result.rows
}

export async function listEvents({ limit = 100, sourceSystem = null } = {}) {
  assertDb()
  if (sourceSystem) {
    const result = await query(
      `SELECT * FROM sync_events WHERE source_system = $1 ORDER BY received_at DESC LIMIT $2`,
      [sourceSystem, limit]
    )
    return result.rows
  }
  const result = await query(`SELECT * FROM sync_events ORDER BY received_at DESC LIMIT $1`, [limit])
  return result.rows
}

export async function getSyncStatus() {
  if (!isDbAvailable()) {
    return { dbAvailable: false, degraded: true, message: 'Database unavailable — sync store is offline. Events cannot be durably persisted right now.' }
  }
  const counts = await query(
    `SELECT sync_status, COUNT(*) AS count FROM sync_events GROUP BY sync_status`
  )
  const failures = await query(
    `SELECT COUNT(*) AS count FROM sync_failures WHERE resolved = FALSE`
  )
  return {
    dbAvailable: true,
    degraded: false,
    eventCounts: counts.rows.reduce((acc, r) => ({ ...acc, [r.sync_status]: Number(r.count) }), {}),
    unresolvedFailures: Number(failures.rows[0]?.count || 0),
  }
}

/**
 * Retry handler for POST /api/sync/retry — re-attempts the applier for any
 * events the client marked as previously failed-on-its-end. Idempotent via
 * the same recordEvent() insert-or-fetch-existing path; never duplicates.
 */
export async function retryEvents(events, ctx) {
  const results = []
  for (const evt of events) {
    const shapeError = validateEventShape(evt)
    if (shapeError) {
      results.push({ eventId: evt?.eventId, success: false, error: shapeError })
      continue
    }
    try {
      const { event, duplicate } = await recordEvent(evt, ctx)
      results.push({ eventId: event.event_id, success: true, duplicate })
    } catch (err) {
      results.push({ eventId: evt.eventId, success: false, error: err.message })
    }
  }
  return results
}
