# 05 — Regression Matrix

| Suite | Result | Notes |
|---|---|---|
| `verify-smokecraft-approved-entry-visuals.mjs` (new, this pass) | 24/24 | All checks real (source + live browser); 0 fail |
| `verify-smokecraft-clean-start-entry-flow.mjs` | 54/55 (1 blocked) | Unaffected by this pass; blocked check requires live production backend |
| `verify-smokecraft-entry-prerequisite-guard.mjs` | 43/43 | Unaffected by this pass |
| `verify-smokecraft-phase9-full-journey.mjs` | 37/40 | Same 3 stale-commit-only failures documented since the Entry-Prerequisite pass; unaffected by this pass |
| `verify-phase9-packaging-studio-journey-amendment.mjs` | 51/54 | Same 3 stale-commit-only failures documented previously; unaffected |
| `verify-golden-box-packaging-studio.mjs` | 70/74 | Same 4 stale-commit-only failures documented previously; unaffected |
| `verify-passport-security-unified-identity.mjs` | 59/59 | Unaffected |
| `npm run build` | pass | |

No existing test was weakened or removed to make this pass green.
