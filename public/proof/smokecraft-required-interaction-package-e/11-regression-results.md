# 11 — Regression Results

## New suites (this package)

- `verify-smokecraft-required-interaction-package-e-api.mjs` — **28/28 passed**.
- `verify-smokecraft-required-interaction-package-e-browser.mjs` — **19/19 passed**, real Chromium via Playwright, 5-viewport sweep.
- `scripts/validateSmokecraftPackageEPassportSequencing.mjs` — **PASS**, 30/30.

## Regression (targeted, re-run against this package's final code)

| Suite | Result |
|---|---|
| `scripts/validateSmokecraftRequiredInteractionManifest.mjs` | PASS (20/21 COMPLETE_AND_VERIFIED, up from 19/21) |
| `scripts/validateSmokecraftGameplayAuthority.mjs` | PASS |
| `scripts/validateSmokecraftGameplayIntegrity.mjs` | PASS |
| `scripts/validateSmokecraftPlayerStateIntegrity.mjs` | PASS |
| `scripts/validateSmokecraftSkillTreeAuthority.mjs` | PASS |
| `scripts/validateSmokecraftLeaderboardAuthority.mjs` | PASS |
| `scripts/validateSmokecraftMentorGuidanceAuthority.mjs` | PASS |
| `scripts/validateSmokecraftPackageBScorecardAuthority.mjs` | PASS |
| `scripts/validateSmokecraftPackageCSelectionClassification.mjs` | PASS |
| `scripts/validateSmokecraftPackageDExplorationAuthority.mjs` | PASS |
| `verify-smokecraft-hf5a-gameplay-engine.mjs` | 22/22 |
| `verify-smokecraft-hf5a2-reward-authority.mjs` | 19/19 |
| `verify-smokecraft-hf5c1b-golden-box-api.mjs` | 26/26 |
| `verify-smokecraft-hf5a3d-tasting-flow.mjs` | 13/13 |
| `verify-smokecraft-hf4b-account-and-conversion.mjs` | 32/32 |
| `verify-smokecraft-hf4-player-state-idempotency.mjs` | 30/30 |
| `verify-smokecraft-venue-humidor-1a-api.mjs` | 32/32 |
| `verify-smokecraft-required-interaction-package-a-api.mjs` | 26/26 |
| `verify-smokecraft-required-interaction-package-a-browser.mjs` | 14/14 |
| `verify-smokecraft-package-a-draft-correction-api.mjs` | 30/30 |
| `verify-smokecraft-package-a-draft-correction-browser.mjs` | 14/14 |
| `verify-smokecraft-required-interaction-package-b-api.mjs` | 34/34 |
| `verify-smokecraft-required-interaction-package-b-browser.mjs` | 12/12 |
| `verify-smokecraft-required-interaction-package-c-api.mjs` | 39/39 |
| `verify-smokecraft-required-interaction-package-c-browser.mjs` | 17/17 |
| `verify-smokecraft-required-interaction-package-d-api.mjs` | 34/34 |
| `verify-smokecraft-required-interaction-package-d-browser.mjs` | 15/15 |

Golden Box coverage: `verify-smokecraft-hf5c1b-golden-box-api.mjs` (26/26). Venue Humidor coverage: `verify-smokecraft-venue-humidor-1a-api.mjs` (32/32). Both unaffected by Package E's changes.

Full output: `regression.log` in this directory.

## Full build

`npm run build` — clean, exit 0. See `build.log`.

## Real defect found and fixed mid-pass (beyond the two scoped defects)

`playerStateController.js`'s `sessions/:sessionId/complete` handler had no mapping for the new `passport_stamp_evidence_required` error code — an unclaimed-stamp completion attempt initially surfaced as an honest-looking but wrong `500 internal_error` instead of the correct `400`. Fixed by adding the mapping alongside the existing `tasting_observation_required` / `scorecard_evidence_required` / `selection_evidence_required` cases, following the exact existing pattern.
