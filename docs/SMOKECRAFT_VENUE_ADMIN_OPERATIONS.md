# SmokeCraft Venue Admin, Staff Operations, Analytics, and Management Controls

**Module Build 6 of 9 — SmokeCraft Venue Admin, Staff Operations, Analytics Dashboard, and Management Controls**

---

## Honest Status

| Property | Status |
|---|---|
| Venue admin foundation | Active |
| Staff operations dashboard | Active |
| Venue analytics summary | Active — memory_fallback counters |
| Management controls | Active — protected actions blocked |
| Operational audit trail | Active |
| Role-gated access | Active — customer role blocked |
| POS360 | `not_connected` |
| E.A.T. | `not_connected` / `preview_only` |
| Database persistence | `memory_fallback` without DATABASE_URL |
| Billing | `preview_only` |
| Marketplace | `not_live_marketplace` |
| License enforcement | `license_not_enforced` |

---

## Venue Admin Overview

**File:** `server/services/smokecraft/smokecraftAdminDashboardService.js`

Composes venue overview from:

- `smokecraftVenueActivityService.js` — session, order, pairing, reward counters
- `smokecraftStaffOperationsService.js` — staff queue, order states
- `smokecraftAnalyticsService.js` — aggregated analytics summary
- `smokecraftManagementControlService.js` — integration status, module health
- `smokecraftOperationalAuditService.js` — audit trail

---

## Admin Views

| View | Description |
|---|---|
| `overview` | Full venue activity summary |
| `active_sessions` | Active SmokeCraft sessions |
| `staff_queue` | Pending/accepted/completed orders |
| `order_activity` | All order events |
| `pairing_activity` | Pairing recommendations |
| `reward_activity` | XP, loyalty, passport rewards |
| `passport_activity` | Passport stamp eligibility |
| `loyalty_activity` | Loyalty points and XP issued |
| `menu_status` | Venue menu fallback status |
| `pos360_status` | POS360 connection status |
| `eat_status` | E.A.T. sync status |
| `audit_log` | Operational audit entries |
| `management_controls` | Allowed and blocked control actions |

---

## Staff Operations

**File:** `server/services/smokecraft/smokecraftStaffOperationsService.js`

| Function | Description |
|---|---|
| `getStaffOperationsStatus(venueId)` | Queue counts and status |
| `getStaffQueueSummary(venueId)` | Full queue with records |
| `getStaffAssignedOrders(staffId)` | Orders assigned to staff member |
| `acceptStaffOrder(orderId, actor)` | Accept with role check |
| `updateStaffOrderStatus(orderId, status, actor)` | Update with role check |
| `getStaffPerformanceSummary(venueId)` | Per-staff performance |
| `getStaffOperationalWarnings(venueId)` | POS/E.A.T./fallback warnings |

**POS honesty rule:** `posSendStatus: "not_connected"` unless POS360 adapter confirms connected.

---

## Venue Analytics

**File:** `server/services/smokecraft/smokecraftAnalyticsService.js`

`getVenueAnalyticsSummary(venueId, dateRange)` returns:

- Session totals (active, completed)
- Order totals (by mode and status)
- Pairing totals (local intelligence vs provider-backed)
- Reward totals (XP, loyalty, passport, blocked)
- Fallback usage counters (POS not-connected, E.A.T. preview-only)

When no database is available:

```
analyticsStatus: "memory_fallback"
productionReady: false
```

---

## Management Controls

**File:** `server/services/smokecraft/smokecraftManagementControlService.js`

### Allowed Actions

| Action | Minimum Role |
|---|---|
| `view_integration_status` | staff |
| `view_pos360_status` | staff |
| `view_eat_status` | staff |
| `view_persistence_status` | staff |
| `view_fallback_mode` | staff |
| `view_reward_policy_status` | staff |
| `view_staff_queue_health` | staff |
| `view_active_session_health` | staff |
| `view_module_health` | staff |
| `pause_order_requests` | manager |
| `resume_order_requests` | manager |
| `mark_menu_fallback_active` | manager |
| `refresh_analytics` | manager |
| `clear_demo_data` | platformAdmin only |
| `inspect_audit_trail` | venueOwner |

### Permanently Blocked Actions

These cannot be executed by any role:

- `force_passport_unlock`
- `force_connections_unlock`
- `force_pos_synced`
- `force_eat_synced`
- `force_reward_redeemed`
- `force_billing_active`
- `force_license_enforced`
- `bypass_reward_policy`
- `bypass_journey_progression`

Blocked result:
```
allowed: false
blockedReason: "protected_smokecraft_rule"
```

---

## Permission Model

**File:** `server/services/smokecraft/smokecraftVenuePermissionService.js`

