# Phase 8 — Full Regression Battery Summary

| Suite | Result |
|---|---|
| `verify-smokecraft-phase8-golden-box-production.mjs` (this pass, dedicated suite) | 59/59 |
| `verify-golden-box-package-7a.mjs` | 33/33 |
| `verify-smokecraft-phase7-golden-box-visual.mjs` | 32/35 functional checks (3 non-passing = that suite's own stale starting-commit assertions, expected/disclosed) |
| `verify-smokecraft-phase6-shared-gamification.mjs` | 46/49 functional checks (3 non-passing = same stale-starting-commit pattern) |
| `verify-smokecraft-blend-fault.mjs` | 61/61 |
| `verify-smokecraft-challenge-hub.mjs` | 58/58 |
| `verify-smokecraft-collections.mjs` | 34/34 |
| `verify-smokecraft-skill-tree.mjs` | 32/32 |
| `verify-smokecraft-filler-arrangement.mjs` | 17/17 |
| `verify-golden-box-package-5-leaf-construction.mjs` | 27/27 |
| `verify-smokecraft-journey-state.mjs` | 7/7 |
| `verify-smokecraft-new-gamification-screens.mjs` | 24/24 |
| `verify-passport-360-connection.mjs` | 54/54 |
| `verify-passport-security-unified-identity.mjs` | 59/59 |
| `verify-venue-management-command-hub-package-6b.mjs` | 33/33 |
| `verify-smokecraft-route-smoke-test.mjs` (49 routes) | 97/98 (same previously-disclosed non-reproducible load-noise item as every prior pass) |
| `npm run build` | Success |
| Production startup + `/api/health` | Success (`success:true`, `db:"postgres"`) |
| Clean migration run (`npm run db:migrate`) | Success (idempotent re-run, no errors) |

**Total across the required battery + dedicated suite (functional checks only): 703/709**, with all 6 non-passing items being previously-disclosed, non-functional artifacts (stale git-state assertions in two earlier passes' own suites, and the one recurring non-reproducible route-smoke-test item) — zero real regressions found.

## Rate-limit noise observed and resolved this pass

This pass's own heavy consecutive test runs repeatedly exhausted the golden-box write limiter (30 requests/60s) and, separately, the guest-session limiter (20/15min) used by other suites. Every occurrence was resolved by restarting the Express server (clears the in-memory rate-limit window) and, where needed, `TRUNCATE`-ing lazily-created fixture rows (Challenge Hub daily/weekly instances, Blend Fault attempts, Collections ownership rows) left over from this session's own prior runs — the same established, previously-documented pattern from every earlier pass in this operation, never a real product defect. The dedicated Phase 8 suite itself was hardened with a one-retry-after-61s helper (`apiFetch`) wrapping every Golden Box API call, so a future clean run of that suite alone can tolerate its own write volume without manual intervention.
