# SmokeCraft Management Sync — Implementation Package Plan (Phase 13)

Nothing in this plan is implemented this package.

## Package A — Database and core models

- **Create**: `server/db/migrations/074_smokecraft_management_sync.sql`
  (5 tables per the schema doc, or 4 if the venue-insights table is
  deferred per its on-demand-vs-materialized decision).
- **Create**: `server/services/managementSync/managementSyncQueries.js`
  — thin parameterized-SQL query layer (no ORM, matches convention).
- **Modify**: none.
- **Migrations**: 1 new file (see above).
- **Tests**: schema smoke test (insert/conflict/cascade, per Migration
  Plan §5).
- **Proof**: `psql` output or a Node script confirming the unique index
  rejects a duplicate insert.
- **Dependencies**: confirmed real venue-table column name (Phase 1 §16
  blocker) must be resolved first, or the `venue_id` FK is deferred to a
  soft reference (TEXT, no FK) until resolved.
- **Risks**: guessing the wrong venue-table shape; mitigated by treating
  the FK as optional/soft until Phase 1 §16 is confirmed.
- **Acceptance**: migration runs cleanly against a real Postgres
  instance; smoke test passes; no existing table altered.
- **Rollback**: `DROP TABLE IF EXISTS` in reverse order (Migration Plan
  §10).

## Package B — Service and API

- **Create**: `server/services/managementSync/managementSyncService.js`,
  `server/controllers/managementSyncController.js`,
  `server/routes/managementSyncRoutes.js`.
- **Modify**: `server/index.js` (mount the new router).
- **Migrations**: none new.
- **Tests**: endpoint-level tests for auth (401/403/404), idempotency
  (duplicate `POST /sync` returns the same event), venue isolation
  (Venue A token cannot read Venue B insights).
- **Proof**: request/response logs for each test above.
- **Dependencies**: Package A tables must exist; guest-identity token
  design (Security Model doc, "known gap") must be resolved here — this
  is the single largest open design decision in the whole plan.
- **Risks**: guest-identity design is unresolved; shipping this package
  without it means guest-facing endpoints either stay
  `requireAuth`-only (excluding guests) or ship with a weaker,
  documented-as-such guest token scheme.
- **Acceptance**: all Phase 5 endpoints implemented exactly as
  contracted; all Phase 7 access-control rules pass automated tests.
- **Rollback**: unmount the router in `server/index.js`; no data
  migration to reverse.

## Package C — Frontend population engine

- **Create**: `src/hooks/useManagementSyncData.js` (or repo's preferred
  naming), wiring `ManagementSync.jsx` to the new API.
- **Modify**: `src/pages/smokecraft/ManagementSync.jsx` — replace the
  current honest "not connected yet" disclosure with real field
  population where available, preserving the same honest-unavailable
  pattern for anything still `insufficient_data`/`not_collected`.
- **Migrations**: none.
- **Tests**: Playwright checks that each of the 28 fields catalogued in
  `SMOKECRAFT_MANAGEMENT_SYNC_DATA_MAP.md` renders either a real value or
  an honest unavailable message — never a blank field, never a fabricated
  one.
- **Proof**: screenshots of the populated screen in at least one "real
  data present" and one "insufficient data" state.
- **Dependencies**: Package B live.
- **Risks**: regressing the current honest-disclosure UX if the new
  wiring is incomplete — mitigated by keeping the existing disclosure
  text as the fallback for any field the API marks unavailable.
- **Acceptance**: no fabricated value ever rendered; matches the response
  contract's availability reasons 1:1.
- **Rollback**: revert `ManagementSync.jsx` to the current
  honest-disclosure version (already in this package's approved,
  preserved state).

## Package D — Management actions and destinations

- **Scope**: only real actions — analytics-viewed tracking, inventory
  handoff request, staff feedback submission (requires new
  staff-feedback persistence, not yet designed — would need its own
  mini-Phase-3/4 pass first).
- **Explicitly not included**: any E.A.T. 360/POS360/NOVEE OS "send"
  action, since none of those destinations are live for Management Sync
  (Destination Audit doc) — building one would fabricate a live
  integration.
- **Dependencies**: Package B; staff-feedback schema (new, undesigned).
- **Risks**: scope creep into building a second, adjacent feature
  (staff-feedback) inside what should be a Management Sync package.
- **Acceptance**: TBD until staff-feedback schema is separately designed.

## Package E — End-to-end security and acceptance

- **Scope**: automated multi-user/multi-venue isolation tests
  (User A/User B, Venue A/Venue B), concurrency test for the idempotency
  unique index (parallel `POST /sync` requests), offline/reconnect
  manual test, visual regression on `ManagementSync.jsx`, deployment
  gating checklist.
