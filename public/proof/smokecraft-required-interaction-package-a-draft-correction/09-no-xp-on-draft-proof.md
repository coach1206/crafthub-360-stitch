# No-XP-on-Draft Proof

`saveTastingDraft()` never touches XP, badges, rank, or completion records — it only reads/writes `smokecraft_tasting_drafts`, a table with no connection to the reward system. XP remains solely owned by `completeSession()`, which independently looks up the award amount from `sessionRewardTable.js` by `sessionId`.

Verified live (`verify-smokecraft-package-a-draft-correction-api.mjs`, section 8): a guest's `xpTotal` is read, two draft saves are performed (including a partial/reduced-selection update), and `xpTotal` is read again — unchanged. No completion record for the session appears in `completedSessions` from the draft saves alone.
