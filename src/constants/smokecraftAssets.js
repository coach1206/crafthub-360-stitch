/**
 * SmokeCraft Approved Asset Manifest
 *
 * Single source of truth for every image used across the SmokeCraft 18-step journey
 * and all supporting screens. All paths are relative to public/ (served as /...).
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
 * Stale-header screens (baked text in image top bar):
 *   SECOND_THIRD — approved image has "ROUND 3 OF 3 · VISIT 7 OF 8 · SESSION 17 OF 24"
 *   baked into the top 40px ticker bar. SecondThird.jsx renders a React cover strip over
 *   this area. Do not remove that strip.
 *
 * Batch 22 upgrades (2026-07-11):
 *   PAIRING_LAB, FINAL_REVIEW, FINAL_THIRD, REQUEST_PURCHASE, SCORECARD, CONNECTIONS,
 *   PASSPORT_STAMP, MINI_TASTING_ROUND, GOLDEN_BOX, PAIRING_MASTERY, EVENT_CHALLENGE,
 *   GUEST_PASS, ORIGINS, CHALLENGE updated to batch-22 images. Old originals kept on
 *   disk — do not delete them. Locked-state images added as new exports.
 */

const BASE    = '/assets/smokecraft-reference/approved'
const BATCH22 = '/assets/smokecraft-reference/approved/batch-22'

// ── Landing ────────────────────────────────────────────────────────────────────
export const LANDING = `${BATCH22}/discover-your-profile-111.png`

// ── Core 18-step journey ───────────────────────────────────────────────────────
// Identity.jsx uses smokecraft-profile-capture.png (entry gate form visual).
// smokecraft-entry-gate.png is used by the Enroll (/smokecraft/enroll) route.
export const IDENTITY         = `${BASE}/smokecraft-profile-capture.png`
export const ENROLL           = `${BASE}/smokecraft-entry-gate.png`
// Batch 22: smokraft goldenbox rules.png — "Rules of Play" kiosk edition, clean, no stale text
export const GOLDEN_BOX       = `${BATCH22}/smokraft goldenbox rules.png`
export const MENTOR_SELECTION = `${BASE}/smokecraft-mentor-selection.png`
export const SEED_SOIL        = `${BASE}/smokecraft-seed-soil.png`
// Batch 22: pairing lab hotspot.png — STEP 12 OF 17, landscape, full pairing form, ticker visible
// (ticker is outside the live-panel area; overlay sits below it — no cover strip needed)
export const PAIRING_LAB      = `${BATCH22}/pairing lab hotspot.png`
export const HUMIDOR_MATCH    = `${BASE}/smokecraft-humidor-match.png`
// Batch 22: request-purchase11.png — STEP 7 OF 17, clean landscape layout
export const REQUEST_PURCHASE = `${BATCH22}/request-purchase11.png`
export const CUT_TOAST_LIGHT  = `${BASE}/smokecraft-cut-toast-light.png`

// First Third: uses final-third background (same image, no distinct first-third exists).
// Batch 22 has no distinct first-third image. React overlay relabels correctly.
// Replace with dedicated asset when approved.
export const FIRST_THIRD      = `${BASE}/smokecraft-final-third.png`

export const SECOND_THIRD     = `${BASE}/smokecraft-second-third.png`
export const FLAVOR_MEMORY    = `${BASE}/smokecraft-flavor-memory.png`
// Batch 22: fianal third coco & coffee.png — STEP 11 OF 17, cocoa/coffee BG, richest visual
export const FINAL_THIRD      = `${BATCH22}/fianal third coco & coffee.png`
// Batch 22: smokecraft-scorecard.11png.png — full 0-40 scoring breakdown, STEP 12 OF 17
export const SCORECARD        = `${BATCH22}/smokecraft-scorecard.11png.png`
// Batch 22: Final Review hotspot.png — STEP 16 OF 17, portrait, clean layout
export const FINAL_REVIEW     = `${BATCH22}/Final Review hotspot.png`
// Batch 22: passport-certified-final.png — "Your Passport Has Been Certified" full journey
// completion screen with open passport book, live ticker, and "Continue to Connections" CTA
export const PASSPORT_STAMP   = `${BATCH22}/passport-certified-final.png`
// Batch 22: passport-connection-1.png — STEP 15 OF 17, clean, no stale header
export const CONNECTIONS      = `${BATCH22}/passport-connection-1.png`
export const MANAGEMENT_SYNC  = `${BASE}/smokecraft-venue-management-sync.png`
// Session Complete: intentionally no image (CSS gradient). Image has stale
// "SESSION 23 OF 24" text baked in. Set to null as a sentinel.
export const SESSION_COMPLETE = null

