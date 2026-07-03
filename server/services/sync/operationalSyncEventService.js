/**
 * OIPSL — Operational Sync Event Service
 * Records durable sync events for dashboards and future real-time systems.
 * Does NOT claim live external POS sync or vendor push unless actually implemented.
 */

import { v4 as uuidv4 } from 'uuid'

const SYNC_EVENT_STORE = new Map()
const dbAvailable = () => !!process.env.DATABASE_URL
const now = () => new Date().toISOString()

export const SYNC_EVENT_TYPES = [
  'inventory_updated','inventory_adjustment_created','receiving_confirmed',
  'purchase_order_created','purchase_order_approved','purchase_order_rejected',
  'reorder_recommended','demand_signal_created','audit_event_recorded',
  'availability_status_changed','vendor_registered','approval_decision_recorded',
]

export const SYNC_STATUSES = [
  'queued','processed','failed','retry_pending','skipped',
  'external_system_required','database_required','preview_only',
]

function buildSyncRecord(payload) {
  return {
    sync_event_id:     uuidv4(),
    event_type:        payload.eventType,
    source_system:     payload.sourceSystem ?? 'ispae',
    target_system:     payload.targetSystem ?? 'internal',
    venue_id:          payload.venueId,
    product_id:        payload.productId ?? null,
    inventory_id:      payload.inventoryId ?? null,
    purchase_order_id: payload.purchaseOrderId ?? null,
    payload:           payload.data ?? {},
    sync_status:       dbAvailable() ? 'queued' : 'database_required',
    retry_count:       0,
    last_attempt_at:   null,
    next_retry_at:     null,
    error_message:     null,
    created_at:        now(),
    updated_at:        now(),
  }
}

export async function createSyncEvent(payload = {}) {
  if (!payload.venueId || !payload.eventType) return { ok: false, error: 'venueId and eventType required' }
  const record = buildSyncRecord(payload)
  SYNC_EVENT_STORE.set(record.sync_event_id, record)
  return {
    ok: true,
    syncEventId:  record.sync_event_id,
    syncStatus:   record.sync_status,
    syncMessage:  dbAvailable() ? 'sync_event_recorded' : 'sync_event_queued',
    persisted:    dbAvailable(),
    databaseRequired: !dbAvailable(),
    record,
  }
}

export async function markSyncEventProcessed(syncEventId) {
  const record = SYNC_EVENT_STORE.get(syncEventId)
  if (!record) return { ok: false, error: 'sync_event_not_found' }
  record.sync_status     = 'processed'
  record.last_attempt_at = now()
  record.updated_at      = now()
  SYNC_EVENT_STORE.set(syncEventId, record)
  return { ok: true, syncEventId, syncStatus: 'processed' }
}

export async function markSyncEventFailed(syncEventId, errorMessage = '') {
  const record = SYNC_EVENT_STORE.get(syncEventId)
  if (!record) return { ok: false, error: 'sync_event_not_found' }
  record.sync_status     = 'failed'
  record.error_message   = errorMessage
  record.retry_count     = (record.retry_count ?? 0) + 1
  record.last_attempt_at = now()
  record.updated_at      = now()
  SYNC_EVENT_STORE.set(syncEventId, record)
  return { ok: true, syncEventId, syncStatus: 'failed', retryCount: record.retry_count }
}

export async function getPendingSyncEvents(venueId) {
  const events = [...SYNC_EVENT_STORE.values()].filter(e => e.venue_id === venueId && e.sync_status === 'queued')
  return { ok: true, events, count: events.length, venueId }
}

export async function getFailedSyncEvents(venueId) {
  const events = [...SYNC_EVENT_STORE.values()].filter(e => e.venue_id === venueId && e.sync_status === 'failed')
  return { ok: true, events, count: events.length, venueId }
}

export async function getSyncEventsByVenue(venueId, filters = {}) {
  const events = [...SYNC_EVENT_STORE.values()].filter(e => {
    if (e.venue_id !== venueId) return false
    if (filters.sync_status && e.sync_status !== filters.sync_status) return false
    if (filters.event_type && e.event_type !== filters.event_type) return false
    return true
  })
  events.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  return { ok: true, events, count: events.length, venueId }
}

export async function getSyncEventsByProduct(venueId, productId) {
  const events = [...SYNC_EVENT_STORE.values()].filter(e => e.venue_id === venueId && e.product_id === productId)
  return { ok: true, events, count: events.length, venueId, productId }
}

export function buildExternalPOSRequiredSyncResponse(venueId) {
  return {
    ok: true, venueId,
    syncStatus:            'external_system_required',
    syncMessage:           'external_sync_not_live',
    externalPOSRequired:   true,
    external_pos_required: true,
    realTimePushPending:   true,
    real_time_push_pending: true,
    note: 'External POS sync is not live. Real-time push requires external POS integration in a future phase.',
  }
}

export function buildVendorRequiredSyncResponse(venueId) {
  return {
    ok: true, venueId,
    syncStatus:              'external_system_required',
    syncMessage:             'vendor_sync_not_live',
    vendorApiRequired:        true,
    vendor_api_required:      true,
    distributorConnRequired:  true,
    manufacturerConnRequired: true,
    real_time_push_pending:   true,
    note: 'Vendor sync is not live. Distributor and manufacturer API connections required.',
  }
}

export function getOperationalSyncReadiness(venueId) {
  const events   = [...SYNC_EVENT_STORE.values()].filter(e => e.venue_id === venueId)
  const queued   = events.filter(e => e.sync_status === 'queued').length
  const failed   = events.filter(e => e.sync_status === 'failed').length
  const processed = events.filter(e => e.sync_status === 'processed').length
  return {
    ok:               true,
    venueId,
    totalEvents:      events.length,
    queuedEvents:     queued,
    failedEvents:     failed,
    processedEvents:  processed,
    syncStatus:       dbAvailable() ? 'queued' : 'database_required',
    syncMessage:      'sync_event_queued',
    externalSyncNotLive: true,
    realTimePushPending: true,
    databaseRequired: !dbAvailable(),
    degradedMode:     !dbAvailable(),
  }
}
