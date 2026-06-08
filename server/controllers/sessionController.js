import * as service from '../services/sessionService.js'
import { ok, created, fail, notFound, serverError } from '../utils/response.js'

export async function createSession(req, res) {
  try {
    const id = req.body.sessionId || req.body.session_id
    if (!id) return fail(res, 'sessionId is required')
    const data = await service.createSession(req.body)
    created(res, data)
  } catch (err) {
    serverError(res, err, 'createSession')
  }
}

export async function getSession(req, res) {
  try {
    const data = await service.getSession(req.params.sessionId)
    if (!data) return notFound(res, 'Session')
    ok(res, data)
  } catch (err) {
    serverError(res, err, 'getSession')
  }
}

export async function updateSession(req, res) {
  try {
    const data = await service.updateSession(req.params.sessionId, req.body)
    if (!data) return notFound(res, 'Session')
    ok(res, data)
  } catch (err) {
    serverError(res, err, 'updateSession')
  }
}

export async function saveGuestProfile(req, res) {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return fail(res, 'Profile data is required')
    }
    const data = await service.saveGuestProfile(req.params.sessionId, req.body)
    ok(res, data)
  } catch (err) {
    serverError(res, err, 'saveGuestProfile')
  }
}

export async function completeSmokeCraftSession(req, res) {
  try {
    const data = await service.completeSmokeCraftSession(
      req.params.sessionId,
      req.body || {}
    )
    ok(res, data)
  } catch (err) {
    serverError(res, err, 'completeSmokeCraftSession')
  }
}
