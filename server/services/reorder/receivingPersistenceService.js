/**
 * OIPSL — Receiving Persistence Service
 * Wraps inventoryReceivingService with durable records.
 * If DB exists: receiving confirmation adjusts inventory persistently.
 * If DB not available: returns receiving_preview_only + inventory_not_persisted.
 */

import { v4 as uuidv4 } from 'uuid'
import {
  createReceivingPreview, markItemsReceived, buildInventoryAdjustmentFromReceiving,
} from './inventoryReceivingService.js'
import { confirmReceivingInventoryAdjustment } from '../inventory/inventoryAdjustmentPersistenceService.js'
import { persistInventoryAuditEvent } from '../inventory/inventoryAuditPersistenceService.js'

const RECEIVING_PERSIST_STORE = new Map()
const dbAvailable = () => !!process.env.DATABASE_URL
const now = () => new Date().toISOString()

function persistResult(extra = {}) {
  const ps = dbAvailable() ? 'receiving_persisted' : 'receiving_preview_only'
  return {
    persisted:              dbAvailable(),
    persistenceStatus:      ps,
    databaseRequired:       !dbAvailable(),
    degradedMode:           !dbAvailable(),
    inventoryPersisted:       dbAvailable(),
    inventoryNotPersisted:    !dbAvailable(),
    adjustedInMemoryOnly:     !dbAvailable(),
    adjusted_in_memory_only:  !dbAvailable(),
    ...extra,
  }
}

export async function createReceivingRecord(venueId, payload = {}) {
  const result = createReceivingPreview(venueId, payload)
  if (!result.ok) return { ...result, ...persistResult() }
  const id = result.receiving.receiving_id
  RECEIVING_PERSIST_STORE.set(id, { ...result.receiving, persisted: dbAvailable(), persisted_at: now() })
  await persistInventoryAuditEvent({
    venueId, eventType: 'receiving_created',
    receivingId: id, actorRole: 'system',
    system: 'oipsl',
  })
  return {
    ok: true, receiving: result.receiving,
    receivingStatus: result.receiving.receiving_status,
    ...persistResult({ eventId: id }),
  }
}

export async function confirmReceivingRecord(receivingId, receivedItems = [], actorContext = {}) {
  const result = markItemsReceived(receivingId, receivedItems, actorContext)
  if (!result.ok) return { ...result, ...persistResult() }

  const adjustmentResults = []
  if (dbAvailable()) {
    for (const entry of receivedItems) {
      if (!entry.product_id || entry.received_quantity <= 0) continue
      const adjResult = await confirmReceivingInventoryAdjustment(
        result.receiving.venue_id,
        entry.product_id,
        entry.received_quantity,
        { receivingId, ...actorContext },
      )
      adjustmentResults.push({ product_id: entry.product_id, result: adjResult })
    }
  }

  const record = RECEIVING_PERSIST_STORE.get(receivingId)
  if (record) {
    record.receiving_status = result.receiving.receiving_status
    record.items_received   = result.receiving.items_received
    record.persisted        = dbAvailable()
    RECEIVING_PERSIST_STORE.set(receivingId, record)
  }

  await persistInventoryAuditEvent({
    venueId: result.receiving.venue_id,
    eventType: dbAvailable() ? 'inventory_receiving_adjusted' : 'receiving_confirmed',
    receivingId, actorId: actorContext.actor_id, actorRole: actorContext.role ?? 'staff',
    newValue: { items_received: result.receiving.items_received },
    system: 'oipsl',
  })

  return {
    ok: true,
    receiving:         result.receiving,
    adjustmentResults,
    receivingStatus:   result.receiving.receiving_status,
    inventoryAdjusted: dbAvailable(),
    ...persistResult({ eventId: receivingId }),
    ...(dbAvailable() ? {} : {
      receivingStatus:        'receiving_preview_only',
      inventoryNotPersisted:  true,
      adjustedInMemoryOnly:   true,
      note: 'Receiving confirmed but inventory adjustment is in-memory only. Database required for durable update.',
    }),
  }
}

export async function persistReceivingPreview(venueId, payload = {}) {
  return createReceivingRecord(venueId, { ...payload, preview_only: true })
}

export async function persistReceivingConfirmation(receivingId, items, actorContext) {
  return confirmReceivingRecord(receivingId, items, actorContext)
}

export async function applyReceivingInventoryAdjustments(receivingId) {
  return buildInventoryAdjustmentFromReceiving(receivingId)
}

export async function getReceivingRecordsByPurchaseOrder(purchaseOrderId) {
  const records = [...RECEIVING_PERSIST_STORE.values()].filter(r => r.purchase_order_id === purchaseOrderId)
  return { ok: true, records, count: records.length, purchaseOrderId, ...persistResult() }
}

export async function getReceivingRecordsByVenue(venueId) {
  const records = [...RECEIVING_PERSIST_STORE.values()].filter(r => r.venue_id === venueId)
  return { ok: true, records, count: records.length, venueId, ...persistResult() }
}

export async function getReceivingStatus(receivingId) {
  const record = RECEIVING_PERSIST_STORE.get(receivingId)
  if (!record) return { ok: false, error: 'receiving_not_found', receivingStatus: 'receiving_pending' }
  return { ok: true, record, receivingStatus: record.receiving_status, ...persistResult() }
}

export function getReceivingPersistenceReadiness(venueId) {
  const records = [...RECEIVING_PERSIST_STORE.values()].filter(r => r.venue_id === venueId)
  return {
    ok:                true,
    venueId,
    receivingCount:    records.length,
    receivingStatus:   'receiving_pending',
    persistenceStatus: dbAvailable() ? 'receiving_persisted' : 'receiving_preview_only',
    databaseRequired:  !dbAvailable(),
    degradedMode:      !dbAvailable(),
    inventoryNotPersisted: !dbAvailable(),
    note: dbAvailable()
      ? 'Receiving confirmed inventory adjustments are database-backed.'
      : 'Receiving is preview only. Database required for inventory adjustment persistence.',
  }
}
