# Concurrent-Save Proof

`saveTastingDraft()` uses the pre-existing optimistic-concurrency pattern (`server/services/smokecraft/playerStateService.js`, unchanged this pass, shared with `saveJourneySnapshot()`): a `SELECT ... FOR UPDATE` row lock inside a transaction, the caller-supplied `expectedVersion` checked against the current row version, and a `version = version + 1` upsert on match.

Verified live (`verify-smokecraft-package-a-draft-correction-api.mjs`, section 6):

- Two concurrent `PUT` requests sharing the same `expectedVersion` (a real race, via `Promise.all`) resolve to exactly one success (`200`) and exactly one honest `409 stale_version` — never silent corruption, never both silently "succeeding" with the last write winning invisibly.
- The `409` response body returns the server's real current draft (`current.draftData`/`current.version`), so the losing client can adopt the winner's state rather than being left in an unknown position.
