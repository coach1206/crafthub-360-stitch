/**
 * Sync Audit Controller — Phase 6G
 * Staff/admin-only read-only HTTP surface over the audit log + lifecycle
 * timeline store. Every response is shaped { success, mode, degraded,
 * message, data, error? } — same convention as syncReconciliationController.js.
 */

import { ok, fail, serverError } from '../utils/response.js'
import {
  getAuditLogs, getAuditLogsByActor,
} from '../services/syncAuditStore.js'
import {
  getTimelineForEvent, getTimelineForBusinessAction, getAuditDashboardSummary,
} from '../services/syncAuditService.js'
import {
  validateEventId, validateFingerprint, validateAuditLogQuery, validateTimelineQuery,
} from '../services/syncRequestValidationService.js'

const DEGRADED_MESSAGE =
  'Audit store is unavailable (no database connection). Audit logs and lifecycle timelines ' +
  'cannot be durably recorded or read right now.'

function envelope({ success, mode = 'live', degraded = false, message = null, data = null, error = null }) {
  return { success, mode, degraded, message, data, error }
}

export async function getAuditLogsRoute(req, res) {
  try {
    const queryCheck = validateAuditLogQuery(req.query)
    if (!queryCheck.valid) return fail(res, queryCheck.errors.join('; '), 400)
    const { actionCategory, actionType, limit } = queryCheck.sanitized
    const logs = await getAuditLogs({ actionCategory, actionType, limit })
    return res.json(envelope({ success: true, data: logs }))
  } catch (err) {
    if (err.code === 'DB_UNAVAILABLE') {
      return res.status(503).json(envelope({ success: false, mode: 'degraded', degraded: true, message: DEGRADED_MESSAGE, data: [] }))
    }
    return serverError(res, err, 'getAuditLogsRoute')
  }
}

export async function getEventTimeline(req, res) {
  try {
    const eventIdCheck = validateEventId(req.params.eventId)
    if (!eventIdCheck.valid) return fail(res, eventIdCheck.errors.join('; '), 400)
    const queryCheck = validateTimelineQuery(req.query)
    if (!queryCheck.valid) return fail(res, queryCheck.errors.join('; '), 400)
    const result = await getTimelineForEvent(eventIdCheck.sanitized)
    if (result.dbAvailable === false) {
      return res.status(503).json(envelope({ success: false, mode: 'degraded', degraded: true, message: result.message }))
    }
    return res.json(envelope({ success: true, data: result }))
  } catch (err) {
    return serverError(res, err, 'getEventTimeline')
  }
}

export async function getBusinessActionTimelineRoute(req, res) {
  try {
    const fingerprintCheck = validateFingerprint(req.params.fingerprint)
    if (!fingerprintCheck.valid) return fail(res, fingerprintCheck.errors.join('; '), 400)
    const queryCheck = validateTimelineQuery(req.query)
    if (!queryCheck.valid) return fail(res, queryCheck.errors.join('; '), 400)
    const result = await getTimelineForBusinessAction(fingerprintCheck.sanitized)
    if (result.dbAvailable === false) {
      return res.status(503).json(envelope({ success: false, mode: 'degraded', degraded: true, message: result.message }))
    }
    return res.json(envelope({ success: true, data: result }))
  } catch (err) {
    return serverError(res, err, 'getBusinessActionTimelineRoute')
  }
}

export async function getActorAuditLogs(req, res) {
  try {
    if (!req.params.actorId || req.params.actorId.length > 128) {
      return fail(res, 'actorId is required and must not exceed 128 characters', 400)
    }
    const paginationCheck = validateTimelineQuery(req.query)
    if (!paginationCheck.valid) return fail(res, paginationCheck.errors.join('; '), 400)
    const logs = await getAuditLogsByActor(req.params.actorId, { limit: paginationCheck.sanitized.limit })
    return res.json(envelope({ success: true, data: logs }))
  } catch (err) {
    if (err.code === 'DB_UNAVAILABLE') {
      return res.status(503).json(envelope({ success: false, mode: 'degraded', degraded: true, message: DEGRADED_MESSAGE, data: [] }))
    }
    return serverError(res, err, 'getActorAuditLogs')
  }
}

export async function getAuditSummaryRoute(req, res) {
  try {
    const { since } = req.query || {}
    const summary = await getAuditDashboardSummary({ since: since || null })
    return res.json(envelope({ success: true, degraded: Boolean(summary.degraded), data: summary }))
  } catch (err) {
    return serverError(res, err, 'getAuditSummaryRoute')
  }
}
