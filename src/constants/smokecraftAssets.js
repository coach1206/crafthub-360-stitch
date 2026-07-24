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
import { versionedAssetUrl } from './assetVersion.js'

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
  // Enroll uses the approved full "Guest Pass" composition (Sign In / Guest
  // Mode) rather than a plain background crop — see ENROLL DECISION.
  enroll:              `${REF}/smokecraft-guest-pass.png`,
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
  // Approved-Asset Control Plane pass: the former `howItWorks` key pointed at
  // ${REF}/smokecraft-how-it-works.png, which is an INTERNAL DESIGN STORYBOARD
  // ("SMOKECRAFT 360 | STORYBOARD S1 -> S4", covered in S1.1/S2.1/"S1 GOAL"
  // planning labels), not a user-facing screen. It had no consumer left and is
  // removed so it cannot be wired into a production route again. The file stays
  // on disk as internal reference material.
  //
  // The approved USER-FACING How It Works visual is this one. HowItWorks.jsx
  // renders it as its shell and occludes its baked placeholder stats with real
  // saved values (see that file's header for the full rationale).
  howItWorksUser:      `${RAW}/session-visuals/HOW%20IT%20WORKS.png`,
  visitComplete:       '/smokecraft-visit-complete.png',

  // Landing "Passport" destination — approved 360 Passport hub visual. The
  // landing Passport control previously pointed at the session-23-guarded
  // passport-stamp curriculum screen, which bounced guests to enroll.
  passportHub:         `${RAW}/360%20PASSPORT%20%202.png`,

  // Landing "CraftHub" destination — approved CraftHub 360 venue table visual.
  // The landing CraftHub tile previously pointed at the scorecard-guarded
  // smokecraft-challenge screen, which never showed a CraftHub visual at all.
  craftHubVenueTable:  `${RAW}/CRAFTHUB%20360.%20VENUE%20TABLE%20EXPERIENCE.png`,

  // Rewards / Achievements (shared S25/S26 screen) — approved production assets
  rewards:             `${RAW}/REWARDS%20222.png`,
  // Landing "Rewards" destination card — approved Reward Center visual the
  // repo owner uploaded directly to GitHub (commit 4881d21b). Spaces encoded
  // per this file's rules. This is the shell for the landing-accessible
  // Rewards Center destination (RewardsCenter.jsx), distinct from the in-
  // journey S25 rewards screen above.
  rewardCenter:        `${RAW}/rewards/Reward%20Center.png`,
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

  // ── Package 7A image-integration pass — Golden Box production folder ──
  // (2026-07-20 batch upload, normalized into public/assets/smokecraft/golden-box/)
  // Visual Sequence Closure pass — resolved deterministically (not a
  // guess): "real golen box challenge.png" was uploaded 89 seconds after
  // "Golden Box challenge.png" in the same upload session (BATCH888 vs.
  // BATCH 777, source-commit-timestamp-verified) and its filename
  // explicitly self-identifies as the corrected version ("real ___
  // challenge") — the standard signal for a same-session re-upload
  // superseding an earlier draft. See
  // docs/audits/smokecraft-final-completion/visual-sequence-closure/03-HUMAN-VISUAL-DECISION-BOARD.md.
  // The superseded file remains on disk, unregistered, not deleted.
  goldenBoxChallenge:              `${RAW}/golden-box/golden-box-challenge-alt.png`,
  goldenBoxJudgingCriteria:        `${RAW}/golden-box/golden-box-judging-criteria.png`,
  goldenBoxPairingDefense:         `${RAW}/golden-box/golden-box-pairing-defense.png`,
  goldenBoxBlendRevisionRound:     `${RAW}/golden-box/golden-box-blend-revision-round.png`,
  goldenBoxPresentationRevision:   `${RAW}/golden-box/golden-box-presentation-revision-round.png`,
  goldenBoxMasterBlendingEducation:`${RAW}/golden-box/golden-box-master-blending-education.png`,
  goldenBoxFinalJudgingRubric:     `${RAW}/golden-box/golden-box-final-judging-rubric.png`,
  goldenBoxScoringRounds:          `${RAW}/golden-box/golden-box-scoring-rounds.png`,

  // ── Phase 2 image integration — rolling-process step thumbnails ──
  // (public/assets/smokecraft/leaf-construction/), wired into
  // WrapperStrength.jsx's existing RollingProcess step list, keyed by the
  // same real backend step_key values already used there.
  rollingStepPrepareLeaves:      `${RAW}/leaf-construction/leaf-comparison.png`,
  rollingStepArrangeFiller:      `${RAW}/leaf-construction/arrange-filler.png`,
  rollingStepSelectBunching:     `${RAW}/leaf-construction/select-bunching-method.png`,
  rollingStepApplyBinder:        `${RAW}/leaf-construction/apply-binder.png`,
  rollingStepMoldOrPress:        `${RAW}/leaf-construction/mold-or-press.png`,
  rollingStepApplyWrapper:       `${RAW}/leaf-construction/apply-wrapper.png`,
  rollingStepConstructCap:       `${RAW}/leaf-construction/construct-cap.png`,
  rollingStepFinishFoot:         `${RAW}/leaf-construction/finish-foot.png`,
  rollingStepInspectAndDrawTest: `${RAW}/leaf-construction/inspect-and-draw-test.png`,
  rollingStepRestAndBoxAge:      `${RAW}/leaf-construction/rest-and-box-age.png`,

  // ── Phase 2 — Ring Gauge / Vitola dedicated screen art ──
  ringGaugeGuide:                `${RAW}/session-visuals/RING%20GAUGE%20GUIDE.png`,

  // ── Visual Sequence Closure pass — processing-section topic thumbnails ──
  // (four distinct real sub-topics merged into WrapperStrength.jsx's single
  // "Curing, Fermentation, Aging & Grading" section — not a duplicate
  // choice, each image names its own distinct sub-topic).
  processingCuring:      `${RAW}/leaf-construction/curing-process.png`,
  processingFermentation:`${RAW}/leaf-construction/fermentation-process.png`,
  processingAging:       `${RAW}/leaf-construction/final-resting-aging.png`,
  processingGrading:     `${RAW}/leaf-construction/sorting-and-grading.png`,

  // ── Approved batch upload (commit a518a134) — registered, not yet wired ──
  // to a screen. No /smokecraft/skill-tree, /smokecraft/collections, or
  // Challenge Hub route exists yet (confirmed via grep of App.jsx) — these
  // three keys are registered now per instruction (a missing route does not
  // block registering approved art) so a future pass can wire them the
  // moment each route is built, without a second image-discovery step.
  skillTreeBackground:         `${RAW}/session-visuals/skill%20tree%201.png`,
  collectionsCenterBackground: `${RAW}/session-visuals/collection%20center.png`,
  challengeHubBackground:      `${RAW}/session-visuals/Daily%20and%20weekly%20Challenge%20Hub.png`,

  // ── Approved batch (commit a518a134), resolved by visual inspection ──
  // "missing challenge Screen1/2/3" are the 3 real steps of one challenge —
  // confirmed by reading each image: Screen 1 = "Identify the Issue",
  // Screen 2 = "Choose the Best Solution", Screen 3 = "Prevent and Improve"
  // — a real Blend Fault Identification challenge, not a guess.
  blendFaultChallengeStep1: `${RAW}/session-visuals/missing%20challenge%20Screen1.png`,
  blendFaultChallengeStep2: `${RAW}/session-visuals/Mising%20Challenge%20Screen2.png`,
  blendFaultChallengeStep3: `${RAW}/session-visuals/Missing%20Challenge%20Screen3.png`,

  // "filler arrangement.png" — confirmed by visual inspection to be a full
  // standalone 6-step lesson screen (Select/Align/Balance/Shape/Check/
  // Prepare), not a duplicate of the small rollingStepArrangeFiller
  // thumbnail already wired into WrapperStrength.jsx's step list. Both are
  // kept — different slots, different content.
  fillerArrangementLesson: `${RAW}/session-visuals/filler%20arrangement.png`,
}

// Production Build Identity pass — every SC_ASSETS value is versioned in
// place here, once, so every existing consumer across the app (30+ screens)
// automatically gets a cache-busted URL with zero per-component changes.
// null values (e.g. wrapperStrength, a redirect-only entry with no visual)
// are left untouched — versioning a non-existent asset path is meaningless.
for (const key of Object.keys(SC_ASSETS)) {
  if (typeof SC_ASSETS[key] === 'string') SC_ASSETS[key] = versionedAssetUrl(SC_ASSETS[key])
}
