# SmokeCraft 360 — Complete Rebuild Matrix (Phase 3)

Supersedes/extends `SMOKECRAFT_LIVE_REBUILD_MATRIX.md` (still valid for per-route detail) with explicit package assignment and current status after Package A partial completion (Launch, Enroll, Identity, Venue Select, Resume).

Legend — **Status**: `DONE` (verified, approved-image-preserving live rebuild) · `LIVE` (already fully live, no rebuild needed) · `PENDING` (not yet started).

## PACKAGE A — Entry and Access

| Route | Component | Approved asset | Current classification | Status | Package |
|---|---|---|---|---|---|
| `/smokecraft` | `SmokeCraft.jsx` | `smokecraft-landing.png` | Approved image + live zones | **DONE** (`8295d2f6`) | A |
| `/smokecraft/enroll` | `Enroll.jsx` | `smokecraft-guest-pass.png` | Approved image + live zones | **DONE** (`8295d2f6`) | A |
| `/smokecraft/venue-select` | `VenueSelect.jsx` | none (strict empty state, no fabricated venues) | Fully live | **DONE** (`4b848255`) | A |
| `/smokecraft/resume` | `ResumeJourney.jsx` | `golden-box-hero-v2.jpg` (bounded decorative header only) | Fully live | **DONE** (`ac8624a1`/`8295d2f6`) | A |
| `/smokecraft/identity` | `Identity.jsx` | `IDENTY.png` (bounded portrait crop) | Fully live | **DONE** (`5b2d5ed3`) | A |
| `/smokecraft/golden-box` | `GoldenBox.jsx` | `SC_ASSETS.goldenBox` | Static image + overlay | **PENDING** | A |
| `/smokecraft/mentor-selection` | `Mentor.jsx` | `SC_ASSETS.mentorSelection` | Static image + overlay | **PENDING** | A |

**Package A remaining work:** Golden Box, Mentor Selection. Everything else in Package A is verified complete — do not re-touch.

## PACKAGE B — Discovery and Cigar Foundation

| Route | Component | Approved asset | Current classification | Status |
|---|---|---|---|---|
| `/smokecraft/humidor-match` (S2) | `HumidorMatch.jsx` | `Humidor Match 1.png` | Partially live | PENDING |
| `/smokecraft/meet-your-cigar` (S3) | `MeetYourCigar.jsx` | `DISOVER YOUR CIGAR PROFILE.png` | Fully live | LIVE |
| `/smokecraft/terroir` (S4) | `Terroir.jsx` | `smokecraft-terroir.png` | Fully live | LIVE |
| `/smokecraft/format` (S5) | `Format.jsx` | `smokecraft-vitola.png` | Static image + overlay | PENDING |
| `/smokecraft/request-purchase` | `RequestPurchase.jsx` | `REQUEST PURCHASE.png` | Partially live | PENDING |
| `/smokecraft/wrapper-strength` | `WrapperStrength.jsx` | none (redirect-only) | N/A | LIVE (no visual needed) |

## PACKAGE C — Pairing and Preparation

| Route | Component | Approved asset | Current classification | Status |
|---|---|---|---|---|
| `/smokecraft/pairing-lab` (S11) | `PairingLab.jsx` | `PAIRING LAB1.png` | Static image + overlay | PENDING |
| `/smokecraft/cut-toast-light` (S6) | `CutToastLight.jsx` | `CUT  TOAST, & LIGHT.png` | Partially live | PENDING |
| `/smokecraft/lighting-tutorial` (S7) | `LightingTutorial.jsx` | `LIGHTING TUTORIAL 1.png` | Fully live | LIVE |
| `/smokecraft/seed-soil` | `SeedSoil.jsx` | `SEED & SOIL.png` | Static image + overlay | PENDING |

## PACKAGE D — Smoking Journey

