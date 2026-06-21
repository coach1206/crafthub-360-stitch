/**
 * POS 3 Station Routing Service — routes a sent ticket's items into the
 * kitchen/bar/humidor queues by destination, and records inventory impact
 * via decrementStock. Called from sendTicket flow (POS3Handheld.jsx).
 */

import { pushKitchenTicket } from './kitchenQueueService.js'
import { pushBarTicket } from './barQueueService.js'
import { pushHumidorRequest } from './humidorQueueService.js'
import { decrementStock } from './inventoryAvailabilityService.js'

/**
 * routeTicket(ticket) — groups items by destination and pushes them into
 * the appropriate station queue. Retail items are not queued (no station).
 * Returns { kitchen: [...entries], bar: [...entries], humidor: [...entries] }.
 */
export function routeTicket(ticket) {
  const result = { kitchen: [], bar: [], humidor: [] }
  const items = (ticket?.items || []).filter((i) => !i.voided)

  items.forEach((item) => {
    const dest = item.destination || item.station || 'kitchen'
    const ctx = { ticketId: ticket.id, item, tableId: ticket.tableId, staffId: ticket.staffId }

    if (dest === 'kitchen') {
      result.kitchen.push(pushKitchenTicket(ctx))
    } else if (dest === 'bar') {
      result.bar.push(pushBarTicket(ctx))
    } else if (dest === 'humidor') {
      result.humidor.push(pushHumidorRequest(ctx))
    }

    if (item.inventorySku) {
      decrementStock(item.inventorySku, item.qty || 1, { ticketId: ticket.id })
    }
  })

  return result
}
