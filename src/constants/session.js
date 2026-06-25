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
export const TOTAL_VISITS = 8
export const TOTAL_SESSIONS = 24

export const VISIT_STRUCTURE = [
  {
    visit: 1,
    title: 'Entry / Profile / Gold Box / Mentor Setup',
    sessions: [
      { session: 1, id: 'entry',           route: '/smokecraft',                  label: 'SmokeCraft Entry' },
      { session: 2, id: 'enroll',          route: '/smokecraft/enroll',           label: 'User Profile Capture' },
      { session: 3, id: 'golden-box',      route: '/smokecraft/golden-box',       label: 'Gold Box Rules' },
      { session: 4, id: 'mentor',          route: '/smokecraft/mentor-selection', label: 'Mentor Selection' },
    ],
    badges: ['Profile Started Badge', 'Gold Box Entry Badge', 'Mentor Pair Badge'],
  },
  {
    visit: 2,
    title: 'Cigar Education',
    sessions: [
      { session: 5, id: 'format',           route: '/smokecraft/format',           label: 'Shape, Size & Burn Time' },
      { session: 6, id: 'wrapper-strength', route: '/smokecraft/wrapper-strength', label: 'Wrapper / Strength Education' },
    ],
    badges: ['Cigar Format Badge', 'Wrapper Knowledge Badge', 'Burn Time Badge'],
  },
  {
    visit: 3,
    title: 'Seed & Soil Pairing',
    sessions: [
      { session: 7, id: 'seed-soil',   route: '/smokecraft/seed-soil',   label: 'Seed & Soil Pairing' },
      { session: 8, id: 'pairing-lab', route: '/smokecraft/pairing-lab', label: 'Pairing Lab' },
    ],
    badges: ['Seed & Soil Badge', 'Pairing Explorer Badge', 'Origin Knowledge Badge'],
  },
  {
    visit: 4,
    title: 'First Official Cigar Match',
    sessions: [
      { session: 9,  id: 'humidor-match',    route: '/smokecraft/humidor-match',    label: 'Humidor Match' },
      { session: 10, id: 'request-purchase', route: '/smokecraft/request-purchase', label: 'Request / Purchase' },
      { session: 11, id: 'cut-toast-light',  route: '/smokecraft/cut-toast-light',  label: 'Cut, Toast & Light' },
      { session: 12, id: 'first-third',      route: '/smokecraft/first-third',      label: 'First Third Tasting' },
    ],
    badges: ['First Official Smoke Badge', 'Cut & Light Badge', 'First Third Badge'],
  },
  {
    visit: 5,
    title: 'Flavor Transition',
    sessions: [
      { session: 13, id: 'second-third',  route: '/smokecraft/second-third',  label: 'Second Third Tasting' },
      { session: 14, id: 'flavor-memory', route: '/smokecraft/flavor-memory', label: 'Flavor Memory Session' },
    ],
    badges: ['Flavor Tracker Badge', 'Second Third Badge', 'Transition Badge'],
  },
  {
    visit: 6,
    title: 'Final Third / Scorecard',
    sessions: [
      { session: 15, id: 'final-third', route: '/smokecraft/final-third', label: 'Final Third Tasting' },
      { session: 16, id: 'scorecard',   route: '/smokecraft/scorecard',   label: 'Scorecard / Ranking' },
    ],
    badges: ['Final Third Badge', 'Completed Cigar Review Badge', 'SmokeCraft Scorecard Badge'],
  },
  {
    visit: 7,
    title: 'Challenge / Second Cigar',
    sessions: [
      { session: 17, id: 'smokecraft-challenge', route: '/smokecraft/smokecraft-challenge', label: 'SmokeCraft Challenge' },
      { session: 18, id: 'second-humidor-match', route: '/smokecraft/second-humidor-match', label: 'Second Humidor Match' },
      { session: 19, id: 'mini-tasting',         route: '/smokecraft/mini-tasting',         label: 'Mini Tasting Round' },
    ],
    badges: ['Challenge Badge', 'Second Cigar Badge', 'Taste Growth Badge'],
  },
  {
    visit: 8,
    title: 'Passport Completion',
    sessions: [
      { session: 20, id: 'final-review',     route: '/smokecraft/final-review',     label: 'SmokeCraft Final Review' },
      { session: 21, id: 'passport-stamp',   route: '/smokecraft/passport-stamp',   label: '360 Passport Stamp' },
      { session: 22, id: 'connections',      route: '/smokecraft/connections',      label: '360 Passport Connections' },
      { session: 23, id: 'management-sync',  route: '/smokecraft/management-sync',  label: 'Management Sync' },
      { session: 24, id: 'session-complete', route: '/smokecraft/session-complete', label: 'Session Complete' },
    ],
    badges: ['SmokeCraft Passport Stamp', 'Passport Connections Access', 'VIP Candidate Signal', 'Next SmokeCraft Season'],
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
      return { visit: v.visit, session: nextSession.session, totalVisits: TOTAL_VISITS, totalSessions: TOTAL_SESSIONS, journeyComplete: false }
    }
  }
  return { visit: TOTAL_VISITS, session: TOTAL_SESSIONS, totalVisits: TOTAL_VISITS, totalSessions: TOTAL_SESSIONS, journeyComplete: true }
}
