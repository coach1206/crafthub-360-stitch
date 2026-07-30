# SmokeCraft Migration Queue — updated after Holistic Fix 2

Every one of the 108 routes now has a real classification (see
`SMOKECRAFT_SCREEN_CLASSIFICATION.md`) — the groups below are no longer
"unclassified", they are "classified but not yet interaction-verified /
not yet migrated onto the shared navigation registry or screen shell".
That is the real remaining work for Holistic Fix 3.

## Group 1 — Golden Box family (16 routes) — RESOLVED this pass (Holistic Fix 2B)

`golden-box`, `golden-box/status`, `golden-box/competitions`,
`golden-box/competitions/:competitionId`, `golden-box/entries/:entryId/blend`,
`golden-box/results/:competitionId`, `golden-box/judge`,
`golden-box/judge/entries/:entryId`, `golden-box/mentor/entries/:entryId`,
`golden-box/packaging-studio` (+`new`, `:designId`, `:designId/preview`,
`:designId/versions`, `:designId/share`), `golden-box/packaging-review/:shareToken`
— all 13 components now import and render `SmokeCraftScreenShell`,
verified via a real connected-flow browser test + 5-viewport sweep
(30/30 clean). Navigation-registry adoption applied where a
cross-cutting registered destination genuinely existed (CraftHub's
Golden Box entry point via `NAV.MENTOR`, `CompetitionDetail`/
`ResultsExperience`'s `NAV.GOLDEN_BOX`/`NAV.LEADERBOARD` back-links); most
Golden Box internal navigation is competition/entry-specific deep linking
(`/golden-box/competitions/${id}`, etc.), which is correctly NOT a
registry-covered cross-cutting destination. See
`SMOKECRAFT_SYSTEM_DEFECT_REGISTER.md`'s Holistic Fix 2B section and
`public/proof/smokecraft-holistic-fix-2b/` for full detail.

No dead controls found. Two real, correctly-honest empty states
confirmed (not defects): `golden-box/status` has zero controls by design
(instructional image), and `golden-box/judge` honestly shows "No entries
are currently assigned to you" rather than a fabricated queue. Missing
gameplay-engine pieces (a "defense" phase/screen, a dedicated awards
presentation, final scoring/ranking automation) recorded in the proof
index for the future gameplay-engine package — not built this pass, per
the mandate's own scope boundary.

## Group 2 — Origins/Curation/Leaf-Challenge/Cultivation module (9 routes) — RESOLVED this pass (Holistic Fix 2C)

`origins`, `curation`, `leaves`, `leaf-challenge`,
`leaf-challenge-calculating` (real auto-advancing transition screen, no
user control), `leaf-challenge-result`, `cultivation`, `blend`,
`flavor-dna` — all 9 now import and render `SmokeCraftScreenShell`.
**Relationship to the rest of the app, investigated and documented this
pass** (see `public/proof/smokecraft-holistic-fix-2c/index.md` for full
detail): this module is a real, substantial, fully-built but currently
**orphaned/unreachable** standalone educational flow — confirmed via grep
across `src/` that no `SmokeCraftSessionGuard`, no manifest entry, and no
entry-point link anywhere in the app (Landing, Welcome, CraftHub,
sidebars) leads into `/smokecraft/origins`. It predates the current
27-session/6-phase architecture per git history. It does NOT touch Golden
Box (separate namespace, no `golden_box_*` calls). It DOES write real
`completeStep('cultivation'/'blend')` entries (unrecognized by
`VISIT_STRUCTURE`, so harmless) and `Blend.jsx` awards real shared XP
(`XP_AWARDS.BLEND_CREATED`, 150). No education prerequisites gate any of
the 9 routes.

## Group 3 — Pairing-adjacent standalone screens (5 routes) — RESOLVED this pass (Holistic Fix 2D)

`pairing`, `available`, `assistant`, `pairing-mastery`, `vitola` — all 5
now import and render `SmokeCraftScreenShell`. Confirmed this pass:
`/smokecraft/pairing` is genuinely distinct from `/smokecraft/pairing-lab`
(S11), `/smokecraft/pairing-recommendations` (S22), and
`/smokecraft/humidor-match` (S2) — 4 distinct components confirmed via a
new build-blocking collision guard in
`scripts/validateSmokecraftShellAdoption.mjs` that resolves each route's
registered component from `App.jsx` and fails if any two collide.
`/smokecraft/pairing` is the only one of the 5 that is live-reachable
(Landing/Welcome/CommandHub); `available`/`assistant`/`pairing-mastery`/
`vitola` are confirmed orphaned — referenced only in the legacy
`SMOKECRAFT_FLOW` config consumed by the admin-only NOVEE OS module
registry, never live guest navigation. See
`public/proof/smokecraft-holistic-fix-2d/index.md` for full detail and
the pairing-engine gaps recorded for the gameplay-engine package.

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

**Screen-shell adoption: 82 of 108 routes** (7 Holistic Fix 2A + 16 Golden
Box Holistic Fix 2B + 9 Origins/Curation module Holistic Fix 2C + 5
Pairing-adjacent Holistic Fix 2D + 20 standalone-screen Holistic Fix 2E +
all 21 curriculum-spine session slots via the shell-wrapped
`SmokeCraftScreenRenderer` + `WrapperStrength.jsx` Holistic Fix 2E-2 + 5
commerce-flow screens Holistic Fix 2E-4, across 61+ unique component
files/render paths — see `validateSmokecraftShellAdoption.mjs`'s `TARGETS`
array for the exact list). Verified count cross-checked by
`validateSmokecraftManifest.mjs` (floor currently 82, both build-blocking
validators pass 0 failures).

**Remaining unmigrated (26 of 108 routes)**: the 14 legacy `<Navigate>`
aliases (intentionally not shell-wrapped — they redirect, never render),
and a residual set of already-audited standalone routes not yet ported
onto the shell (see `SMOKECRAFT_SYSTEM_DEFECT_REGISTER.md`'s Holistic Fix
2E-4 section and `public/proof/smokecraft-holistic-fix-2e-4/02-route-classifications.md`
for the full 108-route classification). No route remains unclassified.

**Holistic Fix 2E status (as of Holistic Fix 2E-5)**: shell/registry
migration for curriculum + commerce is complete and regression-locked.
Remaining open work before Holistic Fix 2E can close: manual educational
content fixes for the gaps documented in
`SMOKECRAFT_EDUCATIONAL_COMPLETENESS_AUDIT.md` (Golden Box relevance not
surfaced in-session-content for sessions 2-27; missing on-screen titles
for 11 of 21 session slots; "why it matters" prose absent or unconfirmed
for most sessions), a dedicated five-viewport curriculum sweep, and
updates to `SMOKECRAFT_SCREEN_CLASSIFICATION.md` / `SMOKECRAFT_INTERACTION_MATRIX.md`
/ `SMOKECRAFT_LOCKED_BASELINE.md` reflecting the current 82-route adoption
count.

## Holistic Fix 2E-11 status note

Shell/registry migration count is unchanged this pass (82 of 108 routes,
same floor enforced by `validateSmokecraftManifest.mjs`) — 2E-11 closed
Stage 2's control-architecture requirement (all 276 curriculum controls
mapped to 7 tested implementation groups, coverage-validator locked) and
did not migrate additional routes. No route classification changed.
Server-side idempotency for XP/badges/Passport stamps remains an
explicitly out-of-scope gameplay-engine requirement, handed off to
Holistic Fix 4 / the gameplay-engine package rather than blocking Stage 2
closure.

