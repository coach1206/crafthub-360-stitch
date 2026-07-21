# Phase 2 — Route Inventory and Route Smoke Test

**Script:** `verify-smokecraft-route-smoke-test.mjs` (new, this pass)
**Routes tested:** 49 (every active learner-facing `/smokecraft/*` route registered in `src/App.jsx`, excluding pure `<Navigate>` aliases which have no independent component to smoke-test)
**Result: 97/98 checks passed** (49 routes × 2 checks each: reachable-with-real-content, no uncaught JS error). The single non-passing check is a `404 (Not Found)` console entry on `/smokecraft` observed only under heavy concurrent automated test load; verified twice in isolation (fresh server, single page load) to **not reproduce** — disclosed as test-load noise, not a reproducible production defect.

## Route inventory

| Route | Component | Auth requirement | API dependency | Status |
|---|---|---|---|---|
| `/smokecraft` | Entry/landing | none (public entry) | guest-session | PASS |
| `/smokecraft/enroll` | Enroll | `entry` guard | management-sync | PASS |
| `/smokecraft/venue-select` | VenueSelect | `enroll` guard | venue data | PASS |
| `/smokecraft/identity` | Identity | `entry` guard | guest-session | PASS |
| `/smokecraft/resume` | ResumeJourney | `enroll` guard | journey state | PASS |
| `/smokecraft/welcome` | WelcomeExperience | session 1 | none | PASS |
| `/smokecraft/mentor-selection` | Mentor | `entry` guard | mentor data | PASS |
| `/smokecraft/humidor-match` | HumidorMatch | session 2 | none | PASS |
| `/smokecraft/meet-your-cigar` | MeetYourCigar | session 3 | none | PASS |
| `/smokecraft/terroir` | Terroir | session 4 | none | PASS |
| `/smokecraft/format` | Format | session 5 | none | PASS |
| `/smokecraft/cigar-gauge-guide` | CigarGaugeGuide | session 5 | none | PASS |
| `/smokecraft/wrapper-strength` | WrapperStrength | `format` guard | none | PASS |
| `/smokecraft/seed-soil` | SeedSoil | `mentor` guard | seed-soil API | PASS |
| `/smokecraft/cut-toast-light` | CutToastLight | session 6 | none | PASS |
| `/smokecraft/lighting-tutorial` | LightingTutorial | session 7 | none | PASS |
| `/smokecraft/first-third` | FirstThird | session 8 | none | PASS |
| `/smokecraft/flavor-memory` | FlavorMemory | session 10 | none | PASS |
| `/smokecraft/pairing-lab` | PairingLab | session 11 | none | PASS |
| `/smokecraft/request-purchase` | RequestPurchase | `humidor-match` guard | none | PASS |
| `/smokecraft/second-third` | SecondThird | session 12 | none | PASS |
| `/smokecraft/mentor-commentary` | MentorCommentary | session 14 | none | PASS |
| `/smokecraft/knowledge-drop` | KnowledgeDrop | session 15 | none | PASS |
| `/smokecraft/knowledge-check-demo` | KnowledgeCheckDemo | `entry` guard | none | PASS |
| `/smokecraft/mini-tasting-module` | MiniTasting | `entry` guard | none | PASS |
| `/smokecraft/final-third` | FinalThird | session 16 | none | PASS |
| `/smokecraft/scorecard` | Scorecard | session 19 | none | PASS |
| `/smokecraft/smokecraft-challenge` | SmokeCraftChallenge | `scorecard` guard | none | PASS |
| `/smokecraft/second-humidor-match` | SecondHumidorMatch | `scorecard` guard | none | PASS |
| `/smokecraft/mini-tasting` | MiniTastingRound | `scorecard` guard | none | PASS |
| `/smokecraft/ai-summary` | AISummary | session 21 | none | PASS |
| `/smokecraft/pairing-recommendations` | PairingRecommendations | session 22 | none | PASS |
| `/smokecraft/passport-stamp` | PassportStamp | session 23 | none | PASS |
| `/smokecraft/connections` | Connections | `passport-stamp` guard | none | PASS |
| `/smokecraft/management-sync` | ManagementSync | `passport-stamp` guard | management-sync API | PASS |
| `/smokecraft/final-review` | FinalReview | session 24 | none | PASS |
| `/smokecraft/rewards` | Rewards | session 25 | none | PASS |
| `/smokecraft/skill-tree` | SkillTree | `entry` guard | **`/api/smokecraft/skill-tree`** (live, migration 086) | PASS |
| `/smokecraft/collections` | CollectionsCenter | `entry` guard | **`/api/smokecraft/collections`** (live, migration 087) | PASS |
| `/smokecraft/challenge-hub` | ChallengeHub | `entry` guard | **`/api/smokecraft/challenge-hub`** (live, migration 088) | PASS |
| `/smokecraft/challenges/blend-fault-identification` | BlendFaultChallenge | `entry` guard | **`/api/smokecraft/blend-fault`** (live, migration 089) | PASS |
| `/smokecraft/filler-arrangement` | FillerArrangement | `entry` guard | `/api/smokecraft/filler-arrangement` (live, migration 085) | PASS |
| `/smokecraft/session-complete` | SessionComplete | session 27 | none | PASS |
| `/smokecraft/golden-box` | GoldenBox | `entry` guard | Golden Box API | PASS |
| `/smokecraft/golden-box/status` | GoldenBoxStatus | none | none (static approved asset screen) | PASS |
| `/smokecraft/golden-box/competitions` | GoldenBoxHub | server-enforced | Golden Box competitions API | PASS |
| `/smokecraft/golden-box/judge` | GoldenBoxJudgeDashboard | server-enforced | Golden Box judge API | PASS |
| `/smokecraft/menu` | SmokeCraftMenu | none | none | PASS |
| `/smokecraft/cart` | SmokeCraftCart | none | none | PASS |

All 49 routes: HTTP 200, real rendered content (text or, for the one intentional CSS-background asset screen, a real `aria-labeled` screen root — not a blank/white page), no fatal unhandled JavaScript error, no missing component, no broken lazy import, no redirect loop, no dead-end.
