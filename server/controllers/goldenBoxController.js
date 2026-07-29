import * as competitionService from '../services/goldenBox/competitionService.js'
import * as eligibilityService from '../services/goldenBox/eligibilityService.js'
import * as entryService from '../services/goldenBox/entryService.js'
import * as judgingService from '../services/goldenBox/judgingService.js'
import * as aiAnalysisService from '../services/goldenBox/aiAnalysisService.js'
import * as visibilityService from '../services/goldenBox/visibilityService.js'
import * as rewardsService from '../services/goldenBox/rewardsIntegrationService.js'
import * as xpService from '../services/goldenBox/xpService.js'
import * as mentorReviewService from '../services/goldenBox/mentorReviewService.js'
import { transitionCompetition } from '../services/goldenBox/lifecycleService.js'

function sendError(res, err, fallback = 400) {
  const statusByCode = {
    record_not_found: 404, entry_not_found: 404, competition_not_found: 404,
    transaction_not_found: 404, recipe_private: 403, judge_not_assigned: 403,
    entry_locked_cannot_edit: 409, duplicate_submission: 409, submission_closed: 409,
    scorecard_already_submitted: 409, invalid_scope: 400, guest_reference_required: 400,
    identity_required: 400, idempotency_key_required: 400,
    void_reason_required: 400, amend_reason_required: 400,
    no_draft_review_to_submit: 404,
  }
  const code = err.code || 'internal_error'
  let status = statusByCode[code] || fallback
  if (code.startsWith('invalid_transition_')) status = 409
  if (code.startsWith('validation_failed')) status = 422
  if (code.startsWith('invalid_category') || code.startsWith('invalid_score')) status = 400
  res.status(status).json({ success: false, error: code })
}

function identityFrom(req) {
  return {
    userId: req.user?.id && req.user.role !== 'guest' ? req.user.id : null,
    guestReference: req.goldenBoxGuestReference || (req.user?.role === 'guest' ? req.user.id : null),
    guestUuid: req.goldenBoxGuestUuid || null,
    platformAdmin: req.user?.role === 'admin' || req.user?.role === 'founder_level_0',
  }
}