## Holistic Fix 3 status note

Shell/registry migration count is unchanged this pass (still the
pre-existing floor enforced by `validateSmokecraftManifest.mjs`) — this
pass closed system-wide responsive architecture (0 confirmed horizontal
overflow, scroll-blocking, nav-obscuring, or image-stretch defects
across all 108 routes × 5 viewports, locked by the new
`validateSmokecraftResponsive.mjs`) and did not migrate additional
routes. 5 pre-existing portrait assets remain flagged for
horizontal-replacement artwork (`SC-D002`), out of scope for this pass.

## Holistic Fix 4 status note

Two new database migrations added and applied this pass (092, 093) —
see `SMOKECRAFT_STATE_OWNERSHIP_MAP.md` and the Holistic Fix 4 defect-
register section for full detail. Screen/route migration-to-shell-
adoption count is unchanged (this pass is a backend/state-authority
change, not a shell migration). Server-authoritative persistence is now
live for session completion and Passport-stamp awards across 34+
screens that call the shared `awardSessionRewards`/`awardStamp`
functions; XP/badge award paths beyond that remain queued for a future
pass to wire per-screen where a real award-granting UI action exists
independent of session completion.

## Holistic Fix 4B status note

Two new migrations this pass (094: guest-conversion records +
journey-snapshot columns). Route count is now 109 (was 108) — the new
`/smokecraft/account` screen. Shell-adoption floor and classification
counts otherwise unchanged. See `SMOKECRAFT_STATE_OWNERSHIP_MAP.md`'s
Holistic Fix 4B section for the full state-migration accounting.

