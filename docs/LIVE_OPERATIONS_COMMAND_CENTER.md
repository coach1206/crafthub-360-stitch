# Live Operations Command Center (LOCC) — Phase 17

## Overview

The LOCC provides owner/manager/admin visibility and control over what is live, degraded, pending, blocked, or failed in the operational layer of the platform.

All external sync, vendor submission, and POS push operations remain in non-live status. No automatic purchasing, auto-approval, or external sync is performed.

## What Was Added

### Services (`server/services/operations/`)

| File | Purpose |
|------|---------|
| `roleSafetyGateway.js` | Role enforcement: OWNER_ROLES, MANAGER_ROLES, BLOCKED_ROLES |
| `operationsDashboardService.js` | System health map, operational summary, LOCC readiness report |
| `syncCommandCenterService.js` | View/retry/block sync events; always returns externalSyncNotLive: true |
| `pendingApprovalsQueueService.js` | Purchase order approval queue; autoApprovalDisabled: true |
| `reorderOperationsService.js` | Reorder recommendation and PO draft queue; canSubmitLive: false always |
| `ownerControlService.js` | Owner-only controls: credentials, blockers, sign-off |
| `failedSyncRetryService.js` | Failed sync retry with MAX_RETRY_ATTEMPTS=3; blocks unsafe retries |
| `operationsAuditService.js` | LOCC audit trail for all operations events |

### Controller and Routes

- `server/controllers/operationsController.js` — all LOCC route handlers
- `server/routes/operationsRoutes.js` — mounted at `/api/operations`

### UI Components (`src/components/operations/`)

| Component | Honest Status Displayed |
|-----------|------------------------|
| `OperationsStatusBadge.jsx` | operational / degraded / database_required / preview_only |
| `OperationsDashboardPanel.jsx` | System health map with degraded/operational counts |
| `SyncCommandCenterPanel.jsx` | external_sync_not_live · real_time_push_pending |
| `PendingApprovalsPanel.jsx` | auto_approval_disabled · reorder_not_submitted |
| `FailedSyncPanel.jsx` | Failed events with retry eligibility |
| `ReorderSubmissionPanel.jsx` | vendor_api_required · distributor_connection_required |
| `OwnerControlPanel.jsx` | role_insufficient guard for non-owner roles |
| `DegradedSystemsPanel.jsx` | Degraded system list with reasons |
| `CredentialRequiredPanel.jsx` | Credential presence only — values never returned |
| `OperationsAuditPanel.jsx` | Audit trail with persistence mode badge |
| `BlockedSyncPanel.jsx` | Blocked sync events with reasons |
| `ReceivingConfirmationQueuePanel.jsx` | receiving_preview_only · inventory_not_persisted |

### E.A.T. Hooks (added to `server/services/eatCommandHubContract.js`)

- `getLOCCDashboardReadinessHooks(venueId)`
- `getSyncCommandCenterReadinessHooks(venueId)`
- `getPendingApprovalsReadinessHooks(venueId)`
- `getReorderOperationsReadinessHooks(venueId)`
- `getOwnerControlReadinessHooks(venueId)`
- `getFailedSyncRetryReadinessHooks(venueId)`
- `getOperationsAuditReadinessHooks(venueId)`

All hooks return `preview_fallback` on import error and never claim real persistence without a database.

## API Routes

Base: `/api/operations`

### Dashboard
- `GET /readiness` — LOCC system readiness
- `GET /venue/:venueId/dashboard` — full operations dashboard
- `GET /health` — system health map
- `GET /summary` — operational summary

### Sync Command Center
- `GET /venue/:venueId/sync/queue` — sync event queue (manager+)
- `GET /venue/:venueId/sync/failed` — failed sync events
- `GET /venue/:venueId/sync/not-live` — sync not live status
- `POST /venue/:venueId/sync/:id/retry` — queue retry (returns retry_queued)
- `POST /venue/:venueId/sync/:id/block` — block a sync event

### Pending Approvals
- `GET /venue/:venueId/approvals/summary` — approval queue summary
- `GET /venue/:venueId/approvals/queue` — pending approvals
- `GET /venue/:venueId/approvals/purchase-orders` — PO approvals
- `POST /venue/:venueId/approvals/:id/approve` — approve (manager+)
- `POST /venue/:venueId/approvals/:id/reject` — reject (manager+)
- `POST /venue/:venueId/approvals/:id/escalate` — escalate to owner

### Reorder Operations
- `GET /venue/:venueId/reorder/readiness` — submission gate status
- `GET /venue/:venueId/reorder/queue` — recommendation queue
- `POST /venue/:venueId/reorder/:id/not-submitted` — mark not submitted
- `GET /venue/:venueId/reorder/:id/preview` — preview only (never submits)

### Owner Controls (owner/admin only)
- `GET /venue/:venueId/owner/readiness` — available owner controls
- `GET /venue/:venueId/owner/health` — system health overview
- `GET /venue/:venueId/owner/credentials` — credential presence (values never returned)
- `GET /venue/:venueId/owner/blockers` — production blockers
- `POST /venue/:venueId/owner/sign-off` — sign off if no critical blockers

### Audit
- `GET /venue/:venueId/audit` — LOCC audit trail (manager+)
- `GET /venue/:venueId/audit/export` — export audit trail
- `GET /venue/:venueId/audit/summary` — audit summary

## Role Safety

| Role | Dashboard View | Sync Control | Approvals | Owner Controls |
|------|---------------|--------------|-----------|----------------|
| owner | yes | yes | yes | yes |
| admin | yes | yes | yes | yes |
| manager | yes | yes | yes | no |
| guest, customer, server, bartender, kitchen_staff, humidor_staff, cashier, host, busser | blocked | blocked | blocked | blocked |

## What Remains Degraded / Not Live

- `external_sync_not_live` — POS, vendor, and manufacturer sync are not connected
- `real_time_push_pending` — no real-time push to external systems
- `vendor_sync_not_live` — vendor API connections not established
- `reorder_not_submitted` — all purchase orders remain in draft; no auto-submission
- `vendor_api_required` — vendor API credentials not present
- `distributor_connection_required` — distributor connection not established
- `canSubmitLive: false` — live submission gate always closed
- `autoApprovalDisabled: true` — no automatic PO approval

## Verification

```bash
npm run verify:locc-dashboard
```

180+ assertions covering all 7 services, controller, routes, 12 UI components, 7 E.A.T. hooks, role safety, honest vocabulary, no fake claims, and protected file integrity.
