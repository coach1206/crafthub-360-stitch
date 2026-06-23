# Production Lockdown — Phase 6F: Backend Reconciliation Endpoints + Server-Side Replay Confirmation Report

## A. Phase Summary

This phase moves reconciliation authority and replay confirmation from the
client (Phase 6E, local-only and necessarily blind to other devices) to the
backend, making the server the cross-device source of truth for duplicate
prevention, fingerprint matching, conflict decisions, replay confirmation,
and reconciliation notes. It builds entirely on top of the existing Phase 6B
`sync_events` event store and its degraded-mode honesty contract
(`DbUnavailableError` / `assertDb()` / `{dbAvailable, degraded, message}`),
extends that table additively via a new migration, and adds new sibling
tables for the append-only conflict-decision and reconciliation-note logs.
The frontend (Phase 6E) is extended, not replaced: it now prefers backend
truth when reachable and falls back to its existing local-only
classification (which already correctly blocks unsafe replay) when the
backend reconciliation endpoints are unreachable.

`npm run build` passed cleanly (1768 modules transformed, 0 errors, only the
pre-existing chunk-size warning).

## B. Files Added

- `server/db/migrations/013_sync_reconciliation.sql`
- `server/services/syncBusinessActionFingerprint.js`
- `server/services/syncReconciliationStore.js`
- `server/services/syncConflictResolutionServerService.js`
- `server/services/syncReplayServerService.js`
- `server/controllers/syncReconciliationController.js`
- `server/routes/syncReconciliationRoutes.js`
- `server/scripts/verifyPhase6F_BackendReconciliationReplayConfirmation.md`
- `PRODUCTION_LOCKDOWN_PHASE_6F_BACKEND_RECONCILIATION_REPLAY_REPORT.md`

## C. Files Modified (additive only)

- `server/index.js` — one import + one `app.use('/api/sync',
  syncReconciliationRoutes)` line appended after the existing
  `syncRoutes` mount. The existing `/api/sync` mount and all other ~30
  route mounts are unchanged.
- `src/services/syncApiClient.js` — 8 new exported functions
  (`fetchSyncEventById, fetchSyncEventByFingerprint, fetchSyncConflicts,
  postConflictDecision, previewBackendReplay, requestBackendReplay,
  postReconciliationNote, postReconciliationResolve,
  fetchBackendReconciliationSummary`) appended under a "Phase 6F additions"
  section. All existing Phase 6C/6D exports unchanged.
- `src/services/syncConflictResolutionService.js` — added
  `detectConflictWithBackend`, `classifyConflictWithBackend`,
  `submitConflictDecisionToBackend` under a "Phase 6F additions" section.
  All Phase 6E exports (`detectConflict, classifyConflict, resolveConflict,
  CONFLICT_TYPES, CONFLICT_DECISIONS`, etc.) unchanged and still used as the
  local fallback.
- `src/services/syncEventReplayService.js` — added `previewServerReplay`,
  `requestServerReplay` under a "Phase 6F additions" section. All Phase 6E
  exports (`replaySingleEvent, replayFailedEvents, previewReplay`, etc.)
  unchanged and still used as the local fallback path.
- `src/services/syncReconciliationService.js` — added
  `getBackendReconciliationSummary`, `submitReconciliationNoteToBackend`,
  `resolveReconciliationWithBackend` under a "Phase 6F additions" section.
  All Phase 6E exports unchanged.
- `src/components/staff/SyncConflictReviewPanel.jsx` — added backend-aware
  state (`backendChecks`, `backendSummary`), a server reconciliation summary
  line, and five new buttons per card (Preview Server Replay, Request Server
  Replay, Submit Conflict Decision, Submit Reconciliation Note, Resolve With
  Reason) alongside the five existing Phase 6E buttons/inputs, which remain
  unchanged and functional.

## D. Backend Schema Changes (Migration 013)

Additive only — no existing column, table, or constraint from migrations
001–012 was altered or dropped:
- `sync_events` gains 13 columns: `business_action_fingerprint,
  replay_status, replay_attempt_count, replay_last_attempt_at,
  replay_confirmed_at, conflict_type, conflict_decision,
  requires_manual_review, reconciliation_status, reconciliation_note,
  reconciliation_resolved_at, reconciliation_resolved_by,
  backend_confirmation_id` — all `ADD COLUMN IF NOT EXISTS` with safe
  defaults (`replay_status` defaults `'not_replayed'`, `conflict_type`
  defaults `'none'`, `reconciliation_status` defaults `'none'`), so existing
  rows remain valid without backfill.
- New table `sync_conflict_decisions` — append-only decision log, FK to
  `sync_events(event_id)`.
- New table `sync_reconciliation_notes` — append-only note log, FK to
  `sync_events(event_id)`.
