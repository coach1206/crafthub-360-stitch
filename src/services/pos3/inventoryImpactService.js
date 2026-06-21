/**
 * POS 3 Inventory Impact Service — records inventory depletion entries for
 * a ticket's items and emits INVENTORY_IMPACT_CREATED ops events so E.A.T.
 * inventory dashboards see real, attributable impact.
 * Persists to localStorage key `pos3:inventoryImpact`.
 */

import { opsGet, opsSet } from '../shared/opsStorage.js'
import { emit, SYSTEMS, STATUS } from '../shared/opsEventBus.js'

const IMPACT_KEY = 'pos3:inventoryImpact'

function uid() {
  return 'IMP-' + Math.random().toString(36).slice(2, 10)
}

export function getInventoryImpacts() { return opsGet(IMPACT_KEY, []) }

function saveImpacts(impacts) { opsSet(IMPACT_KEY, impacts) }

/**
 * Record inventory impact entries for a ticket's items (one entry per item
 * with an inventorySku) and emit an INVENTORY_IMPACT_CREATED event each.
 */
export function recordInventoryImpact(ticket) {
  const items = (ticket?.items || []).filter((i) => i.inventorySku && !i.voided)
  if (!items.length) return []

  const impacts = getInventoryImpacts()
  const created = []

  items.forEach((item) => {
    const entry = {
      id: uid(),
      sku: item.inventorySku,
      qtyDelta: -Math.abs(item.qty || 1),
      ticketId: ticket.id,
      createdAt: Date.now(),
    }
    impacts.push(entry)
    created.push(entry)

    emit({
      sourceSystem: SYSTEMS.POS3,
      targetSystem: SYSTEMS.EAT,
      eventType: 'INVENTORY_IMPACT_CREATED',
      commandType: 'INVENTORY_IMPACT_CREATED',
      ticketId: ticket.id,
      productId: item.menuId,
      inventoryId: item.inventorySku,
      status: STATUS.COMPLETED,
      payload: { sku: item.inventorySku, qtyDelta: entry.qtyDelta, itemName: item.name, timestamp: entry.createdAt },
    })
  })

  saveImpacts(impacts.slice(-1000))
  return created
}

export function getInventoryImpactsForTicket(ticketId) {
  return getInventoryImpacts().filter((i) => i.ticketId === ticketId)
}
