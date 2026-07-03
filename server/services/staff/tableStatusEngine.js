/**
 * Table Status Engine
 * Tracks table statuses across the venue floor in preview-safe mode.
 * Does not claim live table status unless database proof exists.
 */

import { v4 as uuidv4 } from 'uuid'

const TABLE_STATUS_STORE = new Map()
const STATUS_EVENT_STORE = new Map()
const dbAvailable = () => !!process.env.DATABASE_URL
const now = () => new Date().toISOString()

const VALID_TABLE_STATUSES = new Set([
  'table_assignment_pending', 'open', 'seated', 'ordering', 'ordered',
  'preparing', 'ready', 'served', 'check_requested', 'closed',
  'unavailable', 'reserved_preview',
])

function _ensureTableStatus(venueId, tableId) {
  const key = `${venueId}:${tableId}`
  if (!TABLE_STATUS_STORE.has(key)) {
    TABLE_STATUS_STORE.set(key, {
      venue_id:     venueId,
      table_id:     tableId,
      table_status: 'table_assignment_pending',
      server_id:    null,
      order_id:     null,
      seated_at:    null,
      updated_at:   now(),
    })
  }
  return TABLE_STATUS_STORE.get(key)
}

export function getTableStatus(venueId, tableId) {
  const record = TABLE_STATUS_STORE.get(`${venueId}:${tableId}`)
  if (!record) return { ok: false, tableStatus: 'table_assignment_pending', tableId }
  return { ok: true, tableId, venueId, tableStatus: record.table_status, record }
}

export function updateTableStatusPreview(venueId, tableId, newStatus, actorContext = {}) {
  if (!VALID_TABLE_STATUSES.has(newStatus))
    return { ok: false, error: `invalid_table_status: ${newStatus}`, validStatuses: [...VALID_TABLE_STATUSES] }

  const record = _ensureTableStatus(venueId, tableId)
  const fromStatus = record.table_status
  record.table_status = newStatus
  record.server_id    = actorContext.server_id ?? record.server_id
  record.order_id     = actorContext.order_id ?? record.order_id
  if (newStatus === 'seated') record.seated_at = now()
  record.updated_at = now()
  TABLE_STATUS_STORE.set(`${venueId}:${tableId}`, record)

  const event = buildTableStatusEvent(venueId, tableId, fromStatus, newStatus, actorContext)
  STATUS_EVENT_STORE.set(event.event_id, event)

  return {
    ok: true, tableId, venueId,
    fromStatus, toStatus: newStatus,
    tableStatus:       newStatus,
    tableStatusNote:   'Table status updated in preview mode.',
    persistenceStatus: dbAvailable() ? 'database_required' : 'not_persisted',
  }
}

export function getVenueTableStatusBoard(venueId, filters = {}) {
  const board = []
  for (const [key, record] of TABLE_STATUS_STORE.entries()) {
    if (!key.startsWith(`${venueId}:`)) continue
    if (filters.table_status && record.table_status !== filters.table_status) continue
    board.push(record)
  }
  return {
    ok: true, venueId,
    tableStatusBoard:  board,
    count:             board.length,
    tableStatusNote:   'Table status board is a preview. Not live.',
    persistenceStatus: dbAvailable() ? 'database_required' : 'not_persisted',
  }
}

export function buildTableStatusEvent(venueId, tableId, fromStatus, toStatus, actorContext = {}) {
  return {
    event_id:    uuidv4(),
    venue_id:    venueId,
    table_id:    tableId,
    from_status: fromStatus ?? null,
    to_status:   toStatus,
    event_status: 'status_preview',
    actor_id:    actorContext.actor_id ?? null,
    actor_role:  actorContext.actor_role ?? 'staff',
    metadata:    actorContext.metadata ?? {},
    created_at:  now(),
  }
}

export function getTableStatusEvents(venueId, tableId) {
  const events = []
  for (const e of STATUS_EVENT_STORE.values()) {
    if (e.venue_id !== venueId) continue
    if (tableId && e.table_id !== tableId) continue
    events.push(e)
  }
  return { ok: true, events, count: events.length, venueId }
}

export function getTableStatusReadiness(venueId) {
  const board = []
  for (const [key, record] of TABLE_STATUS_STORE.entries()) {
    if (key.startsWith(`${venueId}:`)) board.push(record)
  }
  return {
    ok:                true,
    venueId,
    tableCount:        board.length,
    tableStatusNote:   'Table status engine is in preview mode.',
    blockers:          board.length === 0 ? [{ type: 'no_tables_configured', severity: 'warning' }] : [],
    persistenceStatus: dbAvailable() ? 'database_required' : 'not_persisted',
  }
}
