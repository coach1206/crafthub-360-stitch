# Production Lockdown — Phase 6D: E.A.T. Catch-Up Consumer & Sync Status UI Report

## A. Executive Summary

This phase builds the staff-facing read/control layer on top of Phase
6B's backend event store and Phase 6C's client outbox: an E.A.T.
catch-up consumer that backfills confirmed events after a reconnect, and
a staff-only Sync Status panel embedded in the E.A.T. Command Hub. No
existing Phase 6A/6B/6C behavior was changed — this phase only adds new
files and two additive lines to `EATCommandHub.jsx`.

Built this phase:
- `src/services/eat/eatCatchUpConsumer.js` — backend-confirmed-event
  catch-up cursor, persisted in `localStorage`.
- `src/services/syncStatusService.js` — aggregates queue/backend/catch-up/
  device state into one read-only snapshot for the UI.
- `src/components/staff/SyncStatusPanel.jsx` — staff-only status panel
  with Refresh Status / Run E.A.T. Catch-Up / Retry Failed Local Events
  buttons.
- Four additive functions in `src/services/syncApiClient.js`:
  `fetchSyncStatus`, `fetchConfirmedEvents`, `fetchEventsSince`,
  `fetchDeviceSyncStatus`.
- `EATCommandHub.jsx` — one import + one `<SyncStatusPanel />` render,
  appended to the existing stacked-panels section.
- `server/scripts/verifyPhase6D_EatCatchUpAndSyncStatus.md` — manual
  verification procedure.

`npm run build` passed cleanly (1763 modules transformed, 0 errors, only
the pre-existing chunk-size warning).

## B. E.A.T. Catch-Up Consumer

`src/services/eat/eatCatchUpConsumer.js` implements the 8 required
functions: `getCatchUpState`, `setCatchUpState`, `resetCatchUpState`,
`fetchCatchUpEvents`, `processCatchUpEvents`, `processSingleCatchUpEvent`,
`markCatchUpEventProcessed`, `getCatchUpSummary`.

State is a small JSON blob in `localStorage.novee_eat_catchup_state`
(mirroring `deviceIdService.js`'s simplicity — no IndexedDB needed for a
single cursor record), with exactly the 9 fields specified:
`lastProcessedEventId, lastProcessedCreatedAt, lastSuccessfulCatchUpAt,
lastAttemptedCatchUpAt, totalProcessed, totalFailed, lastError, mode,
updatedAt`.

Modes are set honestly based on what actually happened:
- `idle` — initial/default state.
- `catching_up` — set at the start of `processCatchUpEvents()`, before the
  network call resolves.
- `caught_up` — set only after the backend responds with `success: true`.
- `degraded` — set when `fetchCatchUpEvents` returns `null` (no backend
  response at all — offline/unreachable).
- `error` — set when the backend responds but reports failure
  (`success: false` with a message).

`fetchCatchUpEvents()` always calls through to `fetchEventsSince(cursor)`
or `fetchConfirmedEvents()` in `syncApiClient.js` — it never reads
IndexedDB pending records from `syncQueueService.js`. This is the
specific guardrail requested: confirmed events are the only thing this
consumer will ever count as "caught up."

## C. Sync Status Service

`src/services/syncStatusService.js` combines:
- `getQueueSummary()` → `syncQueueService.getQueueStatus()` (Phase 6C
  local outbox counts).
- `getBackendSummary()` → `syncApiClient.fetchSyncStatus()` (Phase 6B
  venue-wide backend status).
- `getEatCatchUpSummary()` → `eatCatchUpConsumer.getCatchUpSummary()`.
- `getDeviceSyncIdentity()` → `deviceIdService.getDeviceId()`.

`getFullSyncStatus()` fetches the queue and backend summaries
concurrently (both already individually safe/never-throwing) and attaches
the synchronous catch-up/device state. `formatSyncHealthForUI()` maps the
raw snapshot to flat UI fields — it does not compute or infer any new
synced/success state of its own; every field is a direct read of
already-computed upstream data (queue counts from IndexedDB, `degraded`
flag from the backend's own response, catch-up mode from the consumer's
own state machine).

## D. Sync Status Panel (Staff-Only UI)

`src/components/staff/SyncStatusPanel.jsx` is built entirely on the
existing `src/components/eat/ui.jsx` primitives (`Card`, `KpiCard`,
`Pill`, `Btn`, `GOLD`) — no new design-system code, no raw JSON dumped to
the screen.

Displayed:
- Backend reachability badge (`Backend Reachable` / `Backend Degraded` /
  `Backend Unreachable`), tone-colored.
- Four KPI cards: Local Pending, Local Failed, Local Synced, Local Total
  — straight from the IndexedDB-backed queue counts.
- E.A.T. Catch-Up mode badge + a "Stale" flag if the last successful
  catch-up was more than 5 minutes ago.
- Device ID, last catch-up timestamp, last catch-up error (if any).

