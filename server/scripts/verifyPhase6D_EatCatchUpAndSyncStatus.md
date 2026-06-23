# Phase 6D — E.A.T. Catch-Up Consumer & Sync Status UI Manual Verification

No jest/vitest exists in this repo (confirmed again this phase). The new
code touches IndexedDB (via syncQueueService.js, already covered by Phase
6C's verification doc) and React UI, so this is a manual browser test,
mirroring Phase 6B/6C's precedent.

## Setup

1. `node server/index.js` (backend, port 3001).
2. `npm run dev` (frontend, port 5000).
3. Log in as Founder/Staff and navigate to `/eat` (E.A.T. Command Hub).
4. Scroll to the bottom panel: "Sync Status — Staff Only".

## Test 1 — Staff-only visibility

1. Confirm the Sync Status panel appears only on `/eat` (E.A.T. Command
   Hub), which is already gated by `requiredPermission="access_eat_command"`
   in `src/App.jsx`.
2. Confirm no guest-facing route (SmokeCraft session, Passport, kiosk
   screens) renders `SyncStatusPanel` — `grep -rn "SyncStatusPanel" src/`
   shows it imported only in `EATCommandHub.jsx`.

## Test 2 — Backend unreachable (degraded/offline)

1. Stop the backend (or leave `DATABASE_URL` unset).
2. Click "Refresh Status". Confirm the badge reads "Backend Unreachable"
   (critical tone), not a fake "online"/"synced" claim.
3. Click "Run E.A.T. Catch-Up". Confirm the catch-up mode badge shows
   `degraded` or `error`, and "Last catch-up error" displays a real
   message (e.g. "No response from backend (offline or unavailable)").

## Test 3 — Pending local events / failed retry

1. With backend down, trigger any wired Phase 6C event (e.g. create a POS3
   ticket) so `syncQueueService.saveEvent()` writes a pending IndexedDB
   record.
2. Click "Refresh Status" — confirm "Local Pending" KPI reflects the new
   record.
3. Click "Retry Failed Local Events" — confirm the inline message reports
   `0 synced` and a nonzero "still pending" count, matching the still-down
   backend (no fake synced claim).

## Test 4 — E.A.T. catch-up against a live backend

1. Start the backend with a real, migrated `DATABASE_URL`
   (migration `012_internal_sync_engine.sql` applied).
2. Click "Run E.A.T. Catch-Up". Confirm the mode badge transitions to
   `caught_up`, "Last catch-up" timestamp updates, and the inline message
   reports the number of events actually returned by
   `GET /api/sync/events/since/:timestamp` (or the initial confirmed-events
   fetch if no cursor exists yet).
3. Reload the page and click "Run E.A.T. Catch-Up" again — confirm it only
   fetches events after the persisted cursor (`localStorage.novee_eat_catchup_state`),
   not the full history again.

## Test 5 — Retry succeeds against a live backend

1. With the same live backend, click "Retry Failed Local Events" on any
   still-pending records from Test 3.
2. Confirm the inline message now reports a nonzero `synced` count, and
   "Local Synced" KPI increases on the next "Refresh Status" — only after
   the backend's per-event response shows `success: true` and not
   `degraded` (verify via Network tab on `/api/sync/events`).

## Test 6 — No fake synced claims

1. Confirm `grep -n "synced" src/components/staff/SyncStatusPanel.jsx`
   shows synced counts are only ever rendered from `formatSyncHealthForUI`
   (backend/queue-derived) or `retryPendingEvents()`'s real return value —
   never a hardcoded or optimistic value.

## Test 7 — Build

`npm run build` — must pass cleanly (verified this phase: 1763 modules
transformed, 0 errors, only the pre-existing chunk-size warning).
