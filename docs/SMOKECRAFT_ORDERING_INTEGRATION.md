# SmokeCraft Ordering Integration

**Module Build 3 of 9 — SmokeCraft Ordering, Venue Menu, POS360, and Staff Handoff**

---

## Honest Status

| Property | Status |
|---|---|
| Customer self-order request | Real — order created, audit trail recorded |
| Staff-assisted order request | Real — order sent to staff queue |
| Staff order queue | Real — in-memory, management-ready |
| Venue menu | Local fallback — `not_connected` until POS360/E.A.T. connected |
| POS360 sync | Not connected — `posSyncStatus: "not_connected"` |
| E.A.T. management sync | Not connected — `eatSyncStatus: "not_connected"` |
| Database persistence | In-memory fallback — `persistenceMode: "memory_fallback"` |
| Pairing tags | On menu items — recommendations still `demo_only` |
| Audit trail | Active — in-memory |

---

## Customer Self-Order Path

1. Customer is in the SmokeCraft journey at `/smokecraft/request-purchase`
2. Customer opens `SmokeCraftVenueMenuPanel` — sees venue menu (local_fallback if not synced)
3. Customer uses `SmokeCraftOrderModeSelector` — selects `customer_self_order`
4. Customer submits items → `POST /api/modules/smokecraft/orders/create`
5. Order is created with `orderStatus: "requested"`
6. Audit event `smokeCraft.order.created` is recorded
7. E.A.T. sync event is queued (not sent — E.A.T. not connected)
8. Customer sees `SmokeCraftOrderStatusPanel` showing `syncStatus: "not_connected"`

**POS Honesty Rule:** The system never returns `sent_to_pos` status unless `POST /api/modules/smokecraft/orders/:orderId/send-to-pos` confirms POS bridge connected.

---

## Staff-Assisted Order Path

1. Customer selects `staff_assisted_order` in `SmokeCraftOrderModeSelector`
2. Order submitted → `orderStatus: "sent_to_staff"`
3. Staff opens `/api/modules/smokecraft/orders/staff/queue`
4. Staff accepts → `POST /api/modules/smokecraft/orders/:orderId/accept`
5. Staff assists → updates status via `PATCH /api/modules/smokecraft/orders/:orderId/status`
6. Staff attempts POS send → `POST /api/modules/smokecraft/orders/:orderId/send-to-pos`
7. If POS not connected → order stays at `accepted_by_staff` with `posSyncStatus: "not_connected"`

---

## Staff Queue

**Endpoint:** `GET /api/modules/smokecraft/orders/staff/queue?role=staff`

Returns all orders with status: `requested`, `sent_to_staff`, `accepted_by_staff`, `staff_assisting`

**Permission required:** `staff`, `manager`, `owner`, `admin`

Customer roles cannot access the staff queue.

---

## POS360 Bridge

**File:** `server/services/smokecraft/smokecraftPosBridgeService.js`

| Function | Status |
|---|---|
| `getPos360Status()` | Returns `connected: false` |
| `canSendToPOS()` | Returns `false` |
| `sendSmokeCraftOrderToPOS(order)` | Returns `sent: false, posSyncStatus: "not_connected"` |
| `mapSmokeCraftOrderToPOSPayload(order)` | Maps order to POS shape (safe to call) |
| `getLastPOSSyncResult(orderId)` | Returns last attempt result |

**Honest rule:** `sent_to_pos` order status is only set if `sendSmokeCraftOrderToPOS` returns `sent: true`. This requires a live POS360 adapter connection.

---

## E.A.T. Sync Bridge

**File:** `server/services/smokecraft/smokecraftEatSyncBridgeService.js`

| Function | Status |
|---|---|
| `getEatSyncStatus()` | Returns `connected: false` |
| `canSyncToEAT()` | Returns `false` |
| `syncSmokeCraftOrderToEAT(order, eventType)` | Queues event locally — not sent |
| `syncSmokeCraftMenuActivityToEAT(payload)` | Queues event locally |
| `syncSmokeCraftStaffActivityToEAT(payload)` | Queues event locally |

