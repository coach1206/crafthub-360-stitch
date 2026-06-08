/**
 * Founder Controller — Founder Level 0 exclusive endpoints.
 * Every action is logged as a security event.
 * Accessible ONLY by founder_level_0. No other role passes the gate.
 */

import * as founderService from '../services/founderService.js'
import * as securityEventService from '../services/securityEventService.js'
import { ok, created, fail, notFound, serverError } from '../utils/response.js'

/** GET /api/founder/status — system status summary. */
export async function getStatus(req, res) {
  try {
    await securityEventService.recordFounderAction(req.user.id, 'status.viewed', 'system')
    const controls    = await founderService.getFounderControls()
    const emergencyLock = controls.find(c => c.control_key === 'emergency_lock')
    ok(res, {
      founderRole:    'founder_level_0',
      actorId:        req.user.id,
      systemLocked:   emergencyLock?.control_value?.active ?? false,
      mode:           process.env.NODE_ENV || 'development',
      dbConnected:    true,
      phase:          'phase-8',
      timestamp:      new Date().toISOString(),
    })
  } catch (err) {
    serverError(res, err, 'getStatus')
  }
}

/** GET /api/founder/controls — all founder control key/values. */
export async function getControls(req, res) {
  try {
    await securityEventService.recordFounderAction(req.user.id, 'controls.viewed', 'all')
    const controls = await founderService.getFounderControls()
    ok(res, controls)
  } catch (err) {
    serverError(res, err, 'getControls')
  }
}

/** PUT /api/founder/controls/:controlKey — update a founder control. */
export async function updateControl(req, res) {
  try {
    const { controlKey } = req.params
    if (!controlKey) return fail(res, 'controlKey required')
    if (!req.body || Object.keys(req.body).length === 0) {
      return fail(res, 'Control value is required')
    }
    const result = await founderService.updateFounderControl(controlKey, req.body, req.user.id)
    if (result?.error) return fail(res, result.error, 403)
    ok(res, result)
  } catch (err) {
    serverError(res, err, 'updateControl')
  }
}

/** POST /api/founder/emergency-lock — trigger emergency system lock. */
export async function triggerEmergencyLock(req, res) {
  try {
    const reason = req.body?.reason || 'Emergency lock activated by Founder'
    const result = await founderService.triggerEmergencyLock(req.user.id, reason)
    await securityEventService.recordEmergencyLock(req.user.id, reason)
    ok(res, result)
  } catch (err) {
    serverError(res, err, 'triggerEmergencyLock')
  }
}

/** POST /api/founder/override — founder override of any session/rule. */
export async function triggerOverride(req, res) {
  try {
    const { targetSessionId, reason } = req.body || {}
    const result = await founderService.triggerFounderOverride(
      req.user.id, targetSessionId, reason
    )
    ok(res, result)
  } catch (err) {
    serverError(res, err, 'triggerOverride')
  }
}

/** GET /api/founder/audit — combined audit + security event log (founder view). */
export async function getAudit(req, res) {
  try {
    await securityEventService.recordFounderAction(req.user.id, 'audit.viewed', 'system')
    const limit  = Math.min(parseInt(req.query.limit || '100', 10), 500)
    const events = await securityEventService.getSecurityEvents(null, limit)
    ok(res, { events, total: events.length, actor: req.user.id })
  } catch (err) {
    serverError(res, err, 'getAudit')
  }
}
