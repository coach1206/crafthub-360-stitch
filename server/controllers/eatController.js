import * as service from '../services/eatService.js'
import { ok, created, fail, serverError } from '../utils/response.js'

export async function saveAnalytics(req, res) {
  try {
    const sessionId = req.body.sessionId || req.body.session_id
    if (!sessionId) return fail(res, 'sessionId required')
    const data = await service.saveAnalytics(req.body)
    created(res, data)
  } catch (err) {
    serverError(res, err, 'saveAnalytics')
  }
}

export async function getSessionPayload(req, res) {
  try {
    const data = await service.getSessionPayload(req.params.sessionId)
    ok(res, data)
  } catch (err) {
    serverError(res, err, 'getSessionPayload')
  }
}

export async function getDashboard(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit || '10', 10), 50)
    const data  = await service.getDashboardSummary(limit)
    ok(res, data)
  } catch (err) {
    serverError(res, err, 'getDashboard')
  }
}
