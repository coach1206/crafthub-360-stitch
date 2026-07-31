# Stale-Write Rejection Proof

Two distinct forms of stale write are both rejected, never silently applied:

1. **Stale version** (a save whose `expectedVersion` is behind the server's current version): `409 stale_version`, returning the server's real current draft. Verified in `verify-smokecraft-package-a-draft-correction-api.mjs` section 6.
2. **Stale write after completion** (a draft save attempted once the session is already completed): `saveTastingDraft()` now checks `hasTastingObservationEvidence(guestReference, activityKey)` — scoped only to Sessions 8/12/16 — before accepting the write, returning `409 already_completed` if evidence/completion already exists. Verified in `verify-smokecraft-package-a-draft-correction-api.mjs` section 7 (API) and `verify-smokecraft-package-a-draft-correction-browser.mjs` (browser, a real fetch call attempted after real completion).

## A real bug found and fixed during this verification

The client's `saveTastingDraftOnServer()` originally treated *any* `409` response as a version conflict and unconditionally read `data.current.draftData` — but the `already_completed` response has no `current` field, so this crashed with `TypeError: Cannot read properties of undefined (reading 'draftData')` the moment a stale draft write landed after completion (caught live by the pre-existing Package A browser suite's console-error check). Fixed by having the client distinguish `data.error === 'already_completed'` from a real version conflict, and having each session component stop further autosave attempts (a new `draftLocked` flag, deliberately kept separate from the `done`/Continue-button state so revisiting a completed session never leaves the Continue button stuck showing "Saving…").
