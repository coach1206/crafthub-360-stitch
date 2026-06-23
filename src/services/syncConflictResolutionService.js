/**
 * Sync Conflict Resolution Service — Phase 6E
 * Decides whether a locally-queued event is safe to replay to the backend
 * without duplicating a real-world business action (an order, ticket,
 * stamp, payment, or command). This service only classifies and records
 * decisions — it never marks anything synced; only
 * syncQueueService.markSynced() (called after backend confirmation) does
 * that.
 */

import { createBusinessActionFingerprint } from './shared/businessActionFingerprint.js'
import { getAllEvents } from './syncQueueService.js'

export const CONFLICT_TYPES = [
  'none',
  'duplicate_event_id',
  'duplicate_business_action',
  'stale_event',
  'conflicting_update',
  'already_processed',
  'backend_missing',
  'local_missing',
  'unsafe_replay',
  'missing_fingerprint',
  'unknown',
]

export const CONFLICT_DECISIONS = [
  'replay_allowed',
  'replay_blocked',
  'backend_wins',
  'local_wins',
  'manual_review_required',
  'already_processed_no_action',
  'ignored_safe_duplicate',
  'backend_unavailable_blocked',
]

// Conflicts touching these source systems/eventType substrings default to
// manual review rather than auto-resolution, per the money/order/ticket/
// payment/passport/stamp rule.
const SENSITIVE_EVENT_PATTERNS = [
  'Order', 'Checkout', 'Payment', 'Stamp', 'Passport', 'Ticket', 'Humidor',
]

let decisionLog = []

function isSensitiveEvent(eventType = '') {
  return SENSITIVE_EVENT_PATTERNS.some((p) => eventType.includes(p))
}

/**
 * Compares a local pending event against a backend event (if any was found
 * via fingerprint/eventId lookup). `context` may carry { backendReachable,
 * backendEvent, matchingLocalEvents }.
 */
export function detectConflict(localEvent, backendEvent, context = {}) {
  if (!localEvent) return { conflictType: 'local_missing' }
  if (context.backendReachable === false) {
    return { conflictType: 'backend_missing' }
  }
  if (backendEvent && backendEvent.eventId === localEvent.eventId) {
    return { conflictType: 'duplicate_event_id', backendEvent }
  }
  if (backendEvent && localEvent.businessActionFingerprint &&
      backendEvent.businessActionFingerprint === localEvent.businessActionFingerprint) {
    return { conflictType: 'duplicate_business_action', backendEvent }
  }
  if (!backendEvent) {
    return { conflictType: 'none' }
  }
  return { conflictType: 'unknown', backendEvent }
}

/**
 * Full classification combining fingerprint state, conflict detection, and
 * sensitivity rules. Returns a conflict object ready for resolveConflict().
 */
export function classifyConflict(localEvent, backendEvent, context = {}) {
  if (!localEvent) {
    return buildConflict(localEvent, 'local_missing', context)
  }

  const fingerprint = localEvent.businessActionFingerprint ||
    createBusinessActionFingerprint(localEvent)

  if (!fingerprint) {
    return buildConflict(localEvent, 'missing_fingerprint', context)
  }

  if (context.backendReachable === false) {
    return buildConflict(localEvent, 'backend_missing', context)
  }

  const { conflictType, backendEvent: matched } = detectConflict(localEvent, backendEvent, context)
  return buildConflict(localEvent, conflictType, { ...context, backendEvent: matched || backendEvent })
}

function buildConflict(localEvent, conflictType, context) {
  return {
    eventId: localEvent?.eventId || null,
    eventType: localEvent?.eventType || null,
    businessActionFingerprint: localEvent?.businessActionFingerprint || null,
    conflictType,
    localEvent,
    backendEvent: context.backendEvent || null,
    context,
  }
}

/** Routes a classified conflict to the matching resolver. Never marks synced. */
export function resolveConflict(conflict, options = {}) {
  if (!conflict) return null
  switch (conflict.conflictType) {
    case 'duplicate_event_id':
      return resolveDuplicateEvent(conflict)
    case 'duplicate_business_action':
      return resolveDuplicateBusinessAction(conflict)
    case 'stale_event':
      return resolveStaleEvent(conflict)
    case 'conflicting_update':
      return resolveConflictingUpdate(conflict)
    case 'already_processed':
      return resolveAlreadyProcessed(conflict)
    case 'backend_missing':
      return finalizeDecision(conflict, 'backend_unavailable_blocked',
        'Backend status unavailable — replay blocked until confirmation is possible.', { requiresManualReview: false, safeToAutoResolve: true })
    case 'missing_fingerprint':
      return finalizeDecision(conflict, 'manual_review_required',
        'No business-action fingerprint could be derived — staff review required before replay.', { requiresManualReview: true, safeToAutoResolve: false })
    case 'none':
      return finalizeDecision(conflict, 'replay_allowed',
        'No conflict detected against backend state.', { requiresManualReview: false, safeToAutoResolve: true })
    case 'unknown':
    default:
      return finalizeDecision(conflict, 'manual_review_required',
        'Conflict could not be confidently classified — staff review required.', { requiresManualReview: true, safeToAutoResolve: false }, options)
  }
}

