# 24 — Final Gameplay Acceptance Re-Run Against Infrastructure Baseline

Script: `scripts/verify-smokecraft-final-gameplay-acceptance.mjs`
Target: backend on `localhost:3001` (dev-mode, real Postgres) +
`vite preview` on `localhost:5050` (real Playwright browser walk, per the
script's own `SC_UI` default and `vite.config.js`'s documented preview
proxy topology for browser-test harnesses).

## Result

**82 passed, 0 failed (of 82 total).** Identical to the pre-Package-4
baseline recorded in
`public/proof/smokecraft-final-gameplay-acceptance/`.

Sections re-verified real:

1. Demo player state built via real 27-session completion API calls (22
   distinct completions, 1175 XP, matches server ledger).
2. Golden Box lifecycle for the demo player — build/submit/judge/finalize/
   award, all real API calls, real server-computed award.
3. Investor demo-path visual walk — real Playwright browser session across
   desktop/tablet/mobile viewports through 14 screens (welcome,
   venue-select, mentor-selection, humidor-match, first-third, scorecard,
   rewards, passport, skill-tree, leaderboard, golden-box-build,
   golden-box-competitions, golden-box-results, session-complete) — every
   screen renders without console errors/failed critical requests and has
   at least one real clickable primary control.
4. UI vs. server player-state agreement — the Rewards screen displays the
   server's own real XP total (1175), not a client-fabricated number.
5. Completion persistence across a hard reload — server-persisted, not
   client-memory-only.

One environment note (not a functional issue): the browser leg of this
suite requires a rendered frontend at `http://localhost:5050`. Package 4's
infrastructure work did not change this requirement; `npx vite preview
--port 5050` was started for this pass to match the script's documented
target, exactly as the script's own header comment describes.

No regression from Production Package 4's infrastructure changes.
