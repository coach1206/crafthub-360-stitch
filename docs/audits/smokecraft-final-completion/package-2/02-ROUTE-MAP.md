# Route Map — Package 2

## Existing (unchanged)

| Route | Component | Behavior |
|---|---|---|
| `/smokecraft/golden-box` | `GoldenBox.jsx` | Rules-acceptance screen (unchanged) |
| `/smokecraft/golden-box/status` | `GoldenBoxStatus.jsx` | Static approved image (unchanged) |

## New (Package 2)

| Route | Component | Session guard | Notes |
|---|---|---|---|
| `/smokecraft/golden-box/competitions` | `GoldenBoxHub.jsx` | None (server enforces identity/eligibility) | Real Golden Box entry hub — deviates from the mandate's suggested bare `/smokecraft/golden-box` path since that path is already the rules-acceptance screen, which was left untouched per instruction |
| `/smokecraft/golden-box/competitions/:competitionId` | `CompetitionDetail.jsx` | None | Competition detail + eligibility result |
| `/smokecraft/golden-box/entries/:entryId/blend` | `EntryWorkspace.jsx` | None | Entry creation/blend-builder/review/submission/status, internal step state |
| `/smokecraft/golden-box/results/:competitionId` | `ResultsExperience.jsx` | None | Results, links to existing Leaderboard/Rewards |

No route-level `SmokeCraftSessionGuard` was added, matching the existing
`ManagementSyncAnalytics`/Venue-Management-Command-Hub pattern: the
server enforces `requireSmokeCraftIdentity`/ownership/visibility on
every call, and each page renders its own honest denied/error state on
failure rather than relying on a client-side route gate.

## No duplicate routes created

Verified against `src/App.jsx`'s full route list (see Package 0's
`03-ROUTE-COMPONENT-REGISTRY.md`) — none of the 4 new paths collide with
any existing route, including the ~57 legacy/demo routes catalogued
there.
