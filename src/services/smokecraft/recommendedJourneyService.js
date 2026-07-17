// Recommended Next Journey — deterministic, explainable recommendation
// engine for S27 (SessionComplete.jsx). Every category score is computed
// only from real, already-canonical session/journey data. There is no AI
// service connected here — this is a rule-based recommendation, and the
// screen must never claim otherwise.

import { KNOWLEDGE_CHECK_SETS } from '../../data/knowledgeCheckQuestions.js'
import { PASSPORT_EVENTS } from '../../data/passportEvents.js'
import { SESSION_REWARDS } from '../../constants/smokecraftRewards.js'
import { calculateWinnerEligibility } from './smokeWinnerService.js'

export const CATEGORIES = {
  'humidor-expert':    { id: 'humidor-expert',    title: 'Humidor Expert',    route: '/smokecraft/terroir',      relatedModules: ['Terroir', 'Meet Your Cigar'] },
  'pair-and-impress':  { id: 'pair-and-impress',   title: 'Pair and Impress', route: '/smokecraft/pairing-lab',  relatedModules: ['Suggested Pairings'] },
  'flavor-explorer':   { id: 'flavor-explorer',    title: 'Flavor Explorer',  route: '/smokecraft/flavor-memory', relatedModules: ['Flavor Discovery'] },
  'flavor-memory':     { id: 'flavor-memory',      title: 'Flavor Memory',    route: '/smokecraft/flavor-memory', relatedModules: ['Flavor Discovery'] },
  'community-events':  { id: 'community-events',   title: 'Community Events', route: '/smokecraft/event-challenge', relatedModules: [] },
}

function sc(session) { return session?.smokeCraft || {} }

// Each evaluator returns { score, reasons: string[] } from real data only.
// A score of 0 means "no supporting data" — never a guessed baseline.

function evalHumidorExpert(session, journey) {
  const reasons = []
  let score = 0
  const kc = sc(session).knowledgeChecks || {}
  const technicalModules = ['terroir', 'meet-your-cigar', 'construction-inspection']
  const technicalScores = technicalModules.map(m => kc[m]).filter(Boolean)
  if (technicalScores.length > 0) {
    const avgPct = technicalScores.reduce((s, q) => s + (q.total > 0 ? q.score / q.total : 0), 0) / technicalScores.length
    if (avgPct >= 0.7) { score += 40; reasons.push(`Scored ${Math.round(avgPct * 100)}% average on technical Knowledge Checks (Terroir / Meet Your Cigar).`) }
    else if (avgPct > 0) { score += 15; reasons.push(`Completed technical Knowledge Checks with ${Math.round(avgPct * 100)}% average score.`) }
  }
  if (journey?.selectedCigar?.wrapper || journey?.selectedCigar?.origin) {
    score += 15
    reasons.push(`Explored wrapper/origin detail for ${journey.selectedCigar.name || 'your selected cigar'}.`)
  }
  return { score, reasons }
}

function evalPairAndImpress(session, journey) {
  const reasons = []
  let score = 0
  if (journey?.pairing?.recommendation) {
    score += 35
    reasons.push(`You received a pairing recommendation: "${journey.pairing.recommendation}".`)
  }
  if (Array.isArray(journey?.pairing?.selections) && journey.pairing.selections.length > 0) {
    score += 20
    reasons.push(`Explored ${journey.pairing.selections.length} pairing option(s) during your session.`)
  }
  return { score, reasons }
}

function evalFlavorExplorer(session, journey) {
  const reasons = []
  let score = 0
  const flavors = journey?.flavorMemory?.selectedFlavors || []
  if (flavors.length >= 3) {
    score += 40
    reasons.push(`Identified ${flavors.length} distinct flavor notes: ${flavors.join(', ')}.`)
  } else if (flavors.length > 0) {
    score += 15
    reasons.push(`Identified ${flavors.length} flavor note(s) during your session.`)
  }
  return { score, reasons }
}

