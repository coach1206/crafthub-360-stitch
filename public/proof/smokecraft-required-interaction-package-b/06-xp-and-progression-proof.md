# 06 — XP and Progression Proof

- XP for `'scorecard'` is looked up server-side from `sessionRewardTable.js` (`src/constants/smokecraftRewards.js`, unchanged: 100 XP, badges `CIGAR_REVIEW`/`SCORECARD`) — the evidence-submission function itself never awards XP.
- XP total increases by exactly the expected amount after a real completion (API test section 8; browser test — real `xpTotal > 0` after completion).
- A duplicate completion call is a safe idempotent no-op (`alreadyCompleted: true`) with **no** additional XP granted (API test section 9; browser test — exactly one completion record after a duplicate click).
- A genuine concurrency race (3 simultaneous evidence submissions sharing one idempotency key, then one completion call) resolves to exactly one completion record, never duplicate XP (API test section 10).
- A draft save alone — no matter how many times, with any valid partial data — never changes XP or creates a completion record (API test section 15).
- Badge/rank-promotion race safety (Holistic Fix 5A's existing two-tab race coverage, `verify-smokecraft-hf5a-gameplay-engine.mjs` section 9) still passes after being updated to submit real scorecard evidence first — see `10-defects-and-fixes.md`.
