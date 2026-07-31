# 05 — Shared Exploration Architecture

No new service file was created. Package D extends the exact same `server/services/smokecraft/selectionClassificationService.js` that Package C established — 3 more `SESSION_DEFS` entries, sharing 100% of the surrounding machinery:

- Same evidence ledger (`smokecraft_activity_attempts`, one new `activity_type='exploration'` value).
- Same draft table/routes (`smokecraft_tasting_drafts`, `activityKey` = sessionId).
- Same completion gate (`hasSelectionEvidence()`, already generic — required zero changes to call it for the 3 new sessionIds).
- Same idempotency/concurrency guarantees (unique constraints, `409` on stale writes, `alreadyRecorded`/`alreadyCompleted` semantics).
- Same feedback contract (`{ success, correct, alreadyRecorded }`).
- One new generic helper, `validateExplorationSubmission(payload, requiredCheckpoints, { checkpointValueOk, synthesisOk })`, factors out the common "all checkpoints present + valid, plus a valid synthesis" validation shape shared by all 3 sessions — reducing duplication without forcing Sessions 3/4 (reflective judgment, no graded answer) and Session 15 (objectively graded quiz) into identical logic. Each session still owns its own `evaluate()` correctness rule.

No route or controller changes were needed — `POST /api/smokecraft/player-state/selection/:sessionId` (added in Package C) already dispatches generically by `sessionId` via `SESSION_DEFS`.
