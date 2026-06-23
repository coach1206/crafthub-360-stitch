# Production Lockdown — Phase 2 Persistence Report

Branch: `claude/beautiful-thompson-r3mm5m`
Builds on: `PRODUCTION_LOCKDOWN_PHASE_1_REPORT.md` (functionality audit — routes, buttons, phase chain, staff-leak fix).
Audit method: full trace of every context method (`GuestSessionContext.jsx`, `AuthContext.jsx`) back to its storage write, full trace of POS3/E.A.T. service layer reads/writes, full repo-wide sweep for `localStorage`, `sessionStorage`, mock/seed data, and hardcoded credentials.

No redesign, recolor, or layout changes were made. The only changes applied this phase are documented in Section J.

---

## A. Executive Summary

Persistence in this app is **local-first by design**: every core guest/staff/venue action (SmokeCraft phase progress, Passport stamps, POS3 orders/queues/receipts, E.A.T. ops data) is written synchronously to `localStorage` and survives a full page refresh. There is no backend database behind any of this yet — `localStorage` *is* the system of record. A best-effort, fire-and-forget backend sync layer (`syncService.js`) exists and queues failed syncs for retry, but the app never blocks on it and never depends on it for correctness today.

**No data-loss bugs were found.** Every phase-progression action traced (Enroll → Session Complete), every POS3 order action (create/add/quantity/route/close/receipt), and every Passport stamp award writes to `localStorage` before the UI moves on, and all of it reloads correctly after a refresh.

Two items required action this phase:
1. **E.A.T. seed data displayed with no demo disclosure** (`EATInventory.jsx`, `EATStaff.jsx`, `EATReorders.jsx`, `EATSections.jsx`) — staff viewing these screens had no indication the rows were static seed data, not live venue data. **Fixed** — added a one-line "(demo data — pending live … integration)" disclosure to each subtitle. No layout/visual change.
2. **Hardcoded founder/staff credentials in client code** (`src/data/staffHandoffRegistry.js`) — a real-looking founder email + 4-digit PIN ship in the bundle as the only way to authenticate the staff-handoff screen, because no backend endpoint for it exists yet. This is already self-documented in the file's own comments as demo/local-preview-only, and removing it would break the only working staff-handoff login path with no replacement. **Not removed** (would violate "no removing working flows") — flagged as a launch blocker requiring a real backend auth endpoint before public launch (Section I/J).

Everything else — leaderboard demo seed, POS3/E.A.T. seed catalogs, sync queue, schema migrations — was found to be either already correctly disclosed in the UI, or legitimate one-time bootstrap/reference data that gets superseded by real local activity immediately.

---

## B. Core Actions That Persist Correctly

| Action | File:Function | Storage Key | Survives Refresh |
|---|---|---|---|
| Guest profile capture | `Enroll.jsx` → `mergeGuestProfile()`/`completeGuestProfile()` | `novee_guest_session` | ✓ |
| Mentor selection | `Mentor.jsx` → `update()` (`selectedMentor`) | `novee_guest_session` | ✓ |
| Shape/size/burn (Format) | `Format.jsx` → `setSmokeCraftFormat()` | `novee_guest_session` | ✓ |
| Seed & Soil pairing | `SeedSoil.jsx` → `update()` (`pairingCombo`, `pairingScore`) | `novee_guest_session` | ✓ |
| Humidor recommendation | `HumidorMatch.jsx` → `setHumidorMatchSelection()` | `novee_guest_session` | ✓ |
| Request/Purchase choice | `RequestPurchase.jsx` → `setRequestPurchaseChoice()` | `novee_guest_session` | ✓ |
| Cut/Toast/Light | `CutToastLight.jsx` → `setCutToastLightProgress()` | `novee_guest_session` | ✓ |
| First/Second/Final Third notes | `FirstThird.jsx`/`SecondThird.jsx`/`FinalThird.jsx` → `set*ThirdTasting()` | `novee_guest_session` | ✓ |
| Scorecard / ranking | `Scorecard.jsx` → `update()` (`eventLog`) | `novee_guest_session` | ✓ |
| 360 Passport stamp award | `PassportStamp.jsx` → `awardStamp()` → `awardPassportStamp()` | `novee_guest_session` (`passport.earnedStamps`) | ✓ |
| Session Complete | `SessionComplete.jsx` → `completeSmokeCraftSession()` | `novee_guest_session` | ✓ |
| XP / completed steps | `GuestSessionContext.jsx` → `addXP()`/`completeStep()` | `novee_guest_session` | ✓ |
| POS3 order creation | `orderService.js` → `createTicket()` | `pos3:tickets` | ✓ |
| Cart add/remove/qty/modifier/note | `orderService.js` → `addItem()`/`removeItem()`/`changeQuantity()`/`addModifier()`/`addNote()` | `pos3:tickets` | ✓ |
| Totals/tax/service calc | `paymentService.js` → `calcTotals()` | n/a (pure calc, recomputed from persisted ticket) | ✓ |
| Kitchen/Bar/Humidor routing | `stationRoutingService.js` → `routeTicket()` | `pos3:kitchenQueue`, `pos3:barQueue`, `pos3:humidorRequests` | ✓ |
| Order close/cashout | `orderService.js` → `closeTicket()`/`cashoutTicket()` | `pos3:tickets` | ✓ |
| Receipts | `receiptService.js` → `buildReceipt()` | `pos3:receipts` (last 500) | ✓ |
| Inventory stock decrement | `stationRoutingService.js` → `decrementStock()` | `pos3:inventoryLevels` | ✓ |
| Inventory impact log | `inventoryImpactService.js` | `pos3:inventoryImpact` (last 1000) | ✓ |
| Cross-system ops events | `opsEventBus.js` | `shared:opsEvents` (last 300) | ✓ |

