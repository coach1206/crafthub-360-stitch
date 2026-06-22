# NOVEE OS — Backend Readiness Map

Audit date: 2026-06-22. Scope: CraftHub, SmokeCraft, POS3, E.A.T., 360 Passport,
Ticket Ticker, Inventory, Orders, Staff/Sections, Events/Specials, Reports,
Demo Mode, Role/Security.

This is a survey, not a migration plan. It records what is real today, what is
client-side simulation, and what tables/wiring would be needed to make each
area real. Nothing in this document changes runtime behavior.

## 1. What already has a real backend

| Area | Real? | Evidence |
|---|---|---|
| Auth (staff PIN / admin / founder JWT) | **Yes** | `server/middleware/authMiddleware.js`, `server/services/authService.js`, `auth_credentials`/`auth_sessions` tables (migration 003) |
| Role/permission enforcement | **Yes**, server-side | `server/middleware/roleMiddleware.js` (`requireRole`, `requirePermission`, `canAccessPOS3`, `canAccessEAT`), applied in `adminRoutes.js`, `eatRoutes.js`. Frontend `ProtectedRoute`/`roleMap.js` is explicitly UI-only by design comment. |
| SmokeCraft sessions/leaderboard/handoff | **Yes**, with in-memory fallback | `smokeBackendApiClient.js` → `/api/*`, backed by `server/routes/smokecraftRoutes.js` + `011_smokecraft_schema.sql`. Falls back to localStorage if DB unavailable (`smokeSharedStorageService.js`). |
| Passport ranking/badges | **Yes** | `src/api/rankingApi.js` → `/api/ranking/*`, gated by `requireAuth/requireAdmin`. |
| Ticket Ticker | **Partial** — real route, file-backed not DB-backed | `TicketTicker.jsx` calls `/api/ticker`; `tickerController.js` persists POST additions to a JSON file (`ticker_additions.json`), not Postgres. |
| Demo session tracking | **Yes**, isolated tables | `demoSessionService.js` → dedicated `demo_sessions`/`demo_events` tables (migration 009). |
| POS3 third-party provider sync (Clover/Toast/Square) | **Built, not wired to UI** | `pos3IntegrationApiService.js` → `/api/pos3/providers/*`, backed by real `pos3IntegrationRoutes.js`/`pos3IntegrationService.js` and `pos3_provider_*`/`pos3_normalized_*` tables (migration 004). Used by `src/pages/POS3.jsx` (legacy `/pos`) and `adminApiService.js`/`syncService.js` — **not** by any of the new `/pos3/*` pages. |

## 2. What is client-side simulation (local-only / mock)

### POS3 (`/pos3/*` — all 11 pages, confirmed via code audit)

Every page (`POS3Home`, `POS3Handheld`, `POS3Tables`, `POS3Orders`,
`POS3Checkout`, `KitchenDisplay`, `BarDisplay`, `HumidorControl`,
`InventoryControl`, `POSIntegrationHub`, `POS3Settings`) runs entirely on the
`src/services/pos3/*.js` layer, which reads/writes `localStorage` keys
(`pos3:tables`, `pos3:tickets`, `pos3:kitchenQueue`, `pos3:barQueue`,
`pos3:humidorRequests`, `pos3:inventoryLevels`, `pos3:inventoryImpact`,
`pos3:receipts`, `pos3:integrations`) seeded from static files (`seedData.js`,
`humidorInventory.js`, `inventoryCatalog.js`, `posProviders.js`). None of
these services import `apiClient.js` or call `/api/pos3/*`. Card/split
payment in `paymentService.js` explicitly returns `{ notConfigured: true }`.
`posProviderAdapters.js` and `POSIntegrationHub.jsx` self-document as sample
data with no real network calls.

The real, working `pos3IntegrationApiService.js` + provider-sync backend
already exists (see §1) but is completely disconnected from this page set.

### E.A.T. (`/eat/*` — all 14 pages, confirmed via code audit)

All pages run on a shared client-side "ops event bus"
(`opsEventBus.js`/`opsStorage.js`/`opsControlBridge.js`, localStorage keys
under `shared:*` and `eat:*`) plus static seed data
(`src/data/eat/seedData.js`, `seedMediaAssets.js`). `EATInventory`,
`EATReorders`, `EATStaff`, `EATSections`, `EATSettings` render hardcoded
arrays directly. `EATData`/`EATReports` read raw localStorage. No E.A.T. page
calls `apiClient.js` or `/api/eat/*`.

The only real backend route under `/api/eat/*` (`eatRoutes.js` →
`eatController.js`/`eatService.js`) is guest-engagement analytics
(sources/analytics/dashboard) — functionally unrelated to venue ops, and
unused by any of the 14 management pages. `server/services/eatPos3BridgeService.js`
is a real, working aggregator with no route and no caller — orphaned.

### Passport Connections / Events

`passportConnectionsApi.js` and `passportEventsApi.js` are pure `delay()`
mocks with no `fetch()` calls and no matching real route (separate from the
real ranking/badge APIs in §1). `passportHomeApi.js` has an explicit
`// TODO: replace delay() with fetch()` comment.

### Leaderboard (legacy fallback path)

`leaderboardService.js` reads/writes `localStorage` directly — separate from
the real `smokeLeaderboardService.js`/ranking API path.

### Events/Specials

No real feature exists. "Specials" only appears as marketing copy on the
BeerCraft/PourCraft coming-soon pages. No events/specials table or route.

### Reports

Only `EATReports.jsx` exists, and it derives numbers live from local POS3
ticket data in localStorage (page copy already says so). No other Reports
page exists.

### Staff/Sections

