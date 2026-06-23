/**
 * Sync Audit Service — Phase 6G
 * High-level audit/lifecycle recording API used by the reconciliation,
 * replay, and conflict flows. Wraps `syncAuditStore.js` so callers never
 * have to know the underlying table shapes — and so a store-level failure
 * (e.g. DB unavailable) never crashes the caller's real operation. Every
 * audit* function swallows its own errors and returns
 * { recorded: false, warning } instead of throwing.
 */

import {
  recordAuditLog, recordLifecycleStage,
  getAuditLogsByEventId, getLifecycleByEventId,
  getBusinessActionTimeline as storeGetBusinessActionTimeline,
  getAuditSummary,
} from './syncAuditStore.js'

async function safeRecordAuditLog(entry) {
  try {
    const row = await recordAuditLog(entry)
    return { recorded: true, auditLog: row }
  } catch (err) {
    return { recorded: false, warning: `Audit log not durably recorded: ${err.message}` }
  }
}

async function safeRecordLifecycleStage(entry) {
  try {
    const row = await recordLifecycleStage(entry)
    return { recorded: true, lifecycleStage: row }
  } catch (err) {
    return { recorded: false, warning: `Lifecycle stage not durably recorded: ${err.message}` }
  }
}

function baseFields(event, context = {}) {
  return {
    eventId: event?.eventId || null,
    businessActionFingerprint: event?.businessActionFingerprint || null,
    deviceId: event?.deviceId || context.deviceId || null,
    actorUserId: context.userId || null,
    actorStaffId: context.staffId || null,
    actorRole: context.userRole || null,
    actorDisplayName: context.displayName || null,
    actorSource: context.source || 'server',
    ipAddress: context.ipAddress || null,
    userAgent: context.userAgent || null,
  }
}

export async function auditSyncEventReceived(event, context = {}) {
  const base = baseFields(event, context)
  const [audit, lifecycle] = await Promise.all([
    safeRecordAuditLog({
      ...base, actionType: 'sync_event_received', actionCategory: 'sync',
      entityType: event?.entityType || null, entityId: event?.entityId || null,
      newStatus: 'received', metadata: { eventType: event?.eventType || null },
    }),
    safeRecordLifecycleStage({
      ...base, eventType: event?.eventType || 'unknown', lifecycleStage: 'received',
      stageStatus: 'recorded', source: context.source || 'server', reason: context.reason || null,
      metadata: {},
    }),
  ])
  return { audit, lifecycle }
}

export async function auditSyncEventQueued(event, context = {}) {
  const base = baseFields(event, context)
  const [audit, lifecycle] = await Promise.all([
    safeRecordAuditLog({
      ...base, actionType: 'sync_event_queued', actionCategory: 'sync',
      entityType: event?.entityType || null, entityId: event?.entityId || null,
      newStatus: 'queued', metadata: { eventType: event?.eventType || null },
    }),
    safeRecordLifecycleStage({
      ...base, eventType: event?.eventType || 'unknown', lifecycleStage: 'queued',
      stageStatus: 'recorded', source: context.source || 'server', reason: context.reason || null,
      metadata: {},
    }),
  ])
  return { audit, lifecycle }
}

export async function auditSyncEventFailed(event, error, context = {}) {
  const base = baseFields(event, context)
  const reason = error?.message || String(error || 'Unknown failure')
  const [audit, lifecycle] = await Promise.all([
    safeRecordAuditLog({
      ...base, actionType: 'sync_event_failed', actionCategory: 'sync',
      entityType: event?.entityType || null, entityId: event?.entityId || null,
      newStatus: 'failed', reason, metadata: { eventType: event?.eventType || null },
    }),
    safeRecordLifecycleStage({
      ...base, eventType: event?.eventType || 'unknown', lifecycleStage: 'failed',
      stageStatus: 'recorded', source: context.source || 'server', reason, metadata: {},
    }),
  ])
  return { audit, lifecycle }
}