export async function handleCreateCompetition(req, res) {
  try {
    const c = await competitionService.createCompetition({ ...req.body, createdBy: req.user.id })
    res.status(201).json({ success: true, competition: c })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleListCompetitions(req, res) {
  try {
    const competitions = await competitionService.listCompetitions(req.query)
    res.json({ success: true, competitions })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleGetCompetition(req, res) {
  try {
    const c = await competitionService.getCompetition(Number(req.params.competitionId))
    if (!c) return res.status(404).json({ success: false, error: 'competition_not_found' })
    res.json({ success: true, competition: c })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleTransitionCompetition(req, res) {
  try {
    const c = await transitionCompetition(Number(req.params.competitionId), req.body.toStatus, req.user.id)
    res.json({ success: true, competition: c })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleEvaluateEligibility(req, res) {
  try {
    const identity = identityFrom(req)
    const result = await eligibilityService.evaluateEligibility(Number(req.params.competitionId), identity)
    res.json({ success: true, ...result })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleCreateEntry(req, res) {
  try {
    const identity = identityFrom(req)
    const entry = await entryService.createEntry(Number(req.params.competitionId), identity, req.user.id)
    res.status(201).json({ success: true, entry })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleGetEntry(req, res) {
  try {
    const entry = await entryService.getEntry(req.params.entryId)
    if (!entry) return res.status(404).json({ success: false, error: 'entry_not_found' })
    const competition = await competitionService.getCompetition(entry.competition_id)
    const identity = identityFrom(req)
    const visibility = await visibilityService.getVisibility(entry, competition, identity)
    if (!visibility.canViewRecipe) {
      return res.json({ success: true, entry: { entry_id: entry.entry_id, status: entry.status, competition_id: entry.competition_id }, visibility })
    }
    // Package 4 fix: rehydration requires the current version's saved
    // components, not just the entry row — previously never returned,
    // so the frontend had no way to restore a saved draft on reload.
    const currentVersion = await entryService.getCurrentVersion(entry.entry_id)
    const components = currentVersion ? await entryService.getBlendComponents(currentVersion.id) : []
    res.json({ success: true, entry, visibility, currentVersion, components })
  } catch (err) { sendError(res, err, 500) }
}

// Phase 8 fix: saveDraft/submitEntry/withdrawEntry previously performed
// no ownership check at all — any caller (including a different
// learner, or any guest, since all guests share the same prototype-mode
// req.user.id) could edit, submit, or withdraw another learner's entry.
// Mirrors the same "ownsAsUser || ownsAsGuest" identity comparison
// visibilityService.resolveViewerRole already uses for reads, applied
// here to the three write paths that were missing it.
function ownsEntry(entry, identity) {
  const ownsAsUser = !!identity.userId && identity.userId === entry.user_id
  const ownsAsGuest = !!identity.guestReference && identity.guestReference === entry.guest_reference
  return ownsAsUser || ownsAsGuest
}

async function requireOwnedEntry(req, res) {
  const entry = await entryService.getEntry(req.params.entryId)
  if (!entry) { res.status(404).json({ success: false, error: 'entry_not_found' }); return null }
  const identity = identityFrom(req)
  if (!ownsEntry(entry, identity)) {
    res.status(403).json({ success: false, error: 'entry_not_owned_by_caller' })
    return null
  }
  return entry
}

export async function handleSaveDraft(req, res) {
  try {
    const entry = await requireOwnedEntry(req, res)
    if (!entry) return
    const version = await entryService.saveDraft(req.params.entryId, req.body, req.user.id)
    res.json({ success: true, version })
  } catch (err) {
    if (err.code === 'stale_version') {
      return res.status(409).json({ success: false, error: 'stale_version', currentVersion: err.currentVersion })
    }
    sendError(res, err, 500)
  }
}

export async function handleSubmitEntry(req, res) {
  try {
    const entry = await requireOwnedEntry(req, res)
    if (!entry) return
    const competition = await competitionService.getCompetition(entry.competition_id)
    const submission = await entryService.submitEntry(req.params.entryId, req.user.id, competition, req.body?.idempotencyKey)
    res.json({ success: true, submission })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleWithdrawEntry(req, res) {
  try {
    const entry = await requireOwnedEntry(req, res)
    if (!entry) return
    await entryService.withdrawEntry(req.params.entryId, req.user.id)
    res.json({ success: true })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleAssignJudge(req, res) {
  try {
    const assignment = await judgingService.assignJudge(Number(req.params.competitionId), req.params.entryId, req.body.judgeUserId, req.user.id)
    res.json({ success: true, assignment })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleSubmitScorecard(req, res) {
  try {
    const scorecard = await judgingService.submitScorecard(req.params.entryId, req.user.id, req.body.scores, req.user.id)
    res.json({ success: true, scorecard })
  } catch (err) { sendError(res, err, 500) }
}

// Phase 8 fix: this route previously computed and returned any entry's
// real aggregate score to any authenticated caller, with no ownership
// check and no competition-status gate — an arbitrary authenticated
// user could read another learner's result before official release.
// Reuse the same visibilityService.getVisibility policy already used by
// handleGetEntry/requireEntryAnalysisAccess (canViewScores is
// judging-closed-state-aware and role-aware) rather than inventing a
// new check.
export async function handleGetResults(req, res) {
  try {
    const entry = await entryService.getEntry(req.params.entryId)
    if (!entry) return res.status(404).json({ success: false, error: 'entry_not_found' })
    const competition = await competitionService.getCompetition(entry.competition_id)
    const identity = identityFrom(req)
    const visibility = await visibilityService.getVisibility(entry, competition, identity)
    if (!visibility.canViewScores) {
      return res.status(403).json({ success: false, error: 'results_not_authorized' })
    }
    const result = await judgingService.computeAggregateResult(Number(req.params.competitionId), req.params.entryId)
    res.json({ success: true, result })
  } catch (err) { sendError(res, err, 500) }
}

// AI analysis is entrant-owned content (Package 1 review, doc 10, Step 6
// flagged this route as under-enforced) — reuse visibilityService the
// same way handleGetEntry does, rather than trusting mere identity
// verification. Entrant sees their own; assigned judges/administrators
// see it per the same role resolution used for the recipe itself.
async function requireEntryAnalysisAccess(req, res) {
  const entry = await entryService.getEntry(req.params.entryId)
  if (!entry) { res.status(404).json({ success: false, error: 'entry_not_found' }); return null }
  const competition = await competitionService.getCompetition(entry.competition_id)
  const identity = identityFrom(req)
  const visibility = await visibilityService.getVisibility(entry, competition, identity)
  if (!visibility.canViewRecipe) { res.status(403).json({ success: false, error: 'ai_analysis_private' }); return null }
  return entry
}

export async function handleRequestAiAnalysis(req, res) {
  try {
    const entry = await requireEntryAnalysisAccess(req, res)
    if (!entry) return
    const analysis = await aiAnalysisService.requestAnalysis(req.params.entryId, req.body.analysisType, req.user.id)
    res.status(201).json({ success: true, analysis })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleListAiAnalyses(req, res) {
  try {
    const entry = await requireEntryAnalysisAccess(req, res)
    if (!entry) return
    const analyses = await aiAnalysisService.listAnalyses(req.params.entryId)
    res.json({ success: true, analyses })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleGetXpHistory(req, res) {
  try {
    const identity = identityFrom(req)
    const history = await xpService.getXpHistory(identity)
    const balance = await xpService.getXpBalance(identity)
    res.json({ success: true, balance, history })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleIssueRewards(req, res) {
  try {
    const entry = await entryService.getEntry(req.params.entryId)
    if (!entry) return res.status(404).json({ success: false, error: 'entry_not_found' })
    const results = {}
    if (req.body.xpAmount) results.xp = await rewardsService.grantXp(entry, req.body.xpAmount, req.body.xpReason || 'Golden Box reward')
    if (req.body.badgeId) results.badge = await rewardsService.grantBadge(entry, req.body.guestUuid, req.body.badgeId, req.body.badgeLabel)
    if (req.body.publishLeaderboard) {
      const result = await judgingService.computeAggregateResult(entry.competition_id, entry.entry_id)
      results.leaderboard = result ? await rewardsService.publishToLeaderboard(entry, result, req.body.venueId) : { skipped: true, reason: 'no_result_yet' }
    }
    res.json({ success: true, results })
  } catch (err) { sendError(res, err, 500) }
}

// ── Package 7A: judge dashboard, entry review, scorecard lifecycle ────
export async function handleGetJudgeAssignments(req, res) {
  try {
    const assignments = await judgingService.getJudgeAssignments(req.user.id)
    res.json({ success: true, assignments })
  } catch (err) { sendError(res, err, 500) }
}

// Judge-facing entry detail — reuses visibilityService exactly as
// handleGetEntry does (an assigned judge is one of the roles
// visibilityService already resolves recipe access for); adds the
// judge's own scorecard (if any) so the frontend has everything for one
// review screen without extra round-trips.
export async function handleGetEntryForJudge(req, res) {
  try {
    const entry = await entryService.getEntry(req.params.entryId)
    if (!entry) return res.status(404).json({ success: false, error: 'entry_not_found' })
    const competition = await competitionService.getCompetition(entry.competition_id)
    const identity = { userId: req.user.id, guestReference: null, guestUuid: null, platformAdmin: req.user.role === 'admin' || req.user.role === 'founder_level_0' }
    const visibility = await visibilityService.getVisibility(entry, competition, identity)
    if (!visibility.canViewRecipe) return res.status(403).json({ success: false, error: 'recipe_private' })
    const currentVersion = await entryService.getCurrentVersion(entry.entry_id)
    const components = currentVersion ? await entryService.getBlendComponents(currentVersion.id) : []
    const scorecard = await judgingService.getOwnScorecard(entry.entry_id, req.user.id)
    res.json({ success: true, entry, currentVersion, components, scorecard })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleLockScorecard(req, res) {
  try {
    const scorecard = await judgingService.lockScorecard(Number(req.params.scorecardId), req.user.id)
    res.json({ success: true, scorecard })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleVoidScorecard(req, res) {
  try {
    const scorecard = await judgingService.voidScorecard(Number(req.params.scorecardId), req.user.id, req.body.reason)
    res.json({ success: true, scorecard })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleAmendScorecard(req, res) {
  try {
    const scorecard = await judgingService.amendScorecard(Number(req.params.scorecardId), req.user.id, req.body.scores, req.user.id, req.body.reason)
    res.json({ success: true, scorecard })
  } catch (err) { sendError(res, err, 500) }
}

// ── Package 7A: mentor review ──────────────────────────────────────────
export async function handleSaveMentorReviewDraft(req, res) {
  try {
    const review = await mentorReviewService.saveDraft(req.params.entryId, req.user.id, req.body)
    res.json({ success: true, review })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleSubmitMentorReview(req, res) {
  try {
    const review = await mentorReviewService.submitReview(req.params.entryId, req.user.id, req.user.id)
    res.json({ success: true, review })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleGetOwnMentorDraft(req, res) {
  try {
    const review = await mentorReviewService.getOwnDraft(req.params.entryId, req.user.id)
    res.json({ success: true, review })
  } catch (err) { sendError(res, err, 500) }
}

// Entrant-facing read — reuses visibilityService's recipe-access
// resolution as the gate (if you can see your own recipe, you can see
// mentor feedback about it); only ever returns submitted reviews.
export async function handleGetMentorReviewsForEntry(req, res) {
  try {
    const entry = await entryService.getEntry(req.params.entryId)
    if (!entry) return res.status(404).json({ success: false, error: 'entry_not_found' })
    const competition = await competitionService.getCompetition(entry.competition_id)
    const identity = identityFrom(req)
    const visibility = await visibilityService.getVisibility(entry, competition, identity)
    if (!visibility.canViewRecipe) return res.json({ success: true, reviews: [] })
    const reviews = await mentorReviewService.getReviewsForEntrant(req.params.entryId)
    res.json({ success: true, reviews })
  } catch (err) { sendError(res, err, 500) }
}