- **Dependencies**: Packages A-C complete.
- **Risks**: none beyond standard integration-test flakiness.
- **Acceptance**: matches the mandate's original 17-step multi-user/
  multi-venue isolation test plan (from the prior, superseded full
  mandate) — reusable as Package E's test plan without re-deriving it.
- **Rollback**: N/A (test-only package).

## Explicit scope boundary for this current package

This document plans Packages A-E. **None of them are implemented here.**
The next package, if approved, should implement Package A only.

## Addendum — Package A implemented (this package)

Package A is complete: migration `074_smokecraft_management_sync.sql`
created, applied, and validated (4 tables, 8 FKs, 15 indexes, 23
constraints, 16/16 behavior tests passed, rollback tested). See
`SMOKECRAFT_MANAGEMENT_SYNC_PACKAGE_A_IMPLEMENTATION.md` for the full
record. Package B is now unblocked to begin, pending explicit approval,
with the handoff contract in
`SMOKECRAFT_MANAGEMENT_SYNC_PACKAGE_B_HANDOFF.md`.

## Addendum — Package A finalized (prior package)

Package A's scope is now narrowed and confirmed buildable without
guessing: **4 tables** (not 5 — `venue_insights` deferred), real `venue_id`
FK to `venues(venue_id)`, soft (no-FK) `user_id` pending the System
1/System 2 user-table reconciliation, and a confirmed real migration
runner (`npm run db:migrate`) to execute it. Full detail:
`SMOKECRAFT_MANAGEMENT_SYNC_PACKAGE_A_READINESS.md`. Package B's stop
condition is now explicit: do not start until the guest-identity JWT
design (or an accepted alternative) has a go/no-go decision, since every
guest-facing endpoint in Package B depends on it.

## Addendum — Package B implemented (this package)

Package B is complete: guest identity middleware, venue validation,
venue-scoped authorization, journey/snapshot/sync/action services, 10
API endpoints, all mounted at `/api/smokecraft/management-sync`. 26/26
Package B tests + 16/16 Package A regression tests + 6/6 frontend
regression suites all passed. Four real bugs were found and fixed
during testing (see `SMOKECRAFT_MANAGEMENT_SYNC_PACKAGE_B_IMPLEMENTATION.md`).
Package C (frontend wiring) is now unblocked, pending approval, with
handoff guidance in `SMOKECRAFT_MANAGEMENT_SYNC_PACKAGE_C_HANDOFF.md`.

## Addendum — Package C implemented (this package)

A real, live-tested end-to-end vertical slice is now wired on the
Management Sync screen: guest identity → venue-validated journey
creation → versioned snapshot → server completion → explicit sync,
23/23 tests passing against a real browser, real server, real database.
Both disclosed Package B proof gaps (cross-user/cross-venue denial,
forced rollback) were also closed with real evidence this package. Full
per-checkpoint snapshot wiring across the other 9 journey screens and
server-side START/RESUME reconciliation remain deferred — see
`SMOKECRAFT_MANAGEMENT_SYNC_PACKAGE_C_IMPLEMENTATION.md` for the
disclosed scope, and `SMOKECRAFT_MANAGEMENT_SYNC_PACKAGE_D_HANDOFF.md`
for the next package (venue analytics aggregation).

## Addendum — Package D closed the disclosed gaps and built real analytics

START and RESUME now both call the real server-journey hook; the
snapshot mapper expanded to ~10 real fields; 2 additional checkpoints
wired (Scorecard, Session Complete); ARIA live regions added. Real
venue analytics (on-demand queries, no new migration) are now live at
`GET /venues/:venueId/insights`, sample-size-suppressed, privacy-safe,
live-tested with real seeded data (20/20 Package D tests, plus 65/65
across A/B/C regressions). See
`SMOKECRAFT_MANAGEMENT_SYNC_PACKAGE_D_IMPLEMENTATION.md` and
`SMOKECRAFT_MANAGEMENT_SYNC_PACKAGE_E_HANDOFF.md` for what remains.

## Addendum — Package E: honest integration audit complete

All 8 systems (Ticket Tapper, Passport 360, Staff Handoff, Inventory,
POS360, E.A.T. 360, NOVEE OS, Internal Management Sync) audited and
classified with real evidence. Only 2 are genuinely CONNECTED (Internal
Management Sync, Ticket Tapper) — both live-health-checked on every
request. No fake bridge was built for the other 6. See
`SMOKECRAFT_MANAGEMENT_SYNC_PACKAGE_E_IMPLEMENTATION.md` and
`VENUE_MANAGEMENT_COMMAND_HUB_PACKAGE_6_HANDOFF.md`.
