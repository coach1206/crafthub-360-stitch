# 06 — Duplicate Prevention / Concurrency Proof

## Duplicate prevention — real dedupe_key reused, not reinvented

`claimJourneyCompletionStamp()` (unmodified, canonical `server/services/passport360/passport360SyncService.js`) calls `awardPassportStampLive()`, which writes to `passport_360_earned_stamps` under a real, database-enforced `dedupe_key` UNIQUE constraint — this is the SAME mechanism already used by every other Passport-360 stamp in this system. Package E introduces no new claim table, no in-memory Map, no second idempotency scheme.

- API test 10: a second `POST /claim` by the same guest → `409 { duplicate: true }`; `GET /guest/me` shows exactly 1 `smokecraft-journey-complete` stamp.
- Browser test: a duplicate-click simulation (second real `fetch()` to `/claim` after the UI claim) → `409`; exactly 1 stamp row confirmed via `/guest/me`.

## Concurrency proof

API test 11: 3 concurrent `POST /claim` requests from the same guest (`Promise.all`) → exactly 1 succeeds with `200 claimed: true`; the other(s) resolve as duplicates or the same real row; `GET /guest/me` confirms exactly 1 stamp row exists after the race — the database UNIQUE constraint on `dedupe_key`, not an application-level check, is what prevents the double-award.
