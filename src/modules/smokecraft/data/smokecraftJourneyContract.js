/**
 * SmokeCraft Journey Contract — Canonical 24-Session Definition
 *
 * Single authoritative source for the 8-visit / 24-session SmokeCraft journey.
 * Used by: SmokeCraftSessionGuard, next/prev route logic, session numbering,
 *           journey documentation, MVP2 master registry, tests.
 *
 * RULES:
 *   - Do not reorder or compress sessions
 *   - Do not add sessions without updating VISIT_STRUCTURE in session.js
 *   - session IDs must match what each page passes to completeStep(id)
 *   - The self-validation block at the bottom will throw on any structural violation
 *
 * Contract schema per entry:
 *   session       — sequential 1–24
 *   id            — stable step ID (matches completedSteps key)
 *   route         — React Router path
 *   label         — human-readable title
 *   visit         — 1–8 visit grouping
 *   prev          — previous route (null for session 1)
 *   next          — next route (null for session 24)
 *   completionKey — the id value completeStep() will be called with
 *   required      — if false, guest may skip and next unlocks anyway
 *   featureFlag   — flag that must be enabled for this session (null = always on)
 *   demoAvailable — true if accessible in investor demo mode
 */

export const JOURNEY_STEPS = [
  {
    session: 1,  id: 'entry',              route: '/smokecraft',
    label: 'SmokeCraft Entry',             visit: 1,
    prev: null,                            next: '/smokecraft/enroll',
    completionKey: 'entry',               required: true,
    featureFlag: null,                     demoAvailable: true,
  },
  {
    session: 2,  id: 'enroll',             route: '/smokecraft/enroll',
    label: 'Profile Enrollment',           visit: 1,
    prev: '/smokecraft',                   next: '/smokecraft/golden-box',
    completionKey: 'enroll',              required: true,
    featureFlag: null,                     demoAvailable: true,
  },
  {
    session: 3,  id: 'golden-box',         route: '/smokecraft/golden-box',
    label: 'Golden Box Rules',             visit: 1,
    prev: '/smokecraft/enroll',            next: '/smokecraft/mentor-selection',
    completionKey: 'golden-box',          required: true,
    featureFlag: null,                     demoAvailable: true,
  },
  {
    session: 4,  id: 'mentor',             route: '/smokecraft/mentor-selection',
    label: 'Mentor Selection',             visit: 1,
    prev: '/smokecraft/golden-box',        next: '/smokecraft/format',
    completionKey: 'mentor',              required: true,
    featureFlag: null,                     demoAvailable: true,
  },
  {
    session: 5,  id: 'format',             route: '/smokecraft/format',
    label: 'Shape, Size & Burn Time',      visit: 2,
    prev: '/smokecraft/mentor-selection',  next: '/smokecraft/wrapper-strength',
    completionKey: 'format',              required: true,
    featureFlag: null,                     demoAvailable: true,
  },
  {
    session: 6,  id: 'wrapper-strength',   route: '/smokecraft/wrapper-strength',
    label: 'Wrapper & Strength Education', visit: 2,
    prev: '/smokecraft/format',            next: '/smokecraft/seed-soil',
    completionKey: 'wrapper-strength',    required: true,
    featureFlag: null,                     demoAvailable: true,
  },
  {
    session: 7,  id: 'seed-soil',          route: '/smokecraft/seed-soil',
    label: 'Seed & Soil Pairing',          visit: 3,
    prev: '/smokecraft/wrapper-strength',  next: '/smokecraft/pairing-lab',
    completionKey: 'seed-soil',           required: true,
    featureFlag: null,                     demoAvailable: true,
  },
  {
    session: 8,  id: 'pairing-lab',        route: '/smokecraft/pairing-lab',
    label: 'Pairing Lab',                  visit: 3,
    prev: '/smokecraft/seed-soil',         next: '/smokecraft/humidor-match',
    completionKey: 'pairing-lab',         required: true,
    featureFlag: null,                     demoAvailable: true,
  },
  {
    session: 9,  id: 'humidor-match',      route: '/smokecraft/humidor-match',
    label: 'Humidor Match',                visit: 4,
    prev: '/smokecraft/pairing-lab',       next: '/smokecraft/request-purchase',
    completionKey: 'humidor-match',       required: true,
    featureFlag: null,                     demoAvailable: true,
  },
  {
    session: 10, id: 'request-purchase',   route: '/smokecraft/request-purchase',
    label: 'Request / Purchase',           visit: 4,
    prev: '/smokecraft/humidor-match',     next: '/smokecraft/cut-toast-light',
    completionKey: 'request-purchase',    required: true,
    featureFlag: null,                     demoAvailable: true,
  },
  {
    session: 11, id: 'cut-toast-light',    route: '/smokecraft/cut-toast-light',
    label: 'Cut, Toast & Light',           visit: 4,
    prev: '/smokecraft/request-purchase',  next: '/smokecraft/first-third',
    completionKey: 'cut-toast-light',     required: true,
    featureFlag: null,                     demoAvailable: true,
  },
  {
    session: 12, id: 'first-third',        route: '/smokecraft/first-third',
    label: 'First Third Tasting',          visit: 4,
    prev: '/smokecraft/cut-toast-light',   next: '/smokecraft/second-third',
    completionKey: 'first-third',         required: true,
    featureFlag: null,                     demoAvailable: true,
  },
  {
    session: 13, id: 'second-third',       route: '/smokecraft/second-third',
    label: 'Second Third Tasting',         visit: 5,
    prev: '/smokecraft/first-third',       next: '/smokecraft/flavor-memory',
    completionKey: 'second-third',        required: true,
    featureFlag: null,                     demoAvailable: true,
  },
  {
    session: 14, id: 'flavor-memory',      route: '/smokecraft/flavor-memory',
    label: 'Flavor Memory Session',        visit: 5,
    prev: '/smokecraft/second-third',      next: '/smokecraft/final-third',
    completionKey: 'flavor-memory',       required: true,
    featureFlag: null,                     demoAvailable: true,
  },
  {
    session: 15, id: 'final-third',        route: '/smokecraft/final-third',
    label: 'Final Third Tasting',          visit: 6,
    prev: '/smokecraft/flavor-memory',     next: '/smokecraft/scorecard',
    completionKey: 'final-third',         required: true,
    featureFlag: null,                     demoAvailable: true,
  },
  {
    session: 16, id: 'scorecard',          route: '/smokecraft/scorecard',
    label: 'Scorecard / Ranking',          visit: 6,
    prev: '/smokecraft/final-third',       next: '/smokecraft/smokecraft-challenge',
    completionKey: 'scorecard',           required: true,
    featureFlag: null,                     demoAvailable: true,
  },
  {
    session: 17, id: 'smokecraft-challenge', route: '/smokecraft/smokecraft-challenge',
    label: 'SmokeCraft Challenge',         visit: 7,
    prev: '/smokecraft/scorecard',         next: '/smokecraft/second-humidor-match',
    completionKey: 'smokecraft-challenge', required: false,
    featureFlag: null,                     demoAvailable: true,
  },
  {
    session: 18, id: 'second-humidor-match', route: '/smokecraft/second-humidor-match',
    label: 'Second Humidor Match',         visit: 7,
    prev: '/smokecraft/smokecraft-challenge', next: '/smokecraft/mini-tasting',
    completionKey: 'second-humidor-match', required: false,
    featureFlag: null,                     demoAvailable: true,
  },
  {
    session: 19, id: 'mini-tasting',       route: '/smokecraft/mini-tasting',
    label: 'Mini Tasting Round',           visit: 7,
    prev: '/smokecraft/second-humidor-match', next: '/smokecraft/final-review',
    completionKey: 'mini-tasting',        required: false,
    featureFlag: null,                     demoAvailable: true,
  },
  {
    session: 20, id: 'final-review',       route: '/smokecraft/final-review',
    label: 'SmokeCraft Final Review',      visit: 8,
    prev: '/smokecraft/mini-tasting',      next: '/smokecraft/passport-stamp',
    completionKey: 'final-review',        required: true,
    featureFlag: null,                     demoAvailable: true,
  },
  {
    session: 21, id: 'passport-stamp',     route: '/smokecraft/passport-stamp',
    label: '360 Passport Stamp',           visit: 8,
    prev: '/smokecraft/final-review',      next: '/smokecraft/connections',
    completionKey: 'passport-stamp',      required: true,
    featureFlag: 'smokecraft.passport.enabled', demoAvailable: true,
  },
  {
    session: 22, id: 'connections',        route: '/smokecraft/connections',
    label: '360 Passport Connections',     visit: 8,
    prev: '/smokecraft/passport-stamp',    next: '/smokecraft/management-sync',
    completionKey: 'connections',         required: true,
    featureFlag: 'smokecraft.passport.enabled', demoAvailable: true,
  },
  {
    session: 23, id: 'management-sync',    route: '/smokecraft/management-sync',
    label: 'Management Sync',              visit: 8,
    prev: '/smokecraft/connections',       next: '/smokecraft/session-complete',
    completionKey: 'management-sync',     required: true,
    featureFlag: null,                     demoAvailable: true,
  },
  {
    session: 24, id: 'session-complete',   route: '/smokecraft/session-complete',
    label: 'Session Complete',             visit: 8,
    prev: '/smokecraft/management-sync',   next: null,
    completionKey: 'session-complete',    required: true,
    featureFlag: null,                     demoAvailable: true,
  },
]

