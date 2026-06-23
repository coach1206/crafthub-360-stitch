# Production Lockdown — Phase 6: Multi-Device Backend Bridge Lockdown Report

## A. Executive Summary

This phase audited whether `pos3IntegrationRoutes.js` (the "backend bridge"
identified in Phase 5 as the top next-step recommendation) can be wired to
the frontend to make POS3 ↔ E.A.T. communication cross-device instead of
same-browser-localStorage-only.

**Finding: it cannot, safely, as literally instructed — because that
bridge is not what Phase 5's recommendation assumed it was.**

`pos3IntegrationRoutes.js` / `pos3IntegrationService.js` /
`eatPos3BridgeService.js` are a **third-party POS provider adapter
framework** — built to eventually connect to real external systems
(Clover, Toast, Square, Shopify, Lightspeed, NCR, Oracle MICROS). Of those
8 registered providers, 7 require real API credentials that are not
configured in this environment (`liveReady: false`). The only provider
that is `liveReady: true` is `prototype`, and `prototypeProvider.js` is
explicitly self-documented as static, hardcoded demo data ("Fully
functional demo data for the NOVEE Grand Lounge... No API calls. No
credentials needed.") — a fixed menu, fixed staff list, and fixed tables
with hardcoded order-ID references (`'ord-001'`, etc.).

This bridge has **no relationship to this app's own internal POS3
order/ticket/queue system** (`src/services/pos3/pos3Service.js`,
`kitchenQueueService.js`, `barQueueService.js`, `humidorQueueService.js`,
`receiptService.js`), which is the system actually used by guests and
staff and the one E.A.T.'s kitchen/bar/humidor/ops pages read from.
Confirmed via grep: there is no backend route, controller, or database
table anywhere in `server/` for this internal system's real tickets,
tables, or queues. The Postgres tables that *do* exist for POS3
(`pos3_normalized_orders`, `pos3_provider_events`, etc., from migration
`004_pos3_provider_prep.sql`) are keyed by `provider`/`provider_order_id`
and exist to receive **normalized data from a real external POS
provider**, not to receive writes from this app's own ticket system.

Wiring E.A.T.'s frontend to call `GET /api/pos3/prototype/orders/active`,
`/tables`, etc. — as the task's literal instructions describe — would
make E.A.T. display the same hardcoded demo records (`'ord-001'`,
fixed table statuses) regardless of what is actually happening at any
real table, on any device. That would be a fake multi-device-sync
appearance over static data, which directly violates this phase's own
explicit rules ("No fake backend claims," "Do not invent fake sync
success"). **No such wiring was implemented.**

A second, unrelated client-side-only mock layer was also found and ruled
out: `src/services/pos3/posSyncService.js` ("External POS Integration
Hub") normalizes bundled *sample* adapter data and writes it to
`localStorage['pos3:integrations:normalized:*']` — it is explicitly
documented as never making real network calls and is a separate concern
from both the real internal ticket system and the backend bridge.

**No frontend or backend code was changed this phase.** The existing,
working same-browser localStorage flow (`pos3:tickets`, `pos3:tables`,
`pos3:kitchenQueue`, `pos3:barQueue`, `pos3:humidorRequests`) remains
completely untouched, per the explicit rule "Do not remove localStorage
fallback unless backend is fully confirmed" — here, no backend exists
for this specific data at all, so removing or bypassing the fallback was
never an option.

## B. Existing Backend Bridge Endpoints

`pos3IntegrationRoutes.js` (mounted with 3 sibling routers: `eatFeedRouter`,
`syncRouter`, `founderPosRouter`), all behind `requireAuth` + role
middleware except the webhook:

| Route | Method | Min role | Purpose |
|---|---|---|---|
| `/providers` | GET | admin | List the 8 registered third-party adapters + their config/credential status |
| `/:providerKey/test-connection` | POST | admin | Validate stored credentials for a provider (no real network call in `prototype`) |
| `/:providerKey/status` | GET | manager | Provider connection status |
| `/:providerKey/locations` | GET | manager | Provider locations |
| `/:providerKey/inventory` | GET | manager | Provider inventory |
| `/:providerKey/staff` | GET | manager | Provider staff list |
| `/:providerKey/menu` | GET | staff | Provider menu |
| `/:providerKey/orders/active` | GET | staff | Provider's "active orders" — static for `prototype` |
| `/:providerKey/orders/:orderId` | GET | staff | Single order lookup — static for `prototype` |
| `/:providerKey/tables` | GET | staff | Provider tables — static for `prototype` |
| `/:providerKey/recommendation` | POST | staff | Saves a pairing/upsell recommendation to `pos3_recommendations` (this one is a real DB write) |
| `/:providerKey/webhook` | POST | none (internally verified) | Receives a real external-provider webhook, inserts into `pos3_provider_events` |
| `/eat-feed` (eatFeedRouter) | GET | manager | Calls `syncPOS3ToEAT()` — assembles environment/asset/transaction feed purely from the selected provider adapter |
| `/sync/status`, `/sync/run` (syncRouter) | GET/POST | manager/admin | Status/trigger for provider sync jobs (`pos3AutoSyncService.js`) — syncs *provider* data, not internal app orders |
| `/license` (founderPosRouter) | GET | founder_level_0 | Placeholder license/billing panel, explicitly notes "No live billing is active" |

**Storage layer**: `pos3_provider_connections`, `pos3_provider_events`,
`pos3_normalized_orders`, `pos3_normalized_inventory`,
`pos3_recommendations`, `pos3_table_mapping` (Postgres, migration `004`).
These tables are designed to hold data **normalized from a real external
POS provider's API or webhook** — they have no write path from this
app's own internal ticket/table/queue services, and no provider currently
configured here (other than the static `prototype`) is live.

**Auth**: confirmed real and backend-enforced — every route uses
`requireAuth` plus role middleware (consistent with Phase 4), with the
webhook route validated via `verifyWebhook()` (HMAC-style signature check
against `req.headers`) instead of session auth, which is correct for an
inbound third-party webhook.

## C. Current localStorage Flow

The real, working internal POS3 system has no backend involvement at all:

- **Order/ticket creation, cart updates, send-to-kitchen/bar, hold,
  checkout** — `src/services/pos3/pos3Service.js`: `createTicket()`,
  `upsertTicketItems()`, `sendOrder()`, `holdTicket()`,
  `checkoutTicket()`. All read/write through `getTickets()`/`saveTickets()`
  → `opsGet`/`opsSet` → `localStorage['pos3:tickets']` /
  `localStorage['pos3:tables']`.
- **Kitchen queue** — `kitchenQueueService.js` → `localStorage['pos3:kitchenQueue']`.
- **Bar queue** — `barQueueService.js` → `localStorage['pos3:barQueue']`.
- **Humidor queue** — `humidorQueueService.js` → `localStorage['pos3:humidorRequests']`.
- **Receipts** — `receiptService.js` → localStorage, read at checkout.
- **E.A.T. reads** — `EATCommandHub.jsx:6,34`, `EATHumidor.jsx:3,10`,
  `EATBar.jsx:2,6`, `EATKitchen.jsx:2,6`, `EATPosControl.jsx:3,11-12`,
  `EATReports.jsx:2,5` all call `getTickets()`/`getTables()` directly from
  `pos3Service.js` — i.e., they read the same localStorage keys POS3
  writes to, in-process, no network hop.
- **Live ops signals** (humidor match, purchase request) additionally
  emit on `opsEventBus.js` (localStorage + `CustomEvent`/`storage` event)
  so E.A.T.'s Command Hub live feed updates without a page reload — but
  this is still same-browser only (confirmed unchanged from Phase 5).

This flow is genuine and functional within one browser/device. It has no
backend dependency today, and nothing in this phase altered it.

## D. Backend Wiring Applied

**None.** No frontend API client functions were added for POS3 → backend
or E.A.T. → backend, and no E.A.T. or POS3 page was changed to call
`/api/pos3/*`.

Rationale: the only backend bridge that exists serves a different
purpose (third-party provider integration) and its only live data source
(`prototype`) is static demo data. Calling it from E.A.T.'s real
dashboards would render fabricated order/table data that has no
correspondence to what is actually happening on any POS3 terminal,
constituting exactly the "fake sync success" this phase's rules prohibit.
Implementing this wiring was deliberately not done.

## E. Offline/Fallback Behavior

Unchanged from before this phase: 100% localStorage, same-browser only,
no network involved, no fallback logic needed because there is no
primary backend path for this data to begin with.

## F. Multi-Device Readiness Matrix

| Capability | Cross-device today? | Why |
|---|---|---|
| POS terminal creates order, separate E.A.T. device reads it | **No** | Orders live only in `localStorage['pos3:tickets']` on the device that created them; no backend table stores internal ticket data |
| Kitchen/bar/humidor queues available through backend | **No** | Same — localStorage-only, no backend route or table |
| Receipts/status updates round-trip across devices | **No** | Same |
| `pos3IntegrationRoutes.js` data on a second device | Technically yes (it's a real HTTP API) | But it returns the same static demo data on every device — not a sync of real per-venue activity, so it doesn't solve the actual problem |

**Bottom line: unchanged from Phase 5.** No multi-device capability was
added this phase, because doing so honestly would require new backend
infrastructure that does not exist yet (see Section G), not just wiring
to the existing bridge.

## G. Remaining Backend Gaps

To make POS3 ↔ E.A.T. genuinely cross-device, the following backend
infrastructure would need to be built — none of it exists today:

1. A table (or set of tables) for the **internal** app's own
   tickets/orders, keyed by venue/table/device, e.g.
   `pos3_internal_tickets(id, venue_id, table_id, server_id, status, items JSONB, opened_at, updated_at)`
   — distinct from `pos3_normalized_orders`, which is provider-keyed and
   meant for external POS data.
2. CRUD endpoints for that table: create ticket, update items, send to
   kitchen/bar, hold, checkout — mirroring what `pos3Service.js`
   currently does to localStorage.
3. Equivalent tables/endpoints for kitchen queue, bar queue, humidor
   queue, and receipts.
4. A read endpoint E.A.T.'s pages could poll or subscribe to
   (`GET /api/pos3/internal/tickets`, etc.) that reflects real ticket
   state regardless of which device created it.
5. Optionally, real-time delivery (WebSocket/SSE) so a second device
   doesn't need to poll for kitchen/bar/humidor queue changes.

The existing `pos3IntegrationRoutes.js`/`eatPos3BridgeService.js` bridge
does not provide any of the above and should not be repurposed for it —
it is correctly scoped as a third-party-provider integration point and
mixing internal-order semantics into it would corrupt that abstraction
(this would itself be a kind of redesign, which this phase's rules
prohibit).

## H. Launch Blockers

- Same as Phase 5: **POS3 and E.A.T. must currently run on the same
  browser/device to share live order/queue data.** This remains
  unresolved — it requires new backend work (Section G), not available
  to be "wired" from existing infrastructure.
- No new blockers were introduced this phase, since no code was changed.

## I. Files Changed

None. This phase produced only this report. `src/`, `server/`, and all
existing localStorage-based POS3/E.A.T. behavior are untouched.

`npm run build` was run to confirm the repository still builds cleanly
with zero changes (sanity check only, per the phase's standing rule):
passed with no errors (pre-existing chunk-size warning only).

## J. Recommended Next Phase

If true multi-device POS3 ↔ E.A.T. sync is required for launch, scope it
as new backend feature work (not a "wiring" task):
1. Design and migrate the internal-orders schema (Section G.1).
2. Build CRUD + read endpoints for tickets/queues/receipts.
3. Switch `pos3Service.js` and the kitchen/bar/humidor queue services to
   write through those endpoints first, with the current localStorage
   behavior retained as an explicit offline fallback (per this phase's
   "don't remove fallback" rule, once a real backend exists to fall back
   *from*).
4. Update E.A.T.'s read paths (`getTickets()`/`getTables()` callers) to
   read from the backend first, falling back to localStorage only when
   the backend is unreachable.
5. Leave `pos3IntegrationRoutes.js` exactly as-is for its actual purpose:
   future real third-party POS provider connections.
