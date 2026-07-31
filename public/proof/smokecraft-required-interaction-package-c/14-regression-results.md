# 14 — Regression Results

## New suites (this package)

- `verify-smokecraft-required-interaction-package-c-api.mjs` — **39/39 passed**.
- `verify-smokecraft-required-interaction-package-c-browser.mjs` — **17/17 passed**, real Chromium via Playwright, 5-viewport sweep.
- `scripts/validateSmokecraftPackageCSelectionClassification.mjs` — **PASS**, 26/26.

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
| `verify-smokecraft-hf5a-gameplay-engine.mjs` (fixed, see defects) | 22/22 |
| `verify-smokecraft-hf5a2-reward-authority.mjs` | 19/19 |
| `verify-smokecraft-hf5a3d-tasting-flow.mjs` | 13/13 |
| `verify-smokecraft-hf4-player-state-idempotency.mjs` (fixed, see defects; API portion, 32 assertions before the pre-existing unrelated port-5050 browser section) | 32/32 (API) |
| `verify-smokecraft-hf4b-account-and-conversion.mjs` (fixed, see defects) | 32/32 |
| `verify-smokecraft-venue-humidor-1a-api.mjs` | 32/32 |
| `verify-smokecraft-hf5c1b-golden-box-api.mjs` | 26/26 |
| `verify-smokecraft-required-interaction-package-a-api.mjs` | 26/26 |
| `verify-smokecraft-required-interaction-package-a-browser.mjs` | 14/14 |
| `verify-smokecraft-package-a-draft-correction-api.mjs` | 30/30 |
| `verify-smokecraft-package-a-draft-correction-browser.mjs` | 14/14 |
| `verify-smokecraft-required-interaction-package-b-api.mjs` | 34/34 |
| `verify-smokecraft-required-interaction-package-b-browser.mjs` | 12/12 |

Full output: `regression.log` in this directory.

## Full build

`npm run build` (including the entire prebuild validator chain) — clean. See `build.log`.
