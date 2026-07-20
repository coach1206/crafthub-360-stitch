# SmokeCraft Management Sync — Idempotency Design (Phase 8)

## Key

```
idempotency_key = sha256(`${venueId}:${journeyId}:${destination}:${payloadVersion}`)
```
Enforced as a **database-level unique index** on the natural key tuple
itself, not just the derived hash (belt-and-suspenders, matches the
mandate's "Use a database-level uniqueness constraint. Do not rely only
on frontend state."):
```sql
CREATE UNIQUE INDEX idx_mgmt_sync_events_idempotency
  ON smokecraft_management_sync_events (venue_id, journey_id, destination, payload_version);
```
This directly mirrors the one real idempotency precedent already in this
codebase: `passport_360_earned_stamps.dedupe_key` with its
`CREATE UNIQUE INDEX idx_passport_stamp_dedupe` (migration 068).

## Write path

```sql
INSERT INTO smokecraft_management_sync_events
  (journey_id, snapshot_id, venue_id, guest_reference, destination, payload_version, idempotency_key, status)
VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
ON CONFLICT (venue_id, journey_id, destination, payload_version)
DO NOTHING
RETURNING *;
```
If `RETURNING` yields no row (conflict occurred), the service issues a
follow-up `SELECT * FROM smokecraft_management_sync_events WHERE
venue_id = $1 AND journey_id = $2 AND destination = $3 AND
payload_version = $4` and returns that existing record instead of
erroring. Both statements run inside a single transaction to close the
race between the `INSERT` and the fallback `SELECT`.

## Required behaviors and how each is met

| Behavior | Mechanism |
|---|---|
| First explicit sync creates one record | `INSERT ... ON CONFLICT DO NOTHING RETURNING *` returns the new row |
| Repeated click returns existing record | conflict path returns the existing row unchanged, no new insert |
| Browser refresh creates no record | the `POST /sync` endpoint is only called on explicit user action (Phase 5), never on route/page load — enforced by controller/frontend contract, not by the DB alone |
| Route load creates no record | same — `GET` endpoints are read-only, no `INSERT` in any `GET` handler |
| Network retry creates no duplicate | client retries the same `POST` with the same `(venueId, journeyId, destination, payloadVersion)` body → same conflict path, same existing row returned |
| Concurrent requests create one record | the unique index makes the second concurrent `INSERT` fail/conflict atomically at the database level — no read-then-write race, since Postgres resolves the conflict at commit, not at a prior `SELECT` |
| Changed journey snapshot requires explicit versioned resync | `payload_version` is part of the unique key; a new snapshot with different content requires a caller-supplied incremented `payloadVersion`, which is a *new* row, not a silent overwrite of the old one — preserves history |

## Failure recovery

- A `status = 'failed'` event (network/backend error mid-processing) is
  **not deleted or reused** — the caller retries with the *same*
  `payloadVersion`, hits the same unique-key conflict, and the service
  updates that existing row's `status`/`error_code`/`retry_count` in
  place (an `UPDATE ... WHERE event_id = $1`, not a second `INSERT`) —
  so retries never fabricate a second competing record for the same
  logical sync.
- `retry_count` increments on each failed retry; no automatic cap is
  proposed here (a max-retry policy is a Package B implementation
  decision, not architected here).
