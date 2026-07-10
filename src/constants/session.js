export const RANKS = [
  { name: 'Novice',      minXP: 0,    maxXP: 199,      icon: 'emoji_events',      color: '#9a8f80' },
  { name: 'Enthusiast',  minXP: 200,  maxXP: 499,      icon: 'star',              color: '#e9c176' },
  { name: 'Connoisseur', minXP: 500,  maxXP: 899,      icon: 'military_tech',     color: '#ffb95a' },
  { name: 'Aficionado',  minXP: 900,  maxXP: Infinity, icon: 'workspace_premium', color: '#e9c176' },
]

export function getRankFromXP(xp) {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (xp >= RANKS[i].minXP) return RANKS[i]
  }
  return RANKS[0]
}

export const XP_AWARDS = {
  PROFILE_COMPLETE:        50,
  GOLDEN_BOX_VIEWED:       25,
  MENTOR_SELECTED:         75,
  FORMAT_SELECTED:         25,
  ORIGINS_COMPLETE:       100,
  LEAVES_COMPLETE:         75,
  LEAF_CHALLENGE_PERFECT: 125,
  CULTIVATION_COMPLETE:    75,
  BLEND_CREATED:          150,
  FLAVOR_DNA_COMPLETE:    100,
  PAIRING_COMPLETE:        75,
  CIGAR_SELECTED:         100,
  POS_ORDERED:             25,
  SESSION_1_COMPLETE:     200,
  TERROIR_COMPLETE:       100,
  PAIRING_MASTERY:        100,
  VITOLA_COMPLETE:        100,
  IDENTITY_REVEAL:        250,
  PASSPORT_STAMP:          50,
}

export const SMOKECRAFT_FLOW = [
  { id: 'enroll',           route: '/smokecraft/enroll',           label: 'Profile Enrollment',        stitch: true  },
  { id: 'format',           route: '/smokecraft/format',           label: 'Shape, Size & Burn Time',   stitch: false },
  { id: 'seed-soil',        route: '/smokecraft/seed-soil',        label: 'Seed & Soil Pairing',       stitch: true  },
  { id: 'mentor',           route: '/smokecraft/mentor',           label: 'Select Master Mentor',      stitch: true  },
  { id: 'golden-box',       route: '/smokecraft/golden-box',       label: 'Gold Box Rules',            stitch: false },
  { id: 'humidor-match',    route: '/smokecraft/humidor-match',    label: 'Humidor Match',             stitch: true  },
  { id: 'request-purchase', route: '/smokecraft/request-purchase', label: 'Request or Purchase Cigar', stitch: true  },
  { id: 'cut-toast-light',  route: '/smokecraft/cut-toast-light',  label: 'Cut, Toast & Light',        stitch: true  },
  { id: 'first-third',      route: '/smokecraft/first-third',      label: 'First Third Tasting',       stitch: true  },
  { id: 'second-third',     route: '/smokecraft/second-third',     label: 'Second Third Tasting',      stitch: true  },
  { id: 'final-third',      route: '/smokecraft/final-third',      label: 'Final Third Tasting',       stitch: true  },
  { id: 'scorecard',        route: '/smokecraft/scorecard',        label: 'Scorecard',                 stitch: true  },
  { id: 'passport-stamp',   route: '/smokecraft/passport-stamp',   label: 'Passport Stamp',            stitch: true  },
  { id: 'connections',      route: '/smokecraft/connections',      label: '360 Passport Connections',  stitch: true  },
  { id: 'management-sync',  route: '/smokecraft/management-sync',  label: 'Venue / Management Sync',   stitch: false },
  { id: 'session-complete', route: '/smokecraft/session-complete', label: 'Session Closeout',          stitch: true  },
  // Legacy / supplemental steps (not in main flow order)
  { id: 'art',              route: '/smokecraft/art',              label: 'Art of the Cigar',          stitch: false },
  { id: 'origins',          route: '/smokecraft/origins',          label: 'Tobacco Origins',           stitch: true  },
  { id: 'leaves',           route: '/smokecraft/leaves',           label: 'Leaf Education',            stitch: false },
  { id: 'leaf-challenge',   route: '/smokecraft/leaf-challenge',   label: 'Leaf Recognition Game',     stitch: false },
  { id: 'cultivation',      route: '/smokecraft/cultivation',      label: 'Cultivation Experience',    stitch: false },
  { id: 'blend',            route: '/smokecraft/blend',            label: 'Blending Studio',           stitch: true  },
  { id: 'flavor-dna',       route: '/smokecraft/flavor-dna',       label: 'Flavor DNA Analysis',       stitch: true  },
  { id: 'pairing',          route: '/smokecraft/pairing',          label: 'Pairing Experience',        stitch: true  },
  { id: 'terroir',          route: '/smokecraft/terroir',          label: 'Tobacco Terroir',           stitch: false },
  { id: 'pairing-mastery',  route: '/smokecraft/pairing-mastery',  label: 'Spirit Pairing Mastery',    stitch: false },
  { id: 'vitola',           route: '/smokecraft/vitola',           label: 'Vitola Science',            stitch: false },
  { id: 'identity',         route: '/smokecraft/identity',         label: 'Master Blender Ceremony',   stitch: false },
  { id: 'leaderboard',      route: '/smokecraft/leaderboard',      label: 'Leaderboard',               stitch: false },
  { id: 'golden-box-status',route: '/smokecraft/golden-box/status',label: 'Golden Box Status',         stitch: false },
]

