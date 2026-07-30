# Duplicate/Race Proof — Holistic Fix 5C-2B-1

Verified live against the real running server and database.

## Duplicate finalization (idempotency)

A finalized competition's `results/finalize` endpoint was called
again with a different idempotency key. The second call returned the
identical `finalized_at` timestamp as the first (no recomputation).
`SELECT count(*) FROM golden_box_result_finalizations WHERE
competition_id = ...` confirmed exactly one real row despite the
repeated call.

## Two-tab finalization race

Two concurrent `POST .../results/finalize` requests for the same
never-before-finalized competition were fired via `Promise.all`. Both
requests returned `200` with the SAME `finalized_at` timestamp (the
losing request's `UNIQUE_VIOLATION` on the finalizations insert was
caught gracefully and it returned the real winning result rather than
crashing or creating a duplicate). `SELECT count(*) FROM
golden_box_result_finalizations` confirmed exactly one real row.

Mechanism: `finalizeResults()` attempts the finalization-row INSERT
first; on `UNIQUE_VIOLATION` (code 23505) it rolls back its own
transaction and returns `loadFinalizedResult()` for the real winning
row — the same graceful-race pattern used throughout this operation
(judge-assignment, scorecard drafts, Golden Box submissions).
