# Stage 5 Subsystem Matrix — Closure Gate

Every subsystem below was verified this pass via its build-blocking
validator (structural, static-analysis-based, checked live) and/or a
live API/browser regression suite. All ran clean — 0 failures.

| Subsystem | Validator | Result |
|---|---|---|
| Manifest / route-shell adoption | `validateSmokecraftManifest.mjs`, `validateSmokecraftShellAdoption.mjs` | PASS |
| Gameplay authority / integrity | `validateSmokecraftGameplayAuthority.mjs`, `validateSmokecraftGameplayIntegrity.mjs` | PASS |
| Account / player-state integrity | `validateSmokecraftAccountIntegrity.mjs`, `validateSmokecraftPlayerStateIntegrity.mjs` | PASS |
| Pairing engine | `validateSmokecraftPairingEngineAuthority.mjs` | PASS |
| Mentor guidance | `validateSmokecraftMentorGuidanceAuthority.mjs` | PASS |
| Mentor voice/narration security | `validateSmokecraftMentorVoiceSecurity.mjs` | PASS |
| Challenge Hub | `validateSmokecraftChallengeHubAuthority.mjs` | PASS |
| Cultivator | `validateSmokecraftCultivatorAuthority.mjs` | PASS |
| Tasting | `validateSmokecraftTastingAuthority.mjs` | PASS |
| Collections | `validateSmokecraftCollectionsAuthority.mjs` | PASS |
| Skill Tree | `validateSmokecraftSkillTreeAuthority.mjs` | PASS |
| Leaderboard | `validateSmokecraftLeaderboardAuthority.mjs` | PASS |
| Golden Box submission | `validateSmokecraftGoldenBoxAuthority.mjs` | PASS |
| Golden Box judging | `validateSmokecraftGoldenBoxJudgingAuthority.mjs` | PASS |
| Golden Box results/ranking | `validateSmokecraftGoldenBoxResultsAuthority.mjs` | PASS |
| Golden Box awards (incl. SC-D062 closure checks) | `validateSmokecraftGoldenBoxAwardsAuthority.mjs` | PASS |
| Assets | `validateSmokecraftAssets.mjs` | PASS (83/83) |
| Alert/pointer safety | `validateSmokecraftAlertPointerSafety.mjs` | PASS |
| Interaction/control coverage (proof-based) | `validateSmokecraftControlCoverage.mjs` | PASS |
| Responsive five-viewport (proof-based) | `validateSmokecraftResponsive.mjs` | PASS |

## Live regression suites (API, real running server)

| Suite | Result |
|---|---|
| Golden Box submission (`verify-smokecraft-hf5c1b-golden-box-api.mjs`) | 26/26 |
| Golden Box judge assignment (`verify-smokecraft-hf5c2a-judge-assignment-api.mjs`) | 11/11 |
| Golden Box scorecards (`verify-smokecraft-hf5c2a-scorecard-api.mjs`) | 18/18 |
| Golden Box results/ranking (`verify-smokecraft-hf5c2b1-results-api.mjs`) | 33/33 |
| Golden Box awards (`verify-smokecraft-hf5c2b2-awards-api.mjs`) | 29/29 |
| Core reward-authority regression (`verify-smokecraft-hf5a2-reward-authority.mjs`) | 19/19 |
| Stage 5 closure integration journey (new, this pass) | 22/22 |

## Live browser suites (real Playwright, real dev server)

| Suite | Result |
|---|---|
| Judge workflow (`verify-smokecraft-hf5c2a-judge-browser.mjs`) | 17/17 |
| Results/ranking (`verify-smokecraft-hf5c2b1-results-browser.mjs`) | 13/13 |
| Awards (`verify-smokecraft-hf5c2b2-awards-browser.mjs`) | 10/10 |

Totals: **20 validators, all PASS** · **7 live API suites, 158
assertions, 0 failures** · **3 live browser suites, 40 assertions, 0
failures**.
