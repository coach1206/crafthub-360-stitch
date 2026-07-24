# 08 — Regression Matrix

| Suite | Result | Notes |
|---|---|---|
| `verify-smokecraft-canonical-runtime.mjs` (new) | 19/19 | Manifest integrity, completion-service correctness, data-selector separation, renderer markers/refusal behavior |
| `verify-smokecraft-zero-legacy-runtime.mjs` (new) | 9/9 | Dead-code re-confirmation, no duplicate routes, real (not string-match-only) "Personal Dashboard" defect check, single AI Summary wiring |
| `verify-smokecraft-clean-start-entry-flow.mjs` | 54/55 (1 blocked) | Unaffected |
| `verify-smokecraft-entry-prerequisite-guard.mjs` | 43/43 | Unaffected |
| `verify-smokecraft-27-session-sequence.mjs` | 39/39 | Unaffected |
| `verify-smokecraft-tactile-haptic-interactions.mjs` | 71/71 | Unaffected |
| `verify-smokecraft-approved-entry-visuals.mjs` | 24/24 | Unaffected |
| `verify-smokecraft-canonical-journey-authority.mjs` | 25/25 | Unaffected |
| `verify-golden-box-packaging-studio.mjs` | 70/74 | Same stale-commit-only failures documented since earlier passes; unaffected |
| `verify-passport-security-unified-identity.mjs` | 59/59 | Unaffected |
| `npm run build` | pass | |

All established suites remain at or above their documented baselines. No existing test was weakened.
