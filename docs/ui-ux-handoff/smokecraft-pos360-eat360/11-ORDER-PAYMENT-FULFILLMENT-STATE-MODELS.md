# 11 — Order, Payment, Fulfillment State Models

## Honesty framing

Venue Humidor's order/payment states are real, proven, server-backed.
POS360's handoff/staff-side states are real but explicitly labeled
preview/fallback in their own source. E.A.T. 360 does not appear to
independently own any order/payment/fulfillment state — it reads/reports
on state owned elsewhere.

## Order lifecycle (Venue Humidor, customer + admin, proven)

Customer-visible screens: cart → checkout (`VenueHumidorCheckout`) →
confirmation (`VenueHumidorOrderConfirmation`) → my orders
(`VenueHumidorMyOrders`) → order detail (`VenueHumidorMyOrderDetail`) →
pickup (`VenueHumidorPickup`) → receipt (`VenueHumidorReceipt`).

Admin-visible screens: order queue (`VenueHumidorOrderQueue`) → order
detail (`VenueHumidorOrderDetail`) → handoff (`VenueHumidorHandoff`) →
fulfillment history (`VenueHumidorFulfillmentHistory`).

## Staff handoff states (real, explicitly disclosed as preview-tier)

From `StaffStatusBadge.jsx`'s real status vocabulary:

| State | Meaning |
|---|---|
| `staff_order_preview` | Order visible to staff, preview-tier |
| `staff_assisted_preview` | Staff-assisted order, preview-tier |
| `manager_approval_required` | Order/action needs manager sign-off |
| `manager_approved_preview` | Manager approved (preview-tier) |
| `manager_rejected_preview` | Manager rejected (preview-tier) |
| `manual_pos360_handoff` | POS sync failed; staff manually entering order |
| `pos_sync_pending` | Awaiting POS sync confirmation |
| `table_layout_preview` / `floor_layout_preview` / `section_layout_preview` | Layout-editing preview states |
| `staff_order_cancelled` | Order cancelled by staff |
| `preview_fallback` | Generic fallback-to-preview state |
| `not_persisted` | Explicitly not saved to any backend record |

**Design rule**: any UI surfacing a `*_preview` or `not_persisted` state
must visually communicate "this has not been finalized/saved" — do not
let styling make these look equivalent to a confirmed, persisted state.

## POS360 order-intent bridge states (`smokecraftHandoffService.js`)

`ok` (boolean), `backendConnected` (boolean),
`orderStatus: 'local_fallback'` (when bridge unreachable),
`persistenceMode: 'local_fallback'`, `safeClaim:
'pos360_smokecraft_order_bridge'` (a literal tag identifying this as the
safe/degraded claim path, not real persistence).

## Payment (Venue Humidor, proven)

Payments ledger: `/smokecraft/admin/humidor/payments`
(`VenueHumidorAdminPayments`). Checkout creates a payment intent through
`VenueHumidorCheckout`; this documentation pass did not modify or
re-verify payment/gateway code (explicitly out of scope — a concurrent
agent may be working on real payment-gateway integration in this same
repo/branch). Do not treat this file as a payment-integration spec.

## Inventory drawdown (see also `12-INVENTORY-AUTHORITY-MODEL.md`)

`VenueHumidorAdminInventoryEvents` records inventory events tied to
orders (received, sold, adjusted, retired, etc. — exact event-type
vocabulary should be confirmed against
`server/services/venueHumidor/venueHumidorEventService.js`, not modified
by this pass).

## Passport / rewards state (SmokeCraft, proven server-authoritative)

- Session completion → XP award, via the single shared, idempotent
  `awardSessionRewards()` / `completeSessionOnServer()` /
  `handleCompleteSession()` chain (`smokecraftRequiredInteractions.js`
  documents this precisely). XP is looked up server-side from
  `sessionRewardTable.js` by `sessionId`, never client-supplied.
- Passport stamp: `/smokecraft/passport-stamp` (session 23) issues a
  Passport-360 stamp record shared platform-wide, not SmokeCraft-only.
- Rewards screen (`/smokecraft/rewards`, session 25) reads the same
  canonical server XP/rank ledger as every other system — but see the
  known, disclosed limitation that the itemized XP-breakdown rows
  under the (correct) headline total show `0 XP` each
  (`17-KNOWN-LIMITATIONS-AND-ACTIVE-PRODUCTION-WORK.md`).

## Audit-state mapping

`src/services/pos3/auditLogService.js` exists as a real POS3-side audit
log service. Venue Humidor's media-management pass independently proved
a real, append-only audit trail pattern
(`venue_cigar_media_events` — actor/venue/asset/product/action/timestamp/
before-after-summary/correlation-id, never updated in place — see
`public/proof/smokecraft-venue-humidor-media-management/06-rbac-and-security.md`).
Recommend this same append-only, correlation-id-bearing pattern for any
new POS360/E.A.T. audit surface, rather than inventing a new shape.
