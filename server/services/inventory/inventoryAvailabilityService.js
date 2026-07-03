/**
 * Inventory Availability Service (ISPAE)
 * Preview-safe in-memory inventory model.
 * Does not claim live inventory sync. Returns inventory_sync_pending without database.
 */

import { v4 as uuidv4 } from 'uuid'

const INVENTORY_STORE = new Map()
const BLOCK_STORE     = new Map()
const EVENT_BUFFER    = []
const MAX_EVENTS      = 500
const dbAvailable     = () => !!process.env.DATABASE_URL
const now             = () => new Date().toISOString()

const AVAILABILITY_STATUSES = new Set([
  'in_stock', 'low_stock', 'sold_out', 'availability_required',
  'inventory_unavailable', 'discontinued', 'seasonal_unavailable', 'reserved',
])

export function buildInventoryRecord(venueId, payload = {}) {
  const current   = payload.current_stock   ?? 0
  const reserved  = payload.reserved_stock  ?? 0
  const available = Math.max(0, current - reserved)
  const threshold = payload.reorder_threshold ?? 5
  const status =
    current <= 0     ? 'sold_out'   :
    current <= threshold ? 'low_stock' : 'in_stock'
  return {
    inventory_id:       payload.inventory_id ?? uuidv4(),
    venue_id:           venueId,
    product_id:         payload.product_id,
    product_name:       payload.product_name ?? payload.product_id,
    product_category:   payload.product_category ?? 'general',
    craft_module:       payload.craft_module ?? 'smokecraft',
    fulfillment_owner:  payload.fulfillment_owner ?? 'venue',
    partner_id:         payload.partner_id ?? null,
    current_stock:      current,
    reserved_stock:     reserved,
    available_stock:    available,
    reorder_threshold:  threshold,
    reorder_quantity:   payload.reorder_quantity ?? 10,
    unit:               payload.unit ?? 'unit',
    availability_status: payload.availability_status ?? status,
    sync_status:        'inventory_sync_pending',
    last_sync_at:       null,
    metadata:           payload.metadata ?? {},
    created_at:         payload.created_at ?? now(),
    updated_at:         now(),
  }
}

export function setInventory(venueId, payload = {}) {
  if (!payload.product_id) return { ok: false, error: 'product_id required' }
  const key = `${venueId}:${payload.product_id}`
  const existing = INVENTORY_STORE.get(key)
  const record = buildInventoryRecord(venueId, { ...(existing ?? {}), ...payload, created_at: existing?.created_at })
  INVENTORY_STORE.set(key, record)
  return {
    ok: true, inventory: record,
    availabilityStatus: record.availability_status,
    syncStatus:         'inventory_sync_pending',
    persistenceStatus:  dbAvailable() ? 'database_required' : 'not_persisted',
  }
}

export function getInventory(venueId, productId) {
  const record = INVENTORY_STORE.get(`${venueId}:${productId}`)
  if (!record) return { ok: false, availabilityStatus: 'availability_required', productId }
  return { ok: true, inventory: record, availabilityStatus: record.availability_status }
}

export function getVenueInventory(venueId, filters = {}) {
  const items = []
  for (const [key, r] of INVENTORY_STORE.entries()) {
    if (!key.startsWith(`${venueId}:`)) continue
    if (filters.availability_status && r.availability_status !== filters.availability_status) continue
    if (filters.craft_module && r.craft_module !== filters.craft_module) continue
    if (filters.product_category && r.product_category !== filters.product_category) continue
    items.push(r)
  }
  return {
    ok: true, items, count: items.length, venueId,
    syncStatus:        'inventory_sync_pending',
    persistenceStatus: dbAvailable() ? 'database_required' : 'not_persisted',
  }
}

