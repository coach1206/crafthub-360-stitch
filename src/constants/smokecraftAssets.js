/**
 * SmokeCraft Approved Asset Manifest
 *
 * Single source of truth for every image used across the SmokeCraft 18-step journey
 * and all supporting screens. All paths are relative to public/ (served as /...).
 *
 * IMPORTANT: Page JSX files have hardcoded src paths — they do NOT import from here.
 * This manifest documents what each route renders. To change a displayed image, update
 * the JSX page file directly AND update the constant here to keep them in sync.
 *
 * Naming convention for approved assets:
 *   /assets/smokecraft-reference/approved/smokecraft-<screen>.png
 *   /assets/smokecraft-reference/approved/batch-22/<filename>   (Batch 22 upgrades)
 *
 * Known issues (do not silently hide):
 *   FIRST_THIRD — no unique approved image exists; approved/smokecraft-first-third.png
 *   is MD5-identical to smokecraft-final-third.png (repo naming error). The React overlay
 *   provides the correct "First Third" labeling. Batch 22 contains no distinct first-third
 *   image. When a distinct first-third visual is approved, update FIRST_THIRD here only.
 *
 *   SESSION_COMPLETE — smokecraft-session-complete.png has stale "SESSION 23 OF 24" baked
 *   in. Session Complete uses a CSS gradient background intentionally (no image).
 *
 *   LANDING — SmokeCraft.jsx hardcodes /PROFILE DISCOVER 11.png (root public/). Hotspot
 *   coordinates were calibrated to that specific image. Do not change without recalibrating
 *   all hotspot x/y/width/height values in SmokeCraft.jsx.
 *
 * Stale-header screens (baked text in image top bar):
 *   SECOND_THIRD — approved image has "ROUND 3 OF 3 · VISIT 7 OF 8 · SESSION 17 OF 24"
 *   baked into the top 40px ticker bar. SecondThird.jsx renders a React cover strip over
 *   this area. Do not remove that strip.
 *
 * Batch 22 active upgrade (2026-07-11):
 *   PAIRING_LAB — updated to batch-22/pairing lab hotspot.png (landscape, better viewport fit).
 *   All other journey routes continue to use approved/ originals which are dedicated, clean
 *   step-specific screens with no stale text. Batch 22 alternates are preserved on disk for
 *   future consideration. Locked-state images retained as new exports.
 */

const BASE    = '/assets/smokecraft-reference/approved'
const BATCH22 = '/assets/smokecraft-reference/approved/batch-22'

// ── Landing ────────────────────────────────────────────────────────────────────
// SmokeCraft.jsx hardcodes /PROFILE DISCOVER 11.png — DO NOT CHANGE without
// recalibrating all hotspot coordinates in SmokeCraft.jsx.
export const LANDING = '/PROFILE DISCOVER 11.png'

// ── Core 18-step journey ───────────────────────────────────────────────────────
// Identity.jsx uses smokecraft-profile-capture.png (entry gate form visual).
// smokecraft-entry-gate.png is used by the Enroll (/smokecraft/enroll) route.
export const IDENTITY         = `${BASE}/smokecraft-profile-capture.png`
export const ENROLL           = `${BASE}/smokecraft-entry-gate.png`
export const GOLDEN_BOX       = `${BASE}/smokecraft-gold-box-rules.png`
export const MENTOR_SELECTION = `${BASE}/smokecraft-mentor-selection.png`
export const SEED_SOIL        = `${BASE}/smokecraft-seed-soil.png`
// Batch 22: pairing lab hotspot.png — landscape, full pairing form; better landscape viewport fit
// than the portrait approved/ original. JSX updated 2026-07-11.
export const PAIRING_LAB      = `${BATCH22}/pairing lab hotspot.png`
export const HUMIDOR_MATCH    = `${BASE}/smokecraft-humidor-match.png`
export const REQUEST_PURCHASE = `${BASE}/smokecraft-request-purchase.png`
export const CUT_TOAST_LIGHT  = `${BASE}/smokecraft-cut-toast-light.png`

// First Third: uses final-third background (same image, no distinct first-third exists).
// Batch 22 has no distinct first-third image. React overlay relabels correctly.
// Replace with dedicated asset when approved.
export const FIRST_THIRD      = `${BASE}/smokecraft-final-third.png`

export const SECOND_THIRD     = `${BASE}/smokecraft-second-third.png`
export const FLAVOR_MEMORY    = `${BASE}/smokecraft-flavor-memory.png`
export const FINAL_THIRD      = `${BASE}/smokecraft-final-third.png`
export const SCORECARD        = `${BASE}/smokecraft-scorecard-ranking.png`
export const FINAL_REVIEW     = `${BASE}/smokecraft-final-review.png`
export const PASSPORT_STAMP   = `${BASE}/smokecraft-passport-stamp.png`
export const CONNECTIONS      = `${BASE}/smokecraft-passport-connection.png`
export const MANAGEMENT_SYNC  = `${BASE}/smokecraft-venue-management-sync.png`
// Session Complete: intentionally no image (CSS gradient). Image has stale
// "SESSION 23 OF 24" text baked in. Set to null as a sentinel.
export const SESSION_COMPLETE = null