| Route | Component | Approved asset | Current classification | Status |
|---|---|---|---|---|
| `/smokecraft/first-third` (S8/S9) | `FirstThird.jsx` | `FIRST  THIRD1.png` | Partially live | PENDING |
| `/smokecraft/second-third` (S12/S13) | `SecondThird.jsx` | `SECOND THIRD.png` | Partially live | PENDING |
| `/smokecraft/final-third` (S16/S17/S18) | `FinalThird.jsx` | `FINAL THIRD.png` | Static image + overlay | PENDING |
| `/smokecraft/mentor-commentary` (S14) | `MentorCommentary.jsx` | `MENTOR :COMMENTARY.png` | Fully live | LIVE |
| `/smokecraft/knowledge-drop` (S15) | `KnowledgeDrop.jsx` | `KNOWLEDGE DROP.png` | Fully live | LIVE |
| `/smokecraft/mini-tasting` (spine twin) | `MiniTastingRound.jsx` | `Mini Tasting 11.png` | Static screenshot | PENDING (see conflict #1 in Locked Sequence doc) |
| `/smokecraft/second-humidor-match` | `SecondHumidorMatch.jsx` | `smokecraft-second-humidor-match.png` | Static screenshot | PENDING |

## PACKAGE E — Reflection and Scoring

| Route | Component | Approved asset | Current classification | Status |
|---|---|---|---|---|
| `/smokecraft/flavor-memory` (S10) | `FlavorMemory.jsx` | `FLAVOR MEMORY.png` | Static image + overlay | PENDING |
| `/smokecraft/scorecard` (S19/S20) | `Scorecard.jsx` | `Scorecard.png` | Partially live | PENDING |
| `/smokecraft/final-review` (S24) | `FinalReview.jsx` | `FINAL REVIEW.png` | Static image + overlay | PENDING |
| `/smokecraft/ai-summary` (S21) | `AISummary.jsx` | `AI SUMMARY.png` | Fully live | LIVE |
| `/smokecraft/pairing-recommendations` (S22) | `PairingRecommendations.jsx` | `personlized pairing 222.png` | Fully live | LIVE |

## PACKAGE F — Passport and Completion

| Route | Component | Approved asset | Current classification | Status |
|---|---|---|---|---|
| `/smokecraft/passport-stamp` (S23) | `PassportStamp.jsx` | `PASSPORT STAMP.png` | Static image + overlay | PENDING |
| `/smokecraft/connections` | `Connections.jsx` | `connections-hero.jpg` | Static image + overlay | PENDING |
| `/smokecraft/management-sync` | `ManagementSync.jsx` | `MANAGEMENT SYNC.png` | Static image + overlay | PENDING |
| `/smokecraft/rewards` (S25/S26) | `Rewards.jsx` | `REWARDS 222.png` / `ACHIEVMENTS.png` | Fully live | LIVE |
| `/smokecraft/session-complete` (S27) | `SessionComplete.jsx` | `Recommend next journey.png` | Fully live | LIVE |

## PACKAGE G — Supporting Experience

| Route | Component | Approved asset | Current classification | Status |
|---|---|---|---|---|
| `/smokecraft/how-it-works` | `HowItWorks.jsx` | `smokecraft-how-it-works.png` | Static screenshot | PENDING |
| `/smokecraft/leaderboard` | `Leaderboard.jsx` | `LEADERBOARD 111.png` | Fully live | LIVE |
| `/smokecraft/event-challenge` | `EventChallenge.jsx` | `EVENT CHALLENGE 111.png` | Fully live | LIVE |
| `/smokecraft/smokecraft-challenge` | `SmokeCraftChallenge.jsx` | `SMOKECRAFT CHALLENG.png` | Fully live | LIVE |
| `/smokecraft/golden-box/status` | `GoldenBoxStatus.jsx` | (inherits Golden Box asset) | Static screenshot | PENDING |
| `/smokecraft/knowledge-check-demo` | `KnowledgeCheckDemo.jsx` | none (QA harness) | Fully live | LIVE (not a production screen) |
| `/smokecraft/mini-tasting-module` | `MiniTasting.jsx` | none | Fully live | LIVE |
| `/smokecraft/menu` | `SmokeCraftMenu.jsx` | commerce asset | Static image + overlay | OUT OF SCOPE (commerce, not educational journey) |

## Orphaned (not assigned to any package — confirm reachability before investing rebuild effort)

`Art.jsx`, `Origins.jsx`, `Curation.jsx`, `Leaves.jsx`, `LeafChallenge*.jsx`, `Cultivation.jsx`, `Blend.jsx`, `FlavorDNA.jsx`, `Pairing.jsx`, `Available.jsx`, `Assistant.jsx`, `PairingMastery.jsx`, `Vitola.jsx`.

## Execution order

Package A is **partially complete** (5 of 7 routes done). Remaining Package A work (Golden Box, Mentor Selection) must finish and be verified before Package B begins, per the "do not start Package B until Package A is fully verified" rule.

**No visual/UI implementation work has started on Packages B–G.** A navigation-only correction (Package A → B handoff) was applied post-Package-A-completion — see `docs/SMOKECRAFT_AUTHORITATIVE_ROUTE_GRAPH.md`. Mentor Selection's hardcoded `navigate('/smokecraft/format')` (which skipped Seed & Soil, Humidor Match, Meet Your Cigar, and Terroir entirely) was corrected to route through the real sequence. No screen in Packages B–G had its visual composition, approved image, or UI rebuilt — only 3 screens' forward-navigation targets and 1 back-navigation target changed.
