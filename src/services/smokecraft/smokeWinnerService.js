// Winner Category engine — evaluates real session data against 13 named
// winner categories. Never fabricates a win: any category whose required
// inputs don't exist yet on the session is reported pending/locked with an
// honest reason, not a guessed score.

export const STATUS = {
  EARNED: 'earned',
  ELIGIBLE: 'eligible',
  CLOSE: 'close',
  PARTIAL: 'partial',
  PENDING: 'pending',
  LOCKED: 'locked',
  NOT_QUALIFIED: 'not_qualified',
}

const STATUS_LABEL = {
  earned: 'Earned',
  eligible: 'Eligible',
  close: 'Close',
  partial: 'Partial Progress',
  pending: 'Pending Phase',
  locked: 'Locked',
  not_qualified: 'Not Yet Qualified',
}

function sc(session) { return session?.smokeCraft || {} }

function protocolScore(session) {
  return (session?.completedSteps?.length || 0) * 50
}

function goldenBoxPercent(session) {
  const flow = sc(session).goldenBox
  if (!flow || !flow.accepted) return 0
  // Golden Box completion is tracked as participation today; no per-challenge
  // progress meter exists yet, so we can only report accepted vs not.
  return flow.accepted ? 100 : 0
}

// --- per-category evaluators -------------------------------------------
// Each evaluator receives the session and returns the fields the category
// needs filled in: currentProgress, status, reason, nextAction.

function evalGoldenBoxChampion(session) {
  const total = protocolScore(session) + (sc(session).pairingScore || 0) + (sc(session).uniquenessScore || 0)
  const gbPercent = goldenBoxPercent(session)
  const xp = session?.xp || 0
  if (!sc(session).goldenBox?.accepted) {
    return { currentProgress: 0, status: STATUS.LOCKED, reason: 'Golden Box not yet accepted', nextAction: 'Accept the Golden Box challenge to begin qualifying' }
  }
  if (total >= 250 && xp >= 500) {
    return { currentProgress: total, status: STATUS.ELIGIBLE, reason: `Total score ${total}, Golden Box ${gbPercent}% complete`, nextAction: 'Finish the session to confirm this title' }
  }
  return { currentProgress: total, status: STATUS.PARTIAL, reason: `Total score ${total} so far, Golden Box ${gbPercent}% complete`, nextAction: 'Keep completing steps to raise total score and XP' }
}

function evalBestPairingArchitect(session) {
  const score = sc(session).pairingScore
  if (score == null) {
    return { currentProgress: 0, status: STATUS.PENDING, reason: 'Pairing score not yet computed', nextAction: 'Complete Seed & Soil to generate a pairing score' }
  }
  const grade = sc(session).pairingGrade
  if (score >= 150 && (grade === 'Exceptional' || grade === 'Strong')) {
    return { currentProgress: score, status: STATUS.ELIGIBLE, reason: `Pairing score ${score} — Grade: ${grade}`, nextAction: 'Maintain this pairing through the rest of the session' }
  }
  if (score >= 75) {
    return { currentProgress: score, status: STATUS.CLOSE, reason: `Pairing score ${score} — Grade: ${grade}`, nextAction: 'Raise pairing score above 150 for Exceptional standing' }
  }
  return { currentProgress: score, status: STATUS.PARTIAL, reason: `Pairing score ${score} — Grade: ${grade}`, nextAction: 'Revisit Seed & Soil pairing choices to improve harmony' }
}

function evalMostUniqueBlend(session) {
  const score = sc(session).uniquenessScore
  if (score == null) {
    return { currentProgress: 0, status: STATUS.PENDING, reason: 'Uniqueness score not yet computed', nextAction: 'Complete Seed & Soil to generate a Unique Blend Signature' }
  }
  const category = sc(session).uniquenessCategory
  if (category === 'Legendary Blend' || category === 'Rare Blend') {
    return { currentProgress: score, status: STATUS.ELIGIBLE, reason: `Uniqueness score ${score} — ${category}`, nextAction: 'This blend is rare — finish the session to lock it in' }
  }
  if (category === 'Distinct Blend') {
    return { currentProgress: score, status: STATUS.CLOSE, reason: `Uniqueness score ${score} — ${category}`, nextAction: 'Fill in more blend fields to reach Rare Blend' }
  }
  return { currentProgress: score, status: STATUS.PARTIAL, reason: `Uniqueness score ${score} — ${category || 'Incomplete'}`, nextAction: 'Complete more cigar and pairing fields to raise uniqueness' }
}

