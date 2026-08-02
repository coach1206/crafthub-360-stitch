# Payment Incident Handling — Production Package 5

All scenarios use the canonical reconciliation tooling already built in Package 2 (`venue_cigar_payment_reconciliation_runs` + its service) — no manual, unauditable edits are permitted anywhere in this pass's support tooling (`supportAdminController.js`'s `ALLOWED_CORRECTIVE_ACTIONS` allowlist does not include any payment-state mutation; payment corrections must go through Package 2's reconciliation path, which already has its own audit trail).

| Scenario | Detection | Resolution path |
|---|---|---|
| Payment pending too long | Order stuck in `pending` past expected webhook SLA | Poll Stripe API directly (Package 2 reconciliation backstop) rather than waiting indefinitely for webhook |
| Webhook delayed | `payment_webhook_failures` alert or gap in `payment_webhook_events` | Stripe auto-retries; reconciliation job catches up once delivery resumes |
| Paid-at-provider-but-unpaid-locally | Reconciliation run flags mismatch | Reconciliation service updates local state FROM the provider (source of truth = Stripe for payment status), fully audited |
| Refunded-locally-but-not-at-provider | Reconciliation run flags mismatch | Investigate — never silently re-trigger; escalate to payments-owner, confirm with Stripe dashboard (external) before any action |
| Duplicate-charge allegation | Customer report or `duplicate_payment_anomaly` alert | See `incident-runbooks.md` — freeze order, reconcile via canonical tool, refund duplicate through the tool (never manual) |
| Disputed payment | Stripe dispute webhook (external) | Logged as `EVENT_TYPE.DISPUTE`; support case opened, evidence gathered per case model |
| Inventory hold not released | Payment failed/abandoned but hold still active | `inventory.hold_expired` metric + scheduled job (Package 4 background jobs) should release; if not, investigate job failure, never manually zero out inventory rows |
| Order paid but fulfillment unavailable | Inventory oversold or venue capacity issue | Support case opened, customer offered alternative/refund per `customer-support.md` resolution codes |

Every one of these, when it requires touching payment data, routes through Package 2's existing reconciliation/audit machinery — this pass intentionally does not build a second, competing payment-mutation path.
