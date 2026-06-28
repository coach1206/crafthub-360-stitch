/**
 * POS 3 Service — local-first persistence for tables, tickets, menu, staff.
 * Seeds from src/data/pos3/seedData.js on first run, then persists to
 * localStorage. Wires ticket lifecycle to the shared ops event bus so E.A.T.
 * sees real activity.
 */

import { POS3_TABLES, POS3_TICKETS, POS3_MENU, POS3_STAFF, TAX_RATE, POS3_LAYOUT_SECTIONS } from '../../data/pos3/seedData.js'
import { opsGet, opsSet } from '../shared/opsStorage.js'
import { emit, SYSTEMS } from '../shared/opsEventBus.js'
import { saveEvent } from '../syncQueueService.js'

const K = {
  tables:  'pos3:tables',
  tickets: 'pos3:tickets',
}

function ensureSeeded() {
  if (opsGet(K.tables, null) == null) opsSet(K.tables, POS3_TABLES)
  if (opsGet(K.tickets, null) == null) opsSet(K.tickets, POS3_TICKETS)
}

export function getMenu()  { return POS3_MENU }
export function getStaff() { return POS3_STAFF }

export function getTables() { ensureSeeded(); return opsGet(K.tables, POS3_TABLES) }
export function getTickets() { ensureSeeded(); return opsGet(K.tickets, POS3_TICKETS) }
export function getTicket(id) { return getTickets().find((t) => t.id === id) || null }

export function saveTickets(tickets) { opsSet(K.tickets, tickets) }
export function saveTables(tables)   { opsSet(K.tables, tables) }

/** Layout sections shared by POS3 Tables (handheld) and E.A.T. Sections (manager editor). */
export function getLayoutSections() { return POS3_LAYOUT_SECTIONS }

/**
 * Updates a single table's drag position (x/y, 0-100 percent within its
 * section canvas) and persists it via saveTables. Shared by POS3 Tables
 * and E.A.T. Sections so both screens read/write the same layout data.
 * Layout persists locally until a backend table-layout endpoint is connected.
 */
export function updateTablePosition(tableId, x, y) {
  const tables = getTables().map((t) => (t.id === tableId ? { ...t, x, y } : t))
  saveTables(tables)
  return tables
}

/**
 * Moves a table to a different section (e.g. dragged from Lounge to Patio)
 * at the given x/y, keeping its status/server/reservation/order data intact.
 * Same local persistence as updateTablePosition — no backend table-layout
 * endpoint exists yet.
 */
export function moveTableToSection(tableId, section, x, y) {
  const tables = getTables().map((t) => (t.id === tableId ? { ...t, section, x, y } : t))
  saveTables(tables)
  return tables
}

function uid(prefix = 'TKT') {
  return `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`
}

export function ticketTotals(ticket) {
  const subtotal = (ticket?.items || []).reduce((s, i) => s + i.price * i.qty, 0)
  const tax = subtotal * TAX_RATE
  return { subtotal, tax, total: subtotal + tax }
}

export function routingSummary(ticket) {
  const counts = { kitchen: 0, bar: 0, humidor: 0 }
  ;(ticket?.items || []).forEach((i) => { counts[i.station] = (counts[i.station] || 0) + i.qty })
  return counts
}

export function createTicket({ tableId, server, guests, items = [] }) {
  const tickets = getTickets()
  const ticket = {
    id: uid(),
    tableId,
    server: server || 'Unassigned',
    guests: guests || 1,
    status: 'open',
    createdAt: Date.now(),
    items,
  }
  tickets.push(ticket)
  saveTickets(tickets)
  saveEvent({
    sourceSystem: 'POS3',
    eventType: 'OrderCreated',
    entityId: ticket.id,
    payload: { ticket },
  }).catch(() => {})
  return ticket
}

export function upsertTicketItems(ticketId, items) {
  const tickets = getTickets()
  const idx = tickets.findIndex((t) => t.id === ticketId)
  if (idx === -1) return null
  tickets[idx] = { ...tickets[idx], items }
  saveTickets(tickets)
  saveEvent({
    sourceSystem: 'POS3',
    eventType: 'OrderUpdated',
    entityId: ticketId,
    payload: { ticket: tickets[idx] },
  }).catch(() => {})
  return tickets[idx]
}

/** Send a ticket's order to its stations; emits ORDER_SENT to E.A.T. */
export function sendOrder(ticketId) {
  const tickets = getTickets()
  const idx = tickets.findIndex((t) => t.id === ticketId)
  if (idx === -1) return null
  tickets[idx] = { ...tickets[idx], status: 'sent', sentAt: Date.now() }
  saveTickets(tickets)
  const t = tickets[idx]
  emit({
    sourceSystem: SYSTEMS.POS3,
    targetSystem: SYSTEMS.EAT,
    eventType: 'ORDER_SENT',
    commandType: 'ORDER_SENT',
    tableId: t.tableId,
    ticketId: t.id,
    payload: { routing: routingSummary(t), total: ticketTotals(t).total, server: t.server },
  })
  saveEvent({
    sourceSystem: 'POS3',
    eventType: 'OrderUpdated',
    entityId: t.id,
    payload: { ticket: t },
  }).catch(() => {})
  return t
}

export function holdTicket(ticketId) {
  const tickets = getTickets()
  const idx = tickets.findIndex((t) => t.id === ticketId)
  if (idx === -1) return null
  tickets[idx] = { ...tickets[idx], status: 'held' }
  saveTickets(tickets)
  return tickets[idx]
}

/** Mark a ticket paid + checked out; emits TICKET_CHECKED_OUT to E.A.T. */
export function checkoutTicket(ticketId, { method = 'manual', provider = 'local' } = {}) {
  const tickets = getTickets()
  const idx = tickets.findIndex((t) => t.id === ticketId)
  if (idx === -1) return null
  const totals = ticketTotals(tickets[idx])
  tickets[idx] = { ...tickets[idx], status: 'paid', paidAt: Date.now(), paymentMethod: method, paymentProvider: provider }
  saveTickets(tickets)
  const t = tickets[idx]
  emit({
    sourceSystem: SYSTEMS.POS3,
    targetSystem: SYSTEMS.EAT,
    eventType: 'TICKET_CHECKED_OUT',
    commandType: 'TICKET_CHECKED_OUT',
    tableId: t.tableId,
    ticketId: t.id,
    provider,
    payload: { total: totals.total, method, provider },
  })
  saveEvent({
    sourceSystem: 'POS3',
    eventType: 'OrderClosed',
    entityId: t.id,
    payload: { ticket: t, total: totals.total, method, provider },
  }).catch(() => {})
  return t
}
