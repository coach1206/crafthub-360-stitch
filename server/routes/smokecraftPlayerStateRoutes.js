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
import { requireStaff } from '../middleware/roleMiddleware.js'
import * as ctrl from '../controllers/playerStateController.js'

const router = Router()

const IS_PROD = process.env.NODE_ENV === 'production'
// Matches the existing convention in server/index.js's global rate
// limiters (skip: () => !IS_PROD) — real production protection, but
// must not throttle dev/test suites (found live during Holistic Fix 4B:
// the account router's un-skipped limiter caused a cascading false
// failure in the automated test suite after ~10 auth calls, correctly
// root-caused as a rate-limit/test-harness interaction, not a product
// defect, and fixed here for both routers).
const readLimiter = rateLimit({ windowMs: 60 * 1000, max: 60, skip: () => !IS_PROD })
const writeLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, skip: () => !IS_PROD })

// Health check does not require/issue an identity — pure infra observability.
router.get('/health', readLimiter, ctrl.handleHealth)

router.use(optionalAuth, attachSmokeCraftIdentity, ensureSmokeCraftGuestIdentity)

router.get('/', readLimiter, requireSmokeCraftIdentity, ctrl.handleGetPlayerState)
router.post('/sessions/:sessionId/complete', writeLimiter, requireSmokeCraftIdentity, ctrl.handleCompleteSession)
router.post('/awards/xp', writeLimiter, requireSmokeCraftIdentity, ctrl.handleAwardXp)
router.post('/awards/badge', writeLimiter, requireSmokeCraftIdentity, ctrl.handleAwardBadge)
router.post('/awards/passport-stamp', writeLimiter, requireSmokeCraftIdentity, ctrl.handleAwardPassportStamp)

// ── Holistic Fix 4B: journey-content snapshot + guest-to-account conversion ──
router.get('/journey-snapshot', readLimiter, requireSmokeCraftIdentity, ctrl.handleGetJourneySnapshot)
router.put('/journey-snapshot', writeLimiter, requireSmokeCraftIdentity, ctrl.handleSaveJourneySnapshot)
// req.user (real account) is resolved by optionalAuth above; req.smokecraftGuestCookieIdentity
// (verified guest cookie) is resolved by attachSmokeCraftIdentity above — the controller itself
// enforces both are present, since conversion is a distinct authorization requirement from the
// rest of this router's plain guest-identity routes.
router.post('/convert-guest', writeLimiter, ctrl.handleConvertGuest)

// ── Holistic Fix 5A: authoritative leaderboard ──
router.get('/leaderboard', readLimiter, ctrl.handleGetLeaderboard)
router.put('/leaderboard/preference', writeLimiter, requireSmokeCraftIdentity, ctrl.handleSetLeaderboardPreference)

// ── Holistic Fix 5A-2: server-verified quiz/skill-check scoring + corrections ──
router.post('/knowledge-check/:moduleId/submit', writeLimiter, requireSmokeCraftIdentity, ctrl.handleSubmitKnowledgeCheck)
router.post('/leaf-challenge/submit', writeLimiter, requireSmokeCraftIdentity, ctrl.handleSubmitLeafChallenge)
router.post('/blend/submit', writeLimiter, requireSmokeCraftIdentity, ctrl.handleSubmitBlend)
// Staff-only, never reachable by a learner identity — requireStaff runs
// AFTER optionalAuth (mounted above via router.use), so req.user is
// already resolved from a real, server-verified session by this point.
router.post('/corrections', writeLimiter, requireStaff, ctrl.handleCorrectReward)

// ── Holistic Fix 5A-3D: server-authoritative tasting draft/completion ──
router.get('/tasting/:activityKey/draft', readLimiter, requireSmokeCraftIdentity, ctrl.handleGetTastingDraft)
router.put('/tasting/:activityKey/draft', writeLimiter, requireSmokeCraftIdentity, ctrl.handleSaveTastingDraft)
router.post('/tasting/:activityKey/complete', writeLimiter, requireSmokeCraftIdentity, ctrl.handleSubmitTasting)

export default router
