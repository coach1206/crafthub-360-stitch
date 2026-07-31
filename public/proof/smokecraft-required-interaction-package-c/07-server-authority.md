# 07 — Server Authority

The server owns, for all 4 sessions:

- **Allowed options / correct answers / expected order / matching map / hotspot vocabulary**: all defined server-side only in `selectionClassificationService.js` (`HUMIDOR_OPTIONS`/`HUMIDOR_CORRECT`, `FORMAT_IDS`/`FORMAT_CORRECT_ORDER`, `CUT_ITEM_IDS`/`CUT_CATEGORY_IDS`/`CUT_CORRECT_MAP`, `FLAVOR_HOTSPOT_IDS`) — never sent to the client as an "answer key."
- **Validation**: `validateSubmission()` per session, rejecting malformed/incomplete/unknown/duplicate payloads before evaluation ever runs.
- **Evaluation**: `evaluate()` per session, computed purely server-side from the submitted payload against the server-owned answer data — verified structurally by the Package C validator (`serviceSrc.includes('evaluate(payload)') && !/correct\s*:\s*payload\.correct/`).
- **Completion**: `completeSession()` gated by `hasSelectionEvidence()`.
- **Attempt history**: `smokecraft_award_audit`, every attempt.
- **XP**: `sessionRewardTable.js`, unchanged reward amounts, looked up by `sessionId` alone.
- **Progression / reward triggers**: the existing, unchanged `completeSession()` transaction (badge grants, rank recomputation, Passport stamps where applicable).
- **Audit events**: the same `recordAudit()` path every other session mutation already uses.

Verified live: a direct API bypass attempt carrying a client-supplied `correct`/`passed`-style claim on the raw completion endpoint is still denied without real evidence (API test — cross-player/bypass denial group for each session).
