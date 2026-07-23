# 06 — Regression Matrix

| Suite | Result | Notes |
|---|---|---|
| Clean Start / Entry Flow (dedicated) | 54/55 pass, 0 fail, 1 blocked | live-only cross-learner check, correctly blocked, not fabricated |
| Phase 9 Full Journey | 36/39 | 3 stale-commit-only |
| Phase 9A Packaging Studio Journey Amendment | 51/54 | 3 stale-commit-only |
| Golden Box Packaging Studio | 71/74 | 3 stale-commit-only |
| Passport Security Unified Identity | 59/59 | |
| Production build | pass | `npm run build` |
| Production startup / health check | pass | |

## Live end-to-end browser verification (local preview server, not production)

An ad-hoc Playwright script reproduced the exact reported scenario — a guest with real prior selections (`profile.firstName: 'Greg'`, `selectedCraft: 'Romeo y Julieta 1875'`, `selectedMentor: 'carlos-mendoza'`, journey-level `selectedCigar`/`mentor` objects) and no current-journey progress — then clicked `START SMOKECRAFT JOURNEY` on the (local) Resume page. Result: all fields correctly reset to blank/null, a new `activeJourneyId` was minted, the browser navigated to `/smokecraft/welcome`, and the resulting page body contained none of "Greg", "Romeo y Julieta", or "Carlos Mendoza". This is local/preview-server evidence only — not a substitute for live production verification, which remains blocked (see `07-ROLLBACK-PLAN.md` and the Phase 10 Live Deployment Verification chain).