Buttons:
- **Refresh Status** → `syncStatusService.getFullSyncStatus()`.
- **Run E.A.T. Catch-Up** → `eatCatchUpConsumer.processCatchUpEvents()`.
- **Retry Failed Local Events** → `syncQueueService.retryPendingEvents()`
  (the same Phase 6C function `initSyncQueueRetryTriggers()` already
  calls on app load/reconnect — this button is a manual trigger for the
  same path, not a new retry mechanism).

Every button result is shown as an honest inline message built from the
function's actual return value (e.g. "Retry: 0 synced, 3 still pending
(of 3 attempted)") — never a generic "Success!" toast.

## E. Staff-Only Placement

`SyncStatusPanel` is rendered only inside `EATCommandHub.jsx`, at
`/eat`, which `src/App.jsx` already gates behind
`requiredPermission="access_eat_command"`. No router change, no new auth
gate, and no other page (including any guest-facing SmokeCraft/Passport
screen) imports or renders this component —
`grep -rn "SyncStatusPanel" src/` confirms a single import site.

## F. Honesty Guarantees Carried Forward

- `processCatchUpEvents()` only sets `mode: 'caught_up'` after the
  backend explicitly returns `success: true` — a `null`/failed response
  sets `degraded`/`error` instead, never `caught_up`.
- `formatSyncHealthForUI()` never fabricates a synced count; `queueSynced`
  is the literal IndexedDB count of records with `syncStatus: 'synced'`,
  which `syncQueueService.markSynced()` (Phase 6C, unchanged) only sets
  after backend confirmation.
- The "Retry Failed Local Events" button surfaces `retryPendingEvents()`'s
  real `{ synced, stillPending, attempted }` result directly — no
  optimistic UI state in between the click and the backend's actual
  response.

## G. Files Changed

New:
- `src/services/eat/eatCatchUpConsumer.js`
- `src/services/syncStatusService.js`
- `src/components/staff/SyncStatusPanel.jsx`
- `server/scripts/verifyPhase6D_EatCatchUpAndSyncStatus.md`
- `PRODUCTION_LOCKDOWN_PHASE_6D_EAT_CATCHUP_STATUS_UI_REPORT.md`

Modified (additive only):
- `src/services/syncApiClient.js` — added `fetchSyncStatus`,
  `fetchConfirmedEvents`, `fetchEventsSince`, `fetchDeviceSyncStatus`;
  `postSyncEvents`/`getSyncStatus` from Phase 6C unchanged.
- `src/pages/eat/EATCommandHub.jsx` — one import + one
  `<SyncStatusPanel />` render appended to the existing panel stack; no
  existing JSX, state, or logic altered.

## H. Catch-Up Trigger Decision

Catch-up is **not** triggered globally from `main.jsx` on every app
load. It only runs when a staff member clicks "Run E.A.T. Catch-Up" in
the already-staff-gated `/eat` context. Rationale: the backend's
`/api/sync/events/since/:timestamp` route is itself staff-gated (Phase
6B), so an unauthenticated/guest app load has no business calling it; a
manual, staff-initiated trigger inside the gated page is the narrower,
more honest scope than inventing a background polling loop this phase
didn't ask for.

## I. Verification Results

No jest/vitest exists (confirmed again). `server/scripts/
verifyPhase6D_EatCatchUpAndSyncStatus.md` documents 7 manual checks:
staff-only visibility, backend-unreachable mode, pending/failed local
events, live catch-up against a migrated backend, live retry against a
migrated backend, no-fake-synced-claims grep check, and `npm run build`.

`npm run build` passed cleanly this phase: 1763 modules transformed, 0
errors, only the pre-existing chunk-size warning (unrelated to this
phase's files).

## J. Remaining Gaps

- **End-to-end `caught_up`/`synced` transitions** (Tests 4–5 in the
  verification doc) still require a real migrated database — not
  available in this sandbox (no `DATABASE_URL`), same constraint noted in
  Phase 6C's report.
- **No automatic background catch-up polling** — by design this phase
  (Section H); a future phase could add a low-frequency interval-based
  poll while `/eat` is open, if staff want it without a manual click.
- **`SyncStatusPanel` is E.A.T.-only** — POS3's existing
  `POSSyncStatusPanel.jsx` (pre-existing, unrelated third-party POS sync
  feature) was left untouched; this phase did not add the new internal
  sync status panel to the POS3 surface, since the task scoped it to
  E.A.T.

## K. Next Phase Recommendation

Proceed to **Phase 6E — Live Reconciliation / Conflict Surfacing**: now
that staff can see pending/failed/synced counts and trigger catch-up
manually, the next gap is surfacing *what* a stuck or failed event
actually contains (entity, payload, station) for manual reconciliation,
plus extending the Phase 6B `applyEvent()` switch to recognize the
Kitchen/Bar/Humidor intermediate transitions noted as a documented scope
gap in Phase 6C's report (Section J), once a decision is made on whether
those should produce backend projections or remain audit-only.
