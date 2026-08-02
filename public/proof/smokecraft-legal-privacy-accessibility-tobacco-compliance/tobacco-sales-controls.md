# Tobacco Sales Controls

Enforced server-side via `compliance_jurisdictions` + `evaluatePurchaseEligibility()`:

- Minimum legal age: `compliance_jurisdictions.min_purchase_age`, checked against the caller's latest approved, unexpired age verification.
- Venue jurisdiction: every eligibility check requires an explicit `jurisdictionCode`; there is no "default to permissive" path — an unknown or inactive jurisdiction denies (`jurisdiction_not_active` / `unknown_jurisdiction`).
- Permitted fulfillment method: `checkFulfillmentEligibility()` looks up `shipping_allowed` / `venue_pickup_allowed` / `in_venue_allowed` / `local_delivery_allowed` per jurisdiction — none are hardcoded true.
- Quantity limits: `compliance_jurisdictions.quantity_limit_per_order` column exists and is read by the config surface; no jurisdiction has a limit configured yet (`NULL` = "not yet configured", not "unlimited by policy" — flagged in counsel-review-items.md as needing a real per-jurisdiction limit before launch).
- Prohibited/unavailable products, tax treatment, refund/return restrictions: these are governed by the existing Package 2 (Stripe payment gateway) and tax-compliance engine (`verifyTaxComplianceEngine.js`) from earlier phases — this package does not duplicate that logic, it adds the jurisdiction-eligibility gate in front of it.
- Staff verification + receipt disclosures + warning language: see `age-gating.md`, `warning-framework.md`, `payment-disclosures.md`.
- No unsupported interstate/cross-border shipment: shipping is `false` by default for every jurisdiction including `US-DEFAULT`; enabling it requires an explicit admin update to `compliance_jurisdictions.shipping_allowed`, which is itself RBAC-gated (admin only) and audit-logged (`jurisdiction_rule_change`).