function evalMasterWrapperAward(session) {
  const wrapperScore = sc(session).wrapperScore
  if (wrapperScore == null) {
    return { currentProgress: 0, status: STATUS.PENDING, reason: 'Wrapper scoring not built yet', nextAction: 'Wrapper Score service is a future phase' }
  }
  return { currentProgress: wrapperScore, status: wrapperScore >= 75 ? STATUS.ELIGIBLE : STATUS.PARTIAL, reason: `Wrapper score ${wrapperScore}`, nextAction: 'Refine wrapper/body/strength fit' }
}

function evalRingGaugeStrategist(session) {
  const format = sc(session).selectedFormat
  if (!format) {
    return { currentProgress: 0, status: STATUS.PENDING, reason: 'No format selected yet', nextAction: 'Select a cigar format to qualify' }
  }
  const ringGaugeScore = sc(session).ringGaugeScore
  if (ringGaugeScore == null) {
    return { currentProgress: 0, status: STATUS.PENDING, reason: 'Ring Gauge / Vitola scoring not built yet', nextAction: 'Ring Gauge Score service is a future phase' }
  }
  return { currentProgress: ringGaugeScore, status: ringGaugeScore >= 75 ? STATUS.ELIGIBLE : STATUS.PARTIAL, reason: `Ring gauge fit score ${ringGaugeScore}`, nextAction: 'Match ring gauge and burn time to the occasion' }
}

function evalMentorsChoice(session) {
  if (!session?.selectedMentor) {
    return { currentProgress: 0, status: STATUS.LOCKED, reason: 'No mentor selected yet', nextAction: 'Select a Master Mentor to qualify' }
  }
  const mentorScore = sc(session).mentorAlignmentScore
  if (mentorScore == null) {
    return { currentProgress: 0, status: STATUS.PENDING, reason: 'Mentor alignment scoring not built yet', nextAction: 'Mentor alignment scoring is a future phase' }
  }
  return { currentProgress: mentorScore, status: mentorScore >= 75 ? STATUS.ELIGIBLE : STATUS.PARTIAL, reason: `Mentor alignment score ${mentorScore}`, nextAction: 'Follow your mentor’s guidance more closely' }
}

function evalPassportConnector(session) {
  const stamps = session?.passport?.earnedStamps || []
  const connections = sc(session).passportConnections || []
  if (stamps.length === 0) {
    return { currentProgress: 0, status: STATUS.PENDING, reason: 'Passport scoring pending — no stamp earned yet', nextAction: 'Complete the session to earn your Passport stamp' }
  }
  if (connections.length === 0) {
    return { currentProgress: stamps.length, status: STATUS.CLOSE, reason: `${stamps.length} stamp(s) earned, no 360 Passport Connections yet`, nextAction: 'Make a 360 Passport Connection to qualify' }
  }
  return { currentProgress: stamps.length + connections.length, status: STATUS.ELIGIBLE, reason: `${stamps.length} stamp(s), ${connections.length} connection(s)`, nextAction: 'Keep building Passport connections' }
}

function evalPerfectDrawAward(session) {
  const constructionScore = sc(session).constructionScore
  if (constructionScore == null) {
    return { currentProgress: 0, status: STATUS.PENDING, reason: 'Construction scoring not built yet', nextAction: 'Construction Score service is a future phase' }
  }
  return { currentProgress: constructionScore, status: constructionScore >= 80 ? STATUS.ELIGIBLE : STATUS.PARTIAL, reason: `Construction score ${constructionScore}`, nextAction: 'Improve draw/burn/ash consistency notes' }
}

function evalVenueFavorite(session) {
  const choice = sc(session).requestPurchaseChoice
  const purchaseProofScore = sc(session).purchaseProofScore
  if (purchaseProofScore == null) {
    return { currentProgress: choice ? 1 : 0, status: STATUS.PENDING, reason: 'Purchase proof pending', nextAction: choice ? 'Purchase proof scoring is a future phase' : 'Request or purchase a cigar to begin qualifying' }
  }
  return { currentProgress: purchaseProofScore, status: purchaseProofScore >= 75 ? STATUS.ELIGIBLE : STATUS.PARTIAL, reason: `Purchase proof score ${purchaseProofScore}`, nextAction: 'Verify purchase with POS3' }
}

