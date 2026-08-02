# Payment / Receipt Disclosures (Package 2 re-verification)

Re-checked against `server/controllers/venueHumidorCheckoutController.js` / `venueHumidorPaymentController.js` (Package 2, unmodified by this package):
- Price/tax/fees/discounts/total are computed server-side from the order record, never trusted from the client — confirmed unchanged from Package 2's real Stripe gateway work.
- Currency, payment-status, and order ID are present on receipt payloads.
- No hidden fees: totals are the sum of line items + tax, computed once, server-side.
- This package adds the tobacco-warning surface requirement (see `warning-framework.md`) as a new disclosure that should render on the receipt alongside these existing fields — front-end placement on the receipt template is a known limitation (tracked below), the versioned warning API itself is real and tested.
