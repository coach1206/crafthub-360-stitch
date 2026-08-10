/**
 * SmokeCraft Scoring + Loyalty Points Engine — helper functions.
 *
 * Four scoring categories — never mixed:
 *   journeyXP      → progression (managed by awardSessionRewards, NOT here)
 *   skillScore     → knowledge and tasting accuracy
 *   challengeScore → competitions, leaderboards
 *   loyaltyPoints  → purchases, venue engagement, Passport stamps
 *
 * All functions are pure: (data) → data.
 * No React dependency; testable with plain Node.
 */

import {
  LOYALTY_POINT_RULES,
  PURCHASE_POINT_RULES,
  PASSPORT_POINT_RULES,
  VIP_THRESHOLD_RULES,
  LEADERBOARD_WEIGHTS,
  SCORING_CONFIG,
  LOYALTY_ACTIONS,
  PAIRING_PURCHASE_ACTIONS,
} from '../constants/smokecraftLoyalty.js'
import { getSmokeCraftRank } from '../constants/smokecraftRewards.js'

// ── Answer scoring ─────────────────────────────────────────────────────────────

/**
 * Score a single knowledge or tasting answer.
 * Returns { skillDelta, challengeDelta }.
 * journeyXP is NEVER modified here.
 *
 * Wrong answer at high confidence → small challengeScore penalty only.
 * Wrong answer at medium/low → no penalty at all.
 */
export function calculateAnswerScore({ isCorrect, confidence = 'medium', difficulty = 'medium' }) {
  const cMult = SCORING_CONFIG.confidenceMultipliers[confidence] ?? 1.0
  const dMult = SCORING_CONFIG.difficultyMultipliers[difficulty] ?? 1.0

  if (isCorrect) {
    const pts = Math.round(SCORING_CONFIG.baseCorrectScore * cMult * dMult)
    return { skillDelta: pts, challengeDelta: pts }
  }

  const challengeDelta = confidence === 'high' ? SCORING_CONFIG.wrongAnswerChallengePenalty : 0
  return { skillDelta: 0, challengeDelta }
}

// ── Pairing scoring ────────────────────────────────────────────────────────────

/**
 * Score a pairing selection against the correct answer.
 * Returns { skillDelta, challengeDelta }.
 *
 * isExactMatch: true when the guest selected the exact recommended item.
 * Same-family partial credit when selected.family === correct.family.
 */
export function calculatePairingScore({ selected, correct, isExactMatch = false }) {
  if (!selected || !correct) return { skillDelta: 0, challengeDelta: 0 }

  if (isExactMatch) {
    const pts = SCORING_CONFIG.exactPairingScore + SCORING_CONFIG.perfectPairingBonus
    return { skillDelta: pts, challengeDelta: pts }
  }

  const sameFamily = selected.family && correct.family && selected.family === correct.family
  const pts = sameFamily ? SCORING_CONFIG.partialPairingScore : 0
  return { skillDelta: pts, challengeDelta: pts }
}

// ── Flavor note scoring ────────────────────────────────────────────────────────

/**
 * Score flavor note selections against the expert list.
 * Returns { skillDelta, challengeDelta, matched, total, accuracyPercent }.
 */
export function calculateFlavorMatchScore({ selectedNotes = [], correctNotes = [] }) {
  if (!correctNotes.length) {
    return { skillDelta: 0, challengeDelta: 0, matched: 0, total: 0, accuracyPercent: 0 }
  }

  let matched = 0
  let score = 0
  for (const note of selectedNotes) {
    if (correctNotes.includes(note)) {
      matched++
      score += SCORING_CONFIG.exactFlavorMatchScore
    }
  }

  const perfect = matched === correctNotes.length && selectedNotes.length === correctNotes.length
  if (perfect) score += SCORING_CONFIG.perfectFlavorBonus

  const accuracyPercent = Math.round((matched / correctNotes.length) * 100)
  return { skillDelta: score, challengeDelta: score, matched, total: correctNotes.length, accuracyPercent }
}

// ── Challenge round scoring ────────────────────────────────────────────────────

/**
 * Score a complete challenge round (multiple answers + optional time bonus).
 * Returns { skillDelta, challengeDelta, accuracyPercent, perfectRound }.
 */
