# 28 — Production Package 5 Validation Correction — Scope & Method

## Why this pass exists

Package 5 (Monitoring, Backups, Recovery, Support) honestly disclosed two
soft results rather than hiding them:

- **Final Gameplay Acceptance: 77/82** — attributed to 429 rate-limit
  console errors caused by "this session's own back-to-back heavy
  regression runs."
- **E.A.T. route smoke: 112/149 PASS, 37 FAIL** — attributed to
  byte-identical pre-existing failures, confirmed (per that pass) via a
  `git stash` comparison against commit `71c3ccc8`.

This pass's job was to **prove those attributions**, not just re-assert
them, by re-running both suites against a genuinely fresh, idle server
with clean rate-limit state. The mandate was explicit: "actually
investigate, don't assume the prior pass's explanation was fully correct
without re-verifying it yourself."

## Baseline confirmation

```
$ git status
On branch recovery/smokecraft-codex-final
nothing to commit, working tree clean
$ git rev-parse HEAD
143d8b546246bddc5ec69668d3ffbe92c6159069
$ git rev-parse origin/recovery/smokecraft-codex-final
143d8b546246bddc5ec69668d3ffbe92c6159069
```

Both equal, tree clean — proceeded per mandate.

## Fresh test environment

- Confirmed no stale node/vite/playwright/chromium processes (`ps aux`)
  before starting anything.
- Started PostgreSQL 16 (`crafthub_smokecraft_final`, was down at session
  start — a completely cold service start, not a warm reused connection
  pool).
- Started **one** fresh `node server/index.js` (backend, port 3001) —
  no code changes to production behavior at this point, pure baseline
  measurement first.
- Started **one** fresh Vite process to serve the UI.
- No localStorage seeding, no RBAC/auth/completion-gate bypass — the
  acceptance script's own real-API player-state construction and the
  app's own sanctioned "Enter Demo Experience" investor control (already
  audited/disclosed in the script itself) were the only mechanisms used,
  exactly as in every prior pass.
- Rate-limit state: in-memory, per-process — a fresh process start is a
  legitimate, complete reset. No production rate-limit threshold values
  were touched to make this happen.

## What was actually found (see docs 29–32 for full detail)

1. **Final Gameplay Acceptance's own restated cause (429/rate-limiting)
   turned out to be real, but mis-scoped.** The dev/test environment's
   general `express-rate-limit` middleware in `server/index.js` is
   correctly gated `skip: () => !IS_PROD`, so it cannot ever produce a
   429 outside `NODE_ENV=production`. But **10 route files**
   (`managementSyncRoutes.js`, `passport360SyncRoutes.js`,
   `packagingStudioRoutes.js`, `blendFaultRoutes.js`,
   `fillerArrangementRoutes.js`, `venueManagementRoutes.js`,
   `seedSoilRoutes.js`, `flavorPairingRoutes.js`,
   `leafConstructionRoutes.js`, `challengeHubRoutes.js`) had their own,
   separate `rateLimit(...)` instances **with no `IS_PROD` gate at all**
   — a narrow, real, pre-existing inconsistency versus the majority
   pattern already established elsewhere (e.g. `goldenBoxRoutes.js`,
   `smokecraftPlayerStateRoutes.js`). These fired for real, in dev, and
   accumulate across repeated runs in the same server process (they don't
   reset without a full restart) — this is what actually produced 429s,
   not "this session's heavy runs" as a vague hand-wave, but a specific,
   fixable, narrow gap. See doc 29.
2. **A second, independent cause was hiding underneath the 429s**:
   `net::ERR_ABORTED` browser-side aborts on 4–5 screens, caused by React
   `StrictMode`'s dev-only double-effect-invocation interacting with the
   test's context-teardown timing — **not present in a production
   build** (StrictMode never double-invokes effects outside
   development). Confirmed empirically: running the identical suite
   against `vite preview` (the app's own documented production-topology
   test mode) with a genuinely fresh server produced **82/82, 0
   failures**, twice in a row. See doc 29.
3. **The prior pass's E.A.T. figure of "112/149 PASS, 37 FAIL" does not
   match the actual script.** `server/scripts/verifyPhaseF7EATSmokeCraftLiveSync.js`
   has always had **130** total `check()` calls (confirmed identical
   between commit `71c3ccc8` and the current `HEAD` — empty `git diff`),
   never 149. The real, current, reproducible result is **111/130 PASS,
   19 FAIL**. The git-stash-based "byte-identical" comparison method
   described in Package 5 was directionally sound (and, re-verified here,
   still true: the script and its result are unchanged since
   `71c3ccc8`) but the headline arithmetic reported (112/149) was simply
   wrong. See docs 30–31 for the full investigation and per-check
   classification of all 130 checks (task asked for "all 149" — the
   correction to 130 is itself part of this pass's deliverable, not an
   omission).

## Commands used (representative, full logs referenced in doc 29/32)

```
service postgresql start
node server/index.js                       # fresh backend, port 3001
npx vite --port 5050                       # fresh dev UI (first measurement)
node scripts/verify-smokecraft-final-gameplay-acceptance.mjs
node server/scripts/verifyPhaseF7EATSmokeCraftLiveSync.js
npm run build
npx vite preview --port 5050 --strictPort  # production-equivalent UI (final measurement)
node scripts/verify-smokecraft-final-gameplay-acceptance.mjs
node scripts/verify-smokecraft-full-game-fresh-player.mjs
node scripts/verify-smokecraft-production-deployment.mjs
node scripts/validateSmokecraftMonitoringRecoverySupport.mjs
node scripts/verify-smokecraft-backup-restore.mjs --fresh
node scripts/test-smokecraft-monitoring-recovery-support.mjs
node scripts/test-smokecraft-support-admin-rbac.mjs
node server/scripts/verifyPos360ProductionReadiness.js
node scripts/validateSmokecraftReactRouterMigration.mjs
```

See `29-final-gameplay-fresh-server-results.md`,
`30-eat-route-smoke-investigation.md`,
`31-eat-route-classification.md`, and
`32-package-5-final-closure.md` for full results and reasoning.
