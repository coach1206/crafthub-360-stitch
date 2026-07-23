# 06 — Regression Matrix

Stale starting-commit assertions (each suite's own hardcoded commit hash from
its own original pass) are separated from functional results per the
mandate's own instruction. None of the "stale commit" items below are
functional regressions.

| Suite | Result | Notes |
|---|---|---|
| Phase Architecture Reconciliation (dedicated) | 42/42 | New suite, this pass |
| Phase 9A Packaging Studio Journey Amendment | 54/54 | |
| Golden Box Packaging Studio | 71/74 | 3 stale-commit-only |
| Phase 9 Full Journey | 36/39 | 3 stale-commit-only |
| Phase 8 Golden Box Production | 56/59 | 3 stale-commit-only |
| Golden Box 7A | 33/33 | |
| Phase 7 Golden Box Visual | 32/35 | 3 stale-commit-only |
| Phase 6 Shared Gamification | 46/49 | 3 stale-commit-only |
| Passport Security Unified Identity | 59/59 | |
| Blend Fault | 61/61 | |
| Challenge Hub | 58/58 | |
| Collections | 34/34 | |
| Skill Tree | 32/32 | |
| Filler Arrangement | 17/17 | |
| Journey State | 7/7 | |
| Package 5 — Closure | 30/30 | |
| Package 5 — Leaf/Construction | 23/27 | pre-existing flake, see below |
| Package 5 — Responsive | 11/12 | pre-existing flake, see below |
| Gamification Screens | 24/24 | |
| Venue Management Command Hub | 33/33 | |
| Full route smoke test | 97/98 | 1 unrelated pre-existing resource-404 console noise on `/smokecraft` |
| Production build | pass | `npm run build` completed, 36.34s |
| Production startup | pass | server + preview (5050) confirmed live throughout this pass |
| Health check | pass | `{"success":true,"status":"ok",...}` |

## Disclosed pre-existing flakiness (not caused by this pass)

**Package 5 Leaf/Construction and Package 5 Responsive** intermittently fail
a subset of their Playwright UI-interaction checks (element-wait timeouts
against `wrapper-strength`/`seed-soil` pages at `localhost:5000`). This pass
made **zero changes** to any file these suites exercise
(`src/pages/smokecraft/WrapperStrength.jsx`, `SeedSoil.jsx`, or their
routes/services) — confirmed by `git diff` scope. Repeated runs show the
underlying functionality works (DB seeding, catalog counts, and most UI
interactions consistently pass); the failures are timing-sensitive waits on
a specific button/dialog appearing, consistent with the pre-existing,
previously-documented Vite dev-server (port 5000) instability under rapid
sequential Playwright navigation (first noted in the Phase 9 pass). Best
observed results: Leaf/Construction 23/27 (worst run) up to 8/9 (partial,
before a dev-server drop); Responsive 11/12. This is disclosed here rather
than silently omitted or falsely reported as fully green.
