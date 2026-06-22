import { RANKS } from '../constants/session.js'

// Phase 11 — Scorecard & Ranking. Aggregates real session data into the
// protocol's named score categories, a deterministic score-based ranking
// tier, and the 10 named protocol badges. Never invents progress: any
// category/badge whose underlying phase hasn't produced real data yet is
// reported at 0 points / locked with an honest reason, not guessed.

function sc(session) { return session?.smokeCraft || {} }
function steps(session) { return session?.completedSteps || [] }

export const SCORE_CATEGORIES = [
  { id: 'profileCompleted',         label: 'Profile Captured',        maxPoints: 50,  phase: 1  },
  { id: 'cigarFormatSelected',      label: 'Cigar Format Selected',   maxPoints: 50,  phase: 2  },
  { id: 'seedSoilCompleted',        label: 'Seed & Soil Pairing',     maxPoints: 100, phase: 3  },
  { id: 'mentorSelectionCompleted', label: 'Mentor Selection',        maxPoints: 100, phase: 4  },
  { id: 'goldBoxRulesAccepted',     label: 'Gold Box Rules Accepted', maxPoints: 50,  phase: 5  },
  { id: 'cutLightStepsCompleted',   label: 'Cut, Toast & Light',      maxPoints: 100, phase: 7  },
  { id: 'firstThirdNotes',          label: 'First Third Notes',       maxPoints: 100, phase: 8  },
  { id: 'secondThirdNotes',         label: 'Second Third Notes',      maxPoints: 100, phase: 9  },
  { id: 'finalThirdNotes',          label: 'Final Third Notes',       maxPoints: 100, phase: 10 },
  { id: 'pairingReview',            label: 'Pairing Review',          maxPoints: 75,  phase: 6  },
  { id: 'finalReview',              label: 'Final Review',            maxPoints: 100, phase: 11 },
  { id: 'passportStampEarned',      label: 'Passport Stamp Earned',   maxPoints: 75,  phase: 12 },
  { id: 'networkingAction',         label: 'Networking Action',       maxPoints: 100, phase: 13 },
]

export const MAX_TOTAL_SCORE = SCORE_CATEGORIES.reduce((s, c) => s + c.maxPoints, 0)

function categoryProfileCompleted(session) {
  const complete = steps(session).includes('enroll')
  return { points: complete ? 50 : 0, status: complete ? 'complete' : 'pending', reason: complete ? 'Profile enrollment completed.' : 'Profile enrollment not completed yet.' }
}

function categoryCigarFormatSelected(session) {
  const format = sc(session).selectedFormat
  const complete = Boolean(format) && steps(session).includes('format')
  return { points: complete ? 50 : 0, status: complete ? 'complete' : 'pending', reason: complete ? `Selected ${format.name || format.id}.` : 'No cigar format selected yet.' }
}

function categorySeedSoilCompleted(session) {
  const complete = Boolean(session?.smokecraftSeedSoil?.seedRegionId) && steps(session).includes('seed-soil')
  return { points: complete ? 100 : 0, status: complete ? 'complete' : 'pending', reason: complete ? 'Seed & Soil pairing completed.' : 'Seed & Soil pairing not completed yet.' }
}

function categoryMentorSelectionCompleted(session) {
  const count = Array.isArray(session?.mentors) ? session.mentors.length : 0
  if (count >= 2) return { points: 100, status: 'complete', reason: 'Both mentors selected.' }
  if (count === 1) return { points: 50, status: 'partial', reason: 'Only 1 of 2 mentors selected.' }
  return { points: 0, status: 'pending', reason: 'No mentors selected yet.' }
}

function categoryGoldBoxRulesAccepted(session) {
  const complete = Boolean(sc(session).goldenBox?.accepted)
  return { points: complete ? 50 : 0, status: complete ? 'complete' : 'pending', reason: complete ? 'Gold Box rules accepted.' : 'Gold Box rules not accepted yet.' }
}

