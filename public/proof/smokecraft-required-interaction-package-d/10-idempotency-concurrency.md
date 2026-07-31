# 10 — Idempotency and Concurrency

- **Rapid double-save**: draft saves are idempotent (last-write-wins under optimistic concurrency, same as every other package).
- **Duplicate final submission**: re-submitting after an already-correct evidence row returns `alreadyRecorded: true`, not a new row (Session 15, API test).
- **Concurrent completion awards XP once**: a genuine 3-way `Promise.all` race of correct Session 4 submissions, followed by one completion call, resolves to exactly one completion record (API test).
- **Concurrent draft writes do not corrupt state**: unchanged, pre-existing optimistic-concurrency pattern applies identically.
- **Stale version returns honest 409**: unchanged pattern.
- **Completed interaction cannot return to in-progress**: no endpoint exists that un-completes a session; the only draft write path is blocked once evidence exists (`409 already_completed`).
- **One session cannot overwrite another**: verified (doc 09).
