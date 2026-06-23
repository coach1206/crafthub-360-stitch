/**
 * Sync Event Replay Service — Phase 6E
 * Safe, staff-controlled replay of pending/failed local outbox events.
 * Always classifies via syncConflictResolutionService before attempting a
 * replay, always requires explicit backend confirmation before marking a
 * replay succeeded, and always blocks (never guesses) when backend status
 * is unavailable. Does not replace syncQueueService.retryPendingEvents()
 * (Phase 6C) — that remains the automatic app-load/reconnect path; this
 * service is the staff-driven, conflict-aware path for the reconciliation
 * UI.
 */

import {
  getPendingEvents, getFailedEvents, patchEvent, markSynced as queueMarkSynced,
} from './syncQueueService.js'
import { postSyncEvents, getSyncStatus, previewBackendReplay, requestBackendReplay } from './syncApiClient.js'
import {
  classifyConflict, resolveConflict, shouldReplayEvent,
} from './syncConflictResolutionService.js'

export const REPLAY_STATUSES = [
  'replayed',
  'blocked',
  'skipped',
  'failed',
  'requires_manual_review',
  'already_processed',
  'backend_unavailable',
]

async function getBackendContext() {
  const status = await getSyncStatus()
  return { backendReachable: Boolean(status), backendStatus: status }
}

/**
 * Validates a single event's safety to replay: runs conflict classification
 * and returns the conflict + whether replay should proceed. Never calls the
 * backend's write endpoint — read-only safety check.
 */
export async function validateReplaySafety(event, context) {
  const ctx = context || (await getBackendContext())
  const conflict = classifyConflict(event, ctx.backendEvent || null, ctx)
  const resolved = resolveConflict(conflict)
  const safe = ctx.backendReachable !== false && shouldReplayEvent({ ...event, ...resolved }, ctx)
  return { conflict: resolved, safe, context: ctx }
}

export async function markReplayBlocked(event, reason) {
  return patchEvent(event.eventId, {
    replayStatus: 'blocked',
    replayBlockedReason: reason,
    lastReplayAttemptAt: Date.now(),
  })
}

export async function markReplayAttempted(event) {
  return patchEvent(event.eventId, {
    replayStatus: 'attempting',
    lastReplayAttemptAt: Date.now(),
  })
}

/** Only call once the backend has explicitly confirmed success for this event. */
export async function markReplaySucceeded(event, backendResponse) {
  await queueMarkSynced(event.eventId)
  return patchEvent(event.eventId, {
    replayStatus: 'replayed',
    replayBlockedReason: null,
    lastReplayAttemptAt: Date.now(),
  })
}

export async function markReplayFailed(event, error) {
  return patchEvent(event.eventId, {
    replayStatus: 'failed',
    replayBlockedReason: error?.message || String(error),
    lastReplayAttemptAt: Date.now(),
  })
}

/**
 * Read-only preview: classifies every pending/failed event without sending
 * anything to the backend. Used by the "Preview Replay" staff button.
 */
export async function previewReplay(options = {}) {
  const ctx = await getBackendContext()
  const events = [...(await getPendingEvents()), ...(await getFailedEvents())]
  const preview = []
  for (const event of events) {
    const { conflict, safe } = await validateReplaySafety(event, ctx)
    preview.push({
      eventId: event.eventId,
      eventType: event.eventType,
      businessActionFingerprint: event.businessActionFingerprint,
      conflictType: conflict.conflictType,
      decision: conflict.decision,
      willReplay: safe,
      reason: conflict.reason,
    })
  }
  return { backendReachable: ctx.backendReachable, total: events.length, preview }
}

