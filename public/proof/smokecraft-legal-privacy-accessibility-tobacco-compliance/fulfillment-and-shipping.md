# Fulfillment / Shipping Policy

`GET /api/compliance/fulfillment-eligibility?jurisdictionCode=...&fulfillmentMethod=...` is the single server-authoritative check. Supported `fulfillmentMethod` values: `shipping`, `venue_pickup`, `in_venue`, `local_delivery`.

Default state (seeded, `US-DEFAULT`): `shipping_allowed=false`, `venue_pickup_allowed=true`, `in_venue_allowed=true`, `local_delivery_allowed=false`. **Shipping is disabled by default everywhere** — this satisfies the mandate's hard requirement and was verified live (see regression-results.md): a shipping-eligibility check against `US-DEFAULT` returns `allowed:false`.

Every denial writes a `shipping_denied` audit event. Enabling shipping for a jurisdiction requires an authenticated admin PATCH to `/api/compliance/jurisdictions/:code`, which is itself audited (`jurisdiction_rule_change`). There is no client-selectable override — the eligibility check reads only from the DB row, never from request body/query fields describing the requester's own claimed jurisdiction eligibility.

**Known limitation**: this endpoint checks jurisdiction-level fulfillment permission; it does not yet perform full destination-address validation (e.g. PACT Act destination-state matching) — that is flagged in `counsel-review-items.md` as required before shipping is ever enabled for a real jurisdiction.
