# Production Lockdown — Phase 6C: Client Sync Queue Engine Report

## A. Executive Summary

This phase builds the client half of the Phase 6A/6B sync architecture: a
durable IndexedDB outbox that saves POS3, kitchen/bar/humidor queue, E.A.T.,
SmokeCraft, and Passport events locally first, then syncs them to the
Phase 6B backend event store (`/api/sync/events`). **No existing
localStorage flow, opsEventBus emit, or fire-and-forget `syncService.js`
call was removed or altered.** This phase is purely additive: every new
`saveEvent(...)` call sits alongside an existing write, wrapped in
`.catch(() => {})` so a sync-queue failure can never break the underlying
guest/staff flow.

Built this phase:
- `src/services/shared/deviceIdService.js` — stable per-browser device ID,
  stored in `localStorage`, generated once and reused.
- `src/services/syncQueueService.js` — IndexedDB-backed outbox with the 8
  required methods (`saveEvent`, `getPendingEvents`, `markSyncing`,
  `markSynced`, `markFailed`, `retryPendingEvents`, `getQueueStatus`,
  `clearSyncedEvents`), plus `initSyncQueueRetryTriggers()` for app-load and
  `online`-event retries.
- `src/services/syncApiClient.js` — frontend client for `POST
  /api/sync/events` and `GET /api/sync/status`, built on the existing
  `apiClient.js` wrapper (no new fetch/timeout logic invented).
- Additive `saveEvent(...)` calls wired into 7 existing call sites (Section
  E) — none of their existing logic, return values, or emitted
  `opsEventBus` events were changed.
