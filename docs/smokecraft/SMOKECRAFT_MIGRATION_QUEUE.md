# SmokeCraft Migration Queue — for Holistic Fix 2

Generated from `docs/smokecraft/SMOKECRAFT_GAME_MANIFEST.json`'s 78
`unclassified` routes. Grouped by shared defect/migration class (per the
Holistic Fix 1 mandate: "group screens by shared defect class, not one
page at a time"), in the order Holistic Fix 2 should tackle them. No group
below has been individually interaction-audited yet — group membership is
based on route/component naming and shared architectural shape, not a
claim that a specific defect has been confirmed in every member.

## Group 1 — Golden Box family (16 routes, highest priority: biggest single supporting module, real competition backend, investor-visible)

`golden-box`, `golden-box/status`, `golden-box/competitions`,
`golden-box/competitions/:competitionId`, `golden-box/entries/:entryId/blend`,
`golden-box/results/:competitionId`, `golden-box/judge`,
`golden-box/judge/entries/:entryId`, `golden-box/mentor/entries/:entryId`,
`golden-box/packaging-studio` (+`new`, `:designId`, `:designId/preview`,
`:designId/versions`, `:designId/share`), `golden-box/packaging-review/:shareToken`.

Shared migration work: classify each as full-live-react vs clean-image-shell;
confirm each uses the shared `SmokeCraftScreenShell` contract once it's
adopted; confirm persistence/backend requirements (per this operation's own
prior notes, Package 1/2 already wired a real backend here — needs
re-confirmation, not re-building); confirm no baked judge/mentor review data.

## Group 2 — Origins/Curation/Leaf-Challenge/Cultivation content module (9 routes)

`origins`, `curation`, `leaves`, `leaf-challenge`,
`leaf-challenge-calculating`, `leaf-challenge-result`, `cultivation`,
`blend`, `flavor-dna`.

Shared migration work: this module's relationship to the 27-session spine
and to Golden Box is not yet documented anywhere in this recovery
operation's canonical docs — first task is determining whether it's a
supporting module, a legacy/superseded flow, or dead code, before any
interaction audit.

## Group 3 — Pairing-adjacent standalone screens (5 routes)

`pairing`, `available`, `assistant`, `pairing-mastery`, `vitola`.

Shared migration work: these are separate from the canonical curriculum
`pairing-lab` (S11) and `pairing-recommendations` (S22) — same naming
collision risk this operation already found and fixed once for Landing's
PAIRING destination (see `smokecraftLandingActions.js` docstring). Confirm
none of these is an orphaned dead route, and that no Landing/sidebar control
points at the wrong one.

## Group 4 — SmokeCraft commerce module (8 routes, 3 routes share exactly one component)

`menu` (SmokeCraftMenu), `venue-commerce` + `order` + `ticket-tapper/staff-specials`
(all three render the identical `SmokeCraftVenueCommerce` component — a real,
disclosed architecture smell: three URLs for one screen, not yet consolidated
into one canonical route with the others as registry-level aliases), `cart`,
`checkout`, `payment-success`, `order-status`.

Shared migration work: consolidate the 3-routes-1-component case into the
navigation registry as a single canonical destination with documented
aliases (the same fix already applied to Landing's action map), then audit
the real cart/checkout/payment flow for live vs. fabricated order data.

## Group 5 — Legacy route aliases (13 routes, lowest interaction risk, highest cleanup value)

`intake`, `entry`, `profile`, `education`, `mentors`, `humidor`, `light`,
`complete`, `gold-box`, `mentor`, `challenge`, `mini-tasting-round`,
`session/start` — all `<Navigate>` redirects to a canonical route.

Shared migration work: confirm every one still points at a route that
exists (the navigation-registry validator added in this pass already
checks this for the registry's own destinations; these raw `<Navigate>`
aliases are not yet covered by an equivalent automated check — add one in
Holistic Fix 2). Candidate for a single "alias table" constant instead of
13 scattered `<Route><Navigate>` lines in `App.jsx`.

## Group 6 — Remaining standalone supporting screens (22 routes, audit individually or in small pairs)

`art`, `mentor-selection`, `cigar-gauge-guide`, `wrapper-strength`,
`seed-soil`, `request-purchase`, `knowledge-check-demo`, `mini-tasting-module`,
`second-humidor-match`, `mini-tasting`, `management-sync` (+`analytics`),
`skill-tree`, `collections`, `filler-arrangement`, `visit-complete`,
`resume` (ResumeJourney), `rewards-center`, `how-it-works`, `demo-reset`,
`guest-pass`, `demo`, `scan`.

No single shared defect class was evident from route/component naming
alone for this group — Holistic Fix 2 should re-derive sub-groups after a
first-pass source read, rather than this pass guessing groupings it hasn't
verified.

## Not included in this queue

The 4 entry screens and 21 curriculum-spine routes (27 sessions) already
have canonical manifest coverage via `SMOKECRAFT_SCREEN_MANIFEST`, and the
33 routes already deep-audited this operation (Welcome, Leaderboard,
Passport, CraftHub, Venue Selection, Connections, Passport Stamp, Rewards,
Challenge Hub, Event Challenge, SmokeCraft Challenge, Blend Fault
Identification) are excluded — see `SMOKECRAFT_SCREEN_CLASSIFICATION.md`.