export function getNextSmokecraftRoute(completedSteps) {
  const next = SMOKECRAFT_FLOW.find(s => !completedSteps.includes(s.id))
  return next ? next.route : '/smokecraft/passport-stamp'
}

export function getLastSmokecraftRoute(currentStep) {
  const step = SMOKECRAFT_FLOW.find(s => s.id === currentStep)
  return step ? step.route : '/smokecraft/enroll'
}

// ── Multi-visit gamified journey ────────────────────────────────────────────
// SmokeCraft is an 8-visit, 24-session venue journey, not a single-sitting
// checklist. A visit's sessions all unlock together; the next visit stays
// locked until every session in the current visit is completed. This is the
// source of truth for route guards, lock screens, and "Visit X of 8 / Session
// Y of 24" progress UI — do not hardcode visit/session numbers elsewhere.
// `id` values match the exact string each page passes to completeStep(id)
// in GuestSessionContext, except 'entry' (the index page has no discrete
// completion event — it is always treated as satisfied).
//
// OFFICIAL 18-STEP / 7-SESSION JOURNEY
// Sessions 1-7 map to the required SmokeCraft route order.
// Format, WrapperStrength, SmokeCraftChallenge, SecondHumidorMatch, and
// MiniTastingRound are preserved as supplemental routes but are NOT required
// gates in this structure. They remain accessible as stand-alone pages.
export const TOTAL_VISITS = 7
export const TOTAL_SESSIONS = 18

export const VISIT_STRUCTURE = [
  // Session 1: Identity + Golden Box Rules
  {
    visit: 1,
    title: 'Identity & Golden Box Rules',
    sessions: [
      { session: 1,  id: 'entry',      route: '/smokecraft',            label: 'SmokeCraft Entry' },
      { session: 2,  id: 'golden-box', route: '/smokecraft/golden-box', label: 'Golden Box Rules' },
    ],
    badges: ['SmokeCraft Entry Badge', 'Golden Box Entry Badge'],
  },
  // Session 2: Mentor Selection + Seed & Soil
  {
    visit: 2,
    title: 'Mentor Selection & Seed & Soil',
    sessions: [
      { session: 3,  id: 'mentor',    route: '/smokecraft/mentor-selection', label: 'Mentor Selection' },
      { session: 4,  id: 'seed-soil', route: '/smokecraft/seed-soil',        label: 'Seed & Soil Pairing' },
    ],
    badges: ['Mentor Pair Badge', 'Seed & Soil Badge'],
  },
  // Session 3: Pairing Lab + Humidor Match
  {
    visit: 3,
    title: 'Pairing Lab & Humidor Match',
    sessions: [
      { session: 5,  id: 'pairing-lab',   route: '/smokecraft/pairing-lab',   label: 'Pairing Lab' },
      { session: 6,  id: 'humidor-match', route: '/smokecraft/humidor-match', label: 'Humidor Match' },
    ],
    badges: ['Pairing Explorer Badge', 'Humidor Match Badge'],
  },
  // Session 4: Request Purchase + Cut, Toast & Light
  {
    visit: 4,
    title: 'First Cigar — Purchase & Light',
    sessions: [
      { session: 7,  id: 'request-purchase', route: '/smokecraft/request-purchase', label: 'Request / Purchase' },
      { session: 8,  id: 'cut-toast-light',  route: '/smokecraft/cut-toast-light',  label: 'Cut, Toast & Light' },
    ],
    badges: ['First Official Smoke Badge', 'Cut & Light Badge'],
  },
  // Session 5: First Third + Second Third + Flavor Memory + Final Third
  {
    visit: 5,
    title: 'Tasting — All Thirds & Flavor Memory',
    sessions: [
      { session: 9,  id: 'first-third',    route: '/smokecraft/first-third',    label: 'First Third Tasting' },
      { session: 10, id: 'second-third',   route: '/smokecraft/second-third',   label: 'Second Third Tasting' },
      { session: 11, id: 'flavor-memory',  route: '/smokecraft/flavor-memory',  label: 'Flavor Memory Session' },
      { session: 12, id: 'final-third',    route: '/smokecraft/final-third',    label: 'Final Third Tasting' },
    ],
    badges: ['First Third Badge', 'Flavor Tracker Badge', 'Final Third Badge'],
  },
  // Session 6: Scorecard + Final Review
  {
    visit: 6,
    title: 'Scorecard & Final Review',
    sessions: [
      { session: 13, id: 'scorecard',    route: '/smokecraft/scorecard',    label: 'Scorecard / Ranking' },
      { session: 14, id: 'final-review', route: '/smokecraft/final-review', label: 'SmokeCraft Final Review' },
    ],
    badges: ['SmokeCraft Scorecard Badge', 'Completed Cigar Review Badge'],
  },
  // Session 7: Passport Stamp + Connections + Management Sync + Session Complete
  {
    visit: 7,
    title: 'Passport Completion',
    sessions: [
      { session: 15, id: 'passport-stamp',   route: '/smokecraft/passport-stamp',   label: '360 Passport Stamp' },
      { session: 16, id: 'connections',      route: '/smokecraft/connections',      label: '360 Passport Connections' },
      { session: 17, id: 'management-sync',  route: '/smokecraft/management-sync',  label: 'Management Sync' },
      { session: 18, id: 'session-complete', route: '/smokecraft/session-complete', label: 'Session Complete' },
    ],
    badges: ['SmokeCraft Passport Stamp', 'Passport Connections Access', 'VIP Candidate Signal', 'SmokeCraft Complete'],
  },
]

