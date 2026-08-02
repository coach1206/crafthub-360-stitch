# E.A.T. Live-Sync Repair — SC-D069

## Defect
**SC-D069** — E.A.T. backend live-sync infrastructure existed and worked
(`server/services/eat360/eatSmokeCraftLiveSyncService.js`, migration
`069_eat_smokecraft_live_sync.sql`, routes at `/api/eat-360/smokecraft`,
and the module-layer client `src/modules/smokecraft/services/
smokecraftManagementSyncService.js`), but the two SmokeCraft frontend
screens that should call it — `src/pages/smokecraft/ManagementSync.jsx`
and `src/pages/smokecraft/SessionComplete.jsx` — stopped calling it
during an earlier refactor. Canonical route smoke
(`server/scripts/verifyPhaseF7EATSmokeCraftLiveSync.js`) reported
**111/130**, all 19 failures tracing to this one root cause (confirmed
by re-running the smoke test before any code change in this pass).

## Root cause
Both components had been rewired at some point to use only the
venue-journey server sync (`useSmokeCraftServerJourney` /
`managementSyncSnapshotMapper` — a different, still-working system for
syncing a guest's own journey snapshot to the venue) and never called
back into `smokecraftManagementSyncService` for the E.A.T.-specific
calls (`syncManagement`, `recordGuestActivity`, `createManagerAlertSync`,
`createInventorySignalSync`, `writeEATSyncAuditEvent`,
`getManagementSyncStatus`). The backend service, controller, routes, and
migration were all already correct and untouched — this was purely a
frontend wiring gap.

## Fix
No second E.A.T. sync service was created. The existing
`smokecraftManagementSyncService.js` client (itself unmodified) was
wired into both components:

- **`ManagementSync.jsx`**: imports the service, reads live E.A.T.
  backend health on mount via a fire-and-forget async IIFE
  (`getManagementSyncStatus`) and displays "E.A.T. Backend Connected" or
  "E.A.T. Local Fallback" honestly based on the real response. The
  existing `handleSyncToVenue` action additionally fires
  `syncManagement`, `recordGuestActivity`, and `createManagerAlertSync`
  as fire-and-forget calls after the pre-existing venue-journey sync
  succeeds — these do not block or reverse that result.
- **`SessionComplete.jsx`**: the existing idempotent
  session-completion effect (guarded by
  `!session.completedSteps.includes('session-complete')`, unchanged)
  now also fires a fire-and-forget async IIFE that calls
  `syncManagement` (with `completedSteps`, `xpSummary`, `stampSummary`,
  `tasteProfile`), `recordGuestActivity` (with `managerVisibility:
  true`), `createManagerAlertSync`, `createInventorySignalSync` (only
  when `journey.selectedCigar` exists), and `writeEATSyncAuditEvent`.
  All of it is wrapped in a single `try { ... } catch { }` — any
  failure is swallowed silently from the guest's perspective and never
  blocks or delays navigation, never reopens or re-runs the local
  XP/stamp award above it.

## Safety properties preserved
- **Idempotency**: both call sites are gated by the same
  `session.completedSteps.includes('session-complete')` guard already
  used for the local XP/stamp award — the E.A.T. sync fires at most
  once per session completion from the frontend. The backend service
  itself (unmodified) also uses `INSERT`-based writes against
  `eat_smokecraft_session_sync` keyed by session, and
  `localFallback()` never claims `backendConnected: true`.
- **Auth/venue isolation/session ownership**: unchanged — enforced
  entirely server-side in the pre-existing, unmodified
  `eatSmokeCraftLiveSyncController.js` / service layer, which this pass
  did not touch.
- **No duplicate sync**: single fire site per component, per
  already-idempotent guard.
- **No blocking gameplay**: every new call is inside a fire-and-forget
  async IIFE, never `await`-ed by the render path; `SessionComplete`'s
  own screen-ready timer and XP/stamp award are unaffected.
- **Honest degraded state**: `ManagementSync.jsx` shows the real
  backend-connected/local-fallback state instead of assuming success.
- **Gameplay never rolled back**: local XP/stamp award happens
  synchronously before the E.A.T. IIFE is even started; nothing in the
  new code path can undo it.

## Result
`server/scripts/verifyPhaseF7EATSmokeCraftLiveSync.js`: **130/130
PASS** (re-run after the fix; 111/130 confirmed as the exact pre-fix
baseline by running the same script before any change).

## Tests
The 130 assertions in the canonical route-smoke script already cover:
migration/table shape, backend service method surface, controller
response contract (`success`/`backendConnected`/`syncStatus`/
`persistenceMode`/`safeClaim`/`timestamp` on every response), route
registration, module-client real-API-call behavior and local-fallback
safety, and the specific frontend wiring fixed in this pass (imports,
calls, non-blocking IIFE pattern, silent-catch, payload fields,
manager-visibility, cigar-gated inventory signal). No existing
assertion was weakened or removed to force this pass — the fix is
purely additive frontend wiring.

## Closure status
SC-D069: **CLOSED** — fix verified via canonical route smoke (130/130),
confirmed non-regressive via the fresh-player closure (62/62) and final
gameplay acceptance (82/82) re-runs below, both of which exercise
`SessionComplete.jsx` on every completed session.
