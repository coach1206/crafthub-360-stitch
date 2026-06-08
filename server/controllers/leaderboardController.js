import * as service from '../services/leaderboardService.js'
import { ok, created, fail, serverError } from '../utils/response.js'

export async function getLeaderboard(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit || '20', 10), 100)
    const data  = await service.getLeaderboard(limit)
    ok(res, data)
  } catch (err) {
    serverError(res, err, 'getLeaderboard')
  }
}

export async function submitScore(req, res) {
  try {
    const { sessionId, displayName, score } = req.body
    if (!sessionId)           return fail(res, 'sessionId required')
    if (typeof score !== 'number') return fail(res, 'score must be a number')
    const data = await service.submitScore(sessionId, displayName, score)
    created(res, data)
  } catch (err) {
    serverError(res, err, 'submitScore')
  }
}

export async function getSessionScore(req, res) {
  try {
    const data = await service.getSessionScore(req.params.sessionId)
    ok(res, data)
  } catch (err) {
    serverError(res, err, 'getSessionScore')
  }
}
