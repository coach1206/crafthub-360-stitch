/**
 * Sync Audit Client Service — Phase 6G
 * Frontend wrapper over the Phase 6G backend audit/timeline routes.
 * Prefers backend truth always — if the backend audit routes are
 * unreachable, callers get an honest "unavailable" shape, never a fake
 * empty-success result.
 */

import {
  fetchAuditLogs, fetchEventTimeline, fetchBusinessActionTimeline,
  fetchActorAuditLogs, fetchAuditSummary,
} from './syncApiClient.js'

/**
 * Phase 6H: distinguishes "not signed in" (401) and "signed in but not
 * staff" (403) from a genuine network/backend-unavailable failure, so the
 * panel can show honest, specific staff-facing language instead of a single
 * generic "unavailable" message for every failure mode.
 */
function unavailable(result, fallbackMessage = 'Audit backend unavailable — cannot reach the server right now.') {
  if (result?.status === 401) {
    return { backendReachable: false, degraded: false, authRequired: true, message: 'Sign-in required to view audit logs.' }
  }
  if (result?.status === 403) {
    return { backendReachable: false, degraded: false, forbidden: true, message: 'Staff access required to view audit logs.' }
  }
  return { backendReachable: false, degraded: true, message: result?.message || fallbackMessage }
}

export async function getAuditDashboardSummary(options = {}) {
  const result = await fetchAuditSummary(options)
  if (!result || result.success === false) return unavailable(result)
  return { backendReachable: true, degraded: Boolean(result.degraded), ...result.data }
}

export async function getEventTimeline(eventId) {
  const result = await fetchEventTimeline(eventId)
  if (!result || result.success === false) return unavailable(result, result?.message)
  return { backendReachable: true, degraded: false, ...result.data }
}

export async function getBusinessActionTimeline(fingerprint) {
  const result = await fetchBusinessActionTimeline(fingerprint)
  if (!result || result.success === false) return unavailable(result, result?.message)
  return { backendReachable: true, degraded: false, ...result.data }
}

export async function getStaffActionLogs(actorId, options = {}) {
  const result = await fetchActorAuditLogs(actorId, options)
  if (!result || result.success === false) return unavailable(result)
  return { backendReachable: true, degraded: false, logs: result.data || [] }
}

export async function getLatestAuditLogs(options = {}) {
  const result = await fetchAuditLogs(options)
  if (!result || result.success === false) return unavailable(result)
  return { backendReachable: true, degraded: false, logs: result.data || [] }
}

const ACTION_TYPE_LABELS = {
  sync_event_received: 'Event Received',
  sync_event_queued: 'Event Queued',
  sync_event_failed: 'Event Failed',
  replay_preview: 'Replay Previewed',
  replay_attempted: 'Replay Attempted',
  replay_confirmed: 'Replay Confirmed',
  replay_rejected: 'Replay Rejected',
  conflict_detected: 'Conflict Detected',
  conflict_decision_recorded: 'Conflict Decision Recorded',
  reconciliation_note_added: 'Reconciliation Note Added',
  reconciliation_resolved: 'Reconciliation Resolved',
  manual_review_required: 'Manual Review Required',
  eat_catchup_processed: 'E.A.T. Catch-Up Processed',
  staff_action: 'Staff Action',
}

export function formatAuditLogForUI(log) {
  if (!log) return null
  return {
    id: log.auditId,
    label: ACTION_TYPE_LABELS[log.actionType] || log.actionType,
    category: log.actionCategory,
    actor: log.actorDisplayName || log.actorStaffId || log.actorUserId || 'System',
    deviceId: log.deviceId || null,
    eventId: log.eventId || null,
    businessActionFingerprint: log.businessActionFingerprint || null,
    reason: log.reason || null,
    createdAt: log.createdAt,
    raw: log,
  }
}

const LIFECYCLE_STAGE_LABELS = {
  received: 'Received',
  queued: 'Queued',
  failed: 'Failed',
  conflict_detected: 'Conflict Detected',
  replay_previewed: 'Replay Previewed',
  replay_attempted: 'Replay Attempted',
  replay_blocked: 'Replay Blocked',
  replay_confirmed: 'Replay Confirmed',
  replay_rejected: 'Replay Rejected',
  manual_review_required: 'Manual Review Required',
  reconciliation_note_added: 'Reconciliation Note Added',
  reconciliation_resolved: 'Reconciliation Resolved',
  conflict_decision_recorded: 'Conflict Decision Recorded',
  eat_catchup_processed: 'E.A.T. Catch-Up Processed',
  confirmed_by_backend: 'Confirmed by Backend',
}

export function formatLifecycleStageForUI(stage) {
  if (!stage) return null
  return {
    id: stage.lifecycleId,
    label: LIFECYCLE_STAGE_LABELS[stage.lifecycleStage] || stage.lifecycleStage,
    status: stage.stageStatus,
    eventType: stage.eventType,
    deviceId: stage.deviceId || null,
    eventId: stage.eventId || null,
    businessActionFingerprint: stage.businessActionFingerprint || null,
    reason: stage.reason || null,
    createdAt: stage.createdAt,
    raw: stage,
  }
}

/** Cheap reachability probe for the staff panel's health indicator — never claims healthy without a real response. */
export async function getAuditHealth() {
  const summary = await fetchAuditSummary({})
  if (!summary || summary.success === false) return unavailable(summary, 'Audit backend unavailable.')
  return { backendReachable: true, degraded: Boolean(summary.degraded), message: summary.degraded ? summary.message : null }
}
