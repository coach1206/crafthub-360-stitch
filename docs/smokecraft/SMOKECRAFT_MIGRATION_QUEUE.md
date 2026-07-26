# SmokeCraft Migration Queue — updated after Holistic Fix 2

Every one of the 108 routes now has a real classification (see
`SMOKECRAFT_SCREEN_CLASSIFICATION.md`) — the groups below are no longer
"unclassified", they are "classified but not yet interaction-verified /
not yet migrated onto the shared navigation registry or screen shell".
That is the real remaining work for Holistic Fix 3.

## Group 1 — Golden Box family (16 routes) — STILL OPEN

`golden-box` (full-live-react), `golden-box/status` (instructional-image —
`SmokeCraftAssetScreen` only, no controls found), `golden-box/competitions`,
`golden-box/competitions/:competitionId`, `golden-box/entries/:entryId/blend`,
`golden-box/results/:competitionId`, `golden-box/judge`,
`golden-box/judge/entries/:entryId`, `golden-box/mentor/entries/:entryId`,
`golden-box/packaging-studio` (+`new`, `:designId`, `:designId/preview`,
`:designId/versions`, `:designId/share`), `golden-box/packaging-review/:shareToken`
— all source-classified `full-live-react` this pass (real components with
real controls), none individually browser-interaction-tested yet, none
migrated onto `smokecraftNavigationRegistry` or `SmokeCraftScreenShell`.

## Group 2 — Origins/Curation/Leaf-Challenge/Cultivation module (9 routes) — STILL OPEN

`origins` (instructional-image), `curation`, `leaves`, `leaf-challenge`,
`leaf-challenge-calculating` (instructional-image — real auto-advancing
transition screen, confirmed via source read this pass, no user control),
`leaf-challenge-result`, `cultivation`, `blend`, `flavor-dna`
(instructional-image). Relationship to the 27-session spine and to Golden
Box still not documented anywhere canonical — first task for Holistic Fix 3
remains determining whether this is a supporting module, a legacy/
superseded flow, or dead code.

## Group 3 — Pairing-adjacent standalone screens (5 routes) — STILL OPEN

`pairing` (full-live-react), `available`, `assistant` (full-live-react via
`ComingSoon`), `pairing-mastery` (full-live-react via `ComingSoon`),
`vitola`. Confirmed this pass: `/smokecraft/pairing` is genuinely distinct
from `/smokecraft/pairing-lab` (S11) — WelcomeExperience.jsx's bottom-strip
"Pairing" control correctly targets `/smokecraft/pairing`, not
`pairing-lab`, and this distinction is now protected in the navigation
registry via two separate keys (`PAIRING` vs `PAIRING_STANDALONE`) so a
future edit can't silently collapse them.

## Group 4 — SmokeCraft commerce module (8 routes) — RESOLVED this pass (item 10)

`menu`, `venue-commerce` + `order` + `ticket-tapper/staff-specials` (all
three intentionally render `SmokeCraftVenueCommerce` — confirmed via source
read that the component reads no route param/pathname to differentiate
behavior, and no internal code links to `order` or
`ticket-tapper/staff-specials` at all, meaning they exist purely as
external/legacy entry aliases), `cart`, `checkout`, `payment-success`,
`order-status`. **Decision: documented and enforced as an intentional alias
group** (not "connect each to distinct behavior", since no distinct
behavior exists to connect to and inventing one would be fabrication).
Enforced by `scripts/validateSmokecraftManifest.mjs`'s new commerce-alias
check, which fails the build if the three routes ever render different
components without an explicit, deliberate change to that check.

## Group 5 — Legacy route aliases (14 routes) — TESTED this pass (item 11)

`intake`, `entry`, `profile`, `education`, `mentors`, `humidor`, `light`,
`complete`, `gold-box`, `mentor`, `challenge`, `mini-tasting-round`,
`session/start` (13 `<Navigate>` aliases) — all now automatically verified
by `scripts/validateSmokecraftManifest.mjs`'s new alias-resolution check,
which confirms every alias target still exists in the live route inventory
(0 broken found). Not yet consolidated into a single alias-table constant
(cosmetic cleanup, not a defect) — still 13 scattered `<Route><Navigate>`
lines in `App.jsx`.

## Group 6 — Remaining standalone supporting screens — mostly classified this pass

`art`, `mentor-selection`, `cigar-gauge-guide`, `wrapper-strength`,
`seed-soil`, `request-purchase`, `knowledge-check-demo`,
`mini-tasting-module`, `second-humidor-match` (full-live-react — real
`SmokeCraftNavBar` Primary/Secondary controls, confirmed via source read),
`mini-tasting` (full-live-react, same pattern), `management-sync`
(+`analytics`), `skill-tree`, `collections`, `filler-arrangement`,
`visit-complete`, `resume` (ResumeJourney), `rewards-center`,
`how-it-works`, `demo-reset`, `guest-pass` (clean-image-shell —
`SmokeCraftAssetRoute` hotspot pattern, confirmed via source read),
`scan` (same pattern). All source-classified this pass; none individually
browser-interaction-tested or migrated onto the shared navigation registry
/ screen shell yet.

## Already fully migrated + interaction-verified (not open work)

**Holistic Fix 2A — full shell + navigation-registry migration (7
screens):** Welcome, Leaderboard, Passport, Venue Selection, CraftHub,
Challenge Hub, and Rewards all now import and render
`SmokeCraftScreenShell`, no longer import `SmokeCraftImageBoundsOverlay`
directly, use `smokecraftNavigationRegistry` for every registered
destination they expose, and are protected by 2 new build-blocking
regression suites (`validateSmokecraftShellAdoption.mjs`, 44 checks) plus
a 5-viewport real-browser verification (35 checks, 34 clean + 1
investigated flaky non-regression). See
`SMOKECRAFT_SYSTEM_DEFECT_REGISTER.md`'s Holistic Fix 2A section for full
per-screen detail and `public/proof/smokecraft-holistic-fix-2a/` for
screenshots and raw results.

**Screen-shell adoption: 7 of 108 screens** (up from 0). The remaining ~70
supporting routes (Golden Box, Origins/Curation module, Pairing-adjacent,
remaining standalone screens) are the next unit of work for Holistic Fix
3 — same migration pattern (shell + registry + 5-viewport verification +
regression lock), applied to the next migration group.

The 33 routes already deep-audited in Prompts 3B–3E-3 (Welcome,
Leaderboard, Passport, CraftHub, Venue Selection, Connections, Passport
Stamp, Rewards, Challenge Hub, Event Challenge, SmokeCraft Challenge, Blend
Fault Identification, + the 21 curriculum-spine routes) remain excluded
from "needs classification" — they already have real evidence.
