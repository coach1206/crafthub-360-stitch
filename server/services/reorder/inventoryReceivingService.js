/**
 * DMRC — Inventory Receiving Service
 * Preview-only receiving workflow. adjustInventory called on receipt confirmation.
 * Does not auto-update inventory without explicit confirmation.
 */

import { v4 as uuidv4 } from 'uuid'
import { adjustInventory } from '../inventory/inventoryAvailabilityService.js'

const RECEIVING_STORE = new Map()
const RECEIVING_ITEM_STORE = new Map()
const dbAvailable = () => !!process.env.DATABASE_URL
const now = () => new Date().toISOString()

export const RECEIVING_STATUSES = [
  'receiving_pending','receiving_in_progress','receiving_partial',
  'receiving_complete','receiving_discrepancy','receiving_cancelled',
]

export function createReceivingPreview(venueId, payload = {}) {
  const receivingId = uuidv4()
  const preview = {
    receiving_id:       receivingId,
    venue_id:           venueId,
    purchase_order_id:  payload.purchase_order_id ?? null,
    vendor_id:          payload.vendor_id ?? null,
    vendor_name:        payload.vendor_name ?? null,
    receiving_status:   'receiving_pending',
    items_expected:     payload.items_expected ?? 0,
    items_received:     0,
    items:              [],
    receiving_note:     payload.receiving_note ?? null,
    persistence_status: 'database_required',
    metadata:           payload.metadata ?? {},
    created_at:         now(),
    updated_at:         now(),
  }
  RECEIVING_STORE.set(receivingId, preview)
  return {
    ok: true, receiving: preview,
    receivingStatus:   preview.receiving_status,
    persistenceStatus: dbAvailable() ? 'database_required' : 'not_persisted',
    note: 'Receiving preview created. Confirm items received to update inventory.',
  }
}

export function addReceivingItem(receivingId, itemPayload = {}) {
  const receiving = RECEIVING_STORE.get(receivingId)
  if (!receiving) return { ok: false, error: 'receiving_not_found' }
  if (!itemPayload.product_id) return { ok: false, error: 'product_id required' }

  const item = {
    receiving_item_id:   uuidv4(),
    receiving_id:        receivingId,
    venue_id:            receiving.venue_id,
    product_id:          itemPayload.product_id,
    product_name:        itemPayload.product_name ?? itemPayload.product_id,
    expected_quantity:   itemPayload.expected_quantity ?? 0,
    received_quantity:   0,
    discrepancy:         0,
    item_status:         'receiving_pending',
    metadata:            itemPayload.metadata ?? {},
    created_at:          now(),
  }
  RECEIVING_ITEM_STORE.set(item.receiving_item_id, item)
  receiving.items_expected += item.expected_quantity
  receiving.updated_at = now()
  RECEIVING_STORE.set(receivingId, receiving)
  return { ok: true, item, receivingId }
}

export function markItemsReceived(receivingId, receivedItems = [], actorContext = {}) {
  const receiving = RECEIVING_STORE.get(receivingId)
  if (!receiving) return { ok: false, error: 'receiving_not_found' }

  const adjustmentResults = []
  let totalReceived = 0

  for (const entry of receivedItems) {
    const { product_id, received_quantity } = entry
    if (!product_id || received_quantity <= 0) continue

    const adjResult = adjustInventory(receiving.venue_id, product_id, received_quantity, {
      source:    'inventory_receiving',
      actor_id:  actorContext.actor_id ?? null,
      actor_role: actorContext.role ?? 'staff',
      metadata:  { receiving_id: receivingId },
    })
    adjustmentResults.push({ product_id, received_quantity, result: adjResult })
    totalReceived += received_quantity
  }

  receiving.items_received = totalReceived
  receiving.receiving_status = totalReceived >= receiving.items_expected
    ? 'receiving_complete'
    : totalReceived > 0
      ? 'receiving_partial'
      : 'receiving_pending'
  receiving.updated_at = now()
  RECEIVING_STORE.set(receivingId, receiving)

  return {
    ok: true, receiving,
    adjustmentResults,
    receivingStatus:   receiving.receiving_status,
    persistenceStatus: dbAvailable() ? 'database_required' : 'not_persisted',
  }
}

export function buildInventoryAdjustmentFromReceiving(receivingId) {
  const receiving = RECEIVING_STORE.get(receivingId)
  if (!receiving) return { ok: false, error: 'receiving_not_found' }
  const items = [...RECEIVING_ITEM_STORE.values()].filter(i => i.receiving_id === receivingId)
  return {
    ok: true,
    receivingId,
    venueId:          receiving.venue_id,
    adjustments:      items.map(i => ({
      product_id:         i.product_id,
      expected_quantity:  i.expected_quantity,
      received_quantity:  i.received_quantity,
      discrepancy:        i.expected_quantity - i.received_quantity,
    })),
    receivingStatus:   receiving.receiving_status,
    persistenceStatus: dbAvailable() ? 'database_required' : 'not_persisted',
  }
}

export function getReceivingReadiness(venueId) {
  const previews = [...RECEIVING_STORE.values()].filter(r => r.venue_id === venueId)
  const pending  = previews.filter(r => r.receiving_status === 'receiving_pending').length
  return {
    ok:                true,
    venueId,
    totalPreviews:     previews.length,
    pendingReceiving:  pending,
    receivingStatus:   'receiving_pending',
    persistenceStatus: dbAvailable() ? 'database_required' : 'not_persisted',
    note: 'Inventory receiving is preview only. Confirm receipt to update stock levels.',
  }
}
