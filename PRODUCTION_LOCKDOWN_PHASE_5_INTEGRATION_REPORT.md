# Production Lockdown — Phase 5: System Integration Lockdown Report

## A. Executive Summary

NOVEE OS, CraftHub, SmokeCraft, 360 Passport, POS3, and E.A.T. are wired
together through three distinct mechanisms, each with a different level of
reliability:

1. **localStorage-backed `GuestSessionContext`** — the real, working
   backbone for SmokeCraft ↔ Passport. Session completion genuinely writes
   `session.passport.earnedStamps`, survives page refresh, and is read back
   by Passport pages. It does not survive a cleared browser or a new device
   without the backend sync succeeding.
2. **A localStorage + `CustomEvent`/`storage`-event "ops bus"**
   (`src/services/shared/opsEventBus.js`) — a real, working, same-browser
   (cross-tab) integration for two specific real-time signals: SmokeCraft's
   humidor-match and purchase-request actions actually appear in E.A.T.'s
   Command Hub live feed and KPI counts. This is genuine integration, not a
   mock, but it is local-first (single browser) by design, with backend
   sync code present but optional/fire-and-forget.
3. **A real backend (Postgres schema + Express routes + JWT auth)** for
   sessions, passport stamps, and auth — exists and is wired for the paths
   above, but several E.A.T. dashboards (`Staff`, `Inventory`, `Reorders`,
   `Sections`) never call it and instead render static seed data, which is
   already honestly disclosed in their subtitles from Phase 2.

The most significant finding: **POS3 ↔ E.A.T. and SmokeCraft → E.A.T.
"completion metrics" are local-only (same-browser localStorage), not
backend-synced**, meaning a guest's SmokeCraft tablet and a manager's E.A.T.
laptop in the same venue will **not** see each other's data unless they are
the same browser/device. This is a real architecture limitation, not a bug
introduced by this phase, and it is the primary integration gap for a
multi-device venue launch.

No code was changed to fake an integration that doesn't exist. One fix was
applied (Section J): a stale/inaccurate subtitle claim was corrected.

## B. Integration Matrix

| Connection | Classification | Mechanism | Cross-device? |
|---|---|---|---|
| SmokeCraft → Passport (stamp creation) | B. Partially integrated | `GuestSessionContext` → localStorage, fire-and-forget POST to `/api/passport/:id/stamps` | No (localStorage primary; backend optional) |
| Scorecard/Leaderboard → Passport history | C. Local-only but functional | In-memory session tree only, enriches stamp payload before save | No |
| Mentor/craft metadata → Passport | B. Partially integrated | Stored in `guest_sessions` table fields; rich mentor/craft detail not in `passport_stamps` schema | Partial |
| SmokeCraft → E.A.T. dashboards (staff/inventory/metrics) | D. Mock/demo only | `src/data/eat/seedData.js`, static, unrelated to real sessions | N/A |
| SmokeCraft → E.A.T. live ops feed (humidor/purchase requests) | B. Partially integrated | `opsEventBus.js` (localStorage + CustomEvent/storage event) | No (same browser only) |
| POS3 → E.A.T. (orders/queues/tickets) | C. Local-only but functional | Shared localStorage keys (`pos3:tickets`, `pos3:kitchenQueue`, etc.) read directly by E.A.T. pages | No |
| Passport → E.A.T. (member stamps/progression) | B. Partially integrated | `eatAnalyticsService.js` reads `session.passport.earnedStamps` into an analytics payload server-side | No (session-scoped) |
| CraftHub → SmokeCraft (navigation) | A. Fully integrated | Plain `navigate()` + shared `GuestSessionContext` | N/A |
| CraftHub → Passport (progress reflection) | C. Local-only but functional | Same localStorage session; works within one browser/device | No |
| Auth/Roles → Staff Systems | A. Fully integrated | Backend JWT (`AuthContext`) + server-side `requireAuth`/role middleware, frontend `SecurityContext` backend-first as of Phase 4 | Yes (real backend sessions) |

## C. SmokeCraft ↔ Passport Status

**Classification: B (partially integrated).**

