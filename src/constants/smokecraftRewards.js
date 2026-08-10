/**
 * SmokeCraft XP + Badge reward map.
 *
 * Single source of truth for XP/badge amounts. Do NOT scatter XP values into
 * individual page files. Each entry is keyed by the stepId passed to
 * completeStep().
 *
 * Badge ids must be stable strings — they are stored in session.badges and
 * checked for duplicates before award. Use kebab-case.
 *
 * NOTE (Session-Sequence-Reconciliation pass): the `visit`/`sessionNumber`
 * fields below use a legacy 8-visit/24-session numbering that predates and
 * does not match the locked 27-session/6-phase VISIT_STRUCTURE in
 * session.js. Confirmed no consumer of this file ever reads `.visit` or
 * `.sessionNumber` for display or ordering (only `id`/`label`/`xp` are
 * consumed) — this numbering is inert bookkeeping, not a competing live
 * registry. Not renumbered in this pass to avoid an unreviewed rewrite of
 * every badge/XP id; do not treat these fields as authoritative session
 * order — use VISIT_STRUCTURE in session.js for that.
 */

// ── Badge catalogue ───────────────────────────────────────────────────────────
export const SMOKECRAFT_BADGES = {
  // Visit 1
  PROFILE_STARTED:     { id: 'sc-profile-started',      label: 'Profile Started',          visit: 1 },
  GOLD_BOX_ENTRY:      { id: 'sc-gold-box-entry',        label: 'Gold Box Entry',            visit: 1 },
  MENTOR_PAIR:         { id: 'sc-mentor-pair',           label: 'Mentor Pair',               visit: 1 },
  // Visit 2
  CIGAR_FORMAT:        { id: 'sc-cigar-format',          label: 'Cigar Format',              visit: 2 },
  WRAPPER_KNOWLEDGE:   { id: 'sc-wrapper-knowledge',     label: 'Wrapper Knowledge',         visit: 2 },
  BURN_TIME:           { id: 'sc-burn-time',             label: 'Burn Time',                 visit: 2 },
  // Visit 3
  SEED_AND_SOIL:       { id: 'sc-seed-and-soil',         label: 'Seed & Soil',               visit: 3 },
  PAIRING_EXPLORER:    { id: 'sc-pairing-explorer',      label: 'Pairing Explorer',          visit: 3 },
  ORIGIN_KNOWLEDGE:    { id: 'sc-origin-knowledge',      label: 'Origin Knowledge',          visit: 3 },
  // Visit 4
  FIRST_SMOKE:         { id: 'sc-first-smoke',           label: 'First Official Smoke',      visit: 4 },
  CUT_AND_LIGHT:       { id: 'sc-cut-and-light',         label: 'Cut & Light',               visit: 4 },
  FIRST_THIRD:         { id: 'sc-first-third',           label: 'First Third',               visit: 4 },
  // Visit 5
  FLAVOR_TRACKER:      { id: 'sc-flavor-tracker',        label: 'Flavor Tracker',            visit: 5 },
  SECOND_THIRD:        { id: 'sc-second-third',          label: 'Second Third',              visit: 5 },
  TRANSITION:          { id: 'sc-transition',            label: 'Transition',                visit: 5 },
  // Visit 6
  FINAL_THIRD:         { id: 'sc-final-third',           label: 'Final Third',               visit: 6 },
  CIGAR_REVIEW:        { id: 'sc-cigar-review',          label: 'Completed Cigar Review',    visit: 6 },
  SCORECARD:           { id: 'sc-scorecard',             label: 'SmokeCraft Scorecard',      visit: 6 },
  // Visit 7
  CHALLENGE:           { id: 'sc-challenge',             label: 'Challenge',                 visit: 7 },
  SECOND_CIGAR:        { id: 'sc-second-cigar',          label: 'Second Cigar',              visit: 7 },
  TASTE_GROWTH:        { id: 'sc-taste-growth',          label: 'Taste Growth',              visit: 7 },
  // Visit 8
  PASSPORT_STAMP:      { id: 'sc-passport-stamp',        label: 'SmokeCraft Passport Stamp', visit: 8 },
  CONNECTIONS_ACCESS:  { id: 'sc-connections-access',    label: 'Passport Connections',      visit: 8 },
  VIP_CANDIDATE:       { id: 'sc-vip-candidate',         label: 'VIP Candidate Signal',      visit: 8 },
  NEXT_SEASON:         { id: 'sc-next-season',           label: 'Next SmokeCraft Season',    visit: 8 },
}

