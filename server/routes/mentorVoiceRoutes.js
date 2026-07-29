/**
 * Holistic Fix 5B-2B-1 — SmokeCraft mentor-voice routes. Mounted at
 * /api/smokecraft/mentor-voice in server/index.js. Same guest-identity
 * middleware pattern as mentor guidance / pairing engine (built with
 * every previously-found systemic defect class — SC-D033/036/041/052 —
 * closed from day one: ensureSmokeCraftGuestIdentity is present so a
 * genuinely fresh guest never 401s on first navigation).
 */
import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { optionalAuth } from '../middleware/authMiddleware.js'
import { attachSmokeCraftIdentity, ensureSmokeCraftGuestIdentity, requireSmokeCraftIdentity } from '../middleware/smokecraftGuestIdentity.js'
import * as ctrl from '../controllers/mentorVoiceController.js'

const router = Router()
const IS_PROD = process.env.NODE_ENV === 'production'
// Tighter than the mentor-guidance writeLimiter — preview synthesis is
// the one route in this file that can reach a paid provider.
const previewLimiter = rateLimit({ windowMs: 60 * 1000, max: 20, skip: () => !IS_PROD })
const prefsLimiter = rateLimit({ windowMs: 60 * 1000, max: 60, skip: () => !IS_PROD })

router.use(optionalAuth, attachSmokeCraftIdentity, ensureSmokeCraftGuestIdentity)

function bridgeIdentity(req, _res, next) {
  if (req.smokecraftIdentity?.type === 'user') {
    req.goldenBoxGuestReference = `user:${req.smokecraftIdentity.id}`
  } else if (req.smokecraftIdentity?.type === 'guest') {
    req.goldenBoxGuestReference = req.smokecraftIdentity.id
  }
  next()
}

router.get('/profiles', ctrl.handleListProfiles)
router.post('/preview', previewLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handlePreview)
router.get('/preferences', requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleGetPreferences)
router.post('/preferences', prefsLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleSavePreferences)

export default router
