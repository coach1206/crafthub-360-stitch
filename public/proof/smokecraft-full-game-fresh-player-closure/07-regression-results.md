# 07 — Regression Results

All commands run against the real server (`localhost:3001`, Postgres
`crafthub_smokecraft_final`) on this branch, this commit.

## Build

```
npm run build
```
**Result: PASS.** Full `prebuild` validator chain (asset/manifest/shell/
control-coverage/responsive/player-state-integrity/account-integrity/
gameplay-integrity/gameplay-authority/alert-pointer-safety/tasting-
authority/cultivator-authority/collections-authority/skill-tree-authority/
leaderboard-authority/pairing-engine-authority/mentor-guidance-authority)
all passed with 0 failed checks, followed by a clean `vite build` (one
pre-existing, unrelated esbuild warning — "Duplicate key 'border' in
object literal" in a card component's inline style — noted here for
honesty; it is a lint-level warning, not a build failure, and predates
this pass; out of this pass's scope to fix per the mandate's "small,
targeted fixes only" instruction).

## Required-Interaction Manifest + Authority Validators

| Script | Result |
|---|---|
| `validateSmokecraftRequiredInteractionManifest.mjs` | PASS (0 failed) |
| `validateSmokecraftGameplayAuthority.mjs` | PASS (0 failed) |
| `validateSmokecraftGameplayIntegrity.mjs` | PASS (0 failed) |
| `validateSmokecraftPlayerStateIntegrity.mjs` | PASS (0 failed) |
| `validateSmokecraftGoldenBoxAuthority.mjs` | PASS (0 failed) |
| `validateSmokecraftVenueHumidorAuthority.mjs` | PASS (0 failed) |
| `validateSmokecraftPackageBScorecardAuthority.mjs` | PASS (0 failed) |
| `validateSmokecraftPackageCSelectionClassification.mjs` | PASS (0 failed) |
| `validateSmokecraftPackageDExplorationAuthority.mjs` | PASS (0 failed) |
| `validateSmokecraftPackageEPassportSequencing.mjs` | PASS (0 failed) |
| `validateSmokecraftPackageFRewardsAuthority.mjs` | PASS (Package F, 21/21) |

## Package A-F own API regression suites (re-run against this commit)

| Suite | Result |
|---|---|
| `verify-smokecraft-required-interaction-package-a-api.mjs` | 26/26 |
| `verify-smokecraft-required-interaction-package-b-api.mjs` | 34/34 |
| `verify-smokecraft-required-interaction-package-c-api.mjs` | 39/39 |
| `verify-smokecraft-required-interaction-package-d-api.mjs` | 34/34 |
| `verify-smokecraft-required-interaction-package-e-api.mjs` | 28/28 |
| `verify-smokecraft-required-interaction-package-f-api.mjs` | 25/25 |

**Total: 186/186** across the six package regression suites, plus 11/11
authority/manifest validators, plus a clean build. No regression found.

## This package's own new suites

| Suite | Result |
|---|---|
| `scripts/verify-smokecraft-full-game-fresh-player.mjs` | 62/62 |
| `scripts/verify-smokecraft-full-game-ui-smoke.mjs` | 9/9 |

## Not run (explicitly out of this pass's scope)

Per the mandate's pragmatic scoping, the dozens of other pre-existing
`verify-smokecraft-*` / `e2e-smokecraft-*` scripts at the repo root
(covering venue-humidor commerce, management-sync, visual-regression, and
many historical one-off holistic-fix passes) were not re-run — they are
unrelated to this pass's fresh-player-closure changes (which touched no
product code, only added two new proof scripts), and re-running the
project's entire multi-hundred-script historical test corpus is outside
this pass's "reasonably scoped regression" instruction.