All of the above are confirmed called from the real "continue"/submit handler on each page, not just defined and unused.

---

## C. Core Actions That Do Not Persist (or persist only in-memory)

| Item | Behavior | Risk |
|---|---|---|
| Staff/Admin/Founder/Mentor role authority | Lives only in React state (`AuthContext.jsx`), restored on refresh via `GET /api/auth/me` against an HttpOnly JWT cookie | **By design, not a bug** — role authority is intentionally never trusted from client storage; losing in-memory state on refresh and re-deriving it from the backend cookie is the correct security posture. |
| `smokecraft_staff_handoff` / `smokecraft_staff_session` | `sessionStorage` (tab-scoped) | Intentional — staff handoff state should not persist across tab closes or devices. |
| Demo-mode flags (`novee_demo_mode`, `demoMode`), boot flags (`novee_booted`) | `sessionStorage` | Intentional, tab-scoped UI state, not user data. |

No core user-facing action was found to silently lose data on refresh.

---

## D. localStorage / sessionStorage Usage

**localStorage (persists across sessions/devices-on-same-browser):**

| Key | Contents | Classification |
|---|---|---|
| `novee_guest_session` | Full guest session: profile, SmokeCraft progress, Passport stamps, XP, leaderboard score | B — MVP persistence, correct for a local-first guest app pre-backend |
| `pos3:tickets` | All open/sent/held/paid tickets | B |
| `pos3:kitchenQueue` / `pos3:barQueue` / `pos3:humidorRequests` | Station queues | B |
| `pos3:receipts` | Last 500 receipts | B |
| `pos3:inventoryLevels` / `pos3:inventoryImpact` | Stock levels / depletion log | B |
| `pos3:tables` | Table config, seeded once | A |
| `pos3:integrations`, `pos3:integrations:normalized:*` | POS provider config (masked) | B |
| `shared:opsEvents`, `shared:controlCommands`, `shared:systemStatus` | Cross-system event bus | B |
| `novee_leaderboard` | Real submitted scores, merged with `DEMO_PLAYERS` | B (demo rows already labeled "Demo / illustrative" in `Leaderboard.jsx` UI) |
| `novee_sync_queue` | Queued failed backend syncs, retried on startup | A |
| `novee_smoke_shared_*` (session snapshots, purchase intents, EAT handoffs, leaderboard entries) | SmokeCraft↔POS3↔E.A.T. shared-storage shim | B |
| `novee_admin_session` | Legacy/dev-mode admin role flag | C — should not exist once real role auth is the only path; currently dead weight, not read by `ProtectedRoute` |
| `novee_device_id`, `novee_voice_muted`, `pos3:hapticsEnabled` | Device/UX prefs | A |
| `novee_eat_analytics`, `novee_pos3_activity` | Local engagement/activity logs | A |
| `eat:operationsAlerts` | Operational alerts | B |

**sessionStorage (tab-scoped, cleared on tab close):**