function categoryCutLightStepsCompleted(session) {
  const ctl = sc(session).cutToastLight
  if (!ctl) return { points: 0, status: 'pending', reason: 'Cut, Toast & Light not recorded yet.' }
  const points = Math.round(100 * (ctl.completedCount || 0) / (ctl.totalSteps || 3))
  return { points, status: ctl.allStepsCompleted ? 'complete' : 'partial', reason: `${ctl.completedCount || 0} of ${ctl.totalSteps || 3} prep steps completed.` }
}

function thirdNotesScore(third, ratingField, hasRatingField) {
  if (!third) return { points: 0, status: 'pending', reason: 'Not recorded yet.' }
  const notesPoints = (third.notesCount > 0) ? 50 : 0
  const ratingPoints = third[hasRatingField] ? 50 : 0
  const points = notesPoints + ratingPoints
  const status = third.status || (points === 100 ? 'complete' : points > 0 ? 'partial' : 'pending')
  return { points, status, reason: `${third.notesCount || 0} flavor note(s), ${third[hasRatingField] ? 'rated' : 'not rated'}.` }
}

function categoryFirstThirdNotes(session) {
  return thirdNotesScore(sc(session).firstThird, 'drawRating', 'hasDrawRating')
}

function categorySecondThirdNotes(session) {
  return thirdNotesScore(sc(session).secondThird, 'rating', 'hasRating')
}

function categoryFinalThirdNotes(session) {
  return thirdNotesScore(sc(session).finalThird, 'overallRating', 'hasOverallRating')
}

// Phase 6 has no distinct "pairing review" capture (per protocol audit) — the
// closest honest real signal is the pairing grade computed during Phase 3
// Seed & Soil. This category is scored from that, not fabricated separately.
function categoryPairingReview(session) {
  const grade = sc(session).pairingGrade
  if (!grade || grade === '—') return { points: 0, status: 'pending', reason: 'Pairing not yet scored (complete Seed & Soil).' }
  if (grade === 'Exceptional' || grade === 'Strong') return { points: 75, status: 'complete', reason: `Pairing grade: ${grade}.` }
  if (grade === 'Good') return { points: 40, status: 'partial', reason: `Pairing grade: ${grade}.` }
  if (grade === 'Fair') return { points: 20, status: 'partial', reason: `Pairing grade: ${grade}.` }
  return { points: 0, status: 'partial', reason: `Pairing grade: ${grade}.` }
}

function categoryFinalReview(session) {
  const card = sc(session).scorecard
  if (!card || !card.maxTotal) return { points: 0, status: 'pending', reason: 'Scorecard ratings not submitted yet.' }
  const points = Math.round(100 * (card.total || 0) / card.maxTotal)
  return { points, status: card.total > 0 ? 'complete' : 'pending', reason: `Scorecard rated ${card.total}/${card.maxTotal}.` }
}

function categoryPassportStampEarned(session) {
  const stamps = session?.smokecraftStamps || []
  const has = stamps.some(s => s.id === 'passport-stamp')
  return { points: has ? 75 : 0, status: has ? 'complete' : 'pending', reason: has ? 'Passport stamp earned.' : 'Passport stamp not earned yet.' }
}

function categoryNetworkingAction(session) {
  const connections = sc(session).passportConnections || []
  return { points: connections.length > 0 ? 100 : 0, status: connections.length > 0 ? 'complete' : 'pending', reason: connections.length > 0 ? `${connections.length} networking action(s) recorded.` : 'No 360 Passport Connections action recorded yet.' }
}

const EVALUATORS = {
  profileCompleted:         categoryProfileCompleted,
  cigarFormatSelected:      categoryCigarFormatSelected,
  seedSoilCompleted:        categorySeedSoilCompleted,
  mentorSelectionCompleted: categoryMentorSelectionCompleted,
  goldBoxRulesAccepted:     categoryGoldBoxRulesAccepted,
  cutLightStepsCompleted:   categoryCutLightStepsCompleted,
  firstThirdNotes:          categoryFirstThirdNotes,
  secondThirdNotes:         categorySecondThirdNotes,
  finalThirdNotes:          categoryFinalThirdNotes,
  pairingReview:            categoryPairingReview,
  finalReview:              categoryFinalReview,
  passportStampEarned:      categoryPassportStampEarned,
  networkingAction:         categoryNetworkingAction,
}

