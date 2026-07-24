# 06 — Regression Matrix

| Suite | Result | Notes |
|---|---|---|
| `verify-smokecraft-canonical-journey-authority.mjs` (new, this pass) | 25/25 | Root-cause fix (identity reset), Resume redirect, live root-cause scenario reproduction and fix confirmation |
| `verify-smokecraft-clean-start-entry-flow.mjs` | 54/55 (1 blocked) | Unaffected; blocked check requires live production backend |
| `verify-smokecraft-entry-prerequisite-guard.mjs` | 43/43 | Unaffected |
| `verify-smokecraft-27-session-sequence.mjs` | 39/39 | Unaffected |
| `verify-smokecraft-tactile-haptic-interactions.mjs` | 71/71 | Unaffected |
| `verify-smokecraft-approved-entry-visuals.mjs` | 24/24 | Unaffected |
| `verify-golden-box-packaging-studio.mjs` | 70/74 | Same stale-commit-only failures documented since earlier passes; unaffected |
| `verify-passport-security-unified-identity.mjs` | 59/59 | Unaffected |
| `npm run build` | pass | |

No existing test was weakened or removed.
