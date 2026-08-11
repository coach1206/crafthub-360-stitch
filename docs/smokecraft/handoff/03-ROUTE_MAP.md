# SmokeCraft 360 — Route Map (Doc 3 of 10)

Source of truth: `src/App.jsx`, the `<Route path="smokecraft" ...>` subtree
(lines ~283–576 at handoff time). This is every route actually registered
under `/smokecraft/*`, grouped by subsystem — the canonical journey (doc 2)
is one part of a larger route tree that also includes a competition system,
a compliance module, a venue-commerce flow, and a set of supplemental pages.

**117** `<Route>` entries are registered under `/smokecraft`, of which **14**
are `<Navigate>` aliases (old/alternate paths redirecting to a canonical
route) rather than distinct screens.

## 1. Entry layer

| Route | Component | Guard |
|---|---|---|
| `/smokecraft` | `SmokeCraft` | session 1, entry-readiness not enforced (public landing) |
| `/smokecraft/welcome` | `SmokeCraftScreenRenderer` (session-1) | session 1 |
| `/smokecraft/enroll` | `Enroll` | requires `entry` |
| `/smokecraft/identity` | `Identity` | requires `enroll` |
| `/smokecraft/venue-select` | `VenueSelect` | requires `identity` |
| `/smokecraft/resume` | `ResumeJourney` | requires `enroll` |

## 2. Canonical spine (see doc 02 for full session/phase detail)

All rendered through the shared `SmokeCraftScreenRenderer` by `screenId`,
each behind `SmokeCraftSessionGuard sessionNumber={N}`:

`humidor-match` `meet-your-cigar` `terroir` `format` `cut-toast-light`
`lighting-tutorial` `first-third` `flavor-memory` `pairing-lab`
`second-third` `mentor-commentary` `knowledge-drop` `final-third`
`scorecard` `ai-summary` `pairing-recommendations` `passport-stamp`
`final-review` `rewards` `session-complete`

## 3. Supporting modules (gated by prerequisite, not by session number)

