# Production Lockdown — Phase 6E: Failed Event Reconciliation & Replay Safety Report

## A. Phase Summary

This phase adds the safety layer staff need to recover from offline/failed
sync states without duplicating real-world business actions (orders,
kitchen/bar/humidor tickets, SmokeCraft completions, Passport stamps, E.A.T.
commands). It does not touch Phase 6C's outbox engine or Phase 6D's
catch-up/status UI — it adds new, additive services and a new staff panel
on top of them, plus closes the Kitchen/Bar/Humidor intermediate-transition
gap flagged in Phase 6C's report.

Built this phase:
- `src/services/shared/businessActionFingerprint.js` — stable, meaningful
  fingerprints per business action, used to detect duplicates even across
  different `eventId`s.
- Additive fields on new `syncQueueService.saveEvent()` records:
  `businessActionFingerprint, replayStatus, replayBlockedReason,
  conflictType, conflictDecision, requiresManualReview,
  lastReplayAttemptAt, reconciliationStatus, reconciliationNote,
  reconciliationUpdatedAt`.
- `src/services/syncConflictResolutionService.js` — classifies and decides
  what to do with a potential conflict; never marks anything synced.
- `src/services/syncEventReplayService.js` — staff-driven, conflict-aware
  replay with dry-run support; only marks `replayed` after explicit
  backend confirmation.
- `src/services/syncReconciliationService.js` — staff-facing failed/
  blocked event queue with business context (order/ticket/table/station/
  staff/guest IDs) and suggested (non-committal) actions.
- `src/components/staff/SyncConflictReviewPanel.jsx` — staff-only review
  UI, mounted in `EATCommandHub.jsx` beneath `SyncStatusPanel`.
- Additive `KitchenStarted/KitchenReady`, `BarStarted/BarReady`,
  `HumidorPulled/HumidorUnavailable/HumidorSubstituted` sync events wired
  into the existing, already-implemented `markStarted`/`markReady`/
  `markPulled`/`markUnavailable`/`suggestSubstitution` methods.

`npm run build` passed cleanly (1768 modules transformed, 0 errors, only
the pre-existing chunk-size warning).

## B. Files Added

- `src/services/shared/businessActionFingerprint.js`
- `src/services/syncConflictResolutionService.js`
- `src/services/syncEventReplayService.js`
- `src/services/syncReconciliationService.js`
- `src/components/staff/SyncConflictReviewPanel.jsx`
- `server/scripts/verifyPhase6E_FailedEventReconciliationReplaySafety.md`
- `PRODUCTION_LOCKDOWN_PHASE_6E_RECONCILIATION_REPLAY_SAFETY_REPORT.md`

## C. Files Modified (additive only)

- `src/services/syncQueueService.js` — `saveEvent()` now also writes the 10
  Phase 6E fields and computes `businessActionFingerprint`; exported
  `patchEvent`, added `getEventById`/`getFailedEvents`. All Phase 6C
  exports, IndexedDB schema, and required fields are unchanged — existing
  records without the new fields still work (reads use `||`/optional
  defaults, never assume presence).
- `src/services/pos3/kitchenQueueService.js` — `markStarted`/`markReady`
  now also call `saveEvent()` with `KitchenStarted`/`KitchenReady`. Existing
  `opsEventBus.emit()` and `localStorage` (`opsSet`) calls unchanged.
- `src/services/pos3/barQueueService.js` — same pattern for
  `BarStarted`/`BarReady`.
- `src/services/pos3/humidorQueueService.js` — `markPulled`/
  `markUnavailable`/`suggestSubstitution` now also call `saveEvent()` with
  `HumidorPulled`/`HumidorUnavailable`/`HumidorSubstituted`.
- `src/pages/eat/EATCommandHub.jsx` — one import + one
  `<SyncConflictReviewPanel />` render appended after `<SyncStatusPanel />`.

## D. Business Fingerprint Rules

`createBusinessActionFingerprint()` builds a `key=value|key=value...`
string from a fixed, per-`eventType` field list (`getFingerprintFields()`),
normalized via `normalizeFingerprintValue()` (trim + lowercase). Covered
event types: `OrderCreated`, `OrderUpdated`, `ORDER_SENT`, `OrderClosed`,
`Kitchen*`, `Bar*`, `Humidor*`, E.A.T. commands (`CONTROL_COMMAND` and any
`sourceSystem: 'EAT'` event carrying a command shape), `SmokeCraftCompleted`,
`PassportStampAwarded`.

