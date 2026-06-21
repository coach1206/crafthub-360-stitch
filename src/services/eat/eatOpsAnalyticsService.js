/**
 * E.A.T. Ops Analytics Service — reads shared ops events + POS3 tickets,
 * receipts, and inventory impact entries from localStorage and derives
 * management-facing metrics: ticket counts/lifecycle, revenue, destination
 * breakdown, pending humidor requests, voids/comps, inventory impact, and
 * staff activity.
 */

import { getOpsEvents } from '../shared/opsEventBus.js'
import { getTickets } from '../pos3/pos3Service.js'
import { getReceipts } from '../pos3/receiptService.js'
import { getInventoryImpacts } from '../pos3/inventoryImpactService.js'

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function getTicketCounts() {
  const tickets = getTickets()
  return {
    open: tickets.filter((t) => t.status === 'open').length,
    sent: tickets.filter((t) => t.status === 'sent').length,
    held: tickets.filter((t) => t.status === 'held').length,
    paid: tickets.filter((t) => t.status === 'paid').length,
    total: tickets.length,
  }
}

export function getRevenueToday() {
  const since = startOfToday()
  const receipts = getReceipts().filter((r) => r.paidAt >= since)
  const revenue = receipts.reduce((s, r) => s + (r.total || 0), 0)
  const avgTicket = receipts.length ? revenue / receipts.length : 0
  return { revenue, ticketCount: receipts.length, avgTicket }
}

export function getDestinationBreakdown() {
  const tickets = getTickets()
  const counts = { kitchen: 0, bar: 0, humidor: 0, retail: 0 }
  tickets.forEach((t) => {
    ;(t.items || []).forEach((i) => {
      const d = i.destination || i.station || 'kitchen'
      counts[d] = (counts[d] || 0) + (i.qty || 1)
    })
  })
  return counts
}

export function getPendingHumidorRequests() {
  const events = getOpsEvents()
  return events.filter((e) => e.targetSystem === 'EAT' && e.commandType === 'CIGAR_REQUESTED' && e.status !== 'completed')
}

export function getVoidsAndComps() {
  const events = getOpsEvents()
  return {
    voids: events.filter((e) => e.eventType === 'POS_ITEM_VOIDED').length,
    comps: events.filter((e) => e.eventType === 'POS_ITEM_COMPED').length,
  }
}

export function getInventoryImpactList() {
  return [...getInventoryImpacts()].sort((a, b) => b.createdAt - a.createdAt)
}

export function getStaffActivityList() {
  const events = getOpsEvents()
  return events
    .filter((e) => e.eventType === 'EAT_STAFF_ACTIVITY_CREATED')
    .sort((a, b) => b.createdAt - a.createdAt)
}

export function getStaffActivityCounts() {
  const list = getStaffActivityList()
  const byStaff = {}
  list.forEach((e) => {
    const id = e.staffId || 'unknown'
    byStaff[id] = (byStaff[id] || 0) + 1
  })
  return byStaff
}

export function getRecentTickets(limit = 20) {
  return [...getTickets()].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, limit)
}

/** Single bundled read for dashboards — avoids repeated localStorage hits. */
export function getEatOpsSnapshot() {
  return {
    ticketCounts: getTicketCounts(),
    revenueToday: getRevenueToday(),
    destinationBreakdown: getDestinationBreakdown(),
    pendingHumidorRequests: getPendingHumidorRequests(),
    voidsAndComps: getVoidsAndComps(),
    inventoryImpacts: getInventoryImpactList(),
    staffActivity: getStaffActivityList(),
    staffActivityCounts: getStaffActivityCounts(),
    recentTickets: getRecentTickets(),
  }
}