export function computeScoreBreakdown(session) {
  const categories = SCORE_CATEGORIES.map(def => {
    const result = EVALUATORS[def.id](session)
    return { ...def, ...result }
  })
  const total = categories.reduce((s, c) => s + c.points, 0)
  return {
    categories,
    total,
    maxTotal: MAX_TOTAL_SCORE,
    rankingLevel: getProtocolRankingLevel(total, MAX_TOTAL_SCORE).name,
    calculatedAt: Date.now(),
  }
}

// Deterministic, score-percentage-based ranking using the same 4 named
// tiers already used app-wide for XP (src/constants/session.js RANKS), so
// the tier vocabulary stays single-sourced even though this is driven by
// the Phase 11 protocol score rather than lifetime XP.
export function getProtocolRankingLevel(total, maxTotal = MAX_TOTAL_SCORE) {
  const pct = maxTotal > 0 ? (total / maxTotal) * 100 : 0
  if (pct >= 80) return RANKS[3] // Aficionado
  if (pct >= 50) return RANKS[2] // Connoisseur
  if (pct >= 20) return RANKS[1] // Enthusiast
  return RANKS[0] // Novice
}

// --- Phase 11 badge system -------------------------------------------------
// 10 named protocol badges. Each is computed from real session fields only;
// no badge is ever auto-granted without its underlying data existing.

function badgeFirstSmoke(session) {
  const ctl = sc(session).cutToastLight
  const unlocked = Boolean(ctl?.allStepsCompleted)
  return {
    unlocked,
    reason: unlocked ? 'Completed the Cut, Toast & Light ritual.' : 'Complete all 3 Cut/Toast/Light steps to unlock.',
    pointsImpact: 100,
  }
}

function badgePerfectDraw(session) {
  const firstThird = sc(session).firstThird
  const unlocked = firstThird?.drawRating === 5
  return {
    unlocked,
    reason: unlocked ? 'Rated the draw a perfect 5/5 on First Third.' : 'Rate the First Third draw 5/5 to unlock.',
    pointsImpact: 50,
  }
}

function badgeSeedSoilExplorer(session) {
  const unlocked = Boolean(session?.smokecraftSeedSoil?.seedRegionId)
  return {
    unlocked,
    reason: unlocked ? 'Completed a Seed & Soil pairing.' : 'Complete Seed & Soil pairing to unlock.',
    pointsImpact: 100,
  }
}

function badgeMaduroMinded(session) {
  const unlocked = session?.smokecraftSeedSoil?.seedRegionId === 'sanandres'
  return {
    unlocked,
    reason: unlocked ? 'Selected the San Andrés (Negro Maduro) wrapper region.' : 'Select the San Andrés (Negro Maduro) region in Seed & Soil to unlock.',
    pointsImpact: 0,
  }
}

function badgeDominicanRoute(session) {
  const mentors = Array.isArray(session?.mentors) ? session.mentors : []
  const unlocked = mentors.some(m => m.country === 'Dominican Republic') || session?.selectedMentorCountry === 'Dominican Republic'
  return {
    unlocked,
    reason: unlocked ? 'Selected a Dominican Republic mentor.' : 'Select a Dominican Republic mentor to unlock.',
    pointsImpact: 0,
  }
}

function badgePairingPro(session) {
  const grade = sc(session).pairingGrade
  const unlocked = grade === 'Exceptional' || grade === 'Strong'
  return {
    unlocked,
    reason: unlocked ? `Achieved a ${grade} pairing grade.` : 'Reach a Strong or Exceptional pairing grade to unlock.',
    pointsImpact: 75,
  }
}

