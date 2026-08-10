/**
 * Holistic Fix 5B-1 — server-authoritative pairing engine routes. Mounted
 * at /api/smokecraft/pairing-engine in server/index.js. Same guest-
 * identity middleware pattern as Skill Tree / Collections (built with
 * every previously-found systemic defect class closed from day one:
 * dev/test rate-limiter skip, ensureSmokeCraftGuestIdentity, and the
 * `user:` identity prefix for authenticated accounts).
 */
import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { optionalAuth } from '../middleware/authMiddleware.js'
import { attachSmokeCraftIdentity, ensureSmokeCraftGuestIdentity, requireSmokeCraftIdentity } from '../middleware/smokecraftGuestIdentity.js'
import * as ctrl from '../controllers/pairingEngineController.js'

const router = Router()
const IS_PROD = process.env.NODE_ENV === 'production'
const readLimiter = rateLimit({ windowMs: 60 * 1000, max: 90, skip: () => !IS_PROD })
const writeLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, skip: () => !IS_PROD })

router.use(optionalAuth, attachSmokeCraftIdentity, ensureSmokeCraftGuestIdentity)

function bridgeIdentity(req, _res, next) {
  if (req.smokecraftIdentity?.type === 'user') {
    req.goldenBoxGuestReference = `user:${req.smokecraftIdentity.id}`
  } else if (req.smokecraftIdentity?.type === 'guest') {
    req.goldenBoxGuestReference = req.smokecraftIdentity.id
  }
  next()
}

router.post('/recommend', writeLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleRecommend)
router.post('/rank', writeLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleRank)
router.post('/save', writeLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleSave)
router.get('/saved', readLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleGetSavedList)
router.get('/saved/:id', readLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleGetSavedOne)
router.put('/saved/:id/rate', writeLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleRate)

export default router
