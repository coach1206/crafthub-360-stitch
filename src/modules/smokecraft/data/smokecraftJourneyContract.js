/**
 * SmokeCraft Journey Contract
 * Defines the canonical 17-step / 8-visit / 24-session sequence.
 * This is a contract — do not reorder or compress steps.
 */

export const JOURNEY_STEPS = [
  { step: 1,  id: 'entry',            route: '/smokecraft',                  label: 'Entry Gate',               visit: 1, session: 1 },
  { step: 2,  id: 'enroll',           route: '/smokecraft/enroll',           label: 'SmokeCraft Identity',      visit: 1, session: 2 },
  { step: 3,  id: 'golden-box',       route: '/smokecraft/golden-box',       label: 'Golden Box Rules',         visit: 1, session: 3 },
  { step: 4,  id: 'mentor',           route: '/smokecraft/mentor-selection', label: 'Mentor Selection',         visit: 1, session: 4 },
  { step: 5,  id: 'seed-soil',        route: '/smokecraft/seed-soil',        label: 'Seed & Soil',              visit: 2, session: 7 },
  { step: 6,  id: 'humidor-match',    route: '/smokecraft/humidor-match',    label: 'Humidor Match',            visit: 3, session: 9 },
  { step: 7,  id: 'request-purchase', route: '/smokecraft/request-purchase', label: 'Request / Purchase',       visit: 4, session: 10 },
  { step: 8,  id: 'cut-toast-light',  route: '/smokecraft/cut-toast-light',  label: 'Cut / Toast / Light',      visit: 4, session: 11 },
  { step: 9,  id: 'first-third',      route: '/smokecraft/first-third',      label: 'First Third',              visit: 4, session: 12 },
  { step: 10, id: 'second-third',     route: '/smokecraft/second-third',     label: 'Second Third',             visit: 5, session: 13 },
  { step: 11, id: 'flavor-memory',    route: '/smokecraft/flavor-memory',    label: 'Flavor Memory',            visit: 5, session: 14 },
  { step: 12, id: 'final-third',      route: '/smokecraft/final-third',      label: 'Final Third',              visit: 6, session: 15 },
  { step: 13, id: 'scorecard',        route: '/smokecraft/scorecard',        label: 'Scorecard / Ranking',      visit: 6, session: 16 },
  { step: 14, id: 'passport-stamp',   route: '/smokecraft/passport-stamp',   label: 'Passport Stamp',           visit: 7, session: 21 },
  { step: 15, id: 'connections',      route: '/smokecraft/connections',      label: '360 Passport Connections', visit: 7, session: 22 },
  { step: 16, id: 'management-sync',  route: '/smokecraft/management-sync',  label: 'Management Sync',          visit: 8, session: 23 },
  { step: 17, id: 'session-complete', route: '/smokecraft/session-complete', label: 'Session Complete',         visit: 8, session: 24 },
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

// Confirm flavor-memory is between second-third and final-third
const flavorIdx  = JOURNEY_STEPS.findIndex(s => s.id === 'flavor-memory')
const secondIdx  = JOURNEY_STEPS.findIndex(s => s.id === 'second-third')
const finalIdx   = JOURNEY_STEPS.findIndex(s => s.id === 'final-third')

if (!(secondIdx < flavorIdx && flavorIdx < finalIdx)) {
  throw new Error(
    'SMOKECRAFT JOURNEY CONTRACT VIOLATION: ' +
    'flavor-memory must be between second-third and final-third'
  )
}

export function getJourneyStep(id) {
  return JOURNEY_STEPS.find(s => s.id === id) ?? null
}

export function getJourneyRoute(id) {
  return getJourneyStep(id)?.route ?? null
}

export function isStepBeforeFlavorMemory(id) {
  const idx = JOURNEY_STEPS.findIndex(s => s.id === id)
  return idx >= 0 && idx < flavorIdx
}

export function isStepAfterFlavorMemory(id) {
  const idx = JOURNEY_STEPS.findIndex(s => s.id === id)
  return idx > flavorIdx
}
