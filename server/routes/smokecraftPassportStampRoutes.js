/**
 * SmokeCraft Passport Stamp Routes
 * Mounted at /api/smokecraft/passport-stamp
 *
 * SECURITY REMEDIATION (docs/audits/passport-360-completion/remediation/01-API-SECURITY-AUDIT.md):
 * this route previously stored claims in an in-memory Map (lost on
 * every server restart — never actually persisted) and trusted a
 * client-submitted guestId/xpEarned/totalXP/finalScore with no
 * authentication at all. It is now identity-gated
 * (requireSmokeCraftIdentity) and persists the real claim through the
 * canonical Passport sync service (real PostgreSQL row, real
 * dedupe_key idempotency) — guestId is always derived from the
 * caller's own verified session, never from the request body.
 *
 * Required-Interaction Closure Package E (SC-D067 fix): eligibility is
 * now checked against the caller's REAL server-recorded session
 * completions (smokecraft_session_completions, via
 * playerStateService.getPlayerState) rather than a client-submitted
 * completedSteps array / scorecardId. A client can no longer claim the
 * stamp by simply POSTing a fabricated completedSteps list. Since
 * Package B already gates the 'scorecard' session's own completion on
 * real, server-recorded Scorecard evidence, "has scorecard" reduces to
 * "'scorecard' is present in the real completed-sessions set" — no
 * separate scorecardId concept is needed.
 *
 * Also, SC-D067: REQUIRED_STEPS previously included 'final-review'
 * (Session 24), which comes AFTER passport-stamp (Session 23) in route
 * order (pairing-recommendations(22) -> passport-stamp(23) ->
 * final-review(24)) — making first-time eligibility impossible on a
 * normal visit. Removed.
 */
import { Router } from 'express'
import { optionalAuth } from '../middleware/authMiddleware.js'
import { attachSmokeCraftIdentity, requireSmokeCraftIdentity } from '../middleware/smokecraftGuestIdentity.js'
import { claimJourneyCompletionStamp, getStamps } from '../services/passport360/passport360SyncService.js'
import { getPlayerState } from '../services/smokecraft/playerStateService.js'

const router = Router()

router.use(optionalAuth, attachSmokeCraftIdentity)

// SC-D067 identity fix: use the SAME guestReference convention
// ('user:<id>' for an authenticated account, raw cookie-issued id for a
// guest) as smokecraft_session_completions / playerStateService
// (ownerGuestReference() in playerStateController.js) for BOTH the
// Passport-360 claim identity and the completion-gate lookup below —
// previously this route passed the raw, unprefixed id to the Passport
// service while playerStateService's own hasPassportStampEvidence gate
// (added in Package E) resolves guests by the prefixed convention,
// which would silently desync stamp lookups for authenticated users.
function bridgeIdentity(req, _res, next) {
  const identity = req.smokecraftIdentity
  if (identity?.type === 'guest' || identity?.type === 'user') {
    req.goldenBoxGuestReference = identity.type === 'user' ? `user:${identity.id}` : identity.id
  }
  next()
}

function playerStateGuestReference(req) {
  return req.goldenBoxGuestReference || null
}

const REQUIRED_STEPS = [
  'humidor-match',
  'first-third',
  'second-third',
  'flavor-memory',
  'final-third',
  'scorecard',
]

// Real, server-authoritative eligibility check — reads the caller's own
// completed sessions from smokecraft_session_completions, never trusts
// a client-submitted completedSteps array or scorecardId.
async function checkEligibility(req) {
  const guestReference = playerStateGuestReference(req)
  let completedIds = []
  try {
    const state = await getPlayerState(guestReference)
    completedIds = state.completedSessions.map(s => s.sessionId)
  } catch { /* no server record yet — treat as nothing completed */ }

  const missing = REQUIRED_STEPS.filter(s => !completedIds.includes(s))
  const eligible = missing.length === 0
  const reasons = missing.map(s => `Step incomplete: ${s}`)
  return { eligible, missing, reasons }
}

// ── GET /api/smokecraft/passport-stamp/eligibility ────────────────────────────
router.get('/eligibility', requireSmokeCraftIdentity, bridgeIdentity, async (req, res) => {
  const { eligible, missing, reasons } = await checkEligibility(req)
  let alreadyClaimed = false
  try {
    const stamps = await getStamps(req.goldenBoxGuestReference)
    alreadyClaimed = stamps.some(s => s.stamp_id === 'smokecraft-journey-complete')
  } catch { /* backend unavailable — treat as not yet claimed */ }

  res.json({
    ok: true,
    eligible: eligible && !alreadyClaimed,
    alreadyClaimed,
    missing,
    reasons: alreadyClaimed ? ['Stamp already claimed'] : reasons,
    requiredSteps: REQUIRED_STEPS,
  })
})

// ── GET /api/smokecraft/passport-stamp/status/:sessionId ──────────────────────
// sessionId is accepted only for URL-shape compatibility with the
// existing frontend; the real lookup is always by the caller's own
// verified identity, never by the client-supplied sessionId value.
router.get('/status/:sessionId', requireSmokeCraftIdentity, bridgeIdentity, async (req, res) => {
  try {
    const stamps = await getStamps(req.goldenBoxGuestReference)
    const record = stamps.find(s => s.stamp_id === 'smokecraft-journey-complete')
    if (!record) return res.json({ ok: true, claimed: false, stamp: null })
    res.json({ ok: true, claimed: true, stamp: { stampId: record.stamp_id, claimedAt: record.earned_at } })
  } catch {
    res.json({ ok: true, claimed: false, stamp: null })
  }
})

// ── POST /api/smokecraft/passport-stamp/claim ─────────────────────────────────
router.post('/claim', requireSmokeCraftIdentity, bridgeIdentity, async (req, res) => {
  const { eligible, reasons } = await checkEligibility(req)
  if (!eligible) {
    return res.status(422).json({ ok: false, error: 'Eligibility requirements not met', reasons })
  }

  try {
    const { stamp, duplicate } = await claimJourneyCompletionStamp(req.goldenBoxGuestReference)
    if (duplicate) {
      return res.status(409).json({ ok: false, duplicate: true, error: 'Stamp already claimed', stamp: { stampId: stamp?.stamp_id } })
    }
    res.json({ ok: true, claimed: true, stamp: { stampId: stamp.stamp_id, claimedAt: stamp.earned_at } })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

// ── GET /api/smokecraft/passport-stamp/guest/me ───────────────────────────────
// Replaces the old /guest/:guestId (which accepted an arbitrary
// client-supplied guestId) — always resolves the caller's own stamps.
router.get('/guest/me', requireSmokeCraftIdentity, bridgeIdentity, async (req, res) => {
  try {
    const stamps = await getStamps(req.goldenBoxGuestReference)
    res.json({ ok: true, stamps, count: stamps.length })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

export default router
