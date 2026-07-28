/**
 * Filler Arrangement standalone lesson routes. Mounted at
 * /api/smokecraft/filler-arrangement in server/index.js. Same guest-identity
 * middleware pattern as Seed & Soil (Package 4).
 */
import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { optionalAuth } from '../middleware/authMiddleware.js'
import { attachSmokeCraftIdentity, ensureSmokeCraftGuestIdentity, requireSmokeCraftIdentity } from '../middleware/smokecraftGuestIdentity.js'
import * as ctrl from '../controllers/fillerArrangementController.js'

const router = Router()
const readLimiter = rateLimit({ windowMs: 60 * 1000, max: 90 })
const writeLimiter = rateLimit({ windowMs: 60 * 1000, max: 40 })

router.use(optionalAuth, attachSmokeCraftIdentity, ensureSmokeCraftGuestIdentity)

function bridgeIdentity(req, _res, next) {
  if (req.smokecraftIdentity?.type === 'guest' || req.smokecraftIdentity?.type === 'user') {
    req.goldenBoxGuestReference = req.smokecraftIdentity.id
  }
  next()
}

router.get('/note', readLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleGetNote)
router.post('/note', writeLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleSaveNote)

router.get('/progress', readLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleGetProgress)
router.post('/progress', writeLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleRecordZoneViewed)

router.post('/quiz/answer', writeLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleSubmitQuizAnswer)
router.post('/complete', writeLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleCompleteLesson)

export default router