// ── Support / supplementary screens ───────────────────────────────────────────
export const HOW_IT_WORKS         = `${BASE}/smokecraft-how-it-works.png`
// Batch 22: smokecraft-guest-pass.png — "Guest Pass · Your Invitation to the Craft", clean
export const GUEST_PASS           = `${BATCH22}/smokecraft-guest-pass.png`
// Batch 22: smokecraft-event-challenge.png — "Event Challenge" with live event + challenge tracks
export const EVENT_CHALLENGE      = `${BATCH22}/smokecraft-event-challenge.png`
export const GOLDEN_BOX_STATUS    = `${BASE}/smokecraft-golden-box-status.png`
export const LEADERBOARD          = `${BASE}/smokecraft-leaderboard.png`
// Batch 22: smokecraft-origins.png — "Origins · Every Leaf Has a Story", world heritage map
export const ORIGINS              = `${BATCH22}/smokecraft-origins.png`
export const TERROIR              = `${BASE}/smokecraft-terroir.png`
// Batch 22: smokecraft-pairing-mastery.png — "Pairing Mastery" full dashboard, Aged Bourbon & Maduro
export const PAIRING_MASTERY      = `${BATCH22}/smokecraft-pairing-mastery.png`
export const PAIRING              = `${BASE}/smokecraft-pairing.png`
export const SECOND_HUMIDOR_MATCH = `${BASE}/smokecraft-second-humidor-match.png`
export const FLAVOR_DNA           = `${BASE}/smokecraft-flavor-dna.png`
export const SCAN                 = `${BASE}/smokecraft-scan.png`
export const ART                  = `${BASE}/smokecraft-art.png`
export const VITOLA               = `${BASE}/smokecraft-vitola.png`
// Batch 22: mini tasting .png — rich "Mini Tasting Round" dashboard
export const MINI_TASTING_ROUND   = `${BATCH22}/mini tasting .png`
// Batch 22: smokecraft-challenge-bg.jpg — "SmokeCraft Challenges" desktop dashboard
export const CHALLENGE            = `${BATCH22}/smokecraft-challenge-bg.jpg`
export const PROFILE_CAPTURE      = `${BASE}/smokecraft-profile-capture.png`

// ── Locked-state screens (Batch 22) ───────────────────────────────────────────
// These show locked/future content. Stale session counts baked in header — use as
// background only; React overlay provides live state indicators.
export const FUTURE_VISIT_LOCKED      = `${BATCH22}/smokecraft-future-visit-locked.png`
export const PASSPORT_STAMP_LOCKED    = `${BATCH22}/smokecraft-passport-stamp-locked.png`
export const MANAGEMENT_SYNC_LOCKED   = `${BATCH22}/smokecraft-management-sync-locked.png`

