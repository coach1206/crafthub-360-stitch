# Phase 6F — Backend Reconciliation & Replay Confirmation Manual Verification

No jest/vitest exists in this repo (confirmed again this phase). This is a
manual browser + API test against the running app, mirroring Phase 6B–6E's
precedent. Requires a live, migrated Postgres database (migrations 001–013
applied) to exercise the "live backend" scenarios; degraded-mode scenarios
work with `DATABASE_URL` unset.

## Setup

1. Apply migration `server/db/migrations/013_sync_reconciliation.sql` against
   the dev database (extends `sync_events`, adds `sync_conflict_decisions`
   and `sync_reconciliation_notes`).
2. `node server/index.js` (backend, port 3001).
3. `npm run dev` (frontend, port 5000).
4. Log in as Founder/Staff, navigate to `/eat` → "Conflict & Reconciliation
   Review — Staff Only".

## Test 1 — Backend duplicate eventId detection

1. POST an event to `/api/sync/events` (Phase 6B) so it's durably saved.
2. From the Conflict panel, click "Preview Server Replay" on a local outbox
   record sharing that same `eventId`.
3. Confirm the response shows `conflictType: duplicate_event_id`,
   `decision: already_processed_no_action`, `willReplay: false`.

## Test 2 — Backend duplicate business-action (fingerprint) detection

1. Create a POS3 ticket, let it sync via `/api/sync/events`.
2. Manually create a local IndexedDB record with a new `eventId` but the same
   `eventType: 'OrderCreated'` business fields (so the client fingerprint
   matches the backend-computed one).
3. Click "Preview Server Replay" — confirm `conflictType:
   duplicate_business_action`. Since `OrderCreated` matches the sensitive
   pattern, confirm `decision: manual_review_required`, not auto-rejected.
4. Repeat with a non-sensitive eventType (e.g. a generic EAT command) and
   confirm `decision: server_rejected_duplicate` instead.

## Test 3 — Replay blocked without backend confirmation

1. Stop the backend (or unset `DATABASE_URL`).
2. Click "Request Server Replay" on any card — confirm the result status is
   `backend_unavailable`, never `replayed_confirmed`, and the local record's
   `replayStatus`/`syncStatus` are unchanged.

## Test 4 — Replay confirmed only after a real backend write

1. With a live, migrated backend, click "Request Server Replay" on a
   conflict-free event.
2. Confirm via Network tab that the response's `data.status` is
   `replayed_confirmed` and `data.confirmationId` matches a real
   `sync_events.event_id`.
3. Confirm the local IndexedDB record only then shows `replayStatus:
   'replayed'` and `syncStatus: 'synced'` — never before this response.

## Test 5 — Server-side stale/conflicting update still routes to manual review

1. Manually craft a candidate event whose `conflictType` would resolve to
   `stale_event` or default/`unknown` (e.g. POST `/api/sync/conflicts/decision`
   directly with an unrecognized `conflictType`).
2. Confirm `resolveConflict()` returns `manual_review_required` and the
   `sync_conflict_decisions` row is `requires_manual_review: true`.

## Test 6 — Conflict decision submission (staff override)

1. Click "Submit Conflict Decision" on a card.
2. Confirm a new row appears in `sync_conflict_decisions` with all required
   fields (`decision_id, event_id, event_type,
   business_action_fingerprint, conflict_type, decision, reason, created_at,
   decided_by, source, requires_manual_review, safe_to_auto_resolve`).
3. Confirm the corresponding `sync_events` row's `conflict_type` /
   `conflict_decision` / `requires_manual_review` columns are updated.

## Test 7 — Reconciliation note durability

1. Type a note and click "Submit Reconciliation Note".
2. Confirm a row is inserted into `sync_reconciliation_notes` and the
   "Note confirmed by backend" message appears.
3. Confirm `sync_events.reconciliation_note` is updated for that event.
4. Stop the backend and repeat — confirm the panel reports "Note saved
   locally only — backend unavailable" instead of a false confirmation.

## Test 8 — Resolve With Reason requires a real reason

1. Click "Resolve With Reason" with an empty note field — confirm the panel
   reports "Enter a reason..." and no backend call is made.
2. Fill in a reason and click again — confirm `sync_events.
   reconciliation_status` becomes `resolved_confirmed`,
   `reconciliation_resolved_by` is set, and `requires_manual_review` is
   cleared, only after the backend response confirms success.
3. Stop the backend and retry — confirm "Resolution not confirmed —
   Backend unavailable..." is shown, and no local "resolved" claim is made.

## Test 9 — GET /api/sync/events/:eventId

`curl` (as staff, with the auth cookie) a known `eventId` — confirm the full
event record (including all Phase 6F truth fields) comes back; an unknown
`eventId` returns 404 with `success: false`.

## Test 10 — GET /api/sync/events/fingerprint/:fingerprint

Compute a fingerprint for a known event client-side (DevTools console:
`createBusinessActionFingerprint(event)`), then `curl` it against
`/api/sync/events/fingerprint/:fingerprint` — confirm the same event is
returned, including for events recorded before migration 013 (the on-the-fly
fallback fingerprint computation in `getEventByFingerprint`).

## Test 11 — GET /api/sync/conflicts and /api/sync/reconciliation/summary

`curl` both routes as staff — confirm shapes match
`{success, mode, degraded, message, data}` and that
`requiresManualReview=true` query filtering works on `/conflicts`.

## Test 12 — Frontend prefers backend truth

1. With a live backend, click "Refresh Conflicts" — confirm the new "Server
   reconciliation: N need staff review server-side..." line appears, sourced
   from `getBackendReconciliationSummary()`, not just the local IndexedDB
   summary.
2. Stop the backend — confirm that line disappears (backend unreachable) and
   only the local Phase 6E summary remains, with no fabricated backend
   numbers shown.

## Test 13 — Staff/admin-only route protection

1. `curl` any `/api/sync/reconciliation/*` or `/api/sync/conflicts*` route
   without auth — confirm 401.
2. `curl` with a guest-role session — confirm 403 (via `requireStaff`).

## Test 14 — Staff-only panel visibility, unchanged

1. Confirm `grep -rl "SyncConflictReviewPanel" src/` shows only the
   component file and `EATCommandHub.jsx`.
2. Confirm `requiredPermission="access_eat_command"` still gates both `/eat`
   routes in `src/App.jsx`.

## Test 15 — No fake synced/recovered/resolved language without confirmation

1. Confirm "Confirmed by Backend" only ever renders after a `success: true`
   backend response in `handleSubmitConflictDecision`/
   `handleSubmitNoteToBackend`/`handleResolveWithReason`.
2. Confirm no button or label claims "Synced"/"Recovered"/"Processed"/
   "Fixed" anywhere in `SyncConflictReviewPanel.jsx`.

## Test 16 — Build and existing-behavior regression

1. `npm run build` — must pass cleanly.
2. Confirm `opsSet`/`opsGet`/`emit(` call counts are unchanged in
   `kitchenQueueService.js`/`barQueueService.js`/`humidorQueueService.js`
   (Phase 6F touches none of them).
3. Confirm `server/routes/syncRoutes.js` and `server/controllers/
   syncController.js` are byte-for-byte unchanged from Phase 6B/6C.
