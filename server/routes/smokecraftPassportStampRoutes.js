/**
 * SmokeCraft Passport Stamp Routes
 * Mounted at /api/smokecraft/passport-stamp
 *
 * Handles eligibility checks, duplicate-safe stamp claiming,
 * and Passport 360 record creation.
 * All values come from submitted session data — never hardcoded.
 */
import { Router } from 'express'

const router = Router()

// ── In-memory store (resets on server restart) ────────────────────────────────
const stamps   = new Map()   // sessionId → stamp record
const sessions = new Map()   // sessionId → session data (scorecard, etc.)

// ── Required steps for stamp eligibility ──────────────────────────────────────
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
// Query: sessionId, completedSteps (comma-sep), scorecardId
router.get('/eligibility', (req, res) => {
  const { sessionId, completedSteps, scorecardId } = req.query
  if (!sessionId) return res.status(400).json({ ok: false, error: 'sessionId required' })

  const steps = completedSteps ? completedSteps.split(',').map(s => s.trim()).filter(Boolean) : []
  const { eligible, missing, reasons } = checkEligibility(steps, scorecardId)
  const alreadyClaimed = stamps.has(sessionId)

  res.json({
    ok: true,
    sessionId,
    eligible: eligible && !alreadyClaimed,
    alreadyClaimed,
    missing,
    reasons: alreadyClaimed ? ['Stamp already claimed for this session'] : reasons,
    requiredSteps: REQUIRED_STEPS,
  })
})

// ── GET /api/smokecraft/passport-stamp/status/:sessionId ──────────────────────
router.get('/status/:sessionId', (req, res) => {
  const record = stamps.get(req.params.sessionId)
  if (!record) return res.json({ ok: true, claimed: false, stamp: null })
  res.json({ ok: true, claimed: true, stamp: record })
})

// ── POST /api/smokecraft/passport-stamp/claim ─────────────────────────────────
router.post('/claim', (req, res) => {
  const {
    sessionId, guestId,
    completedSteps, scorecardId,
    cigarName, pairingName, venueName, mentorNames,
    finalScore, xpEarned, totalXP, currentLevel,
    stampCount, journeyCount, favoriteFlavors,
    sessionDurationMinutes,
    completedAt,
  } = req.body || {}

  if (!sessionId) return res.status(400).json({ ok: false, error: 'sessionId required' })

  // Duplicate prevention
  if (stamps.has(sessionId)) {
    const existing = stamps.get(sessionId)
    return res.status(409).json({
      ok: false,
      duplicate: true,
      error: 'Stamp already claimed for this session',
      stamp: existing,
    })
  }

  // Eligibility check
  const steps = Array.isArray(completedSteps) ? completedSteps : []
  const { eligible, reasons } = checkEligibility(steps, scorecardId)
  if (!eligible) {
    return res.status(422).json({ ok: false, error: 'Eligibility requirements not met', reasons })
  }

  // Build Passport 360 record
  const stampId = `STAMP-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`
  const record = {
    stampId,
    sessionId,
    guestId:             guestId || 'guest',
    claimedAt:           new Date().toISOString(),
    completedAt:         completedAt || new Date().toISOString(),
    venueName:           venueName || null,
    cigarName:           cigarName || null,
    pairingName:         pairingName || null,
    mentorNames:         Array.isArray(mentorNames) ? mentorNames : [],
    finalScore:          typeof finalScore === 'number' ? finalScore : null,
    xpEarned:            typeof xpEarned === 'number' ? xpEarned : null,
    totalXP:             typeof totalXP === 'number' ? totalXP : null,
    currentLevel:        currentLevel || null,
    stampCount:          typeof stampCount === 'number' ? stampCount : null,
    journeyCount:        typeof journeyCount === 'number' ? journeyCount : null,
    favoriteFlavors:     Array.isArray(favoriteFlavors) ? favoriteFlavors : [],
    sessionDurationMinutes: typeof sessionDurationMinutes === 'number' ? sessionDurationMinutes : null,
    completedSteps:      steps,
    passport360: {
      recordType:    'smokecraft_stamp',
      version:       1,
      source:        'passport-stamp-screen',
      persistenceMode: 'memory_fallback',
    },
  }

  stamps.set(sessionId, record)

  res.json({ ok: true, claimed: true, stamp: record })
})

// ── GET /api/smokecraft/passport-stamp/guest/:guestId ────────────────────────
router.get('/guest/:guestId', (req, res) => {
  const guestStamps = []
  for (const [, record] of stamps) {
    if (record.guestId === req.params.guestId) guestStamps.push(record)
  }
  res.json({ ok: true, stamps: guestStamps, count: guestStamps.length })
})

export default router
