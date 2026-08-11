# SmokeCraft 360 — Screen-to-Stage Map (Doc 4 of 10)

Source of truth: `src/constants/smokecraftComponentRegistry.js` (spine screens,
rendered through `SmokeCraftScreenRenderer`) and the direct component imports
in `src/App.jsx` (entry layer + supporting modules + supplemental pages).

This maps every screen **file** to its place in the journey (doc 02) and its
route (doc 03) — the piece a designer needs to find "which file draws the
screen I'm looking at."

## Entry layer

| File | Route | Stage |
|---|---|---|
| `src/pages/smokecraft/SmokeCraft` *(index screen, see App.jsx)* | `/smokecraft` | Launch |
| `src/pages/smokecraft/Enroll.jsx` | `/smokecraft/enroll` | Sign In / Guest Mode |
| `src/pages/smokecraft/Identity.jsx` | `/smokecraft/identity` | Personal Dashboard |
| `src/pages/smokecraft/VenueSelect.jsx` | `/smokecraft/venue-select` | Venue Selection |
| `src/pages/smokecraft/ResumeJourney.jsx` | `/smokecraft/resume` | Resume or Start New |

## Canonical spine — component registry (`session-N` → file)

All rendered through `src/components/smokecraft/SmokeCraftScreenRenderer.jsx`,
which looks up `componentKey` (`session-N`) in
`smokecraftComponentRegistry.js`. Where one file serves several merged
sessions, that's noted.

| Session(s) | Phase | Component key | File | Route |
|---|---|---|---|---|
| S1 | 1 — Session Preparation | `session-1` | `WelcomeExperience.jsx` | `/smokecraft/welcome` |
| S2 | 1 | `session-2` | `HumidorMatch.jsx` | `/smokecraft/humidor-match` |
| S3 | 1 | `session-3` | `MeetYourCigar.jsx` | `/smokecraft/meet-your-cigar` |
| S4 | 1 | `session-4` | `Terroir.jsx` | `/smokecraft/terroir` |
| S5 | 1 | `session-5` | `Format.jsx` | `/smokecraft/format` |
| S6 | 1 | `session-6` | `CutToastLight.jsx` | `/smokecraft/cut-toast-light` |
| S7 | 1 | `session-7` | `LightingTutorial.jsx` | `/smokecraft/lighting-tutorial` |
| S8, S9 | 2 — First Third | `session-8` | `FirstThird.jsx` | `/smokecraft/first-third` |
| S10 | 2 | `session-10` | `FlavorMemory.jsx` | `/smokecraft/flavor-memory` |
| S11 | 2 | `session-11` | `PairingLab.jsx` | `/smokecraft/pairing-lab` |
| S12, S13 | 3 — Second Third | `session-12` | `SecondThird.jsx` | `/smokecraft/second-third` |
| S14 | 3 | `session-14` | `MentorCommentary.jsx` | `/smokecraft/mentor-commentary` |
| S15 | 3 | `session-15` | `KnowledgeDrop.jsx` | `/smokecraft/knowledge-drop` |
| S16, S17, S18 | 4 — Final Third | `session-16` | `FinalThird.jsx` | `/smokecraft/final-third` |
| S19, S20 | 5 — Reflection | `session-19` | `Scorecard.jsx` | `/smokecraft/scorecard` |
| S21 | 6 — Results | `session-21` | `AISummary.jsx` | `/smokecraft/ai-summary` |
| S22 | 6 | `session-22` | `PairingRecommendations.jsx` | `/smokecraft/pairing-recommendations` |
| S23 | 6 | `session-23` | `PassportStamp.jsx` | `/smokecraft/passport-stamp` |
| S24 | 6 | `session-24` | `FinalReview.jsx` | `/smokecraft/final-review` |
| S25, S26 | 6 | `session-25` | `Rewards.jsx` | `/smokecraft/rewards` |
| S27 | 6 | `session-27` | `SessionComplete.jsx` | `/smokecraft/session-complete` |

**21 distinct screen files cover the 27 numbered sessions** — the gap is the
merges noted above (S9→S8, S13→S12, S17/S18→S16, S20→S19, S26→S25), each a
deliberate content-consolidation on one screen rather than a missing screen.

## Supporting modules → file → route

