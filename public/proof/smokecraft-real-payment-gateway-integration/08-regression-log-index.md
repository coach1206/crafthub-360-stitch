# Regression Log Index

This package re-ran the following pre-existing regression suites, unmodified, against the real running server with the new payment-gateway code live, and confirmed no regression:

| Suite | Result |
|---|---|
| `verify-smokecraft-venue-humidor-1b2a-api.mjs` (checkout authority — order/hold/completion/cancellation) | 30/30 PASS |
| `verify-smokecraft-venue-humidor-1b2b1-api.mjs` (inventory admin/events) | 41/41 PASS |
| `verify-smokecraft-venue-humidor-1b2b2-api.mjs` (staff fulfillment queue) | 40/40 PASS |
| `verify-smokecraft-venue-humidor-1b2b4-api.mjs` (customer order history/receipts/Passport) | 29/29 PASS |
| `verify-smokecraft-venue-humidor-media-1-api.mjs` (Production Package 1 — media management) | 30/30 PASS |
| `verify-smokecraft-real-payment-gateway-api.mjs` (this package, new) | 40/40 PASS |
| `verify-smokecraft-real-payment-gateway-browser.mjs` (this package, new) | see `09-browser-test-results.txt` |
| `npm run build` (full prebuild validator chain + Vite build) | see `14-build.log` |
| `verify-smokecraft-hf3-responsive-inventory.mjs` regeneration + `validateSmokecraftResponsive.mjs` | see `14-build.log` / `10-responsive-sweep-summary.md` |
| `scripts/verify-smokecraft-full-game-fresh-player.mjs` | see `11-fresh-player-closure.log` |
| `scripts/verify-smokecraft-final-gameplay-acceptance.mjs` | see `12-final-gameplay-acceptance.log` |

## Real bug found and fixed during this pass (pre-commit)

The initial migration (115) omitted `ON DELETE CASCADE` on `venue_cigar_payment_refunds.order_id`/`.payment_intent_id` and `venue_cigar_payment_disputes.order_id`/`.payment_intent_id`. This surfaced as a real foreign-key violation when the PRE-EXISTING `verify-smokecraft-venue-humidor-1b2a-api.mjs` test's cleanup step tried to delete a test order that a payment-gateway test run had left a refund/dispute row pointing at. Fixed by adding `ON DELETE CASCADE` to all four FKs (migration file corrected + live `ALTER TABLE` applied to match) — confirmed by re-running the affected suite (30/30 PASS) and this package's own suite (40/40 PASS) afterward. `venue_cigar_payment_intents.order_id` already had the correct `ON DELETE CASCADE` from the first draft.
