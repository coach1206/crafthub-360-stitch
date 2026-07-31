# 03 — Server-Authority Proof

The client may submit only raw category ratings, personal notes, and session meta. The server independently:

- **Validates** every category is a real, in-vocabulary key with an integer value 1-5, and that all 6 are present at final submission (API test suite sections 4-6).
- **Evaluates** by computing the weighted overall score itself — a client-supplied `overall` field is rejected on the draft (`unknown_draft_field`, API test section 4), and the raw completion endpoint ignores any client-supplied `overall`/`passed`/`xpEarned` fields entirely, since it only ever checks for real recorded evidence (API test section 13, "Direct API bypass denial").
- **Owns completion**: `completeSession()` refuses to complete `'scorecard'` without real evidence (API test sections 5, 8, 12).
- **Owns XP**: looked up from `sessionRewardTable.js` by `sessionId` alone, unchanged from before this pass; the evidence-submission function itself awards 0 XP (API test section 15).
- **Owns attempt history/audit**: writes to the same audited `smokecraft_activity_attempts`/`smokecraft_session_completions` tables and `recordAudit()` path every other session already uses — no bypass route exists.

The old `server/routes/smokecraftScorecardRoutes.js` (unauthenticated, in-memory, `persistenceMode: 'memory_fallback'`) is no longer part of the completion authority path — `Scorecard.jsx` no longer calls it. See `scripts/validateSmokecraftPackageBScorecardAuthority.mjs` for a structural confirmation of every point above.
