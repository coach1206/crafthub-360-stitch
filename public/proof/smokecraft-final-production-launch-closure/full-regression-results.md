# Full Regression Results — Production Package 7

All suites below were re-run in this pass against a freshly started
API server (`node server/index.js`), a freshly rebuilt production
bundle (`npm run build`), and fresh `vite preview --port 5050
--strictPort` / `vite --port 5000` instances — matching the established
Package 4/5/6 convention for avoiding stale-process false failures.

| Suite | Result |
|---|---|
| E.A.T. route smoke (`verifyPhaseF7EATSmokeCraftLiveSync.js`) | **130/130 PASS** (was 111/130 before this package's fix) |
| Prebuild validator chain (19 chained validators incl. compliance readiness) | **PASS, 0 failures** |
| `npm run build` (production bundle) | **PASS** — built in ~24s |
| Fresh-player closure (`verify-smokecraft-full-game-fresh-player.mjs`) | **62/62 PASS** |
| Final gameplay acceptance (`verify-smokecraft-final-gameplay-acceptance.mjs`, fresh preview build) | **82/82 PASS** |
| Required-interaction manifest (`validateSmokecraftRequiredInteractionManifest.mjs`) | **21/21 COMPLETE_AND_VERIFIED** |
| POS360 production readiness (`verifyPos360ProductionReadiness.js`) | **339/339 PASS** |
| POS360 platform layer (`verifyPos360PlatformLayer.js`) | 121/121 PASS (separate, narrower suite) |
| Backup/restore (`verify-smokecraft-backup-restore.mjs --fresh`) | **20/20 PASS**, "RESTORE VERIFIED" |
| Infrastructure deployment smoke (`verify-smokecraft-production-deployment.mjs`) | **14/14 PASS** |
| Payment API (`verify-smokecraft-real-payment-gateway-api.mjs`) | **40/40 PASS** |
| Payment browser (`verify-smokecraft-real-payment-gateway-browser.mjs`) | **19/19 PASS** (one transient Playwright click-stability flake on first run, reproduced clean on immediate re-run — not a functional regression, no code touches this path) |
| Media API (`verify-smokecraft-venue-humidor-media-1-api.mjs`) | **30/30 PASS** |
| Media browser (`verify-smokecraft-venue-humidor-media-1-browser.mjs`) | **15/15 PASS** |

## Not re-run this pass (carried forward, unmodified by this package)
The very large number of additional domain validators in `package.json`
(`verify:pos360-*`, `verify:novee-os-*`, `verify:checkout`, `verify:tax`,
etc. — 60+ scripts) were not individually re-executed in this pass.
Nothing in this package touches those subsystems' code; POS360's own
aggregate 339/339 production-readiness suite (which itself exercises
route registration, RBAC, and cross-module wiring across the POS360
surface) was re-run and passed. This is disclosed honestly as a scope
limitation, not claimed as "all validators re-run."

## Known, disclosed, non-blocking items
- Payment-browser suite showed one Playwright element-stability flake on
  its first run in this pass (immediately reproduced clean); this
  matches the flake pattern already disclosed in the Package 6
  correction docs for this same class of browser test and is not
  treated as a regression.
- The production JS bundle emits a >500kB chunk-size warning from Vite
  (code-splitting opportunity) — a build warning, not a failure, and not
  new to this pass.