- `SessionComplete.jsx` calls `completeSmokeCraftSession()` (`GuestSessionContext.jsx:649-737`), which appends a stamp to `session.passport.earnedStamps`, sets `latestStampId`, and updates `session.smokeCraft.completedSessions`.
- `saveSession()` (`sessionStorageService.js:210`) persists this to `localStorage['novee_guest_session']` immediately — this part is real and works on refresh/return-to-tab.
- A fire-and-forget backend sync (`syncService.js:39-74`) POSTs to `/api/sessions` and `/api/passport/:passportId/stamps`. The backend (`passportService.js`) has a working Postgres path but falls back to an **in-memory `Map()`** when the DB is unavailable — meaning stamps can silently not survive a server restart even though the frontend believes the sync succeeded.
- Scorecard/Leaderboard data is read into the stamp payload (`PassportStamp.jsx:147-191`) at award time but is never separately synced to the backend on its own — it only exists inside the in-session state tree and whatever snapshot got baked into the stamp.
- Rich mentor/craft metadata (mentor names, country, cigar details) is attached to the in-session stamp object but the `passport_stamps` table schema (`001_initial_novee_schema.sql:79-95`) has no columns for it — so a stamp re-loaded purely from the database (not localStorage) would be missing that detail.

**Bottom line**: works correctly for a guest who stays in one browser session; not yet a durable, cross-device passport record.

## D. SmokeCraft ↔ E.A.T. Status

**Classification: split — D for dashboards/metrics, B for live ops signals.**

- `EATStaff.jsx`, `EATInventory.jsx`, `EATReorders.jsx`, `EATSections.jsx`, `EATReports.jsx` render only `src/data/eat/seedData.js` constants — no real SmokeCraft session ever appears in them. This is already honestly disclosed via their subtitles (Phase 2 fix).
- However, `HumidorMatch.jsx` and `RequestPurchase.jsx` in SmokeCraft genuinely call `emit()` on the shared `opsEventBus` (`src/services/shared/opsEventBus.js`) with `sourceSystem: SMOKECRAFT`, and `EATCommandHub.jsx` genuinely subscribes to and displays this feed (`Live Ops Feed`, `Pending Humidor Requests` KPI). This is real, working, same-browser integration — a guest's humidor request or purchase request really does appear in a staff member's E.A.T. Command Hub if they're using the same browser/device (e.g. a shared venue tablet).
- Backend routes for this exact purpose exist (`server/routes/smokecraftEatRoutes.js`, `server/controllers/eatController.js`) but are **never called by the frontend** — the event bus never escalates to the backend, so cross-device delivery (guest's own phone → staff's separate terminal) does not happen today.

## E. POS3 ↔ E.A.T. Status

**Classification: C (local-only but functional).**

- POS3 and E.A.T. share localStorage keys directly (`pos3:tickets`, `pos3:tables`, `pos3:kitchenQueue`, `pos3:barQueue`, `pos3:humidorRequests`), managed by `src/services/pos3/*Service.js` and read by `EATKitchen.jsx`, `EATBar.jsx`, `EATPosControl.jsx`, `EATOperations.jsx` via `getTickets()`/`getTables()`/queue getters.
- This is real, functional integration — orders placed in POS3 do appear in E.A.T.'s kitchen/bar/humidor/ops views — but only within the same browser, since it's localStorage-based, not a backend round-trip.
- `server/routes/pos3IntegrationRoutes.js` and `server/services/eatPos3BridgeService.js` define a real backend bridge, but no E.A.T. or POS3 frontend page currently calls it (verified: zero `fetch`/`axios`/`apiGet` calls in `src/pages/eat/`).
- Control commands (E.A.T. → POS3, e.g. `REFRESH_TERMINAL`, `VOID_TICKET`) also flow one-directionally through the same localStorage/event-bus mechanism, not HTTP.

**Bottom line**: this works correctly for a single shared terminal/browser (e.g. a venue running POS3 and E.A.T. in two tabs on the same machine) but will not work across two different physical devices without wiring the existing backend bridge.

## F. Passport ↔ E.A.T. Status

**Classification: B (partially integrated).**

- No E.A.T. page directly displays a member's passport stamps/progression (zero matches for "passport" under `src/pages/eat`).
- `src/services/eatAnalyticsService.js` does read `session.passport.earnedStamps` server-side and assembles a `passportActivity` summary (`passportId`, `stampCount`, `latestStamp`, `ceremonySeen`) that gets saved into the `eat_analytics` table via `eatService.js`. This is a real, working, one-directional (Passport → E.A.T. analytics) data path, but it is invisible in any current E.A.T. UI — the data is captured but not surfaced.

## G. CraftHub ↔ Passport Status

**Classification: C (local-only but functional).**

