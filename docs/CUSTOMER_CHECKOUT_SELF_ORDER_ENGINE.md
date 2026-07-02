# Customer Checkout and Self-Order Engine

Phase 12 of 19 — NOVEE OS

---

## Summary

The Customer Checkout and Self-Order Engine can create cart, checkout, receipt, and order-status previews, but it does not prove live payment capture, POS sync, KDS notification, inventory reservation, or finalized tax collection unless those integrations are verified.

---

## What Is Live vs Preview-Only

| Feature | Status |
|---|---|
| Cart creation | preview (in-memory) |
| Cart items | preview (in-memory) |
| Checkout session | `checkout_preview` |
| Self-order submission | `order_submission_preview` |
| Staff-assisted handoff | `staff_handoff_preview` |
| Receipt | `receipt_preview` |
| Tax | `tax_preview_required` |
| Payment | `payment_confirmation_required` |
| POS sync | `pos_sync_pending` |
| KDS routing | `kds_routing_pending` |
| Inventory | `inventory_unavailable` |
| Database persistence | `database_required` / `not_persisted` |

---

## Cart Behavior

- Integer cents only (no floats)
- Rejects negative amounts
- Rejects zero quantity
- Subtotal = sum of line item subtotals
- Total = subtotal + fees + tax
- Supports venue items, partner/vendor items, and mixed carts
- Returns `cart_preview` by default
- Returns `database_required` + `preview_fallback` if DATABASE_URL is missing

## Self-Order Preview Behavior

1. Customer builds a cart
2. Cart is validated (venue_id required, items required)
3. Checkout preview is built (order + tax + payment + KDS snapshots attached)
4. Self-order preview returns `self_order_preview` status
5. Submission returns `order_submission_preview` — NOT a live order

No payment is charged. No order is sent to a live POS or KDS system.

## Staff-Assisted Handoff Behavior

1. Customer requests staff handoff from cart or checkout preview
2. Handoff record created with `staff_handoff_preview` status
3. Staff must confirm before any live order action
4. POS and KDS remain `pos_sync_pending` / `kds_routing_pending`

## Checkout Readiness Score

0–100 points. Deductions:
- Critical blockers: -40 each (missing venue_id, empty cart)
- Warning blockers: -10 each (partner approval, availability)

Additional info-level blockers are always present until live integrations are verified:
`payment_confirmation_required`, `tax_preview_required`, `pos_sync_pending`, `kds_routing_pending`, `inventory_unavailable`

## Receipt Preview Behavior

- Status: `receipt_preview`
- Subtotal = sum of line items
- Total = subtotal + fees + estimated tax
- Tax shown as estimated (not legally collected)
- Payment shown as `payment_confirmation_required`
- POS shown as `pos_sync_pending`
- KDS shown as `kds_routing_pending`
- Disclosure list included for customer transparency

## Customer Order Status Behavior

Maps backend order lifecycle statuses to customer-friendly language:
- `order_submission_preview` → "Order Preview"
- `order_accepted` → "Order Accepted"
- `order_preparing` → "Preparing"
- `order_ready` → "Ready"
- Internal secrets and provider errors are never exposed to customers

## Tax Preview Integration

Tax estimates are attached from `taxCalculationEngine.js` in preview mode.  
Tax status: `tax_preview_required` until legal/live tax configuration is verified.  
Tax amounts are estimates only. CPA/legal review required before collecting or remitting.

## Payment Preview Integration

Payment preview is attached from `moneyBridgePaymentEngine.js`.  
Payment status: `payment_confirmation_required` until live Stripe Connect integration is verified.  
No payment is captured at any point in Phase 12.

## Order Lifecycle Integration

Checkout preview creates an `order_lifecycle_preview` by calling `orderLifecycleService.js`.  
No live order is placed until a database connection and active order lifecycle integration are verified.

## KDS Routing Preview Integration

KDS dispatch preview is attached from `kdsRoutingEngine.js`.  
KDS status: `kds_routing_pending`. No kitchen, bar, humidor, or partner station is notified.

## POS Sync Preview Behavior

