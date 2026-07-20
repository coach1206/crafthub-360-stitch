# SmokeCraft Management Sync — Package D Test Report

## Environment

A fourth disposable, isolated local PostgreSQL 16 database
(`crafthub_pkg_d_test`), all 74 migrations applied (confirming no new
migration was added), real Express server on port 3001, real Vite dev
server on port 5000 (proxying `/api`) for the browser suite, swapped to
`vite preview` for the static frontend regression suites (matching the
established pattern from Package C, where dev-mode was shown to have
harmless rendering-timing differences from the production preview
build). All servers and the test database were torn down at the end.

## `verify-smokecraft-management-sync-package-d.mjs` — 20/20 passed (final clean run)

Part 1 (Package C completion): START creates one real server journey
(DB-verified); remount/re-click does not duplicate; expanded snapshot
mapper includes the new `mentor_selections` field (DB-verified, proving
the mapper expansion beyond Package C's 3 fields is real, not just
written); ARIA live region present (Playwright locator-verified).

Part 2 (analytics): guest denied; unauthorized staff denied; authorized
access succeeds; completed-journey count accurate (6/6 real seeded
rows); cigar/pairing/flavor trends accurate against real seeded data;
scorecard average accurate; no guest identity leaked into the response;
small sample (2 journeys) correctly suppressed; cross-venue denial with
a real seeded `venue_memberships` row; same-venue access succeeds; both
invalid and excessive date ranges rejected; no fabricated external
integration status. All test data removed at the end.

### A note on the guest-denial status code (401 vs 403)

This sandbox has no `JWT_SECRET`/production config, so `requireAuth`
falls through to its documented dev-mode fallback
(`req.user = {id:'proto-guest', role:'guest'}`) rather than rejecting
outright — meaning an unauthenticated request reaches
`requireVenueMembership` and is denied there (403), not at the
authentication layer (401). This is pre-existing platform behavior
(documented in the original backend architecture audit), not something
Package D introduced or worked around; the test accepts either status
as a valid denial and documents why.

### Transient flakiness observed and resolved

An earlier run of this suite (before a server restart) showed 3 failures
in the START/mapper checks purely due to `express-rate-limit`'s 30/min
write-endpoint limit being exhausted from repeated manual re-runs during
development — not a code defect. Restarting the server (which resets
the in-memory rate-limit store) and re-seeding test venues produced a
clean 20/20 run, confirmed twice.

## Regression suites

| Suite | Result |
|---|---|
| `npm run build` | PASS |
| Package A suite | 16/16 passed |
| Package B suite | 26/26 passed |
| Package B proof-gap suite | 16/16 passed |
| Package C suite | 23/23 passed |
| Package D suite | 20/20 passed |
| `verify-smokecraft-ticket-tapper-focused-integration.mjs` | 8/8 passed |
| `verify-smokecraft-full-approved-image-reconciliation.mjs` | 33/33 passed |
| `verify-crafthub-approved-image.mjs` | 22/22 passed |
| `verify-smokecraft-start-journey-crafthub-mvp2.mjs` | 18/18 passed |
| `verify-smokecraft-authoritative-sequence.mjs` | 20/20 passed |
| `verify-all-smokecraft-assets.mjs` | 62/62 passed |

Zero real new regressions across the entire stack (A through D).

## Cleanup

Test database dropped; Express server, Vite dev server, and both Vite
preview servers stopped; local PostgreSQL 16 cluster stopped; `dist/`
and temp log files removed.

## Addendum — re-run clean as a Package E regression

This exact suite (20/20) was re-run unchanged as part of Package E's
regression battery, against a fresh database, with identical results.
See `SMOKECRAFT_MANAGEMENT_SYNC_PACKAGE_E_TEST_REPORT.md`.
