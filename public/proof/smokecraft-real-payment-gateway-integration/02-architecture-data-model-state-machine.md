# Provider Architecture, Data Model, and State-Transition Map

## Provider decision

**Stripe** — the only provider with any existing config surface, SDK dependency, or naming anywhere in the repository (`server/config/paymentProviderConfig.js`, `src/lib/stripeClient.js`, the `stripe` npm dependency already in `package.json`). No second provider abstraction was built. No live credentials exist in this environment (`STRIPE_SECRET_KEY` unset) — the real adapter/architecture is implemented and env-validated; payment-intent/webhook/refund/reconciliation business logic is proven via deterministic tests that mock **only** the Stripe network call.

## Adapter boundary (mandate section 2/20)

`server/services/payments/stripeAdapter.js` is the **only** module in the codebase that imports/calls the `stripe` SDK.

```
createStripeAdapter({ stripeClient? }) → {
  mode: 'live' | 'test' | 'mocked_adapter_boundary' | 'unknown_format',
  createPaymentIntent(), retrievePaymentIntent(), cancelPaymentIntent(),
  createRefund(), constructWebhookEvent(rawBody, sig, secret),
}
```

- No injected `stripeClient` → constructs the real `Stripe(process.env.STRIPE_SECRET_KEY)` client. `mode` is derived honestly from the key prefix (`sk_live_`/`sk_test_`) — never hardcoded to "live".
- Injected `stripeClient` (test-only) → `mode` is always reported as `'mocked_adapter_boundary'`, and every other module (`paymentService.js`) treats that mode identically to `'test'` for all *business-logic* purposes — the mock only ever replaces the network call, never a decision.
- `isStripeConfigured()` is the single honest gate used by every caller (`createPaymentIntentForOrder`, `handleStripeWebhook`, `refundPayment`, `runReconciliation`) — with no `STRIPE_SECRET_KEY`, every one of these functions throws `stripe_not_configured` rather than fabricating a client secret or a paid state. Verified live in this environment (`03-api-test-results.txt`, "payment-intent creation honestly 503s with no Stripe keys configured").

## Data model (migration 115 — additive only)

All five new tables extend, never duplicate, the existing Venue Humidor order/inventory tables (migrations 106–114).

| Table | Purpose | Key columns |
|---|---|---|
| `venue_cigar_payment_intents` | Canonical real-money payment state, one row per attempt | `payment_intent_id` (PK, UUID), `order_id` (FK), `provider_payment_intent_id` (unique), `payment_state` (11-state enum, CHECK-constrained), `amount_authorized/captured/refunded_cents`, `idempotency_key` (unique), `hold_id` |
| `venue_cigar_payment_webhook_events` | Append-only verified-webhook ledger | `provider_event_id` + `provider` UNIQUE — the dedup key; `signature_verified`, `processing_status`, `payload_snapshot` |
| `venue_cigar_payment_refunds` | One row per refund attempt | `payment_intent_id` (FK), `provider_refund_id` (unique), `amount_cents`, `idempotency_key` (unique) |
| `venue_cigar_payment_disputes` | Chargeback/dispute record | `provider_dispute_id` (unique), `status` (opened/updated/won/lost), `amount_disputed_cents` |
| `venue_cigar_payment_reconciliation_runs` | Audit trail of every reconciliation pass | `discrepancies_found/repaired`, `discrepancy_detail` (JSONB) |

`venue_cigar_orders` gains exactly one new column: `active_payment_intent_id` (FK to `venue_cigar_payment_intents`) — links the order to its live intent without touching the existing `status`/`payment_status` columns from migration 108. Rollback: `server/db/rollbacks/115_smokecraft_venue_humidor_real_payment_gateway.rollback.sql` drops all 5 new tables and the one new column; `venue_cigar_orders` itself, and every pre-existing column, is untouched.

## Canonical payment-state machine (mandate section 4)

```
not_started → payment_pending → requires_customer_action → processing → paid
                                        ↓                       ↓
                                     failed/canceled/expired   disputed
                                                                  ↓
                                                       partially_refunded → refunded
```

Deliberately kept separate from `venue_cigar_orders.status` (draft/pending_payment/completed/cancelled/refunded) and `venue_cigar_orders.payment_status` (the pre-existing staff/POS-confirmation field from migration 108 — `unpaid`/`pending_staff_confirmation`/`pending_pos_confirmation`/`confirmed`/`not_applicable`). A `paid` transition in `payment_state` is what triggers `checkoutService.completeOrder()`, which in turn is what sets `order.status = 'completed'` — the two state machines are linked by one function call, never merged into one column (mandate section 4's explicit instruction).

## Order → payment flow (mandate section 3 sequence, as implemented)

1. Customer selects product → `GET /catalog` (pre-existing, unmodified).
2. Server validates venue/product, computes authoritative price/tax/total → `checkoutService.getCheckoutQuote()` (pre-existing, unmodified).
3. Inventory hold created → `inventoryService.createHold()` (pre-existing, unmodified).
4. Order created `pending_payment`, hold converted → `checkoutService.createOrderFromHold()` (pre-existing, unmodified — this package adds no new argument here; amount is read from THIS row, never recomputed from client input at the payment step).
5. Server creates a real Stripe PaymentIntent → `paymentService.createPaymentIntentForOrder()` (**new**), amount = `order.total_cents` only.
6. Client confirms via Stripe Elements (`VenueHumidorPaymentPanel.jsx`, **new**) — card data never reaches SmokeCraft's server, only Stripe's hosted iframe.
7. Verified webhook (`POST /api/smokecraft/venue-humidor/payments/webhook`, **new**) updates `payment_state`.
8. `payment_intent.succeeded` → `checkoutService.completeOrder()` (pre-existing, reused, unmodified) → inventory mutation via `inventoryService.applyInventoryEvent()` (pre-existing, reused) → fulfillment queue entry, receipt, Passport-acquisition boundary (all pre-existing, reused, unmodified).
9. `payment_intent.payment_failed`/`canceled` → `checkoutService.cancelOrder()` (pre-existing, reused) → hold released.

No step in this sequence lets the client itself declare paid/failed/refunded — every state-changing call in steps 7–9 originates from a server-verified webhook or an authenticated staff action, never a client-submitted status field.
