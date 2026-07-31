# 08 — Idempotency and Concurrency Proof

- Re-submitting scorecard evidence for an already-recorded session returns `alreadyRecorded: true` (not a new row) — API test section 9.
- Re-completing an already-completed session returns `alreadyCompleted: true` with no additional XP — API test section 9.
- 3 concurrent evidence submissions sharing one idempotency key all succeed without error, and a subsequent completion call succeeds exactly once, leaving exactly one completion record — API test section 10 (a genuine `Promise.all` race, not a serialized simulation).
- The browser suite independently confirms a duplicate real HTTP completion click results in exactly one completion record (browser test, "Duplicate click applies once").
