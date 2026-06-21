/**
 * POS 3 Order Service — ticket CRUD for the touchscreen ordering flow.
 * Extends pos3Service.js's existing `pos3:tickets` localStorage persistence
 * (does not duplicate storage — reads/writes through the same key via
 * getTickets()/saveTickets()). Adds richer line-item shape (modifiers,
 * notes, void/comp tracking, destinations) needed by the new menuCatalog.
 *
 * Structure: small persistence adapter functions at the top, business
 * logic below — so a backend could later replace the adapter functions
 * without touching callers.
 */

import { getTickets, saveTickets, getTicket as getTicketRaw } from './pos3Service.js'
import { emit, SYSTEMS, STATUS } from '../shared/opsEventBus.js'
import { routeTicket } from './stationRoutingService.js'

// ── Persistence adapter (thin — swap for a backend later) ──────────────
function readTickets() { return getTickets() }
function writeTickets(tickets) { saveTickets(tickets); return tickets }
function findIndex(tickets, ticketId) { return tickets.findIndex((t) => t.id === ticketId) }

function uid(prefix = 'TKT') {
  return `${prefix}-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString(36).slice(-4)}`
}
function lineId() { return 'li_' + Math.random().toString(36).slice(2, 10) }

// ── Business logic ──────────────────────────────────────────────────────

export function getOpenTickets() {
  return readTickets().filter((t) => t.status !== 'paid' && t.status !== 'void')
}

export function getTicket(ticketId) { return getTicketRaw(ticketId) }

export function createTicket({ tableId = null, sectionId = null, staffId = null, server = null, guests = 1 } = {}) {
  const tickets = readTickets()
  const ticket = {
    id: uid(),
    tableId,
    sectionId,
    staffId,
    server: server || staffId || 'Unassigned',
    guests,
    status: 'open',
    createdAt: Date.now(),
    items: [],
    voids: [],
    comps: [],
    stationStatus: { kitchen: 'idle', bar: 'idle', humidor: 'idle', retail: 'idle' },
    inventoryWarnings: [],
    destinationReadiness: null,
    sentDestinations: [],
    serviceFee: 0,
    paymentStatus: 'unpaid',
  }
  tickets.push(ticket)
  writeTickets(tickets)

  emit({
    sourceSystem: SYSTEMS.POS3,
    targetSystem: SYSTEMS.EAT,
    eventType: 'POS_TICKET_CREATED',
    commandType: 'POS_TICKET_CREATED',
    tableId,
    sectionId,
    staffId,
    ticketId: ticket.id,
    status: STATUS.COMPLETED,
    payload: { tableId, sectionId, staffId, status: ticket.status, timestamp: ticket.createdAt },
  })

  return ticket
}

export function selectTicket(ticketId) { return getTicket(ticketId) }

export function addItem(ticketId, menuItem, qty = 1, modifiers = [], note = '') {
  const tickets = readTickets()
  const idx = findIndex(tickets, ticketId)
  if (idx === -1) return null

  const modTotal = (modifiers || []).reduce((s, m) => s + (m.priceDelta || 0), 0)
  const item = {
    id: lineId(),
    menuId: menuItem.id,
    name: menuItem.name,
    category: menuItem.category,
    destination: menuItem.destination,
    station: menuItem.destination, // back-compat alias used by older POS3 pages (routingSummary/Pill tone)
    price: menuItem.price + modTotal,
    basePrice: menuItem.price,
    qty,
    modifiers: modifiers || [],
    note: note || '',
    inventorySku: menuItem.inventorySku,
    taxable: menuItem.taxable !== false,
    ageRestricted: !!menuItem.ageRestricted,
    voided: false,
    comped: false,
    addedAt: Date.now(),
  }

  tickets[idx] = { ...tickets[idx], items: [...(tickets[idx].items || []), item] }
  writeTickets(tickets)

  emit({
    sourceSystem: SYSTEMS.POS3,
    targetSystem: SYSTEMS.POS3,
    eventType: 'POS_ITEM_ADDED',
    commandType: 'POS_ITEM_ADDED',
    tableId: tickets[idx].tableId,
    sectionId: tickets[idx].sectionId,
    staffId: tickets[idx].staffId,
    ticketId,
    productId: menuItem.id,
    inventoryId: menuItem.inventorySku,
    status: STATUS.COMPLETED,
    payload: { item, qty, destination: menuItem.destination, timestamp: Date.now() },
  })

  return tickets[idx]
}

