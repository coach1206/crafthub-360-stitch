/**
 * Holistic Fix 5B-2A — mentor guidance routes. Mounted at
 * /api/smokecraft/mentor-guidance in server/index.js. Same guest-
 * identity middleware pattern as the pairing engine (built with every
 * previously-found systemic defect class closed from day one).
 */
import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { optionalAuth } from '../middleware/authMiddleware.js'
import { attachSmokeCraftIdentity, ensureSmokeCraftGuestIdentity, requireSmokeCraftIdentity } from '../middleware/smokecraftGuestIdentity.js'
import * as ctrl from '../controllers/mentorGuidanceController.js'

const router = Router()
const IS_PROD = process.env.NODE_ENV === 'production'
const writeLimiter = rateLimit({ windowMs: 60 * 1000, max: 60, skip: () => !IS_PROD })

router.use(optionalAuth, attachSmokeCraftIdentity, ensureSmokeCraftGuestIdentity)

function bridgeIdentity(req, _res, next) {
  if (req.smokecraftIdentity?.type === 'user') {
    req.goldenBoxGuestReference = `user:${req.smokecraftIdentity.id}`
  } else if (req.smokecraftIdentity?.type === 'guest') {
    req.goldenBoxGuestReference = req.smokecraftIdentity.id
  }
  next()
}

router.post('/guidance', writeLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleGetGuidance)

export default router
