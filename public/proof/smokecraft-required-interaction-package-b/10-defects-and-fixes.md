# 10 — Defects Found and Fixed

## Real regression found and fixed in a pre-existing test

`verify-smokecraft-hf5a-gameplay-engine.mjs` section 9 ("Two-tab race on a completion that grants a badge and a rank promotion") raced two concurrent `POST .../sessions/scorecard/complete` calls **without ever submitting scorecard evidence first**. Once the new `hasScorecardEvidence` gate was added, both race requests correctly began failing with `400 scorecard_evidence_required` instead of succeeding — this is the *intended* effect of closing the required-interaction gap (completion can no longer happen for `'scorecard'` without a real rating), not a bug in the new code. Fixed by adding one real `POST /scorecard/submit` call with a complete, valid rating before the race, so the test still exercises what it was designed to exercise (the completion race itself). Confirmed: 22/22 after the fix, with no change to the new gate's behavior.

## Pre-existing, out-of-scope, unrelated condition (not fixed this pass)

`verify-smokecraft-rewards-achievements.mjs` (a browser test for the unrelated `/smokecraft/rewards` route, not modified by this pass) times out at a `[role="tab"]` locator. It uses the same `page.goto(BASE)` → `page.evaluate(seedGuest)` localStorage-seeding pattern already identified and fixed (in this operation's own new test files only) as a race with the app's own mounted-state autosave in the prior Package A correction pass (see `public/proof/smokecraft-required-interaction-package-a-draft-correction/10-browser-test-seeding-bug-and-fix.md`). This file was not touched by this pass, never calls the real scorecard API (it only fakes `completedSteps` client-side for route-guard checks), and is therefore unrelated to Session 19's server authority. Flagged, not fixed — same disposition as `verify-smokecraft-mini-tasting.mjs`, already documented as a known pre-existing gap.

## No other regressions found

All 20 regression suites run for this pass (see `11-test-results.md`) pass cleanly, including the full targeted Package A regression, Venue Humidor spot checks, Golden Box, Skill Tree, Leaderboard, and the full prebuild validator chain via `npm run build`.
