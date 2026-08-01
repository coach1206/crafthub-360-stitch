# 09 — Regression Results

Reasonably scoped, reusing existing validators rather than re-running
everything exhaustively (per mandate section 7).

## Build

`npm run build` — **PASS** (both before and after this pass's two fixes).
One pre-existing, unrelated build-time esbuild warning ("Duplicate key
'border' in object literal") observed, same as documented in the prior
Full Game Fresh-Player Closure package — outside this pass's scope,
noted not silently fixed.

## Manifest / gameplay authority / integrity

| Validator | Result |
|---|---|
| `validateSmokecraftRequiredInteractionManifest.mjs` | PASS (0 failed) |
| `validateSmokecraftGameplayAuthority.mjs` | PASS (0 failed) |
| `validateSmokecraftGameplayIntegrity.mjs` | PASS (0 failed) |
| `validateSmokecraftPlayerStateIntegrity.mjs` | PASS (0 failed) |

## Golden Box (directly touched by this pass's SC-D068 fix)

| Validator | Result |
|---|---|
| `validateSmokecraftGoldenBoxAuthority.mjs` | PASS (0 failed) |
| `validateSmokecraftGoldenBoxResultsAuthority.mjs` | PASS (0 failed) |
| `validateSmokecraftGoldenBoxJudgingAuthority.mjs` | PASS (0 failed) |
| `validateSmokecraftGoldenBoxAwardsAuthority.mjs` | PASS (0 failed) |

## Venue Humidor, Pairing Engine, Mentor Guidance, Skill Tree, Leaderboard

| Validator | Result |
|---|---|
| `validateSmokecraftVenueHumidorAuthority.mjs` | PASS (0 failed) |
| `validateSmokecraftPairingEngineAuthority.mjs` | PASS (0 failed) |
| `validateSmokecraftMentorGuidanceAuthority.mjs` | PASS (0 failed) |
| `validateSmokecraftSkillTreeAuthority.mjs` | PASS (0 failed) |
| `validateSmokecraftLeaderboardAuthority.mjs` | PASS (0 failed) |

## Required-Interaction Closure Packages B-F (directly relevant — B/C/D touch
selection/scorecard/exploration flows this pass's demo player exercised)

| Validator | Result |
|---|---|
| `validateSmokecraftPackageBScorecardAuthority.mjs` | PASS (0 failed) |
| `validateSmokecraftPackageCSelectionClassification.mjs` | PASS (0 failed) |
| `validateSmokecraftPackageDExplorationAuthority.mjs` | PASS (0 failed) |
| `validateSmokecraftPackageEPassportSequencing.mjs` | PASS (0 failed) |
| `validateSmokecraftPackageFRewardsAuthority.mjs` | PASS (21/21 required interactions) |

## Full Game Fresh-Player Closure — re-run after this pass's fixes

`scripts/verify-smokecraft-full-game-fresh-player.mjs` — **62/62 passed, 0 failed**
(re-run in full after the SC-D068/SC-D068b fixes to confirm no regression
in the complete 27-session + Golden Box lifecycle proof).

## This pass's own new acceptance script

`scripts/verify-smokecraft-final-gameplay-acceptance.mjs` — **82/82 passed, 0 failed**
on the final clean run (after both fixes). Full output:
`acceptance-run-output.json` in this directory.

## Not re-run (scoping note, not a hidden gap)

The individual Package A-F `*-browser.mjs` real-browser suites (110
checks combined across all six packages) were not re-run in this pass —
their server-side authority is re-confirmed above via the corresponding
`validateSmokecraft*Authority.mjs` scripts, and this pass's own new
acceptance script independently re-proves real-browser rendering for the
representative session types (selection, tasting, scorecard) those
packages built. Full per-session UI coverage remains available in each
package's own proof directory if a future pass needs it.
