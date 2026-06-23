# Production Lockdown — Phase 1 Report

Branch audited: `claude/smokecraft-landing-rewire`
Build tool: Vite + React Router v6
Audit method: full route map read (`src/App.jsx`), file-by-file read of every SmokeCraft phase page, grep sweep for persistence/mock/TODO patterns, manual trace of `navigate()` chains for phase progression.

No redesign, recolor, or layout changes were made during this audit. Findings only, plus the minimal functional fixes listed in Section L that were applied after this report was written.

---

## A. Executive Summary

The app **builds cleanly** (`npm install` + `npm run build` succeed, no errors). The core guest journey — SmokeCraft Phases 0–13 — is **fully implemented and correctly chained**: every phase page has a working "continue" action that `navigate()`s to the next real phase, matches the order defined in `src/constants/session.js` (`SMOKECRAFT_FLOW`), and persists progress (`completedSteps`, XP, stamps, badges) to `localStorage` via `GuestSessionContext`. POS3 order creation/quantity/totals/station-routing is real, not mocked. Passport stamps and badges are awarded only from real completed actions, not static arrays. E.A.T. and POS3 staff routes are correctly wrapped in `ProtectedRoute` with role/permission checks and are not reachable as plain public paths.

The one real **launch blocker found** is a leak of internal/staff-only language and direct staff-route links onto three guest-facing SmokeCraft pages (Scorecard, Event Challenge, Leaderboard) — a `SmokeBackendReadinessPanel` showing raw backend/database/API status, plus two buttons literally labeled "Open POS3 (Staff Access)" / "Open E.A.T. Summary (Staff Access)" on the Scorecard page. This violates the explicit rule that staff/backend/internal system language must never reach a normal user screen. This has been fixed (see Section L).

Secondary, non-blocking items: 4 "Coming Soon" stub pages exist beyond the core Phase 0–13 protocol (Terroir, Pairing Mastery, Vitola, Assistant — these are supplemental steps 17–19 and an alternate-flow placeholder, not part of the required 0–13 chain), and a handful of documented `TODO` markers for licensed cigar photography and a future Supabase/S3 media-storage wire-up.

---

## B. Working Features

- Full SmokeCraft Phase 0–13 chain (see Section G) — every "Continue" button navigates to the correct next phase, back buttons work, no dead ends.
- `getNextSmokecraftRoute(completedSteps)` (`src/constants/session.js:71-74`) correctly resumes an in-progress session at the right phase.
- Guest session persistence (`GuestSessionContext.jsx` → `sessionStorageService.js`) — XP, completedSteps, stamps, badges, profile all survive a page reload via `localStorage`.
- Passport stamp award pipeline (`utils/passportProgress.js`) — validates against `STAMP_CATALOG`, prevents duplicate stamps, only fires from real action call sites (e.g. `PassportStamp.jsx:248`, `SessionComplete.jsx:60`, `LeafChallenge.jsx:117`).
- POS3 order flow: `createTicket`, `addItem`, `changeQuantity` (`services/pos3/orderService.js`) and `calcTotals` (`services/pos3/paymentService.js`, real `price * qty` + tax math, not hardcoded).
- POS3 kitchen/bar/humidor routing (`services/pos3/stationRoutingService.js`) — real per-item destination routing with dedicated queue services and display pages.
- E.A.T. dashboard reads live ops-event-bus/POS3 state (`services/eat/eatOpsAnalyticsService.js`), not static seed arrays.
- Role/permission route protection (`ProtectedRoute`) correctly wraps every `/pos3/*`, `/eat/*`, `/admin`, `/founder`, `/dev-diagnostics`, etc. route — none of those are reachable without the right role/permission.
- Build passes with `npm install && npm run build` — no errors, only a pre-existing chunk-size warning (cosmetic, non-blocking).

---

## C. Broken Features

None found. No route imports resolve to missing files, no duplicate route paths, no blank-rendering routes among the routes that are wired into navigation.

---

## D. Dead Buttons / Dead Tiles

None found. Every button has a real `onClick`, `type="submit"`, or `disabled` gate tied to real state (e.g. `disabled={!form.ageConfirmed}` in `Enroll.jsx:394`, `disabled={!selected}` in `Format.jsx:1533/1537`). No `onClick={() => {}}` or console-log-only handlers exist in `src/pages` or `src/components`.

One static (non-interactive) disabled button was found at `src/pages/passport/PassportEvents.jsx:93` — it has no `onClick` because it's intentionally disabled (no live event to act on), not a dead button.

---

## E. Missing Backend Connections