export function calculateChallengeRoundScore({
  answers = [],
  completionTimeMs = null,
  maxTimeMs = null,
}) {
  let skillDelta = 0
  let challengeDelta = 0
  let correct = 0

  for (const answer of answers) {
    const s = calculateAnswerScore(answer)
    skillDelta += s.skillDelta
    challengeDelta += s.challengeDelta
    if (answer.isCorrect) correct++
  }

  if (completionTimeMs !== null && maxTimeMs && completionTimeMs < maxTimeMs) {
    const timeFraction = 1 - completionTimeMs / maxTimeMs
    challengeDelta += Math.round(SCORING_CONFIG.maxTimeBonusPoints * timeFraction)
  }

  const accuracyPercent = answers.length > 0 ? Math.round((correct / answers.length) * 100) : 0
  const perfectRound = correct === answers.length && answers.length > 0

  return { skillDelta, challengeDelta, accuracyPercent, perfectRound }
}

// ── Loyalty point award ────────────────────────────────────────────────────────

/**
 * Apply a loyalty action to session state.
 * Returns updated session object, or null if blocked (demo mode, unknown action).
 * Never modifies xp, skillScore, or challengeScore.
 */
export function awardLoyaltyPoints(session, actionType, opts = {}) {
  if (opts.isDemoMode) return null

  const base = LOYALTY_POINT_RULES[actionType]
  if (base === undefined) return null

  const multiplier = opts.multiplier ?? 1
  const pointsAwarded = Math.round(base * multiplier)

  const event = _buildEvent({ actionType, pointsAwarded, multiplier, ...opts })

  return {
    ...session,
    loyaltyPoints:         (session.loyaltyPoints ?? 0) + pointsAwarded,
    lifetimeLoyaltyPoints: (session.lifetimeLoyaltyPoints ?? 0) + pointsAwarded,
    redeemablePoints:      (session.redeemablePoints ?? 0) + pointsAwarded,
    loyaltyLedger:         [...(session.loyaltyLedger ?? []), event],
  }
}

// ── Purchase point award ───────────────────────────────────────────────────────

/**
 * Award loyalty points for a POS purchase.
 * Deduplicates by posTransactionId — same transaction never awards twice.
 * Returns updated session, or null if blocked.
 *
 * Accepts a future POS360 transaction payload:
 * { posTransactionId, venueId, itemId, itemName, itemCategory, subtotal, timestamp }
 */
export function awardPurchasePoints(session, purchaseType, opts = {}) {
  if (opts.isDemoMode) return null
  if (!(purchaseType in PURCHASE_POINT_RULES)) return null

  const usedIds = session.usedTransactionIds ?? []
  if (opts.posTransactionId && usedIds.includes(opts.posTransactionId)) return null

  const multiplier = opts.multiplier ?? 1
  const pointsAwarded = Math.round(PURCHASE_POINT_RULES[purchaseType] * multiplier)

  const event = _buildEvent({
    actionType: purchaseType,
    purchaseType,
    pointsAwarded,
    multiplier,
    category: opts.category ?? 'purchase',
    source: opts.source ?? 'pos360',
    ...opts,
  })

  const isHouseCigar = purchaseType === LOYALTY_ACTIONS.HOUSE_CIGAR_PURCHASE
  const isPairing    = PAIRING_PURCHASE_ACTIONS.has(purchaseType)
  const updatedIds   = opts.posTransactionId ? [...usedIds, opts.posTransactionId] : usedIds

  return {
    ...session,
    loyaltyPoints:         (session.loyaltyPoints ?? 0) + pointsAwarded,
    lifetimeLoyaltyPoints: (session.lifetimeLoyaltyPoints ?? 0) + pointsAwarded,
    redeemablePoints:      (session.redeemablePoints ?? 0) + pointsAwarded,
    purchaseCount:         (session.purchaseCount ?? 0) + 1,
    houseCigarPurchases:   (session.houseCigarPurchases ?? 0) + (isHouseCigar ? 1 : 0),
    pairingPurchases:      (session.pairingPurchases ?? 0) + (isPairing ? 1 : 0),
    loyaltyLedger:         [...(session.loyaltyLedger ?? []), event],
    usedTransactionIds:    updatedIds,
  }
}

// ── Passport stamp loyalty award ───────────────────────────────────────────────

/**
 * Award loyalty points when a Passport session is completed.
 * Enforces prerequisite lock rules from PASSPORT_POINT_RULES.
 * Returns null if locked or blocked (demo mode, prereqs not met).
 */
