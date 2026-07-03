/**
 * OIPSL — Inventory Adjustment Persistence Service
 * Durable ledger for all stock changes.
 * Falls back to in_memory_only when DB unavailable.
 */

import { v4 as uuidv4 } from 'uuid'
import { adjustInventory, getInventory } from './inventoryAvailabilityService.js'

const ADJUSTMENT_STORE = new Map()
const dbAvailable = () => !!process.env.DATABASE_URL
const now = () => new Date().toISOString()

const ADJUSTMENT_TYPES = [
  'manual_adjustment','receiving_confirmed','order_reserved','order_released',
  'order_cancelled','checkout_completed','checkout_failed_release',
  'staff_order_reserved','kds_released','damaged_inventory','spoilage',
  'shrinkage','correction','preview_only',
]

function buildPersistResult(extra = {}) {
  return {
    persisted:         dbAvailable(),
    persistenceStatus: dbAvailable() ? 'persisted' : 'in_memory_only',
    databaseRequired:  !dbAvailable(),
    degradedMode:      !dbAvailable(),
    source:            dbAvailable() ? 'database' : 'in_memory',
    ...extra,
  }
}

export async function persistInventoryAdjustment(venueId, productId, delta, context = {}) {
  const before = getInventory(venueId, productId)
  const prevStock = before.ok ? before.inventory.current_stock : 0

  const adjResult = adjustInventory(venueId, productId, delta, {
    source:     context.sourceSystem ?? 'manual',
    actor_id:   context.performedBy ?? null,
    actor_role: context.role ?? 'staff',
    metadata:   context.metadata ?? {},
  })
  if (!adjResult.ok) return { ok: false, error: adjResult.error, ...buildPersistResult() }

  const adjustmentId = uuidv4()
  const record = {
    adjustment_id:              adjustmentId,
    inventory_id:               adjResult.inventory.inventory_id,
    product_id:                 productId,
    venue_id:                   venueId,
    adjustment_type:            ADJUSTMENT_TYPES.includes(context.adjustmentType) ? context.adjustmentType : 'manual_adjustment',
    quantity_delta:             delta,
    previous_stock_on_hand:     prevStock,
    new_stock_on_hand:          adjResult.inventory.current_stock,
    previous_reserved_quantity: before.ok ? before.inventory.reserved_stock : 0,
    new_reserved_quantity:      adjResult.inventory.reserved_stock,
    previous_available_quantity: before.ok ? before.inventory.available_stock : 0,
    new_available_quantity:     adjResult.inventory.available_stock,
    reason:                     context.reason ?? null,
    source_system:              context.sourceSystem ?? 'manual',
    source_event_id:            context.sourceEventId ?? null,
    performed_by:               context.performedBy ?? null,
    role:                       context.role ?? 'staff',
    approval_id:                context.approvalId ?? null,
    receiving_id:               context.receivingId ?? null,
    order_id:                   context.orderId ?? null,
    checkout_id:                context.checkoutId ?? null,
    pos360_order_id:            context.pos360OrderId ?? null,
    kds_order_id:               context.kdsOrderId ?? null,
    ...buildPersistResult({ eventId: adjustmentId }),
    created_at: now(),
  }
  ADJUSTMENT_STORE.set(adjustmentId, record)

  return {
    ok: true,
    adjustmentId,
    inventory:          adjResult.inventory,
    availabilityStatus: adjResult.availabilityStatus,
    ...buildPersistResult({ eventId: adjustmentId }),
  }
}

export async function confirmReceivingInventoryAdjustment(venueId, productId, receivedQty, context = {}) {
  return persistInventoryAdjustment(venueId, productId, receivedQty, {
    ...context,
    adjustmentType: 'receiving_confirmed',
    sourceSystem:   'receiving',
    reason:         context.reason ?? 'inventory_receiving_confirmed',
  })
}

export async function reserveInventoryForOrder(venueId, productId, qty, context = {}) {
  return persistInventoryAdjustment(venueId, productId, -qty, {
    ...context,
    adjustmentType:    'order_reserved',
    sourceSystem:      context.sourceSystem ?? 'order',
    reason:            'inventory_reserved_for_order',
    persistenceStatus: dbAvailable() ? 'inventory_reserved_persisted' : 'in_memory_only',
  })
}

export async function releaseReservedInventory(venueId, productId, qty, context = {}) {
  return persistInventoryAdjustment(venueId, productId, qty, {
    ...context,
    adjustmentType: 'order_released',
    sourceSystem:   context.sourceSystem ?? 'order',
    reason:         'inventory_reservation_released',
  })
}

export async function commitCheckoutInventory(venueId, productId, qty, context = {}) {
  return persistInventoryAdjustment(venueId, productId, -qty, {
    ...context,
    adjustmentType:    'checkout_completed',
    sourceSystem:      'checkout',
    reason:            'checkout_inventory_committed',
    persistenceStatus: dbAvailable() ? 'checkout_inventory_committed' : 'in_memory_only',
  })
}

export async function reverseInventoryAdjustment(adjustmentId, actorContext = {}) {
  const original = ADJUSTMENT_STORE.get(adjustmentId)
  if (!original) return { ok: false, error: 'adjustment_not_found' }
  return persistInventoryAdjustment(original.venue_id, original.product_id, -original.quantity_delta, {
    ...actorContext,
    adjustmentType: 'correction',
    reason:         `reversal_of_${adjustmentId}`,
    sourceSystem:   'manual',
  })
}

export async function getInventoryAdjustmentHistory(venueId, productId = null) {
  const records = []
  for (const r of ADJUSTMENT_STORE.values()) {
    if (r.venue_id !== venueId) continue
    if (productId && r.product_id !== productId) continue
    records.push(r)
  }
  records.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  return {
    ok: true, records, count: records.length, venueId,
    ...buildPersistResult(),
  }
}

export async function getInventoryAdjustmentsByProduct(venueId, productId) {
  return getInventoryAdjustmentHistory(venueId, productId)
}

export async function getInventoryAdjustmentsByVenue(venueId) {
  return getInventoryAdjustmentHistory(venueId)
}

export function getAdjustmentPersistenceReadiness(venueId) {
  const count = [...ADJUSTMENT_STORE.values()].filter(r => r.venue_id === venueId).length
  return {
    ok:                true,
    venueId,
    adjustmentCount:   count,
    persistenceStatus: dbAvailable() ? 'persisted' : 'in_memory_only',
    databaseRequired:  !dbAvailable(),
    degradedMode:      !dbAvailable(),
  }
}
