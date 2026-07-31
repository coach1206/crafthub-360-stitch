# 10 — Player and Session Isolation

**Player isolation** (via the pre-existing `requireSmokeCraftIdentity` middleware + `ownerGuestReference()`, unchanged):

- A different guest never sees another guest's Session 2 draft (API test).
- A stranger cannot complete any Package C session without their own real evidence — verified for Sessions 2 and 10 directly (`selection_evidence_required` on a fresh guest with no attempt).

**Session isolation**:

- A first-third-shaped draft payload is rejected against Session 6's draft (`unknown_draft_field`) — cross-session field/vocabulary rejection verified.
- Each session's evidence and draft rows are keyed by their own `(guest_reference, activity_type/activity_key)` — physically impossible for one session to overwrite another's row.

**Modified-ID bypass tests** (per mandate §11):

| ID modified | Result |
|---|---|
| `sessionId` (unsupported session in the URL) | `unsupported_session` (400) |
| `optionId`/hotspot ID (fabricated) | `invalid_selection_id` / `invalid_hotspot_id` (400) |
| sequence item ID (fabricated) | `unknown_sequence_id` (400) |
| `categoryId` (fabricated) | `unknown_match_category` (400) |
| `attemptId`/`draftId` | N/A — these are never client-supplied; the server derives the row to act on solely from `(guest_reference, activity_type, activity_key)`, so there is no ID field a client could tamper with to target a different row |
| direct API completion bypass (fabricated `correct`/`passed` fields on the raw completion call) | ignored entirely — completion still requires real evidence (verified live) |
