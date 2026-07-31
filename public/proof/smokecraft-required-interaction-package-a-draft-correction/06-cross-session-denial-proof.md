# Cross-Session Denial Proof

Each session's draft is stored under its own row, keyed by `(guest_reference, activity_key)` in the existing `smokecraft_tasting_drafts` table — `activity_key` is `first-third`/`second-third`/`final-third`, so one session's draft can never physically overwrite another's row.

Two additional layers verified live (`verify-smokecraft-package-a-draft-correction-api.mjs`, section 5):

1. Saving a Session 12 draft leaves Session 8's own draft completely unchanged (read back identical to before).
2. Server-side vocabulary is enforced per `activityKey`, not just globally — submitting Session 8's observation ids (`'Aroma Opening'`) against Session 12's draft is rejected with `invalid_observation_id`, the same enforcement already applied to real evidence submission.
