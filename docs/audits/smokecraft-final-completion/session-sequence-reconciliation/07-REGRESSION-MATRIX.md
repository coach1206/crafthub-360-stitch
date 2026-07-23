# 07 — Regression Matrix

| Suite | Result | Notes |
|---|---|---|
| `verify-smokecraft-27-session-sequence.mjs` (new, this pass) | 39/39 | Registry integrity, route/guard consistency, completion math, S1/S27/63% rejection, full 27-session live route sweep, direct-lock proof |
| `verify-smokecraft-clean-start-entry-flow.mjs` | 54/55 (1 blocked) | Unaffected; blocked check requires live production backend |
| `verify-smokecraft-entry-prerequisite-guard.mjs` | 43/43 | Unaffected |
| `verify-smokecraft-approved-entry-visuals.mjs` | 24/24 | Unaffected |
| `verify-smokecraft-phase9-full-journey.mjs` | 37/40 | Same 3 stale-commit-only failures documented since the Entry-Prerequisite pass; unaffected |
| `verify-phase9-packaging-studio-journey-amendment.mjs` | 51/54 | Same 3 stale-commit-only failures documented previously; unaffected |
| `verify-golden-box-packaging-studio.mjs` | 70/74 | Same 4 stale-commit-only failures documented previously; unaffected |
| `verify-passport-security-unified-identity.mjs` | 59/59 | Unaffected |
| `npm run build` | pass | |

**Disclosed gap:** no dedicated, permanently-committed test suite exists specifically named for the prior "Start New Journey control" pass (its own verification script was a temporary scratch file, deleted after use per this operation's established pattern). That feature's behavior is still covered indirectly by `verify-smokecraft-clean-start-entry-flow.mjs` (which tests the same underlying `useStartNewSmokeCraftJourney()` hook and passes), but there is no standalone "Start New Journey control suite" to point to as item 59 of this pass's mandate literally requested. Disclosed rather than fabricated.

No existing test was weakened or removed to make this pass green.