// ── Per-session reward definitions ────────────────────────────────────────────
// xp      — awarded once when this session is first completed
// badges  — awarded when the containing visit is fully completed (see awardVisitBadges)
//           OR immediately when the session itself completes (sessionBadges)
// rankImpact — informational only; actual rank computed from total XP via getRankFromXP
// unlockSignal — what this completion enables (informational; lock logic lives in smokecraftJourney.js)
export const SESSION_REWARDS = {
  // ── Visit 1 ────────────────────────────────────────────────────────────────
  entry: {
    sessionNumber: 1, visit: 1, xp: 0,
    sessionBadges: [],
    unlockSignal: 'enroll',
  },
  enroll: {
    sessionNumber: 2, visit: 1, xp: 75,
    sessionBadges: [SMOKECRAFT_BADGES.PROFILE_STARTED],
    unlockSignal: 'identity',
  },
  // Navigation Authority pass — Identity is a real, required entry-layer
  // step between Guest Pass and Venue Selection (see
  // smokecraftEntryReadiness.js). Its own completion badge/XP entry so
  // awardSessionRewards('identity') from Identity.jsx's Begin control is a
  // genuine, distinct step rather than re-using 'enroll'.
  identity: {
    sessionNumber: null, visit: 1, xp: 50,
    sessionBadges: [],
    unlockSignal: 'venue-select',
  },
  'golden-box': {
    sessionNumber: 3, visit: 1, xp: 75,
    sessionBadges: [SMOKECRAFT_BADGES.GOLD_BOX_ENTRY],
    unlockSignal: 'mentor',
  },
  mentor: {
    sessionNumber: 4, visit: 1, xp: 100,
    sessionBadges: [SMOKECRAFT_BADGES.MENTOR_PAIR],
    unlockSignal: 'visit-2',
  },
  // Required-Interaction Closure Package D defect fix: these two entries
  // were missing entirely — awardSessionRewards() hard-returns when
  // getSessionRewards(sessionId) is null (see below), so Sessions 3
  // (Meet Your Cigar) and 4 (Terroir) could never actually complete
  // server-side through the real completion path; the client would
  // silently no-op and navigate forward regardless. Not previously
  // caught because completion was never verified end-to-end for these
  // two sessions before this pass. XP amount matches the standard
  // per-session value used throughout this table; no new badge is
  // invented for either.
  'meet-your-cigar': {
    sessionNumber: null, visit: 1, xp: 75,
    sessionBadges: [],
    unlockSignal: 'terroir',
  },
  terroir: {
    sessionNumber: null, visit: 1, xp: 75,
    sessionBadges: [],
    unlockSignal: 'format',
  },

  // ── Visit 2 ────────────────────────────────────────────────────────────────
  format: {
    sessionNumber: 5, visit: 2, xp: 75,
    sessionBadges: [SMOKECRAFT_BADGES.CIGAR_FORMAT, SMOKECRAFT_BADGES.BURN_TIME],
    unlockSignal: 'wrapper-strength',
  },
  'wrapper-strength': {
    sessionNumber: 6, visit: 2, xp: 75,
    sessionBadges: [SMOKECRAFT_BADGES.WRAPPER_KNOWLEDGE],
    unlockSignal: 'visit-3',
  },

  // ── Visit 3 ────────────────────────────────────────────────────────────────
  'seed-soil': {
    sessionNumber: 7, visit: 3, xp: 75,
    sessionBadges: [SMOKECRAFT_BADGES.SEED_AND_SOIL, SMOKECRAFT_BADGES.ORIGIN_KNOWLEDGE],
    unlockSignal: 'pairing-lab',
  },
  'pairing-lab': {
    sessionNumber: 8, visit: 3, xp: 75,
    sessionBadges: [SMOKECRAFT_BADGES.PAIRING_EXPLORER],
    unlockSignal: 'visit-4',
  },

  // ── Visit 4 ────────────────────────────────────────────────────────────────
  'humidor-match': {
    sessionNumber: 9, visit: 4, xp: 75,
    sessionBadges: [SMOKECRAFT_BADGES.FIRST_SMOKE],
    unlockSignal: 'request-purchase',
  },
  'request-purchase': {
    sessionNumber: 10, visit: 4, xp: 50,
    sessionBadges: [],
    unlockSignal: 'cut-toast-light',
  },
  'cut-toast-light': {
    sessionNumber: 11, visit: 4, xp: 50,
    sessionBadges: [SMOKECRAFT_BADGES.CUT_AND_LIGHT],
    unlockSignal: 'first-third',
  },
  // Full Real Browser Journey closure pass defect fix (SC-D078): this
  // entry, and 'mentor-commentary'/'knowledge-drop'/'ai-summary'/
  // 'pairing-recommendations' below, were missing entirely — same defect
  // class already documented above for meet-your-cigar/terroir
  // (Required-Interaction Closure Package D). awardSessionRewards() hard-
  // returns when getSessionRewards(sessionId) is null, so completing
  // Lighting Tutorial (S7) through the real UI was a silent no-op:
  // XP was never awarded, completedSteps never recorded 'lighting-tutorial',
  // and every session after it (S8 onward) stayed permanently locked for a
  // real player — even though the client-only 62/62 fresh-player suite
  // never caught this, because it completes sessions via a separate,
  // direct server completion endpoint that never reads this table.
  // Confirmed via a real, fresh, browser-click walkthrough (not backend
  // API calls) that reached this exact lock screen after fully completing
  // the Lighting Tutorial wizard (8/8 steps viewed, Continue enabled and
  // clicked) and surviving a hard page reload — ruling out a render race.
  'lighting-tutorial': {
    sessionNumber: null, visit: 4, xp: 75,
    sessionBadges: [],
    unlockSignal: 'first-third',
  },
  'first-third': {
    sessionNumber: 12, visit: 4, xp: 100,
    sessionBadges: [SMOKECRAFT_BADGES.FIRST_THIRD],
    unlockSignal: 'visit-5',
  },

  // ── Visit 5 ────────────────────────────────────────────────────────────────
  'second-third': {
    sessionNumber: 13, visit: 5, xp: 75,
    sessionBadges: [SMOKECRAFT_BADGES.SECOND_THIRD],
    unlockSignal: 'flavor-memory',
  },
  // SC-D078 (see 'lighting-tutorial' above for the full defect writeup) —
  // same missing-entry defect, same fix.
  'mentor-commentary': {
    sessionNumber: null, visit: 5, xp: 75,
    sessionBadges: [],
    unlockSignal: 'knowledge-drop',
  },
  'knowledge-drop': {
    sessionNumber: null, visit: 5, xp: 75,
    sessionBadges: [],
    unlockSignal: 'visit-6',
  },
  'flavor-memory': {
    sessionNumber: 14, visit: 5, xp: 75,
    sessionBadges: [SMOKECRAFT_BADGES.FLAVOR_TRACKER, SMOKECRAFT_BADGES.TRANSITION],
    unlockSignal: 'visit-6',
  },

  // ── Visit 6 ────────────────────────────────────────────────────────────────
  'final-third': {
    sessionNumber: 15, visit: 6, xp: 75,
    sessionBadges: [SMOKECRAFT_BADGES.FINAL_THIRD],
    unlockSignal: 'scorecard',
  },
  scorecard: {
    sessionNumber: 16, visit: 6, xp: 100,
    sessionBadges: [SMOKECRAFT_BADGES.CIGAR_REVIEW, SMOKECRAFT_BADGES.SCORECARD],
    unlockSignal: 'visit-7',
  },

  // ── Visit 7 ────────────────────────────────────────────────────────────────
  'smokecraft-challenge': {
    sessionNumber: 17, visit: 7, xp: 75,
    sessionBadges: [SMOKECRAFT_BADGES.CHALLENGE],
    unlockSignal: 'second-humidor-match',
  },
  'second-humidor-match': {
    sessionNumber: 18, visit: 7, xp: 75,
    sessionBadges: [SMOKECRAFT_BADGES.SECOND_CIGAR],
    unlockSignal: 'mini-tasting',
  },
  'mini-tasting': {
    sessionNumber: 19, visit: 7, xp: 75,
    sessionBadges: [SMOKECRAFT_BADGES.TASTE_GROWTH],
    unlockSignal: 'visit-8',
  },

  // ── Visit 8 ────────────────────────────────────────────────────────────────
  'final-review': {
    sessionNumber: 20, visit: 8, xp: 100,
    sessionBadges: [],
    unlockSignal: 'passport-stamp',
  },
  // SC-D078 (see 'lighting-tutorial' above for the full defect writeup) —
  // same missing-entry defect, same fix.
  'ai-summary': {
    sessionNumber: null, visit: 8, xp: 75,
    sessionBadges: [],
    unlockSignal: 'pairing-recommendations',
  },
  'pairing-recommendations': {
    sessionNumber: null, visit: 8, xp: 75,
    sessionBadges: [],
    unlockSignal: 'passport-stamp',
  },
  'passport-stamp': {
    sessionNumber: 21, visit: 8, xp: 75,
    sessionBadges: [SMOKECRAFT_BADGES.PASSPORT_STAMP],
    unlockSignal: 'connections',
  },
  connections: {
    sessionNumber: 22, visit: 8, xp: 50,
    sessionBadges: [SMOKECRAFT_BADGES.CONNECTIONS_ACCESS],
    unlockSignal: 'management-sync',
  },
  'management-sync': {
    sessionNumber: 23, visit: 8, xp: 50,
    sessionBadges: [SMOKECRAFT_BADGES.VIP_CANDIDATE],
    unlockSignal: 'session-complete',
  },
  'session-complete': {
    sessionNumber: 24, visit: 8, xp: 50,
    sessionBadges: [SMOKECRAFT_BADGES.NEXT_SEASON],
    unlockSignal: 'journey-complete',
  },

  // ── Package L additions — new 27-session spine ids (S25 Rewards and XP,
  // S26 Achievements) ─────────────────────────────────────────────────────
  // sessionNumber/visit below reuse the OLD 24-session/8-visit numbering
  // scheme already used throughout this file (unused elsewhere — purely
  // descriptive, see file header) and are not meaningful outside this table.
  // These two entries exist so awardSessionRewards('rewards' |
  // 'achievements') can actually mark the sessions complete: without an
  // entry here, awardSessionRewards() is a documented no-op (see its
  // `if (!rewards) return` guard in GuestSessionContext.jsx), which would
  // otherwise leave S25/S26 permanently uncompletable outside demo mode.
  // No new badges invented — modest completion XP only, matching the value
  // already used for comparable filler sessions elsewhere in this table
  // (e.g. 'request-purchase', 'connections').
  rewards: {
    sessionNumber: 25, visit: 8, xp: 50,
    sessionBadges: [],
    unlockSignal: 'achievements',
  },
  achievements: {
    sessionNumber: 26, visit: 8, xp: 50,
    sessionBadges: [],
    unlockSignal: 'session-complete',
  },
}

