# 08 — Completion and XP Integrity

- Completion for Sessions 8/12/16 is refused (`400 tasting_observation_required`) unless a real
  evidence row already exists for that guest and session — verified for all three sessions
  (API test sections 3, 8, 9) and for a second, unrelated guest (API test section 7,
  "cross-player isolation").
- XP is awarded exactly once per session per guest: a duplicate completion call after a real
  completion returns `alreadyCompleted: true` and the player's `xpTotal` does not change
  (API test section 6).
- XP amount itself was not changed by this pass — still resolved server-side from
  `sessionRewardTable.js` by `sessionId`.
- Sessions outside Package A's scope (e.g. `entry`) complete exactly as before, with no new gate
  applied — verified in API test section 12.
- A genuine concurrency race (3 simultaneous evidence submissions, one completion call) resolves
  to exactly one completion record, no duplicate XP — API test section 10.