// Hard sequence rules — must never be violated
export const JOURNEY_RULES = {
  totalVisits: 8,
  totalSessions: 24,
  flavorMemoryMustFollowSecondThird: true,
  flavorMemoryMustPrecedeFinalThird: true,
  scorecardUpstreamToPassportStamp: true,
  passportStampEarlyUnlockAllowed: false,
  connectionsEarlyUnlockAllowed: false,
  visit8Protected: true,
  oneSessionShortcutAllowed: false,
  journeyCompressionAllowed: false,
  flavorMemoryRemovalAllowed: false,
}

// ── Self-validation — runs at import time ────────────────────────────────────
// Any structural violation throws immediately, failing the build or test.

;(function validateContract() {
  const ids  = JOURNEY_STEPS.map(s => s.id)
  const nums = JOURNEY_STEPS.map(s => s.session)
  const routes = JOURNEY_STEPS.map(s => s.route)

  // Count
  if (JOURNEY_STEPS.length !== 24)
    throw new Error(`JOURNEY CONTRACT: expected 24 sessions, got ${JOURNEY_STEPS.length}`)

  // Duplicate IDs
  const dupIds = ids.filter((id, i) => ids.indexOf(id) !== i)
  if (dupIds.length)
    throw new Error(`JOURNEY CONTRACT: duplicate session IDs: ${dupIds.join(', ')}`)

  // Duplicate session numbers
  const dupNums = nums.filter((n, i) => nums.indexOf(n) !== i)
  if (dupNums.length)
    throw new Error(`JOURNEY CONTRACT: duplicate session numbers: ${dupNums.join(', ')}`)

  // Sequential 1–24
  for (let i = 0; i < 24; i++) {
    if (nums[i] !== i + 1)
      throw new Error(`JOURNEY CONTRACT: session ${i + 1} is out of order (got ${nums[i]})`)
  }

  // Prev/next chain integrity
  for (let i = 0; i < JOURNEY_STEPS.length; i++) {
    const step = JOURNEY_STEPS[i]
    const expectedPrev = i === 0 ? null : JOURNEY_STEPS[i - 1].route
    const expectedNext = i === JOURNEY_STEPS.length - 1 ? null : JOURNEY_STEPS[i + 1].route
    if (step.prev !== expectedPrev)
      throw new Error(`JOURNEY CONTRACT: step ${step.id} prev="${step.prev}" expected "${expectedPrev}"`)
    if (step.next !== expectedNext)
      throw new Error(`JOURNEY CONTRACT: step ${step.id} next="${step.next}" expected "${expectedNext}"`)
  }

  // flavor-memory ordering
  const secondIdx  = ids.indexOf('second-third')
  const flavorIdx  = ids.indexOf('flavor-memory')
  const finalIdx   = ids.indexOf('final-third')
  if (!(secondIdx < flavorIdx && flavorIdx < finalIdx))
    throw new Error('JOURNEY CONTRACT: flavor-memory must be between second-third and final-third')

  // Final session has no next
  const last = JOURNEY_STEPS[JOURNEY_STEPS.length - 1]
  if (last.next !== null)
    throw new Error(`JOURNEY CONTRACT: final session "${last.id}" must have next=null`)

  // Completion keys present
  const missingKeys = JOURNEY_STEPS.filter(s => !s.completionKey)
  if (missingKeys.length)
    throw new Error(`JOURNEY CONTRACT: sessions missing completionKey: ${missingKeys.map(s => s.id).join(', ')}`)
})()

