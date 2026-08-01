# Provider Test-Mode Disclosure and Known Limitations

## Provider test-mode disclosure (mandate section 20 — REQUIRED disclosure)

**No Stripe credentials of any kind (live or test) exist in this environment.** `env | grep -i stripe` and `env | grep -i square` return nothing at every point in this pass, and the live `GET /stripe/publishable-key-status` route reports `readinessStatus: 'stripe_keys_missing'` throughout. This was true at task start and remains true at task end — this package did not add, generate, or request any credential.

Because of this, **no live or Stripe-test-mode payment, refund, webhook, or dispute was ever exercised against Stripe's real API in this pass.** What WAS exercised, and is real:

1. The real, unmodified server-authoritative order/hold/tax/inventory pipeline (via real HTTP requests to the real running server, zero mocking) — order creation, cross-venue/cross-customer denial, oversell prevention, cancellation.
2. `GET /stripe/publishable-key-status` and `POST /.../payment-intent` against the real running server with no keys configured — proving the system fails HONESTLY (503 `stripe_not_configured`) rather than fabricating a client secret or a paid state. This is real, live-server behavior, not a mock.
3. Every payment-specific business-logic assertion (payment-intent creation using the server-computed order total, webhook signature verification, webhook idempotency/out-of-order handling, payment-succeeded → order-completion → inventory-decrement, payment-failure → hold-release, refunds including partial/duplicate, dispute recording, reconciliation repair) — exercised by calling the REAL `paymentService.js`/`checkoutService.js`/`inventoryService.js` business logic directly, with ONLY the Stripe network call substituted via `createStripeAdapter({ stripeClient: fakeClient })` (`server/services/payments/stripeAdapter.js`'s one documented test seam). The fake Stripe client is a deterministic, stateful, minimal reimplementation of exactly the 4 SDK methods the adapter calls (`paymentIntents.create/retrieve/cancel`, `refunds.create`, `webhooks.constructEvent`) — see `verify-smokecraft-real-payment-gateway-api.mjs`'s `makeFakeStripeClient()`. No business-logic function anywhere was mocked.

Every payment_intent/refund/dispute ID produced in this pass is a synthetic `pi_fake_N`/`re_fake_N`/`dp_fake_1` string from the test's own fake client — never a real Stripe object ID. `adapter.mode` is reported and asserted as `'mocked_adapter_boundary'` throughout the test run (never `'live'` or `'test'`), so the system itself never claims a live/test-mode success it did not have.

**If real Stripe test-mode credentials are added to this environment in a future pass**, no code change is required to exercise them for real — `createStripeAdapter()` (no argument) already constructs the real client from `STRIPE_SECRET_KEY`, and `getStripeMode()` will correctly report `'test'` for a `sk_test_...` key.

## Known limitations carried into this package (real, disclosed)

1. **No live/Stripe-test-mode payment was exercised** (see disclosure above) — this is the single largest limitation of this pass and is disclosed, not hidden.
2. **Provider decision is Stripe-only** — no Square/PayPal/other adapter exists; per mandate section 2, only one provider was to be built given none was pre-configured, and Stripe was the only one with any pre-existing project architecture.
3. **Reconciliation is callable, not scheduled** — `runReconciliation()` is wired to a manual admin route; no cron/scheduled-job runner was added in this pass (no existing scheduled-job infrastructure for Venue Humidor was found to hook into safely within scope; adding a new scheduler is out of scope for this package per the mandate's "do not begin ... production infra deployment" boundary).
4. **Card-data collection UI (`VenueHumidorPaymentPanel.jsx`) cannot be visually verified end-to-end with a real Stripe Elements iframe** in this environment (no publishable key) — its honest fallback path (`unavailable` state, matching the pre-existing "Payment processing is not connected" messaging) IS verified live in the browser suite; the Elements-mount code path itself is implemented per Stripe's documented API but only unit-verifiable, not live-browser-verifiable, without a real publishable key.
5. **Dispute automation is intentionally absent** — record-only, per mandate section 11's explicit instruction not to automate legal responses.

## Carried forward, unmodified, from Package 1 (Venue Humidor Media Management) — explicitly out of scope for this pass

- Real object-storage provider not yet configured (media still serves from local dev disk).
- Image-resize pipeline not active.
- External licensed-image imports not exercised.
- Admin drag-reorder/CSV screens remain API-only (no dedicated drag-and-drop UI).

## Defect handling

No genuinely pre-existing runtime defect requiring a new defect number (SC-D069) was found during this pass's discovery or regression testing. One implementation mistake was caught and fixed BEFORE commit (the oversell-prevention test initially targeted the wrong hold-creation endpoint — a test-authoring error, not a product defect; corrected in `verify-smokecraft-real-payment-gateway-api.mjs` before this proof was written). Per mandate section 24, this does not warrant a new defect number.
