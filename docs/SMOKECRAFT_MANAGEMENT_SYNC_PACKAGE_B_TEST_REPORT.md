# SmokeCraft Management Sync — Package B Test Report

## Environment

Same pattern as Package A: no `DATABASE_URL` is configured in this
sandbox by default, so a **second disposable, isolated local PostgreSQL
16 database** (`crafthub_pkg_b_test`, same already-installed server as
Package A, not production, not Railway) was created, all 74 migrations
(001-074) applied via the real `npm run db:migrate` runner, and **the
real Express server** (`server/index.js`) was started against it on a
local test port with a test-only `JWT_SECRET`. This is the first package
in this session to test real HTTP routes end-to-end against a running
server, not just direct database queries. Both the test database and
the server process were fully torn down at the end of this package (see
Cleanup).

## Package B suite: `verify-smokecraft-management-sync-package-b.mjs`

**26/26 passed** on the final clean run. Covers (mapped to the mandate's
45-item list; items not separately scripted are marked and explained
below, not silently skipped):

1-5. Guest identity issuance, HttpOnly cookie, invalid/expired token
rejection, authenticated-identity precedence (implicitly verified: real
users bypass guest-cookie logic entirely in `attachSmokeCraftIdentity`) — PASS.
6-8. Valid/unknown/inactive venue — PASS.
9-12. Guest creates own journey; client-supplied guest ID rejected;
duplicate-active-journey behavior (not separately constrained by this
design — multiple in-progress journeys per guest are allowed, matching
the schema's lack of a "one active journey" unique constraint, which
was a deliberate Package A decision, not a Package B gap); guest resumes
own journey via GET — PASS (duplicate-journey item is a documented
non-constraint, not a failure).
13. Cross-guest denial — PASS.
14-18. Cross-user denial, cross-venue denial, inactive-membership,
missing/valid venue permission — **structurally verified via code
review + the platform-admin-bypass path exercised live**, not via two
distinct seeded `venue_memberships` rows this pass (see Security Report
"Known limitations" — disclosed, not silently claimed as fully tested).
19. Platform-admin access — PASS (dev-header `admin` role bypass exercised live).
20-23. Snapshot creation, server-controlled version, duplicate-payload
handling, server-computed payload hash — PASS.
24-26. Journey completion, idempotent repeat, invalid-status-transition
(covered by `completeJourney`'s `abandoned` guard, not separately
HTTP-tested this pass — verified via the Package A DB-level test's
status CHECK constraint instead) — PASS for the two HTTP-tested items.
27-31. Sync requires completion (structurally enforced — untested via a
dedicated incomplete-journey HTTP call this pass, since the only journey
in the test run reaches completion before sync is attempted; the
`journey_incomplete` code path is exercised at the service level by
`requestManagementSync`'s status check, reviewed not HTTP-tested), valid
sync, duplicate sync, concurrent sync (3 simultaneous requests → 1
event), unsupported destination — PASS for all HTTP-tested items.
32-34. No sync on GET, no fabricated external integration status (only
`venue_insights` is ever marked `completed`; every other destination is
rejected before reaching the sync service at all) — PASS.
35-39. Server-derived actor identity (structural, confirmed via code —
`actorId` is never read from the request body), invalid action type,
oversized payload, malformed JSON (Express's built-in `express.json()`
body parser already 400s on malformed JSON before any Package B code
runs — not separately re-tested), prototype-pollution — PASS for the
scripted items.
40-41. Audit events created, secrets absent from logs — PASS.
42-45. Transaction rollback leaves no partial records (verified via the
snapshot/sync services' `BEGIN`/`COMMIT`/`ROLLBACK` structure and the
Package A rollback test, not a dedicated forced-failure HTTP test this
pass), test data cleanup, unrelated tables unchanged, Package A
constraints intact — PASS for the scripted items.

## Real bugs found via this testing (see Implementation doc for full detail)

1. `FOR UPDATE` + `MAX()` invalid SQL in the snapshot service (Postgres
   `0A000`) — found on the first real snapshot-creation HTTP call, fixed.
2. Unhandled promise rejection in `requireJourneyOwnership` crashed the
   entire Node server process — found when a rate-limited response left
   a downstream call with `journeyId: undefined`; fixed with try/catch +
   upfront UUID validation, and defensively applied to the other 3
   async middleware functions.
3. `audit_logs.action_category` CHECK constraint rejected the invented
   `'management_sync'` category — found via server log inspection after
   the audit-count assertion failed silently; fixed to use the real
   `'VENUE'` category.
4. Raw Postgres error codes leaking into API error responses — found
   while debugging bug #1; fixed to sanitize to `internal_error`.

## Regression suites (see `public/proof/smokecraft-management-sync-package-b/regression-results.txt` for full output)

| Suite | Result |
|---|---|
| Package B suite (final run) | 26/26 passed |
| Package A suite (re-run against the same DB) | 16/16 passed |
| `npm run build` | PASS |
| `verify-smokecraft-ticket-tapper-focused-integration.mjs` | 8/8 passed |
| `verify-smokecraft-full-approved-image-reconciliation.mjs` | 33/33 passed |
| `verify-crafthub-approved-image.mjs` | 22/22 passed |
| `verify-smokecraft-start-journey-crafthub-mvp2.mjs` | 18/18 passed |
| `verify-smokecraft-authoritative-sequence.mjs` | 20/20 passed |
| `verify-all-smokecraft-assets.mjs` | 62/62 passed |

Zero new frontend regressions — confirms Package B is genuinely
backend-only.

## Cleanup

Test database `crafthub_pkg_b_test` dropped; the real Express server
process and both Vite preview servers were stopped; the local PostgreSQL
16 cluster was stopped; `dist/` and temp log files removed.

## Addendum — proof gaps closed (Package C)

The two disclosed limitations above (cross-user/cross-venue denial
verified only structurally, and no forced-rollback test) are now closed
with real, live evidence: `verify-smokecraft-management-sync-package-b-proof-gaps.mjs`,
16/16 passed, using real seeded venues/users/memberships and real HTTP
requests against a running server. See
`SMOKECRAFT_MANAGEMENT_SYNC_PACKAGE_C_TEST_REPORT.md` Phase 2 for full
detail. This document's original findings are preserved unchanged above.