## Holistic Fix 5A status note

One new migration this pass (095: gameplay rule registry, rank history,
leaderboard eligibility). No route/shell-adoption changes. Server-side
gameplay ledger now covers session-completion XP, badge auto-unlock,
one Passport-stamp auto-unlock, rank promotion, and the leaderboard for
the primary 27-session curriculum — see
`SMOKECRAFT_GAMEPLAY_ENGINE_MAP.md` for what remains queued
(client-controlled `addXP()` surface, Origins-module stamp eligibility,
Challenge Hub/Golden Box scoring deferred to 5C, pairing/mentor
intelligence deferred to 5B).

## Holistic Fix 5A-2 update

**096_smokecraft_activity_ledger_and_rules.sql** — additive. Adds
`smokecraft_activity_attempts` (evidence-bearing quiz/leaf-challenge/
named-XP attempt ledger, `UNIQUE(guest_reference, activity_type,
activity_key)` + `UNIQUE(guest_reference, idempotency_key)`) and
`smokecraft_reward_corrections` (append-only correction/reversal ledger,
`reason`/`authorized_by` required, `idempotency_key` UNIQUE). Rollback:
`server/db/rollbacks/096_smokecraft_activity_ledger_and_rules.rollback.sql`
(outside the migrations directory, matching the established convention).
Verified apply/rollback/reapply clean, compatible with 092-095.

Rule registry rows are seeded (not migrated) via the idempotent
`scripts/seedSmokecraftGameplayRules.mjs` — 46 version-1 rows, safe to
re-run.

## Golden Box judging/results/awards migrations (5C-2A / 5C-2B-1 / 5C-2B-2)

**103_smokecraft_golden_box_judging_authority.sql** — additive. Adds
`golden_box_rubric_criteria` (formalized, already-approved 12-category
rubric), `assigned_by` on `golden_box_judge_assignments`,
`weighted_total`/`rule_version`/`draft_version`/`idempotency_key` on
`golden_box_scorecards`, plus the partial unique index
`idx_gbsc_one_original_per_judge_entry` that closes SC-D060's
NULL-uniqueness gap. Rollback:
`server/db/rollbacks/103_smokecraft_golden_box_judging_authority.rollback.sql`.

**104_smokecraft_golden_box_results_authority.sql** — additive. Adds
per-entry judge/completion counts, criterion averages, variance, and
result/rubric versioning columns to `golden_box_results`, plus the new
`golden_box_result_finalizations` table (`UNIQUE(competition_id,
result_version)`). Rollback:
`server/db/rollbacks/104_smokecraft_golden_box_results_authority.rollback.sql`.

**105_smokecraft_golden_box_awards_authority.sql** — additive. Adds
`golden_box_awards` (per-entry award detail:
placement/award_type/rule_id/rule_version/xp-badge-stamp status) and
`golden_box_award_issuances` (`UNIQUE(competition_id, result_version)`
— the atomic one-issuance-per-finalized-result-version gate). Rollback:
`server/db/rollbacks/105_smokecraft_golden_box_awards_authority.rollback.sql`.

All three applied and verified clean (apply + targeted regression
suites green) as part of their respective passes; no schema conflicts
with 077/096/102.

## Stage 5 Closure Gate update

No new migration this pass — SC-D062 closure removed the dormant
`POST /entries/:entryId/rewards` route/handler entirely (code-only
change, no schema change) and fixed a live identity-resolution defect
in `goldenBoxController.js`'s `identityFrom()` (also code-only). Queue
entries above for migrations 103-105 were added retroactively — they
had been applied and verified in their originating passes but were
never recorded here; this closes that documentation gap.

## Venue Humidor 1A update

**106_smokecraft_venue_humidor_foundation.sql** — additive. Adds
`venue_cigar_products`, `venue_cigar_inventory_events` (append-only),
`venue_cigar_inventory_holds`, `venue_cigar_reservations`,
`venue_cigar_orders`, `venue_cigar_order_items` — all FK-scoped to the
existing `venues(venue_id)`, no parallel venue concept. Per-venue
unique indexes on `(venue_id, sku)` and `(venue_id, barcode)`, partial
unique idempotency-key indexes on every mutation-tracking table, and
non-negative `CHECK` constraints on every quantity column. Rollback:
`server/db/rollbacks/106_smokecraft_venue_humidor_foundation.rollback.sql`
(verified live this pass: apply → rollback → reapply all clean, no
data loss outside this migration's own new tables).