export function resolveDuplicateEvent(conflict) {
  // Exact eventId match against a backend-confirmed event — the backend
  // already has this event; replaying again would duplicate nothing
  // (idempotent on eventId per Phase 6B) but there is also nothing to do.
  return finalizeDecision(conflict, 'already_processed_no_action',
    'Backend already has this exact eventId — no replay needed.', { requiresManualReview: false, safeToAutoResolve: true })
}

export function resolveDuplicateBusinessAction(conflict) {
  const sensitive = isSensitiveEvent(conflict.eventType || '')
  if (sensitive) {
    return finalizeDecision(conflict, 'manual_review_required',
      'Same business action appears already processed under a different eventId — money/order/ticket/passport conflicts require staff confirmation before being ignored.',
      { requiresManualReview: true, safeToAutoResolve: false })
  }
  return finalizeDecision(conflict, 'ignored_safe_duplicate',
    'Same business action already processed under a different eventId — low-risk event type, safe to ignore.',
    { requiresManualReview: false, safeToAutoResolve: true })
}

export function resolveStaleEvent(conflict) {
  return finalizeDecision(conflict, 'manual_review_required',
    'Local event is older than a known backend state change for the same entity — staff review required to avoid overwriting newer backend state.',
    { requiresManualReview: true, safeToAutoResolve: false })
}

export function resolveConflictingUpdate(conflict) {
  return finalizeDecision(conflict, 'manual_review_required',
    'Local and backend versions of this entity disagree — staff must choose which version is correct.',
    { requiresManualReview: true, safeToAutoResolve: false })
}

export function resolveAlreadyProcessed(conflict) {
  return finalizeDecision(conflict, 'already_processed_no_action',
    'Backend confirms this business action was already recorded — no replay needed.',
    { requiresManualReview: false, safeToAutoResolve: true })
}

/**
 * Whether an event should even be attempted for replay, prior to calling
 * the backend. Defaults to blocking when backend reachability is unknown.
 */
export function shouldReplayEvent(event, context = {}) {
  if (!event) return false
  if (context.backendReachable === false) return false
  if (event.requiresManualReview) return false
  if (event.conflictDecision && !['replay_allowed', 'ignored_safe_duplicate'].includes(event.conflictDecision)) {
    return event.conflictDecision === 'replay_allowed'
  }
  return true
}

export function shouldBlockReplay(event, context = {}) {
  return !shouldReplayEvent(event, context)
}

export function recordConflictDecision(decision) {
  const record = {
    decisionId: decision.decisionId || (crypto.randomUUID ? crypto.randomUUID() : `dec-${Date.now()}-${Math.random()}`),
    eventId: decision.eventId,
    eventType: decision.eventType,
    businessActionFingerprint: decision.businessActionFingerprint || null,
    conflictType: decision.conflictType,
    decision: decision.decision,
    reason: decision.reason,
    createdAt: decision.createdAt || Date.now(),
    source: decision.source || 'syncConflictResolutionService',
    requiresManualReview: Boolean(decision.requiresManualReview),
    safeToAutoResolve: Boolean(decision.safeToAutoResolve),
  }
  decisionLog.push(record)
  // Bound the in-memory log so a long-running session doesn't grow unbounded.
  if (decisionLog.length > 500) decisionLog = decisionLog.slice(-500)
  return record
}

function finalizeDecision(conflict, decision, reason, flags, options = {}) {
  const record = recordConflictDecision({
    eventId: conflict.eventId,
    eventType: conflict.eventType,
    businessActionFingerprint: conflict.businessActionFingerprint,
    conflictType: conflict.conflictType,
    decision,
    reason,
    requiresManualReview: flags.requiresManualReview,
    safeToAutoResolve: flags.safeToAutoResolve,
    source: options.source || 'syncConflictResolutionService',
  })
  return { ...conflict, decision, reason, requiresManualReview: flags.requiresManualReview, safeToAutoResolve: flags.safeToAutoResolve, decisionRecord: record }
}

/** Summary of in-memory decisions this session — for the staff review panel. */
export function getConflictSummary() {
  const byType = {}
  const byDecision = {}
  for (const d of decisionLog) {
    byType[d.conflictType] = (byType[d.conflictType] || 0) + 1
    byDecision[d.decision] = (byDecision[d.decision] || 0) + 1
  }
  return {
    total: decisionLog.length,
    requiresManualReviewCount: decisionLog.filter((d) => d.requiresManualReview).length,
    byConflictType: byType,
    byDecision,
    decisions: decisionLog.slice(-100),
  }
}

/** Clears in-memory decisions whose underlying local event is no longer pending/failed (e.g. it synced). */
export async function clearResolvedConflicts() {
  const all = await getAllEvents()
  const stillRelevant = new Set(all.filter((e) => e.syncStatus === 'pending' || e.syncStatus === 'failed').map((e) => e.eventId))
  const before = decisionLog.length
  decisionLog = decisionLog.filter((d) => stillRelevant.has(d.eventId))
  return { cleared: before - decisionLog.length, remaining: decisionLog.length }
}
