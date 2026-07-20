# SmokeCraft Management Sync — Destination Status Audit (Phase 10)

| Destination | Existing service | Existing endpoint | Existing table | Auth | Venue scope | Write behavior | Audit logging | Idempotency | Production readiness | Classification |
|---|---|---|---|---|---|---|---|---|---|---|
| Internal venue analytics (Management Sync itself) | none (this package designs it) | none | none (Phase 3/4 proposes new tables) | n/a | n/a | n/a | n/a | n/a | not built | **NOT CONNECTED** |
| E.A.T. 360 | `server/services/smokecraft/smokecraftEatSyncBridgeService.js` | `eatSmokeCraftLiveSyncRoutes.js` | none (in-memory `_syncEventLog` only) | none enforced | none | no real write (`connected: false` hardcoded) | in-memory only, not persisted/queryable | none | not production-ready, self-documented preview stub | **NOT CONNECTED** |
| POS360 | `pos360SmokeCraftOrderBridgeRoutes.js` | yes (order-bridge scope) | migration 070 tables | not audited this pass | order/venue scope, not journey-analytics scope | real for order events; not applicable to journey sync | not audited this pass | not audited this pass | production-ready for its own (order-bridging) purpose; **not applicable** to Management Sync's data | **NOT CONNECTED** (for Management Sync specifically — this destination is out of scope, not "broken") |
| NOVEE OS | broad platform services (tenant/venue governance) | many, general-platform | migrations 049/060-067 etc. | yes, platform-level | platform-wide | real for platform administration | yes, platform-level | not audited | production-ready for platform ops; no journey-analytics feed exists | **NOT CONNECTED** (no SmokeCraft journey feed exists into it) |
| Inventory intelligence | `ticket_tapper_inventory` (specials/menu inventory only) | `smokecraftTicketTapperSpecialsRoutes.js` | migration 017 | none enforced client-side | venue-scoped | real for specials inventory | `ticket_tapper_management_audit_log` (migration 071) | not confirmed | production-ready for specials, not for cigar/humidor inventory | **NOT CONNECTED** (wrong inventory domain for Management Sync's cigar-humidor use) |
| Staff handoff | none found | none | none | n/a | n/a | n/a | n/a | n/a | not built | **NOT CONNECTED** |
| Guest-profile intelligence | Passport 360 persistence (migration 068) | `passport360SmokeCraftRoutes.js` | `passport_360_*` tables | not fully audited this pass | venue-scoped (`venue_id` column, though with a default-value anti-pattern) | real, persisted | not confirmed | `dedupe_key` unique index (real) | production-oriented for Passport module specifically | **WIRED BUT DISABLED** for Management Sync purposes — real infrastructure exists for a *related* module (Passport), not yet confirmed or wired as SmokeCraft Management Sync's guest-profile source |

No destination above is claimed LIVE AND VERIFIED for Management Sync
specifically, because none currently receives a real Management Sync
write — this is consistent with, and does not contradict, the fact that
some of these same services (POS360, NOVEE OS platform ops, Ticket
Tapper) are legitimately production-ready **for their own, different
purposes**.