Rules enforced:
- No random/generated IDs unless they are the actual business ID (e.g.
  `orderId`/`ticketId`/`stampId`, never `eventId`).
- No `retryCount`.
- No raw timestamps — the only timestamp-derived field
  (`createdAtBucket` on `OrderCreated`) is minute-bucketed, and only used
  as a tertiary disambiguator alongside `orderId`/`tableId`.
- Returns `null` (via `createFallbackFingerprint`, itself returning `null`
  if `entityId` is also missing) when no meaningful fingerprint can be
  built, rather than fabricating one — `classifyConflict()` then routes
  these to `missing_fingerprint` → `manual_review_required`.

## E. Conflict Resolution Behavior

`syncConflictResolutionService.js` implements the 10 required conflict
types and 8 required decisions. Key behaviors:
- `detectConflict`/`classifyConflict` default to `backend_missing` whenever
  `context.backendReachable === false` — never guesses a resolution
  without backend confirmation.
- `resolveDuplicateBusinessAction` checks `isSensitiveEvent()` (matches
  `Order`, `Checkout`, `Payment`, `Stamp`, `Passport`, `Ticket`, `Humidor`
  in the eventType) — sensitive matches always go to
  `manual_review_required`; only non-sensitive duplicates can be
  `ignored_safe_duplicate`.
- `resolveConflict()` for `backend_missing` returns
  `backend_unavailable_blocked` — replay is blocked, not guessed.
- Every decision is recorded via `recordConflictDecision()` with all 10
  required fields (`decisionId, eventId, eventType,
  businessActionFingerprint, conflictType, decision, reason, createdAt,
  source, requiresManualReview, safeToAutoResolve`), kept in an in-memory,
  session-scoped log (capped at 500 entries) surfaced by
  `getConflictSummary()`.
- This service never calls `syncQueueService.markSynced()` — it only
  classifies and records decisions.

## F. Replay Safety Behavior

`syncEventReplayService.js` always calls
`syncConflictResolutionService.classifyConflict()` +
`resolveConflict()` (via `validateReplaySafety()`) before any network
call. Behavior:
- If backend status is unreachable, every event in the batch returns
  `backend_unavailable` and is marked blocked — never attempted.
- `already_processed_no_action` decisions are marked `skipped`, not
  replayed (nothing to send).
- `manual_review_required` decisions are marked `requires_manual_review`
  and never sent to the backend.
- Only events that pass `shouldReplayEvent()` reach
  `postSyncEvents([event])`; `markReplaySucceeded()` (which calls
  `syncQueueService.markSynced()`) is only reached after the backend's
  per-event response shows `success === true` and not `degraded` — the
  same Phase 6B/6C confirmation contract.
- `dryRun: true` short-circuits before any backend call or IndexedDB
  write for events that would otherwise replay, fulfilling the "Preview
  Replay" requirement with zero side effects.

## G. Reconciliation Queue Behavior

`syncReconciliationService.js` surfaces failed/blocked/manual-review
events with `orderId, ticketId, tableId, station, staffId,
guestOrUserId, entityType, entityId, lastAttemptAt, retryCount,
errorMessage, suggestedAction, requiresManualReview,
reconciliationStatus, reconciliationNote, conflictType, replayStatus` —
extracted from each event's own `payload` (no fabricated lookups).
`classifyFailedEvent()` buckets into the 8 allowed reconciliation
statuses. `markReconciliationResolved()` throws unless the caller passes
`backendConfirmed: true` or an explicit `staffReason` — it cannot be
called from the UI in a way that silently fabricates a resolved state.

## H. Kitchen/Bar/Humidor Transition Coverage

Only transitions with an existing service method were wired — no method
was invented:

| Station | Existing method | New sync event |
|---|---|---|
| Kitchen | `markStarted` | `KitchenStarted` |
| Kitchen | `markReady` | `KitchenReady` |
| Bar | `markStarted` | `BarStarted` |
| Bar | `markReady` | `BarReady` |
| Humidor | `markPulled` | `HumidorPulled` |
| Humidor | `markUnavailable` | `HumidorUnavailable` |
| Humidor | `suggestSubstitution` | `HumidorSubstituted` |

