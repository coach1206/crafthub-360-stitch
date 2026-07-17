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

  // Entry layer — Resume/Start New Journey decorative header (visual-only
  // enhancement; ResumeJourney.jsx has no image of its own to date).
  resume:              `${CROPPED}/golden-box-hero-v2.jpg`,

  // S3 — Golden Box
  goldenBox:           `${RAW}/GOLDEN%20BOX%20RULES.png`,

  // S4 — Mentor Selection
  mentorSelection:     `${RAW}/MENTOR%20SELECTION1.png`,

  // Meet Your Cigar — dedicated approved asset (root-cause production fix:
  // this previously reused the Humidor Match image, causing Meet Your Cigar
  // and Humidor Match to render the same photography).
  meetYourCigar:       `${RAW}/DISOVER%20YOUR%20CIGAR%20PROFILE.png`,

  // Mentor Commentary — approved production asset (production image audit).
  mentorCommentary:    `${RAW}/MENTOR%20:COMMENTARY.png`,

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

  // S17 — SmokeCraft Challenge — raw full composition takes precedence (production image audit)
  smokecraftChallenge: `${RAW}/SMOKECRAFT%20CHALLENG.png`,

  // S18 — Second Humidor Match — use approved reference
  secondHumidorMatch:  `${REF}/smokecraft-second-humidor-match.png`,

  // S19 — Mini Tasting Round — raw full composition takes precedence (production image audit)
  miniTasting:         `${RAW}/Mini%20Tasting%2011.png`,

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

  // S27 — Recommended Next Journey (Package S) — approved production asset.
  recommendedNextJourney: `${RAW}/Recommend%20next%20journey.png`,

  // Terroir (Country/Region/Soil/Climate/Growing Conditions/Why It Matters)
  terroir:             `${REF}/smokecraft-terroir.png`,
  terroirSoil:         `${REF}/smokecraft-seed-soil.png`,

  // Knowledge Drop (Tobacco/Fermentation/Aging/Factory Story) — reuses the
  // orphaned Origins/Vitola/PairingMastery/FlavorDNA approved reference images
  // per the locked rebuild plan's merge guidance, rather than commissioning new art.
  knowledgeDropTobacco:      `${REF}/smokecraft-origins.png`,
  knowledgeDropFermentation: `${REF}/smokecraft-vitola.png`,
  knowledgeDropAging:        `${REF}/smokecraft-pairing-mastery.png`,
  knowledgeDropFactory:      `${REF}/smokecraft-flavor-dna.png`,

  // Supplemental / unguarded
  // Leaderboard 111.png is the newest raw upload (production image audit) and
  // now takes precedence; NEW DEMO LOUNG RANKING.png is preserved on disk as
  // a reference-only alternate (not deleted), no longer the active reference.
  leaderboard:         `${RAW}/LEADERBOARD%20111.png`,
  eventChallenge:      `${RAW}/EVENT%20CHALLENGE%20111.png`,
  howItWorks:          `${REF}/smokecraft-how-it-works.png`,
  visitComplete:       '/smokecraft-visit-complete.png',

  // Rewards / Achievements (shared S25/S26 screen) — approved production assets
  rewards:             `${RAW}/REWARDS%20222.png`,
  achievements:        `${RAW}/ACHIEVMENTS.png`,

  // AI Summary (S21) — approved production asset
  aiSummary:           `${RAW}/AI%20SUMMARY.png`,

  // Pairing Recommendations (S22) — approved production asset
  pairingRecommendations: `${RAW}/personlized%20pairing%20222.png`,

  // Venue Selection (Entry layer) — approved production asset
  venueSelect:         `${RAW}/Venue%20Selection%2011.png`,

  // Lighting Tutorial (S8 area) — approved production asset
  lightingTutorial:    `${RAW}/LIGHTING%20TUTORIAL%201.png`,

  // Knowledge Drop — unified approved production asset, used as a decorative
  // header alongside the existing per-topic images above (preserved as-is).
  knowledgeDrop:       `${RAW}/KNOWLEDGE%20DROP.png`,

  // Knowledge Check — reusable supporting-module component, approved asset
  // registered for future header use; component currently has no fixed
  // per-screen header (embedded inline after educational modules).
  knowledgeCheck:      `${RAW}/KNOWLEDGE%20CHECK.png`,

  // SmokeCraft badge library artwork — approved production asset
  badgeLibrary:        `${RAW}/smokecraft%20badges.png`,

  // Legacy aliases — kept for backward compat
  managementSyncRaw:   `${RAW}/MANAGEMENT%20SYNC.png`,
  sessionCompleteRaw:  `${RAW}/SESSION%20COMPLETE.png`,
}