function evalFlavorMemory(session, journey) {
  const reasons = []
  let score = 0
  if (journey?.flavorMemory?.notes) {
    score += 25
    reasons.push('You recorded personal flavor memory notes.')
  }
  if (journey?.scorecard?.personalNotes) {
    score += 20
    reasons.push('You left personal scorecard notes worth revisiting.')
  }
  return { score, reasons }
}

function evalCommunityEvents(session, journey) {
  const reasons = []
  let score = 0
  const joinedEvents = sc(session).eventChallengeModule?.joinedEventIds || []
  const joinedChallenges = sc(session).smokeCraftChallengeModule?.joinedCategoryIds || []
  if (joinedEvents.length > 0) {
    score += 40
    reasons.push(`You already joined ${joinedEvents.length} SmokeCraft event(s).`)
  }
  if (joinedChallenges.length > 0) {
    score += 15
    reasons.push(`You joined ${joinedChallenges.length} SmokeCraft Challenge categor${joinedChallenges.length === 1 ? 'y' : 'ies'}.`)
  }
  return { score, reasons }
}

const EVALUATORS = {
  'humidor-expert':   evalHumidorExpert,
  'pair-and-impress': evalPairAndImpress,
  'flavor-explorer':  evalFlavorExplorer,
  'flavor-memory':    evalFlavorMemory,
  'community-events': evalCommunityEvents,
}

/**
 * Pure, deterministic recommendation calculation — same session/journey
 * input always yields the same result. No randomness, no AI call.
 */
export function calculateRecommendations(session, journey) {
  const results = Object.keys(EVALUATORS).map(id => {
    const { score, reasons } = EVALUATORS[id](session, journey)
    return { ...CATEGORIES[id], score, reasons }
  })
  const ranked = [...results].sort((a, b) => b.score - a.score)
  const hasSignal = ranked[0]?.score > 0
  return {
    hasSignal,
    primary: hasSignal ? ranked[0] : null,
    alternates: hasSignal ? ranked.slice(1).filter(r => r.score > 0) : [],
    all: results,
  }
}

/** Sum of every real, configured SESSION_REWARDS xp value — a real,
 * verified figure (not a guess) representing total XP available across a
 * full journey. */
export function getTotalConfiguredXP() {
  return Object.values(SESSION_REWARDS).reduce((sum, r) => sum + (r.xp || 0), 0)
}

/** Real upcoming (non-expired) events from the existing passport events
 * data source — never fabricated. */
export function getSuggestedEvents(now = Date.now()) {
  return PASSPORT_EVENTS.filter(ev => {
    const parsed = Date.parse(`${ev.mon} ${ev.day}, ${ev.year} ${ev.time || ''}`)
    return !Number.isNaN(parsed) && parsed > now
  }).slice(0, 3)
}

/** Real educational modules with a configured Knowledge Check the guest has
 * not yet completed — never a fabricated suggestion. */
export function getSuggestedQuiz(session) {
  const completed = Object.keys(sc(session).knowledgeChecks || {})
  const moduleId = Object.keys(KNOWLEDGE_CHECK_SETS).find(id => !completed.includes(id))
  return moduleId ? KNOWLEDGE_CHECK_SETS[moduleId] : null
}

/** Real winner-category challenges related to a recommendation category by
 * simple keyword overlap with the category title — reuses the existing,
 * already-verified winner-category engine rather than inventing new data. */
export function getRelatedChallenges(session, categoryId) {
  const keywords = {
    'humidor-expert':   ['wrapper', 'gauge', 'draw'],
    'pair-and-impress': ['pairing', 'blend'],
    'flavor-explorer':  ['blend', 'discovery'],
    'flavor-memory':    ['blend', 'discovery'],
    'community-events':  ['lounge', 'legend'],
  }
  const kws = keywords[categoryId] || []
  return calculateWinnerEligibility(session).filter(c =>
    kws.some(k => c.id.includes(k) || c.title.toLowerCase().includes(k))
  )
}
