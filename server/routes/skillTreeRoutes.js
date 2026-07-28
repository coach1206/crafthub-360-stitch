/**
 * Skill Tree Persistence routes. Mounted at /api/smokecraft/skill-tree in
 * server/index.js. Same guest-identity middleware pattern as Seed & Soil
 * and Filler Arrangement.
 */
import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { optionalAuth } from '../middleware/authMiddleware.js'
import { attachSmokeCraftIdentity, ensureSmokeCraftGuestIdentity, requireSmokeCraftIdentity } from '../middleware/smokecraftGuestIdentity.js'
import * as ctrl from '../controllers/skillTreeController.js'

const router = Router()
const IS_PROD = process.env.NODE_ENV === 'production'
// Holistic Fix 5A-3G: matches the established convention in
// server/index.js's global limiters and smokecraftPlayerStateRoutes.js /
// collectionsRoutes.js (skip: () => !IS_PROD) — this router previously
// lacked it (same defect class as SC-D021/SC-D031), which would throttle
// automated test suites making repeated calls.
const readLimiter = rateLimit({ windowMs: 60 * 1000, max: 90, skip: () => !IS_PROD })
const writeLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, skip: () => !IS_PROD })

// Holistic Fix 5A-3G: was previously missing ensureSmokeCraftGuestIdentity
// — a real, found defect (same class as SC-D033). attachSmokeCraftIdentity
// only READS an existing identity cookie; without
// ensureSmokeCraftGuestIdentity (which ISSUES a fresh one when none
// exists, exactly like smokecraftPlayerStateRoutes.js and
// collectionsRoutes.js already do), a genuinely first-ever visit directly
// to /smokecraft/skill-tree — before visiting any other SmokeCraft route
// — 401'd instead of getting a real guest identity.
router.use(optionalAuth, attachSmokeCraftIdentity, ensureSmokeCraftGuestIdentity)

// Holistic Fix 5A-3G: was previously `req.smokecraftIdentity.id` for BOTH
// guest and authenticated-account identities — a real defect (same class
// as SC-D032). Every other player-state table uses the `user:${id}`
// prefix for an authenticated account (see ownerGuestReference() in
// playerStateController.js). Left unprefixed, an authenticated user's
// Skill Tree rows were keyed inconsistently with the rest of their
// player state, and guest-to-account conversion had no matching
// `user:${id}` reference to find/recalculate against.
function bridgeIdentity(req, _res, next) {
  if (req.smokecraftIdentity?.type === 'user') {
    req.goldenBoxGuestReference = `user:${req.smokecraftIdentity.id}`
  } else if (req.smokecraftIdentity?.type === 'guest') {
    req.goldenBoxGuestReference = req.smokecraftIdentity.id
  }
  next()
}

router.get('/', readLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleGetSkillTree)
router.get('/nodes/:nodeKey', readLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleGetNode)
router.post('/recalculate', writeLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleRecalculate)

export default router
