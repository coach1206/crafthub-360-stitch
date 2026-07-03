# Staff Order Management and Table/Patio Layout Engine

STAFF ORDER ENGINE connects verified staff order sessions with table layout, floor sections, manager approval, and manual POS360 handoff.

## Status Values

| Status | Meaning |
|---|---|
| `staff_order_preview` | Staff-entered order session; not persisted |
| `staff_assisted_preview` | Staff-assisted customer cart session |
| `table_layout_preview` | Table layout in preview mode |
| `floor_layout_preview` | Full floor layout in preview mode |
| `patio_layout_preview` | Patio section layout in preview mode |
| `section_layout_preview` | Floor section in preview mode |
| `manager_approval_required` | Action requires manager approval |
| `manager_approved_preview` | Manager approved; not claiming live persistence |
| `manager_rejected_preview` | Manager rejected |
| `manual_pos360_handoff` | Staff must enter order into POS manually |
| `pos_sync_pending` | POS sync has not occurred |
| `payment_confirmation_required` | Payment not captured |
| `tax_preview_required` | Tax calculation is a preview |
| `kds_routing_pending` | KDS routing not dispatched |
| `inventory_unavailable` | Inventory not checked |
| `not_persisted` | No database; in-memory only |
| `database_required` | Persistence requires live database |

## Role Permissions

| Role | Allowed Actions |
|---|---|
| manager | All actions including comp, void, refund, discount, override |
| server | create_order, add/remove/update items, assign table/section, handoff |
| bartender | create_order, add/remove/update items, send to POS360 |
| host | assign table, assign section, transfer table |
| cashier | create_order, add/remove/update items, send to POS360 |

## Manager-Required Actions

- `request_comp` — comping a check
- `request_void` — voiding an order
- `request_refund` — issuing a refund
- `request_discount` — applying a discount
- `force_close_table` — forcibly closing a table
- `override_order_status` — overriding order status
- `override_payment_status` — overriding payment status
- Any discount > 15% or > $20.00

## API Endpoints (`/api/staff`)

### Sessions
- `POST /venue/:venueId/sessions` — Start staff order session
- `GET /venue/:venueId/sessions` — List sessions
- `GET /sessions/:sessionId` — Get session
- `POST /sessions/:sessionId/items` — Add item
- `PUT /sessions/:sessionId/items/:itemId` — Update item
- `DELETE /sessions/:sessionId/items/:itemId` — Remove item
- `POST /sessions/:sessionId/assign-table` — Assign table
- `POST /sessions/:sessionId/assign-section` — Assign section
- `POST /sessions/:sessionId/submit-preview` — Submit preview
- `POST /sessions/:sessionId/cancel` — Cancel session
- `POST /convert-cart/:cartId` — Convert customer cart to staff order

### Floor Layout
- `GET /venue/:venueId/sections` — List sections
- `POST /venue/:venueId/sections` — Create/update section
- `GET /venue/:venueId/tables` — List tables
- `POST /venue/:venueId/tables` — Create/update table
- `PUT /venue/:venueId/tables/:tableId/position` — Update layout position
- `GET /venue/:venueId/layout` — Get full layout
- `GET /venue/:venueId/layout-preview` — Layout preview

### Manager Approval
- `POST /venue/:venueId/approvals` — Create approval request
- `GET /venue/:venueId/approvals` — List approvals
- `POST /approvals/:approvalRequestId/approve` — Approve
- `POST /approvals/:approvalRequestId/reject` — Reject

### Manual POS360 Handoff
- `POST /venue/:venueId/pos360-handoff` — Create handoff
- `GET /venue/:venueId/pos360-handoffs` — List handoffs

### Table Status
- `GET /venue/:venueId/table-status-board` — Status board
- `PUT /venue/:venueId/tables/:tableId/status` — Update status

## Honesty Constraints

- Never claims POS synced unless real POS integration is present
- Never claims payment captured
- Never claims kitchen notified unless real KDS is present
- Never claims layout saved unless database proof exists
- All responses include `persistenceStatus` and appropriate preview status flags
- Manager approval is `manager_approved_preview`, not a live database write
