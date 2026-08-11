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

// ── Owner-rebuilt hero imagery (owner-rebuild pass) ─────────────────────────
// 14 new hero images the owner created to replace the prior temporary/
// placeholder decorative imagery on the 14 migrated live-DOM SmokeCraft
// screens. These are now the AUTHORITATIVE hero assets for these screens —
// the prior CROPPED/RAW values below are kept, unrenamed, purely as
// rollback/reference (no longer read by any live screen).
const OWNER = '/assets/smokecraft/owner-rebuild'

// ── Pre-cropped clean hero photography (Block 6A visual consistency pass) ──
// These already-approved files live in public/assets/smokecraft/cropped/ —
// genuinely clean, dedicated crops (no baked UI/text/buttons), distinct from
// the RAW full-composition mockups above. Used as decorative hero bands via
// SmokeCraftHeroCrop with bgSize="cover" (no zoom-crop guessing needed —
// these are already framed).

export const SC_ASSETS = {
  // Production Closure — approved local avatar replacing the external
  // googleusercontent.com URLs formerly in src/lib/craftImages.js's
  // `portraits` map (see that file for full detail). Registered here so
  // the asset registry/R2 sync tooling covers it like every other
  // approved SmokeCraft image.
  memberAvatar:        '/assets/smokecraft/avatars/member-silhouette.svg',

  // S1 — Landing
  landing:             `${REF}/smokecraft-landing.png`,

  // S2 — Enroll / Identity
  // Enroll uses the approved full "Guest Pass" composition (Sign In / Guest
  // Mode) rather than a plain background crop — see ENROLL DECISION.
  enroll:              `${REF}/smokecraft-guest-pass.png`,
  identity:            `${RAW}/IDENTY.png`,

  // Entry layer — Resume/Start New Journey. Dedicated approved asset
  // (repo owner upload, main branch) — replaces the prior decorative-only
  // Golden Box photo placeholder now that a real Resume Journey visual
  // exists.
  resume:              `${RAW}/Resume%20Your%20Journey.png`,

  // Welcome / Session 1 — dedicated approved asset (repo owner upload,
  // main branch). WelcomeExperience.jsx previously had no image of its own.
  session1:            `${RAW}/session%201.png`,

  // S3 — Golden Box
  goldenBox:           `${RAW}/GOLDEN%20BOX%20RULES.png`,

  // S4 — Mentor Selection
  mentorSelection:     `${RAW}/MENTOR%20SELECTION1.png`,

  // Meet Your Cigar — SC-D080 fix: the prior mapping (`DISOVER YOUR CIGAR
  // PROFILE.png`) is the Launch/CraftHub dashboard screenshot, not Meet
  // Your Cigar photography — confirmed by rendering it live (owner visual
  // audit #014/#015, WRONG_IMAGE). No dedicated Meet Your Cigar asset
  // exists in the repository (checked public/assets/smokecraft/ and its
  // cigars/ subfolder) — reverting to the last known-honest placeholder
  // (Humidor Match's approved photography, openly reused, not invented)
  // until real dedicated Meet Your Cigar photography is produced.
  // NEEDS_OWNER_DECISION: commission or approve dedicated Meet Your Cigar
  // photography (Padron 1964 Series-appropriate cigar/lounge imagery).
  meetYourCigar:       `${RAW}/Humidor%20Match%201.png`,

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

  // S9 — Humidor Match — raw full composition takes precedence. Kept here
  // for resolver/registry completeness only — Canonical Journey Recovery
  // pass rebuilt HumidorMatch.jsx as real live DOM and no longer renders
  // this baked mockup at all (it contained fake baked "Active" state; see
  // SC-D076). Do not reintroduce it as this screen's UI.
  humidorMatch:        `${RAW}/Humidor%20Match%201.png`,
  // Supporting decorative header photography only (approved, cropped, no
  // baked UI/text/buttons) — used as a real <img> banner above the live
  // controls, never as a surface controls are drawn on top of.
  humidorMatchHero:    `${CROPPED}/humidor-match-hero.jpg`,
  secondHumidorMatchHero: `${CROPPED}/humidor-match-hero.jpg`,
  identityHero:        `${CROPPED}/discover-profile-hero.jpg`,
  formatHero:          `${CROPPED}/format-master-tip-v2.jpg`,
  cutToastLightHero:   `${CROPPED}/cut-toast-light-hero.jpg`,
  finalThirdHero:      `${CROPPED}/final-third-bg.jpg`,
  scorecardHero:       `${CROPPED}/scorecard-hero.jpg`,
  requestPurchaseHero: `${CROPPED}/request-purchase-hero.jpg`,
  pairingRecommendationsHero: `${CROPPED}/pairing-lab-hero.jpg`,
  passportStampHero:   `${CROPPED}/passport-stamp-hero.jpg`,
  rewardsHero:         `${CROPPED}/golden-box-hero-v2.jpg`,

  // ── Owner-rebuild hero imagery — authoritative for the 14 migrated
  // screens as of the owner-rebuilt-visuals pass. The prior CROPPED/RAW
  // values above are untouched and remain available for rollback; no
  // live screen reads them anymore. Two of these 14 (identity, seedSoil)
  // are full baked-composition mockups from the owner, same "Category B"
  // situation SmokeCraftHeroCrop's own crop-window technique already
  // exists to handle — wired via a tighter height/bgPosition/bgSize crop
  // showing only a clean photographic band, never the baked buttons/nav.
  // Self-QA fix: the raw owner files for these two are full baked
  // compositions (their own sidebar/form/buttons) — even the crop-window
  // technique's bgSize/bgPosition alone couldn't isolate a clean
  // photographic region because it sits too close to the baked UI, so
  // these point at derived crops (sharp-extracted, same source pixels,
  // no filters/edits) containing only the clean photography.
  ownerIdentityHero:              `${OWNER}/01-identity-hero-crop.jpg`,
  ownerSeedSoilHero:               `${OWNER}/02-seed-soil-hero-crop.jpg`,
  ownerFormatHero:                 `${OWNER}/03-format-hero.jpg`,
  ownerCutToastLightHero:          `${OWNER}/04-cut-toast-light-hero.jpg`,
  ownerFirstThirdHero:             `${OWNER}/05-first-third-hero.jpg`,
  ownerSecondThirdHero:            `${OWNER}/06-second-third-hero.jpg`,
  ownerFinalThirdHero:             `${OWNER}/07-final-third-hero.jpg`,
  ownerScorecardHero:              `${OWNER}/08.%20Scorecard.png`,
  ownerRequestPurchaseHero:        `${OWNER}/09-request-purchase-hero.jpg`,
  ownerPairingRecommendationsHero: `${OWNER}/10-pairing-recommendations-hero.jpg`,
  ownerPassportStampHero:          `${OWNER}/11-passport-stamp-hero.jpg`,
  ownerConnectionsHero:            `${OWNER}/12-connections-hero.jpg`,
  ownerRewardsHero:                `${OWNER}/13-rewards-hero.jpg`,
  ownerSecondHumidorMatchHero:     `${OWNER}/14-second-humidor-match-hero.jpg`,

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

  // Rewards / Achievements (shared S25/S26 screen) — approved production assets.
  // `REWARDS 222.png` is fully-baked mock data with no blank overlay zones
  // (confirmed across two prior passes — fake "Guest"/2,750 XP/12 badges and
  // a "9 of 11" progress rail contradicting the 27-session spine) and was
  // never usable as a live shell. `session 25 rewards.png` (repo owner
  // upload, main branch) is a genuine blank-value template for this exact
  // screen — replaces it as the S25 shell.
  rewards:             `${RAW}/session%2025%20rewards.png`,
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
