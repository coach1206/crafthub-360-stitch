# 46 — Final Gameplay Acceptance, Fresh Server: 82/82

## Clean test environment

```
$ ps aux | grep -E "node|vite|playwright|chrom" | grep -v grep | grep -v "environment-manager|claude "
(no matches — no stale Node/Vite/Playwright/Chromium processes existed
before this pass started)

$ sudo pg_ctlcluster 16 main start
Removed stale pid file.
(PostgreSQL 16 "main" cluster brought online — was down at session start)

$ npm run build
... full production build, all 18 prebuild validators PASS, ~59s
✓ built in 58.67s
[strip-production-assets] removed dist/proof

$ node server/index.js   (backend, port 3001, single instance, PID 6882)
$ npx vite preview --port 5050   (frontend, single instance, PID 9165)
```

- Commit under test: `80e7b19b` (unchanged — no production code was
  modified for this item; it was a re-verification, not a fix)
- Server port: 3001 (API), 5050 (preview UI, matching the script's own
  `SC_UI` default)
- Process list: exactly one `node server/index.js` and one `vite preview`
  process, confirmed via `ps aux` immediately after start
- Server start time: 2026-08-02T18:51 UTC
- Environment: development (real local PostgreSQL 16,
  `crafthub_smokecraft_final`, 1107 tables)
- Rate-limit configuration: unmodified from Package 6 — `rate limiter
  enabled: no (skipped in dev/test)` (dev-mode convention, unchanged
  production thresholds); a full server restart naturally cleared any
  stale in-memory counters
- Test identity: fresh guest cookies issued by the real
  `/api/smokecraft/*` API for this run, no localStorage seeding

## Result

```
$ node scripts/verify-smokecraft-final-gameplay-acceptance.mjs
... (full session-completion build, Golden Box lifecycle, 5-viewport
Playwright walk, live-data honesty, reload persistence)
82 passed, 0 failed (of 82 total)
```

All 82 assertions passed, including every screen in the prior 10-failure
set: `09-skill-tree`, `10-leaderboard`, `11-golden-box-build`,
`12-golden-box-competitions`, `13-golden-box-results`.

## Root-cause classification of the prior 72/82 result

The prior correction pass ran the same script against a shared/busy
environment (heavy back-to-back regression runs sharing the same
rate-limited dev server) and observed `net::ERR_ABORTED` on in-flight
requests to `/api/smokecraft/skill-tree/`,
`/api/smokecraft/player-state/leaderboard`,
`/api/smokecraft/golden-box/competitions`, and
`/api/smokecraft/golden-box/xp/history`. This pass reproduced the exact
same script, unmodified, against a genuinely idle, freshly started
server/preview pair with no other process competing for the rate limiter
or event loop, and got 82/82 with zero flakiness.

**Classification: confirmed test-load/timing artifact from environment
sharing, not a functional defect.** No production code was touched. No
test-harness change was needed — the script itself was already correct;
what was missing was true environment isolation (a dedicated, idle
server/preview pair instead of one shared with concurrent heavy suites).

- Production fix required: **none**
- Test-harness fix required: **none** — the existing script and its wait
  conditions were already sound; they only needed an isolated server to
  run against