// ── Helper: session rewards lookup ────────────────────────────────────────────

/** Returns the reward definition for a session id, or null if unknown. */
export function getSessionRewards(sessionId) {
  return SESSION_REWARDS[sessionId] ?? null
}

/** Returns all session reward definitions for a visit number. */
export function getVisitRewards(visitNumber) {
  return Object.entries(SESSION_REWARDS)
    .filter(([, r]) => r.visit === visitNumber)
    .map(([id, r]) => ({ id, ...r }))
}

// ── Helper: earned state queries ──────────────────────────────────────────────

/**
 * Returns total SmokeCraft XP earned so far based on completedSteps.
 * Only counts XP for sessions that appear in SESSION_REWARDS.
 */
export function getSmokeCraftXP(completedSteps) {
  return completedSteps.reduce((sum, id) => {
    return sum + (SESSION_REWARDS[id]?.xp ?? 0)
  }, 0)
}

/**
 * Returns all badges earned so far based on completedSteps.
 * Includes sessionBadges from every completed session.
 * Deduplicates by badge id.
 */
export function getEarnedBadges(completedSteps) {
  const seen = new Set()
  const badges = []
  for (const id of completedSteps) {
    const rewards = SESSION_REWARDS[id]
    if (!rewards) continue
    for (const badge of rewards.sessionBadges) {
      if (!seen.has(badge.id)) {
        seen.add(badge.id)
        badges.push(badge)
      }
    }
  }
  return badges
}

