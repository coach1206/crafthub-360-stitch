# 11 — Test Results

## New suites (this package)

- `verify-smokecraft-required-interaction-package-b-api.mjs` — **34/34 passed**. Covers: authorized draft read/save, cross-player denial, cross-session denial, malformed payload, invalid field values, missing required fields, successful final submission with server-owned evaluation, completion persistence, XP award, progression event, duplicate submission, concurrent submission, stale draft rejection / already-completed behavior, direct API bypass denial, next-step unlock, no-XP-on-draft, audit-path confirmation, unaffected-sessions confirmation.
- `verify-smokecraft-required-interaction-package-b-browser.mjs` — **12/12 passed**, real Chromium via Playwright. Covers: route load, instructions display, incomplete-scorecard client-side rejection, real partial draft save, leave-and-return resume, genuine hard reload resume, successful completion, XP/progression update, completion-survives-reload, duplicate-click protection, offline state (no fake success), and a 5-viewport responsive sweep.
- `scripts/validateSmokecraftPackageBScorecardAuthority.mjs` — **PASS**, 21/21 structural checks (server authority, no client-owned score, no duplicate scoring service, manifest/test/proof references present).

## Regression (unchanged systems, re-run against this package's final code)

| Suite | Result |
|---|---|
| `scripts/validateSmokecraftRequiredInteractionManifest.mjs` | PASS |
| `scripts/validateSmokecraftGameplayAuthority.mjs` | PASS |
| `scripts/validateSmokecraftGameplayIntegrity.mjs` | PASS |
| `scripts/validateSmokecraftPlayerStateIntegrity.mjs` | PASS |
| `scripts/validateSmokecraftSkillTreeAuthority.mjs` | PASS |
| `scripts/validateSmokecraftLeaderboardAuthority.mjs` | PASS |
| `verify-smokecraft-hf5a-gameplay-engine.mjs` (fixed, see doc 10) | 22/22 |
| `verify-smokecraft-hf5a2-reward-authority.mjs` | 19/19 |
| `verify-smokecraft-hf5c1b-golden-box-api.mjs` | 26/26 |
| `verify-smokecraft-hf5a3d-tasting-flow.mjs` | 13/13 |
| `verify-smokecraft-venue-humidor-1a-api.mjs` | 32/32 |
| `scripts/validateSmokecraftVenueHumidorCheckoutAuthority.mjs` | PASS |
| `verify-smokecraft-required-interaction-package-a-api.mjs` | 26/26 |
| `verify-smokecraft-required-interaction-package-a-browser.mjs` | 14/14 |
| `verify-smokecraft-package-a-draft-correction-api.mjs` | 30/30 |
| `verify-smokecraft-package-a-draft-correction-browser.mjs` | 14/14 |
| `verify-smokecraft-hf4b-account-and-conversion.mjs` | 32/32 |

Full output: `regression.log` in this directory.

## Known pre-existing condition, out of scope

`verify-smokecraft-rewards-achievements.mjs` — see `10-defects-and-fixes.md`.
