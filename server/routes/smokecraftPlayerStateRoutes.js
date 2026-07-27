/**
 * SmokeCraft canonical player-state — API routes (Holistic Fix 4).
 * Mounted at /api/smokecraft/player-state in server/index.js.
 *
 * Every route resolves identity via the existing, real, JWT-cookie-based
 * ensureSmokeCraftGuestIdentity/requireSmokeCraftIdentity middleware
 * (server/middleware/smokecraftGuestIdentity.js) — a guest identifier is
 * NEVER trusted from the request body, only from a server-verified
 * cookie. This is the same identity system already proven for
 * Management Sync; no new identity scheme was invented.
 */
import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { optionalAuth } from '../middleware/authMiddleware.js'
import {
  attachSmokeCraftIdentity, ensureSmokeCraftGuestIdentity, requireSmokeCraftIdentity,
} from '../middleware/smokecraftGuestIdentity.js'
import * as ctrl from '../controllers/playerStateController.js'

const router = Router()

const readLimiter = rateLimit({ windowMs: 60 * 1000, max: 60 })
const writeLimiter = rateLimit({ windowMs: 60 * 1000, max: 30 })

// Health check does not require/issue an identity — pure infra observability.
router.get('/health', readLimiter, ctrl.handleHealth)

router.use(optionalAuth, attachSmokeCraftIdentity, ensureSmokeCraftGuestIdentity)

router.get('/', readLimiter, requireSmokeCraftIdentity, ctrl.handleGetPlayerState)
router.post('/sessions/:sessionId/complete', writeLimiter, requireSmokeCraftIdentity, ctrl.handleCompleteSession)
router.post('/awards/xp', writeLimiter, requireSmokeCraftIdentity, ctrl.handleAwardXp)
router.post('/awards/badge', writeLimiter, requireSmokeCraftIdentity, ctrl.handleAwardBadge)
router.post('/awards/passport-stamp', writeLimiter, requireSmokeCraftIdentity, ctrl.handleAwardPassportStamp)

export default router
