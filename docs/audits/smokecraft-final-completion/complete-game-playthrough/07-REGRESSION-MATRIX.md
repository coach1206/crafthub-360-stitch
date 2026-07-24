# 07 — Regression Matrix

| Suite | Result | Notes |
|---|---|---|
| `verify-smokecraft-complete-game-playthrough.mjs` (new) | 34/34 | Entry flow, all 27 sessions, phase transitions, Session 5 branch, merged sessions, supporting screens, 100% completion, Results, Awards, Resume, Start New CTA, console/network health, build/startup/health |
| `verify-smokecraft-viewport-matrix.mjs` (new) | 1/1 (85/85 combinations) | 5 viewports × 17 required screens, zero horizontal overflow |
| `verify-smokecraft-canonical-runtime.mjs` | 19/19 | Unaffected |
| `verify-smokecraft-zero-legacy-runtime.mjs` | 9/9 | Unaffected |
| `verify-smokecraft-zero-old-visuals.mjs` | 20/20 | Unaffected |
| `verify-smokecraft-clean-start-entry-flow.mjs` | 54/55 (1 live-only blocked) | Same documented, unchanged live-deployment blocker as every prior pass |
| `verify-smokecraft-entry-prerequisite-guard.mjs` | 43/43 | Unaffected |
| `verify-smokecraft-tactile-haptic-interactions.mjs` | 71/71 | Unaffected |
| `verify-smokecraft-approved-entry-visuals.mjs` | 24/24 | Unaffected |
| `verify-smokecraft-27-session-sequence.mjs` | 39/39 | Unaffected |
| `verify-smokecraft-canonical-journey-authority.mjs` | 25/25 | Unaffected |
| `verify-golden-box-packaging-studio.mjs` | 70/74 | Same long-documented stale-commit-only baseline, unaffected |
| `verify-passport-security-unified-identity.mjs` | 59/59 | Unaffected |
| `npm run build` | pass | |
| Production startup (`vite preview` :5050) | pass | 200 |
| Health check (`/api/health`) | pass | `{"status":"ok","db":"postgres"}` |

All suites at or above every previously documented baseline. No test was weakened to force a pass.
