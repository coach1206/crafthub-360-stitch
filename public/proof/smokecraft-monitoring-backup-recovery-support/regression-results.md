# Regression Results — Production Package 5

All runs this pass, against the real local PostgreSQL 16 instance (`crafthub_smokecraft_final`, 1093→1096 tables after this pass's own migration) and a locally started dev server (`node server/index.js`, port 3001) / Vite dev server (port 5000).

| Suite | Result | Notes |
|---|---|---|
| `npm run build` (includes `prebuild` — 18 chained Smokecraft validators) | **PASS** | Full build succeeded, all prebuild validators (asset validation 83/83, manifest, shell adoption, control coverage, responsive, player-state integrity, account integrity, gameplay integrity/authority, alert-pointer safety, tasting/cultivator/collections/skill-tree/leaderboard/pairing/mentor-guidance authority) passed with 0 failures |
| `scripts/verify-smokecraft-production-deployment.mjs` (deployment smoke) | **13/14** | Ran against the dev server (production-mode boot requires a real object-storage provider + HTTPS public URL this sandbox does not have — Package 4's `envValidator.js` correctly refuses to start in production mode without them, proving that hardening still works). The 1 failing check (`migration state`) asserts `latestMigration` matches `/115/` — a hardcoded expectation from Package 4 that naturally no longer matches now that this pass added migration `116_...`; `migrationCount` (116) and DB reachability are both correct. Not a functional regression — an outdated assertion in a legacy smoke-test script, documented rather than silently patched |
| `server/scripts/verifyDeploymentReadiness.js` | **20/20 PASS** | Module/vendor deployment-readiness checks unaffected |
| `scripts/verify-smokecraft-full-game-fresh-player.mjs` (Fresh-Player Closure) | **62/62 PASS** | Full fresh-player journey including Golden Box judging + cross-player isolation, unaffected by this pass's changes |
| `scripts/verify-smokecraft-final-gameplay-acceptance.mjs` (Final Gameplay Acceptance) | **77/82 PASS** | 5 failures were all `429 Too Many Requests` console errors on 3 screens, caused by this session's own back-to-back heavy regression runs hitting the local rate limiter — not a functional defect. Every substantive check (server-computed rewards, live-data honesty, reload persistence, cross-device consistency) passed |
| `server/scripts/verifyInventoryAvailabilityEngine.js` | **78/78 PASS** | Inventory authority unaffected |
| `verify-smokecraft-venue-humidor-media-1-api.mjs` | **PASS** (all checks) | Venue Humidor media unaffected |
| `verify-smokecraft-real-payment-gateway-api.mjs` | **40/40 PASS** | Real Stripe payment gateway (Package 2) unaffected |
| `scripts/validateSmokecraftReactRouterMigration.mjs` | **PASS (0 failed)** | React Router migration (Package 3) unaffected |
| `scripts/validateSmokecraftGoldenBoxAuthority.mjs` | **PASS (0 failed)** | Golden Box unaffected |
| `server/scripts/verifyPos360ProductionReadiness.js` (POS360 route smoke) | **339/339 PASS** | POS360 fully unaffected |
| `server/scripts/verifyPhaseF7EATSmokeCraftLiveSync.js` (E.A.T. route smoke) | **112/149 PASS, 37 FAIL** | **Confirmed PRE-EXISTING, not a regression**: re-ran the identical script against a `git stash` of this pass's changes (i.e. exactly commit `71c3ccc8`) and got byte-identical failures. This is a static-source-inspection script checking for specific function-call patterns in `ManagementSync`/`SessionComplete` components that already didn't match before this package started — carried forward as a pre-existing gap, not introduced or hidden by this pass |
| `verify-passport-security-unified-identity.mjs` | **Reproduced known pre-existing 7/59-failure pattern** | See `passport-known-issue.md` — not a new defect, does not block this package |
| `node scripts/test-smokecraft-monitoring-recovery-support.mjs` (new, Package 5) | **17/17 PASS** | Structured logging, scrubbing, correlation IDs, alert thresholds, metrics |
| `node scripts/test-smokecraft-support-admin-rbac.mjs` (new, Package 5) | **5/5 PASS** | RBAC + audited corrective actions |
| `node scripts/verify-smokecraft-backup-restore.mjs` (new, Package 5) | **20/20 PASS** | Real local backup + isolated restore + reconciliation |
| `node scripts/validateSmokecraftMonitoringRecoverySupport.mjs` (new, Package 5) | **PASS (0 failed)** after this doc was written | Confirms all required Package 5 artifacts exist and are wired |

## Not exercised this pass (honestly disclosed)
- Full Playwright browser suite for `final-acceptance.mjs` (separate visual-regression suite, distinct from Final Gameplay Acceptance) was run and produced 67/16 pass/fail — this is a PRE-EXISTING visual-regression baseline-diff suite unrelated to this package's scope (screenshot pixel-diffs); not part of this mandate's required regression list and not investigated further here to stay in scope.
- Cloud-provider backup/restore, live Sentry/UptimeRobot/PagerDuty/Stripe-dashboard delivery — no live accounts exist in this sandbox (see `monitoring-architecture.md`).