POS status: `pos_sync_pending`. No live POS system is synced.  
Manual POS360 remains available via existing Phase 4.13 routes.

## Partner/Vendor Approval and Availability Gates

- Partner items show `approval_required` until partner onboarding is complete
- Availability shows `availability_required` until inventory is connected
- Partner checkout readiness is checked via `getPartnerCheckoutReadiness(partnerId, venueId)`

## Venue Readiness Integration

Venue onboarding readiness affects checkout readiness score.  
Incomplete venue onboarding adds `venue_approval_required` blocker.

## Inventory Unavailable Behavior

All items show `inventory_unavailable` by default.  
No inventory is reserved. No stock check is performed.  
Live inventory integration is required for real availability confirmation.

## Database Fallback Behavior

If DATABASE_URL is not set:
- All stores are in-memory Maps (cleared on server restart)
- `storageMode: 'preview_fallback'`
- `persistenceStatus: 'not_persisted'`
- Audit events are buffered in AUDIT_BUFFER (max 500 events)

---

## NCIE Commerce Handoff

NCIE commerce intelligence can hand off to the cart preview via `customerCheckoutApi.js`.  
Education-to-commerce events are tracked as `analytics_preview` (not persisted).

---

## E.A.T. Command Hub Checkout Hooks

Added to `server/services/eatCommandHubContract.js`:
- `getCheckoutReadinessHooks(venueId, partnerId)` — overall checkout readiness
- `getSelfOrderReadinessHooks(venueId)` — self-order flow readiness
- `getStaffAssistedOrderReadinessHooks(venueId)` — staff-assist flow readiness
- `getCustomerOrderStatusHooks(orderId)` — customer-facing order status

---

## API Endpoints

Mounted at `/api/checkout`:

| Endpoint | Method | Purpose |
|---|---|---|
| `/carts` | POST | Create cart |
| `/carts/:cartId` | GET | Get cart |
| `/venues/:venueId/carts` | GET | Get venue carts |
| `/carts/:cartId/items` | POST | Add item |
| `/carts/:cartId/items/:cartItemId` | PATCH | Update item |
| `/carts/:cartId/items/:cartItemId` | DELETE | Remove item |
| `/carts/:cartId/clear` | POST | Clear cart |
| `/carts/:cartId/start` | POST | Start checkout session |
| `/carts/:cartId/preview` | POST | Build checkout preview |
| `/carts/:cartId/self-order-preview` | POST | Build self-order preview |
| `/carts/:cartId/submit-preview` | POST | Submit order preview |
| `/carts/:cartId/staff-assisted-preview` | POST | Build staff-assisted preview |
| `/carts/:cartId/staff-handoff` | POST | Request staff handoff |
| `/sessions/:id` | GET | Get checkout session |
| `/sessions/:id/cancel` | POST | Cancel session |
| `/carts/:cartId/receipt-preview` | GET | Get receipt preview |
| `/orders/:orderId/status` | GET | Get customer order status |
| `/orders/:orderId/timeline` | GET | Get order timeline |
| `/readiness` | POST | Get checkout readiness |
| `/venues/:venueId/self-order-readiness` | GET | Self-order readiness |
| `/venues/:venueId/staff-assisted-readiness` | GET | Staff-assisted readiness |
| `/venues/:venueId/partners/:partnerId/readiness` | GET | Partner readiness |
| `/audit/:entityType/:entityId` | GET | Get audit trail |

---

## Protected Files — Not Modified

All Phase 12 files are new additions. No protected SmokeCraft files were touched.

---

## What Phase 13 Should Build Next

**Phase 13 of 19 — Staff Order Management and Table/Patio Layout Engine**

Purpose: Create staff-assisted ordering, server order entry, table/patio assignment, section management, role-based edits, manager approval, manual POS360 handoff, and venue floor layout support so venues can operate both customer self-order and staff-entered orders.

Phase 12 creates the customer-side foundation. Phase 13 builds the staff-side counterpart: table assignment, staff order entry, manager approval flow, section and floor layout, and the handoff bridge from Phase 12 customer carts to staff-managed order management.