| Route | Component | Guard |
|---|---|---|
| `/smokecraft/mentor-selection` | `Mentor` | requires `entry` |
| `/smokecraft/seed-soil` | `SeedSoil` | requires `mentor` |
| `/smokecraft/wrapper-strength` | `WrapperStrength` | requires `format` |
| `/smokecraft/cigar-gauge-guide` | `CigarGaugeGuide` | session 5 |
| `/smokecraft/request-purchase` | `RequestPurchase` | requires `humidor-match` |
| `/smokecraft/smokecraft-challenge` | `SmokeCraftChallenge` | requires `scorecard` |
| `/smokecraft/second-humidor-match` | `SecondHumidorMatch` | requires `scorecard` |
| `/smokecraft/mini-tasting` | `MiniTastingRound` | requires `scorecard` |
| `/smokecraft/connections` | `Connections` | requires `passport-stamp` |
| `/smokecraft/management-sync` | `ManagementSync` | requires `passport-stamp` |
| `/smokecraft/management-sync/analytics` | `ManagementSyncAnalytics` | none client-side — server enforces `requireAuth` + venue membership |
| `/smokecraft/knowledge-check-demo` | `KnowledgeCheckDemo` | requires `entry` (QA harness for the reusable quiz component) |
| `/smokecraft/mini-tasting-module` | `MiniTasting` | requires `entry` (standalone module, distinct from the spine's `mini-tasting-round`) |

## 4. Golden Box — competition subsystem (`/smokecraft/golden-box/*`)

A self-contained competition flow reachable from S1, not part of the
27-session count.

| Route | Component |
|---|---|
| `/smokecraft/golden-box` | `GoldenBox` (requires `entry`) |
| `/smokecraft/golden-box/status` | `GoldenBoxStatus` |
| `/smokecraft/golden-box/competitions` | `GoldenBoxHub` |
| `/smokecraft/golden-box/competitions/:competitionId` | `GoldenBoxCompetitionDetail` |
| `/smokecraft/golden-box/entries/:entryId/blend` | `GoldenBoxEntryWorkspace` |
| `/smokecraft/golden-box/results/:competitionId` | `GoldenBoxResultsExperience` |
| `/smokecraft/golden-box/judge` | `GoldenBoxJudgeDashboard` |
| `/smokecraft/golden-box/judge/entries/:entryId` | `GoldenBoxJudgeEntryReview` |
| `/smokecraft/golden-box/mentor/entries/:entryId` | `GoldenBoxMentorReview` |
| `/smokecraft/golden-box/packaging-studio` | `PackagingStudioDashboard` |
| `/smokecraft/golden-box/packaging-studio/new` | `PackagingStudioDashboard` |
| `/smokecraft/golden-box/packaging-studio/:designId` | `PackagingStudioEditor` |
| `/smokecraft/golden-box/packaging-studio/:designId/preview` | `PackagingStudioEditor` |
| `/smokecraft/golden-box/packaging-studio/:designId/versions` | `PackagingStudioVersions` |
| `/smokecraft/golden-box/packaging-studio/:designId/share` | `PackagingStudioShare` |
| `/smokecraft/golden-box/packaging-review/:shareToken` | `PackagingReview` |
| `/smokecraft/gold-box` | → redirects to `/smokecraft/golden-box` |

## 5. Compliance subsystem (`/smokecraft/compliance/*`, `/smokecraft/staff/*`, `/smokecraft/admin/*`)

| Route | Component |
|---|---|
| `/smokecraft/compliance/age-gate` | `ComplianceAgeGate` |
| `/smokecraft/compliance/policies` | `CompliancePolicyCenter` |
| `/smokecraft/compliance/consent` | `ComplianceConsentCenter` |
| `/smokecraft/compliance/data-rights` | `ComplianceDataRightsCenter` |
| `/smokecraft/staff/compliance/age-verification` | `ComplianceStaffAgeVerification` |
| `/smokecraft/admin/compliance` | `ComplianceAdmin` |

## 6. Venue commerce flow (`cart` / `checkout` / `menu`)

| Route | Component |
|---|---|
| `/smokecraft/menu` | `SmokeCraftMenu` |
| `/smokecraft/venue-commerce` | `SmokeCraftVenueCommerce` |
| `/smokecraft/order` | `SmokeCraftVenueCommerce` (alias) |
| `/smokecraft/ticket-tapper/staff-specials` | `SmokeCraftVenueCommerce` (alias) |
| `/smokecraft/cart` | `SmokeCraftCart` |
| `/smokecraft/checkout` | `SmokeCraftCheckout` |
| `/smokecraft/payment-success` | `SmokeCraftPaymentSuccess` |
| `/smokecraft/order-status` | `SmokeCraftOrderStatus` |

Note: this is distinct from the larger, **unrouted**
`src/pages/smokecraft/venueHumidor/**` commerce/admin/payment subsystem,
which exists as files but is deliberately not wired into `App.jsx` on this
branch (see doc 05, "excluded" section) — it would have required an untested
`@stripe/stripe-js` dependency and sits outside the tested canonical journey.

## 7. Supplemental / unguarded pages

Reachable but outside both the numbered spine and the supporting-module
prerequisite chain — mostly older standalone education/gamification screens
kept live rather than deleted:

`origins` `curation` `leaves` `leaf-challenge` `leaf-challenge-calculating`
`leaf-challenge-result` `cultivation` `blend` `flavor-dna` `pairing`
`available` `assistant` `pairing-mastery` `vitola` `leaderboard`
`rewards-center` `account` `event-challenge` `how-it-works` `demo-reset`
`guest-pass` `demo` `scan` `passport` `crafthub` `visit-complete`
`skill-tree` `collections` `challenge-hub`
`challenges/blend-fault-identification` `filler-arrangement` `art`

## 8. Backward-compatible aliases (`<Navigate>` redirects)

| From | To |
|---|---|
| `/smokecraft/intake` | `/smokecraft/enroll` |
| `/smokecraft/entry` | `/smokecraft` |
| `/smokecraft/profile` | `/smokecraft/identity` |
| `/smokecraft/education` | `/smokecraft/format` |
| `/smokecraft/mentors` | `/smokecraft/mentor-selection` |
| `/smokecraft/humidor` | `/smokecraft/humidor-match` |
| `/smokecraft/light` | `/smokecraft/cut-toast-light` |
| `/smokecraft/complete` | `/smokecraft/session-complete` |
| `/smokecraft/gold-box` | `/smokecraft/golden-box` |
| `/smokecraft/mentor` | `/smokecraft/mentor-selection` |
| `/smokecraft/shape-size-burn` | `/smokecraft/format` |
| `/smokecraft/challenge` | `/smokecraft/smokecraft-challenge` |
| `/smokecraft/mini-tasting-round` | `/smokecraft/mini-tasting` |
| `/smokecraft/session/start` | `/smokecraft/enroll` |

## 9. Diagnostic / non-journey utility routes (top-level, not under `/smokecraft`)

| Route | Purpose |
|---|---|
| `/smokecraft-visual-proof` | Visual proof viewer page |
| `/smokecraft-image-diagnostic` | Image asset diagnostic page |

## Legacy alias block (old numbered-session URLs)

`/smokecraft/session-1` through `/smokecraft/session-4` all redirect to
`/smokecraft` — pre-dates the current route naming and is kept only so old
links don't 404.
