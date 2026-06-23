# Phase 6G — Audit Logs, Staff Accountability & Event Lifecycle Timeline Manual Verification

No jest/vitest exists in this repo (confirmed again this phase). Manual
browser + API test against the running app, mirroring Phase 6B–6F's
precedent. Requires a live, migrated Postgres database (migrations 001–014
applied) to exercise the "live backend" scenarios; degraded-mode scenarios
work with `DATABASE_URL` unset.

## Setup

1. Apply migration `server/db/migrations/014_sync_audit_lifecycle.sql`
   (extends nothing — adds `sync_audit_logs` and `sync_event_lifecycle`).
2. `node server/index.js` (backend, port 3001).
3. `npm run dev` (frontend, port 5000).
4. Log in as Founder/Staff, navigate to `/eat` → "Audit Logs & Event
   Lifecycle Timeline — Staff Only" (below the Conflict & Reconciliation
   panel).

## Test 1 — Audit route staff-only protection

1. `curl /api/sync/audit/summary` without auth — confirm 401.
2. `curl` with a guest-role session — confirm 403 (via `requireStaff`).

## Test 2 — Audit summary fetch

`curl` `/api/sync/audit/summary` as staff — confirm
`{success, mode, degraded, message, data}` shape, with `data.totalAuditLogs`
and `data.byActionCategory` populated once at least one audit log exists.

## Test 3 — Event timeline fetch

1. Submit a conflict decision or replay against a known `eventId` (Phase
   6F panel) so an audit log + lifecycle row exist for it.
2. `curl /api/sync/audit/events/:eventId/timeline` — confirm a merged,
   time-ordered array of `{kind: 'audit'|'lifecycle', ...}` entries.

## Test 4 — Fingerprint timeline fetch

`curl /api/sync/audit/fingerprints/:fingerprint/timeline` for a known
business-action fingerprint — confirm the same merged shape, keyed by
`businessActionFingerprint` instead of `eventId`.

## Test 5 — Actor audit logs fetch

`curl /api/sync/audit/actors/:actorId/logs` for a staff ID that has
submitted a conflict decision or reconciliation resolution — confirm their
audit entries are returned, ordered most-recent first.

## Test 6 — Conflict decision creates an audit log

1. From the Conflict panel, click "Submit Conflict Decision".
2. Confirm a new row appears in `sync_audit_logs` with
   `action_type: 'conflict_decision_recorded'`, `action_category:
   'conflict'`, and a populated `decision_id`.
3. Confirm a matching `sync_event_lifecycle` row with `lifecycle_stage:
   'conflict_decision_recorded'`.

## Test 7 — Replay preview creates an audit log

1. Click "Preview Server Replay".
2. Confirm a `sync_audit_logs` row with `action_type: 'replay_preview'`,
   `action_category: 'replay'`, and a `sync_event_lifecycle` row with
   `lifecycle_stage: 'replay_previewed'`.

## Test 8 — Replay request creates lifecycle records

1. Click "Request Server Replay" on a conflict-free event.
2. Confirm `sync_event_lifecycle` rows for `replay_attempted` and (on
   success) `replay_confirmed`, and corresponding `sync_audit_logs` rows.

## Test 9 — Reconciliation note creates an audit log

1. Click "Submit Reconciliation Note".
2. Confirm a `sync_audit_logs` row with `action_type:
   'reconciliation_note_added'`, `action_category: 'reconciliation'`, and a
   `sync_event_lifecycle` row with `lifecycle_stage:
   'reconciliation_note_added'`.

## Test 10 — Reconciliation resolve creates an audit log

1. Click "Resolve With Reason" with a real reason.
2. Confirm a `sync_audit_logs` row with `action_type:
   'reconciliation_resolved'` and a `sync_event_lifecycle` row with
   `lifecycle_stage: 'reconciliation_resolved'`.

## Test 11 — Degraded DB mode does not claim durable audit persistence

1. Stop the backend (or unset `DATABASE_URL`).
2. Submit a conflict decision or replay request — confirm the underlying
   reconciliation/replay operation still completes/returns its existing
   `backend_unavailable` result (audit failures must not crash it), and no
   audit log is fabricated.
3. `curl /api/sync/audit/summary` — confirm `{dbAvailable: false, degraded:
   true, message: "..."}` is returned honestly, never a fake empty success.

## Test 12 — Frontend panel shows backend unavailable honestly

1. With the backend stopped, open the Audit panel and click "Refresh Audit
   Logs".
2. Confirm the health pill shows "Backend Unavailable" and no fabricated
   summary numbers or audit entries are shown.

## Test 13 — Panel is not visible on guest routes

`grep -rl "SyncAuditTimelinePanel" src/` must show only the component file
and `EATCommandHub.jsx`. Confirm `requiredPermission="access_eat_command"`
still gates both `/eat` routes in `src/App.jsx`.

## Test 14 — No raw JSON as main UI

Confirm the panel's primary view is cards/timeline entries with labels,
actor, device, and reason — `JSON.stringify` output only appears inside a
collapsed "Show technical details" toggle per entry.

## Test 15 — No fake fixed/recovered/synced claims

`grep -n "Fixed\|Recovered\|Fully resolved\|Fully synced\|Fully processed"
src/components/staff/SyncAuditTimelinePanel.jsx` — confirm no match outside
of this doc/comment context describing what NOT to claim.

## Test 16 — Build and existing-behavior regression

1. `npm run build` — must pass cleanly.
2. Confirm `opsSet`/`opsGet`/`emit(` call counts are unchanged in
   `src/services/pos3/kitchenQueueService.js` /
   `barQueueService.js` / `humidorQueueService.js` (Phase 6G touches none
   of them).
3. Confirm `server/routes/syncRoutes.js`, `server/controllers/
   syncController.js`, `server/routes/syncReconciliationRoutes.js`, and
   `server/controllers/syncReconciliationController.js` are unchanged in
   their pre-existing exported route/handler signatures (only additive
   audit-call wiring was introduced inside the service layer they call).
