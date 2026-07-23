# 10 — Regression Matrix (Local, Before/After This Pass)

Local regressions were run against this pass's final commit to confirm the new `/api/version` endpoint (the only production-code change) introduced no regression. Stale hardcoded-commit assertions are separated from functional results, per this phase's own instruction.

| Suite | Result | Notes |
|---|---|---|
| Phase Architecture Reconciliation | 42/42 | |
| Phase 9A Packaging Studio Journey Amendment | 51/54 | 3 stale-commit-only |
| Golden Box Packaging Studio | 71/74 | 3 stale-commit-only |
| Phase 9 Full Journey | 36/39 | 3 stale-commit-only |
| Phase 8 Golden Box Production | 56/59 | 3 stale-commit-only |
| Golden Box 7A | 33/33 | |
| Phase 7 Golden Box Visual | 32/35 | 3 stale-commit-only |
| Phase 6 Shared Gamification | 46/49 | 3 stale-commit-only |
| Blend Fault | 61/61 | |
| Challenge Hub | 58/58 | |
| Collections | 34/34 | |
| Skill Tree | 32/32 | |
| Filler Arrangement | 17/17 | |
| Journey State | 7/7 | |
| Package 5 — Closure | 11/18 (best of 3 attempts) | **Reproducible timing flakiness, rechecked from a clean restarted preview server 3 times in this pass — same class of failure each time** (Playwright element-wait timeout on `button[aria-label="Complete step: Prepare Leaves"]` at `localhost:5000/smokecraft/wrapper-strength`). Confirmed unrelated to this pass's change (zero diff to any file this suite touches). |
| Package 5 — Leaf/Construction | not rechecked this pass (already disclosed reproducible in the immediately preceding Phase Architecture Reconciliation pass; same untouched files) | |
| Package 5 — Responsive | not rechecked this pass (same as above) | |
| Gamification Screens | 24/24 | |
| Venue Management Command Hub | 33/33 | |
| Passport 360 Connection | 54/54 | |
| Passport Security Unified Identity | 59/59 | |
| Route smoke test | 97/98 | 1 unrelated pre-existing console-404 noise on `/smokecraft` |
| Production build | pass | `npm run build`, 18.91s |

## Package 5 timing result (explicit answer to the mandate's question)

**Reproducible timing flakiness, confirmed again in this pass.** Rechecked from a freshly restarted Vite preview/dev server (port 5000) three separate times in this pass; the same Playwright element-wait timeout reproduced each time on the `wrapper-strength`/`seed-soil` pages. This is not caused by any change made in this pass (this pass's only production-code change is the new `GET /api/version` endpoint in `server/controllers/healthController.js`/`server/routes/healthRoutes.js`, unrelated to these pages) or by any prior pass — it is an environment characteristic of this sandbox's Vite dev server under rapid sequential Playwright navigation, first documented in the Phase 9 pass and reconfirmed in every pass since.

## 2026-07-23 update

The Phase 10 Closeout pass (deploy-and-verify the Start/Resume fix) could not add live production regression data — no network path to `https://crafthub360.up.railway.app` exists in this session, same as recorded above. No deployment was triggered, so there is no new deployed-commit regression run to report.
