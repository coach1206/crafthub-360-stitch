# Idempotency, Inventory Holds, Webhook Security, Reconciliation

All claims below are exercised by real, passing tests in `verify-smokecraft-real-payment-gateway-api.mjs` (see `04-api-test-results.txt`) — this document explains the mechanism; the test log is the proof of behavior.

## Idempotency (mandate section 7)

| Operation | Mechanism |
|---|---|
| Order creation | Pre-existing `idempotency_key` UNIQUE column + pre-lock/in-lock dedup in `checkoutService.createOrderFromHold()` (unmodified) |
| Payment-intent creation | `venue_cigar_payment_intents.idempotency_key` UNIQUE; `createPaymentIntentForOrder()` also short-circuits on the order's own `active_payment_intent_id` before even checking the key, so a genuinely new idempotency key on an order that already has an open intent still returns the SAME intent rather than creating a second Stripe PaymentIntent |
| Payment confirmation | Owned entirely by Stripe.js client-side (`confirmPayment`) — SmokeCraft's server never independently "confirms"; it only ever reacts to the resulting webhook |
| Webhook processing | `venue_cigar_payment_webhook_events` UNIQUE `(provider, provider_event_id)` — `INSERT ... ON CONFLICT DO NOTHING RETURNING *`; an empty return means "already processed", handled BEFORE any side effect runs |
| Inventory mutation | Delegated 100% to the pre-existing `applyInventoryEvent()`'s own idempotency key (`stripe-webhook-complete-${orderId}-item-${orderItemId}`, generated deterministically from the order, not the webhook event — a duplicate webhook re-calls `completeOrder()`, which itself no-ops because `order.status` is already `'completed'`, before `applyInventoryEvent` is even reached a second time) |
| Hold release | `inventoryService.releaseHold()`'s own idempotent `transitionHold()` (unmodified) — a hold already `'released'` is a safe no-op |
| Refund creation | `venue_cigar_payment_refunds.idempotency_key` UNIQUE + Stripe's own `idempotencyKey` request option passed straight through to `refunds.create()` |
| Cancellation | Delegated to the pre-existing `checkoutService.cancelOrder()`'s own idempotency key |
| Receipt creation | Receipts are read-derived (no write), so there is no receipt "creation" race to protect — `GET /orders/:orderId/receipt` (pre-existing, unmodified) |

Verified scenarios (real, in `verify-smokecraft-real-payment-gateway-api.mjs`): duplicate payment-intent request (same key) → deduplicated, not a second Stripe PaymentIntent; duplicate webhook (same event id) → deduplicated, inventory NOT decremented twice; out-of-order webhook (`processing` arriving after `succeeded`) → safely ignored, state not regressed; duplicate refund request → deduplicated; repeated reconciliation run → no duplicate inventory effect.

## Inventory holds and oversell prevention (mandate section 6)

Nothing about inventory holds was changed by this package — `inventoryService.js` (migration 106) is untouched. What this package adds is the correct REACTION to payment outcomes on top of the existing hold lifecycle:

- Hold is `'converted'` at order-creation time (pre-existing) — it already keeps consuming quantity (`computeAvailableQuantity` counts `'active'` and `'converted'` holds) so the same stick can never be sold twice while payment is pending.
- **Payment failure/cancellation** → this package's webhook handler calls the pre-existing `checkoutService.cancelOrder()`, which calls the pre-existing `inventoryService.releaseHold()` (already handles the `'converted'` → `'released'` transition) — verified live: "failed payment cancels order and releases hold", "hold released after payment failure (available again)".
- **Payment success** → this package's webhook handler calls the pre-existing `checkoutService.completeOrder()`, which is the ONLY call site anywhere that invokes `inventoryService.applyInventoryEvent()` for a real sale — verified live: "inventory decremented via canonical inventoryService exactly once", and NOT decremented twice on a duplicate webhook.
- Oversell prevention itself is enforced by the pre-existing `createHold()`'s in-lock `computeAvailableQuantity` check — verified live: "oversell prevented at hold creation (insufficient_inventory)".

## Webhook security (mandate section 8)

- **Raw-body verification**: `app.post('/api/smokecraft/venue-humidor/payments/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook)` is mounted in `server/index.js` BEFORE the global `express.json()` parser — the exact raw bytes Stripe signed are what reach `stripe.webhooks.constructEvent()`.
- **Signature validation**: performed inside the adapter (`constructWebhookEvent`), never by string-matching the payload manually. Verified live: "invalid webhook signature rejected, never processed".
- **Timestamp tolerance / replay protection**: delegated to Stripe SDK's own `constructEvent`, which enforces its default 5-minute tolerance window — SmokeCraft never re-implements clock-skew logic.
- **Event-ID dedup**: `venue_cigar_payment_webhook_events` UNIQUE `(provider, provider_event_id)`, checked before any processing.
- **Never trusts client-forwarded webhook data**: the webhook route has no authentication middleware and accepts requests only at its raw-body-parsed path; a client cannot reach `processStripeEvent()` except by producing a Stripe-signed payload, verified against `STRIPE_WEBHOOK_SECRET` (or the test-only injected secret in mocked tests).
- **Never processes an unsigned payload**: a `constructWebhookEvent` throw short-circuits before the append-only insert even happens.
- **Safe failure response**: signature failures return `400` (no retry — the payload will never verify); genuine processing errors return `500` (Stripe retries, which is the desired behavior for a transient DB error) — see `handleStripeWebhook` controller.
- **Provider/environment separation**: `provider_mode` (`live`/`test`/`mocked_adapter_boundary`) is stored on every payment intent row, so live and test-mode payments are never ambiguous in the data itself.

## Reconciliation (mandate section 9)

`paymentService.runReconciliation()` — callable both by an admin route (`POST /venues/:venueId/admin/payments/reconcile`, `manager`/`owner`/`admin` RBAC) and suitable for a scheduled job (same function, `triggeredBy: 'scheduled'`):

1. Selects every local `payment_intent` still in a non-terminal state (`payment_pending`/`requires_customer_action`/`processing`) older than 2 minutes.
2. Calls `adapter.retrievePaymentIntent()` — the REAL provider status.
3. If the provider says `succeeded` but local state isn't `paid` → repairs by calling the SAME `completeOrder()` idempotent path the webhook handler uses (never a second, parallel completion mechanism).
4. If the provider says `canceled` but local state isn't → repairs via the same `cancelOrder()` idempotent path.
5. Records every run (checked/found/repaired counts + discrepancy detail) in `venue_cigar_payment_reconciliation_runs` for admin visibility.

Verified live: "reconciliation finds and repairs stale local state", "reconciliation repair completes the order via the same canonical path", "repeated reconciliation has no duplicate inventory effect".