// ── Support / supplementary screens ───────────────────────────────────────────
export const HOW_IT_WORKS         = `${BASE}/smokecraft-how-it-works.png`
export const GUEST_PASS           = `${BASE}/smokecraft-guest-pass.png`
export const EVENT_CHALLENGE      = `${BASE}/smokecraft-event-challenge.png`
export const GOLDEN_BOX_STATUS    = `${BASE}/smokecraft-golden-box-status.png`
export const LEADERBOARD          = `${BASE}/smokecraft-leaderboard.png`
export const ORIGINS              = `${BASE}/smokecraft-origins.png`
export const TERROIR              = `${BASE}/smokecraft-terroir.png`
export const PAIRING_MASTERY      = `${BASE}/smokecraft-pairing-mastery.png`
export const PAIRING              = `${BASE}/smokecraft-pairing.png`
export const SECOND_HUMIDOR_MATCH = `${BASE}/smokecraft-second-humidor-match.png`
export const FLAVOR_DNA           = `${BASE}/smokecraft-flavor-dna.png`
export const SCAN                 = `${BASE}/smokecraft-scan.png`
export const ART                  = `${BASE}/smokecraft-art.png`
export const VITOLA               = `${BASE}/smokecraft-vitola.png`
export const MINI_TASTING_ROUND   = `${BASE}/smokecraft-mini-tasting-round.png`
export const CHALLENGE            = `${BASE}/smokecraft-challenge.png`
export const PROFILE_CAPTURE      = `${BASE}/smokecraft-profile-capture.png`

// ── Locked-state screens (Batch 22) ───────────────────────────────────────────
// These show locked/future content. Stale session counts baked in header — use as
// background only; React overlay provides live state indicators.
export const FUTURE_VISIT_LOCKED      = `${BATCH22}/smokecraft-future-visit-locked.png`
export const PASSPORT_STAMP_LOCKED    = `${BATCH22}/smokecraft-passport-stamp-locked.png`
export const MANAGEMENT_SYNC_LOCKED   = `${BATCH22}/smokecraft-management-sync-locked.png`

// ── Batch 22 alternates (on disk, not currently active in any route) ──────────
// These are available if a route needs to swap to a batch-22 visual. Update the
// route's JSX src path AND the matching constant above when activating.
export const BATCH22_ALTERNATES = {
  GOLDEN_BOX:       `${BATCH22}/smokraft goldenbox rules.png`,
  REQUEST_PURCHASE: `${BATCH22}/request-purchase11.png`,
  FINAL_THIRD_COCO: `${BATCH22}/fianal third coco & coffee.png`,
  SCORECARD:        `${BATCH22}/smokecraft-scorecard.11png.png`,
  FINAL_REVIEW:     `${BATCH22}/Final Review hotspot.png`,
  PASSPORT_STAMP:   `${BATCH22}/passport-certified-final.png`,
  CONNECTIONS:      `${BATCH22}/passport-connection-1.png`,
  MINI_TASTING:     `${BATCH22}/mini tasting .png`,
  GUEST_PASS:       `${BATCH22}/smokecraft-guest-pass.png`,
  EVENT_CHALLENGE:  `${BATCH22}/smokecraft-event-challenge.png`,
  ORIGINS:          `${BATCH22}/smokecraft-origins.png`,
  PAIRING_MASTERY:  `${BATCH22}/smokecraft-pairing-mastery.png`,
  CHALLENGE:        `${BATCH22}/smokecraft-challenge-bg.jpg`,
  LANDING:          `${BATCH22}/discover-your-profile-111.png`,
}

