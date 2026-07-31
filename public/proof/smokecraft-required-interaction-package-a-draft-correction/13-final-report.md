# 13 — Final Report

**Starting commit:** `0a875203`

## Architecture

No second tasting system, no new table. The correction reuses:

- `smokecraft_tasting_drafts` (existing table, `guest_reference` + `activity_key` unique, `draft_data JSONB`, `version`, `updated_at`) — already generic across `activityKey`, already used by Mini Tasting's own draft under `activity_key='mini-tasting'`.
- `getTastingDraft()` / `saveTastingDraft()` (existing service functions) and the existing `GET/PUT /api/smokecraft/player-state/tasting/:activityKey/draft` routes — unmodified in shape, only narrowly extended.
- The existing optimistic-concurrency pattern (`expectedVersion`, `SELECT ... FOR UPDATE`, `409 stale_version` with the server's real current state) — unchanged.
- The existing guest-identity ownership model (`requireSmokeCraftIdentity`, `ownerGuestReference()`) — unchanged; this alone is what makes cross-player denial automatic.

Two narrow additions:

1. `validateTastingDraftPayload(sessionId, draftData)` (`tastingObservationService.js`) — field-name/type/vocabulary validation, applied only when `activityKey` is one of Sessions 8/12/16. Other activity keys (e.g. `mini-tasting`) are completely unaffected.
2. A completed-state check inside `saveTastingDraft()` — scoped only to the same 3 sessions — that refuses a draft write once real completion evidence already exists, returning `409 already_completed`.

## Session results

**Session 8 draft result:** COMPLETE_AND_VERIFIED — create/read/update, reload/resume, stale-write and post-completion rejection all verified live.
**Session 12 draft result:** COMPLETE_AND_VERIFIED — same, plus cross-session vocabulary isolation from Session 8 verified.
**Session 16 draft result:** COMPLETE_AND_VERIFIED — combined focus+flavor vocabulary draft verified; a personal-notes UI was added (previously absent).

**Server persistence result:** PASS — real rows in `smokecraft_tasting_drafts`, no new table/migration.
**Reload and resume result:** PASS — leave/return and genuine hard reload both verified live in the browser.
**Player-isolation result:** PASS — a second guest reads only their own (empty) draft.
**Session-isolation result:** PASS — drafts and vocabularies are independent per session; verified both directions.
**Idempotency result:** PASS — repeated identical saves behave safely; draft rows are keyed uniquely per (guest, session).
**Concurrency result:** PASS — a genuine concurrent-save race resolves to exactly one winner and one honest 409, never silent corruption.
**Stale-write protection result:** PASS — both stale-version and post-completion stale writes are rejected server-side; the completed record itself is proven unchanged.
**XP and progression result:** PASS — XP total is unchanged by any number of draft saves; no completion record is created by a draft save alone.
**Manifest result:** unchanged from the prior Package A pass (still `COMPLETE_AND_VERIFIED` for Sessions 8/12/16) — this correction did not need to change the manifest, since it was already accurate about completion/evidence; it only closes the separately-flagged draft-persistence gap noted in the prior pass's proof doc 15.

## Two real bugs found and fixed via live testing (not assumed away)

1. **Stale-closure autosave race**: the debounced draft-autosave `useEffect` did not list `draftVersion` in its dependency array, so a timer scheduled before an explicit manual save could fire afterward with a stale captured version, producing a spurious `409` conflict. Caught by a real failing browser assertion ("Session 12/16 draft save confirms"), fixed by adding `draftVersion` to each effect's dependency array in all three session files.
2. **`already_completed` 409 mishandled as a version conflict**: the client's `saveTastingDraftOnServer()` treated every `409` as a stale-version conflict and unconditionally read `data.current.draftData` — but the `already_completed` response has no `current` field, crashing with a real `TypeError` (caught by the pre-existing Package A browser suite's console-error check). Fixed by having the client distinguish the two 409 causes, and by introducing a `draftLocked` flag (kept deliberately separate from the button-facing `done` state) so autosave stops cleanly without ever leaving the Continue button stuck on "Saving…".

## Tests and build

30/30 new draft-correction API tests, 14/14 new draft-correction browser tests, plus 5 unchanged regression suites (Package A original API/browser, manifest validator, Mini Tasting's own tasting-flow suite, gameplay/reward/humidor/golden-box suites) all passing. Full `npm run build` (including the entire prebuild validator chain) succeeded. See `11-test-results.md` and `12-build-result.md`.

## Proof path

`public/proof/smokecraft-required-interaction-package-a-draft-correction/`

## Scope discipline

Only Sessions 8, 12, and 16 were touched. Package B was not started. No new table or second tasting system was introduced.

---

SMOKECRAFT REQUIRED-INTERACTION PACKAGE A FULLY CLOSED — SERVER-SIDE DRAFT SAVE, RELOAD, AND RESUME COMPLETE
