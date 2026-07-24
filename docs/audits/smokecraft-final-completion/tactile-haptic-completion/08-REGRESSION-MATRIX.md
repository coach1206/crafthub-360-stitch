# 08 — Regression Matrix

| Suite | Result | Notes |
|---|---|---|
| `verify-smokecraft-tactile-haptic-interactions.mjs` (new, this pass) | 35/35 | Haptic preference/reduced-motion, shared component states, session interaction census, pointer-events regression check |
| `verify-smokecraft-clean-start-entry-flow.mjs` | 54/55 (1 blocked) | Unaffected; blocked check requires live production backend |
| `verify-smokecraft-entry-prerequisite-guard.mjs` | 43/43 | Unaffected |
| `verify-smokecraft-approved-entry-visuals.mjs` | 24/24 | Unaffected |
| `verify-smokecraft-27-session-sequence.mjs` | 39/39 | Unaffected |
| `verify-golden-box-packaging-studio.mjs` | 70/74 | Same 4 stale-commit-only failures documented since earlier passes; unaffected |
| `verify-passport-security-unified-identity.mjs` | 59/59 | Unaffected |
| `npm run build` | pass | |

No existing test was weakened or removed to make this pass green. One genuine false-positive was found and fixed in this pass's own new test during development (an over-broad regex incorrectly flagged unrelated `triggerHaptic()` calls in later functions as if they were inside an earlier `useEffect`) — corrected to a precise spot-check before being counted as passing, not silently loosened.
