/**
 * POS 3 Humidor Queue Service — humidor pull requests for cigar items.
 * Persisted to localStorage key `pos3:humidorRequests`.
 * Lifecycle: requested -> pulled | unavailable (+ optional substitution) -> delivered.
 */

import { opsGet, opsSet } from '../shared/opsStorage.js'
import { emit, SYSTEMS, STATUS } from '../shared/opsEventBus.js'

const QUEUE_KEY = 'pos3:humidorRequests'

function uid() { return 'HR-' + Math.random().toString(36).slice(2, 10) }

export function getRequests() { return opsGet(QUEUE_KEY, []) }
function saveRequests(q) { opsSet(QUEUE_KEY, q) }

export function pushHumidorRequest({ ticketId, item, tableId, staffId }) {
  const queue = getRequests()
  const entry = {
    id: uid(),
    ticketId,
    itemId: item.id,
    name: item.name,
    qty: item.qty,
    sku: item.inventorySku,
    tableId,
    staffId,
    status: 'requested',
    substitution: null,
    createdAt: Date.now(),
    pulledAt: null,
    deliveredAt: null,
  }
  queue.push(entry)
  saveRequests(queue)

  emit({
    sourceSystem: SYSTEMS.POS3,
    targetSystem: SYSTEMS.EAT,
    eventType: 'HUMIDOR_REQUEST_CREATED',
    commandType: 'HUMIDOR_REQUEST_CREATED',
    ticketId,
    tableId,
    staffId,
    inventoryId: item.inventorySku,
    productId: item.menuId,
    status: STATUS.COMPLETED,
    payload: { entry, timestamp: entry.createdAt },
  })

  return entry
}

function updateEntry(id, patch, eventType) {
  const queue = getRequests()
  const idx = queue.findIndex((e) => e.id === id)
  if (idx === -1) return null
  queue[idx] = { ...queue[idx], ...patch }
  saveRequests(queue)

  if (eventType) {
    emit({
      sourceSystem: SYSTEMS.POS3,
      targetSystem: SYSTEMS.EAT,
      eventType,
      commandType: eventType,
      ticketId: queue[idx].ticketId,
      tableId: queue[idx].tableId,
      staffId: queue[idx].staffId,
      inventoryId: queue[idx].sku,
      status: STATUS.COMPLETED,
      payload: { entry: queue[idx], timestamp: Date.now() },
    })
  }

  return queue[idx]
}

export function markPulled(id) {
  return updateEntry(id, { status: 'pulled', pulledAt: Date.now() }, 'HUMIDOR_ITEM_PULLED')
}

export function markUnavailable(id, reason = '') {
  return updateEntry(id, { status: 'unavailable', reason }, 'HUMIDOR_ITEM_UNAVAILABLE')
}

export function suggestSubstitution(id, substitution) {
  return updateEntry(id, { substitution }, 'HUMIDOR_SUBSTITUTION_SUGGESTED')
}

export function markDelivered(id) {
  return updateEntry(id, { status: 'delivered', deliveredAt: Date.now() }, 'HUMIDOR_ITEM_DELIVERED')
}

export function getRequestsForTicket(ticketId) {
  return getRequests().filter((e) => e.ticketId === ticketId)
}