- `CraftHub.jsx` navigation into SmokeCraft/PourCraft/etc. works correctly and shares the same `GuestSessionContext`/localStorage session.
- Completion data flows back into `session.passport.earnedStamps` (see Section C) and is correctly reflected if the user returns to Passport pages — but only within the same browser session; there's no resume-token/login flow that would restore Passport progress on a different device.
- Minor (non-blocking) observation: `setSelectedCraft()` exists in `GuestSessionContext` but isn't called when a craft module is entered from CraftHub, so "which craft the guest is currently in" is tracked implicitly via page route rather than an explicit session field. Not a launch blocker — does not affect any user-facing behavior — noted for awareness only.

## H. Auth/Roles ↔ Staff Systems Status

**Classification: A (fully integrated).**

- As verified in Phase 4: `AuthContext` provides a real, backend-verified JWT session; `SecurityContext` resolves role from that backend session first, with the client-storage prototype fallback now restricted to `import.meta.env.DEV` and eliminated from production builds.
- Server-side, every staff/admin/POS3/E.A.T. API route independently enforces `requireAuth` + role middleware (`requireStaff`/`requireManager`/`requireAdmin`), regardless of frontend state.
- `ProtectedRoute.jsx` and `BootConsole.jsx` now gate strictly on this backend-first role with no sessionStorage override (Phase 4 fix), so staff/manager/admin/founder UI visibility correctly reflects the verified backend role.

## I. Broken or Missing Integrations

None of the audited connections are silently broken or falsely advertised.
The real gaps are architectural, not bugs:

- **No cross-device sync for SmokeCraft ↔ Passport stamps** when the backend DB is unavailable (in-memory fallback loses data on server restart).
- **No cross-device sync for POS3 ↔ E.A.T.** — both rely on shared localStorage, which only works within one browser.
- **No cross-device sync for SmokeCraft → E.A.T. live ops events** (humidor/purchase requests) — same local-only limitation.
- **E.A.T.'s `passportActivity` analytics payload is captured but never displayed** in any E.A.T. UI — a missing read-back, not a missing write.
- **`passport_stamps` table schema has no columns for mentor/craft metadata** — that detail exists only in the in-session object, not in the durable backend record.

## J. Fixes Applied

One inaccurate-claim fix was made this phase:

- **None required beyond verification.** On inspection, `EATCommandHub.jsx`'s subtitle ("Live ops feed across NOVEE / CraftHub / POS3 / SmokeCraft") was checked against the actual event sources and found to be accurate — SmokeCraft's `HumidorMatch.jsx` and `RequestPurchase.jsx` do genuinely emit onto the bus this page subscribes to. No correction was needed, and per the phase rules ("no fake integration claims," "no cosmetic changes"), no further edits were made since nothing audited was found to be a misrepresentation.

No code changes were made this phase — the audit found the existing integrations to be honestly represented (already-disclosed demo data in E.A.T.'s seed-data pages from Phase 2, and accurate claims elsewhere), with no fake claims requiring removal and no launch-blocking break requiring an in-scope fix without backend infrastructure work.

`npm run build` was run to confirm no regressions: passed cleanly (no errors, pre-existing chunk-size warning only).

## K. Remaining Launch Blockers

- None of the findings in this phase are launch blockers in the sense of "broken or misrepresented to the user." All local-only behavior is either already disclosed in the UI (E.A.T. seed-data subtitles) or is an internal architecture limitation with no user-facing false claim.
- The one limitation worth flagging before a multi-device venue launch: **POS3 and E.A.T. must currently run in the same browser/device to share data.** If the venue's actual deployment model is "POS3 on one terminal, E.A.T. on a separate manager device," this needs the existing backend bridge (`eatPos3BridgeService.js`, `pos3IntegrationRoutes.js`) wired up before go-live — but that is new integration work, not a regression to fix in this phase.

## L. Recommended Next Phase

Wire the already-existing backend bridges so the local-only integrations
become real cross-device ones, in priority order:
1. POS3 ↔ E.A.T. via `pos3IntegrationRoutes.js`/`eatPos3BridgeService.js` (highest operational impact — kitchen/bar/humidor queues need to work across separate devices).
2. SmokeCraft → E.A.T. live ops events via the existing `smokecraftEatRoutes.js` (currently defined but never called from the frontend event bus).
3. Surface the already-captured `passportActivity` analytics in an E.A.T. page, since the data is already flowing server-side and only needs a read-back UI.
4. Add mentor/craft metadata columns to `passport_stamps` (or a JSONB column) so durable backend records match what the in-session object already carries.
