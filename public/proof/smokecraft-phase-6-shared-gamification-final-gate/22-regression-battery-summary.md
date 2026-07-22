# Phase 6 — Full Regression Battery Summary

All suites re-run against the live server after the Phase 6 fixes, in the same session, capturing exact totals.

| Suite | Result |
|---|---|
| `verify-smokecraft-blend-fault.mjs` | 61/61 |
| `verify-smokecraft-challenge-hub.mjs` | 58/58 |
| `verify-smokecraft-collections.mjs` | 34/34 |
| `verify-smokecraft-skill-tree.mjs` | 32/32 |
| `verify-smokecraft-filler-arrangement.mjs` | 17/17 |
| `verify-golden-box-package-5-leaf-construction.mjs` | 27/27 |
| `verify-golden-box-package-7a.mjs` | 33/33 |
| `verify-smokecraft-journey-state.mjs` | 7/7 |
| `verify-smokecraft-new-gamification-screens.mjs` | 24/24 |
| `verify-venue-management-command-hub-package-6b.mjs` | 33/33 |
| `verify-passport-360-connection.mjs` | 54/54 |
| `verify-passport-security-unified-identity.mjs` | 59/59 |
| `verify-smokecraft-route-smoke-test.mjs` (49 routes) | 97/98 (same disclosed non-reproducible load-noise item as the prior closeout pass) |
| `verify-smokecraft-phase6-shared-gamification.mjs` (this pass, dedicated suite) | 49/49 |

**Total across the required battery + dedicated suite: 536/537**, with the single non-passing item being the same previously-disclosed, non-reproducible load-noise item from the production closeout pass (not a Phase 6 regression).

## Test-data pollution encountered and resolved this pass

Two rounds of leftover rows from this pass's own earlier script iterations caused transient failures in `verify-smokecraft-collections.mjs` (badge ownership rows) and `verify-smokecraft-challenge-hub.mjs` (lazily-created daily/weekly instance rows for the current date). Both were cleared via targeted `DELETE`/`TRUNCATE` before the clean re-run recorded above, consistent with the established recurring pattern in this operation. The dedicated Phase 6 suite's own cleanup section was also extended to delete `smokecraft_collection_ownership`, `smokecraft_seed_soil_progress`, and `smokecraft_skill_tree_learner_state` rows for its two test learners so this does not recur on future runs.