function evalDiscoveryChampion(session) {
  const category = sc(session).uniquenessCategory
  const pairingGrade = sc(session).pairingGrade
  if (!category || !pairingGrade) {
    return { currentProgress: 0, status: STATUS.PENDING, reason: 'Pairing score partial — needs both uniqueness and pairing data', nextAction: 'Complete Seed & Soil pairing and blend signature' }
  }
  const rare = category === 'Rare Blend' || category === 'Legendary Blend'
  const strong = pairingGrade === 'Strong' || pairingGrade === 'Exceptional'
  if (rare && strong) {
    return { currentProgress: 100, status: STATUS.ELIGIBLE, reason: `${category} + ${pairingGrade} pairing`, nextAction: 'Finish the session to confirm this title' }
  }
  return { currentProgress: rare || strong ? 50 : 0, status: STATUS.PARTIAL, reason: `${category} blend, ${pairingGrade} pairing`, nextAction: 'Combine a rarer blend with a stronger pairing grade' }
}

function evalLoungeLegend(session) {
  const total = protocolScore(session) + (sc(session).pairingScore || 0) + (sc(session).uniquenessScore || 0)
  const stepsTotal = session?.completedSteps?.length || 0
  if (stepsTotal < 10) {
    return { currentProgress: stepsTotal, status: STATUS.PARTIAL, reason: `${stepsTotal} of 17 steps completed`, nextAction: 'Complete more of the SmokeCraft 360 protocol' }
  }
  return { currentProgress: total, status: total >= 300 ? STATUS.ELIGIBLE : STATUS.CLOSE, reason: `Total score ${total} across ${stepsTotal} steps`, nextAction: 'Finish remaining steps for full-session credit' }
}

function evalComebackSmoker(session) {
  const completedSessions = sc(session).completedSessions || []
  if (completedSessions.length === 0) {
    return { currentProgress: 0, status: STATUS.LOCKED, reason: 'Needs prior session', nextAction: 'Complete a full SmokeCraft session first' }
  }
  const prevXp = completedSessions[completedSessions.length - 1]?.xpEarned || 0
  const currentXp = session?.xp || 0
  if (currentXp > prevXp) {
    return { currentProgress: currentXp - prevXp, status: STATUS.ELIGIBLE, reason: `+${currentXp - prevXp} XP over previous session`, nextAction: 'Finish this session to lock in the improvement' }
  }
  return { currentProgress: currentXp - prevXp, status: STATUS.NOT_QUALIFIED, reason: 'No improvement over previous session yet', nextAction: 'Earn more XP than your previous session' }
}

function evalGoldenBoxSovereign(session) {
  const stepsTotal = session?.completedSteps?.length || 0
  const total = protocolScore(session) + (sc(session).pairingScore || 0) + (sc(session).uniquenessScore || 0)
  const flow = sc(session).goldenBox
  if (!flow?.accepted) {
    return { currentProgress: 0, status: STATUS.LOCKED, reason: 'Golden Box not yet accepted', nextAction: 'Accept the Golden Box challenge' }
  }
  if (stepsTotal < 17) {
    return { currentProgress: stepsTotal, status: STATUS.PARTIAL, reason: `${stepsTotal} of 17 steps completed, score ${total}`, nextAction: 'Complete the full SmokeCraft 360 path' }
  }
  return { currentProgress: total, status: total >= 400 ? STATUS.EARNED : STATUS.CLOSE, reason: `Full path complete, score ${total}`, nextAction: 'Raise total score for Sovereign-tier standing' }
}

