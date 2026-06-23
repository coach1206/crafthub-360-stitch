/**
 * Sync Replay Server Service — Phase 6F
 * Authoritative, server-confirmed replay of a staff-requested event. Always
 * classifies via syncConflictResolutionServerService before touching
 * anything, and only ever calls recordEvent() (the same idempotent Phase 6B
 * write path used by normal sync intake) when the conflict resolution says
 * it's safe. Never marks an event confirmed without that real write path
 * having run.
 */

import { isDbAvailable } from '../db/connection.js'
import { recordEvent } from './syncEventService.js'
import {
  getEventById, recordReplayAttempt, markReplayConfirmed, markReplayRejected,
  getReconciliationSummary as storeGetReconciliationSummary,
} from './syncReconciliationStore.js'
import {
  classifyConflict, resolveConflict, recordConflictDecision, shouldReplayEvent,
} from './syncConflictResolutionServerService.js'
import {
  auditReplayPreview, auditReplayAttempt, auditReplayConfirmed, auditReplayRejected,
} from './syncAuditService.js'

export const REPLAY_RESULT_STATUSES = [
  'replayed_confirmed',
  'replay_blocked',
  'replay_rejected',
  'already_processed',
  'duplicate_blocked',
  'manual_review_required',
  'backend_unavailable',
  'missing_event',
  'failed',
]

/** Read-only safety check — never writes. Used by the preview route. */
export async function validateReplaySafety(candidateEvent) {
  const conflict = await classifyConflict(candidateEvent)
  const resolved = resolveConflict(conflict)
  return { conflict: resolved, safe: shouldReplayEvent(resolved) }
}

export async function previewReplay(candidateEvent) {
  if (!isDbAvailable()) {
    return { backendReachable: false, eventId: candidateEvent?.eventId || null, status: 'backend_unavailable' }
  }
  const { conflict, safe } = await validateReplaySafety(candidateEvent)
  const result = {
    backendReachable: true,
    eventId: candidateEvent?.eventId || null,
    conflictType: conflict.conflictType,
    decision: conflict.decision,
    willReplay: safe,
    reason: conflict.reason,
  }
  await auditReplayPreview(candidateEvent, result, { source: 'server' }).catch(() => {})
  return result
}

/** Replays a stored event by its eventId (the staff-driven "Request Server Replay" path). */
export async function replayEventById(eventId, { decidedBy = null } = {}) {
  if (!isDbAvailable()) {
    return { eventId, status: 'backend_unavailable' }
  }
  const event = await getEventById(eventId)
  if (!event) {
    return { eventId, status: 'missing_event' }
  }
  return replayEventPayload(event, { decidedBy })
}

/** Replays an arbitrary candidate event payload (from a frontend outbox record). */
export async function replayEventPayload(candidateEvent, { decidedBy = null, sourceDeviceId = null, userId = null, userRole = null } = {}) {
  if (!isDbAvailable()) {
    return { eventId: candidateEvent?.eventId || null, status: 'backend_unavailable' }
  }

  const conflict = await classifyConflict(candidateEvent)
  const resolved = resolveConflict(conflict)
  await recordConflictDecision(resolved, { decidedBy, source: 'server' })

  if (resolved.decision === 'already_processed_no_action') {
    return { eventId: candidateEvent.eventId, status: 'already_processed', conflict: resolved }
  }
  if (resolved.decision === 'server_rejected_duplicate') {
    await markReplayRejected(candidateEvent.eventId, resolved.reason).catch(() => {})
    const result = { eventId: candidateEvent.eventId, status: 'duplicate_blocked', conflict: resolved }
    await auditReplayRejected(candidateEvent, resolved.reason, { source: 'server' }).catch(() => {})
    return result
  }
  if (resolved.decision === 'manual_review_required') {
    return { eventId: candidateEvent.eventId, status: 'manual_review_required', conflict: resolved }
  }
  if (!shouldReplayEvent(resolved)) {
    return { eventId: candidateEvent.eventId, status: 'replay_blocked', conflict: resolved }
  }

  await markReplayAttempted(candidateEvent.eventId)
  await auditReplayAttempt(candidateEvent, { status: 'attempted' }, { source: 'server' }).catch(() => {})

  try {
    const { event, duplicate } = await recordEvent(candidateEvent, { sourceDeviceId, userId, userRole })
    if (duplicate) {
      return { eventId: candidateEvent.eventId, status: 'already_processed', conflict: resolved }
    }
    await markReplayConfirmed(candidateEvent.eventId, { confirmationId: event.event_id })
    const result = { eventId: candidateEvent.eventId, status: 'replayed_confirmed', conflict: resolved, confirmationId: event.event_id }
    await auditReplayConfirmed(candidateEvent, result, { source: 'server' }).catch(() => {})
    return result
  } catch (err) {
    return { eventId: candidateEvent.eventId, status: 'failed', error: err.message }
  }
}

async function markReplayAttempted(eventId) {
  // Only meaningful for events that already exist server-side; a brand-new
  // candidate (not yet stored) has nothing to increment yet — safe no-op.
  const existing = await getEventById(eventId).catch(() => null)
  if (existing) await recordReplayAttempt(eventId).catch(() => {})
}

export async function markReplayAttemptedExternal(eventId) {
  return markReplayAttempted(eventId)
}

export { markReplayConfirmed, markReplayRejected }

export async function getReplaySummary() {
  return storeGetReconciliationSummary()
}
