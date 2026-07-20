# Journey/Visual/Sequence Final Pass — Test Evidence

## New suite: `verify-smokecraft-journey-state.mjs`

```
PASS — Inconsistent data: page does NOT claim "Journey Completed" when only 2/27 real sessions are done
PASS — Inconsistent data: completion percentage is NOT 100% (real count used instead of the single flag)
PASS — Complete journey: page DOES show "Journey Completed"
PASS — Complete journey: completion percentage IS 100%
PASS — Complete journey: primary action is "Review Completed Journey", not "Resume Journey"
PASS — Complete journey: bottom nav primary is no longer "Resume Journey"
PASS — Landing: completed journey shows "View Results", not a bare "Resume Journey"

7/7 passed
```

Scenario 1 reproduces the exact shape of the reported live bug (a `completedSteps` array containing
`session-complete` alongside only 2 other real session ids) and proves the fix no longer reports that
as a completed journey. Scenario 2 seeds a genuinely complete 21-real-session-id set (which resolves to
all 27 numbered sessions, since several ids map to multiple merged session numbers) and proves every
affected surface — page body text, completion percentage, and the bottom sticky nav bar's primary
action — now agree, on both `/smokecraft/resume` and `/smokecraft`.

Note: seeding must use `page.addInitScript()` (executes before the app's own mount-time code) rather
than a post-navigation `localStorage` write — a first draft of this suite used the latter and produced
false failures caused by a route-guard redirect racing the seed write, unrelated to the actual fix. This
is documented so a future pass doesn't rediscover the same test-harness pitfall.

## Regression (re-run against `crafthub_pkg7a_probe`)

| Suite | Result |
|---|---|
| verify-golden-box-package-7a.mjs | 33/33 |
| verify-golden-box-package-4-seed-soil.mjs | 17/17 |
| verify-golden-box-game-engine-flavor-memory.mjs | 4/4 |
| verify-venue-management-command-hub-package-6b.mjs | 33/33 |
| scripts/verify-production-visual-sequence.mjs | 28/28 reachable, 0 overflow, 0 blank; 3 routes carried known non-blocking console entries (2 unreproduced/transient — see prior pass's own disclosure; `/smokecraft/seed-soil` picked up 2× 429 + 1× 401 this run specifically from the rate limiter after many consecutive heavy suite runs in this same session — the same documented artifact from Package 6's gate review, cleared by restarting the dev server, not a code regression) |

## Build

`npm run build` — PASS.