// ── Manifest table (for admin / diagnostic screens) ──────────────────────────
export const SMOKECRAFT_ASSET_MANIFEST = [
  // Route                            | Asset constant          | Type                   | Stale text? | Live overlay?
  { route: '/smokecraft',             asset: LANDING,            type: 'landing',          stale: false, overlay: 'hotspots',    note: 'batch-22: discover-your-profile-111.png' },
  { route: '/smokecraft/identity',    asset: IDENTITY,           type: 'journey',          stale: false, overlay: 'live-form' },
  { route: '/smokecraft/golden-box',  asset: GOLDEN_BOX,         type: 'journey',          stale: false, overlay: 'hotspots',    note: 'batch-22: smokraft goldenbox rules.png' },
  { route: '/smokecraft/mentor-selection', asset: MENTOR_SELECTION, type: 'journey',       stale: false, overlay: 'live-panel' },
  { route: '/smokecraft/seed-soil',   asset: SEED_SOIL,          type: 'journey',          stale: false, overlay: 'hotspots' },
  { route: '/smokecraft/pairing-lab', asset: PAIRING_LAB,        type: 'journey',          stale: false, overlay: 'hotspots',    note: 'batch-22: pairing lab hotspot.png; ticker in image header — overlay sits below it' },
  { route: '/smokecraft/humidor-match', asset: HUMIDOR_MATCH,    type: 'journey',          stale: false, overlay: 'hotspots' },
  { route: '/smokecraft/request-purchase', asset: REQUEST_PURCHASE, type: 'journey',       stale: false, overlay: 'live-panel', note: 'batch-22: request-purchase11.png' },
  { route: '/smokecraft/cut-toast-light', asset: CUT_TOAST_LIGHT, type: 'journey',         stale: false, overlay: 'live-panel' },
  { route: '/smokecraft/first-third', asset: FIRST_THIRD,        type: 'journey',          stale: false, overlay: 'live-panel',  note: 'shares visual with final-third; no distinct approved image yet' },
  { route: '/smokecraft/second-third', asset: SECOND_THIRD,      type: 'journey',          stale: true,  overlay: 'live-panel',  note: 'stale ROUND/VISIT/SESSION header baked in top bar; React cover strip applied' },
  { route: '/smokecraft/flavor-memory', asset: FLAVOR_MEMORY,    type: 'journey',          stale: false, overlay: 'live-panel' },
  { route: '/smokecraft/final-third', asset: FINAL_THIRD,        type: 'journey',          stale: false, overlay: 'live-panel',  note: 'batch-22: fianal third coco & coffee.png' },
  { route: '/smokecraft/scorecard',   asset: SCORECARD,          type: 'journey',          stale: false, overlay: 'hotspots',    note: 'batch-22: smokecraft-scorecard.11png.png' },
  { route: '/smokecraft/final-review', asset: FINAL_REVIEW,      type: 'journey',          stale: false, overlay: 'live-panel',  note: 'batch-22: Final Review hotspot.png' },
  { route: '/smokecraft/passport-stamp', asset: PASSPORT_STAMP,  type: 'journey',          stale: false, overlay: 'hotspots',    note: 'batch-22: passport-certified-final.png — full certification scene with passport book' },
  { route: '/smokecraft/connections', asset: CONNECTIONS,         type: 'journey',          stale: false, overlay: 'hotspots',    note: 'batch-22: passport-connection-1.png' },
  { route: '/smokecraft/management-sync', asset: MANAGEMENT_SYNC, type: 'journey',         stale: false, overlay: 'live-panel' },
  // Support screens
  { route: '/smokecraft/how-it-works',     asset: HOW_IT_WORKS,         type: 'support',   stale: false, overlay: 'hotspots' },
  { route: '/smokecraft/guest-pass',       asset: GUEST_PASS,           type: 'support',   stale: false, overlay: 'hotspots',   note: 'batch-22: smokecraft-guest-pass.png' },
  { route: '/smokecraft/event-challenge',  asset: EVENT_CHALLENGE,      type: 'support',   stale: false, overlay: 'none',       note: 'batch-22: smokecraft-event-challenge.png' },
  { route: '/smokecraft/golden-box-status', asset: GOLDEN_BOX_STATUS,   type: 'support',   stale: false, overlay: 'none' },
  { route: '/smokecraft/leaderboard',      asset: LEADERBOARD,          type: 'support',   stale: false, overlay: 'none' },
  { route: '/smokecraft/origins',          asset: ORIGINS,              type: 'support',   stale: false, overlay: 'none',       note: 'batch-22: smokecraft-origins.png' },
  { route: '/smokecraft/terroir',          asset: TERROIR,              type: 'support',   stale: false, overlay: 'none' },
  { route: '/smokecraft/pairing-mastery',  asset: PAIRING_MASTERY,      type: 'support',   stale: false, overlay: 'none',       note: 'batch-22: smokecraft-pairing-mastery.png' },
  { route: '/smokecraft/second-humidor-match', asset: SECOND_HUMIDOR_MATCH, type: 'support', stale: false, overlay: 'none' },
  { route: '/smokecraft/mini-tasting-round', asset: MINI_TASTING_ROUND, type: 'support',   stale: false, overlay: 'none',       note: 'batch-22: mini tasting .png' },
  { route: '/smokecraft/scan',             asset: SCAN,                 type: 'support',   stale: false, overlay: 'none' },
  { route: '/smokecraft/flavor-dna',       asset: FLAVOR_DNA,           type: 'support',   stale: false, overlay: 'none' },
  { route: '/smokecraft/enroll',           asset: ENROLL,               type: 'support',   stale: false, overlay: 'hotspots',   note: 'entry gate form screen' },
  { route: '/smokecraft/art',              asset: ART,                  type: 'support',   stale: false, overlay: 'none' },
  { route: '/smokecraft/vitola',           asset: VITOLA,               type: 'support',   stale: false, overlay: 'none' },
  { route: '/smokecraft/pairing',          asset: PAIRING,              type: 'support',   stale: false, overlay: 'none' },
  { route: '/smokecraft/challenge',        asset: CHALLENGE,            type: 'support',   stale: false, overlay: 'none',       note: 'batch-22: smokecraft-challenge-bg.jpg' },
  // Session complete: CSS gradient — stale PNG rejected
  // smokecraft-session-complete.png has "SESSION 23 OF 24" baked in; null = intentional
  { route: '/smokecraft/session-complete', asset: SESSION_COMPLETE,     type: 'journey',   stale: true,  overlay: 'css-gradient', note: 'live React screen; no image' },
]

export default SMOKECRAFT_ASSET_MANIFEST
