# 03 — Regression Matrix

| Suite | Result | Notes |
|---|---|---|
| `verify-smokecraft-final-approved-shells.mjs` (new) | 13/13 | 4 converted screens hash-verified + stale-data checks; 2 blocked screens' no-fake-data-leak confirmed |
| `verify-smokecraft-approved-landing-control-plane.mjs` | 62/62 | Unaffected |
| `verify-smokecraft-canonical-runtime.mjs` | 19/19 | Unaffected |
| `verify-smokecraft-canonical-journey-authority.mjs` | 25/25 | Unaffected |
| `verify-smokecraft-zero-legacy-runtime.mjs` | 9/9 | Unaffected |
| `verify-smokecraft-zero-old-visuals.mjs` | 20/20 | Unaffected |
| `verify-smokecraft-tactile-haptic-interactions.mjs` | 71/71 | 1 assertion retargeted (SmokeCraftTactileCard → SmokeCraftImageBoundsOverlay presence check), real behavioral checks unchanged |
| `verify-smokecraft-approved-entry-visuals.mjs` | 24/24 | Unaffected |
| `verify-smokecraft-27-session-sequence.mjs` | 39/39 | Unaffected |
| `verify-passport-security-unified-identity.mjs` | 59/59 | Unaffected |
| `npm run build` | pass | |
| Backend health | pass | 200, `db: postgres` |
| Preview startup | pass | 200 |

All at or above every previously documented baseline.
