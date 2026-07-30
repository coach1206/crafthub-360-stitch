/**
 * Package 1 — Golden Box foundational API routes.
 * Mounted at /api/smokecraft/golden-box in server/index.js.
 * Reuses the existing SmokeCraft guest-identity middleware (Management
 * Sync, Package B) for guest-facing entry/draft/submission routes, and
 * requireAuth + requireRole for judge/administrator routes — no new
 * identity or authorization primitives invented.
 */
import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { requireAuth, optionalAuth } from '../middleware/authMiddleware.js'
import { requireRole, requireMentor, auditAction } from '../middleware/roleMiddleware.js'
import {
  attachSmokeCraftIdentity, ensureSmokeCraftGuestIdentity, requireSmokeCraftIdentity,
} from '../middleware/smokecraftGuestIdentity.js'
import * as ctrl from '../controllers/goldenBoxController.js'

const router = Router()

const IS_PROD = process.env.NODE_ENV === 'production'
const readLimiter = rateLimit({ windowMs: 60 * 1000, max: 60, skip: () => !IS_PROD })
const writeLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, skip: () => !IS_PROD })

// Guest-facing routes resolve the same SmokeCraft guest identity used by
// Management Sync (server-issued JWT + HttpOnly cookie) — never a
// second, competing guest-identity scheme.
// Holistic Fix 5C-1B: ensureSmokeCraftGuestIdentity was missing here —
// the same recurring defect class as SC-D033/036/041/052/055 — a
// genuinely fresh guest landing directly on a Golden Box route got a
// real 401 instead of an auto-issued identity.
router.use(optionalAuth, attachSmokeCraftIdentity, ensureSmokeCraftGuestIdentity)

function bridgeIdentity(req, _res, next) {
  // Holistic Fix 5C-1B (SC-D055-class fix): an authenticated account's
  // identity was previously used unprefixed here, while
  // convertGuestToAccount() transfers guest data to the `user:${id}`
  // -prefixed identity every other SmokeCraft system uses. That
  // mismatch meant a converted account's Golden Box requests silently
  // queried under the wrong identity and never saw their own
  // just-transferred entry.
  if (req.smokecraftIdentity?.type === 'user') {
    req.goldenBoxGuestReference = `user:${req.smokecraftIdentity.id}`
  } else if (req.smokecraftIdentity?.type === 'guest') {
    req.goldenBoxGuestReference = req.smokecraftIdentity.id
  }
  next()
}

// ── Competitions (administrator-managed) ────────────────────────────
router.post('/competitions', writeLimiter, requireAuth, requireRole('admin'),
  auditAction('GOLDEN_BOX', 'competition_created', 'post'), ctrl.handleCreateCompetition)

router.get('/competitions', readLimiter, ctrl.handleListCompetitions)
router.get('/competitions/:competitionId', readLimiter, ctrl.handleGetCompetition)

router.post('/competitions/:competitionId/transition', writeLimiter, requireAuth, requireRole('admin'),
  auditAction('GOLDEN_BOX', 'competition_transitioned', 'post'), ctrl.handleTransitionCompetition)

// ── Eligibility ──────────────────────────────────────────────────────
router.post('/competitions/:competitionId/eligibility', writeLimiter, requireSmokeCraftIdentity, bridgeIdentity,
  auditAction('GOLDEN_BOX', 'eligibility_evaluated', 'post'), ctrl.handleEvaluateEligibility)

// ── Entries / drafts / submission ───────────────────────────────────
router.post('/competitions/:competitionId/entries', writeLimiter, requireSmokeCraftIdentity, bridgeIdentity,
  auditAction('GOLDEN_BOX', 'entry_created', 'post'), ctrl.handleCreateEntry)

router.get('/entries/:entryId', readLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleGetEntry)

router.patch('/entries/:entryId/draft', writeLimiter, requireSmokeCraftIdentity, bridgeIdentity,
  auditAction('GOLDEN_BOX', 'draft_saved', 'post'), ctrl.handleSaveDraft)

router.post('/entries/:entryId/submit', writeLimiter, requireSmokeCraftIdentity, bridgeIdentity,
  auditAction('GOLDEN_BOX', 'entry_submitted', 'post'), ctrl.handleSubmitEntry)

