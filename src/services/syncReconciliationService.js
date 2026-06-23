/**
 * Sync Reconciliation Service — Phase 6E
 * Staff-facing view of failed/blocked/manual-review local outbox events,
 * with enough business context (order/ticket/table/station/staff/guest IDs)
 * for a human to decide what to do. Never marks an event `resolved_confirmed`
 * unless the backend has confirmed it, or a staff member explicitly records
 * a manual resolution reason — this service does not invent confirmation.
 */

import { getAllEvents, getFailedEvents, patchEvent } from './syncQueueService.js'
import { getSyncStatus } from './syncApiClient.js'

export const RECONCILIATION_STATUSES = [
  'pending_review',
  'retry_safe',
  'blocked_backend_unavailable',
  'blocked_duplicate_risk',
  'manual_review_required',
  'resolved_confirmed',
  'reopened',
  'ignored_safe_duplicate',
]

function extractEntityContext(event) {
  const p = event.payload || {}
  const entry = p.entry || {}
  const ticket = p.ticket || {}
  const command = p.command || {}

  return {
    orderId: ticket.id || (event.sourceSystem === 'POS3' ? event.entityId : null) || null,
    ticketId: entry.ticketId || null,
    tableId: ticket.tableId || entry.tableId || null,
    station: event.sourceSystem === 'KITCHEN' ? 'kitchen'
      : event.sourceSystem === 'BAR' ? 'bar'
      : event.sourceSystem === 'HUMIDOR' ? 'humidor'
      : null,
    staffId: entry.staffId || command.staffId || null,
    guestOrUserId: p.guestId || p.userId || p.sessionId || null,
    entityType: event.sourceSystem || null,
    entityId: event.entityId || null,
  }
}

/** Failed/blocked/manual-review events, with optional filters. */
export async function getReconciliationQueue(options = {}) {
  const all = await getAllEvents()
  let candidates = all.filter((e) =>
    e.syncStatus === 'failed' ||
    e.requiresManualReview ||
    e.replayStatus === 'blocked' ||
    e.replayStatus === 'failed'
  )
  if (options.sourceSystem) {
    candidates = candidates.filter((e) => e.sourceSystem === options.sourceSystem)
  }
  if (options.reconciliationStatus) {
    candidates = candidates.filter((e) => e.reconciliationStatus === options.reconciliationStatus)
  }
  return candidates.map((e) => buildReconciliationView(e))
}

function buildReconciliationView(event) {
  const ctx = extractEntityContext(event)
  return {
    eventId: event.eventId,
    eventType: event.eventType,
    businessActionFingerprint: event.businessActionFingerprint,
    ...ctx,
    lastAttemptAt: event.lastAttemptAt || event.lastReplayAttemptAt || null,
    retryCount: event.retryCount || 0,
    errorMessage: event.lastError || event.replayBlockedReason || null,
    suggestedAction: suggestReconciliationAction(event, {}).suggestedAction,
    requiresManualReview: Boolean(event.requiresManualReview),
    reconciliationStatus: event.reconciliationStatus || 'pending_review',
    reconciliationNote: event.reconciliationNote || null,
    conflictType: event.conflictType || null,
    replayStatus: event.replayStatus || 'not_attempted',
  }
}

export async function getFailedEventDetails(eventId) {
  const all = await getAllEvents()
  const event = all.find((e) => e.eventId === eventId)
  if (!event) return null
  return { ...buildReconciliationView(event), raw: event }
}

/** Classifies a failed event into a reconciliation bucket based on its current state. */
export function classifyFailedEvent(event) {
  if (!event) return 'pending_review'
  if (event.reconciliationStatus === 'resolved_confirmed') return 'resolved_confirmed'
  if (event.requiresManualReview) return 'manual_review_required'
  if (event.conflictType === 'duplicate_business_action' || event.conflictType === 'duplicate_event_id') {
    return 'blocked_duplicate_risk'
  }
  if (event.replayBlockedReason?.toLowerCase().includes('backend unavailable') ||
      event.replayStatus === 'backend_unavailable') {
    return 'blocked_backend_unavailable'
  }
  if (event.syncStatus === 'failed' && event.retryCount > 0) return 'retry_safe'
  return 'pending_review'
}

/** Honest, non-committal suggestion only — staff still decides. */
export function suggestReconciliationAction(event, context = {}) {
  const bucket = classifyFailedEvent(event)
  const suggestions = {
    resolved_confirmed: 'No action needed — already confirmed by backend.',
    manual_review_required: 'Review the business details below and decide whether to retry, ignore, or escalate.',
    blocked_duplicate_risk: 'Check whether this action was already recorded under a different eventId before retrying.',
    blocked_backend_unavailable: 'Wait for backend to become reachable, then retry — do not mark resolved manually.',
    retry_safe: 'Likely safe to retry — no conflict detected; use "Retry Safe Events".',
    pending_review: 'Needs staff review before any action is taken.',
  }
  return { bucket, suggestedAction: suggestions[bucket] || suggestions.pending_review }
}

export async function markManualReviewRequired(eventId, reason) {
  return patchEvent(eventId, {
    requiresManualReview: true,
    reconciliationStatus: 'manual_review_required',
    reconciliationNote: reason || null,
    reconciliationUpdatedAt: Date.now(),
  })
}

export async function markReconciliationNote(eventId, note) {
  return patchEvent(eventId, {
    reconciliationNote: note,
    reconciliationUpdatedAt: Date.now(),
  })
}

/**
 * Marks an event's reconciliation as resolved. Requires either explicit
 * backend confirmation (resolution.backendConfirmed === true) or a staff
 * member's explicit reason (resolution.staffReason) — refuses to silently
 * fabricate a resolved state otherwise.
 */
export async function markReconciliationResolved(eventId, resolution = {}) {
  if (!resolution.backendConfirmed && !resolution.staffReason) {
    throw new Error('markReconciliationResolved requires backendConfirmed=true or an explicit staffReason')
  }
  return patchEvent(eventId, {
    reconciliationStatus: 'resolved_confirmed',
    requiresManualReview: false,
    reconciliationNote: resolution.staffReason || resolution.note || 'Resolved — backend confirmed.',
    reconciliationUpdatedAt: Date.now(),
  })
}

export async function reopenReconciliation(eventId, reason) {
  return patchEvent(eventId, {
    reconciliationStatus: 'reopened',
    requiresManualReview: true,
    reconciliationNote: reason || null,
    reconciliationUpdatedAt: Date.now(),
  })
}

export async function getReconciliationSummary() {
  const failed = await getFailedEvents()
  const all = await getAllEvents()
  const flagged = all.filter((e) => e.requiresManualReview)
  let backendReachable = false
  try {
    backendReachable = Boolean(await getSyncStatus())
  } catch {
    backendReachable = false
  }
  return {
    failedCount: failed.length,
    manualReviewCount: flagged.length,
    backendReachable,
    queue: await getReconciliationQueue(),
  }
}
