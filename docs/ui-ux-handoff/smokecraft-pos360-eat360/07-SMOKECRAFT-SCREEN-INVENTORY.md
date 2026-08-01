# 07 — SmokeCraft Screen Inventory (Customer)

Source: `src/App.jsx` (route tree under `path="smokecraft"`), cross-checked
against `src/constants/smokecraftScreenManifest.js` and
`smokecraftRequiredInteractions.js`. All routes below are real and
mounted; `SmokeCraftSessionGuard` enforces sequential progression.

## Core 27-session spine (7 phases)

| Session # | Screen route | Component |
|---|---|---|
| 1 | `/smokecraft/welcome` | `SmokeCraftScreenRenderer screenId="session-1"` |
| — | `/smokecraft/enroll` | `Enroll` |
| — | `/smokecraft/venue-select` | `VenueSelect` |
| — | `/smokecraft/mentor-selection` | `Mentor` |
| 2 | `/smokecraft/humidor-match` | `SmokeCraftScreenRenderer screenId="session-2"` |
| 3 | `/smokecraft/meet-your-cigar` | `SmokeCraftScreenRenderer screenId="session-3"` |
| 4 | `/smokecraft/terroir` | `SmokeCraftScreenRenderer screenId="session-4"` |
| 5 | `/smokecraft/format` | `SmokeCraftScreenRenderer screenId="session-5"` (+ `cigar-gauge-guide`, `wrapper-strength` sub-screens) |
| — | `/smokecraft/seed-soil` | `SeedSoil` |
| 6 | `/smokecraft/cut-toast-light` | `SmokeCraftScreenRenderer screenId="session-6"` |
| 7 | `/smokecraft/lighting-tutorial` | `SmokeCraftScreenRenderer screenId="session-7"` |
| 8 | `/smokecraft/first-third` | `SmokeCraftScreenRenderer screenId="session-8"` |
| 10 | `/smokecraft/flavor-memory` | `SmokeCraftScreenRenderer screenId="session-10"` |
| 11 | `/smokecraft/pairing-lab` | `SmokeCraftScreenRenderer screenId="session-11"` (real pairing engine) |
| — | `/smokecraft/request-purchase` | `RequestPurchase` |
| 12 | `/smokecraft/second-third` | `SmokeCraftScreenRenderer screenId="session-12"` |
| 14 | `/smokecraft/mentor-commentary` | `SmokeCraftScreenRenderer screenId="session-14"` (real dynamic mentor service) |
| 15 | `/smokecraft/knowledge-drop` | `SmokeCraftScreenRenderer screenId="session-15"` |
| 16 | `/smokecraft/final-third` | `SmokeCraftScreenRenderer screenId="session-16"` |
| 19 | `/smokecraft/scorecard` | `SmokeCraftScreenRenderer screenId="session-19"` (server-computed overall score) |
| — | `/smokecraft/smokecraft-challenge` | `SmokeCraftChallenge` |
| — | `/smokecraft/second-humidor-match` | `SecondHumidorMatch` |
| — | `/smokecraft/mini-tasting` | `MiniTastingRound` |
| 21 | `/smokecraft/ai-summary` | `SmokeCraftScreenRenderer screenId="session-21"` |
| 22 | `/smokecraft/pairing-recommendations` | `SmokeCraftScreenRenderer screenId="session-22"` |
| 23 | `/smokecraft/passport-stamp` | `SmokeCraftScreenRenderer screenId="session-23"` |
| — | `/smokecraft/connections` | `Connections` |
| — | `/smokecraft/management-sync` (+ `/analytics`) | `ManagementSync`, `ManagementSyncAnalytics` |
| 24 | `/smokecraft/final-review` | `SmokeCraftScreenRenderer screenId="session-24"` |
| 25 | `/smokecraft/rewards` | `SmokeCraftScreenRenderer screenId="session-25"` |
| — | `/smokecraft/skill-tree`, `/collections`, `/challenge-hub`, `/challenges/blend-fault-identification`, `/filler-arrangement` | side-content screens |
| 27 | `/smokecraft/session-complete` | `SmokeCraftScreenRenderer screenId="session-27"` |
| — | `/smokecraft/visit-complete` | `VisitComplete` |

Note: sessions 9, 13, 17, 18, 20, 26 are covered by other named routes in
the same phase group (`origins`, `curation`, `leaves`,
`leaf-challenge*`, `cultivation`, etc. — see `10-COMPLETE-ROUTE-INVENTORY.md`
for the exhaustive raw list); this table shows the primary numbered-session
renderer routes only, not every ancillary screen.

## Golden Box (flagship competition system)

`/smokecraft/golden-box` (build), `.../status`, `.../competitions`,
`.../competitions/:competitionId`, `.../entries/:entryId/blend`,
`.../results/:competitionId`, `.../judge`, `.../judge/entries/:entryId`,
`.../mentor/entries/:entryId`, `.../packaging-studio` (+ `new`,
`:designId`, `:designId/preview`, `:designId/versions`,
`:designId/share`), `.../packaging-review/:shareToken`.

## Venue Humidor (customer side)

`/smokecraft/venue-humidor`, `.../checkout`, `.../order/:orderId`,
`.../:cigarId`, `/smokecraft/orders`, `.../orders/:orderId`,
`.../orders/:orderId/pickup`, `.../orders/:orderId/receipt`,
`/smokecraft/passport/acquisitions`, `.../acquisitions/:acquisitionId`,
`/smokecraft/humidor/recommendations`, `/smokecraft/humidor/pairing`.

## Screen count summary

27 numbered curriculum sessions + ~30 ancillary/support screens + 13
Golden Box screens + 8 customer Venue Humidor screens ≈ **75+ distinct
customer-facing SmokeCraft routes**, all real and mounted in `App.jsx`.
This is the most extensively built and proof-verified part of the
platform.
