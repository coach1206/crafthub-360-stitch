/**
 * Sync Reconciliation Controller — Phase 6F
 * Staff/admin-only HTTP surface for backend conflict resolution, replay
 * confirmation, and reconciliation notes/resolution. Every response is
 * shaped { success, mode, degraded, message, data, error? } so the
 * frontend never has to guess whether a result is real or a fallback.
 */

import { ok, fail, serverError } from '../utils/response.js'
import {
  getEventById, getEventByFingerprint, listConflicts, createReconciliationNote,
  resolveReconciliation, getReconciliationSummary, DbUnavailableError,
} from '../services/syncReconciliationStore.js'
import {
  classifyConflict, resolveConflict, recordConflictDecision,
} from '../services/syncConflictResolutionServerService.js'
import {
  previewReplay as serverPreviewReplay, replayEventById, replayEventPayload,
} from '../services/syncReplayServerService.js'

const DEGRADED_MESSAGE =
  'Reconciliation store is unavailable (no database connection). Conflict and replay decisions ' +
  'cannot be confirmed right now — the server will never report a decision it cannot back with a real write.'

function envelope({ success, mode = 'live', degraded = false, message = null, data = null, error = null }) {
  return { success, mode, degraded, message, data, error }
}

export async function getSyncEventById(req, res) {
  try {
    const event = await getEventById(req.params.eventId)
    if (!event) return res.status(404).json(envelope({ success: false, message: 'Event not found', data: null }))
    return res.json(envelope({ success: true, data: event }))
  } catch (err) {
    if (err instanceof DbUnavailableError) {
      return res.status(503).json(envelope({ success: false, mode: 'degraded', degraded: true, message: DEGRADED_MESSAGE }))
    }
    return serverError(res, err, 'getSyncEventById')
  }
}

export async function getSyncEventByFingerprint(req, res) {
  try {
    const event = await getEventByFingerprint(req.params.fingerprint)
    if (!event) return res.status(404).json(envelope({ success: false, message: 'No matching event found', data: null }))
    return res.json(envelope({ success: true, data: event }))
  } catch (err) {
    if (err instanceof DbUnavailableError) {
      return res.status(503).json(envelope({ success: false, mode: 'degraded', degraded: true, message: DEGRADED_MESSAGE }))
    }
    return serverError(res, err, 'getSyncEventByFingerprint')
  }
}

export async function getSyncConflicts(req, res) {
  try {
    const requiresManualReview = req.query.requiresManualReview === 'true'
      ? true : req.query.requiresManualReview === 'false' ? false : null
    const conflicts = await listConflicts({ requiresManualReview })
    return res.json(envelope({ success: true, data: conflicts }))
  } catch (err) {
    if (err instanceof DbUnavailableError) {
      return res.status(503).json(envelope({ success: false, mode: 'degraded', degraded: true, message: DEGRADED_MESSAGE, data: [] }))
    }
    return serverError(res, err, 'getSyncConflicts')
  }
}

export async function postConflictDecision(req, res) {
  try {
    const { event, conflictType, decision, reason, requiresManualReview, safeToAutoResolve } = req.body || {}
    if (!event || !event.eventId) return fail(res, 'event with eventId is required', 400)

    let resolved
    if (decision) {
      // Explicit staff override decision — still routed through the same
      // append-only decision log, never bypassing it.
      resolved = {
        eventId: event.eventId, eventType: event.eventType,
        businessActionFingerprint: event.businessActionFingerprint || null,
        conflictType: conflictType || 'unknown', decision,
        reason: reason || 'Staff override decision.',
        requiresManualReview: Boolean(requiresManualReview),
        safeToAutoResolve: Boolean(safeToAutoResolve),
      }
    } else {
      const conflict = await classifyConflict(event)
      resolved = resolveConflict(conflict)
    }

    const record = await recordConflictDecision(resolved, { decidedBy: req.user?.id || null, source: decision ? 'staff' : 'server' })
    return ok(res, { conflict: resolved, decisionRecord: record })
  } catch (err) {
    if (err instanceof DbUnavailableError) {
      return res.status(503).json(envelope({ success: false, mode: 'degraded', degraded: true, message: DEGRADED_MESSAGE }))
    }
    return serverError(res, err, 'postConflictDecision')
  }
}

export async function previewReplayRoute(req, res) {
  try {
    const result = await serverPreviewReplay(req.body?.event)
    return res.json(envelope({ success: true, data: result }))
  } catch (err) {
    return serverError(res, err, 'previewReplayRoute')
  }
}

export async function postReplay(req, res) {
  try {
    const { eventId, event } = req.body || {}
    const result = eventId
      ? await replayEventById(eventId, { decidedBy: req.user?.id || null })
      : await replayEventPayload(event, {
          decidedBy: req.user?.id || null,
          sourceDeviceId: req.body?.sourceDeviceId || null,
          userId: req.user?.id || null,
          userRole: req.user?.role || null,
        })
    return res.json(envelope({ success: true, data: result, degraded: result.status === 'backend_unavailable' }))
  } catch (err) {
    return serverError(res, err, 'postReplay')
  }
}

export async function postReconciliationNote(req, res) {
  try {
    const { note } = req.body || {}
    if (!note) return fail(res, 'note is required', 400)
    const record = await createReconciliationNote(req.params.eventId, note, { createdBy: req.user?.id || null })
    return ok(res, record)
  } catch (err) {
    if (err instanceof DbUnavailableError) {
      return res.status(503).json(envelope({ success: false, mode: 'degraded', degraded: true, message: DEGRADED_MESSAGE }))
    }
    return serverError(res, err, 'postReconciliationNote')
  }
}

export async function postReconciliationResolve(req, res) {
  try {
    const { staffReason, backendConfirmationId } = req.body || {}
    const event = await resolveReconciliation(req.params.eventId, {
      staffReason, backendConfirmationId, resolvedBy: req.user?.id || null,
    })
    return ok(res, event)
  } catch (err) {
    if (err instanceof DbUnavailableError) {
      return res.status(503).json(envelope({ success: false, mode: 'degraded', degraded: true, message: DEGRADED_MESSAGE }))
    }
    if (err.message?.includes('requires staffReason or backendConfirmationId')) return fail(res, err.message, 400)
    return serverError(res, err, 'postReconciliationResolve')
  }
}

export async function getReconciliationSummaryRoute(req, res) {
  try {
    const summary = await getReconciliationSummary()
    return res.json(envelope({ success: true, degraded: summary.degraded, data: summary }))
  } catch (err) {
    return serverError(res, err, 'getReconciliationSummaryRoute')
  }
}
