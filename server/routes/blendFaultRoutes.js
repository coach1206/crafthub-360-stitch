/**
 * Blend Fault Identification Backend Scoring routes. Mounted at
 * /api/smokecraft/blend-fault in server/index.js. Same guest-identity
 * middleware pattern as Skill Tree / Collections / Challenge Hub.
 */
import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { optionalAuth } from '../middleware/authMiddleware.js'
import { attachSmokeCraftIdentity, ensureSmokeCraftGuestIdentity, requireSmokeCraftIdentity } from '../middleware/smokecraftGuestIdentity.js'
import * as ctrl from '../controllers/blendFaultController.js'

const router = Router()
const readLimiter = rateLimit({ windowMs: 60 * 1000, max: 90 })
const writeLimiter = rateLimit({ windowMs: 60 * 1000, max: 30 })

router.use(optionalAuth, attachSmokeCraftIdentity, ensureSmokeCraftGuestIdentity)

function bridgeIdentity(req, _res, next) {
  if (req.smokecraftIdentity?.type === 'user') {
    req.goldenBoxGuestReference = `user:${req.smokecraftIdentity.id}`
  } else if (req.smokecraftIdentity?.type === 'guest') {
    req.goldenBoxGuestReference = req.smokecraftIdentity.id
  }
  next()
}

router.get('/', readLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleGetAssessment)
router.post('/attempts', writeLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleStartAttempt)
router.get('/attempts/:attemptId', readLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleGetAttempt)
router.post('/attempts/:attemptId/submit', writeLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleSubmitAttempt)
router.get('/history', readLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleGetHistory)

export default router