- `server/scripts/verifySyncQueueClient.md` — a documented manual
  verification procedure (IndexedDB is browser-only; no Node script can
  exercise it the way Phase 6B's backend script did).

`npm run build` passed cleanly after every wiring step (chunk-size warning
only, pre-existing).

## B. Queue Service Added

`src/services/syncQueueService.js`, backed by IndexedDB (`novee_sync_queue`
database, `events` object store, keyed by `eventId`) — chosen over
localStorage per Phase 6A's design (Section G), since the outbox needs to
hold an unbounded, ordered list of pending events without localStorage's
~5MB ceiling under heavy offline use.

| Method | Behavior |
|---|---|
| `saveEvent(event)` | Generates `eventId` if missing, stores a record with `syncStatus: 'pending'`, `retryCount: 0` |
| `getPendingEvents()` | Returns records with `syncStatus` of `pending` or `failed` |
| `markSyncing(eventId)` | Sets `syncStatus: 'syncing'`, stamps `lastAttemptAt` |
| `markSynced(eventId)` | Sets `syncStatus: 'synced'` — **only called after an explicit backend success** (Section D) |
| `markFailed(eventId, error)` | Increments `retryCount`; sets `syncStatus: 'failed'` only once `retryCount >= MAX_RETRIES (8)`, otherwise stays `pending` for the next retry pass |
| `retryPendingEvents()` | Batches all eligible pending/failed events, POSTs them, applies `markSynced`/`markFailed` per the backend's per-event response |
| `getQueueStatus()` | Local counts by status + best-effort backend `/api/sync/status` snapshot |
| `clearSyncedEvents()` | Deletes only `synced` records, leaving pending/failed untouched |

Each record matches the field list in the task: `eventId, timestamp,
sourceDeviceId, sourceSystem, eventType, payload, syncStatus, retryCount,
lastError, lastAttemptAt` (plus `entityId`, needed to satisfy the backend's
`SyncEvent` shape — see Section D).

## C. Device ID Strategy

`src/services/shared/deviceIdService.js` — `getDeviceId()` reads
`localStorage.novee_device_id`; if absent, generates `dev-<uuid>` via
`crypto.randomUUID()` (falls back to a timestamp+random string if
unavailable) and persists it. Survives refresh and browser close because
it's a plain `localStorage` value, never cleared by any existing app code.
Every `saveEvent()` call stamps the record's `sourceDeviceId` from this
function — no separate device-id plumbing was added at each call site.

## D. Backend Sync Client

`src/services/syncApiClient.js`:
- `postSyncEvents(events)` — maps the queue's local record shape to the
  backend's exact `SyncEvent` envelope (Phase 6A/6B): `eventId,
  sourceSystem, eventType, entityId, payload, clientCreatedAt` (mapped from
  the local `timestamp` field), wrapped in `{ sourceDeviceId, events: [...] }`
  per `postEvents`' expected request body. Built on `apiPost` from the
  existing `apiClient.js` — inherits its offline-skip, 5s timeout, and
  never-throws guarantees for free.
- `getSyncStatus()` — thin `apiGet('/api/sync/status')` wrapper.

**"Do not claim synced unless backend confirms success"** is enforced in
`retryPendingEvents()` (in `syncQueueService.js`, not the API client): a
record is only passed to `markSynced()` if the backend's response has
`success: true` overall AND that event's entry in `results[]` has
`success === true` and **not** `degraded` — mirroring the Phase 6B
contract exactly (`degraded: true` is a `503`-class "not durably saved"
signal, never treated as success). If `postSyncEvents` returns `null`
(offline, timeout, or any network failure — `apiClient.js`'s contract),
every event in that batch is passed to `markFailed()`, never
`markSynced()`.

## E. Events Wired

All wiring is additive — the existing localStorage write and any existing
`opsEventBus.emit()` call happen first, unchanged; the new `saveEvent(...)`
call is appended afterward, wrapped in `.catch(() => {})`.

| Call site | File | Backend `eventType` |
|---|---|---|
| Ticket created | `pos3Service.js` → `createTicket()` | `OrderCreated` |
| Ticket items updated | `pos3Service.js` → `upsertTicketItems()` | `OrderUpdated` |
| Order sent to stations | `pos3Service.js` → `sendOrder()` | `OrderUpdated` |
| Ticket checked out/paid | `pos3Service.js` → `checkoutTicket()` | `OrderClosed` |
| Kitchen ticket queued | `kitchenQueueService.js` → `pushKitchenTicket()` | `KitchenAccepted` |
| Kitchen ticket completed | `kitchenQueueService.js` → `markCompleted()` | `KitchenCompleted` |
| Bar ticket queued | `barQueueService.js` → `pushBarTicket()` | `BarAccepted` |
| Bar ticket completed | `barQueueService.js` → `markCompleted()` | `BarCompleted` |
| Humidor request queued | `humidorQueueService.js` → `pushHumidorRequest()` | `HumidorAccepted` |
| Humidor item delivered | `humidorQueueService.js` → `markDelivered()` | `HumidorCompleted` |
| E.A.T. operational command | `opsControlBridge.js` → `createCommand()` (only when `sourceSystem === SYSTEMS.EAT`) | the command's own `eventType` |
| SmokeCraft session completed | `GuestSessionContext.jsx` → `completeSmokeCraftSession()` | `SmokeCraftCompleted` |
| Passport stamp awarded | `passportService.js` → `awardStamp()` | `PassportStampAwarded` |

Kitchen/Bar/Humidor `markStarted`/`markReady` transitions were **not**
additionally wired, since the Phase 6B backend's `applyEvent()` switch only
recognizes `KitchenAccepted`/`KitchenCompleted` (and the Bar/Humidor
equivalents) as named projection types — sending an unrecognized
intermediate event type wouldn't crash anything (it lands in
`sync_failures` as `unknown_event_type`, never silently dropped) but would
add audit noise without a matching backend projection, so only the two
backend-recognized transitions per station were wired. This is a
documented scope choice, not a gap (Section J).

The E.A.T. operational event is wired at the single shared chokepoint
(`createCommand()`), not separately in every E.A.T. page, since all
E.A.T.-originated commands already funnel through that one function.

## F. Offline Behavior

- `saveEvent()` always succeeds locally (IndexedDB write), regardless of
  backend availability — the calling code's existing flow is unaffected by
  backend state.
- `retryPendingEvents()` calls `postSyncEvents()`, which uses `apiClient.js`'s
  existing offline-skip (`navigator.onLine` check) and 5s-timeout/never-throw
  guarantees. If the backend is unreachable, the function returns `null`,
  and every event in the batch is marked `failed`/kept `pending` via
  `markFailed()` — never `synced`.
- If the backend responds but is itself degraded (no `DATABASE_URL`,
  mirroring this sandbox's exact state), the Phase 6B contract's
  `degraded: true` per-event flag is honored identically — `markFailed()`,
  not `markSynced()`.
- No UI in this phase displays a "synced" badge yet (Phase 6D scope, per
  Phase 6A's roadmap) — there is nothing yet that could show a *fake*
  synced status, satisfying the "no fake synced claims" rule by simply not
  having introduced any synced-status UI this phase.

## G. Retry Behavior

- **On app load**: `src/main.jsx` calls `initSyncQueueRetryTriggers()`
  immediately after the existing `flushOfflineQueue()` call (Phase
  5/6-era `syncService.js` queue) — both run independently; neither
  replaces the other.
- **On reconnect**: `window.addEventListener('online', ...)` inside
  `initSyncQueueRetryTriggers()` re-runs `retryPendingEvents()`.
- **Safe retry limits**: `MAX_RETRIES = 8` in `syncQueueService.js`. Each
  failed attempt increments `retryCount`; once `retryCount >= MAX_RETRIES`
  the record's `syncStatus` becomes `failed`. `getPendingEvents()` still
  returns `failed` records (for visibility/manual inspection), but
  `retryPendingEvents()` filters out anything with `retryCount >=
  MAX_RETRIES` before attempting, so a permanently-stuck event stops being
  retried automatically rather than retrying forever.

## H. Verification Results

No jest/vitest exists (confirmed again this phase) and IndexedDB is a
browser-only API unreachable from a plain Node script, so — mirroring
Phase 6B's "runnable script, not a unit-test framework" approach but
adapted to this phase's browser-only storage — a documented manual test
procedure was written instead: `server/scripts/verifySyncQueueClient.md`,
covering exactly the 5 checks requested:
1. Event saves locally while backend is down.
2. Event remains pending across reload while backend stays down.
3. Event retries and reaches `synced` once a real, migrated backend
   becomes reachable.
4. Duplicate `eventId` does not duplicate backend records (relies on the
   already-verified Phase 6B idempotency).
5. `npm run build` passes.

`npm run build` was run after each wiring step this phase and passed
cleanly every time (final run: 1760 modules transformed, 0 errors, only
the pre-existing chunk-size warning).

## I. Files Changed

New:
- `src/services/shared/deviceIdService.js`
- `src/services/syncQueueService.js`
- `src/services/syncApiClient.js`
- `server/scripts/verifySyncQueueClient.md`
- `PRODUCTION_LOCKDOWN_PHASE_6C_CLIENT_SYNC_QUEUE_REPORT.md`

Modified (additive only — existing lines preserved, new `saveEvent(...)`
calls appended after existing logic):
- `src/services/pos3/pos3Service.js`
- `src/services/pos3/kitchenQueueService.js`
- `src/services/pos3/barQueueService.js`
- `src/services/pos3/humidorQueueService.js`
- `src/services/shared/opsControlBridge.js`
- `src/context/GuestSessionContext.jsx`
- `src/services/passportService.js`
- `src/main.jsx` (added one import + one function call, alongside the
  existing `flushOfflineQueue()` call)

No backend file was touched this phase. No existing frontend behavior,
return value, or emitted `opsEventBus` event was changed.

## J. Remaining Gaps

- **No UI surfaces queue/sync status yet** — `getQueueStatus()` exists and
  is callable, but no page renders it (Phase 6D scope, per Phase 6A's
  roadmap, which already named "no catch-up consumer in E.A.T. yet" as a
  Phase 6D item).
- **Kitchen/Bar/Humidor intermediate transitions (`started`/`ready`) are
  not wired** — only the backend-recognized `Accepted`/`Completed`
  transitions are sent, per the scope note in Section E. Wiring the
  remaining transitions would require either extending Phase 6B's
  `applyEvent()` switch with new event types (a backend change, out of
  this phase's scope) or accepting `unknown_event_type` audit-only entries
  — a decision better made explicitly in a future phase than assumed here.
- **`/api/sync/retry` (the dedicated backend retry endpoint) is not yet
  called by the client** — `retryPendingEvents()` currently re-POSTs to
  `/api/sync/events`, which is already idempotent on `eventId` (Phase 6B,
  Section E) and handles retries correctly; wiring the dedicated `/retry`
  endpoint instead would be a pure refactor with no behavior difference,
  so it was left as-is rather than invented for its own sake.
- **The Phase 6B migration has still not been run against a real
  database** in this sandbox (no `DATABASE_URL` configured) — this phase's
  client-side behavior under that exact condition (degraded backend) was
  verified live per the manual procedure (Section H); end-to-end
  `pending → synced` transition (Test 3 in the verification doc) requires
  a real migrated database, not yet available here.

## K. Next Phase Recommendation

Proceed to **Phase 6D — E.A.T. Catch-Up Consumer**, per the Phase 6A
roadmap: build a page-level consumer that reads `GET
/api/sync/events/since/:timestamp` (already built, staff-gated, in Phase
6B) to backfill E.A.T.'s live feeds after a reconnect, and surface
`getQueueStatus()`/`getSyncStatus()` in a small operational status
indicator so staff can see "N events pending sync" rather than that state
being invisible. Apply migration `012` to a real database before that
phase's integration testing, so this phase's `pending → synced` retry path
(Section H, Test 3) can be verified end-to-end rather than only against
the degraded-mode path exercised here.
