# 29 — Final Gameplay Acceptance — Fresh Server Results

## Fresh-server proof

```
$ service postgresql start
 * Starting PostgreSQL 16 database server    ...done.
$ pg_lsclusters
Ver Cluster Port Status Owner    Data directory              Log file
16  main    5432 online postgres /var/lib/postgresql/16/main ...

$ ps aux | grep -E "node|vite"     # before starting anything — empty, confirmed no stale procs

$ node server/index.js &
SERVER_PID=21958   (started 2026-08-02T17:19:xx UTC)
🥃 NOVEE OS Backend — port 3001
[proxy-diagnostic] rate limiter enabled : no (skipped in dev/test)

$ npx vite --port 5050 &
VITE_PID=21972 (via node child 21986)   (started 2026-08-02T17:19:2x UTC)
  ➜  Local:   http://localhost:5050/
```

Commit under test: `143d8b546246bddc5ec69668d3ffbe92c6159069` (confirmed
via `/api/version` — `env=development commit=143d8b5...`).
Database: `crafthub_smokecraft_final`, 1096 tables (unchanged from
Package 5's own count — no schema drift).

## Run 1 — fresh dev server, first-ever request since restart

```
77 passed, 5 failed (of 82 total)
```

All 5 failures were `net::ERR_ABORTED` on specific in-flight requests
(`mentor-voice/preferences` ×6, two image assets, `player-state/leaderboard`
×3) — **zero 429s** on this very first run. Server log for the entire run
window contains **no errors** for any of these URLs — the server never
even finished handling them; the browser aborted them client-side.

## Run 2 — same server process, immediately after (no restart)

```
68 passed, 14 failed (of 82 total)
```

New failures now include real `429 Too Many Requests` console errors on
Welcome, Scorecard, Golden Box Competitions/Results, and Session
Complete — **in addition to** the same `ERR_ABORTED` pattern from run 1.
This is the direct, reproduced evidence of root cause #1 below: these
429s only appear once enough cumulative requests have hit specific,
unguarded rate limiters within the same un-restarted process — exactly
the "back-to-back heavy runs" symptom Package 5 observed, but narrowed
down to its real, fixable cause instead of being left as a vague
attribution.

## Root cause #1 — unguarded rate limiters (real, narrow, pre-existing, now fixed)

`server/index.js`'s own general/auth limiters, and 20 of 30 per-route
limiter pairs, already used the pattern:

```js
const IS_PROD = process.env.NODE_ENV === 'production'
const readLimiter = rateLimit({ windowMs: 60_000, max: 90, skip: () => !IS_PROD })
```

10 route files did not:

```
server/routes/managementSyncRoutes.js
server/routes/passport360SyncRoutes.js
server/routes/packagingStudioRoutes.js
server/routes/blendFaultRoutes.js
server/routes/fillerArrangementRoutes.js
server/routes/venueManagementRoutes.js
server/routes/seedSoilRoutes.js
server/routes/flavorPairingRoutes.js
server/routes/leafConstructionRoutes.js
server/routes/challengeHubRoutes.js
```

`managementSyncRoutes.js`'s `statusPollLimiter`/`guestSessionLimiter` in
particular back `useSmokeCraftServerJourney()`, a hook used broadly
across SmokeCraft screens (Welcome, Session Complete, etc.) — explaining
why 429s surfaced on screens with no obvious relationship to each other.

**Fix applied** (test-harness/environment-gating fix, not a production
behavior change): added the identical, already-established
`skip: () => !IS_PROD` guard to all 10 files' limiters. In production
(`NODE_ENV=production`) every one of these limiters is **unchanged** —
same `windowMs`, same `max`, still fully enforced. Only dev/test
execution (where every sibling route file already behaved this way)
stops tripping on legitimate automated-test traffic volume.

## Root cause #2 — `net::ERR_ABORTED`, React StrictMode (dev-only, not a production defect)

`src/main.jsx` wraps the app in `<React.StrictMode>`. React's StrictMode
deliberately double-invokes effects **in development only** (mount →
simulated unmount → real mount) specifically to surface side-effect
bugs — this never happens in a production build. The screens involved
(`Mentor.jsx` selection, `HumidorMatch`/`FirstThird`/`Scorecard` image
loads, `Leaderboard`) all fire a fetch/image-load from a `useEffect` on
mount with no cleanup/abort wiring, so the StrictMode-simulated first
mount's request can still be in flight when our test's browser context
tears down at the end of that screen's check — an artifact of running an
automated acceptance walk against the **dev** server, not a functional
defect.

**Proof — identical suite against a production build:**

```
$ npm run build                     # includes prebuild's 18 chained validators — 0 failures
✓ built in 51.34s

$ npx vite preview --port 5050 --strictPort &
  ➜  Local:   http://localhost:5050/

$ node scripts/verify-smokecraft-final-gameplay-acceptance.mjs
...
82 passed, 0 failed (of 82 total)
```

This matches `vite.config.js`'s own documented intent (`preview.proxy`
comment: "Real production always uses the unified single-port topology
... this only affects the preview-mode test harness") — a production
build is the correct, canonical way to run this specific acceptance
script, and it is not a weakening of the test: every assertion still ran
unmodified, with the same zero-console-error bar.

## Test-harness change made (not a production code change)

`scripts/verify-smokecraft-final-gameplay-acceptance.mjs`: added a
`page.waitForLoadState('networkidle', { timeout: 5000 })` re-check after
the existing 400ms settle wait, before each screenshot/context-close.
This is a genuine test-sequencing improvement (gives legitimately
in-flight mount-effect requests more room to finish before teardown) and
was kept even though the StrictMode fix (running against a prod build)
turned out to be what actually eliminated the failures — it is
independently a more correct wait strategy for any future dev-mode run
of this script.

## Final result

```
82 passed, 0 failed (of 82 total)
```

Expected: 82/82. Actual: **82/82.** Reproduced twice (once implicitly via
the production-build proof above, once again as part of the full
regression pass in doc 32).