// ── Query helpers ────────────────────────────────────────────────────────────

export function getJourneyStep(id) {
  return JOURNEY_STEPS.find(s => s.id === id) ?? null
}

export function getJourneyRoute(id) {
  return getJourneyStep(id)?.route ?? null
}

export function getNextRoute(id) {
  return getJourneyStep(id)?.next ?? null
}

export function getPrevRoute(id) {
  return getJourneyStep(id)?.prev ?? null
}

export function getStepByRoute(route) {
  return JOURNEY_STEPS.find(s => s.route === route) ?? null
}

export function getStepBySession(sessionNumber) {
  return JOURNEY_STEPS.find(s => s.session === sessionNumber) ?? null
}

export function isStepBeforeFlavorMemory(id) {
  const idx = JOURNEY_STEPS.findIndex(s => s.id === id)
  const flavorIdx = JOURNEY_STEPS.findIndex(s => s.id === 'flavor-memory')
  return idx >= 0 && idx < flavorIdx
}

export function isStepAfterFlavorMemory(id) {
  const idx = JOURNEY_STEPS.findIndex(s => s.id === id)
  const flavorIdx = JOURNEY_STEPS.findIndex(s => s.id === 'flavor-memory')
  return idx > flavorIdx
}

export function getVisitSessions(visitNumber) {
  return JOURNEY_STEPS.filter(s => s.visit === visitNumber)
}

export function isSessionRequired(id) {
  return getJourneyStep(id)?.required ?? true
}