`staffHandoffService.js`/`staffHandoffRegistry.js` (PIN handoff) is
intentionally local/in-memory by design (see file header — no backend PIN+email
endpoint exists yet). There is no floor/section management backend; `EATStaff`
and `EATSections` are static arrays.

## 3. Demo Mode isolation

`demo_sessions`/`demo_events` are dedicated tables and stay isolated
(migration 009). However, `demoResetService.js` also deletes rows from
**shared production tables** (`guest_sessions`, `leaderboard_entries`,
`passport_stamps`, `observer_notes`, `venue_test_sessions`) filtered by an
`is_demo`/`prototype_mode` flag rather than a dedicated table — demo and real
rows commingle in storage, separated only by a flag. This is pre-existing
behavior, not changed by this audit; flagged here as a risk to revisit before
any real money/inventory actions are wired up, since a missed flag would mix
demo and production rows.

Frontend `DemoModeContext.jsx` (sessionStorage-only) and `ProtectedRoute`
demo-blocking (`/pos3`, `/eat`, `/admin`, `/founder`, etc. — see commit
`f0cfbc0e`) keep the demo UI from ever reaching the management screens in the
first place, which is the primary safeguard today.

## 4. Database tables that would be needed for real wiring

Tables that **already exist** and just need a frontend caller swap:
- `pos3_provider_connections`, `pos3_provider_events`, `pos3_normalized_orders`,
  `pos3_normalized_inventory`, `pos3_recommendations`, `pos3_table_mapping`
  (migration 004) — for third-party POS provider sync.
- `inventory_items`, `inventory_movements`, `inventory_alerts` (migration 010)
  — generic inventory; not yet read/written by any POS3/E.A.T. page.
- `ticker_items`, `ticker_schedules`, `ticker_history` (migration 010) — not
  yet used by `tickerController.js`, which still writes to a JSON file.

Tables that **do not exist yet** and would be needed for first-party
(non-provider) POS3/E.A.T. data:
- `pos3_tables` — floor/table state, independent of any provider.
- `pos3_tickets` / `pos3_ticket_items` — native order/ticket lifecycle (the
  thing `pos3:tickets` in localStorage currently simulates).
- `pos3_station_queue_events` — kitchen/bar/humidor queue state and timestamps.
- `pos3_receipts` / `pos3_payments` — checkout and payment records (cash today;
  card/split need a real processor integration before this matters).
- `eat_staff_assignments` / `eat_sections` — section ↔ staff floor assignment,
  replacing the static `EAT_STAFF`/`EAT_SECTIONS` arrays.
- `eat_reorder_requests` — replacing the static `EAT_REORDERS` array, ideally
  unified with `inventory_alerts`.
- `venue_events` / `venue_specials` — does not exist in any form today; would
  need to be designed from scratch if this becomes a real feature.
- A first-party `device_sessions` table for kiosk/device login (see §5) —
  `venue_devices`/`device_events` exist (migration 006) for device inventory
  and telemetry, but there's no session/auth table tying a device to an
  authenticated role.

## 5. Kiosk / device login recommendation

`POS3Handheld.jsx` is now gated by the same `access_pos3_staff` permission as
the rest of `/pos3` (commit `f0cfbc0e`) — per this task's instructions it stays
that way in this pass; no unauthenticated kiosk access was added.

For a future safe kiosk/device flow, the recommended shape (not implemented
here):
1. A `device_sessions` table: `device_id` (FK → `venue_devices.device_id`),
   `issued_role` (e.g. `staff`, scoped lower than a human login), `expires_at`,
   `revoked`.
2. A device-pairing endpoint (admin/manager generates a short-lived pairing
   code for a `venue_devices` row), not a standing open door — mirrors the
   existing PIN-expiry pattern in `.env.example` (`STAFF_PIN_EXPIRES_IN`).
3. `ProtectedRoute` would need a new `deviceSession` check path alongside
   `allowedRoles`/`requiredPermission`, scoped to exactly the kiosk routes
   (e.g. `/pos3/handheld`, `/pos3/tables`) — not a blanket bypass.
4. Until that exists, `POS3Handheld` should require the same staff PIN login
   as everything else under `/pos3`, which is the current (correct, safe)
   state.

## 6. Honesty status of pending UI

Per the audit, every POS3 and E.A.T. management page already operates purely
on local state — no page currently fabricates a "✓ Sent to backend" or
similar success message for a write that didn't happen server-side. Several
pages already self-disclose this in their own copy (`POSIntegrationHub`,
`POS3Checkout`, `POS3Settings`, `EATReorders`, `EATSettings`, `EATReports`).
The shared `TopBar` (`src/components/eat/ui.jsx`, used by all POS3/E.A.T.
pages via `ManagementLayout`) now renders a `Backend Pending` pill so every
page in both trees carries the same honest, consistent disclosure without
needing a per-page rewrite.

## 7. Summary verdict

- **Real and wired**: auth, role middleware, SmokeCraft, passport ranking/badges,
  ticker (file-backed), demo session tracking, POS3 third-party provider sync
  (built but only used by the legacy `/pos` page).
- **Local simulation only**: all of `/pos3/*` and `/eat/*` (the systems just
  gated behind `ProtectedRoute` in commit `f0cfbc0e`), passport
  connections/events, legacy leaderboard fallback.
- **Doesn't exist at all**: events/specials, first-party POS3 tables/tickets/
  queues as DB tables, EAT staff/section assignment as DB tables, device
  session auth for kiosk mode.

No code in this pass connects to a live database, adds secrets, or changes
runtime behavior beyond the one shared, additive `Backend Pending` disclosure
pill described in §6.