export function adjustInventory(venueId, productId, delta, actorContext = {}) {
  const key = `${venueId}:${productId}`
  const existing = INVENTORY_STORE.get(key)
  if (!existing) return { ok: false, error: 'inventory_record_not_found', productId }
  const before = existing.current_stock
  const after  = Math.max(0, before + delta)
  existing.current_stock   = after
  existing.available_stock = Math.max(0, after - existing.reserved_stock)
  existing.availability_status =
    after <= 0                       ? 'sold_out'   :
    after <= existing.reorder_threshold ? 'low_stock' : 'in_stock'
  existing.updated_at = now()
  INVENTORY_STORE.set(key, existing)

  const event = {
    event_id:      uuidv4(),
    venue_id:      venueId,
    inventory_id:  existing.inventory_id,
    product_id:    productId,
    event_type:    delta >= 0 ? 'receipt' : 'sale',
    quantity_delta: delta,
    stock_before:  before,
    stock_after:   after,
    event_source:  actorContext.source ?? 'manual',
    actor_id:      actorContext.actor_id ?? null,
    actor_role:    actorContext.actor_role ?? 'staff',
    event_status:  'inventory_event_preview',
    metadata:      actorContext.metadata ?? {},
    created_at:    now(),
  }
  if (EVENT_BUFFER.length >= MAX_EVENTS) EVENT_BUFFER.shift()
  EVENT_BUFFER.push(event)

  return {
    ok: true, inventory: existing, event,
    availabilityStatus: existing.availability_status,
    persistenceStatus:  dbAvailable() ? 'database_required' : 'not_persisted',
  }
}

export function checkProductAvailability(venueId, productId, requestedQty = 1) {
  const record = INVENTORY_STORE.get(`${venueId}:${productId}`)
  if (!record) return {
    ok: false, available: false,
    availabilityStatus: 'availability_required',
    reason: 'inventory_record_not_found',
    productId,
  }
  const available = record.available_stock >= requestedQty
  return {
    ok: true, available,
    productId,
    availabilityStatus: available ? record.availability_status : 'inventory_unavailable',
    availableStock:     record.available_stock,
    requestedQty,
    reason: available ? null : (record.current_stock <= 0 ? 'sold_out' : 'insufficient_stock'),
  }
}

export function blockProduct(venueId, productId, reason, blockedFor = [], source = 'system') {
  const blockId = uuidv4()
  const block = {
    block_id:     blockId,
    venue_id:     venueId,
    product_id:   productId,
    block_reason: reason,
    block_source: source,
    block_status: 'availability_blocked',
    blocked_for:  blockedFor,
    unblocked_at: null,
    metadata:     {},
    created_at:   now(),
    updated_at:   now(),
  }
  BLOCK_STORE.set(`${venueId}:${productId}`, block)
  return { ok: true, block, blockStatus: 'availability_blocked', persistenceStatus: 'not_persisted' }
}

export function unblockProduct(venueId, productId) {
  const key = `${venueId}:${productId}`
  const block = BLOCK_STORE.get(key)
  if (!block) return { ok: false, error: 'block_not_found' }
  block.block_status = 'availability_unblocked'
  block.unblocked_at = now()
  block.updated_at   = now()
  BLOCK_STORE.set(key, block)
  return { ok: true, block, blockStatus: 'availability_unblocked', persistenceStatus: 'not_persisted' }
}

export function getVenueLowStockItems(venueId) {
  const items = []
  for (const [key, r] of INVENTORY_STORE.entries()) {
    if (!key.startsWith(`${venueId}:`)) continue
    if (r.availability_status === 'low_stock' || r.availability_status === 'sold_out') items.push(r)
  }
  return { ok: true, items, count: items.length, venueId, syncStatus: 'inventory_sync_pending' }
}

export function getInventoryEvents(venueId, filters = {}) {
  const events = EVENT_BUFFER.filter(e => {
    if (e.venue_id !== venueId) return false
    if (filters.product_id && e.product_id !== filters.product_id) return false
    return true
  })
  return { ok: true, events, count: events.length }
}

export function getInventoryReadiness(venueId) {
  const items = [...INVENTORY_STORE.values()].filter(r => r.venue_id === venueId)
  const soldOut = items.filter(r => r.availability_status === 'sold_out').length
  const lowStock = items.filter(r => r.availability_status === 'low_stock').length
  const blockers = []
  if (!dbAvailable())     blockers.push({ type: 'database_required', severity: 'warning' })
  if (soldOut > 0)        blockers.push({ type: 'sold_out_products', count: soldOut, severity: 'critical' })
  if (lowStock > 0)       blockers.push({ type: 'low_stock_products', count: lowStock, severity: 'warning' })
  return {
    ok:                 true,
    venueId,
    inventoryStatus:    'inventory_sync_pending',
    productCount:       items.length,
    soldOutCount:       soldOut,
    lowStockCount:      lowStock,
    blockers,
    syncStatus:         'inventory_sync_pending',
    persistenceStatus:  dbAvailable() ? 'database_required' : 'not_persisted',
  }
}
