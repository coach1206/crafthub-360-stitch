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

// DEPRECATED — Session-Sequence-Reconciliation pass: this array pre-dates
// the locked 27-session/6-phase VISIT_STRUCTURE below and does not match it
// (different ids, different order, no phase grouping). Confirmed to have
// zero real routing/order consumers (only re-exported, never read for
// session order anywhere in the app) — kept only because
// XP_AWARDS/RANKS/getRankFromXP in this same file are still real, in-use
// exports and this array sits between them. Do not use this for session
// order, routing, or progress — use VISIT_STRUCTURE.
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

// ── Locked 27-session, 6-phase spine (Package J) ────────────────────────────
// SmokeCraft's authoritative main journey is the locked 27-session structure
// from docs/SMOKECRAFT_360_MASTER_REBUILD_PLAN.md (Package 0), grouped into
// 6 phases. This is the single source of truth for route guards, lock
// screens, and "Phase X of 6 / Session Y of 27" progress UI — do not
// hardcode phase/session numbers elsewhere. The `visit` field name is kept
// for minimal diff against the many existing readers of this structure; it
// now means "phase" everywhere it is displayed.
//
// `id` values match the exact string each page passes to
// awardSessionRewards(id)/completeStep(id) in GuestSessionContext. S1 (id
// 'entry') is now a real, implemented session (Package N, Welcome to
// Today's Experience) with a genuine completion event, same as any other
// session — it is no longer auto-satisfied. Sessions marked
// `implemented: false` (no screen exists yet) are still skipped for unlock
// purposes rather than fabricated as complete; see isStepComplete below.
//
// Sessions sharing an `id` with another session in this list (e.g. S8/S9,
// S12/S13, S16/S17/S18, S19/S20) are honest merges: one already-built screen
// currently produces one completion signal for what the locked map treats as
// multiple sessions. Each keeps its own stable `session` number/title (per
// the mandate's requirement that merged sessions "must remain" separately
// numbered) via the `mergedInto` field, but cannot yet track independent
// completion without redesigning that screen — explicitly out of scope for
// Package J. See Package J evidence for the follow-up this implies.
export const TOTAL_VISITS = 6
export const TOTAL_PHASES = TOTAL_VISITS
export const TOTAL_SESSIONS = 27

