# 06 — Persistence and Idempotency

All evidence rows write to the existing `smokecraft_activity_attempts` table
(`activity_type='tasting_observation'`, `activity_key` = the session id).

- **Resume after exit/reload**: covered client-side by the pre-existing `SmokeCraftJourneyContext`
  local-draft mechanism (unchanged by this pass) — verified live in the browser test ("Genuine
  reload preserves the in-progress selection").
- **Duplicate evidence submission**: a second submission for the same `(guest_reference,
  activity_type, activity_key)` returns the original row (`alreadyRecorded: true`, HTTP 200), not
  a new insert — verified in API test section 6.
- **Concurrent evidence submission**: 3 simultaneous requests sharing one idempotency key all
  resolve successfully with exactly one underlying row — verified in API test section 10.
- **Duplicate completion**: re-calling the completion endpoint after a session is already
  complete returns `alreadyCompleted: true` (HTTP 200) with no additional XP — verified in API
  test section 6 and browser test ("duplicate click does not duplicate completion").
- **No XP ownership change**: `submitTastingObservation()` inserts with `xp_awarded=0`;
  `completeSession()` remains the only function that grants XP, and it still derives the amount
  from `sessionRewardTable.js` by `sessionId`, never from the request body.
