/**
 * Shared Ops Event Bus — local-first event bus connecting SmokeCraft, POS3,
 * E.A.T. and NOVEE through localStorage + window CustomEvents (no backend).
 *
 * emit(event)        → normalizes + appends to shared:opsEvents, dispatches
 *                      a `novee-ops-event` CustomEvent for same-tab listeners.
 * subscribe(handler) → listens for both the CustomEvent (same tab) and the
 *                      native `storage` event (cross-tab) and invokes handler.
 *
 * Normalized event/command shape:
 *  { id, parentSystem, platformSystem, sourceSystem, targetSystem, eventType,
 *    commandType, tableId, sectionId, staffId, ticketId, productId,
 *    inventoryId, provider, payload, status, createdAt, resolvedAt }
 */

import { OPS_KEYS, opsAppend, getOpsEvents } from './opsStorage.js'

export { getOpsEvents }

export const OPS_EVENT_NAME = 'novee-ops-event'

export const SYSTEMS = { SMOKECRAFT: 'SMOKECRAFT', POS3: 'POS3', EAT: 'EAT', NOVEE: 'NOVEE' }

export const STATUS = {
  PENDING: 'pending', SENT: 'sent', RECEIVED: 'received', COMPLETED: 'completed',
  FAILED: 'failed', QUEUED: 'queued', CANCELLED: 'cancelled',
}

function uid() {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  } catch {}
  return `ops_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

/** Builds a fully-normalized ops event object (all known keys present). */
export function normalizeEvent(partial = {}) {
  return {
    id:           partial.id || uid(),
    parentSystem: partial.parentSystem || 'NOVEE',
    platformSystem: partial.platformSystem || 'CRAFTHUB',
    sourceSystem: partial.sourceSystem || SYSTEMS.NOVEE,
    targetSystem: partial.targetSystem || SYSTEMS.NOVEE,
    eventType:    partial.eventType || null,
    commandType:  partial.commandType || null,
    tableId:      partial.tableId ?? null,
    sectionId:    partial.sectionId ?? null,
    staffId:      partial.staffId ?? null,
    ticketId:     partial.ticketId ?? null,
    productId:    partial.productId ?? null,
    inventoryId:  partial.inventoryId ?? null,
    provider:     partial.provider ?? null,
    payload:      partial.payload ?? {},
    status:       partial.status || STATUS.PENDING,
    createdAt:    partial.createdAt || Date.now(),
    resolvedAt:   partial.resolvedAt ?? null,
  }
}

/** Emits an event onto the shared bus. Returns the normalized event. */
export function emit(partial) {
  const event = normalizeEvent(partial)
  opsAppend(OPS_KEYS.events, event)
  try {
    window.dispatchEvent(new CustomEvent(OPS_EVENT_NAME, { detail: event }))
  } catch {}
  return event
}

/**
 * Subscribe to ops bus activity. Calls handler(event|null) on same-tab emits
 * (event provided) and on cross-tab storage writes (null → re-read store).
 * Returns an unsubscribe function.
 */
export function subscribe(handler) {
  const onCustom = (e) => handler(e.detail || null)
  const onStorage = (e) => {
    if (e.key === OPS_KEYS.events || e.key === OPS_KEYS.commands || e.key === null) {
      handler(null)
    }
  }
  window.addEventListener(OPS_EVENT_NAME, onCustom)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(OPS_EVENT_NAME, onCustom)
    window.removeEventListener('storage', onStorage)
  }
}

/** Convenience: read events filtered to those targeting `system`. */
export function eventsFor(system) {
  return getOpsEvents().filter((e) => e.targetSystem === system)
}
