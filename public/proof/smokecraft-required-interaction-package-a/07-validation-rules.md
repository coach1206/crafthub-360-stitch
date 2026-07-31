# 07 — Validation Rules

`submitTastingObservation()` (`server/services/smokecraft/tastingObservationService.js`) enforces,
server-side, for all three sessions:

1. `sessionId` must be one of `first-third` / `second-third` / `final-third` — otherwise
   `unsupported_session`.
2. `notesSelected` must be a non-empty array — otherwise `at_least_one_observation_required`.
3. Every id in `notesSelected` (after de-duplication) must belong to that session's own server
   vocabulary — otherwise `invalid_observation_id`. Cross-session vocabulary (e.g. Session 8's ids
   submitted against Session 12 or 16) is rejected — verified in API test sections 8–9.
4. `personalNotes`, if present, must be a string ≤ 2000 characters — otherwise
   `invalid_personal_notes` / `personal_notes_too_long`.
5. A missing `idempotencyKey` is rejected by the shared `requireIdempotencyKey` middleware
   (HTTP 400) before the handler runs.

All five rules are exercised by real, failing HTTP requests in
`verify-smokecraft-required-interaction-package-a-api.mjs` (not unit-level mocks).
