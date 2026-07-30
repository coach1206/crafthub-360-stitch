# Finalization Proof — Holistic Fix 5C-2B-1

Verified live against the real running server and database.

- **Withdrawn/disqualified exclusion**: a competition with one
  eligible entry, one withdrawn entry, and one disqualified entry
  finalizes to a `ranked` array containing only the eligible entry;
  neither excluded entry appears in `ranked` or `pending` in the live
  admin view.
- **Atomic, authorized, immutable**: finalization requires
  `requireRole('admin')` (a non-admin request is rejected 403). Every
  ranked entry's result row is written inside one transaction
  (BEGIN/COMMIT), rolled back together on any failure.
- **No client-controlled rank/score**: a finalize request body
  carrying a fabricated `{ranked: [...], placement: 99}` payload is
  completely ignored — the persisted `placement` and `aggregate_score`
  are the real server-computed values (1 and 80.00), not the injected
  99/1.
- **Immutable once finalized**: `handleGetCompetitionResults()`
  returns the real finalized record to every caller (including admins)
  once one exists — never a freshly recomputed live view (this closed
  a real defect, SC-D061, found via the browser test's own reload
  assertion).

See `01-results-api-results.json` sections 1, 4, 10, 11 and
`02-results-browser-results.json` for the live browser confirmation.
