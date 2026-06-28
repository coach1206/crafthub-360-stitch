/**
 * POS360 Reservation + Waitlist Service — Phase 4.13, Part 5.
 *
 * Reservations and waitlist are real local state — there's no backend
 * table for either, so everything here lives in localStorage under
 * `pos3:reservations` / `pos3:waitlist` via the shared opsStorage helpers.
 * This is local/demo data: closing the browser's storage or switching
 * devices loses it. A backend reservations table is still required for
 * a real multi-device, multi-host deployment.
 */

import { opsGet, opsSet } from '../shared/opsStorage.js'
import { recordAuditEvent, AUDIT_EVENT_TYPES } from './auditLogService.js'

const RESERVATIONS_KEY = 'pos3:reservations'
const WAITLIST_KEY = 'pos3:waitlist'

export const RESERVATION_STATUS = {
  BOOKED: 'booked',
  CONFIRMED: 'confirmed',
  SEATED: 'seated',
  NO_SHOW: 'noShow',
  CANCELED: 'canceled',
  COMPLETED: 'completed',
}

export const WAITLIST_STATUS = {
  WAITING: 'waiting',
  NOTIFIED: 'notified',
  SEATED: 'seated',
  CANCELED: 'canceled',
  NO_SHOW: 'noShow',
}

function uid(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function readReservations() { return opsGet(RESERVATIONS_KEY, []) }
function writeReservations(list) { opsSet(RESERVATIONS_KEY, list); return list }
function readWaitlist() { return opsGet(WAITLIST_KEY, []) }
function writeWaitlist(list) { opsSet(WAITLIST_KEY, list); return list }

// ── Reservations ─────────────────────────────────────────────────────────

export function createReservation({
  guestName, phone = '', email = '', partySize = 2, reservationTime,
  tableId = null, vip = false, depositAmount = 0, notes = '',
} = {}) {
  const list = readReservations()
  const reservation = {
    id: uid('res'),
    guestName,
    phone,
    email,
    partySize,
    reservationTime,
    tableId,
    status: RESERVATION_STATUS.BOOKED,
    vip,
    depositAmount,
    notes,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  list.push(reservation)
  writeReservations(list)

  recordAuditEvent({
    eventType: AUDIT_EVENT_TYPES.RESERVATION_CREATED,
    targetType: 'reservation',
    targetId: reservation.id,
    summary: `Reservation created for ${guestName} (party of ${partySize})`,
    metadata: { reservationTime, tableId, vip },
  })

  return reservation
}

export function updateReservation(reservationId, patch = {}) {
  const list = readReservations()
  const idx = list.findIndex((r) => r.id === reservationId)
  if (idx === -1) return null
  list[idx] = { ...list[idx], ...patch, updatedAt: Date.now() }
  writeReservations(list)
  return list[idx]
}

export function cancelReservation(reservationId) {
  return updateReservation(reservationId, { status: RESERVATION_STATUS.CANCELED })
}

export function seatReservation(reservationId, tableId = null) {
  const updated = updateReservation(reservationId, {
    status: RESERVATION_STATUS.SEATED,
    ...(tableId ? { tableId } : {}),
  })
  if (updated) {
    recordAuditEvent({
      eventType: AUDIT_EVENT_TYPES.TABLE_OPENED,
      targetType: 'reservation',
      targetId: reservationId,
      summary: `Reservation seated for ${updated.guestName}`,
      metadata: { tableId: updated.tableId },
    })
  }
  return updated
}

export function markNoShow(reservationId) {
  const updated = updateReservation(reservationId, { status: RESERVATION_STATUS.NO_SHOW })
  if (updated) {
    recordAuditEvent({
      eventType: AUDIT_EVENT_TYPES.NO_SHOW_MARKED,
      targetType: 'reservation',
      targetId: reservationId,
      summary: `Reservation marked no-show: ${updated.guestName}`,
    })
  }
  return updated
}

/** Returns reservations with status booked/confirmed, soonest first. */
export function getUpcomingReservations() {
  return readReservations()
    .filter((r) => [RESERVATION_STATUS.BOOKED, RESERVATION_STATUS.CONFIRMED].includes(r.status))
    .sort((a, b) => new Date(a.reservationTime) - new Date(b.reservationTime))
}

export function getAllReservations() {
  return readReservations()
}

// ── Waitlist ─────────────────────────────────────────────────────────────

export function addWaitlistEntry({
  guestName, phone = '', partySize = 2, preferredSection = null, vip = false,
} = {}) {
  const list = readWaitlist()
  const entry = {
    id: uid('wl'),
    guestName,
    phone,
    partySize,
    quotedWaitMinutes: calculateQuotedWaitTime(partySize),
    status: WAITLIST_STATUS.WAITING,
    preferredSection,
    vip,
    createdAt: Date.now(),
    seatedAt: null,
  }
  list.push(entry)
  writeWaitlist(list)

  recordAuditEvent({
    eventType: AUDIT_EVENT_TYPES.WAITLIST_GUEST_ADDED,
    targetType: 'waitlist',
    targetId: entry.id,
    summary: `${guestName} added to waitlist (party of ${partySize})`,
    metadata: { quotedWaitMinutes: entry.quotedWaitMinutes },
  })

  return entry
}

export function updateWaitlistEntry(entryId, patch = {}) {
  const list = readWaitlist()
  const idx = list.findIndex((e) => e.id === entryId)
  if (idx === -1) return null
  list[idx] = { ...list[idx], ...patch }
  writeWaitlist(list)
  return list[idx]
}

export function seatWaitlistEntry(entryId, tableId = null) {
  const updated = updateWaitlistEntry(entryId, { status: WAITLIST_STATUS.SEATED, seatedAt: Date.now() })
  if (updated) {
    recordAuditEvent({
      eventType: AUDIT_EVENT_TYPES.TABLE_OPENED,
      targetType: 'waitlist',
      targetId: entryId,
      summary: `Waitlist guest seated: ${updated.guestName}`,
      metadata: { tableId },
    })
  }
  return updated
}

/** Returns waitlist entries still waiting/notified, oldest first (FIFO). */
export function getActiveWaitlist() {
  return readWaitlist()
    .filter((e) => [WAITLIST_STATUS.WAITING, WAITLIST_STATUS.NOTIFIED].includes(e.status))
    .sort((a, b) => a.createdAt - b.createdAt)
}

export function getAllWaitlistEntries() {
  return readWaitlist()
}

/**
 * Quotes a wait time in minutes from current active waitlist depth and
 * party size. Local/demo heuristic, not a real seating-availability model:
 * base 10 min + 5 min per party already waiting + 2 min per extra guest.
 */
export function calculateQuotedWaitTime(partySize = 2) {
  const waitingAhead = getActiveWaitlist().length
  const base = 10 + waitingAhead * 5
  const sizePenalty = Math.max(0, partySize - 2) * 2
  return base + sizePenalty
}
