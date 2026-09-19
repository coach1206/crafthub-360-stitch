import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { optionalAuth } from '../middleware/authMiddleware.js'
import { attachSmokeCraftIdentity, ensureSmokeCraftGuestIdentity, requireSmokeCraftIdentity } from '../middleware/smokecraftGuestIdentity.js'
import * as game from '../services/crafthub/craftHubGameService.js'

const router = Router()
const IS_PROD = process.env.NODE_ENV === 'production'
const readLimiter = rateLimit({ windowMs: 60_000, max: 90, skip: () => !IS_PROD })
const writeLimiter = rateLimit({ windowMs: 60_000, max: 45, skip: () => !IS_PROD })
const participant = req => req.smokecraftIdentity?.type === 'user'
  ? `user:${req.smokecraftIdentity.id}`
  : req.smokecraftIdentity?.id
const ikey = req => req.headers['x-idempotency-key'] || req.body?.idempotencyKey

router.use(optionalAuth, attachSmokeCraftIdentity, ensureSmokeCraftGuestIdentity)

router.get('/academies', readLimiter, (_req, res) => {
  res.json({ ok: true, academies: Object.values(game.ACADEMIES) })
})

router.get('/:academyKey/state', readLimiter, requireSmokeCraftIdentity, async (req, res, next) => {
  try { res.json(await game.getState(participant(req), req.params.academyKey)) } catch (e) { next(e) }
})

router.post('/:academyKey/lessons/:lessonKey/quiz', writeLimiter, requireSmokeCraftIdentity, async (req, res, next) => {
  try {
    const result = await game.submitQuiz({
      participantRef: participant(req),
      academyKey: req.params.academyKey,
      lessonKey: req.params.lessonKey,
      answers: req.body?.answers,
      idempotencyKey: ikey(req),
    })
    res.status(result.ok ? 200 : 400).json(result)
  } catch (e) { next(e) }
})

router.post('/:academyKey/lessons/:lessonKey/complete', writeLimiter, requireSmokeCraftIdentity, async (req, res, next) => {
  try {
    const result = await game.completeLesson({
      participantRef: participant(req),
      academyKey: req.params.academyKey,
      lessonKey: req.params.lessonKey,
      idempotencyKey: ikey(req),
    })
    res.status(result.ok ? 200 : 400).json(result)
  } catch (e) { next(e) }
})

export default router
