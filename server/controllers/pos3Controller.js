import * as service from '../services/pos3Service.js'
import { ok, created, fail, serverError } from '../utils/response.js'

export async function saveActivity(req, res) {
  try {
    const sessionId = req.body.sessionId || req.body.session_id
    if (!sessionId) return fail(res, 'sessionId required')
    const data = await service.saveActivity(req.body)
    created(res, data)
  } catch (err) {
    serverError(res, err, 'saveActivity')
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