router.post('/entries/:entryId/withdraw', writeLimiter, requireSmokeCraftIdentity, bridgeIdentity,
  auditAction('GOLDEN_BOX', 'entry_withdrawn', 'post'), ctrl.handleWithdrawEntry)

// ── Judging (administrator/judge only) ──────────────────────────────
router.get('/judging/rubric', readLimiter, ctrl.handleGetRubric)

router.post('/competitions/:competitionId/entries/:entryId/judges', writeLimiter, requireAuth, requireRole('admin'),
  auditAction('GOLDEN_BOX', 'judge_assigned', 'post'), ctrl.handleAssignJudge)

router.post('/entries/:entryId/scorecard/draft', writeLimiter, requireAuth,
  auditAction('GOLDEN_BOX', 'scorecard_draft_saved', 'post'), ctrl.handleSaveScorecardDraft)

router.post('/entries/:entryId/scorecard', writeLimiter, requireAuth,
  auditAction('GOLDEN_BOX', 'scorecard_submitted', 'post'), ctrl.handleSubmitScorecard)

router.get('/competitions/:competitionId/entries/:entryId/results', readLimiter, requireAuth, ctrl.handleGetResults)

// ── AI educational analysis ─────────────────────────────────────────
router.post('/entries/:entryId/ai-analysis', writeLimiter, requireSmokeCraftIdentity, bridgeIdentity,
  auditAction('GOLDEN_BOX', 'ai_analysis_requested', 'post'), ctrl.handleRequestAiAnalysis)

router.get('/entries/:entryId/ai-analysis', readLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleListAiAnalyses)

// ── XP ───────────────────────────────────────────────────────────────
router.get('/xp/history', readLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleGetXpHistory)

// ── Rewards issuance (administrator only) ───────────────────────────
router.post('/entries/:entryId/rewards', writeLimiter, requireAuth, requireRole('admin'),
  auditAction('GOLDEN_BOX', 'rewards_issued', 'post'), ctrl.handleIssueRewards)

// ── Package 7A: judge dashboard, entry review, scorecard lifecycle ────
// Judges are authenticated users authorized per-assignment (matching
// Package 1's existing submitScorecard pattern) — requireAuth only, no
// new "judge" role invented; isAssignedJudge/visibilityService do the
// real per-entry authorization.
router.get('/judges/me/assignments', readLimiter, requireAuth, ctrl.handleGetJudgeAssignments)
router.get('/judges/me/entries/:entryId', readLimiter, requireAuth, ctrl.handleGetEntryForJudge)
router.post('/scorecards/:scorecardId/lock', writeLimiter, requireAuth,
  auditAction('GOLDEN_BOX', 'scorecard_locked', 'post'), ctrl.handleLockScorecard)
router.post('/scorecards/:scorecardId/void', writeLimiter, requireAuth,
  auditAction('GOLDEN_BOX', 'scorecard_voided', 'post'), ctrl.handleVoidScorecard)
router.post('/scorecards/:scorecardId/amend', writeLimiter, requireAuth,
  auditAction('GOLDEN_BOX', 'scorecard_amended', 'post'), ctrl.handleAmendScorecard)

// ── Package 7A: mentor review (requireMentor — real role.human_mentor
// or founder_level_0 gate, same middleware used elsewhere for mentor
// features, not a new authorization scheme) ────────────────────────────
router.post('/entries/:entryId/mentor-review/draft', writeLimiter, requireAuth, requireMentor,
  auditAction('GOLDEN_BOX', 'mentor_review_saved', 'post'), ctrl.handleSaveMentorReviewDraft)
router.post('/entries/:entryId/mentor-review/submit', writeLimiter, requireAuth, requireMentor,
  auditAction('GOLDEN_BOX', 'mentor_review_submitted', 'post'), ctrl.handleSubmitMentorReview)
router.get('/entries/:entryId/mentor-review/draft', readLimiter, requireAuth, requireMentor, ctrl.handleGetOwnMentorDraft)
router.get('/entries/:entryId/mentor-reviews', readLimiter, requireSmokeCraftIdentity, bridgeIdentity, ctrl.handleGetMentorReviewsForEntry)

export default router
