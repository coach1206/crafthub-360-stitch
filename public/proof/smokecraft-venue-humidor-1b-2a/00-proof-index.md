# Venue Humidor 1B-2A — Proof Index

Repo: coach1206/crafthub-360-stitch
Branch: recovery/smokecraft-codex-final
Start commit: 6e2f3678

## Goal

Build only the real customer checkout and order-creation flow on top
of the completed Venue Humidor backend and customer browser. No staff
inventory administration, no full staff fulfillment queue, no
simulated card payment, no full-route/five-viewport sweeps as new
targeted scope for this package.

## Routes added

`/smokecraft/venue-humidor/checkout` (`VenueHumidorCheckout.jsx`) and
`/smokecraft/venue-humidor/order/:orderId`
(`VenueHumidorOrderConfirmation.jsx`). Both new, additive routes in
`App.jsx` — no existing route touched.

## Checkout quote result

`getCheckoutQuote()` computes subtotal from the real stored
`product.price_cents × hold.quantity` (never a client-submitted
price), tax via the real, pre-existing `taxCalculationEngine.js`,
hold-expiration from the real stored `expires_at`, fulfillment options
from real venue configuration, and an honest `paymentAvailable: false`
/ "Payment processing not connected" note. Verified live in
`01-checkout-order-api-results.json` section 1.

## Fabricated-price rejection result

A checkout/order-creation request body containing a fabricated client
`{ subtotalCents: 1, taxCents: 0, totalCents: 1, price: 0.01 }` is
completely ignored — the server-computed real total persists
unchanged. Verified live in `01-checkout-order-api-results.json`
section 2.

## Expired-hold result

An expired hold is honestly rejected (`expired_hold`) at both quote
and order-creation time, verified against the real stored
`expires_at`, never a client-side-only check. Stale, wrong-user, and
wrong-venue holds are likewise rejected. Verified live in
`01-checkout-order-api-results.json` sections 3-4.

## Pending-payment result

A freshly created order always starts `status = 'pending_payment'`,
`payment_status = 'pending_staff_confirmation'` (or
`'pending_pos_confirmation'` for POS-tab fulfillment) — never marked
paid at creation, never a fabricated transaction id. Verified live in
`01-checkout-order-api-results.json` section 5.

## Unsupported-integration result

Creating an order with an unsupported fulfillment method (new POS
tab) is honestly rejected `409 unsupported_fulfillment_method`, never
a fabricated success — matching the same honest-boundary pattern
established for "Add to Venue Tab" in 1B-1. Verified live in
`01-checkout-order-api-results.json` section 6.

## Duplicate-order result

Duplicate order creation (same idempotency key), rapid double-click,
and a genuine two-tab race all resolve to exactly one real order row.
The two-tab race exposed and closed a real ordering defect (SC-D066).
Verified live in `01-checkout-order-api-results.json` sections 3-4.

## Completion result

Staff-authorized completion succeeds and transitions the order to
`completed` / `payment_status: confirmed`; a non-staff customer cannot
complete their own order. Verified live in
`01-checkout-order-api-results.json` sections 8-9.

## Inventory-once result

Physical inventory decreases by exactly the ordered quantity on
completion, never at order-creation time, and a repeated completion
call is idempotent (returns the identical original order, never
re-deducts). Verified live in `01-checkout-order-api-results.json`
sections 8 and 10.

## Cancellation/restoration result

Cancelling a pending order releases its hold and restores real
available quantity. This test exposed and closed a real double-sell
defect (SC-D065): converted holds were not counting against
availability. Duplicate cancellation is idempotent (never errors or
double-restores). Verified live in `01-checkout-order-api-results.json`
sections 11-12.

## Order-confirmation browser result

`VenueHumidorOrderConfirmation.jsx` renders a real server-issued order
number, honest `Pending Confirmation` status (never a fabricated
"purchase successful"), real fulfillment/notes/total/created time, and
correctly persists across reload. Verified live:
`02-checkout-browser-results.json`, 16/16.

## Defects found and fixed

- **SC-D065** — `computeAvailableQuantity()` only counted `active`
  holds, so a converted hold (a real, unpaid pending order) stopped
  counting against available inventory, enabling a real double-sell.
  Closed by counting `status IN ('active', 'converted')` and widening
  `releaseHold()`'s allowed from-statuses to include `'converted'`.
- **SC-D066** — `createOrderFromHold()` validated hold status before
  checking the idempotency key, so a genuine two-tab race produced a
  fabricated `stale_hold:converted` error for the losing request
  instead of deduping. Closed by locking the hold, rechecking the
  idempotency key in-lock first, then validating hold status.

See `docs/smokecraft/SMOKECRAFT_SYSTEM_DEFECT_REGISTER.md` (Venue
Humidor 1B-2A update) for full detail.

## Tests and build

- `verify-smokecraft-venue-humidor-1b2a-api.mjs`: 30/30
- `verify-smokecraft-venue-humidor-1b2a-browser.mjs`: 16/16
- `scripts/validateSmokecraftVenueHumidorCheckoutAuthority.mjs`: 27/27
- `verify-smokecraft-venue-humidor-1a-api.mjs` (regression): 32/32
- `verify-smokecraft-venue-humidor-1b1-api.mjs` (regression): 32/32
- `verify-smokecraft-venue-humidor-1b1-browser.mjs` (regression): 23/23
- `npm run build` (full prebuild validator chain + Vite build): succeeded

## Proof path

`public/proof/smokecraft-venue-humidor-1b-2a/`

## What this pass does NOT cover

Staff inventory administration, the full staff fulfillment queue,
simulated card payment, real payment processing — explicitly out of
scope per mandate. A full five-viewport sweep was regenerated only
because `npm run build`'s own prebuild gate requires an up-to-date
route-count-matched inventory (not run as new targeted 1B-2A scope).

## Venue Humidor 1B-2B handoff

Venue Humidor 1B-2B: staff inventory administration screens
(receiving, adjustments, reservation/order approval queue) and the
full staff fulfillment queue, built on the server-authoritative,
venue-isolated, idempotent checkout/order/hold-conversion foundation
closed in this pass. `checkoutService.completeOrder()` and
`cancelOrder()` are already the sole, superset completion/cancellation
path for every `venue_cigar_orders` row (both bare 1A orders and
hold-linked 1B-2A checkout orders) — 1B-2B's staff queue should call
those same functions rather than duplicating completion/cancellation
logic. Real payment processing integration remains unconnected; when
it is added, it should set `payment_status = 'confirmed'` and invoke
the existing `completeOrder()` rather than inventing a second
completion path.