export function awardPassportStampPoints(session, sessionId, { isDemoMode = false } = {}) {
  if (isDemoMode) return null

  const rule = PASSPORT_POINT_RULES[sessionId]
  if (!rule) return null

  const completed = session.completedSteps ?? []
  for (const req of (rule.requiresCompleted ?? [])) {
    if (!completed.includes(req)) return null
  }

  if (rule.vipThresholdRequired) {
    const signal = calculateVIPCandidateSignal(session)
    if (!signal.isVIPCandidate) return null
  }

  const actionType =
    sessionId === 'passport-stamp' ? LOYALTY_ACTIONS.PASSPORT_STAMP
    : sessionId === 'connections'   ? LOYALTY_ACTIONS.PASSPORT_CONNECTIONS
    : LOYALTY_ACTIONS.VIP_CANDIDATE

  const event = _buildEvent({
    actionType,
    pointsAwarded: rule.loyaltyPoints,
    multiplier: 1,
    sessionId,
    visitNumber: 8,
    category: 'passport',
    source: 'smokecraft-passport',
  })

  return {
    ...session,
    loyaltyPoints:         (session.loyaltyPoints ?? 0) + rule.loyaltyPoints,
    lifetimeLoyaltyPoints: (session.lifetimeLoyaltyPoints ?? 0) + rule.loyaltyPoints,
    redeemablePoints:      (session.redeemablePoints ?? 0) + rule.loyaltyPoints,
    passportStampCount:    (session.passportStampCount ?? 0) + (rule.stampDelta ?? 0),
    loyaltyLedger:         [...(session.loyaltyLedger ?? []), event],
  }
}

// ── VIP candidate signal ───────────────────────────────────────────────────────

/**
 * Evaluate whether the session qualifies as a VIP candidate.
 * Returns { isVIPCandidate, criteriaMet, criteriaMetCount, threshold }.
 */
export function calculateVIPCandidateSignal(session) {
  const { criteria, minCriteriaMet } = VIP_THRESHOLD_RULES
  const met = criteria.filter(c => c.check(session))
  return {
    isVIPCandidate:   met.length >= minCriteriaMet,
    criteriaMet:      met.map(c => c.key),
    criteriaMetCount: met.length,
    threshold:        minCriteriaMet,
  }
}

// ── Leaderboard ranking ────────────────────────────────────────────────────────

/**
 * Challenge leaderboard — ranked by score, then skill, accuracy, perfect
 * rounds, and fastest completion. Purchases do not appear.
 */
export function getChallengeLeaderboard(entries) {
  return [...entries].sort((a, b) => {
    if (b.challengeScore  !== a.challengeScore)  return b.challengeScore  - a.challengeScore
    if (b.skillScore      !== a.skillScore)      return b.skillScore      - a.skillScore
    if (b.accuracyPercent !== a.accuracyPercent) return b.accuracyPercent - a.accuracyPercent
    if (b.perfectRounds   !== a.perfectRounds)   return (b.perfectRounds ?? 0) - (a.perfectRounds ?? 0)
    return (a.completionTimeMs ?? Infinity) - (b.completionTimeMs ?? Infinity)
  })
}

/** Skill leaderboard — ranked by knowledge accuracy, flavor, and pairing. */
export function getSkillLeaderboard(entries) {
  return [...entries].sort((a, b) => {
    if (b.skillScore       !== a.skillScore)       return b.skillScore       - a.skillScore
    if (b.accuracyPercent  !== a.accuracyPercent)  return b.accuracyPercent  - a.accuracyPercent
    if ((b.flavorMatchScore ?? 0) !== (a.flavorMatchScore ?? 0)) return (b.flavorMatchScore ?? 0) - (a.flavorMatchScore ?? 0)
    return (b.pairingMatchScore ?? 0) - (a.pairingMatchScore ?? 0)
  })
}

