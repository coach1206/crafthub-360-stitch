# Phase 6E — Failed Event Reconciliation & Replay Safety Manual Verification

No jest/vitest exists in this repo (confirmed again this phase). This is a
manual browser test against the running app, mirroring Phase 6B/6C/6D's
precedent.

## Setup

1. `node server/index.js` (backend, port 3001).
2. `npm run dev` (frontend, port 5000).
3. Log in as Founder/Staff, navigate to `/eat` (E.A.T. Command Hub).
4. Scroll to "Conflict & Reconciliation Review — Staff Only" (beneath
   "Sync Status — Staff Only").

## Test 1 — Duplicate eventId

1. With a live, migrated backend, let an event sync (`syncStatus: 'synced'`).
2. Manually re-save the same `eventId` to IndexedDB (DevTools → Application
   → IndexedDB → `novee_sync_queue` → `events`) with `syncStatus: 'pending'`.
3. Click "Preview Replay" — confirm the preview marks it
   `duplicate_event_id` / `already_processed_no_action`, not a fresh replay.

## Test 2 — Duplicate business action with a different eventId

1. Create a POS3 ticket, let it sync.
2. Manually create a second IndexedDB record with a new `eventId` but the
   same `eventType: 'OrderCreated'`, `payload.ticket.id`, and `tableId` (so
   `businessActionFingerprint` matches).
3. Click "Refresh Conflicts" then "Preview Replay" — confirm the second
   record is classified `duplicate_business_action`. Since `OrderCreated`
   matches a sensitive pattern (`Order`), confirm the decision is
   `manual_review_required`, not auto-ignored.

## Test 3 — Backend unavailable replay

1. Stop the backend (or unset `DATABASE_URL`).
2. Click "Refresh Conflicts" — confirm the top badge reads "Backend
   Unavailable" (critical tone).
3. Click "Retry Safe Events" — confirm every result is `backend_unavailable`
   or `blocked`, never `replayed`.

## Test 4 — Failed local event replay (live backend)

1. With backend down, create a wired event (e.g. complete a SmokeCraft
   session) so it ends up `pending`, then exhaust retries to `failed`
   (or manually set `retryCount: 8, syncStatus: 'failed'` in DevTools for
   a quick test).
2. Start a real, migrated backend.
3. Click "Retry Safe Events" — confirm the event transitions to `replayed`
   only after the backend's per-event response shows `success: true` and
   no `degraded` flag (verify via Network tab).

## Test 5 — Blocked unsafe replay

1. Manually set an IndexedDB record's `requiresManualReview: true`.
2. Click "Retry Safe Events" — confirm that record's result is
   `requires_manual_review`, and it is never auto-replayed.

## Test 6 — Dry-run replay preview

1. Click "Preview Replay" with one or more pending/failed events present.
2. Confirm in DevTools → IndexedDB that no record's `replayStatus`/
   `syncStatus` changed as a result (preview is read-only).

## Test 7 — Manual review required

1. On any card in the Conflict & Reconciliation panel, click "Mark Manual
   Review".
2. Confirm the card's badge updates to "Needs Staff Review" and
   `requiresManualReview: true` is set in IndexedDB.

## Test 8 — Reconciliation note

1. Type a note in the note input on any card and click "Add Note".
2. Confirm the inline confirmation message appears and
   `reconciliationNote` is set in IndexedDB for that record.

## Test 9 — Safe retry

1. With a live, migrated backend and no conflicting events, click "Retry
   Safe Events".
2. Confirm events with `conflictType: 'none'` transition to `replayed` and
   `syncStatus: 'synced'` only after backend confirmation.

## Test 10 — Clear resolved conflicts

1. After Test 9, click "Clear Resolved Conflicts".
2. Confirm the panel reports the count of in-memory conflict-decision log
   entries cleared (for events no longer `pending`/`failed`) — this clears
   the session's decision log only, not IndexedDB records, and does not
   claim anything was "fixed."

## Test 11 — Kitchen intermediate transition event

1. Push a kitchen ticket, then call `markStarted(id)` then `markReady(id)`
   from the Kitchen station UI.
2. Confirm IndexedDB gets two new records: `KitchenStarted` and
   `KitchenReady`, each with `payload.transitionAction` set, alongside the
   pre-existing `KITCHEN_TICKET_STARTED`/`KITCHEN_TICKET_READY`
   `opsEventBus` emits (unchanged).

## Test 12 — Bar intermediate transition event

1. Same as Test 11 but for `barQueueService.markStarted`/`markReady` —
   confirm `BarStarted`/`BarReady` sync events are queued additively.

## Test 13 — Humidor intermediate transition event

1. Call `markPulled(id)`, `markUnavailable(id, reason)`, and
   `suggestSubstitution(id, sub)` from the Humidor station UI.
2. Confirm `HumidorPulled`, `HumidorUnavailable`, `HumidorSubstituted` sync
   events are queued additively, alongside the existing
   `HUMIDOR_ITEM_PULLED`/`HUMIDOR_ITEM_UNAVAILABLE`/
   `HUMIDOR_SUBSTITUTION_SUGGESTED` `opsEventBus` emits (unchanged).

## Test 14 — Staff-only panel visibility

1. Confirm both `SyncStatusPanel` and `SyncConflictReviewPanel` render only
   at `/eat`, gated by `requiredPermission="access_eat_command"` in
   `src/App.jsx`.

## Test 15 — Guest screens do not show conflict tools

1. `grep -rl "SyncConflictReviewPanel" src/` must show only
   `SyncConflictReviewPanel.jsx` (definition) and `EATCommandHub.jsx`
   (mount site) — no guest SmokeCraft/Passport/kiosk page imports it.

## Test 16 — No fake synced/completed/resolved claims

1. Confirm the panel's badges only ever use the allowed labels (Pending
   Locally, Failed Locally, Backend Unavailable, Replay Blocked, Manual
   Review Required, Confirmed by Backend, Already Processed, Safe
   Duplicate Ignored, Retry Safe, Duplicate Risk, Needs Staff Review) and
   that "Confirmed by Backend" only appears for `reconciliationStatus:
   'resolved_confirmed'`, which `markReconciliationResolved()` refuses to
   set without `backendConfirmed: true` or an explicit `staffReason`.

## Test 17 — Build

`npm run build` — must pass cleanly.
