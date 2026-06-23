# Production Lockdown — Phase 6G: Audit Logs, Staff Accountability & Event Lifecycle Timeline Report

## A. Phase Summary

This phase adds a venue-grade, queryable audit/accountability layer on top
of the Phase 6B–6F sync, replay, conflict, and reconciliation flows. Every
sync event, replay attempt, conflict decision, reconciliation note, and
staff resolution now produces an append-only audit log entry and (where it
represents a stage transition) a lifecycle-timeline row, both keyed by
`event_id`/`business_action_fingerprint` so they can be merged into a
single chronological timeline per event or per business action. The
backend audit store and service follow the exact degraded-mode honesty
contract established in Phase 6B/6F: `DbUnavailableError` /
`assertDb()` / `{dbAvailable, degraded, message}`, and audit-write
failures are caught at every call site so they never crash the
reconciliation/replay/conflict operation that triggered them. The frontend
adds a fifth staff-only panel (`SyncAuditTimelinePanel`) that shows backend
audit health, event/business-action timelines, and recent staff/replay/
conflict/reconciliation activity — read-only, with raw JSON only behind a
per-entry "Show technical details" toggle.

`npm run build` passed cleanly (1770 modules transformed, 0 errors, only
the pre-existing chunk-size warning).

## B. Files Added

- `server/db/migrations/014_sync_audit_lifecycle.sql`
- `server/services/syncAuditStore.js`
- `server/services/syncAuditService.js`
- `server/controllers/syncAuditController.js`
- `server/routes/syncAuditRoutes.js`
- `src/services/syncAuditClientService.js`
- `src/components/staff/SyncAuditTimelinePanel.jsx`
- `server/scripts/verifyPhase6G_AuditLogsStaffAccountabilityTimeline.md`
- `PRODUCTION_LOCKDOWN_PHASE_6G_AUDIT_ACCOUNTABILITY_TIMELINE_REPORT.md`

## C. Files Modified (additive only)

- `server/index.js` — one import + one `app.use('/api/sync/audit',
  syncAuditRoutes)` line appended after the existing Phase 6F
  reconciliation mount. All existing route mounts unchanged.
- `server/services/syncConflictResolutionServerService.js` — `classifyConflict()`
  now calls `auditConflictDetected()` when a real conflict is found;
  `recordConflictDecision()` now calls `auditConflictDecision()` and, when
  `requiresManualReview` is true, `auditManualReviewRequired()`. All
  existing exports/behavior unchanged; audit calls are wrapped in
  `.catch(() => {})`.
- `server/services/syncReplayServerService.js` — `previewReplay()`,
  `replayEventPayload()` now call `auditReplayPreview`,
  `auditReplayAttempt`, `auditReplayConfirmed`, `auditReplayRejected` at
  the corresponding points. All existing return shapes/control flow
  unchanged; audit calls never block or alter the function's result.
- `server/services/syncReconciliationStore.js` — `createReconciliationNote()`
  and `resolveReconciliation()` now call `auditReconciliationNote()` /
  `auditReconciliationResolved()` after their existing writes. Existing
  SQL/return values unchanged.
- `src/services/syncApiClient.js` — 5 new exported functions
  (`fetchAuditLogs, fetchEventTimeline, fetchBusinessActionTimeline,
  fetchActorAuditLogs, fetchAuditSummary`) appended under a "Phase 6G
  additions" section. All existing Phase 6C/6D/6F exports unchanged.
- `src/pages/eat/EATCommandHub.jsx` — one import + `<SyncAuditTimelinePanel
  />` appended below `<SyncConflictReviewPanel />`. No other changes.

## D. Audit Database Schema (Migration 014)

