# 06 — Shared Architecture

One shared server service — `server/services/smokecraft/selectionClassificationService.js` — covers all four interaction types via a single `SESSION_DEFS` dispatch table (one entry per session: `activityType`, `draftAllowedFields`, `validateDraft`, `validateSubmission`, `evaluate`), not four separate progression systems:

- **One shared evidence ledger**: `smokecraft_activity_attempts`, reusing the exact table/pattern Package A/B already established (one `activity_type` per interaction shape: `selection_image`, `sequence`, `match`, `hotspot`).
- **One shared draft adapter**: the existing `smokecraft_tasting_drafts` table/routes, dispatched via `validateSelectionDraftPayload(activityKey, draftData)` — reused, not duplicated.
- **One shared completion gate**: `hasSelectionEvidence(guestReference, sessionId)`, called once from `completeSession()`, covering all 4 sessions with one function.
- **One shared idempotency mechanism**: the same `idempotency_key` + unique-constraint pattern already used everywhere else in this app.
- **One shared feedback contract**: every `submitSelectionAttempt` response is `{ success, correct, alreadyRecorded }` — identical shape regardless of interaction type, so the 4 client components all consume it the same way.
- **One shared attempt-history mechanism**: `recordAttemptAudit()` writes every attempt (correct or not) to the existing `smokecraft_award_audit` table — no new table.

Type-specific logic (selection validation, sequence validation, matching validation, hotspot validation) lives in small, separate functions inside the one service file — genuinely reducing duplication without forcing all four interaction types into one oversized UI component. Each of the 4 client components keeps its own real, distinct UI (image zones / sequencing list / matching selects / hotspot buttons), matching the mandate's explicit instruction not to force identical fields across sessions with different learning objectives.