export function removeItem(ticketId, itemId) {
  const tickets = readTickets()
  const idx = findIndex(tickets, ticketId)
  if (idx === -1) return null
  const removed = (tickets[idx].items || []).find((i) => i.id === itemId)
  tickets[idx] = { ...tickets[idx], items: (tickets[idx].items || []).filter((i) => i.id !== itemId) }
  writeTickets(tickets)

  emit({
    sourceSystem: SYSTEMS.POS3,
    targetSystem: SYSTEMS.POS3,
    eventType: 'POS_ITEM_REMOVED',
    commandType: 'POS_ITEM_REMOVED',
    tableId: tickets[idx].tableId,
    ticketId,
    productId: removed?.menuId,
    inventoryId: removed?.inventorySku,
    status: STATUS.COMPLETED,
    payload: { item: removed, timestamp: Date.now() },
  })

  return tickets[idx]
}

export function changeQuantity(ticketId, itemId, qty) {
  const tickets = readTickets()
  const idx = findIndex(tickets, ticketId)
  if (idx === -1) return null
  const nextQty = Math.max(0, qty)
  let items = (tickets[idx].items || []).map((i) => (i.id === itemId ? { ...i, qty: nextQty } : i))
  if (nextQty === 0) items = items.filter((i) => i.id !== itemId)
  tickets[idx] = { ...tickets[idx], items }
  writeTickets(tickets)
  return tickets[idx]
}

export function addModifier(ticketId, itemId, modifier) {
  const tickets = readTickets()
  const idx = findIndex(tickets, ticketId)
  if (idx === -1) return null
  const items = (tickets[idx].items || []).map((i) => {
    if (i.id !== itemId) return i
    const modifiers = [...(i.modifiers || []), modifier]
    const modTotal = modifiers.reduce((s, m) => s + (m.priceDelta || 0), 0)
    return { ...i, modifiers, price: i.basePrice + modTotal }
  })
  tickets[idx] = { ...tickets[idx], items }
  writeTickets(tickets)
  return tickets[idx]
}

export function addNote(ticketId, itemId, note) {
  const tickets = readTickets()
  const idx = findIndex(tickets, ticketId)
  if (idx === -1) return null
  const items = (tickets[idx].items || []).map((i) => (i.id === itemId ? { ...i, note } : i))
  tickets[idx] = { ...tickets[idx], items }
  writeTickets(tickets)
  return tickets[idx]
}

/** Group a ticket's items by destination (kitchen/bar/humidor/retail). */
export function groupByDestination(ticket) {
  const groups = { kitchen: [], bar: [], humidor: [], retail: [] }
  ;(ticket?.items || []).forEach((i) => {
    const d = i.destination || i.station || 'kitchen'
    if (!groups[d]) groups[d] = []
    groups[d].push(i)
  })
  return groups
}

/** Send a ticket to its destination station(s); emits POS_TICKET_SENT. */
export function sendTicket(ticketId, destinations = null) {
  const tickets = readTickets()
  const idx = findIndex(tickets, ticketId)
  if (idx === -1) return null
  const ticket = tickets[idx]
  const groups = groupByDestination(ticket)
  const targetDestinations = destinations || Object.keys(groups).filter((d) => groups[d].length > 0)

  tickets[idx] = { ...ticket, status: 'sent', sentAt: Date.now(), sentDestinations: targetDestinations }
  writeTickets(tickets)

  emit({
    sourceSystem: SYSTEMS.POS3,
    targetSystem: SYSTEMS.EAT,
    eventType: 'POS_TICKET_SENT',
    commandType: 'POS_TICKET_SENT',
    tableId: ticket.tableId,
    sectionId: ticket.sectionId,
    staffId: ticket.staffId,
    ticketId,
    status: STATUS.COMPLETED,
    payload: {
      destinations: targetDestinations,
      items: ticket.items,
      itemCount: ticket.items.length,
      status: 'sent',
      timestamp: Date.now(),
    },
  })

  // Route items into kitchen/bar/humidor queues + apply inventory impact.
  try { routeTicket(tickets[idx]) } catch {}

  return tickets[idx]
}

export function holdTicket(ticketId) {
  const tickets = readTickets()
  const idx = findIndex(tickets, ticketId)
  if (idx === -1) return null
  tickets[idx] = { ...tickets[idx], status: 'held', heldAt: Date.now() }
  writeTickets(tickets)
  return tickets[idx]
}

