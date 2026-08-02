# Checkout Eligibility Enforcement

## What changed

`server/controllers/complianceController.js` gains
`evaluateCheckoutEligibility({subjectType, subjectId, jurisdictionCode, fulfillmentMethod, locale})`
— the single, server-authoritative function the Venue Humidor checkout
path now calls before any order row is written. Reuses the existing
`evaluatePurchaseEligibility` unmodified, then additionally checks
current Terms/Privacy/tobacco-warning acceptance and jurisdiction
fulfillment rules.

`server/services/venueHumidor/checkoutService.js` `createOrderFromHold()`:
removed the trusted client `ageVerified` boolean entirely. Now derives
`jurisdictionCode` from the venue's `state` column (`US-<STATE>`, falling
back to `US-DEFAULT`) and the compliance subject identity from the
server-verified `actorRef` (`user:<id>` → `{subjectType:'user'}`, bare
guest id → `{subjectType:'guest'}`), then calls
`evaluateCheckoutEligibility()`. On denial: `throw new CheckoutError(eligibility.reason)`
— thrown **before** the hold is locked, before any DB write.

`getCheckoutQuote()` runs the same evaluator **read-only** and returns
`complianceEligible`/`complianceState`/`jurisdictionCode` in the quote so
the checkout UI can show an honest pre-order state.

`server/controllers/venueHumidorCheckoutController.js`: error-code map
extended with the full required denial vocabulary → HTTP status:
`age-verification-required` (403), `age-verification-expired` (403),
`jurisdiction-unsupported` (403), `terms-acceptance-required` (403),
`privacy-acknowledgement-required` (403), `warning-acknowledgement-required` (403),
`fulfillment-method-prohibited` (409), `shipping-prohibited` (409),
`staff-verification-required` (403, reserved for a future staff-required
jurisdiction rule — not currently triggered by any seeded jurisdiction).

## Eligibility state diagram

```
                         ┌────────────────────┐
                         │  checkout attempt   │
                         └─────────┬────────────┘
                                   ▼
                    jurisdiction active + tobacco_sales_allowed?
                     no ──────────────────────────► jurisdiction-unsupported (403)
                     yes
                                   ▼
                   valid, unexpired age_verification_records row
                   (result='approved') for subject+jurisdiction?
                     none ever ───────────────────► age-verification-required (403)
                     expired ──────────────────────► age-verification-expired (403)
                     yes
                                   ▼
                   current Terms policy_versions row accepted?
                     no ───────────────────────────► terms-acceptance-required (403)
                     yes
                                   ▼
                   current Privacy policy_versions row accepted?
                     no ───────────────────────────► privacy-acknowledgement-required (403)
                     yes
                                   ▼
                   current tobacco_warning policy_versions row accepted?
                     no ───────────────────────────► warning-acknowledgement-required (403)
                     yes
                                   ▼
                   fulfillmentMethod allowed for jurisdiction?
                     shipping & !shipping_allowed ──► shipping-prohibited (409)
                     other & !allowed ─────────────► fulfillment-method-prohibited (409)
                     yes
                                   ▼
                            eligible-for-checkout
                    (hold lock → order INSERT → payment intent allowed)
```

## Denied-checkout proof — real HTTP responses, no hold/order/payment-intent

From `verify-smokecraft-compliance-checkout-enforcement-api.mjs`, section 2:

```
── 2. Age-verification-required denial (never verified) ──
  PASS  Denied with age-verification-required
  PASS  No order was created — the hold is still active/quotable
  PASS  No hold-conversion / order row exists in the DB for the denied hold
```

Real response:
```json
{ "success": false, "error": "age-verification-required" }
```
HTTP 403. Direct DB check after denial: `SELECT count(*) FROM venue_cigar_orders WHERE hold_id = '<hold>'` → `0`.

Section 7 (shipping):
```json
{ "success": false, "error": "shipping-prohibited" }
```
HTTP 409 — `US-DEFAULT.shipping_allowed = false` (shipping disabled by
default, unchanged from Package 6).

## Successful-checkout proof

Section 1 of the same suite:
```
── 1. Fully eligible checkout succeeds ──
  PASS  Quote reports complianceEligible:true once fully eligible
  PASS  Order creation succeeds for a fully eligible customer
```
Quote response includes `"complianceEligible": true, "complianceState": "eligible-for-checkout"`.
Order response includes the real server-computed `subtotal_cents`/`tax_cents`/`total_cents`
and `payment_status: "pending_staff_confirmation"` — never a fabricated
"paid" state (matches existing Package 2 payment-gateway behavior,
unmodified).

## Full regression on the checkout path

`verify-smokecraft-venue-humidor-1b2a-api.mjs`: 31/31 (including a
rewritten section 7 proving a fabricated client `ageVerified: true` is
now ignored and the server-side denial is authoritative).
`verify-smokecraft-real-payment-gateway-api.mjs`: 40/40.
`verify-smokecraft-real-payment-gateway-browser.mjs`: 19/19 (real
browser, compliance bootstrapped via `/api/compliance/whoami` +
age-verification + policy acceptance before order creation — see
doc 43 for the full regression list).