| Key | Contents | Classification |
|---|---|---|
| `smokecraft_staff_handoff`, `smokecraft_staff_session` | Staff handoff payload/session (no PIN stored) | A |
| `novee_demo_mode`, `demoMode`, `novee_booted`, `novee_boot_return` | Boot/demo UI flags | A |
| `leafChallengeResult`, `smokecraft-curation-selection` | Per-tab game/curation state | A |

**Mock/seed data files:**

| File | Usage | Classification |
|---|---|---|
| `data/pos3/seedData.js`, `data/pos3/inventoryCatalog.js`, `data/pos3/menuCatalog.js` | One-time bootstrap into `pos3:*` localStorage; superseded by real activity immediately | A |
| `data/passportCatalog.js` | Read-only stamp catalog/validation reference | A |
| `data/eat/seedData.js` (`EAT_INVENTORY`, `EAT_STAFF`, `EAT_REORDERS`, `EAT_SECTIONS`, `EAT_ALERTS`) | Displayed directly in staff-only E.A.T. pages with no live-data backing and (pre-fix) no disclosure | **D → fixed this phase**, see Section J |
| `services/leaderboardService.js` (`DEMO_PLAYERS`) | Merged into leaderboard so it's never empty | D, but already disclosed in `Leaderboard.jsx` UI copy ("Demo / illustrative — not live shared data") — no action needed |
| `data/staffHandoffRegistry.js` (`DEMO_STAFF`, `FOUNDER_CREDENTIAL`) | Hardcoded email+PIN auth for the staff-handoff screen, used because no backend endpoint exists yet | **C — launch blocker**, see Section I |

---

## E. Backend Tables or Services Used

There is no backend database in this repo. The only backend surface is a set of API routes called fire-and-forget from `syncService.js`:
- `POST /api/sessions` (debounced 2s after any guest-session change)
- `POST /api/passport/{id}/stamps`
- `POST /api/leaderboard`
- `POST /api/pos3/activity`
- `POST /api/eat/analytics`
- `GET /api/auth/me`, staff/admin/founder/mentor/dev login + logout endpoints (`AuthContext.jsx`) — this is the one real, required backend dependency (role authority).

All of the sync calls above are best-effort: on failure they're queued in `novee_sync_queue` (max batches, retried on next app load) and never block the UI.

---

## F. Missing Backend Connections

- **Staff-handoff email+PIN auth has no backend endpoint** (`staffHandoffRegistry.js` comment, confirmed). The existing `/api/auth/staff-pin-login` is PIN-only, no email. This is the single biggest persistence/security gap — see Section I.
- Photo upload storage (Supabase/S3) — documented already in Phase 1 report, unchanged.
- SMS/email upload-link delivery — documented already in Phase 1 report, unchanged.
- Real POS3↔venue inventory system integration — `pos3:inventoryLevels` is locally simulated only.
- E.A.T. inventory/staff/reorders/sections have no live venue-system feed — confirmed, now disclosed (Section J).

---

## G. Refresh / Logout / Login Risks