export function voidItem(ticketId, itemId, reason = '') {
  const tickets = readTickets()
  const idx = findIndex(tickets, ticketId)
  if (idx === -1) return null
  let voidedItem = null
  const items = (tickets[idx].items || []).map((i) => {
    if (i.id !== itemId) return i
    voidedItem = { ...i, voided: true, voidReason: reason }
    return voidedItem
  })
  const voids = [...(tickets[idx].voids || []), { itemId, reason, voidedAt: Date.now() }]
  tickets[idx] = { ...tickets[idx], items, voids }
  writeTickets(tickets)

  emit({
    sourceSystem: SYSTEMS.POS3,
    targetSystem: SYSTEMS.EAT,
    eventType: 'POS_ITEM_VOIDED',
    commandType: 'POS_ITEM_VOIDED',
    tableId: tickets[idx].tableId,
    staffId: tickets[idx].staffId,
    ticketId,
    productId: voidedItem?.menuId,
    status: STATUS.COMPLETED,
    payload: { item: voidedItem, reason, timestamp: Date.now() },
  })

  return tickets[idx]
}

export function compItem(ticketId, itemId, reason = '') {
  const tickets = readTickets()
  const idx = findIndex(tickets, ticketId)
  if (idx === -1) return null
  let compedItem = null
  const items = (tickets[idx].items || []).map((i) => {
    if (i.id !== itemId) return i
    compedItem = { ...i, comped: true, compReason: reason }
    return compedItem
  })
  const comps = [...(tickets[idx].comps || []), { itemId, reason, compedAt: Date.now() }]
  tickets[idx] = { ...tickets[idx], items, comps }
  writeTickets(tickets)

  emit({
    sourceSystem: SYSTEMS.POS3,
    targetSystem: SYSTEMS.EAT,
    eventType: 'POS_ITEM_COMPED',
    commandType: 'POS_ITEM_COMPED',
    tableId: tickets[idx].tableId,
    staffId: tickets[idx].staffId,
    ticketId,
    productId: compedItem?.menuId,
    status: STATUS.COMPLETED,
    payload: { item: compedItem, reason, timestamp: Date.now() },
  })

  return tickets[idx]
}

/** Close a ticket (generic lifecycle end — used after payment is recorded). */
export function closeTicket(ticketId, { status = 'paid' } = {}) {
  const tickets = readTickets()
  const idx = findIndex(tickets, ticketId)
  if (idx === -1) return null
  tickets[idx] = { ...tickets[idx], status, closedAt: Date.now(), paymentStatus: status === 'paid' ? 'paid' : tickets[idx].paymentStatus }
  writeTickets(tickets)

  emit({
    sourceSystem: SYSTEMS.POS3,
    targetSystem: SYSTEMS.EAT,
    eventType: 'POS_TICKET_CLOSED',
    commandType: 'POS_TICKET_CLOSED',
    tableId: tickets[idx].tableId,
    sectionId: tickets[idx].sectionId,
    staffId: tickets[idx].staffId,
    ticketId,
    status: STATUS.COMPLETED,
    payload: { status, timestamp: Date.now() },
  })

  return tickets[idx]
}

/** Alias used by checkout flow after payment completes — same as closeTicket('paid'). */
export function cashoutTicket(ticketId) {
  return closeTicket(ticketId, { status: 'paid' })
}

/** Set the per-item station/destination statuses on a ticket (stationStatus map). */
export function setStationStatus(ticketId, destination, status) {
  const tickets = readTickets()
  const idx = findIndex(tickets, ticketId)
  if (idx === -1) return null
  const stationStatus = { ...(tickets[idx].stationStatus || {}), [destination]: status }
  tickets[idx] = { ...tickets[idx], stationStatus }
  writeTickets(tickets)
  return tickets[idx]
}

/** Set inventory warnings array on a ticket (used by orderReadinessService). */
export function setInventoryWarnings(ticketId, warnings) {
  const tickets = readTickets()
  const idx = findIndex(tickets, ticketId)
  if (idx === -1) return null
  tickets[idx] = { ...tickets[idx], inventoryWarnings: warnings }
  writeTickets(tickets)
  return tickets[idx]
}

/** Set the readiness object computed by orderReadinessService.checkReadiness(). */
export function setDestinationReadiness(ticketId, readiness) {
  const tickets = readTickets()
  const idx = findIndex(tickets, ticketId)
  if (idx === -1) return null
  tickets[idx] = { ...tickets[idx], destinationReadiness: readiness }
  writeTickets(tickets)
  return tickets[idx]
}