/** Replays a single event after validating safety. Supports dryRun. */
export async function replaySingleEvent(event, options = {}) {
  const ctx = options.context || (await getBackendContext())

  if (ctx.backendReachable === false) {
    if (!options.dryRun) await markReplayBlocked(event, 'Backend unavailable — replay blocked, not guessed.')
    return { eventId: event.eventId, status: 'backend_unavailable' }
  }

  const { conflict, safe } = await validateReplaySafety(event, ctx)

  if (conflict.decision === 'already_processed_no_action') {
    if (!options.dryRun) await patchEvent(event.eventId, { replayStatus: 'skipped', conflictType: conflict.conflictType, conflictDecision: conflict.decision })
    return { eventId: event.eventId, status: 'already_processed', conflict }
  }

  if (conflict.requiresManualReview || conflict.decision === 'manual_review_required') {
    if (!options.dryRun) await patchEvent(event.eventId, { requiresManualReview: true, conflictType: conflict.conflictType, conflictDecision: conflict.decision })
    return { eventId: event.eventId, status: 'requires_manual_review', conflict }
  }

  if (!safe) {
    if (!options.dryRun) await markReplayBlocked(event, conflict.reason || 'Replay blocked by conflict resolution.')
    return { eventId: event.eventId, status: 'blocked', conflict }
  }

  if (options.dryRun) {
    return { eventId: event.eventId, status: 'skipped', conflict, dryRun: true }
  }

  await markReplayAttempted(event)
  const response = await postSyncEvents([event])

  if (response?.success && Array.isArray(response.data?.results)) {
    const result = response.data.results.find((r) => r.eventId === event.eventId)
    if (result?.success === true && !result.degraded) {
      await markReplaySucceeded(event, response)
      return { eventId: event.eventId, status: 'replayed' }
    }
    await markReplayFailed(event, new Error(result?.error || 'Backend did not confirm success'))
    return { eventId: event.eventId, status: 'failed' }
  }

  await markReplayFailed(event, new Error('No response from backend (offline or unavailable)'))
  return { eventId: event.eventId, status: 'backend_unavailable' }
}

async function replayBatch(events, options) {
  const ctx = await getBackendContext()
  const results = []
  for (const event of events) {
    results.push(await replaySingleEvent(event, { ...options, context: ctx }))
  }
  return { backendReachable: ctx.backendReachable, attempted: events.length, results }
}

export async function replayPendingEvents(options = {}) {
  const events = await getPendingEvents()
  return replayBatch(events, options)
}

export async function replayFailedEvents(options = {}) {
  const events = await getFailedEvents()
  return replayBatch(events, options)
}

// ── Phase 6F additions ──────────────────────────────────────────
// Backend-confirmed replay path. Always prefers the server's conflict
// resolution + replay confirmation over the local-only path above; falls
// back to the Phase 6E local classification (still blocking unsafe replay)
// only when the backend reconciliation endpoints are unreachable — never
// the other way around.

function toCandidatePayload(event) {
  return {
    eventId: event.eventId,
    eventType: event.eventType,
    entityId: event.entityId,
    payload: event.payload,
    businessActionFingerprint: event.businessActionFingerprint,
    sourceSystem: event.sourceSystem,
    sourceDeviceId: event.sourceDeviceId,
    clientCreatedAt: event.timestamp,
  }
}

/** Read-only: asks the backend whether this event would safely replay. Never writes. */
export async function previewServerReplay(event) {
  const response = await previewBackendReplay(toCandidatePayload(event))
  if (!response || response.success !== true) {
    return { eventId: event.eventId, decisionSource: 'backend_unavailable', backendReachable: false }
  }
  return { ...response.data, decisionSource: 'backend_confirmed', backendReachable: true }
}

/**
 * Requests a real, server-confirmed replay. Only marks the local outbox
 * record `replayed`/synced after the backend's response explicitly reports
 * `status: 'replayed_confirmed'` — every other backend status (blocked,
 * rejected, manual review, unavailable, failed) leaves the local record
 * untouched in its current pending/failed state.
 */
export async function requestServerReplay(event) {
  const response = await requestBackendReplay({ event: toCandidatePayload(event), sourceDeviceId: event.sourceDeviceId })
  if (!response || response.success !== true) {
    return { eventId: event.eventId, status: 'backend_unavailable', decisionSource: 'backend_unavailable' }
  }
  const result = response.data
  if (result.status === 'replayed_confirmed') {
    await markReplaySucceeded(event, response)
    return { ...result, decisionSource: 'backend_confirmed' }
  }
  if (result.status === 'manual_review_required') {
    await patchEvent(event.eventId, { requiresManualReview: true })
  } else if (result.status === 'duplicate_blocked' || result.status === 'replay_blocked') {
    await markReplayBlocked(event, result.conflict?.reason || 'Server blocked this replay.')
  } else if (result.status === 'failed') {
    await markReplayFailed(event, new Error(result.error || 'Server replay failed'))
  }
  return { ...result, decisionSource: 'backend_confirmed' }
}

export async function getReplaySummary() {
  const pending = await getPendingEvents()
  const failed = await getFailedEvents()
  const all = [...pending, ...failed]
  const byStatus = {}
  for (const e of all) {
    byStatus[e.replayStatus || 'not_attempted'] = (byStatus[e.replayStatus || 'not_attempted'] || 0) + 1
  }
  return {
    pendingCount: pending.length,
    failedCount: failed.length,
    byReplayStatus: byStatus,
    manualReviewCount: all.filter((e) => e.requiresManualReview).length,
  }
}