Purely additive — does not alter `sync_events`, `sync_failures`,
`sync_conflict_decisions`, or `sync_reconciliation_notes` from migrations
012/013:
- New table `sync_audit_logs` — flat, append-only log with 21 columns
  including `actor_user_id/actor_staff_id/actor_role/actor_display_name`,
  `action_type`/`action_category` (CHECK-constrained to the 8 required
  categories), `entity_type/entity_id`, `decision_id`,
  `reconciliation_note_id`, `replay_attempt_id`, `metadata` JSONB, and 8
  indexes covering event/fingerprint/actor/action-type/category/created_at/
  entity lookups.
- New table `sync_event_lifecycle` — per-event stage timeline with
  `lifecycle_stage` CHECK-constrained to the 15 required stages, plus
  `stage_status`, `source`, actor fields, and 5 indexes.

## E. Audit Store Behavior

`syncAuditStore.js` implements all 10 required methods:
- Every write (`recordAuditLog`, `recordLifecycleStage`) calls `assertDb()`
  first and throws `DbUnavailableError` — never silently fabricates a
  durable write.
- `sanitizeMetadata()` strips a hardcoded sensitive-key list (`cardNumber,
  cvv, paymentToken, guestEmail, guestPhone, ssn`) and rejects any nested
  object value outright — defense-in-depth against a caller accidentally
  passing a raw payload as metadata.
- `getBusinessActionTimeline(fingerprint)` merges `sync_audit_logs` and
  `sync_event_lifecycle` rows sharing a fingerprint into one
  chronologically-sorted array tagged `kind: 'audit'|'lifecycle'`.
- `getAuditSummary()` returns the same `{dbAvailable: false, degraded:
  true, message}` shape as `syncReconciliationStore.getReconciliationSummary()`
  when the DB is down — never a fake empty success.

## F. Lifecycle Timeline Behavior

`syncAuditService.js` wraps the store's two write primitives into 14
named, single-purpose `audit*` functions (one per major sync/replay/
conflict/reconciliation/E.A.T./staff event) plus `auditStaffAction` for
generic staff actions. Each function:
- Calls `recordAuditLog()` with the correct `actionCategory` (one of the 8
  required categories) and, where applicable, `recordLifecycleStage()`
  with the correct `lifecycleStage` (one of the 15 required stages).
- Wraps both store calls in a `safeRecordAuditLog`/`safeRecordLifecycleStage`
  helper that catches any error (including `DbUnavailableError`) and
  returns `{recorded: false, warning}` instead of throwing — so a caller in
  `syncReplayServerService.js`/`syncConflictResolutionServerService.js`/
  `syncReconciliationStore.js` can `.catch(() => {})` the whole call without
  risk of an unhandled rejection ever propagating.
- `getTimelineForEvent(eventId)` and `getTimelineForBusinessAction(fingerprint)`
  return `{dbAvailable: false, degraded: true, message}` on any read
  failure, mirroring the store's degraded-mode contract one layer up.

## G. Backend Audit Routes

All 5 routes are mounted under `/api/sync/audit` in
`syncAuditRoutes.js`, gated by the existing `requireAuth + requireStaff`
middleware chain (identical pattern to `syncReconciliationRoutes.js`):
- `GET /logs` — `getAuditLogsRoute` (filterable by `actionCategory`/`actionType`/`limit`).
- `GET /events/:eventId/timeline` — `getEventTimeline`.
- `GET /fingerprints/:fingerprint/timeline` — `getBusinessActionTimelineRoute`.
- `GET /actors/:actorId/logs` — `getActorAuditLogs`.
- `GET /summary` — `getAuditSummaryRoute`.

Every controller response is shaped `{success, mode, degraded, message,
data, error?}`; `DbUnavailableError`/degraded timeline results are
converted to a 503 with `mode: 'degraded'`, never a 200 with fabricated
data.

## H. Frontend Audit UI Behavior

`SyncAuditTimelinePanel.jsx` (staff-only) shows:
- A backend health pill (`Backend Reachable`/`Degraded`/`Backend
  Unavailable`) sourced from `getAuditHealth()` — never claims healthy
  without a real response.