- Three new indexes on `sync_events` (fingerprint, conflict_type,
  reconciliation_status) for the lookup patterns the new store uses.

## E. Backend Reconciliation Store Behavior

`syncReconciliationStore.js` implements all 13 required methods. Key
behaviors:
- Every read/write method calls `assertDb()` first and throws
  `DbUnavailableError` (same `code: 'DB_UNAVAILABLE'` contract as
  `syncEventService.js`) when the DB is down — no method silently returns
  fabricated data.
- `getEventByFingerprint()` first checks the stored
  `business_action_fingerprint` column, then falls back to computing the
  fingerprint on the fly (via `syncBusinessActionFingerprint.js`, a
  server-side port of the Phase 6E client fingerprint module using
  identical field semantics) for the 500 most recent rows missing a stored
  fingerprint — covering events recorded before migration 013.
- `recordConflictDecision()` inserts into `sync_conflict_decisions` (the
  durable, append-only log) and also updates the corresponding
  `sync_events` row's `conflict_type`/`conflict_decision`/
  `requires_manual_review` for fast lookups — never the other way around.
- `resolveReconciliation()` throws unless called with `staffReason` or
  `backendConfirmationId` — mirrors the Phase 6E client-side
  `markReconciliationResolved()` refusal pattern, now enforced server-side
  where it actually matters for cross-device trust.
- `replayEvent()` delegates to the exact same `recordEvent()` function used
  by normal Phase 6B sync intake — there is only one write path into
  `sync_events`, never a duplicate one for "replay."
- `getReconciliationSummary()` returns the same `{dbAvailable, degraded,
  message}` shape as `syncEventService.getSyncStatus()` when the DB is
  down.

## F. Server-Side Conflict Resolution Behavior

`syncConflictResolutionServerService.js` implements the 10 conflict types
and 10 decisions (the 8 from Phase 6E plus `server_rejected_duplicate` and
`server_confirmed_replay`):
- `detectConflict()` first checks for an exact `eventId` match
  (`duplicate_event_id`), then a fingerprint match
  (`duplicate_business_action`) — exactly the precedence Phase 6E's client
  service used, now backed by real backend lookups instead of only
  IndexedDB-local comparisons.
- `resolveDuplicateBusinessAction()` retains the sensitive-pattern check
  (`Order, Checkout, Payment, Stamp, Passport, Ticket, Humidor`) — sensitive
  matches always go to `manual_review_required`; only non-sensitive
  duplicates get the new `server_rejected_duplicate` decision (the backend
  actively rejects the replay, rather than the client merely "ignoring" it).
- `resolveConflict()` for `none` returns `server_confirmed_replay` — the
  explicit backend confirmation that Phase 6E's client could never produce
  on its own.
- Decisions are persisted via `recordConflictDecision()` →
  `syncReconciliationStore.recordConflictDecision()`, never bypassing the
  durable log.

## G. Server-Side Replay Confirmation Behavior

`syncReplayServerService.js` always calls `classifyConflict()` +
`resolveConflict()` before any write, exactly mirroring (and superseding)
the Phase 6E client contract:
- `previewReplay()` is read-only — calls `validateReplaySafety()` and
  returns the classification, never writing anything.
- `replayEventPayload()` (the actual write path) records the conflict
  decision first, then only proceeds to `recordEvent()` — the same
  idempotent Phase 6B insert-or-fetch logic — when
  `shouldReplayEvent(resolved)` is true. Every other outcome
  (`already_processed`, `duplicate_blocked`, `manual_review_required`,
  `replay_blocked`) returns without touching `sync_events` further.
- `markReplayConfirmed()` is only called after `recordEvent()` returns a
  non-duplicate result — the `confirmationId` returned to the frontend is
  the real `sync_events.event_id` from that write, not a guessed value.
- If the DB is unavailable, every entry point
  (`previewReplay`/`replayEventById`/`replayEventPayload`) returns
  `backend_unavailable` immediately, before attempting any classification
  or write.

## H. Controller & Route Behavior

