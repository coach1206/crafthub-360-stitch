/**
 * Package 4 — Seed and Soil live learning experience routes.
 * Mounted at /api/smokecraft/seed-soil in server/index.js. Reuses the same
 * SmokeCraft guest-identity middleware as Golden Box (Package 1/2).
 */
import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { optionalAuth } from '../middleware/authMiddleware.js'
import { attachSmokeCraftIdentity, requireSmokeCraftIdentity } from '../middleware/smokecraftGuestIdentity.js'
import * as ctrl from '../controllers/seedSoilController.js'

const router = Router()
const readLimiter = rateLimit({ windowMs: 60 * 1000, max: 90 })
const writeLimiter = rateLimit({ windowMs: 60 * 1000, max: 40 })

router.use(optionalAuth, attachSmokeCraftIdentity)

function bridgeIdentity(req, _res, next) {
  if (req.smokecraftIdentity?.type === 'guest' || req.smokecraftIdentity?.type === 'user') {
    req.goldenBoxGuestReference = req.smokecraftIdentity.id
  }
  next()
}

router.get('/components', readLimiter, ctrl.handleListSeedSoilComponents)

router.get('/notes', readLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleGetNotes)
router.post('/notes', writeLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleSaveNote)

router.get('/progress', readLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleGetProgress)
router.post('/progress', writeLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleRecordProgress)

router.post('/quiz/:questionId/answer', writeLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleSubmitQuizAnswer)

export default router
