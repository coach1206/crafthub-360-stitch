/**
 * SmokeCraft 360 — Centralized Asset Registry
 *
 * All SmokeCraft background image paths resolved here.
 * Rules (verified against Vite dev server and Vercel CDN):
 *   - Spaces must be encoded as %20
 *   - Commas ( , ) must remain literal — do NOT encode as %2C
 *   - Ampersands ( & ) must remain literal — do NOT encode as %26
 *   - Never use template strings with unencoded spaces
 *
 * Priority rule (2026-07-11): RAW full-composition uploads take precedence
 * over CROPPED atmosphere backgrounds when they exist and match the route.
 */

// ── Cropped clean photography backgrounds ──────────────────────────────────
const CROPPED = '/assets/smokecraft/cropped'

// ── Approved reference full compositions ──────────────────────────────────
const REF = '/assets/smokecraft-reference/approved'

// ── Raw approved uploads (2026-07-11 — newest, highest priority) ───────────
const RAW = '/assets/smokecraft'

export const SC_ASSETS = {
  // S1 — Landing
  landing:             `${REF}/smokecraft-landing.png`,

  // S2 — Enroll / Identity
  enroll:              `${CROPPED}/discover-profile-bg.jpg`,
  identity:            `${RAW}/IDENTY.png`,

  // S3 — Golden Box
  goldenBox:           `${RAW}/GOLDEN%20BOX%20RULES.png`,

  // S4 — Mentor Selection
  mentorSelection:     `${RAW}/MENTOR%20SELECTION1.png`,

  // S5 — Format / Vitola
  format:              `${REF}/smokecraft-vitola.png`,

  // S6 — Wrapper Strength (redirect-only, no visual needed)
  wrapperStrength:     null,

  // S7 — Seed & Soil
  seedSoil:            `${RAW}/SEED%20&%20SOIL.png`,

  // S8 — Pairing Lab — raw full composition takes precedence
  pairingLab:          `${RAW}/PAIRING%20LAB1.png`,

  // S9 — Humidor Match — raw full composition takes precedence
  humidorMatch:        `${RAW}/Humidor%20Match%201.png`,

  // S10 — Request Purchase — raw full composition takes precedence
  requestPurchase:     `${RAW}/REQUEST%20PURCHASE.png`,

  // S11 — Cut, Toast & Light — raw full composition takes precedence
  // Filename: "CUT  TOAST, & LIGHT.png" (double space between CUT and TOAST)
  cutToastLight:       `${RAW}/CUT%20%20TOAST,%20&%20LIGHT.png`,

  // S12 — First Third — raw full composition takes precedence
  // Filename: "FIRST  THIRD1.png" (double space)
  firstThird:          `${RAW}/FIRST%20%20THIRD1.png`,

  // S13 — Second Third — raw full composition takes precedence
  secondThird:         `${RAW}/SECOND%20THIRD.png`,

  // S14 — Flavor Memory — raw full composition takes precedence
  flavorMemory:        `${RAW}/FLAVOR%20MEMORY.png`,

  // S15 — Final Third — raw full composition takes precedence
  finalThird:          `${RAW}/FINAL%20THIRD.png`,

  // S16 — Scorecard — raw full composition takes precedence
  scorecard:           `${RAW}/Scorecard.png`,

  // S17 — SmokeCraft Challenge — use approved reference
  smokecraftChallenge: `${REF}/smokecraft-challenge.png`,

  // S18 — Second Humidor Match — use approved reference
  secondHumidorMatch:  `${REF}/smokecraft-second-humidor-match.png`,

  // S19 — Mini Tasting Round — use approved reference
  miniTasting:         `${REF}/smokecraft-mini-tasting-round.png`,

  // S20 — Final Review — raw full composition takes precedence
  finalReview:         `${RAW}/FINAL%20REVIEW.png`,

  // S21 — Passport Stamp — raw full composition takes precedence
  passportStamp:       `${RAW}/PASSPORT%20STAMP.png`,

  // S22 — Connections — keep cropped (no raw full-composition equivalent)
  connections:         `${CROPPED}/connections-hero.jpg`,

  // S23 — Management Sync — raw full composition
  managementSync:      `${RAW}/MANAGEMENT%20SYNC.png`,

  // S24 — Session Complete — raw full composition
  sessionComplete:     `${RAW}/SESSION%20COMPLETE.png`,

  // Supplemental / unguarded
  leaderboard:         `${RAW}/NEW%20DEMO%20LOUNG%20RANKING.png`,
  eventChallenge:      `${REF}/smokecraft-event-challenge.png`,
  howItWorks:          `${REF}/smokecraft-how-it-works.png`,
  visitComplete:       '/smokecraft-visit-complete.png',

  // Legacy aliases — kept for backward compat
  managementSyncRaw:   `${RAW}/MANAGEMENT%20SYNC.png`,
  sessionCompleteRaw:  `${RAW}/SESSION%20COMPLETE.png`,
}
