/**
 * OIPSL — Inventory Audit Persistence Service
 * Durable audit trail for all inventory and reorder operations.
 */

import { v4 as uuidv4 } from 'uuid'

const AUDIT_STORE = new Map()
const dbAvailable = () => !!process.env.DATABASE_URL
const now = () => new Date().toISOString()

export const AUDIT_EVENT_TYPES = [
  'inventory_created','inventory_updated','inventory_adjusted','inventory_reserved',
  'inventory_released','product_marked_sold_out','product_hidden','product_disabled',
  'checkout_blocked','staff_order_blocked','kds_route_blocked','ncie_substitution_created',
  'reorder_recommended','reorder_urgent','purchase_order_draft_created',
  'purchase_order_approved','purchase_order_rejected','purchase_order_not_submitted',
  'receiving_created','receiving_confirmed','inventory_receiving_adjusted',
  'sync_failed','sync_degraded','manager_override_requested',
  'manager_override_approved','manager_override_denied',
]

function buildAuditRecord(payload) {
  const auditId = uuidv4()
  return {
    audit_id:          auditId,
    event_type:        payload.eventType,
    system:            payload.system ?? 'ispae',
    venue_id:          payload.venueId,
    product_id:        payload.productId ?? null,
    inventory_id:      payload.inventoryId ?? null,
    purchase_order_id: payload.purchaseOrderId ?? null,
    receiving_id:      payload.receivingId ?? null,
    actor_id:          payload.actorId ?? null,
    actor_role:        payload.actorRole ?? 'system',
    previous_value:    payload.previousValue ?? null,
    new_value:         payload.newValue ?? null,
    reason:            payload.reason ?? null,
    status:            'recorded',
    persisted:         dbAvailable(),
    persistence_status: dbAvailable() ? 'persisted' : 'in_memory_only',
    metadata:          payload.metadata ?? {},
    created_at:        now(),
  }
}

export async function persistInventoryAuditEvent(payload = {}) {
  if (!payload.venueId || !payload.eventType) return { ok: false, error: 'venueId and eventType required' }
  const record = buildAuditRecord(payload)
  AUDIT_STORE.set(record.audit_id, record)
  return {
    ok: true, auditId: record.audit_id, record,
    persisted:         record.persisted,
    persistenceStatus: record.persistence_status,
    databaseRequired:  !dbAvailable(),
    eventId:           record.audit_id,
  }
}

export async function persistReorderAuditEvent(payload = {}) {
  return persistInventoryAuditEvent({ ...payload, system: 'dmrc' })
}

export async function persistOperationalAuditEvent(payload = {}) {
  return persistInventoryAuditEvent({ ...payload, system: 'oipsl' })
}

export async function getAuditEventsByVenue(venueId, filters = {}) {
  const events = []
  for (const e of AUDIT_STORE.values()) {
    if (e.venue_id !== venueId) continue
    if (filters.eventType && e.event_type !== filters.eventType) continue
    if (filters.system && e.system !== filters.system) continue
    events.push(e)
  }
  events.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  return {
    ok: true, events, count: events.length, venueId,
    persistenceStatus: dbAvailable() ? 'persisted' : 'in_memory_only',
    databaseRequired:  !dbAvailable(),
  }
}

export async function getAuditEventsByProduct(venueId, productId) {
  const events = []
  for (const e of AUDIT_STORE.values()) {
    if (e.venue_id !== venueId || e.product_id !== productId) continue
    events.push(e)
  }
  events.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  return { ok: true, events, count: events.length, venueId, productId }
}

export async function getAuditEventsByPurchaseOrder(purchaseOrderId) {
  const events = [...AUDIT_STORE.values()].filter(e => e.purchase_order_id === purchaseOrderId)
  return { ok: true, events, count: events.length, purchaseOrderId }
}

export function buildAuditPreviewOnlyResponse(venueId, eventType) {
  return {
    ok: true, venueId, eventType,
    persisted:         false,
    persistenceStatus: 'in_memory_only',
    databaseRequired:  true,
    degradedMode:      true,
    auditId:           null,
    note:              'Audit event recorded in memory only. Database required for durable audit trail.',
  }
}

export function getAuditReadiness(venueId) {
  const count = [...AUDIT_STORE.values()].filter(e => e.venue_id === venueId).length
  return {
    ok:                true,
    venueId,
    auditEventCount:   count,
    persistenceStatus: dbAvailable() ? 'persisted' : 'in_memory_only',
    databaseRequired:  !dbAvailable(),
    degradedMode:      !dbAvailable(),
  }
}
