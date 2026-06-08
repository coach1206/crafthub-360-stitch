import * as service from '../services/auditService.js'
import { ok, serverError } from '../utils/response.js'

export async function getSessionAudit(req, res) {
  try {
    const data = await service.getSessionAudit(req.params.sessionId)
    ok(res, data)
  } catch (err) {
    serverError(res, err, 'getSessionAudit')
  }
}