- `src/components/smokecraft/SmokeCraftPassportUploadCard.jsx:66` — `// TODO: Wire to Supabase/S3/Railway storage once SmokeCraft media storage exists.` Photo upload UI exists but has no real storage destination yet.
- `src/services/smokecraft/smokeUploadLinkService.js:21,32` — SMS/email delivery provider for upload links is not yet wired (placeholder).
- `SmokeBackendReadinessPanel` itself (`src/components/smokecraft/SmokeBackendReadinessPanel.jsx`) honestly reports that several rows (e.g. "Inventory sync") are `pending (no real inventory integration)` — this is accurate self-reporting, not a hidden gap, but confirms inventory sync between POS3 and a real venue inventory system does not exist yet.

These are documented, non-blocking gaps — not silently broken features.

---

## F. User-Facing Items That Should Be Staff Only — **FIXED THIS PHASE**

Found on three guest-facing SmokeCraft pages (no auth required to view):

1. **`src/pages/smokecraft/Scorecard.jsx`** (pre-fix lines 236-241, 255-266)
   - A collapsible "Developer Diagnostics" section rendering `<SmokeBackendReadinessPanel />`, exposing raw backend/database/API connectivity status to guests.
   - Two buttons literally labeled **"Open POS3 (Staff Access)"** and **"Open E.A.T. Summary (Staff Access)"** that `navigate('/pos3')` / `navigate('/eat')` directly from the guest scorecard screen.
2. **`src/pages/smokecraft/EventChallenge.jsx`** (pre-fix line 215) — always-visible `<SmokeBackendReadinessPanel compact />` on a guest challenge-status screen.
3. **`src/pages/smokecraft/Leaderboard.jsx`** (pre-fix line 584) — always-visible `<SmokeBackendReadinessPanel compact />` on the guest leaderboard screen.

These routes (`/smokecraft/scorecard`, `/smokecraft/event-challenge`, `/smokecraft/leaderboard`) carry **no role/auth gate** — they are guest-accessible by design — so any visitor could see internal backend/database mode, API reachability, and direct links into staff-only POS3/E.A.T. tooling. This is a direct violation of the standing rule ("Anything related to admin, venue settings, inventory management, backend controls, analytics, or staff operations must be hidden from normal users").

**Fix applied:** removed the diagnostics panel and the two staff-access buttons/section from all three guest pages. The underlying `/pos3` and `/eat` routes remain fully intact and `ProtectedRoute`-gated for staff who reach them through the correct staff login flow — only the guest-screen leak was removed. See Section L for the file diff list.

No other staff/admin/backend-control UI was found leaking onto guest routes.

---

## G. SmokeCraft Phase 0–13 Status

| Phase | Step | Route | File | Status |
|---|---|---|---|---|
| 0 | Entry Gate | `/smokecraft` | `SmokeCraft.jsx` | ✅ Working |
| 1 | Profile Capture | `/smokecraft/enroll` | `Enroll.jsx` | ✅ Working |
| 2 | Shape/Size/Burn Education | `/smokecraft/format` | `Format.jsx` | ✅ Working |
| 3 | Seed & Soil | `/smokecraft/seed-soil` | `SeedSoil.jsx` | ✅ Working |
| 4 | Mentor Selection | `/smokecraft/mentor-selection` | `Mentor.jsx` | ✅ Working |
| 5 | Gold Box Rules | `/smokecraft/golden-box` | `GoldenBox.jsx` | ✅ Working |
| 6 | Humidor Match | `/smokecraft/humidor-match` | `HumidorMatch.jsx` | ✅ Working |
| 7 | Cut/Toast/Light | `/smokecraft/cut-toast-light` | `CutToastLight.jsx` | ✅ Working (chains through `request-purchase` first, by design) |
| 8 | First Third | `/smokecraft/first-third` | `FirstThird.jsx` | ✅ Working |
| 9 | Second Third | `/smokecraft/second-third` | `SecondThird.jsx` | ✅ Working |
| 10 | Final Third | `/smokecraft/final-third` | `FinalThird.jsx` | ✅ Working |
| 11 | Scorecard/Ranking | `/smokecraft/scorecard` | `Scorecard.jsx` | ✅ Working (staff-link leak fixed, see F) |
| 12 | 360 Passport Stamp | `/smokecraft/passport-stamp` | `PassportStamp.jsx` | ✅ Working |
| 13 | Session Complete | `/smokecraft/session-complete` | `SessionComplete.jsx` | ✅ Working |

Verified by reading every `navigate()` call in each phase file — the chain is unbroken: Enroll → Format → Seed/Soil → Mentor → Golden Box → Humidor Match → Request/Purchase → Cut/Toast/Light → First Third → Second Third → Final Third → Scorecard → Passport Stamp → Connections → Management Sync → Session Complete. This matches `SMOKECRAFT_FLOW` order in `src/constants/session.js:38-53`.

Beyond Phase 13, four **supplemental** steps (`terroir`, `pairing-mastery`, `vitola`) plus `Assistant.jsx` are "Coming Soon" stubs (`ComingSoon` component, 4–14 lines each). These are **not part of the required Phase 0–13 protocol** — they're listed as steps 17–19 in the legacy/supplemental section of `SMOKECRAFT_FLOW` (`session.js:54-68`) and in a separate alt-flow respectively. They do not block the 0–13 chain and were left as-is per the "no redesign / no deleting systems" rule — flagging here per the report requirement, not fixing, since they're outside Phase 0–13 scope.

