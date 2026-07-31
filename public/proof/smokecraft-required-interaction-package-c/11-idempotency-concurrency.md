# 11 — Idempotency and Concurrency

- **Rapid double-click / browser retry**: a duplicate completion call returns `alreadyCompleted: true`, no additional XP — same shared `completeSession()` idempotency as every other package.
- **Duplicate idempotency key**: reusing the same key for a correct submission returns the existing evidence row (`alreadyRecorded: true`), never a duplicate insert.
- **Concurrent successful submissions award XP once**: verified live with a genuine 3-way `Promise.all` race on Session 5's correct sequence — exactly one completion record results (API test).
- **Concurrent draft saves**: unchanged, pre-existing optimistic-concurrency pattern (`expectedVersion`/`409 stale_version`) applies identically to Package C drafts.
- **Stale draft cannot overwrite completion**: verified live for Session 5 — a draft `PUT` attempted after completion is denied `409 already_completed`.
- **Completed state cannot return to in-progress**: there is no endpoint that un-completes a session; the only draft write path is blocked once evidence exists.
- **One session cannot overwrite another**: verified (see doc 10).
- **Honest 409 conflict**: returned for both stale-version and post-completion draft writes, consistent with Package A/B.
