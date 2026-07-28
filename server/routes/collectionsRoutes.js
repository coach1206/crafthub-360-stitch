/**
 * Collections Ownership and Persistence routes. Mounted at
 * /api/smokecraft/collections in server/index.js. Same guest-identity
 * middleware pattern as Skill Tree / Filler Arrangement / Seed & Soil.
 */
import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { optionalAuth } from '../middleware/authMiddleware.js'
import { attachSmokeCraftIdentity, ensureSmokeCraftGuestIdentity, requireSmokeCraftIdentity } from '../middleware/smokecraftGuestIdentity.js'
import * as ctrl from '../controllers/collectionsController.js'

const router = Router()
const IS_PROD = process.env.NODE_ENV === 'production'
// Holistic Fix 5A-3F: matches the established convention in
// server/index.js's global limiters and every smokecraftPlayerStateRoutes.js
// limiter (skip: () => !IS_PROD) — this router previously lacked it (a
// real, found defect, same class as SC-D021 from Holistic Fix 4B),
// which would throttle automated test suites making repeated calls.
const readLimiter = rateLimit({ windowMs: 60 * 1000, max: 90, skip: () => !IS_PROD })
const writeLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, skip: () => !IS_PROD })

// Holistic Fix 5A-3F: was previously missing ensureSmokeCraftGuestIdentity
// — a real, found defect. attachSmokeCraftIdentity only READS an existing
// identity cookie; without ensureSmokeCraftGuestIdentity (which ISSUES a
// fresh one when none exists, exactly like smokecraftPlayerStateRoutes.js
// already does), a genuinely first-ever visit directly to
// /smokecraft/collections — before visiting any other SmokeCraft route —
// 401'd instead of getting a real guest identity, confirmed live via a
// fresh-browser Playwright smoke test.
router.use(optionalAuth, attachSmokeCraftIdentity, ensureSmokeCraftGuestIdentity)

// Holistic Fix 5A-3F: was previously `req.smokecraftIdentity.id` for BOTH
// guest and authenticated-account identities — a real defect, since every
// other player-state table (smokecraft_awards, smokecraft_session_completions,
// etc.) uses the `user:${id}` prefix for an authenticated account (see
// ownerGuestReference() in playerStateController.js). Left unprefixed,
// an authenticated user's Collections rows were keyed inconsistently
// with the rest of their player state, and guest-to-account conversion
// (convertGuestToAccount) never transferred Collections ownership at
// all, since it had no matching `user:${id}` reference to look for.
function bridgeIdentity(req, _res, next) {
  if (req.smokecraftIdentity?.type === 'user') {
    req.goldenBoxGuestReference = `user:${req.smokecraftIdentity.id}`
  } else if (req.smokecraftIdentity?.type === 'guest') {
    req.goldenBoxGuestReference = req.smokecraftIdentity.id
  }
  next()
}

router.get('/', readLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleGetCollections)
router.get('/items/:itemKey', readLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleGetItem)
router.post('/recalculate', writeLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleRecalculate)

export default router