function isSessionComplete(completedSteps, sessionId) {
  return sessionId === 'entry' ? true : completedSteps.includes(sessionId)
}

/** Find which visit/session a given completedSteps id belongs to. */
export function getVisitForStepId(stepId) {
  for (const v of VISIT_STRUCTURE) {
    const s = v.sessions.find(s => s.id === stepId)
    if (s) return { visit: v.visit, session: s.session, visitTitle: v.title, sessionLabel: s.label }
  }
  return null
}

/** Visit 1 is always unlocked. Visit N unlocks only once every session in visit N-1 is complete. */
export function isVisitUnlocked(completedSteps, visitNumber) {
  if (visitNumber <= 1) return true
  const prevVisit = VISIT_STRUCTURE.find(v => v.visit === visitNumber - 1)
  if (!prevVisit) return true
  return prevVisit.sessions.every(s => isSessionComplete(completedSteps, s.id))
}


/** Returns the current visit/session pointer, derived from completedSteps — no separate counters to keep in sync. */
export function getVisitProgress(completedSteps) {
  for (const v of VISIT_STRUCTURE) {
    const nextSession = v.sessions.find(s => !isSessionComplete(completedSteps, s.id))
    if (nextSession) {
      return { visit: v.visit, session: nextSession.session, totalVisits: TOTAL_VISITS, totalSessions: TOTAL_SESSIONS, journeyComplete: false, round: getRoundForVisit(v.visit) }
    }
  }
  return { visit: TOTAL_VISITS, session: TOTAL_SESSIONS, totalVisits: TOTAL_VISITS, totalSessions: TOTAL_SESSIONS, journeyComplete: true, round: getRoundForVisit(TOTAL_VISITS) }
}

// ── Macro "Round" grouping ───────────────────────────────────────────────
// 3 macro-phases covering the 8 visits:
// Round 1 = "Education & Setup"        = Visits 1-3
// Round 2 = "Tasting Experience"       = Visits 4-6
// Round 3 = "Challenge & Completion"   = Visits 7-8
export const TOTAL_ROUNDS = 3

export const ROUNDS = [
  { round: 1, title: 'Education & Setup',        visits: [1, 2, 3] },
  { round: 2, title: 'Tasting Experience',        visits: [4, 5, 6] },
  { round: 3, title: 'Challenge & Completion',    visits: [7, 8] },
]

export function getRoundForVisit(visitNumber) {
  if (visitNumber <= 3) return 1
  if (visitNumber <= 6) return 2
  return 3
}

/** Like getVisitProgress, but resolves visit/session/round from a specific stepId rather than the "next incomplete" pointer. */
export function getFullProgress(completedSteps) {
  return getVisitProgress(completedSteps)
}
