/**
 * POS360 Audit Log — Phase 4.13, Part 3.
 *
 * Local audit log active. Backend immutable audit storage required for
 * production. Entries live in localStorage under `pos3:auditLog` via the
 * shared opsStorage helpers. This is NOT tamper-proof — anything that can
 * write to localStorage can rewrite history. It exists so POS360's UI has
 * something real to read from while a durable backend log is built.
 */

import { opsGet, opsSet } from '../shared/opsStorage.js'

export const AUDIT_HONESTY_NOTICE =
  'Local audit log active. Backend immutable audit storage required for production.'

const STORAGE_KEY = 'pos3:auditLog'
const MAX_ENTRIES = 1000

export const AUDIT_EVENT_TYPES = {
  TABLE_MOVED: 'table_moved',
  FLOOR_LAYOUT_CHANGED: 'floor_layout_changed',
  TABLE_OPENED: 'table_opened',
  TABLE_CLOSED: 'table_closed',
  ORDER_CREATED: 'order_created',
  ITEM_ADDED: 'item_added',
  ITEM_VOIDED: 'item_voided',
  ITEM_COMPED: 'item_comped',
  CHECK_TRANSFERRED: 'check_transferred',
  CHECK_SPLIT: 'check_split',
  TABLES_MERGED: 'tables_merged',
  REFUND_ISSUED: 'refund_issued',
  PAYMENT_RECORDED: 'payment_recorded',
  INVENTORY_EDITED: 'inventory_edited',
  STAFF_REASSIGNED: 'staff_reassigned',
  DRINK_MARKED_SERVED: 'drink_marked_served',
  SETTINGS_CHANGED: 'settings_changed',
  APPROVAL_REQUESTED: 'approval_requested',
  APPROVAL_APPROVED: 'approval_approved',
  APPROVAL_DENIED: 'approval_denied',
  RESERVATION_CREATED: 'reservation_created',
  WAITLIST_GUEST_ADDED: 'waitlist_guest_added',
  NO_SHOW_MARKED: 'no_show_marked',
}

function uid() {
  return `aud_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function read() { return opsGet(STORAGE_KEY, []) }
function write(list) { opsSet(STORAGE_KEY, list.slice(-MAX_ENTRIES)); return list }

/** Appends a normalized AuditLogEntry to the local audit log. */
export function recordAuditEvent({
  eventType,
  actorId = null,
  actorName = null,
  actorRole = null,
  targetType = null,
  targetId = null,
  summary = '',
  metadata = {},
} = {}) {
  const entry = {
    id: uid(),
    eventType,
    actorId,
    actorName,
    actorRole,
    targetType,
    targetId,
    summary,
    metadata,
    createdAt: Date.now(),
  }
  const list = read()
  list.push(entry)
  write(list)
  return entry
}

/** Returns all audit entries, most recent first. */
export function getAuditEvents() {
  return [...read()].sort((a, b) => b.createdAt - a.createdAt)
}

/** Returns audit entries for a specific target, most recent first. */
export function getAuditEventsByTarget(targetType, targetId) {
  return getAuditEvents().filter((e) => e.targetType === targetType && e.targetId === targetId)
}

/** Clears the local/demo audit log. Does not touch any backend store (there isn't one). */
export function clearDemoAuditLog() {
  opsSet(STORAGE_KEY, [])
  return []
}
