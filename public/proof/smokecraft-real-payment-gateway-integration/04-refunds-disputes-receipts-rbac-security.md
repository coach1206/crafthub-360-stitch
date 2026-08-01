# Refunds, Cancellations, Disputes, Receipts, RBAC/Isolation, Security

## Refunds / cancellations (mandate section 10)

`paymentService.refundPayment(venueId, orderId, staffId, { amountCents, reason, idempotencyKey })`:

- Requires `payment_state` to be `paid` or `partially_refunded` (`payment_not_refundable` otherwise).
- Amount defaults to the full remaining captured-minus-already-refunded balance; an explicit `amountCents` is validated against that remaining balance (`refund_amount_exceeds_remaining` otherwise) — both full and partial refunds are the same code path.
- Real Stripe `refunds.create()` call through the adapter boundary; on provider failure, a `'failed'` row is recorded (never silently dropped).
- `amount_refunded_cents` accumulates; `payment_state` becomes `'partially_refunded'` or `'refunded'` depending on whether the cumulative refunded amount reaches the captured amount.
- **Duplicate-refund protection**: `idempotency_key` UNIQUE — verified live ("duplicate refund request deduplicated").
- **No silent auto-restock**: this package does not add any inventory-restoration path. The PRE-EXISTING `checkoutService.cancelOrder()` already has an explicit, documented `cancellation_restored` inventory event for a completed-then-cancelled order (migration 106/108, unmodified) — a refund issued through `paymentService.refundPayment()` is a MONEY-only effect; it does not, by itself, touch inventory. A staff member who also wants inventory returned to sellable stock must separately call the existing, explicit `cancelOrder()`/inventory-mutation path — this package introduces no new implicit restock behavior, honoring the mandate's explicit warning against silently returning fulfilled tobacco product to sellable inventory.
- **Staff authorization**: refund route requires `requireVenueRole(['owner','admin','manager'])` — plain `staff` cannot issue a refund (reuses the existing Venue Humidor RBAC tiers, see below).
- **Cancel-before-payment / cancel-while-pending**: unchanged, pre-existing `checkoutService.cancelOrder()` customer/staff routes — verified live ("cancel-before-payment succeeds").

## Disputes/chargebacks (mandate section 11)

`charge.dispute.created/updated/closed` webhooks write to `venue_cigar_payment_disputes` (dispute-opened/updated/won/lost, amount disputed, provider case ID, affected order/venue, timestamps) and flip the linked payment_intent to `payment_state = 'disputed'`. **No automated legal response of any kind is implemented** — the table is read-only from the app's perspective beyond webhook-driven inserts/updates; the admin dashboard's Disputes tab is a read view only.

## Receipts (mandate section 12)

The pre-existing `GET /orders/:orderId/receipt` (migration 112, `venueHumidorPostPurchaseController.js`, unmodified) already builds receipts exclusively from server-canonical `venue_cigar_orders`/`venue_cigar_order_items` columns (venue, order ID, date/time, products, quantities, unit prices, subtotal, tax, total, currency, fulfillment status) — this package adds no second receipt path. The one gap closed here: `order.payment_status` reflects the real payment outcome once `completeOrder()` runs from a verified webhook, so a receipt for a Stripe-paid order now honestly reflects `confirmed` payment status through the exact same pre-existing field. No secret provider data (API keys, raw card data, Stripe internal IDs) is ever included in the receipt payload — confirmed by inspection of `venueHumidorPostPurchaseController.js`'s query (order/order-items columns only).

## Venue isolation / RBAC (mandate section 13)

Every new route reuses the exact pre-existing RBAC primitives — no parallel authorization scheme:

- **Customer routes** (`payment-intent`, `payment-status`) — same `smokecraftGuestIdentity` middleware + `guestRef(req)` ownership check as every other Venue Humidor customer route. `paymentService.createPaymentIntentForOrder()` calls `checkoutService.getOrder(venueId, orderId, actorRef)`, which throws `order_not_owned` for a mismatched customer reference — verified live ("cross-customer payment-intent creation denied") and ("cross-venue payment-intent creation denied", since `getOrder` scopes by `venue_id` too).
- **Staff/admin routes** (`admin/payments`, `admin/orders/:orderId/payment`, `admin/orders/:orderId/refund`, `admin/payments/webhook-events`, `admin/payments/disputes`, `admin/payments/reconcile`) — reuse `requireAuth` + the existing `requireVenueRead`/`requireVenueWrite`/`requireVenueRole(FULL_ACCESS_TYPES)` tiers and `fulfillmentOrderVenueMatch` (the pre-existing cross-venue resource-match guard) from `venueHumidorRoutes.js`, unmodified. Refund and reconciliation specifically require `FULL_ACCESS_TYPES` (`owner`/`admin`/`manager`) — plain `staff` is read-only on payments.
- **No order-ID/payment-intent-ID tampering bypass**: every payment lookup joins through `order_id AND venue_id` (and, for customer routes, `customer_reference`) — a guessed/enumerated ID from another venue or customer never resolves.

## Security (mandate section 17)

- **No secret keys in client**: only `VITE_STRIPE_PUBLISHABLE_KEY` (already-existing `src/lib/stripeClient.js` contract) ever reaches the browser; `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` are read only inside `server/services/payments/stripeAdapter.js` and `paymentService.js`, server-side only.
- **No card data stored**: `VenueHumidorPaymentPanel.jsx` uses Stripe's hosted `PaymentElement` (Stripe Elements) exclusively — card fields render inside a Stripe-controlled iframe; no raw card field is ever bound to component state or sent to SmokeCraft's own server.
- **Provider SDK used correctly**: the official `stripe` npm SDK server-side, `@stripe/stripe-js` client-side (added this pass) — no hand-rolled HTTP calls to Stripe's API.
- **Webhook signatures verified**: see above.
- **Safe logging**: no payment intent/refund/webhook handler logs a raw secret, card number, or webhook payload to `console` — `payload_snapshot` is stored in the DB (audit trail, DB-access-controlled), never `console.log`'d.
- **Env vars validated**: `server/config/envValidator.js` (pre-existing, unmodified) already fails a production boot if `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` are set to an unsafe/placeholder value.
- **Production/test separation**: `provider_mode` recorded per-intent (see above).
- **Authorization on every mutation**: see RBAC section above — every write route has either customer-ownership or staff-RBAC middleware; the webhook route's only "authorization" is a valid Stripe signature, by design (Stripe cannot present a bearer token).
- **Payment amount always server-calculated**: `createPaymentIntentForOrder()` takes no amount argument at all — it is always `order.total_cents`, read from the already-server-computed order row.
- **No SSRF introduced**: the only outbound network calls added are to Stripe's fixed API host via the official SDK — no user-controlled URL is ever fetched.
- **Provider identifiers validated**: `provider_payment_intent_id` is UNIQUE-constrained; lookups are always by this exact value, never string-interpolated into a query.
- **Audit logging**: every payment-affecting event calls `recordVenueHumidorEvent()` (pre-existing, unmodified ledger) — verified live ("payment audit events recorded").