All 9 routes are mounted under `/api/sync` in
`syncReconciliationRoutes.js`, gated by the existing `requireAuth +
requireStaff` middleware chain (identical pattern to
`server/routes/syncRoutes.js`'s staff-only reads) — no new auth pattern was
invented. Every controller response is shaped `{success, mode, degraded,
message, data, error}`:
- `DbUnavailableError` is caught and converted to a 503 with
  `mode: 'degraded', degraded: true` and the same honest "this was NOT
  durably saved" framing as Phase 6B's `DEGRADED_MESSAGE`.
- `getSyncEventById`/`getSyncEventByFingerprint` return 404 (not a 200 with
  null data) when no match exists, so the frontend can distinguish "no
  conflict" from "couldn't check."
- `postReconciliationResolve` returns 400 (not 500) when the store rejects
  an unconfirmed resolution attempt.

## I. Frontend Backend-Preference Behavior

The Phase 6E services are extended, not replaced:
- `syncConflictResolutionService.classifyConflictWithBackend()` queries the
  backend for an eventId/fingerprint match first; only falls back to the
  existing local-only `classifyConflict()` when the backend call returns
  null (offline) — never the reverse.
- `syncEventReplayService.requestServerReplay()` is the new
  backend-confirmed replay path; it only calls `markReplaySucceeded()`
  (which calls `syncQueueService.markSynced()`) when the backend's response
  explicitly reports `status: 'replayed_confirmed'`. Every other backend
  status leaves the local record's `syncStatus`/`replayStatus` untouched in
  its current pending/failed state — the existing Phase 6E "never guess"
  rule is preserved, now enforced against a real cross-device source of
  truth instead of only the local IndexedDB.
- `SyncConflictReviewPanel.jsx` shows backend fields (Backend match found,
  Backend replay status, Backend confirmation ID, Decision source) only
  after a real backend response — there is no placeholder/optimistic state
  that could be mistaken for a confirmed one.

## J. Staff-Only Visibility + Safe Language (unchanged guarantee)

`grep -rl "SyncConflictReviewPanel" src/` still returns only the component
file and `EATCommandHub.jsx`. `requiredPermission="access_eat_command"`
still gates both `/eat` routes in `src/App.jsx` (unchanged). All five new
backend-facing buttons only ever surface "Confirmed by Backend" after a
`response.success === true` check — "Submit Reconciliation Note" and
"Resolve With Reason" both explicitly report "saved locally only" /
"not confirmed" when the backend call fails, never silently upgrading a
local action into a backend claim.

## K. Verification Performed + Build Result

`server/scripts/verifyPhase6F_BackendReconciliationReplayConfirmation.md`
documents 16 manual/API checks: backend duplicate eventId detection,
backend duplicate fingerprint detection (sensitive vs. non-sensitive),
replay blocked without backend confirmation, replay confirmed only after a
real write, stale/unknown conflict routing to manual review, conflict
decision submission durability, reconciliation note durability (live vs.
degraded), Resolve-With-Reason's reason requirement, the two new GET lookup
routes, the conflicts/summary routes, frontend backend-preference behavior,
staff/admin-only route protection, unchanged staff-only panel visibility,
no fake-claim language, and the build.

`npm run build`: **passed cleanly** — 1768 modules transformed, 0 errors,
only the pre-existing chunk-size warning (unrelated to this phase).

Grep checks performed and passing:
- Both `/api/sync` route mounts present in `server/index.js`.
- All 9 reconciliation routes use `requireAuth, requireStaff`.
- `duplicate_event_id`/`duplicate_business_action` conflict types are
  detected server-side in `syncConflictResolutionServerService.js`.
- `syncReplayServerService.js` calls `classifyConflict`/`resolveConflict`
  before any `recordEvent` call, and `markReplayConfirmed` only follows a
  successful, non-duplicate `recordEvent()` result.
- `syncEventReplayService.js` still returns `backend_unavailable` (never
  guesses) when the backend cannot be reached.
- `SyncConflictReviewPanel` mounted only in `EATCommandHub.jsx`; no guest
  route imports it.
- No "Synced"/"Recovered"/"Processed"/"Fixed" labels anywhere in the panel.
- `server/routes/syncRoutes.js` and `server/controllers/syncController.js`
  untouched; `kitchenQueueService.js`/`barQueueService.js`/
  `humidorQueueService.js` `opsSet`/`opsGet`/`emit(` call counts unchanged.

## L. Recommended Next Phase

**Phase 6G — Audit Logs, Staff Accountability, and Event Lifecycle
Timeline.** This phase's `sync_conflict_decisions` and
`sync_reconciliation_notes` tables, plus the `decided_by`/`created_by`/
`reconciliation_resolved_by` columns added here, already capture *who*
made each reconciliation decision — but there is no unified, queryable
timeline view tying a single business action (order, ticket, stamp) to its
full lifecycle: original event → conflict detected → decision made → note
added → replay attempted → resolution confirmed, across potentially
multiple devices and staff members. Phase 6G should build a read-only audit
timeline endpoint and staff UI that joins `sync_events`,
`sync_conflict_decisions`, `sync_reconciliation_notes`, and `sync_failures`
by `event_id`/`business_action_fingerprint`, surfaces which staff member
(by `created_by_user_id`/`decided_by`/`reconciliation_resolved_by`) took
each action and when, and exposes this as an exportable accountability
record — without inventing any new write path, since every fact it needs
already exists in the tables this phase and Phase 6B created.
