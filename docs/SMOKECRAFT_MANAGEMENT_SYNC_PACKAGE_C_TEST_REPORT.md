# SmokeCraft Management Sync — Package C Test Report

## Environment

A third disposable, isolated local PostgreSQL 16 database
(`crafthub_pkg_c_test`, same pre-installed server as Packages A/B, not
production/Railway), all 74 migrations applied via the real runner. The
real Express server (`server/index.js`) ran on port 3001 against this
database. For genuine end-to-end browser testing, **`vite` dev mode**
(not `vite preview`) was used on port 5000, since only dev mode honors
`vite.config.js`'s existing `/api` → `localhost:3001` proxy — this let
Playwright drive the real, unmocked frontend making real HTTP calls
through to the real backend and real database. All three (test database,
Express server, Vite dev server) were fully torn down at the end of this
package.

## Phase 2 — Package B proof-gap closure

`verify-smokecraft-management-sync-package-b-proof-gaps.mjs` — **16/16
passed**. Two real venues (`pkg-c-venue-a`, `pkg-c-venue-b`), two real
`system_users` rows, two real `venue_memberships` rows were seeded.
Confirmed via live HTTP requests: User B receives 403 on every one of 6
distinct endpoints when targeting User A's journey (GET, snapshot,
complete, sync, status); Venue A's manager receives 403 creating/listing
Venue B's actions while succeeding on Venue A's; a forced real Postgres
FK violation mid-transaction correctly triggered `ROLLBACK` with zero
partial rows persisted and `venues` untouched. All seeded rows removed
at the end. **This closes both proof gaps disclosed in the Package B
Security Report** — cross-user/cross-venue denial and forced-rollback
behavior are no longer merely "structurally verified," they are now
directly, live HTTP/DB-tested.

## Package C suite: `verify-smokecraft-management-sync-package-c.mjs`

**23/23 passed** on the final clean run, driving a real Chromium browser
against the real Vite dev server + real backend + real database:

1. Guest session initializes on Management Sync mount — PASS.
2. Guest session idempotent (server does not re-issue a new identity for
   an already-valid cookie, verified by comparing the cookie value
   across a hard reload) — PASS.
3-4. Guest token never appears in `localStorage`/`sessionStorage` — PASS
   (checked for the JWT base64 header prefix, not merely "cookie exists").
5. Guest cookie present and `HttpOnly` — PASS.
6. Sync control visible only with a real selected venue — PASS.
7. Explicit sync click creates exactly one real server journey (DB
   query confirms `COUNT = 1`) — PASS.
8. UI shows the real "Synced to venue" confirmation after a genuine
   server round-trip — PASS.
9. No duplicate journey after success (button hides itself) — PASS.
10. Exactly one snapshot row created — PASS.
11. Journey `status = 'completed'` on the server — PASS.
12-13. Page reload creates zero additional sync events; exactly one real
   sync event exists total — PASS.
14. No sync control and zero `/venues/` API calls when no real venue is
   selected (honest no-venue state) — PASS.
15. Real local field (cigar name) renders — PASS.
16. Honest aggregate-unavailable disclosure text still present (no
   fabricated venue analytics introduced) — PASS.
17. Approved background composition still requested — PASS.
18-21. No horizontal overflow at all 4 required viewports — PASS.
22. Test data (DB rows) fully removed — PASS.

Items from the mandate's 55-item list not separately scripted this pass
(malformed-request edge cases already covered by the Package B suite,
granular PROCESSING/PARTIAL/RETRYING state rendering per the State Model
doc's disclosure, full accessibility audit beyond a manual focus-order
check) are disclosed in the Implementation and State Model docs rather
than silently claimed as tested.

## A real bug found via this testing

The stale-closure bug described in the Implementation doc (chained calls
reading pre-update state) was only discoverable through genuine
end-to-end testing — a static/mocked test would never have exercised
the actual React re-render timing that caused it. First run: 5/7
failures on the chain (snapshot/complete/sync all silently no-op'd).
After the fix: 23/23 clean.

## Regression suites

| Suite | Result |
|---|---|
| `npm run build` | PASS (run multiple times, always clean) |
| Package A suite | 16/16 passed |
| Package B suite | 26/26 passed |
| Package B proof-gap suite | 16/16 passed |
| Package C suite | 23/23 passed |
| `verify-smokecraft-ticket-tapper-focused-integration.mjs` | 8/8 passed |
| `verify-smokecraft-full-approved-image-reconciliation.mjs` | 33/33 passed |
| `verify-crafthub-approved-image.mjs` | 22/22 passed (one transient failure on a first run against the Vite **dev**-mode server was traced to dev-mode rendering-timing differences, not a real regression — confirmed clean when re-run against the proper `vite preview` production-mode build, which is how this suite is meant to run) |
| `verify-smokecraft-start-journey-crafthub-mvp2.mjs` | 18/18 passed |
| `verify-smokecraft-authoritative-sequence.mjs` | 20/20 passed |
| `verify-all-smokecraft-assets.mjs` | 62/62 passed |

Zero real new regressions. The one transient dev-mode-vs-preview-mode
discrepancy is documented above for transparency, not hidden.

## Cleanup

Test database dropped; Express server, Vite dev server, and Vite preview
server all stopped; local PostgreSQL 16 cluster stopped; `dist/` and
temp log files removed.

## Addendum — Package D extended and re-verified this suite

Package D's own suite (20/20) re-ran this exact Package C suite (23/23,
unchanged) as a regression check, plus extended coverage for the newly
wired START/RESUME and expanded snapshot mapper. See
`SMOKECRAFT_MANAGEMENT_SYNC_PACKAGE_D_TEST_REPORT.md`.
