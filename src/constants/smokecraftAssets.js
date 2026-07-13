/**
 * SmokeCraft 360 — Centralized Asset Registry
 *
 * All SmokeCraft background image paths resolved here.
 * Rules (verified against Vite dev server and Vercel CDN):
 *   - Spaces must be encoded as %20
 *   - Commas ( , ) must remain literal — do NOT encode as %2C
 *   - Ampersands ( & ) must remain literal — do NOT encode as %26
 *   - Never use template strings with unencoded spaces
 */

// ── Cropped clean photography backgrounds ──────────────────────────────────
const CROPPED = '/assets/smokecraft/cropped'

// ── Approved reference full compositions ──────────────────────────────────
const REF = '/assets/smokecraft-reference/approved'

// ── Raw approved uploads ───────────────────────────────────────────────────
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

  // S8 — Pairing Lab
  pairingLab:          `${CROPPED}/pairing-lab-hero.jpg`,

  // S9 — Humidor Match
  humidorMatch:        `${CROPPED}/humidor-match-bg-v2.jpg`,

  // S10 — Request Purchase
  requestPurchase:     `${CROPPED}/request-purchase-hero.jpg`,

  // S11 — Cut, Toast & Light
  cutToastLight:       `${CROPPED}/cut-toast-light-hero.jpg`,

  // S12 — First Third
  firstThird:          `${CROPPED}/first-third-bg.png`,

  // S13 — Second Third
  secondThird:         `${REF}/smokecraft-second-third.png`,

  // S14 — Flavor Memory
  flavorMemory:        `${CROPPED}/flavor-memory-hero.jpg`,

  // S15 — Final Third
  finalThird:          `${CROPPED}/final-third-bg.jpg`,

  // S16 — Scorecard
  scorecard:           `${CROPPED}/scorecard-bg-v2.jpg`,

  // S17 — SmokeCraft Challenge
  smokecraftChallenge: `${CROPPED}/smokecraft-challenge-bg.jpg`,

  // S18 — Second Humidor Match
  secondHumidorMatch:  `${CROPPED}/second-humidor-match-bg.jpg`,

  // S19 — Mini Tasting Round
  miniTasting:         `${CROPPED}/mini-tasting-bg.jpg`,

  // S20 — Final Review
  finalReview:         `${CROPPED}/final-review-bg.jpg`,

  // S21 — Passport Stamp
  passportStamp:       `${CROPPED}/passport-stamp-hero.jpg`,

  // S22 — Connections
  connections:         `${CROPPED}/connections-hero.jpg`,

  // S23 — Management Sync
  managementSync:      `${CROPPED}/management-sync-hero.jpg`,

  // S24 — Session Complete
  sessionComplete:     `${REF}/smokecraft-session-complete.png`,

  // Supplemental / unguarded
  leaderboard:         `${REF}/smokecraft-leaderboard.png`,
  eventChallenge:      `${REF}/smokecraft-event-challenge.png`,
  howItWorks:          `${REF}/smokecraft-how-it-works.png`,
  visitComplete:       '/smokecraft-visit-complete.png',

  // Approved raw uploads — used only where no clean bg exists
  managementSyncRaw:   `${RAW}/MANAGEMENT%20SYNC.png`,
  sessionCompleteRaw:  `${RAW}/SESSION%20COMPLETE.png`,
}