const EVALUATORS = {
  'golden-box-champion':      { title: 'Golden Box Champion',      description: 'Highest total score, strong Golden Box completion, rank and full path progress.', requiredScores: ['protocolScore', 'pairingScore', 'uniquenessScore', 'xp', 'goldenBox.accepted'], evaluate: evalGoldenBoxChampion },
  'best-pairing-architect':   { title: 'Best Pairing Architect',   description: 'Highest pairing quality score with strong flavor harmony and contrast.', requiredScores: ['pairingScore', 'pairingGrade'], evaluate: evalBestPairingArchitect },
  'most-unique-blend':        { title: 'Most Unique Blend',        description: 'Highest uniqueness score from a rare but logical cigar and pairing combo.', requiredScores: ['uniquenessScore', 'uniquenessCategory'], evaluate: evalMostUniqueBlend },
  'master-wrapper-award':     { title: 'Master Wrapper Award',     description: 'Highest wrapper understanding and correct wrapper/body/strength fit.', requiredScores: ['wrapperScore'], evaluate: evalMasterWrapperAward },
  'ring-gauge-strategist':    { title: 'Ring Gauge Strategist',    description: 'Correct ring gauge, burn-time, and occasion fit.', requiredScores: ['selectedFormat', 'ringGaugeScore'], evaluate: evalRingGaugeStrategist },
  'mentors-choice':           { title: "Mentor's Choice",          description: 'Highest mentor alignment, following selected mentor guidance.', requiredScores: ['selectedMentor', 'mentorAlignmentScore'], evaluate: evalMentorsChoice },
  'passport-connector':       { title: 'Passport Connector',       description: 'Passport stamp earned plus a networking or 360 Passport Connection made.', requiredScores: ['passport.earnedStamps', 'passportConnections'], evaluate: evalPassportConnector },
  'perfect-draw-award':       { title: 'Perfect Draw Award',       description: 'Best cut, draw, burn, and construction score.', requiredScores: ['constructionScore'], evaluate: evalPerfectDrawAward },
  'venue-favorite':           { title: 'Venue Favorite',           description: 'Strong rating with verified or pending POS3 purchase behavior.', requiredScores: ['requestPurchaseChoice', 'purchaseProofScore'], evaluate: evalVenueFavorite },
  'discovery-champion':       { title: 'Discovery Champion',       description: 'Best rare-but-successful cigar and pairing combo.', requiredScores: ['uniquenessCategory', 'pairingGrade'], evaluate: evalDiscoveryChampion },
  'lounge-legend':            { title: 'Lounge Legend',            description: 'Best full-session performance at the venue or event.', requiredScores: ['completedSteps', 'protocolScore', 'pairingScore', 'uniquenessScore'], evaluate: evalLoungeLegend },
  'comeback-smoker':          { title: 'Comeback Smoker',          description: 'Improvement in XP over a previous completed session.', requiredScores: ['completedSessions', 'xp'], evaluate: evalComebackSmoker },
  'golden-box-sovereign':     { title: 'Golden Box Sovereign',     description: 'Full path completed with top-tier score.', requiredScores: ['goldenBox.accepted', 'completedSteps', 'protocolScore'], evaluate: evalGoldenBoxSovereign },
}

export function getWinnerCategories() {
  return Object.keys(EVALUATORS).map(id => ({
    id,
    title: EVALUATORS[id].title,
    description: EVALUATORS[id].description,
    requiredScores: EVALUATORS[id].requiredScores,
  }))
}

export function getWinnerCategoryStatus(session, categoryId) {
  const def = EVALUATORS[categoryId]
  if (!def) return null
  const result = def.evaluate(session)
  const status = result.status
  return {
    id: categoryId,
    title: def.title,
    description: def.description,
    requiredScores: def.requiredScores,
    currentProgress: result.currentProgress,
    status,
    statusLabel: STATUS_LABEL[status],
    reason: result.reason,
    nextAction: result.nextAction,
    eligible: status === STATUS.ELIGIBLE || status === STATUS.EARNED,
    locked: status === STATUS.LOCKED,
    pending: status === STATUS.PENDING,
    earned: status === STATUS.EARNED,
  }
}

export function calculateWinnerEligibility(session) {
  return Object.keys(EVALUATORS).map(id => getWinnerCategoryStatus(session, id))
}

export function getTopEligibleCategory(session) {
  const all = calculateWinnerEligibility(session)
  const earned = all.find(c => c.status === STATUS.EARNED)
  if (earned) return earned
  const eligible = all
    .filter(c => c.status === STATUS.ELIGIBLE)
    .sort((a, b) => (b.currentProgress || 0) - (a.currentProgress || 0))
  if (eligible.length) return eligible[0]
  const close = all
    .filter(c => c.status === STATUS.CLOSE)
    .sort((a, b) => (b.currentProgress || 0) - (a.currentProgress || 0))
  return close[0] || null
}

export function assignWinnerCategory(session) {
  const all = calculateWinnerEligibility(session)
  return all.find(c => c.status === STATUS.EARNED) || null
}

export function getWinnerProgress(session) {
  const all = calculateWinnerEligibility(session)
  return {
    earnedCount: all.filter(c => c.earned).length,
    eligibleCount: all.filter(c => c.eligible && !c.earned).length,
    pendingCount: all.filter(c => c.pending).length,
    lockedCount: all.filter(c => c.locked).length,
    totalCategories: all.length,
  }
}

export function getWinnerDataRequirements(session) {
  return calculateWinnerEligibility(session)
    .filter(c => c.pending)
    .map(c => ({ id: c.id, title: c.title, reason: c.reason }))
}

export function getLockedWinnerCategories(session) {
  return calculateWinnerEligibility(session).filter(c => c.locked)
}

export function getPendingWinnerCategories(session) {
  return calculateWinnerEligibility(session).filter(c => c.pending)
}
