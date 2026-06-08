import * as service from '../services/passportService.js'
import { ok, fail, notFound, serverError } from '../utils/response.js'

export async function getPassport(req, res) {
  try {
    const { passportId } = req.params
    if (!passportId) return fail(res, 'passportId required')
    const sessionId = req.query.sessionId || req.query.session_id || 'unknown'
    const data = await service.getOrCreatePassport(sessionId, passportId)
    ok(res, data)
  } catch (err) {
    serverError(res, err, 'getPassport')
  }
}

export async function awardStamp(req, res) {
  try {
    const { passportId } = req.params
    const { sessionId, stampId, title, craft, points, visualTheme, sourceModule } = req.body
    if (!passportId || !sessionId) return fail(res, 'passportId and sessionId required')
    if (!stampId)                   return fail(res, 'stampId required')
    const data = await service.awardStamp({
      passportId, sessionId, stampId, title, craft, points, visualTheme, sourceModule,
    })
    ok(res, data || { message: 'Stamp already awarded' })
  } catch (err) {
    serverError(res, err, 'awardStamp')
  }
}

export async function getStamps(req, res) {
  try {
    const stamps = await service.getStamps(req.params.passportId)
    ok(res, stamps)
  } catch (err) {
    serverError(res, err, 'getStamps')
  }
}

export async function markCeremonySeen(req, res) {
  try {
    await service.markCeremonySeen(req.params.passportId)
    ok(res, { ceremonySeen: true })
  } catch (err) {
    serverError(res, err, 'markCeremonySeen')
  }
}