export const VISIT_STRUCTURE = [
  {
    visit: 1,
    title: 'Session Preparation',
    sessions: [
      { session: 1, id: 'entry',            route: '/smokecraft/welcome',           label: 'Welcome to Today’s Experience' },
      { session: 2, id: 'humidor-match',    route: '/smokecraft/humidor-match',     label: 'Choose Your Cigar' },
      { session: 3, id: 'meet-your-cigar',  route: '/smokecraft/meet-your-cigar',   label: 'Meet Your Cigar' },
      { session: 4, id: 'terroir',          route: '/smokecraft/terroir',           label: 'Terroir' },
      { session: 5, id: 'format',           route: '/smokecraft/format',            label: 'Construction Inspection' },
      { session: 6, id: 'cut-toast-light',  route: '/smokecraft/cut-toast-light',   label: 'Choose Your Cut' },
      { session: 7, id: 'lighting-tutorial',route: '/smokecraft/lighting-tutorial', label: 'Lighting Tutorial' },
    ],
    badges: ['Cigar Selected Badge', 'Terroir Badge', 'Cut & Light Badge'],
  },
  {
    visit: 2,
    title: 'First Third',
    sessions: [
      { session: 8,  id: 'first-third',  route: '/smokecraft/first-third',  label: 'First Draw' },
      { session: 9,  id: 'first-third',  route: '/smokecraft/first-third',  label: 'Flavor Discovery',       mergedInto: 8 },
      { session: 10, id: 'flavor-memory',route: '/smokecraft/flavor-memory',label: 'Flavor Memory Exercise' },
      { session: 11, id: 'pairing-lab',  route: '/smokecraft/pairing-lab',  label: 'Suggested Pairings' },
    ],
    badges: ['First Third Badge', 'Flavor Memory Badge', 'Pairing Explorer Badge'],
  },
  {
    visit: 3,
    title: 'Second Third',
    sessions: [
      { session: 12, id: 'second-third',      route: '/smokecraft/second-third',      label: 'Flavor Evolution' },
      { session: 13, id: 'second-third',      route: '/smokecraft/second-third',      label: 'Construction Check',  mergedInto: 12 },
      { session: 14, id: 'mentor-commentary', route: '/smokecraft/mentor-commentary', label: 'Mentor Commentary' },
      { session: 15, id: 'knowledge-drop',    route: '/smokecraft/knowledge-drop',    label: 'Knowledge Drop' },
    ],
    badges: ['Second Third Badge', 'Mentor Commentary Badge', 'Knowledge Drop Badge'],
  },
  {
    visit: 4,
    title: 'Final Third',
    sessions: [
      { session: 16, id: 'final-third', route: '/smokecraft/final-third', label: 'Flavor Finish' },
      { session: 17, id: 'final-third', route: '/smokecraft/final-third', label: 'Strength Progression',    mergedInto: 16 },
      { session: 18, id: 'final-third', route: '/smokecraft/final-third', label: 'Overall Experience Notes', mergedInto: 16 },
    ],
    badges: ['Final Third Badge'],
  },
  {
    visit: 5,
    title: 'Reflection',
    sessions: [
      { session: 19, id: 'scorecard', route: '/smokecraft/scorecard', label: 'Rate Every Category' },
      { session: 20, id: 'scorecard', route: '/smokecraft/scorecard', label: 'Personal Notes', mergedInto: 19 },
    ],
    badges: ['SmokeCraft Scorecard Badge'],
  },
  {
    visit: 6,
    title: 'Results',
    sessions: [
      { session: 21, id: 'ai-summary',              route: '/smokecraft/ai-summary',              label: 'AI Summary' },
      { session: 22, id: 'pairing-recommendations', route: '/smokecraft/pairing-recommendations', label: 'Personalized Pairing Recommendations' },
      { session: 23, id: 'passport-stamp',          route: '/smokecraft/passport-stamp',    label: 'Passport Stamp Animation' },
      { session: 24, id: 'final-review',            route: '/smokecraft/final-review',      label: 'Completed Scorecard' },
      { session: 25, id: 'rewards',                 route: '/smokecraft/rewards',           label: 'Rewards and XP' },
      { session: 26, id: 'achievements',            route: '/smokecraft/rewards',           label: 'Achievements', sharedComponent: '/smokecraft/rewards' },
      { session: 27, id: 'session-complete',        route: '/smokecraft/session-complete',  label: 'Recommended Next Journey' },
    ],
    badges: ['SmokeCraft Passport Stamp', 'Passport Connections Access', 'VIP Candidate Signal', 'Next SmokeCraft Season'],
  },
]

// ── Supporting modules — contextual, outside the 27-session numbered spine ──
// Each entry names the numbered-spine session id a guest must complete
// before this module is reachable ("requires"). These are NOT part of
// TOTAL_SESSIONS and do not gate any spine session's unlock — they are
// side-quests reachable from the session that opened them, returning to it.
export const SUPPORTING_MODULES = [
  { id: 'golden-box',            route: '/smokecraft/golden-box',            label: 'Gold Box Rules',            requires: 'entry' },
  { id: 'mentor',                route: '/smokecraft/mentor-selection',      label: 'Mentor Selection',          requires: 'entry' },
  // Authoritative journey graph correction: Seed & Soil is the real next
  // step after Mentor Selection (not immediately after Format). Registered
  // here so KNOWN_ROUTES (Resume's self-heal validator) recognizes it.
  { id: 'seed-soil',             route: '/smokecraft/seed-soil',             label: 'Seed & Soil',               requires: 'mentor' },
  { id: 'wrapper-strength',      route: '/smokecraft/wrapper-strength',      label: 'Wrapper / Strength Education', requires: 'format' },
  { id: 'request-purchase',      route: '/smokecraft/request-purchase',      label: 'Request / Purchase',        requires: 'humidor-match' },
  { id: 'smokecraft-challenge',  route: '/smokecraft/smokecraft-challenge',  label: 'SmokeCraft Challenge',      requires: 'scorecard' },
  { id: 'second-humidor-match',  route: '/smokecraft/second-humidor-match',  label: 'Second Humidor Match',      requires: 'scorecard' },
  { id: 'mini-tasting',          route: '/smokecraft/mini-tasting',          label: 'Mini Tasting Round',        requires: 'scorecard' },
  { id: 'connections',           route: '/smokecraft/connections',           label: '360 Passport Connections',  requires: 'passport-stamp' },
  { id: 'management-sync',       route: '/smokecraft/management-sync',       label: 'Venue / Management Sync',   requires: 'passport-stamp' },
]