// ── Manifest table (for admin / diagnostic screens) ──────────────────────────
export const SMOKECRAFT_ASSET_MANIFEST = [
  // Route                            | Asset constant          | Type                   | Stale text? | Live overlay?
  { route: '/smokecraft',             asset: LANDING,            type: 'landing',          stale: false, overlay: 'hotspots',    note: 'hardcoded /PROFILE DISCOVER 11.png; hotspot-calibrated — do not swap without recalibration' },
  { route: '/smokecraft/identity',    asset: IDENTITY,           type: 'journey',          stale: false, overlay: 'live-form' },
  { route: '/smokecraft/golden-box',  asset: GOLDEN_BOX,         type: 'journey',          stale: false, overlay: 'hotspots' },
  { route: '/smokecraft/mentor-selection', asset: MENTOR_SELECTION, type: 'journey',       stale: false, overlay: 'live-panel' },
  { route: '/smokecraft/seed-soil',   asset: SEED_SOIL,          type: 'journey',          stale: false, overlay: 'hotspots' },
  { route: '/smokecraft/pairing-lab', asset: PAIRING_LAB,        type: 'journey',          stale: false, overlay: 'hotspots',    note: 'batch-22: pairing lab hotspot.png — landscape, better viewport fit than portrait original' },
  { route: '/smokecraft/humidor-match', asset: HUMIDOR_MATCH,    type: 'journey',          stale: false, overlay: 'hotspots' },
  { route: '/smokecraft/request-purchase', asset: REQUEST_PURCHASE, type: 'journey',       stale: false, overlay: 'live-panel' },
  { route: '/smokecraft/cut-toast-light', asset: CUT_TOAST_LIGHT, type: 'journey',         stale: false, overlay: 'live-panel' },
  { route: '/smokecraft/first-third', asset: FIRST_THIRD,        type: 'journey',          stale: false, overlay: 'live-panel',  note: 'shares visual with final-third; no distinct approved image yet' },
  { route: '/smokecraft/second-third', asset: SECOND_THIRD,      type: 'journey',          stale: true,  overlay: 'live-panel',  note: 'stale ROUND/VISIT/SESSION header baked in top bar; React cover strip applied' },
  { route: '/smokecraft/flavor-memory', asset: FLAVOR_MEMORY,    type: 'journey',          stale: false, overlay: 'live-panel' },
  { route: '/smokecraft/final-third', asset: FINAL_THIRD,        type: 'journey',          stale: false, overlay: 'live-panel' },
  { route: '/smokecraft/scorecard',   asset: SCORECARD,          type: 'journey',          stale: false, overlay: 'hotspots' },
  { route: '/smokecraft/final-review', asset: FINAL_REVIEW,      type: 'journey',          stale: false, overlay: 'live-panel' },
  { route: '/smokecraft/passport-stamp', asset: PASSPORT_STAMP,  type: 'journey',          stale: false, overlay: 'hotspots' },
  { route: '/smokecraft/connections', asset: CONNECTIONS,         type: 'journey',          stale: false, overlay: 'hotspots' },
  { route: '/smokecraft/management-sync', asset: MANAGEMENT_SYNC, type: 'journey',         stale: false, overlay: 'live-panel' },
  // Support screens
  { route: '/smokecraft/how-it-works',     asset: HOW_IT_WORKS,         type: 'support',   stale: false, overlay: 'hotspots' },
  { route: '/smokecraft/guest-pass',       asset: GUEST_PASS,           type: 'support',   stale: false, overlay: 'hotspots' },
  { route: '/smokecraft/event-challenge',  asset: EVENT_CHALLENGE,      type: 'support',   stale: false, overlay: 'none' },
  { route: '/smokecraft/golden-box-status', asset: GOLDEN_BOX_STATUS,   type: 'support',   stale: false, overlay: 'none' },
  { route: '/smokecraft/leaderboard',      asset: LEADERBOARD,          type: 'support',   stale: false, overlay: 'none' },
  { route: '/smokecraft/origins',          asset: ORIGINS,              type: 'support',   stale: false, overlay: 'none' },
  { route: '/smokecraft/terroir',          asset: TERROIR,              type: 'support',   stale: false, overlay: 'none' },
  { route: '/smokecraft/pairing-mastery',  asset: PAIRING_MASTERY,      type: 'support',   stale: false, overlay: 'none' },
  { route: '/smokecraft/second-humidor-match', asset: SECOND_HUMIDOR_MATCH, type: 'support', stale: false, overlay: 'none' },
  { route: '/smokecraft/mini-tasting-round', asset: MINI_TASTING_ROUND, type: 'support',   stale: false, overlay: 'none' },
  { route: '/smokecraft/scan',             asset: SCAN,                 type: 'support',   stale: false, overlay: 'none' },
  { route: '/smokecraft/flavor-dna',       asset: FLAVOR_DNA,           type: 'support',   stale: false, overlay: 'none' },
  { route: '/smokecraft/enroll',           asset: ENROLL,               type: 'support',   stale: false, overlay: 'hotspots',   note: 'entry gate form screen' },
  { route: '/smokecraft/art',              asset: ART,                  type: 'support',   stale: false, overlay: 'none' },
  { route: '/smokecraft/vitola',           asset: VITOLA,               type: 'support',   stale: false, overlay: 'none' },
  { route: '/smokecraft/pairing',          asset: PAIRING,              type: 'support',   stale: false, overlay: 'none' },
  { route: '/smokecraft/challenge',        asset: CHALLENGE,            type: 'support',   stale: false, overlay: 'none' },
  // Session complete: CSS gradient — stale PNG rejected
  // smokecraft-session-complete.png has "SESSION 23 OF 24" baked in; null = intentional
  { route: '/smokecraft/session-complete', asset: SESSION_COMPLETE,     type: 'journey',   stale: true,  overlay: 'css-gradient', note: 'live React screen; no image' },
]

export default SMOKECRAFT_ASSET_MANIFEST