| Role | Access |
|---|---|
| `customer` | **Blocked from all admin access** |
| `staff` | Staff queue, accept/update orders, assigned orders |
| `manager` | All staff ops + analytics, rewards, pairings, integration status |
| `venueOwner` | All manager + venue dashboard, revenue preview, management controls, audit |
| `platformAdmin` | All venue owner + system health, module audit, clear demo data |

---

## Operational Audit Trail

**File:** `server/services/smokecraft/smokecraftOperationalAuditService.js`

Audit events:

| Event | Trigger |
|---|---|
| `smokeCraft.admin.dashboardViewed` | Overview or audit view accessed |
| `smokeCraft.staff.queueViewed` | Staff queue viewed |
| `smokeCraft.staff.orderAccepted` | Staff accepts an order |
| `smokeCraft.staff.orderUpdated` | Staff updates order status |
| `smokeCraft.analytics.summaryGenerated` | Analytics summary generated |
| `smokeCraft.management.controlViewed` | Control action executed |
| `smokeCraft.management.controlBlocked` | Protected action attempted |
| `smokeCraft.integration.statusViewed` | Integrations viewed |
| `smokeCraft.fallback.modeViewed` | Fallback mode viewed |

Audit entry:

```
auditId, venueId, actorId, actorRole, eventType, targetType, targetId,
previousStatus, nextStatus, allowed, blockedReason,
containsSecrets: false, exposesPrivateData: false, createdAt
```

---

## Integration Status

All integrations report honest status:

| Integration | Status |
|---|---|
| POS360 | `connected: false` / `status: "not_connected"` |
| E.A.T. | `connected: false` / `status: "not_connected"` / `syncStatus: "preview_only"` |
| Database | `persistenceMode: "memory_fallback"` unless DATABASE_URL-backed |
| Marketplace | `marketplaceStatus: "not_live_marketplace"` |
| License | `licenseStatus: "license_not_enforced"` |
| Billing | `billingStatus: "preview_only"` |

---

## Degraded Mode

| Condition | Status |
|---|---|
| No DATABASE_URL | `persistenceMode: "memory_fallback"`, `productionReady: false` |
| POS360 not connected | `posSyncStatus: "not_connected"` |
| E.A.T. not connected | `eatSyncStatus: "not_connected"`, `managementSyncStatus: "preview_only"` |
| No billing provider | `billingStatus: "preview_only"` |
| Marketplace not live | `marketplaceStatus: "not_live_marketplace"` |
| License not enforced | `licenseStatus: "license_not_enforced"` |

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/modules/smokecraft/admin/status` | System status |
| GET | `/api/modules/smokecraft/admin/venue/:venueId/overview` | Venue overview |
| GET | `/api/modules/smokecraft/admin/venue/:venueId/staff-queue` | Staff queue |
| GET | `/api/modules/smokecraft/admin/venue/:venueId/analytics` | Analytics summary |
| GET | `/api/modules/smokecraft/admin/venue/:venueId/integrations` | Integration status |
| GET | `/api/modules/smokecraft/admin/venue/:venueId/rewards` | Rewards summary |
| GET | `/api/modules/smokecraft/admin/venue/:venueId/pairings` | Pairings summary |
| GET | `/api/modules/smokecraft/admin/venue/:venueId/orders` | Orders summary |
| GET | `/api/modules/smokecraft/admin/venue/:venueId/audit` | Audit log |
| POST | `/api/modules/smokecraft/admin/venue/:venueId/control` | Execute control action |
| GET | `/api/modules/smokecraft/admin/staff/:staffId/assigned-orders` | Staff assigned orders |

---

## What Is Real Now

- SmokeCraft venue admin foundation exists and is role-gated
- Staff operations dashboard foundation exists
- Venue analytics summary exists (memory_fallback counters)
- Management controls can view and block protected actions
- Operational audit entries are created for admin events
- Customer role is always blocked from admin access
- All protected SmokeCraft progression rules are enforced even from admin

---

## What Is Still Fallback / Preview Only

- POS360 is not live — `not_connected`
- E.A.T. is not live — `not_connected` / `preview_only`
- Database persistence is `memory_fallback` without DATABASE_URL
- Analytics counters are in-process only (not persisted)
- Billing is `preview_only`
- Marketplace is `not_live_marketplace`
- License enforcement is `license_not_enforced`

---

## Module Build 7 Preview

**MODULE BUILD 7 OF 9 — SmokeCraft Live Integrations, Provider Connectors, Database Persistence, and Production Sync Readiness**

Module Build 7 should connect real persistence, provider configuration, integration health checks, POS360/E.A.T. readiness, environment validation, and production sync contracts without faking live vendor connections.
