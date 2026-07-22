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
 * The underlying eligibility signal (completedSteps) remains
 * client-reported, a disclosed, pre-existing limitation of the
 * broader, out-of-scope 27-session client-tracked journey
 * architecture — this remediation closes the identity/persistence
 * defect, not the (separately disclosed, unchanged) eligibility
 * limitation.
 */
import { Router } from 'express'
import { optionalAuth } from '../middleware/authMiddleware.js'
import { attachSmokeCraftIdentity, requireSmokeCraftIdentity } from '../middleware/smokecraftGuestIdentity.js'
import { claimJourneyCompletionStamp, getStamps } from '../services/passport360/passport360SyncService.js'

const router = Router()

router.use(optionalAuth, attachSmokeCraftIdentity)

function bridgeIdentity(req, _res, next) {
  if (req.smokecraftIdentity?.type === 'guest' || req.smokecraftIdentity?.type === 'user') {
    req.goldenBoxGuestReference = req.smokecraftIdentity.id
  }
  next()
}

const REQUIRED_STEPS = [
  'humidor-match',
  'first-third',
  'second-third',
  'flavor-memory',
  'final-third',
  'scorecard',
  'final-review',
]

function checkEligibility(completedSteps = [], scorecardId = null) {
  const missing = REQUIRED_STEPS.filter(s => !completedSteps.includes(s))
  const hasScorecard = Boolean(scorecardId)
  const eligible = missing.length === 0 && hasScorecard
  const reasons = [
    ...missing.map(s => `Step incomplete: ${s}`),
    ...(!hasScorecard ? ['Scorecard not submitted'] : []),
  ]
  return { eligible, missing, reasons }
}

// ── GET /api/smokecraft/passport-stamp/eligibility ────────────────────────────
router.get('/eligibility', requireSmokeCraftIdentity, bridgeIdentity, async (req, res) => {
  const { completedSteps, scorecardId } = req.query
  const steps = completedSteps ? completedSteps.split(',').map(s => s.trim()).filter(Boolean) : []
  const { eligible, missing, reasons } = checkEligibility(steps, scorecardId)
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
  const { completedSteps, scorecardId } = req.body || {}
  const steps = Array.isArray(completedSteps) ? completedSteps : []
  const { eligible, reasons } = checkEligibility(steps, scorecardId)
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
