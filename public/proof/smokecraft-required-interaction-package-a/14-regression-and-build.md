# 14 — Regression and Build

Targeted regression suites re-run against this package's final code (see `regression.log` in
this directory for full output):

| Suite | Result |
|---|---|
| `verify-smokecraft-hf5a-gameplay-engine.mjs` | 22/22 |
| `verify-smokecraft-hf5a2-reward-authority.mjs` | 19/19 |
| `verify-smokecraft-venue-humidor-1a-api.mjs` | 32/32 |
| `verify-smokecraft-hf5c1b-golden-box-api.mjs` | 26/26 |
| `verify-smokecraft-required-interaction-package-a-api.mjs` | 26/26 |
| `verify-smokecraft-required-interaction-package-a-browser.mjs` | 14/14 |
| `scripts/validateSmokecraftRequiredInteractionManifest.mjs` | PASS |

## Build

`npm run build` (which runs the full `prebuild` validator chain — asset validation, manifest
generation, shell adoption, control coverage, responsive, player-state integrity, account
integrity, gameplay integrity/authority, alert-pointer safety, tasting/cultivator/collections/
skill-tree/leaderboard/pairing-engine/mentor-guidance authority validators — before `vite build`)
completed successfully with no errors. Full output in `build.log` in this directory.
