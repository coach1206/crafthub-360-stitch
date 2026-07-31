# 13 — Regression Results

## New suites (this package)

- `verify-smokecraft-required-interaction-package-d-api.mjs` — **34/34 passed**.
- `verify-smokecraft-required-interaction-package-d-browser.mjs` — **15/15 passed**, real Chromium via Playwright, 5-viewport sweep.
- `scripts/validateSmokecraftPackageDExplorationAuthority.mjs` — **PASS**, 21/21.

## Regression (targeted, re-run against this package's final code)

| Suite | Result |
|---|---|
| `scripts/validateSmokecraftRequiredInteractionManifest.mjs` | PASS |
| `scripts/validateSmokecraftGameplayAuthority.mjs` | PASS |
| `scripts/validateSmokecraftGameplayIntegrity.mjs` | PASS |
| `scripts/validateSmokecraftPlayerStateIntegrity.mjs` | PASS |
| `scripts/validateSmokecraftSkillTreeAuthority.mjs` | PASS |
| `scripts/validateSmokecraftLeaderboardAuthority.mjs` | PASS |
| `scripts/validateSmokecraftMentorGuidanceAuthority.mjs` | PASS |
| `scripts/validateSmokecraftPackageBScorecardAuthority.mjs` | PASS |
| `scripts/validateSmokecraftPackageCSelectionClassification.mjs` | PASS |
| `verify-smokecraft-hf5a-gameplay-engine.mjs` | 22/22 |
| `verify-smokecraft-hf5a2-reward-authority.mjs` | 19/19 |
| `verify-smokecraft-hf5c1b-golden-box-api.mjs` | 26/26 |
| `verify-smokecraft-hf5a3d-tasting-flow.mjs` | 13/13 |
| `verify-smokecraft-hf4b-account-and-conversion.mjs` | 32/32 |
| `verify-smokecraft-hf4-player-state-idempotency.mjs` (fixed, see doc 14) | **30/30 — first time this suite has run to completion in this operation** |
| `verify-smokecraft-venue-humidor-1a-api.mjs` | 32/32 |
| `verify-smokecraft-required-interaction-package-a-api.mjs` | 26/26 |
| `verify-smokecraft-required-interaction-package-a-browser.mjs` | 14/14 |
| `verify-smokecraft-package-a-draft-correction-api.mjs` | 30/30 |
| `verify-smokecraft-package-a-draft-correction-browser.mjs` | 14/14 |
| `verify-smokecraft-required-interaction-package-b-api.mjs` | 34/34 |
| `verify-smokecraft-required-interaction-package-b-browser.mjs` | 12/12 |
| `verify-smokecraft-required-interaction-package-c-api.mjs` | 39/39 |
| `verify-smokecraft-required-interaction-package-c-browser.mjs` | 17/17 |

Full output: `regression.log` in this directory.

## Full build

`npm run build` (entire prebuild validator chain) — clean. See `build.log`.
