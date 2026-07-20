# Production Readiness — Test Evidence

## Route crawler (`scripts/verify-production-visual-sequence.mjs`)

Run 1 (before fix): 28/28 routes reachable, 0 overflow, 0 blank pages, but **every single route**
(28/28) logged the same real React warning — `Cannot update a component (BrowserRouter) while
rendering a different component (SmokeCraftSessionGuard)` — traced to `navigate()` being called
directly inside a render branch in `SmokeCraftSessionGuard.jsx`.

**Fix applied**: moved the redirect into a `useEffect`, called unconditionally per the Rules of Hooks,
gated internally by the same unlock condition. Same redirect behavior, no render-phase side effect.

Run 2 (after fix): 28/28 reachable, 0 overflow, 0 blank pages, **0 routes with the setState-in-render
warning**. Remaining console entries: `/smokecraft/welcome` had 2 `404` resource loads on the first
run only, not reproduced on a targeted retry (not treated as a confirmed deterministic bug — flagged as
unreproduced, not fixed blind); `/smokecraft/session-complete` had 2 benign
`navigator.vibrate blocked (no user gesture yet)` warnings, an expected headless-browser artifact of
haptics firing without a prior real tap — not a production issue (real users always interact first).

Full machine-readable results: `04-ROUTE-CRAWLER-RESULTS.json`.

## Build

`npm run build` — PASS, both before and after the `SmokeCraftSessionGuard.jsx` fix.

## Regression suites (re-run against `crafthub_pkg7a_probe`, migrations through 084)

| Suite | Result |
|---|---|
| verify-golden-box-package-7a.mjs | 33/33 |
| verify-golden-box-package-4-seed-soil.mjs | 17/17 |
| verify-golden-box-game-engine-flavor-memory.mjs | 4/4 |
| verify-venue-management-command-hub-package-6b.mjs | 33/33 |

All clean after the `SmokeCraftSessionGuard.jsx` fix — confirms the render-phase-navigate fix did not
change unlock/redirect behavior for any tested flow (session-lock gating, entry-layer `requires` gating,
Golden Box entry flow, all still pass their real assertions).

## Asset-path scan (Phase 1/6 deterministic check)

103 referenced `/assets/smokecraft/...` paths cross-checked against disk; 35 not found, all traced to
dead code or `onError`-guarded fallback paths (not rendered broken) — see `00-BASELINE.md`. No fix
needed; none applied.

## Scope not executed this pass

Full per-screen POS360/E.A.T. 360 visual audits, a full 390×844/360×800/tablet-3-size/desktop matrix for
every one of 246 routes, and full accessibility audits beyond what the route crawler and prior packages'
own suites already assert — disclosed in `07-PRODUCTION-GATE.md`.
