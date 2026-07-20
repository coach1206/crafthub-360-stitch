# SmokeCraft Management Sync — Integration Registry

Source of truth: `server/services/managementSync/integrationRegistry.js`.
The browser never defines connection state — every value in this
document is either a static, evidence-backed classification or the
output of a real, live server-side check made fresh on every request.

| Key | Display Name | Type | Venue Scoped | Package Dependency | Real-time Check |
|---|---|---|---|---|---|
| `internal_management_sync` | Internal Management Sync | internal | yes | none | Real `SELECT 1 FROM smokecraft_management_sync_journeys` |
| `ticket_tapper` | Ticket Tapper | internal | yes | none | Real `SELECT 1 FROM ticket_tapper_specials` |
| `passport_360` | Passport 360 | internal | yes | none | Real `SELECT 1 FROM passport_360_guest_profiles` (existence only — classification is `INTERNAL_ONLY` regardless, since no write path exists) |
| `staff_handoff` | Staff Handoff | internal | yes | package_6 | Static (no destination exists to check) |
| `inventory` | Inventory Management | internal | yes | package_6 | Static (no destination exists to check) |
| `pos360` | POS360 | external | yes | package_7 | Static (real module, no Management Sync bridge to check) |
| `eat_360` | E.A.T. 360 | external | yes | package_7 | Static (confirmed non-functional stub, nothing to check) |
| `novee_os` | NOVEE OS | external | no | package_6 | Static (no SmokeCraft feed exists to check) |

## Full field schema per entry

`key, displayName, destinationType (internal|external), authRequired,
venueScoped (boolean), supportedOperations (array), timeoutMs,
retryPolicy, idempotencyPolicy, auditRequired (boolean), healthCheck
(description of what, if anything, is verified), packageDependency
(null|'package_6'|'package_7')`, plus the connection-state engine's own
added fields at request time: `state`, `message`, and optionally `note`.

## Why 2 of 8 use a live check and 6 use a static classification

A live check is only meaningful when there's a real destination to
query. `internal_management_sync` and `ticket_tapper` both have real
tables backing them — checking is genuine verification. The other 6
have **no real destination at all** (confirmed by code search, not
assumed) — running a "check" against nothing would either always
trivially pass (dishonest) or require inventing a fake target to query
against (exactly what this whole effort has repeatedly refused to do).
The static classification, backed by the documented audit evidence, is
the honest representation for these 6.