| Scenario | Result | Risk |
|---|---|---|
| Guest refreshes mid-SmokeCraft-session | Full session (profile, phase progress, stamps, XP) reloads from `novee_guest_session` | None |
| Guest closes tab and reopens later on the same device | Same — `localStorage` survives tab close | None (by design — this is the intended "resume where you left off" behavior) |
| Staff logs in, then refreshes | Role is re-derived from `GET /api/auth/me` against the HttpOnly cookie — correct, no client-trust issue | None |
| Staff logs out | Auth state clears (`authUser = null`, backend cookie invalidated); the on-device **guest** SmokeCraft session is untouched | **Not a bug** — guest progress and staff auth are intentionally independent (a guest's in-progress SmokeCraft session must not be wiped just because a staff member happened to log out on the same kiosk/tablet). No fix applied — clearing guest data on staff logout would itself be a data-loss regression. |
| POS3 ticket created, page refreshed before payment | Ticket remains `open`/`sent`/`held` in `pos3:tickets`, fully recoverable | None |
| E.A.T. dashboard refreshed | Recomputes from the same `pos3:tickets`/`pos3:receipts`/`shared:opsEvents` — no data loss | None |

---

## H. Data Flow Map

```
Guest device
  SmokeCraft phase pages ──update()──▶ GuestSessionContext ──saveSession()──▶ localStorage["novee_guest_session"]
                                                              └─(debounced 2s)─▶ POST /api/sessions (best-effort)
  PassportStamp.jsx ──awardStamp()──▶ awardPassportStamp() ──▶ same session object ──▶ same localStorage key
                                                              └─▶ POST /api/passport/{id}/stamps (best-effort)

Venue device (staff)
  POS3 order pages ──createTicket()/addItem()/changeQuantity()──▶ orderService.js ──▶ localStorage["pos3:tickets"]
                                                                  └─emits──▶ opsEventBus ──▶ localStorage["shared:opsEvents"]
  routeTicket() ──▶ kitchenQueueService/barQueueService/humidorQueueService ──▶ localStorage["pos3:*Queue"/"*Requests"]
  closeTicket() ──▶ receiptService.buildReceipt() ──▶ localStorage["pos3:receipts"]

E.A.T. dashboard (staff, ProtectedRoute-gated)
  eatOpsAnalyticsService.js reads: pos3:tickets, pos3:receipts, pos3:inventoryImpact, shared:opsEvents
  EATInventory/EATStaff/EATReorders/EATSections pages read: data/eat/seedData.js (static — now disclosed as demo data)
  E.A.T. does NOT read SmokeCraft sessions or Passport stamps directly — no cross-link exists yet.

Auth (staff/admin/founder/mentor)
  Login pages ──▶ authApi.login*() ──▶ backend sets HttpOnly JWT cookie ──▶ AuthContext in-memory authUser
  Refresh ──▶ GET /api/auth/me ──▶ re-derives authUser from cookie (never trusts localStorage for role)
```

---

## I. Launch Blockers

1. **Hardcoded founder + staff PIN credentials in client bundle** (`src/data/staffHandoffRegistry.js`) — a real founder email and two staff/manager email+PIN pairs are shipped as plaintext in the JS bundle because no backend endpoint exists for email+PIN staff-handoff auth. Anyone who downloads the bundle can read these credentials. **Not fixed this phase** — removing it breaks the only working staff-handoff login screen, which would violate "no removing working flows." This requires a real backend `email + PIN` auth endpoint before public launch; flagging as the top launch blocker for whoever owns backend work next.
2. **E.A.T. seed data shown with no disclosure** (`EATInventory.jsx`, `EATStaff.jsx`, `EATReorders.jsx`, `EATSections.jsx`) — **FIXED this phase**, see Section J.

No data-loss, refresh, or core-persistence bugs were found — both items above are data-integrity/security disclosure issues, not broken persistence.

---

## J. Recommended Fix Order (and what was actually fixed this phase)

1. ~~SmokeCraft phase/session persistence~~ — already correct for all 13 phases, no changes needed.
2. ~~Passport stamp persistence~~ — already correct (validated catalog, dedup, localStorage + best-effort backend sync), no changes needed.
3. ~~POS3 order persistence~~ — already correct (tickets, queues, receipts, inventory impact all persist and survive refresh), no changes needed.
4. ~~E.A.T. data feed~~ — already reads real local POS3/ops-event data correctly; the only gap (seed-data pages) is fixed in this same pass, see below.
5. ~~Role/session persistence~~ — already correct and intentionally separated from client storage (cookie + server re-derivation); guest-session-survives-staff-logout behavior confirmed as by-design, not a bug — no change made.
6. **Remove/hide demo-only persistence from production — partially fixed.** Added a one-line "(demo data — pending live … integration)" disclosure to the `subtitle` of `src/pages/eat/EATInventory.jsx`, `src/pages/eat/EATStaff.jsx`, `src/pages/eat/EATReorders.jsx`, and `src/pages/eat/EATSections.jsx`. No layout, color, or structural change — text-only addition to an existing subtitle string. The leaderboard's `DEMO_PLAYERS` and `staffHandoffRegistry.js` credentials were left untouched: the leaderboard demo rows are already disclosed in `Leaderboard.jsx`'s UI copy, and the staff-handoff credentials cannot be removed without a working backend replacement (see Section I, item 1 — flagged as launch blocker, not fixed).

`npm run build` was re-run after the Section J fix and passed cleanly.

**Changed files this phase:**
- `src/pages/eat/EATInventory.jsx`
- `src/pages/eat/EATStaff.jsx`
- `src/pages/eat/EATReorders.jsx`
- `src/pages/eat/EATSections.jsx`
- `PRODUCTION_LOCKDOWN_PHASE_2_PERSISTENCE_REPORT.md` (new)
