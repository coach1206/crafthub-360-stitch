# Status Page Plan — Production Package 5

Lightweight plan, not built as a live public page this pass (no hosting decision has been made for a status page and none is needed for internal dogfooding).

## Public information (customer-facing, if/when a public status page exists)
- SmokeCraft app: operational / degraded / outage.
- Checkout/payments: operational / degraded / outage (no numeric error rates, no infra details).
- Media delivery: operational / degraded.
- Passport/rewards: operational / degraded.
- Golden Box: operational / degraded.
- Active incident banner with plain-language description and next-update time (per `incident-severity.md` cadence).
- Scheduled maintenance notices, posted ≥24 hrs ahead when possible.

## Internal-only information (never public)
Specific error rates, DB connection details, provider names, alert thresholds, `/api/admin/ops-status` payload, backup/restore internals.

## Incident-update policy
SEV-1/2 customer-visible incidents get a status-page entry within the response targets in `incident-severity.md`; SEV-3/4 do not unless customer-reported volume suggests wider impact.

## Build target (next package)
A public status page (e.g. a static page hosted on the same platform, hand-updated or driven by a subset of `/api/admin/ops-status`'s data with sensitive fields stripped) is a reasonable Package 6/7 candidate — not built this pass to stay within this package's monitoring/recovery/support scope.
