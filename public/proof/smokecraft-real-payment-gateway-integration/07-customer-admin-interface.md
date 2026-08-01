# Customer and Admin Interface (mandate sections 14/15)

## Customer interface — `src/pages/smokecraft/venueHumidor/VenueHumidorPaymentPanel.jsx`

Wired into the pre-existing `VenueHumidorOrderConfirmation.jsx` for any order still in `pending_payment` status. Honest state machine (`HONEST_STATE_COPY`), each backed by a real server response, never a client guess:

| Panel state | Trigger | Copy shown |
|---|---|---|
| `checking` | Initial mount, before `publishable-key-status` responds | "Checking payment availability…" |
| `unavailable` | No Stripe keys configured OR provider create call fails with `stripe_not_configured` | "Payment processing is not connected. Please see staff to complete payment." (matches the pre-existing honest fallback copy already used in `getCheckoutQuote()`'s `paymentNote`) |
| `creating_intent` | Payment-intent POST in flight | "Preparing secure payment…" |
| `requires_customer_action` | Real client secret returned — Stripe Elements mounted | "Enter your payment details below." |
| `processing` | `stripe.confirmPayment()` in flight / server processing | "Processing your payment…" |
| `paid` | Server's OWN `payment-status` poll reports `paid` (never set by the client confirming payment itself) | "Payment received. Thank you." |
| `failed` | Server-reported `failed`, or a Stripe.js confirm error | "Payment failed. You may retry with a different payment method." + Retry button |
| `canceled` | Server-reported `canceled` | "This payment was canceled." + Retry button |

**The client never declares an order paid.** `handleConfirm()` calls `stripe.confirmPayment({ elements, redirect: 'if_required' })` and then immediately starts polling `GET /orders/:orderId/payment-status` — it does NOT set `panelState('paid')` itself on a successful `confirmPayment()` call; only a server response with `paymentState === 'paid'` (itself only ever written by a verified webhook) does. See `startPolling()`.

No sensitive card data is stored or handled by this component or any server code — Stripe's hosted `PaymentElement` iframe owns all card-field DOM and network traffic.

## Admin interface — `src/pages/smokecraft/venueHumidor/admin/VenueHumidorAdminPayments.jsx`

Five backend-connected tabs, each calling a real route (no dead controls, no fake success states):

1. **Payments** — `GET /admin/payments` (filterable by payment state) — every field is a real DB column.
2. **Refund** — `POST /admin/orders/:orderId/refund` — real result rendered (`succeeded`/`failed`, amount, dedup notice); route requires `owner`/`admin`/`manager`.
3. **Webhook Events** — `GET /admin/payments/webhook-events` — the real append-only audit ledger, including `signature_verified` and `processing_status` per row.
4. **Disputes** — `GET /admin/payments/disputes` — real dispute records.
5. **Reconciliation** — `POST /admin/payments/reconcile` — triggers the real reconciliation pass and displays its real checked/found/repaired counts.

Route registered at `/smokecraft/admin/humidor/payments` in `src/App.jsx`, alongside the existing `admin/humidor/orders*` routes, reusing the same `useAdminVenueId()` hook and `SmokeCraftScreenShell` conventions as every other Venue Humidor admin screen.
