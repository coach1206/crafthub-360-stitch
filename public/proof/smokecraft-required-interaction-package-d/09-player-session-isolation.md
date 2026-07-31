# 09 — Player and Session Isolation

**Player isolation** (via the pre-existing `requireSmokeCraftIdentity` middleware, unchanged):

- A different guest never sees another guest's Session 3 draft (API test).

**Session isolation**:

- Terroir-shaped checkpoint ids (`country`) are rejected against Meet Your Cigar's draft (`unknown_checkpoint_id`) — cross-session field/vocabulary rejection verified.

**Modified-ID bypass tests**:

| ID modified | Result |
|---|---|
| `sessionId` (unsupported session) | `unsupported_session` |
| `checkpointId` (fabricated, e.g. `binder`, `why` used as a factor, `curing`) | `unknown_checkpoint_id` |
| checkpoint response value (out of range) | `invalid_checkpoint_response` |
| synthesis value (outside the real checkpoint set) | `synthesis_required` |
| `attemptId`/`draftId` | N/A — never client-supplied; the server derives the row from `(guest_reference, activity_type, activity_key)` alone |
| direct API completion bypass (`allVisited`/`completed`/`passed`/`xpEarned`) | ignored entirely — completion still requires real evidence |
