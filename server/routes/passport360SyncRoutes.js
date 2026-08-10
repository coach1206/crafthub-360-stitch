/**
 * Passport 360 Connection Completion — secure sync routes. Mounted at
 * /api/passport-360/sync in server/index.js. Same guest-identity
 * middleware pattern as Skill Tree / Collections / Challenge Hub /
 * Blend Fault. Deliberately separate from the pre-existing, unauthenticated
 * /api/passport-360/smokecraft/* routes (Phase F.5) — see
 * docs/audits/passport-360-completion/01-ARCHITECTURE-AUDIT.md.
 */
import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { optionalAuth } from '../middleware/authMiddleware.js'
import { attachSmokeCraftIdentity, requireSmokeCraftIdentity } from '../middleware/smokecraftGuestIdentity.js'
import * as ctrl from '../controllers/passport360SyncController.js'

const router = Router()
const IS_PROD = process.env.NODE_ENV === 'production'
const readLimiter = rateLimit({ windowMs: 60 * 1000, max: 90, skip: () => !IS_PROD })
const writeLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, skip: () => !IS_PROD })

router.use(optionalAuth, attachSmokeCraftIdentity)

function bridgeIdentity(req, _res, next) {
  if (req.smokecraftIdentity?.type === 'guest' || req.smokecraftIdentity?.type === 'user') {
    req.goldenBoxGuestReference = req.smokecraftIdentity.id
  }
  next()
}

router.get('/profile', readLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleGetProfile)
router.get('/stamps', readLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleGetStamps)
router.get('/connections', readLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleGetConnections)
router.get('/activity', readLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleGetActivity)
router.get('/directory', readLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleGetDirectory)
router.post('/synchronize', writeLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleSynchronize)
router.post('/flavor-memory', writeLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleSaveFlavorMemory)
router.post('/journey-stamp/claim', writeLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleClaimJourneyStamp)
router.post('/link-guest', writeLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleLinkGuestToUser)

export default router