function badgeSlowBurnMaster(session) {
  const format = sc(session).selectedFormat
  const unlocked = format?.category === 'vip-slow-burn'
  return {
    unlocked,
    reason: unlocked ? `Selected a VIP Slow Burn format (${format.name || format.id}).` : 'Select a VIP Slow Burn cigar format to unlock.',
    pointsImpact: 0,
  }
}

function badgeLoungeCertified(session) {
  const count = steps(session).length
  const unlocked = count >= 14
  return {
    unlocked,
    reason: unlocked ? `Completed ${count} of the core protocol steps.` : `Completed ${count} of 14+ required steps so far.`,
    pointsImpact: 0,
  }
}

function badgeMentorApproved(session) {
  const mentors = Array.isArray(session?.mentors) ? session.mentors : []
  const unlocked = mentors.length === 2
  return {
    unlocked,
    reason: unlocked ? 'Selected both required mentors.' : 'Select exactly 2 mentors to unlock.',
    pointsImpact: 100,
  }
}

function badgeGoldBoxFinisher(session) {
  const unlocked = Boolean(sc(session).goldenBox?.accepted)
  return {
    unlocked,
    reason: unlocked ? 'Accepted the Gold Box rules.' : 'Accept the Gold Box rules to unlock.',
    pointsImpact: 50,
  }
}

const BADGE_DEFS = [
  { badgeId: 'first-smoke',          name: 'First Smoke',           description: 'Completed the Cut, Toast & Light ritual for this cigar.',      phase: 7,  evaluate: badgeFirstSmoke },
  { badgeId: 'perfect-draw',         name: 'Perfect Draw',          description: 'Rated the draw a perfect 5/5 during First Third tasting.',      phase: 8,  evaluate: badgePerfectDraw },
  { badgeId: 'seed-soil-explorer',   name: 'Seed & Soil Explorer',  description: 'Completed a full Seed & Soil pairing.',                          phase: 3,  evaluate: badgeSeedSoilExplorer },
  { badgeId: 'maduro-minded',        name: 'Maduro Minded',         description: 'Chose a Maduro-wrapper seed region.',                            phase: 3,  evaluate: badgeMaduroMinded },
  { badgeId: 'dominican-route',      name: 'Dominican Route',       description: 'Selected a mentor from the Dominican Republic.',                 phase: 4,  evaluate: badgeDominicanRoute },
  { badgeId: 'pairing-pro',          name: 'Pairing Pro',           description: 'Achieved a Strong or Exceptional pairing grade.',                phase: 6,  evaluate: badgePairingPro },
  { badgeId: 'slow-burn-master',     name: 'Slow Burn Master',      description: 'Selected a VIP Slow Burn cigar format.',                         phase: 2,  evaluate: badgeSlowBurnMaster },
  { badgeId: 'lounge-certified',     name: 'Lounge Certified',      description: 'Completed the core SmokeCraft 360 protocol steps.',              phase: 11, evaluate: badgeLoungeCertified },
  { badgeId: 'mentor-approved',      name: 'Mentor Approved',       description: 'Selected both required mentors.',                                 phase: 4,  evaluate: badgeMentorApproved },
  { badgeId: 'gold-box-finisher',    name: 'Gold Box Finisher',     description: 'Accepted the Gold Box rules.',                                    phase: 5,  evaluate: badgeGoldBoxFinisher },
]

export function computeProtocolBadges(session) {
  return BADGE_DEFS.map(def => {
    const result = def.evaluate(session)
    const existing = (session?.badges || []).find(b => b.id === `protocol-${def.badgeId}`)
    return {
      badgeId:     def.badgeId,
      name:        def.name,
      description: def.description,
      phase:       def.phase,
      unlocked:    result.unlocked,
      reason:      result.reason,
      pointsImpact: result.pointsImpact,
      unlockedAt:  result.unlocked ? (existing?.earnedAt || Date.now()) : null,
    }
  })
}