`markCompleted`/`markDelivered` (Kitchen/Bar/Humidor) already had sync
events from Phase 6C and are unchanged. Transitions named in the task
that do **not** exist anywhere in `kitchenQueueService.js`/
`barQueueService.js`/`humidorQueueService.js` — `paused`, `resumed`,
`delayed`, `rerouted`, `priority changed`, `item prepared`, `partially
completed`, `cancelled`, `cigar staged`, `cigar cut/prepped` — were **not**
wired, since no corresponding method exists to attach a sync call to; per
the task's explicit instruction not to invent fake service methods. This
is a documented scope boundary, not an oversight: if a future phase adds
those station actions, the same `saveEvent()` pattern used here should be
applied to them at that time.

## I. Staff-Only Visibility + Safe Language

`SyncConflictReviewPanel` is mounted only in `EATCommandHub.jsx`
(`grep -rl "SyncConflictReviewPanel" src/` returns only the component file
and the hub) which remains gated by
`requiredPermission="access_eat_command"` in `src/App.jsx`
(`grep -n "requiredPermission=\"access_eat_command\"" src/App.jsx` still
shows both the `/eat` and `/eat-legacy` gates, unchanged). No guest route
imports either staff panel.

UI labels are restricted to the allowed safe-language set: "Pending
Locally" (default), "Failed Locally" (via the failed-count KPI on
`SyncStatusPanel`, Phase 6D), "Backend Unavailable", "Replay Blocked"
(surfaced as `replayBlockedReason` text), "Manual Review Required"/"Needs
Staff Review", "Confirmed by Backend" (`resolved_confirmed` only),
"Already Processed", "Safe Duplicate Ignored", "Retry Safe", "Duplicate
Risk". "Cleared Resolved Conflicts" describes clearing this session's
local decision log for events that already left pending/failed state — it
does not claim any business action was fixed.

Raw event JSON is rendered only behind a per-card "Show technical
details" toggle, never as the panel's primary UI.

## J. Verification Performed + Build Result

`server/scripts/verifyPhase6E_FailedEventReconciliationReplaySafety.md`
documents 17 manual checks: duplicate eventId, duplicate business action,
backend-unavailable replay, failed-event replay against a live backend,
blocked unsafe replay, dry-run preview, manual review, reconciliation
notes, safe retry, clearing resolved conflicts, the three new station
transition events, staff-only visibility, guest-screen exclusion, no
fake-claim language, and the build.

`npm run build`: **passed cleanly** — 1768 modules transformed, 0 errors,
only the pre-existing chunk-size warning (unrelated to this phase).

Grep checks performed and passing:
- `SyncConflictReviewPanel` mounted only in `EATCommandHub.jsx`.
- No guest route (`src/context/`, `src/pages/passport/`, SmokeCraft pages)
  imports either staff panel.
- `requiredPermission="access_eat_command"` still present on both `/eat`
  routes.
- `businessActionFingerprint`/`classifyConflict` are referenced in
  `syncEventReplayService.js` ahead of any `postSyncEvents` call.
- `opsSet`/`opsGet`/`emit(` call counts unchanged in the three station
  service files (existing logic preserved).

## K. Recommended Next Phase

**Phase 6F — Backend Reconciliation Endpoints + Server-Side Replay
Confirmation.** This phase's client-side conflict/replay logic is
already-honest but partially blind: it cannot look up a specific
backend event by ID or fingerprint, so duplicate-business-action
detection currently relies only on the local IndexedDB's own
`businessActionFingerprint` field rather than querying the backend for a
match. Phase 6F should add the backend routes documented in Section J of
this phase's task (`GET /api/sync/events/:eventId`, `GET
/api/sync/events/fingerprint/:fingerprint`, `POST /api/sync/replay`,
`POST /api/sync/conflicts/decision`, `GET /api/sync/conflicts`, `POST
/api/sync/reconciliation/:eventId/note`, `POST
/api/sync/reconciliation/:eventId/resolve`), then wire
`syncConflictResolutionService.detectConflict()` to actually query the
backend for a fingerprint match instead of only comparing against
locally-known events, and apply migration support for storing
fingerprints server-side so reconciliation decisions can be confirmed
across devices, not just within one browser's IndexedDB.
