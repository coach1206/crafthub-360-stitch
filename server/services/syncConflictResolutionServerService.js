/**
 * Sync Conflict Resolution Server Service — Phase 6F
 * Server-side conflict classification/decision authority. Mirrors the
 * Phase 6E client service's conflict types/decision vocabulary, but this is
 * now the authoritative source — the frontend's local classification is
 * only a fallback for when this backend is unreachable.
 */

import {
  getEventById, getEventByFingerprint, recordConflictDecision as storeRecordConflictDecision,
} from './syncReconciliationStore.js'
import { createBusinessActionFingerprint } from './syncBusinessActionFingerprint.js'
import { auditConflictDetected, auditConflictDecision, auditManualReviewRequired } from './syncAuditService.js'

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
  'server_rejected_duplicate',
  'server_confirmed_replay',
]

const SENSITIVE_EVENT_PATTERNS = [
  'Order', 'Checkout', 'Payment', 'Stamp', 'Passport', 'Ticket', 'Humidor',
]

function isSensitiveEvent(eventType = '') {
  return SENSITIVE_EVENT_PATTERNS.some((p) => eventType.includes(p))
}

/**
 * Looks up the candidate event row (by eventId) plus any fingerprint match,
 * then classifies the conflict. `candidateEvent` is the incoming
 * {eventId, eventType, entityId, payload, sourceDeviceId, sourceSystem}
 * being considered for replay (not yet necessarily stored).
 */
export async function detectConflict(candidateEvent) {
  if (!candidateEvent || !candidateEvent.eventId) {
    return { conflictType: 'local_missing' }
  }

  const existingById = await getEventById(candidateEvent.eventId)
  if (existingById) {
    return { conflictType: 'duplicate_event_id', backendEvent: existingById }
  }

  const fingerprint = candidateEvent.businessActionFingerprint ||
    createBusinessActionFingerprint({
      event_type: candidateEvent.eventType,
      entity_id: candidateEvent.entityId,
      payload: candidateEvent.payload,
      source_device_id: candidateEvent.sourceDeviceId,
      source_system: candidateEvent.sourceSystem,
    })

  if (!fingerprint) {
    return { conflictType: 'missing_fingerprint' }
  }

  const fingerprintMatch = await getEventByFingerprint(fingerprint, { excludeEventId: candidateEvent.eventId })
  if (fingerprintMatch) {
    return { conflictType: 'duplicate_business_action', backendEvent: fingerprintMatch, businessActionFingerprint: fingerprint }
  }

  return { conflictType: 'none', businessActionFingerprint: fingerprint }
}

export async function classifyConflict(candidateEvent) {
  const detected = await detectConflict(candidateEvent)
  const conflict = {
    eventId: candidateEvent?.eventId || null,
    eventType: candidateEvent?.eventType || null,
    businessActionFingerprint: detected.businessActionFingerprint || candidateEvent?.businessActionFingerprint || null,
    conflictType: detected.conflictType,
    backendEvent: detected.backendEvent || null,
  }
  if (conflict.conflictType !== 'none') {
    await auditConflictDetected(candidateEvent, conflict, { source: 'server' }).catch(() => {})
  }
  return conflict
}

export function resolveDuplicateEvent(conflict) {
  return finalize(conflict, 'already_processed_no_action',
    'This backend already has an event with this exact eventId — idempotent, no replay needed.',
    { requiresManualReview: false, safeToAutoResolve: true })
}

export function resolveDuplicateBusinessAction(conflict) {
  if (isSensitiveEvent(conflict.eventType || '')) {
    return finalize(conflict, 'manual_review_required',
      'Same business action already recorded under a different eventId — money/order/ticket/passport/humidor conflicts require staff confirmation before being rejected or ignored.',
      { requiresManualReview: true, safeToAutoResolve: false })
  }
  return finalize(conflict, 'server_rejected_duplicate',
    'Same business action already recorded under a different eventId — low-risk event type, server rejects this replay as a duplicate.',
    { requiresManualReview: false, safeToAutoResolve: true })
}

export function resolveStaleEvent(conflict) {
  return finalize(conflict, 'manual_review_required',
    'Incoming event is older than the backend\'s known state for this entity — staff review required before overwriting newer backend state.',
    { requiresManualReview: true, safeToAutoResolve: false })
}

export function resolveAlreadyProcessed(conflict) {
  return finalize(conflict, 'already_processed_no_action',
    'Backend confirms this business action was already recorded — no replay needed.',
    { requiresManualReview: false, safeToAutoResolve: true })
}

export function resolveConflict(conflict) {
  if (!conflict) return null
  switch (conflict.conflictType) {
    case 'duplicate_event_id':
      return resolveDuplicateEvent(conflict)
    case 'duplicate_business_action':
      return resolveDuplicateBusinessAction(conflict)
    case 'stale_event':
      return resolveStaleEvent(conflict)
    case 'already_processed':
      return resolveAlreadyProcessed(conflict)
    case 'missing_fingerprint':
      return finalize(conflict, 'manual_review_required',
        'No business-action fingerprint could be derived server-side — staff review required before replay.',
        { requiresManualReview: true, safeToAutoResolve: false })
    case 'local_missing':
      return finalize(conflict, 'manual_review_required',
        'No event payload was provided — cannot classify or replay.',
        { requiresManualReview: true, safeToAutoResolve: false })
    case 'none':
      return finalize(conflict, 'server_confirmed_replay',
        'No conflict detected against backend state — server confirms this is safe to replay.',
        { requiresManualReview: false, safeToAutoResolve: true })
    default:
      return finalize(conflict, 'manual_review_required',
        'Conflict could not be confidently classified — staff review required.',
        { requiresManualReview: true, safeToAutoResolve: false })
  }
}

export function shouldReplayEvent(resolvedConflict) {
  if (!resolvedConflict) return false
  return resolvedConflict.decision === 'server_confirmed_replay' || resolvedConflict.decision === 'replay_allowed'
}

export function shouldBlockReplay(resolvedConflict) {
  return !shouldReplayEvent(resolvedConflict)
}

function finalize(conflict, decision, reason, flags) {
  return { ...conflict, decision, reason, requiresManualReview: flags.requiresManualReview, safeToAutoResolve: flags.safeToAutoResolve }
}

/** Persists the decision via the store — single write path, append-only log. */
export async function recordConflictDecision(resolvedConflict, { decidedBy = null, source = 'server' } = {}) {
  const record = await storeRecordConflictDecision({
    eventId: resolvedConflict.eventId,
    eventType: resolvedConflict.eventType,
    businessActionFingerprint: resolvedConflict.businessActionFingerprint,
    conflictType: resolvedConflict.conflictType,
    decision: resolvedConflict.decision,
    reason: resolvedConflict.reason,
    decidedBy,
    source,
    requiresManualReview: resolvedConflict.requiresManualReview,
    safeToAutoResolve: resolvedConflict.safeToAutoResolve,
  })
  const auditEntry = { ...resolvedConflict, decisionId: record?.decision_id || null }
  await auditConflictDecision(auditEntry, { source, staffId: decidedBy }).catch(() => {})
  if (resolvedConflict.requiresManualReview) {
    await auditManualReviewRequired(resolvedConflict, resolvedConflict.reason, { source }).catch(() => {})
  }
  return record
}

export async function getConflictSummary(listConflictsFn) {
  const conflicts = await listConflictsFn()
  const byType = {}
  for (const c of conflicts) {
    byType[c.conflictType] = (byType[c.conflictType] || 0) + 1
  }
  return { total: conflicts.length, byConflictType: byType }
}
