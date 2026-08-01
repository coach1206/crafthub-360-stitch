# 02 — Fresh-Player Run Results

Script: `scripts/verify-smokecraft-full-game-fresh-player.mjs`
Target: real running server on `localhost:3001`, real Postgres (`crafthub_smokecraft_final`).
Identity: one fresh, isolated guest — auto-issued by the real API on first
contact (`GET /api/smokecraft/player-state`), no manual DB row insert, no
localStorage seed, no header/cookie forgery.

## Result

**62 passed, 0 failed (of 62 total).** Full console output captured in
`fresh-player-run-console-log.txt` in this same directory; structured
result JSON in `fresh-player-run-output.json`.

## What it proved, section by section

1. **Identity bootstrap** — a fresh guest starts at 0 XP, 0 completed
   sessions, and is never able to see another guest's state (checked again
   at the end, section 5).
2. **All 27 sessions, 22 distinct completion ids, canonical route order** —
   every session that Required-Interaction Closure Packages A-F proved has
   a real, server-evaluated evidence gate (humidor-match, meet-your-cigar,
   terroir, format, cut-toast-light, first-third, flavor-memory, pairing-lab,
   second-third, knowledge-drop, final-third, scorecard,
   pairing-recommendations, passport-stamp) was driven through that real
   evidence submission endpoint with a genuinely correct answer/selection
   before calling the generic completion endpoint — exactly the request
   shapes already proven in each package's own API test suite, reused here
   rather than re-invented. Sessions without an evidence gate (entry,
   lighting-tutorial, mentor-commentary, ai-summary, final-review, rewards,
   achievements, session-complete) were completed via the generic
   completion endpoint alone, matching their documented
   `requiredInteractionType` (orientation/instructional/recap/review).
3. **Reconciliation against the server's own ledger** — after the full run,
   `GET /api/smokecraft/player-state` was re-read (not cached from earlier
   calls) and every one of the 22 distinct session ids was confirmed
   present exactly once (no duplicates from any of the completion calls),
   and the real Passport-360 journey-completion stamp was confirmed
   claimed. See `03-xp-and-completion-reconciliation.md` for the XP math.
4. **Golden Box full lifecycle** — build, submit, judge, finalize, and
   award, all through real API calls. See `04-golden-box-flow.md`.
5. **Cross-player isolation** — a second, independent fresh guest created
   at the very end of the run still shows 0 XP / 0 completions, proving
   the entire 62-assertion run was correctly scoped to one identity and
   nothing leaked.

## No manual intervention used anywhere in the run

- No manual DB writes to any player-progression table
  (`smokecraft_session_completions`, `smokecraft_activity_attempts`,
  `passport_360_earned_stamps`, etc.) — every row that exists after the run
  was created by the server's own completion/evidence-submission handlers
  in response to a real HTTP call this script made.
- No localStorage manipulation — this script never touches a browser;
  every call is server-side over `http`, using only the guest-session
  cookie the server itself issued.
- No route-skipping — sessions were completed in canonical route order,
  and each evidence-gated session's evidence was submitted before its
  completion call (the server independently enforces this order; the
  script does not need to enforce it, and did not have to work around any
  gate).
- No manual reward injection — every completion call is a real POST to
  `/api/smokecraft/player-state/sessions/:sessionId/complete`; XP amounts
  are never sent by the client and are looked up server-side.

The only direct SQL statement in the entire script is a single `INSERT`
into `golden_box_competitions` to create a competition to enter — this is
an **admin-created fixture**, not player state, and is the exact same
technique every prior Golden Box test package (`verify-smokecraft-hf5c1b-*`,
`hf5c2a-*`, `hf5c2b1-*`, `hf5c2b2-*`) already used and is accepted as
non-player-state setup, not a manual progression edit.
