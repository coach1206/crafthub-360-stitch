/**
 * POS 3 Inventory Availability Service — checks/decrements stock for a SKU
 * against the seeded INVENTORY_CATALOG, persisted to localStorage key
 * `pos3:inventoryLevels`. Emits INVENTORY_LOW_STOCK_WARNING and
 * INVENTORY_OUT_OF_STOCK_BLOCK so E.A.T./readiness checks can react.
 */

import { opsGet, opsSet } from '../shared/opsStorage.js'
import { emit, SYSTEMS, STATUS } from '../shared/opsEventBus.js'
import { INVENTORY_CATALOG, getInventoryCatalogItem } from '../../data/pos3/inventoryCatalog.js'

const LEVELS_KEY = 'pos3:inventoryLevels'

function ensureSeeded() {
  if (opsGet(LEVELS_KEY, null) == null) {
    opsSet(LEVELS_KEY, INVENTORY_CATALOG.map((i) => ({ ...i })))
  }
}

export function getInventoryLevels() {
  ensureSeeded()
  return opsGet(LEVELS_KEY, [])
}

function saveLevels(levels) { opsSet(LEVELS_KEY, levels) }

export function getLevel(sku) {
  return getInventoryLevels().find((i) => i.sku === sku) || null
}

/**
 * checkAvailability(sku, qty) -> { available, status: 'ok'|'low'|'out', quantityOnHand, parLevel, stockWarningThreshold }
 */
export function checkAvailability(sku, qty = 1) {
  const level = getLevel(sku)
  const catalogItem = getInventoryCatalogItem(sku)
  const threshold = catalogItem?.stockWarningThreshold ?? Math.max(1, Math.round((level?.parLevel || 5) * 0.25))

  if (!level) {
    return { available: true, status: 'ok', quantityOnHand: null, parLevel: null, stockWarningThreshold: threshold }
  }

  const qtyOnHand = level.quantityOnHand
  if (qtyOnHand <= 0) {
    return { available: false, status: 'out', quantityOnHand: qtyOnHand, parLevel: level.parLevel, stockWarningThreshold: threshold }
  }
  if (qtyOnHand < qty) {
    return { available: false, status: 'out', quantityOnHand: qtyOnHand, parLevel: level.parLevel, stockWarningThreshold: threshold }
  }
  if (qtyOnHand <= threshold) {
    return { available: true, status: 'low', quantityOnHand: qtyOnHand, parLevel: level.parLevel, stockWarningThreshold: threshold }
  }
  return { available: true, status: 'ok', quantityOnHand: qtyOnHand, parLevel: level.parLevel, stockWarningThreshold: threshold }
}

/** Decrement stock for a sku by qty, emitting low-stock/out-of-stock events as needed. */
export function decrementStock(sku, qty = 1, ctx = {}) {
  const levels = getInventoryLevels()
  const idx = levels.findIndex((i) => i.sku === sku)
  if (idx === -1) return null

  const next = Math.max(0, levels[idx].quantityOnHand - Math.abs(qty))
  levels[idx] = { ...levels[idx], quantityOnHand: next, reorderNeeded: next <= (levels[idx].parLevel * 0.3) }
  saveLevels(levels)

  const avail = checkAvailability(sku, 1)

  if (avail.status === 'out') {
    emit({
      sourceSystem: SYSTEMS.POS3,
      targetSystem: SYSTEMS.EAT,
      eventType: 'INVENTORY_OUT_OF_STOCK_BLOCK',
      commandType: 'INVENTORY_OUT_OF_STOCK_BLOCK',
      ticketId: ctx.ticketId,
      inventoryId: sku,
      status: STATUS.COMPLETED,
      payload: { sku, quantityOnHand: next, timestamp: Date.now() },
    })
  } else if (avail.status === 'low') {
    emit({
      sourceSystem: SYSTEMS.POS3,
      targetSystem: SYSTEMS.EAT,
      eventType: 'INVENTORY_LOW_STOCK_WARNING',
      commandType: 'INVENTORY_LOW_STOCK_WARNING',
      ticketId: ctx.ticketId,
      inventoryId: sku,
      status: STATUS.COMPLETED,
      payload: { sku, quantityOnHand: next, parLevel: levels[idx].parLevel, timestamp: Date.now() },
    })
  }

  return levels[idx]
}

export function getLowStockSkus() {
  return getInventoryLevels().filter((i) => {
    const avail = checkAvailability(i.sku, 1)
    return avail.status === 'low'
  })
}

export function getOutOfStockSkus() {
  return getInventoryLevels().filter((i) => i.quantityOnHand <= 0)
}
