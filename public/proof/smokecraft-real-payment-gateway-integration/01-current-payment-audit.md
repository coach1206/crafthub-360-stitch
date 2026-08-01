# Current-Payment Audit (Discovery, before this pass)

## What existed before this package

- **Checkout authority** (`server/services/venueHumidor/checkoutService.js`, migration 108) already computed price/tax/total server-side from the real product row and the real tax engine (`server/services/tax/taxCalculationEngine.js`), created a real `venue_cigar_orders` row in `pending_payment` status, and converted the customer's inventory hold — but there was **no real payment provider integration**. `getCheckoutQuote()` returned a hardcoded `paymentAvailable: false, paymentNote: 'Payment processing not connected'`.
- Order completion (`completeOrder()`) was reachable only through **staff/POS manual confirmation** (`POST /venues/:venueId/orders/:orderId/complete`, RBAC-gated to venue staff) — there was no path from a real customer card payment to order completion. This is the exact gap Package 2 closes.
- `server/config/paymentProviderConfig.js` already existed as an honest env-driven readiness reporter (`getStripeReadiness()`/`getPaymentProviderConfig('stripe')`) — it never fabricated readiness and already named Stripe as the intended provider (required env vars: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_CONNECT_CLIENT_ID`). No other provider (Square, PayPal, etc.) had any SDK import, config surface, or route anywhere in the codebase — confirmed by repo-wide grep before writing any code. **One canonical provider decision: Stripe, already implied by the existing config surface — no second provider was built.**
- `src/lib/stripeClient.js` already existed as the honest frontend publishable-key helper — confirms the frontend/backend key-separation boundary (`VITE_STRIPE_PUBLISHABLE_KEY` client-side only) was already the intended architecture; it had no caller anywhere in the app before this pass.
- The `stripe` npm package (v22.3.0) was already a `package.json` dependency but was not imported by any file in the repository before this pass — findings confirmed via `grep -rl "from 'stripe'"` returning nothing prior to this package's new `stripeAdapter.js`.
- No webhook route, webhook table, payment-intent table, refund table, dispute table, or reconciliation process existed anywhere in the schema or routes before migration 115.
- `inventoryService.applyInventoryEvent()` (migration 106) was already the sole inventory-mutation primitive, already idempotent, already transactional, already reused by every existing mutation path (receiving, sale, cancellation-restore). This package adds **zero** new inventory-mutation call sites outside of the existing `checkoutService.completeOrder()`/`cancelOrder()` — no second inventory ledger.
- `venueHumidorEventService.recordVenueHumidorEvent()` (migration 108, reusing `smokecraft_progression_events`) was already the canonical, append-only, idempotent Venue Humidor audit log. This package adds 5 new canonical event types to its existing whitelist (`venue_humidor_payment_intent_created`, `_payment_succeeded`, `_payment_failed`, `_payment_refunded`, `_payment_disputed`) rather than creating a second audit log.
- Passport-acquisition-on-fulfillment (`checkoutService.completeOrder()`'s `venue_cigar_passport_acquisitions` insert, migration 111) already existed as the sole, idempotent, unique-constrained acquisition-write path, gated strictly to real order completion. This package does not touch it — payment success reaches Passport acquisition exclusively by calling the SAME `completeOrder()` function a verified webhook now also triggers.

## Exact production gaps identified (closed by this package)

1. No real PaymentIntent creation against a real provider — closed by `paymentService.createPaymentIntentForOrder()` + `stripeAdapter.js`.
2. No webhook route/signature verification/event dedup — closed by the raw-body-mounted `/api/smokecraft/venue-humidor/payments/webhook` route + `paymentService.handleStripeWebhook()`.
3. No canonical payment-state machine separate from the existing staff-confirmation `payment_status` column — closed by `venue_cigar_payment_intents.payment_state` (migration 115), the 11-state machine from mandate section 4.
4. No refund/cancellation-after-payment path — closed by `paymentService.refundPayment()`.
5. No dispute recording — closed by the `charge.dispute.*` webhook handlers + `venue_cigar_payment_disputes`.
6. No reconciliation process — closed by `paymentService.runReconciliation()` + admin-triggerable route.
7. No customer-facing payment UI — closed by `VenueHumidorPaymentPanel.jsx` (Stripe Elements, honest states) wired into the existing `VenueHumidorOrderConfirmation.jsx`.
8. No staff/admin payments visibility — closed by `VenueHumidorAdminPayments.jsx` + its 6 backend-connected routes.

## Single-authority confirmation

Only one payment system claims authority at any point: **canonical payment state lives exclusively in `venue_cigar_payment_intents.payment_state`, written only by `paymentService.js`, which itself never mutates inventory or order status directly — it always delegates to the pre-existing `checkoutService.completeOrder()`/`cancelOrder()`.** The pre-existing `venue_cigar_orders.payment_status` (staff/POS confirmation workflow, migration 108) is left untouched in meaning and is not overloaded — per mandate section 4, the two are deliberately kept separate. No second, competing order or inventory ledger was created. This satisfies the mandate's stop condition check ("more than one payment system claims authority") — it does not apply here.