/**
 * Returns true when every session in the given visit is in completedSteps.
 * 'entry' (S1) is always treated as complete.
 */
export function isVisitComplete(visitNumber, completedSteps) {
  const sessions = getVisitRewards(visitNumber)
  return sessions.every(s => s.id === 'entry' || completedSteps.includes(s.id))
}

/**
 * Returns the unlock signal for the most recent completed session,
 * i.e. what gate just opened.
 */
export function getNextUnlock(completedSteps) {
  // Returns the sessionId of the first session not yet completed (in journey order).
  // Returns 'journey-complete' when all sessions are done.
  const ordered = Object.entries(SESSION_REWARDS)
    .sort(([, a], [, b]) => a.sessionNumber - b.sessionNumber)
  for (const [id] of ordered) {
    if (id === 'entry') continue
    if (!completedSteps.includes(id)) return id
  }
  return 'journey-complete'
}

// ── Rank thresholds (SmokeCraft-specific, aligned with session.js RANKS) ──────
export const SC_RANKS = [
  { name: 'Novice',      minXP: 0,    icon: 'emoji_events',      color: '#9a8f80' },
  { name: 'Enthusiast',  minXP: 200,  icon: 'star',              color: '#e9c176' },
  { name: 'Connoisseur', minXP: 500,  icon: 'military_tech',     color: '#ffb95a' },
  { name: 'Aficionado',  minXP: 900,  icon: 'workspace_premium', color: '#e9c176' },
]

export function getSmokeCraftRank(xp) {
  for (let i = SC_RANKS.length - 1; i >= 0; i--) {
    if (xp >= SC_RANKS[i].minXP) return SC_RANKS[i]
  }
  return SC_RANKS[0]
}
