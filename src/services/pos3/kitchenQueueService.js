/**
 * POS 3 Kitchen Queue Service — kitchen ticket queue (per item, not whole
 * ticket) persisted to localStorage key `pos3:kitchenQueue`. Items are
 * pushed here by stationRoutingService.js when a ticket is sent.
 * Lifecycle: queued -> started -> ready -> completed.
 */

import { opsGet, opsSet } from '../shared/opsStorage.js'
import { emit, SYSTEMS, STATUS } from '../shared/opsEventBus.js'

const QUEUE_KEY = 'pos3:kitchenQueue'

function uid() { return 'KT-' + Math.random().toString(36).slice(2, 10) }

export function getQueue() { return opsGet(QUEUE_KEY, []) }
function saveQueue(q) { opsSet(QUEUE_KEY, q) }

/** Push a new kitchen ticket entry (one per routed item). */
export function pushKitchenTicket({ ticketId, item, tableId, staffId }) {
  const queue = getQueue()
  const entry = {
    id: uid(),
    ticketId,
    itemId: item.id,
    name: item.name,
    qty: item.qty,
    modifiers: item.modifiers || [],
    note: item.note || '',
    tableId,
    staffId,
    status: 'queued',
    createdAt: Date.now(),
    startedAt: null,
    readyAt: null,
    completedAt: null,
  }
  queue.push(entry)
  saveQueue(queue)

  emit({
    sourceSystem: SYSTEMS.POS3,
    targetSystem: SYSTEMS.EAT,
    eventType: 'KITCHEN_TICKET_CREATED',
    commandType: 'KITCHEN_TICKET_CREATED',
    ticketId,
    tableId,
    staffId,
    productId: item.menuId,
    status: STATUS.COMPLETED,
    payload: { entry, timestamp: entry.createdAt },
  })

  return entry
}

function updateEntry(id, patch, eventType) {
  const queue = getQueue()
  const idx = queue.findIndex((e) => e.id === id)
  if (idx === -1) return null
  queue[idx] = { ...queue[idx], ...patch }
  saveQueue(queue)

  if (eventType) {
    emit({
      sourceSystem: SYSTEMS.POS3,
      targetSystem: SYSTEMS.EAT,
      eventType,
      commandType: eventType,
      ticketId: queue[idx].ticketId,
      tableId: queue[idx].tableId,
      staffId: queue[idx].staffId,
      status: STATUS.COMPLETED,
      payload: { entry: queue[idx], timestamp: Date.now() },
    })
  }

  return queue[idx]
}

export function markStarted(id) {
  return updateEntry(id, { status: 'started', startedAt: Date.now() }, 'KITCHEN_TICKET_STARTED')
}

export function markReady(id) {
  return updateEntry(id, { status: 'ready', readyAt: Date.now() }, 'KITCHEN_TICKET_READY')
}

export function markCompleted(id) {
  return updateEntry(id, { status: 'completed', completedAt: Date.now() }, 'KITCHEN_TICKET_COMPLETED')
}

export function getQueueForTicket(ticketId) {
  return getQueue().filter((e) => e.ticketId === ticketId)
}

export function getActiveQueueLength() {
  return getQueue().filter((e) => e.status === 'queued' || e.status === 'started').length
}