export async function auditReplayPreview(event, result, context = {}) {
  const base = baseFields(event, context)
  const [audit, lifecycle] = await Promise.all([
    safeRecordAuditLog({
      ...base, actionType: 'replay_preview', actionCategory: 'replay',
      reason: result?.decision || null,
      metadata: { willReplay: Boolean(result?.willReplay), decision: result?.decision || null },
    }),
    safeRecordLifecycleStage({
      ...base, eventType: event?.eventType || 'unknown', lifecycleStage: 'replay_previewed',
      stageStatus: result?.willReplay ? 'would_replay' : 'would_block', source: context.source || 'server',
      reason: result?.decision || null, metadata: {},
    }),
  ])
  return { audit, lifecycle }
}

export async function auditReplayAttempt(event, result, context = {}) {
  const base = baseFields(event, context)
  const [audit, lifecycle] = await Promise.all([
    safeRecordAuditLog({
      ...base, actionType: 'replay_attempted', actionCategory: 'replay',
      replayAttemptId: result?.replayAttemptId || null, reason: result?.status || null,
      metadata: { status: result?.status || null },
    }),
    safeRecordLifecycleStage({
      ...base, eventType: event?.eventType || 'unknown', lifecycleStage: 'replay_attempted',
      stageStatus: result?.status || 'attempted', source: context.source || 'server',
      reason: result?.status || null, metadata: {},
    }),
  ])
  return { audit, lifecycle }
}

export async function auditReplayConfirmed(event, result, context = {}) {
  const base = baseFields(event, context)
  const [audit, lifecycle] = await Promise.all([
    safeRecordAuditLog({
      ...base, actionType: 'replay_confirmed', actionCategory: 'replay',
      newStatus: 'replayed_confirmed', replayAttemptId: result?.replayAttemptId || null,
      metadata: { confirmationId: result?.confirmationId || null },
    }),
    safeRecordLifecycleStage({
      ...base, eventType: event?.eventType || 'unknown', lifecycleStage: 'replay_confirmed',
      stageStatus: 'confirmed', source: context.source || 'server', metadata: {},
    }),
  ])
  return { audit, lifecycle }
}

export async function auditReplayRejected(event, reason, context = {}) {
  const base = baseFields(event, context)
  const [audit, lifecycle] = await Promise.all([
    safeRecordAuditLog({
      ...base, actionType: 'replay_rejected', actionCategory: 'replay',
      newStatus: 'replay_rejected', reason: reason || null, metadata: {},
    }),
    safeRecordLifecycleStage({
      ...base, eventType: event?.eventType || 'unknown', lifecycleStage: 'replay_rejected',
      stageStatus: 'rejected', source: context.source || 'server', reason: reason || null, metadata: {},
    }),
  ])
  return { audit, lifecycle }
}

export async function auditConflictDetected(event, conflict, context = {}) {
  const base = baseFields(event, context)
  const [audit, lifecycle] = await Promise.all([
    safeRecordAuditLog({
      ...base, actionType: 'conflict_detected', actionCategory: 'conflict',
      previousStatus: null, newStatus: conflict?.conflictType || 'unknown',
      reason: conflict?.decision || null,
      metadata: { conflictType: conflict?.conflictType || null },
    }),
    safeRecordLifecycleStage({
      ...base, eventType: event?.eventType || 'unknown', lifecycleStage: 'conflict_detected',
      stageStatus: conflict?.conflictType || 'unknown', source: context.source || 'server',
      reason: conflict?.decision || null, metadata: {},
    }),
  ])
  return { audit, lifecycle }
}

export async function auditConflictDecision(decision, context = {}) {
  const base = baseFields(decision, context)
  const [audit, lifecycle] = await Promise.all([
    safeRecordAuditLog({
      ...base, actionType: 'conflict_decision_recorded', actionCategory: 'conflict',
      decisionId: decision?.decisionId || null, newStatus: decision?.decision || null,
      reason: decision?.reason || null,
      metadata: { conflictType: decision?.conflictType || null, requiresManualReview: Boolean(decision?.requiresManualReview) },
    }),
    safeRecordLifecycleStage({
      ...base, eventType: decision?.eventType || 'unknown', lifecycleStage: 'conflict_decision_recorded',
      stageStatus: decision?.decision || 'recorded', source: context.source || 'server',
      reason: decision?.reason || null, metadata: {},
    }),
  ])
  return { audit, lifecycle }
}