/** Loyalty leaderboard — ranked by points, stamps, visits, purchases, referrals. */
export function getLoyaltyLeaderboard(entries) {
  return [...entries].sort((a, b) => {
    if (b.loyaltyPoints       !== a.loyaltyPoints)       return b.loyaltyPoints       - a.loyaltyPoints
    if (b.passportStampCount  !== a.passportStampCount)  return b.passportStampCount  - a.passportStampCount
    if ((b.repeatVisits ?? 0) !== (a.repeatVisits ?? 0)) return (b.repeatVisits ?? 0) - (a.repeatVisits ?? 0)
    if ((b.purchaseCount ?? 0) !== (a.purchaseCount ?? 0)) return (b.purchaseCount ?? 0) - (a.purchaseCount ?? 0)
    return (b.referralCount ?? 0) - (a.referralCount ?? 0)
  })
}

/**
 * Overall SmokeCraft score — weighted to prevent spending from dominating skill.
 * challengeScore 40% · skillScore 30% · journeyXP 20% · loyaltyPoints 10%
 *
 * Loyalty contribution is capped at LEADERBOARD_WEIGHTS.overall.loyaltyPointsCap
 * (default 1000 LP). Actual loyalty balance is never modified — only the
 * contribution to this weighted score is clamped so whale spending cannot
 * outrank a skilled player on the overall leaderboard.
 */
export function getOverallSmokeCraftScore(summary) {
  const w = LEADERBOARD_WEIGHTS.overall
  const cappedLP = Math.min(summary.loyaltyPoints ?? 0, w.loyaltyPointsCap ?? Infinity)
  return Math.round(
    (summary.challengeScore ?? 0) * w.challengeScore +
    (summary.skillScore     ?? 0) * w.skillScore +
    (summary.journeyXP      ?? 0) * w.journeyXP +
    cappedLP                       * w.loyaltyPoints
  )
}

// ── User summary ───────────────────────────────────────────────────────────────

/**
 * Build the full SmokeCraft score summary object for a session.
 * Safe to call on any session shape — all fields default to 0 / [].
 */
export function getUserSmokeCraftSummary(session, { currentVisit = null, currentSession = null } = {}) {
  const xp   = session.xp ?? 0
  const rank = getSmokeCraftRank(xp)
  const vip  = calculateVIPCandidateSignal(session)

  return {
    // Journey
    journeyXP:              xp,
    rank:                   rank.name,
    rankIcon:               rank.icon,
    rankColor:              rank.color,
    // Skill & challenge (separate from XP)
    skillScore:             session.skillScore      ?? 0,
    challengeScore:         session.challengeScore  ?? 0,
    // Loyalty
    loyaltyPoints:          session.loyaltyPoints          ?? 0,
    lifetimeLoyaltyPoints:  session.lifetimeLoyaltyPoints  ?? 0,
    redeemablePoints:       session.redeemablePoints       ?? 0,
    // Engagement counts
    passportStampCount:     session.passportStampCount     ?? 0,
    purchaseCount:          session.purchaseCount          ?? 0,
    houseCigarPurchases:    session.houseCigarPurchases    ?? 0,
    pairingPurchases:       session.pairingPurchases       ?? 0,
    eventParticipationCount: session.eventParticipationCount ?? 0,
    referralCount:          session.referralCount          ?? 0,
    // Progression
    badges:                 session.badges         ?? [],
    completedSteps:         session.completedSteps ?? [],
    currentVisit,
    currentSession,
    // VIP
    isVIPCandidate:         vip.isVIPCandidate,
    vipCriteriaMet:         vip.criteriaMet,
    // Overall weighted score
    overallScore: getOverallSmokeCraftScore({
      challengeScore: session.challengeScore ?? 0,
      skillScore:     session.skillScore     ?? 0,
      journeyXP:      xp,
      loyaltyPoints:  session.loyaltyPoints  ?? 0,
    }),
  }
}

// ── Private ───────────────────────────────────────────────────────────────────

function _buildEvent({
  actionType,
  purchaseType = null,
  pointsAwarded,
  multiplier = 1,
  sessionId = null,
  visitNumber = null,
  itemId = null,
  itemName = null,
  category = null,
  source = 'smokecraft',
  posTransactionId = null,
  venueId = null,
  isHouseItem = false,
  isRecommendedPairing = false,
  userId = null,
}) {
  return {
    userId,
    sessionId,
    visitNumber,
    actionType,
    purchaseType,
    itemId,
    itemName,
    category,
    pointsAwarded,
    multiplier,
    source,
    timestamp: Date.now(),
    posTransactionId,
    venueId,
    isHouseItem,
    isRecommendedPairing,
    isDemoMode: false,
  }
}
