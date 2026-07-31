# 07 — Player and Session Isolation Proof

**Player isolation** (enforced by the pre-existing `requireSmokeCraftIdentity` middleware and `ownerGuestReference()` scoping, unchanged by this pass):

- A different guest reads only their own empty scorecard draft, never another guest's (API test section 2).
- A different guest cannot complete Session 19 without submitting their own real evidence — attempting to piggyback on another guest's completion is denied (API test section 12).

**Session isolation**:

- Saving a `first-third` draft never creates or leaks into a `scorecard` draft for the same guest (API test section 3).
- First-third-shaped draft fields (`notesSelected`) are rejected when sent against the scorecard draft (`unknown_draft_field`) — each session's draft has its own validated field shape (API test section 3).