Management sync events are queued but not dispatched until E.A.T. is connected.

---

## Venue Menu

**File:** `server/services/smokecraft/smokecraftVenueMenuStore.js`

When no live source is connected, returns:
```
menuSource: "local_fallback"
syncStatus: "not_connected"
productionReady: false
```

Pairing tags (`cigarPairingTags`, `drinkPairingTags`, `foodPairingTags`) are attached to menu items for future pairing engine integration.

---

## Persistence Mode

**File:** `server/services/smokecraft/smokecraftOrderStore.js`

| Condition | Mode |
|---|---|
| No `DATABASE_URL` | `persistenceMode: "memory_fallback"`, `productionReady: false` |
| `DATABASE_URL` set | `persistenceMode: "database"`, `productionReady: true` |

In-memory orders are lost on server restart. Database required for production.

---

## Audit Trail

Every order status change creates an audit entry via `smokecraftOrderAuditService.js`.

**Endpoint:** `GET /api/modules/smokecraft/orders/:orderId/audit`

Audit entries never contain secrets or private user data.

---

## Permissions

| Role | Permissions |
|---|---|
| `customer` | Create order, request staff, view own order, cancel own draft/requested |
| `staff` | View queue, accept order, update status, attempt POS send, add notes |
| `manager` | View all orders, view sync status, view management summary |
| `platformAdmin` | Inspect audit, inspect module integration status |

Customer users cannot access staff queue endpoints.

---

## What Is Real Now

- SmokeCraft customer self-order requests can be created
- SmokeCraft staff-assisted order requests can be created and routed to staff queue
- Staff queue `accept`, `update status`, and `attempt POS send` flows work
- Order audit trail records all status changes
- E.A.T. sync events are queued (not dispatched — E.A.T. not connected)
- Venue menu local fallback is available with honest `not_connected` status
- Frontend components: `SmokeCraftVenueMenuPanel`, `SmokeCraftOrderModeSelector`, `SmokeCraftStaffHandoffPanel`, `SmokeCraftOrderStatusPanel`

---

## What Is Still Not Real

- POS360 is not live-sending orders — `posSyncStatus: "not_connected"`
- E.A.T. is not live-syncing management data — `eatSyncStatus: "not_connected"`
- Venue menu is not live-synced — `menuSource: "local_fallback"`
- Database persistence is `memory_fallback` without `DATABASE_URL`
- Pairing recommendations remain `demo_only`
- Marketplace packaging is not live
- License enforcement is not active

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/modules/smokecraft/orders/status` | System status |
| GET | `/api/modules/smokecraft/orders/menu/:venueId` | Venue menu |
| POST | `/api/modules/smokecraft/orders/create` | Create order |
| POST | `/api/modules/smokecraft/orders/request-staff` | Request staff |
| GET | `/api/modules/smokecraft/orders/staff/queue` | Staff queue |
| GET | `/api/modules/smokecraft/orders/manager/summary` | Manager summary |
| GET | `/api/modules/smokecraft/orders/:orderId` | Get order |
| PATCH | `/api/modules/smokecraft/orders/:orderId/status` | Update status |
| POST | `/api/modules/smokecraft/orders/:orderId/accept` | Accept order |
| POST | `/api/modules/smokecraft/orders/:orderId/send-to-pos` | Attempt POS send |
| GET | `/api/modules/smokecraft/orders/:orderId/audit` | Audit trail |

---

## Module Build 4 Preview

**MODULE BUILD 4 OF 9 — SmokeCraft Live Pairing Engine, Menu Recommendations, and Customer Preference Intelligence**

Module Build 4 should connect pairing recommendations to customer profile, cigar preferences, venue menu items, scorecard history, mentor logic, and AI/provider-backed recommendation services.