export async function auditReconciliationNote(eventId, note, context = {}) {
  const base = baseFields({ eventId }, context)
  const [audit, lifecycle] = await Promise.all([
    safeRecordAuditLog({
      ...base, actionType: 'reconciliation_note_added', actionCategory: 'reconciliation',
      reconciliationNoteId: note?.noteId || note?.reconciliationNoteId || null,
      reason: typeof note === 'string' ? note : note?.note || null, metadata: {},
    }),
    safeRecordLifecycleStage({
      ...base, eventType: context.eventType || 'unknown', lifecycleStage: 'reconciliation_note_added',
      stageStatus: 'recorded', source: context.source || 'server', metadata: {},
    }),
  ])
  return { audit, lifecycle }
}

export async function auditReconciliationResolved(eventId, resolution, context = {}) {
  const base = baseFields({ eventId }, context)
  const [audit, lifecycle] = await Promise.all([
    safeRecordAuditLog({
      ...base, actionType: 'reconciliation_resolved', actionCategory: 'reconciliation',
      newStatus: 'resolved_confirmed', reason: resolution?.staffReason || null,
      metadata: { backendConfirmationId: resolution?.backendConfirmationId || null },
    }),
    safeRecordLifecycleStage({
      ...base, eventType: context.eventType || 'unknown', lifecycleStage: 'reconciliation_resolved',
      stageStatus: 'resolved', source: context.source || 'server', reason: resolution?.staffReason || null,
      metadata: {},
    }),
  ])
  return { audit, lifecycle }
}

export async function auditManualReviewRequired(event, reason, context = {}) {
  const base = baseFields(event, context)
  const [audit, lifecycle] = await Promise.all([
    safeRecordAuditLog({
      ...base, actionType: 'manual_review_required', actionCategory: 'conflict',
      newStatus: 'manual_review_required', reason: reason || null, metadata: {},
    }),
    safeRecordLifecycleStage({
      ...base, eventType: event?.eventType || 'unknown', lifecycleStage: 'manual_review_required',
      stageStatus: 'recorded', source: context.source || 'server', reason: reason || null, metadata: {},
    }),
  ])
  return { audit, lifecycle }
}

export async function auditEatCatchUp(event, result, context = {}) {
  const base = baseFields(event, context)
  const [audit, lifecycle] = await Promise.all([
    safeRecordAuditLog({
      ...base, actionType: 'eat_catchup_processed', actionCategory: 'eat_catchup',
      newStatus: result?.status || null, metadata: { status: result?.status || null },
    }),
    safeRecordLifecycleStage({
      ...base, eventType: event?.eventType || 'unknown', lifecycleStage: 'eat_catchup_processed',
      stageStatus: result?.status || 'processed', source: context.source || 'server', metadata: {},
    }),
  ])
  return { audit, lifecycle }
}

export async function auditStaffAction(action, context = {}) {
  const base = baseFields(action, context)
  return safeRecordAuditLog({
    ...base, actionType: action?.actionType || 'staff_action', actionCategory: 'staff_action',
    entityType: action?.entityType || null, entityId: action?.entityId || null,
    reason: action?.reason || null, metadata: action?.metadata || {},
  })
}

export async function getTimelineForEvent(eventId) {
  try {
    const [auditLogs, lifecycle] = await Promise.all([
      getAuditLogsByEventId(eventId),
      getLifecycleByEventId(eventId),
    ])
    const merged = [
      ...auditLogs.map((l) => ({ kind: 'audit', ...l })),
      ...lifecycle.map((l) => ({ kind: 'lifecycle', ...l })),
    ].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    return { dbAvailable: true, degraded: false, eventId, total: merged.length, timeline: merged }
  } catch (err) {
    return {
      dbAvailable: false, degraded: true,
      message: 'Database unavailable — audit timeline cannot be read right now.',
    }
  }
}

export async function getTimelineForBusinessAction(fingerprint) {
  try {
    const result = await storeGetBusinessActionTimeline(fingerprint)
    return { dbAvailable: true, degraded: false, ...result }
  } catch (err) {
    return {
      dbAvailable: false, degraded: true,
      message: 'Database unavailable — business action timeline cannot be read right now.',
    }
  }
}

export async function getAuditDashboardSummary(options = {}) {
  return getAuditSummary(options)
}