| File | Route | Requires |
|---|---|---|
| `Mentor.jsx` | `/smokecraft/mentor-selection` | entry |
| `SeedSoil.jsx` | `/smokecraft/seed-soil` | mentor |
| `WrapperStrength.jsx` | `/smokecraft/wrapper-strength` | format |
| `CigarGaugeGuide.jsx` | `/smokecraft/cigar-gauge-guide` | session 5 |
| `RequestPurchase.jsx` | `/smokecraft/request-purchase` | humidor-match |
| `SmokeCraftChallenge.jsx` | `/smokecraft/smokecraft-challenge` | scorecard |
| `SecondHumidorMatch.jsx` | `/smokecraft/second-humidor-match` | scorecard |
| `MiniTastingRound.jsx` | `/smokecraft/mini-tasting` | scorecard |
| `Connections.jsx` | `/smokecraft/connections` | passport-stamp |
| `ManagementSync.jsx` | `/smokecraft/management-sync` | passport-stamp |
| `ManagementSyncAnalytics.jsx` | `/smokecraft/management-sync/analytics` | server-side venue auth |
| `GoldenBox.jsx` + `goldenBox/*.jsx` (9 files) | `/smokecraft/golden-box/*` | entry |
| `KnowledgeCheckDemo.jsx` | `/smokecraft/knowledge-check-demo` | entry (QA harness) |
| `MiniTasting.jsx` | `/smokecraft/mini-tasting-module` | entry |

## Supplemental pages → file → route

`Origins.jsx→origins` · `Curation.jsx→curation` · `Leaves.jsx→leaves` ·
`LeafChallenge.jsx→leaf-challenge` ·
`LeafChallengeCalculating.jsx→leaf-challenge-calculating` ·
`LeafChallengeResult.jsx→leaf-challenge-result` ·
`Cultivation.jsx→cultivation` · `Blend.jsx→blend` ·
`FlavorDNA.jsx→flavor-dna` · `Pairing.jsx→pairing` ·
`Available.jsx→available` · `Assistant.jsx→assistant` ·
`PairingMastery.jsx→pairing-mastery` · `Vitola.jsx→vitola` ·
`Leaderboard.jsx→leaderboard` · `RewardsCenter.jsx→rewards-center` ·
`Account.jsx→account` · `EventChallenge.jsx→event-challenge` ·
`HowItWorks.jsx→how-it-works` · `GuestPass.jsx→guest-pass` ·
`Demo.jsx→demo` · `Scan.jsx→scan` · `SmokeCraftPassport.jsx→passport` ·
`SmokeCraftCraftHub.jsx→crafthub` · `VisitComplete.jsx→visit-complete` ·
`SkillTree.jsx→skill-tree` · `CollectionsCenter.jsx→collections` ·
`ChallengeHub.jsx→challenge-hub` ·
`BlendFaultChallenge.jsx→challenges/blend-fault-identification` ·
`FillerArrangement.jsx→filler-arrangement` · `Art.jsx→art`

## Venue commerce → file → route

`SmokeCraftMenu.jsx→menu` · `SmokeCraftVenueCommerce.jsx→venue-commerce,
order, ticket-tapper/staff-specials (3 routes, 1 component)` ·
`SmokeCraftCart.jsx→cart` · `SmokeCraftCheckout.jsx→checkout` ·
`SmokeCraftPaymentSuccess.jsx→payment-success` ·
`SmokeCraftOrderStatus.jsx→order-status`

## Compliance → file → route

`compliance/AgeGate.jsx→compliance/age-gate` ·
`compliance/PolicyCenter.jsx→compliance/policies` ·
`compliance/ConsentCenter.jsx→compliance/consent` ·
`compliance/DataRightsCenter.jsx→compliance/data-rights` ·
`compliance/staff/StaffAgeVerification.jsx→staff/compliance/age-verification` ·
`compliance/admin/ComplianceAdmin.jsx→admin/compliance`

## Files present but NOT routed (dead code, not deleted)

`src/pages/smokecraft/venueHumidor/**` — the larger VenueHumidor
commerce/admin/payment subsystem. Present on disk, deliberately excluded
from `App.jsx`'s route tree on this branch (see doc 05 for why). A designer
opening one of these files will not find a live route to preview it against.

## The 14 owner-rebuilt hero-image screens (prior phase of this same branch)

For reference — these are the screens the most recent visual pass (full-height
owner background, CSS-stacking fix) touched, all inside the spine/supporting-
module set above, not a separate stage:

`Identity` `SeedSoil` `Format` `CutToastLight` `FirstThird` `SecondThird`
`FinalThird` `Scorecard` `RequestPurchase` `PairingRecommendations`
`PassportStamp` `Connections` `Rewards` `SecondHumidorMatch`
