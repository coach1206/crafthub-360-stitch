# Phase 6C — Client Sync Queue Manual Verification

No jest/vitest/DOM-test runner exists in this repo (confirmed in Phase 6B's
report; still true this phase — no new test framework was added), and the
sync queue is IndexedDB-backed (browser-only API), so it cannot be exercised
by a plain Node script the way Phase 6B's backend script could. This is a
documented manual test, run in a real browser session against the running
app, mirroring Phase 6B's "runnable verification, not a unit-test suite"
precedent.

## Setup

1. `node server/index.js` (backend, port 3001) — no `DATABASE_URL` set, so
   the backend runs in genuine degraded mode, same as Phase 6B's verification.
2. `npm run dev` (frontend, port 5000), open the app in a browser.
3. Open DevTools → Application → IndexedDB → `novee_sync_queue` → `events`
   to inspect queue records directly.

## Test 1 — Event saves locally while backend is down

1. With the backend NOT running (or `DATABASE_URL` unset so it's degraded),
   create a POS3 ticket (Founder/Staff POS3 screen → New Ticket) or complete
   a SmokeCraft session.
2. In DevTools → IndexedDB → `events`, confirm a new record exists with
   `syncStatus: 'pending'`, the correct `sourceSystem`/`eventType`, and a
   real `sourceDeviceId` (matches `localStorage.novee_device_id`).
3. Confirm the existing UI flow (ticket created, SmokeCraft completion
   screen, etc.) behaved exactly as before — no visible change, no error.

## Test 2 — Event remains pending

1. Reload the page (app load triggers `initSyncQueueRetryTriggers()` →
   `retryPendingEvents()`).
2. With the backend still down/degraded, confirm the record's `syncStatus`
   is still `pending` (or `failed` only after `MAX_RETRIES = 8` attempts),
   `retryCount` has incremented, and `lastError` is populated with a
   non-fake message (e.g. "No response from backend" or the backend's
   explicit degraded-mode message).
3. Confirm the UI never shows a "synced" indicator anywhere for this event.

## Test 3 — Event retries when backend returns

1. Start the backend (`node server/index.js`) with `DATABASE_URL` pointed at
   a real Postgres instance with migration `012_internal_sync_engine.sql`
   applied.
2. Trigger a retry by reloading the page or toggling DevTools' Network
   throttling to "Offline" then back to "Online" (fires the `online` event).
3. Confirm the record's `syncStatus` transitions to `synced` only after the
   backend's `/api/sync/events` response shows `results[].success: true`
   and no `degraded` flag for that `eventId` — verify via Network tab.

## Test 4 — Duplicate eventId does not duplicate backend records

1. Manually call `postSyncEvents([sameRecordTwice])` (or simply let the
   retry loop re-submit a record that is still `pending` due to a slow
   network) against a live, migrated database.
2. Query `SELECT count(*) FROM sync_events WHERE event_id = '<id>'` — must
   be exactly 1, regardless of how many times the client retried, because
   the backend's `recordEvent()` SELECT-then-INSERT-ON-CONFLICT path
   (Phase 6B, Section E) is idempotent on `event_id`.

## Test 5 — Build

`npm run build` — must pass cleanly (verified this phase, see report
Section H).