// ── Entry-layer screens — outside the 27-session numbered spine ────────────
// Five entry-layer screens precede the numbered spine, all outside
// TOTAL_SESSIONS (27) — they are never counted in spine completion, never
// numbered-session-guarded, and never award numbered-session XP. All five
// are now implemented (Package M added Venue Selection and Resume/Start New
// Journey; the other three were already live).
export const ENTRY_LAYER_SCREENS = [
  { id: 'launch',            route: '/smokecraft',              label: 'Launch',                        implemented: true },
  { id: 'sign-in',           route: '/smokecraft/enroll',       label: 'Sign In / Guest Mode',           implemented: true },
  { id: 'venue-select',      route: '/smokecraft/venue-select', label: 'Venue Selection',                implemented: true },
  { id: 'personal-dashboard',route: '/smokecraft/identity',     label: 'Personal Dashboard',             implemented: true },
  { id: 'resume',            route: '/smokecraft/resume',       label: 'Resume or Start New Journey',    implemented: true },
]

// A session is treated as satisfied for unlock purposes when it is a
// session with no built screen yet (implemented: false) — evidence can
// never be recorded for a session that does not exist, so it is skipped
// rather than fabricated as complete or left to permanently block every
// session after it. S1 (id 'entry') was previously always auto-satisfied
// as a stand-in for its not-yet-built screen (Package J); now that Welcome
// to Today's Experience (Package N) is real and implemented, it requires
// genuine evidence like any other session — the id 'entry' itself is kept
// unchanged (rather than renamed) so every existing completedSteps record
// and test fixture that already includes 'entry' remains valid.
function isSessionComplete(completedSteps, session) {
  const id = typeof session === 'string' ? session : session.id
  if (typeof session === 'object' && session.implemented === false) return true
  return completedSteps.includes(id)
}

/** Find which visit/session a given completedSteps id belongs to. */
export function getVisitForStepId(stepId) {
  for (const v of VISIT_STRUCTURE) {
    const s = v.sessions.find(s => s.id === stepId)
    if (s) return { visit: v.visit, session: s.session, visitTitle: v.title, sessionLabel: s.label }
  }
  return null
}

/** Phase 1 is always unlocked. Phase N unlocks only once every session in phase N-1 is complete. */
export function isVisitUnlocked(completedSteps, visitNumber) {
  if (visitNumber <= 1) return true
  const prevVisit = VISIT_STRUCTURE.find(v => v.visit === visitNumber - 1)
  if (!prevVisit) return true
  return prevVisit.sessions.every(s => isSessionComplete(completedSteps, s))
}

/** Returns the current phase/session pointer, derived from completedSteps — no separate counters to keep in sync. */
export function getVisitProgress(completedSteps) {
  for (const v of VISIT_STRUCTURE) {
    const nextSession = v.sessions.find(s => !isSessionComplete(completedSteps, s))
    if (nextSession) {
      return { visit: v.visit, session: nextSession.session, totalVisits: TOTAL_VISITS, totalSessions: TOTAL_SESSIONS, journeyComplete: false, round: getRoundForVisit(v.visit) }
    }
  }
  return { visit: TOTAL_VISITS, session: TOTAL_SESSIONS, totalVisits: TOTAL_VISITS, totalSessions: TOTAL_SESSIONS, journeyComplete: true, round: getRoundForVisit(TOTAL_VISITS) }
}

// ── Macro "Round" grouping ───────────────────────────────────────────────
// 3 macro-rounds covering the 6 phases:
// Round 1 = "Education & Setup"        = Phases 1-2
// Round 2 = "Tasting Experience"       = Phases 3-4
// Round 3 = "Challenge & Completion"   = Phases 5-6
export const TOTAL_ROUNDS = 3

export const ROUNDS = [
  { round: 1, title: 'Education & Setup',        visits: [1, 2] },
  { round: 2, title: 'Tasting Experience',        visits: [3, 4] },
  { round: 3, title: 'Challenge & Completion',    visits: [5, 6] },
]

export function getRoundForVisit(visitNumber) {
  if (visitNumber <= 2) return 1
  if (visitNumber <= 4) return 2
  return 3
}

/** Like getVisitProgress, but resolves visit/session/round from a specific stepId rather than the "next incomplete" pointer. */
export function getFullProgress(completedSteps) {
  return getVisitProgress(completedSteps)
}
