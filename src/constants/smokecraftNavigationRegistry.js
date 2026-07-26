// Holistic Fix 1 — SmokeCraft Shared Game Architecture: canonical
// navigation registry.
//
// WHY THIS FILE EXISTS
// --------------------
// `smokecraftLandingActions.js` already solved this exact problem for the
// Landing screen alone (one destination map instead of scattered inline
// route literals — see that file's own docstring for the two real defects
// that pattern prevents). Every later pass in this recovery operation
// (SC-D001 Welcome sidebar, SC-D010 Leaderboard sidebar, SC-D011/SC-D012
// Passport action cards, SC-D013 CraftHub bottom row) independently
// hand-wrote its own local `SIDEBAR_ITEMS`/`BOTTOM_STRIP_ITEMS` array with
// the same destinations repeated as new literals in each file. That was the
// correct minimal fix at the time (this operation's own rule: fix the
// concrete defect, do not redesign working screens), but it means the same
// "where does REWARDS/PASSPORT/CRAFTHUB/LEADERBOARD/COLLECTIONS/CHALLENGES/
// GOLDEN BOX/JOURNEY actually go" answer now lives in N places.
//
// This registry is the ONE place going forward. It does not yet replace the
// per-screen arrays (that is screen migration, explicitly out of scope for
// this holistic-architecture pass) — it is the enforceable target those
// per-screen arrays must be migrated to in Holistic Fix 2, and the
// authority `scripts/validateSmokecraftManifest.mjs` checks new/changed
// navigation literals against.
//
// Every destination below is a route that was independently confirmed, via
// real browser test in this operation, to actually resolve correctly (not
// guessed) — see SMOKECRAFT_SYSTEM_DEFECT_REGISTER.md for the specific
// commit/proof for each.
export const SMOKECRAFT_NAV_DESTINATIONS = Object.freeze({
  JOURNEY:      '/smokecraft/resume',
  CRAFTHUB:     '/smokecraft/crafthub',
  LEADERBOARD:  '/smokecraft/leaderboard',
  REWARDS:      '/smokecraft/rewards-center',
  PASSPORT:     '/smokecraft/passport',
  COLLECTIONS:  '/smokecraft/collections',
  CHALLENGES:   '/smokecraft/challenge-hub',
  GOLDEN_BOX:   '/smokecraft/golden-box',
  MENTOR:       '/smokecraft/mentor-selection',
  PAIRING:      '/smokecraft/pairing-lab',
  EVENTS:       '/smokecraft/event-challenge',
  CIGARS:       '/smokecraft/humidor-match',
  LOUNGE:       '/smokecraft',
  KNOWLEDGE:    '/smokecraft/knowledge-drop',
  HOME:         '/smokecraft',
})

// Real, existing top-level `/passport/*` module (a separate app from
// `/smokecraft/passport` — see SC-D011/SC-D012 in the defect register for
// the full story of how these were confused once already). Kept as its own
// group so a future migration never re-collapses them into one map.
export const SMOKECRAFT_PASSPORT_MODULE_DESTINATIONS = Object.freeze({
  SCAN:      '/passport/scan',
  DIRECTORY: '/passport/directory',
  EVENTS:    '/passport/events',
  BENEFITS:  '/passport/benefits',
  HOW_IT_WORKS: '/passport/how-it-works',
})

// Destinations that are advertised somewhere in an approved visual but have
// NO real backing feature anywhere in this codebase. Per this operation's
// honest-disable rule, any control pointing at one of these must render as
// a real, focusable, `disabled` control with an accessible name ending in
// "(not yet available)" — never a fabricated route, never a silently dead
// hotspot. Confirmed absent via route inventory each time an item was added
// here; do not remove an entry without re-confirming a real route now exists.
export const SMOKECRAFT_HONEST_DISABLED_DESTINATIONS = Object.freeze([
  'passport-view-matches',
  'leaderboard-settings',
  'welcome-settings',
  'crafthub-staff-handoff',
])

/**
 * Resolves a canonical destination key to its route. Returns null for an
 * unknown key rather than guessing — callers must treat null as "this
 * control has no real destination" and fall back to the honest-disable
 * pattern, never a fabricated navigate() target.
 */
export function resolveSmokeCraftNavDestination(key) {
  return SMOKECRAFT_NAV_DESTINATIONS[key] ?? SMOKECRAFT_PASSPORT_MODULE_DESTINATIONS[key] ?? null
}

/** All routes this registry currently knows about, for validation. */
export function allRegisteredNavRoutes() {
  return [
    ...Object.values(SMOKECRAFT_NAV_DESTINATIONS),
    ...Object.values(SMOKECRAFT_PASSPORT_MODULE_DESTINATIONS),
  ]
}