---

## H. Passport Status

- **Stamps**: saved via `awardStamp()` → `awardPassportStamp()` (`utils/passportProgress.js`) into `session.smokecraftStamps`, persisted to `localStorage` (`sessionStorageService.js`), and synced to backend via `/api/passport/{id}/stamps` on sync. Validated against a real catalog (`data/passportCatalog.js`), duplicates blocked.
- **Achievements/Badges**: `addBadge()` (`GuestSessionContext.jsx:86-93`) starts from an empty array and only appends on real call sites (e.g. `GoldenBoxStatus.jsx`) — no static pre-populated badge list.
- **Session history**: `completedSteps`, `xp`, `createdAt`/`updatedAt`, and `smokeCraft.eventLog` persist across reloads via `localStorage` and are not reset except by an explicit `resetGuestSession()` call.
- **Verdict**: real, action-driven persistence — not mock data.

---

## I. POS 3 Status

- **Order creation**: `createTicket()` (`services/pos3/orderService.js:35-73`) — real, creates a ticket with items array, emits an ops-bus event to E.A.T.
- **Menu/item selection**: `POS3_MENU` seed (`data/pos3/seedData.js`) provides real menu items with price/station; `addItem()` adds them to a ticket.
- **Quantity changes**: `changeQuantity()` (`orderService.js:148-160`) — works, clamps to ≥0.
- **Totals**: `calcTotals()` (`services/pos3/paymentService.js:12-21`) — real `price * qty` sum + tax (8.5%) + tip + service fee, verified used correctly in `POS3Checkout.jsx`.
- **Kitchen/bar/humidor routing**: `routeTicket()` (`services/pos3/stationRoutingService.js:17-39`) — routes each line item to the correct queue (kitchen/bar/humidor) with dedicated display pages (`KitchenDisplay.jsx`, `BarDisplay.jsx`, `HumidorControl.jsx`).
- **Handheld/touchscreen flow**: `POS3Handheld.jsx` exists and is routed/protected.
- **Verdict**: fully functional, not a mock.

---

## J. E.A.T. Status

- Dashboard (`EATCommandHub.jsx` + `services/eat/eatOpsAnalyticsService.js`) reads **live** data: ticket counts, revenue, destination breakdown, pending humidor requests, staff activity — all derived from the shared ops event bus / POS3 ticket state, not static arrays.
- `EAT_ALERTS`/`EAT_INVENTORY` in `data/eat/seedData.js` are reference/seed data used to bootstrap local state, clearly segregated in `/src/data/`, not returned as fake "live" numbers on every read.
- Management-only areas (`/eat/*`) are correctly wrapped in `ProtectedRoute` with `requiredPermission="access_eat_command"` and `demoBlocked` — not reachable by a guest or in demo mode.
- **Prior issue**: three guest SmokeCraft pages leaked a raw backend-readiness panel and direct staff-route links — fixed, see Section F.

---

## K. Launch Blockers

1. **(FIXED)** Staff-only diagnostics panel + "Open POS3 / Open E.A.T." staff-access buttons leaking onto guest pages (`Scorecard.jsx`, `EventChallenge.jsx`, `Leaderboard.jsx`). See Section F/L.

No other launch-blocking issues were found. Build is green, routes are intact, phase chain is complete, persistence is real, role separation is otherwise correct.

---

## L. Recommended Fix Order (and what was actually fixed this phase)

1. ~~Build errors~~ — none found.
2. ~~Broken routes~~ — none found.
3. ~~Dead buttons~~ — none found.
4. ~~SmokeCraft Phase 0–13 progression~~ — already correct, no changes needed.
5. ~~Passport save/stamp logic~~ — already correct, no changes needed.
6. ~~POS 3 order flow~~ — already correct, no changes needed.
7. **E.A.T./staff route separation — FIXED.** Removed the "Developer Diagnostics" `<SmokeBackendReadinessPanel>` block and the "Open POS3 (Staff Access)" / "Open E.A.T. Summary (Staff Access)" buttons from `src/pages/smokecraft/Scorecard.jsx`; removed the always-visible `<SmokeBackendReadinessPanel>` from `src/pages/smokecraft/EventChallenge.jsx` and `src/pages/smokecraft/Leaderboard.jsx`. No layout/visual redesign — these were full removals of leaked staff-only content, with surrounding cards/sections otherwise untouched.
8. Backend persistence issues — none found; documented gaps (Supabase/S3 media storage, SMS/email link delivery, real inventory sync) are pre-existing, intentionally-flagged TODOs, not regressions, and are left as-is per the "no redesign / no deleting systems" rule for this phase.

`npm run build` was re-run after the Section F fix and passed cleanly (see commit for this branch).