- A summary line (total audit logs, counts by category) only when the
  backend is reachable and not degraded.
- Three lookup forms (Event ID, Business Action Fingerprint, Staff/User
  ID) each with their own button (`Load Event Timeline`, `Load Business
  Action Timeline`, `View Latest Staff Actions`) plus a `Refresh Audit
  Logs` button for the general activity feed.
- Timeline/log entries rendered as cards with actor, device, category,
  reason, and timestamp — raw JSON only behind a per-entry "Show technical
  details" toggle, never as the primary view.
- `syncAuditClientService.js` always prefers backend truth; every getter
  returns `{backendReachable: false, degraded: true, message}` instead of
  an empty-but-successful shape when the backend is unreachable.

## I. Staff/Admin Security Boundary

- `grep -rl "SyncAuditTimelinePanel" src/` returns only the component file
  and `EATCommandHub.jsx`.
- `requiredPermission="access_eat_command"` still gates both `/eat` routes
  in `src/App.jsx` (lines 423, 463 — unchanged).
- All 5 `/api/sync/audit/*` routes use `requireAuth, requireStaff` —
  identical to the Phase 6F reconciliation routes; no new auth pattern was
  invented, and no audit data is exposed to guest/public routes.

## J. Verification Performed + Build Result

`server/scripts/verifyPhase6G_AuditLogsStaffAccountabilityTimeline.md`
documents 16 manual/API checks covering staff-only route protection,
summary/timeline/actor-log fetches, audit-log creation on conflict
decision/replay preview/replay request/reconciliation note/reconciliation
resolve, degraded-mode honesty (both for the audit endpoints and for the
underlying reconciliation/replay operations when audit writes fail), the
frontend panel's honest unavailable state, staff-only panel visibility, no
raw-JSON-as-main-UI, no fake fixed/recovered/synced language, and the
build.

`npm run build`: **passed cleanly** — 1770 modules transformed, 0 errors,
only the pre-existing chunk-size warning (unrelated to this phase).

Grep checks performed and passing:
- `/api/sync/audit` route mount present in `server/index.js`.
- All 5 audit routes use `requireAuth, requireStaff`.
- `SyncAuditTimelinePanel` mounted only in `EATCommandHub.jsx`; no guest
  route imports it.
- `requiredPermission="access_eat_command"` still present on both `/eat`
  routes in `src/App.jsx`.
- No "Fixed"/"Recovered"/"Fully resolved"/"Fully synced"/"Fully processed"
  labels anywhere in `SyncAuditTimelinePanel.jsx` (only appear in this
  file's header comment describing what NOT to claim).
- `opsSet`/`opsGet`/`emit(` call counts unchanged (5 each) in
  `src/services/pos3/kitchenQueueService.js`/`barQueueService.js`/
  `humidorQueueService.js` — Phase 6G touches none of them.

## K. Recommended Next Phase

**Phase 6H — Security Lockdown, Permissions Validation, and Abuse
Testing.** Phases 6B–6G have built an increasingly rich backend surface
(`/api/sync/events`, `/api/sync/conflicts`, `/api/sync/replay`,
`/api/sync/reconciliation/*`, `/api/sync/audit/*`) all gated by the same
`requireAuth + requireStaff` pattern, but no phase has yet adversarially
tested that boundary: role-escalation attempts, malformed/oversized
payloads, replay-storm/rate-limit behavior, cross-venue data leakage via
fingerprint collisions, and confirmation that every degraded-mode response
across all six phases is truly indistinguishable from a real outage (never
a disguised auth failure or bug). Phase 6H should systematically exercise
each of these ~20 routes as guest/staff/founder roles, fuzz the audit
metadata sanitizer with adversarial payloads (nested objects, prototype
pollution attempts, oversized strings) to confirm it never leaks sensitive
data, and produce a signed-off security checklist before any of this sync/
reconciliation/audit stack is considered production-hardened.
