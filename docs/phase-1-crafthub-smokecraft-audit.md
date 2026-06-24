# Phase 1 — CraftHub & SmokeCraft Audit (Pre-Novi OS Connection)

**Scope note:** This is an audit and documentation pass only. No files were moved, no code was rebuilt, no visuals were changed. All findings below are sourced from direct file reads and grep against the repo, not assumption.

## 1. Current Structure

### CraftHub

- **Public hub:** `src/pages/CraftHub.jsx` — guest-facing module launcher (`/crafthub`), `ROW1_MODULES`/`ROW2_MODULES` arrays listing SmokeCraft, PourCraft, WineCraft, BeerCraft, Passport Connections, Staff Handoff, DayOne360 Travel.
- **Public explainer:** `src/pages/PublicCraftHubLanding.jsx` (`/system-explained`) — explains the NOVEE OS → CraftHub 360 → POS 3 → E.A.T. hierarchy.
- **Private admin home:** `src/pages/NoveeHome.jsx` (`/home`, `/novee-home`) — `ProtectedRoute` roles `['admin','founder_level_0','developer']`, `demoBlocked=true`. 16-card module grid.
- **Master control component:** `src/components/commandhub/CommandHub.jsx` (1160 lines) — rendered by `src/pages/Home.jsx`. Contains `commandModules` (18 tiles), `ecosystem` map (CraftHub 360 as center node, 9 subsystems), Ultra Command Center (20+ sections), NOVEE Vault (9 domains), Remote Software Control, Connected Venues panel, Venue Mirror Command Hub, a 27-entity data model.
- **Routes:** defined in `src/App.jsx` (675 lines) — `/`, `/boot`, `/boot/console`, `/home`, `/novee-home`, `/crafthub`, `/system-explained`, plus all admin/founder/manager/staff routes (`/admin`, `/founder`, `/ultra-command-center`, `/novee-vault`, `/remote-software-control`, `/venue-mirror`, `/pos3/*`, `/eat/*`, `/kiosk-setup`, `/device-status`, `/install-help`, `/venue-test`).
- **Shared components:** `components/commandhub/CommandHub.jsx` (18+ exported subcomponents), `components/common/TicketTicker.jsx`, `components/staffhandoff/StaffHandoffButton.jsx`, `components/security/ProtectedRoute.jsx`, `components/security/DevRoleSwitcher.jsx`, `components/security/RequestAccessModal.jsx`, `components/kiosk/KioskShell.jsx`, `components/demo/DemoBanner.jsx`, `components/premium/PremiumPanel.jsx`.
- **Backend routes:** `server/routes/{smokecraftRoutes,smokecraftOrders,smokecraftEatRoutes,passportRoutes,leaderboardRoutes,pos3Routes,eatRoutes,pos3IntegrationRoutes,adminRoutes,founderRoutes,mentorRoutes,auditRoutes,syncRoutes,deploymentRoutes,badgeRoutes}.js`.
- **Config:** `package.json` (scripts: dev/build/preview/start/server/dev:full), `server/index.js` (PORT 3001, CORS_ORIGIN required in prod, DATABASE_URL optional with in-memory fallback, `EXPECTED_BADGE` build-check string, 30+ mounted route bundles), `.env.example` (DATABASE_URL, CORS_ORIGIN, PORT, NODE_ENV, LOG_LEVEL, TWILIO_*, AWS_*, STRIPE_*), `src/config/roleMap.js`, `server/config/permissions.js`.

### SmokeCraft

- **Entry point:** `src/pages/SmokeCraft.jsx` (guest-accessible, mounted at `/smokecraft`).
- **44 screen files** under `src/pages/smokecraft/`. Core 13-phase flow: `Enroll → Format → SeedSoil → Mentor → GoldenBox/GoldenBoxStatus → HumidorMatch → RequestPurchase → CutToastLight → FirstThird → SecondThird → FinalThird → Scorecard → PassportStamp → SessionComplete`. Supplemental/educational screens: `Identity, Art, Origins, Leaves, LeafChallenge*, Cultivation, Blend, FlavorDNA, Pairing, Terroir, PairingMastery, Vitola, Available, Assistant, Connections, Leaderboard, HowItWorks, GuestPass, Demo, Scan, ComingSoon, ManagementSync, EventChallenge`.
- **Mentor system:** `Mentor.jsx` (367 lines) — `MENTORS` array (6 named mentors: Don Alejandro/DR, Javier Estelí/Nicaragua, Doña Jamastran/Honduras, Mateo San Andrés/Mexico, Maestro Rafael/Cuba, plus Peru). `useMentorVoice()` hook. Separate protected `src/pages/MentorConsole.jsx` (`/mentor-console`, permission `access_mentor_console`) and `server/routes/mentorRoutes.js`.
- **Scoring system:** `src/services/smokecraft/smokeWinnerService.js` — 13 winner categories (Golden Box Champion, Best Pairing Architect, Most Unique Blend, Master Wrapper Award, Ring Gauge Strategist, etc.), `STATUS` enum (`earned/eligible/close/partial/pending/locked/not_qualified`). XP awards and rank tiers in `src/constants/session.js` (18 XP awards, 4 rank tiers: Novice/Enthusiast/Connoisseur/Aficionado).
- **Passport stamp logic:** `PassportStamp.jsx` builds a stamp payload from session data (mentors, format, scorecard, identity-reveal status, networking status) — nulls left null rather than fabricated. Backed by `src/data/passportCatalog.js` (`STAMP_CATALOG`), `server/routes/passportRoutes.js`, `server/services/passportService.js`.
- **POS hooks:** `src/services/smokecraft/smokePOSHandoffService.js` (`getSmokePOSHandoff`, `createSmokePurchaseIntent`, `getSmokePurchaseRewardStatus`) — unidirectional SmokeCraft → POS 3 handoff.
- **EAT hooks:** `server/routes/smokecraftEatRoutes.js` — pairing/order selections trigger kitchen/bar/humidor signals consumed by E.A.T.'s ticker.
- **Staff controls:** none exist specifically for SmokeCraft today — see Section 4.
- **Guest/user screens:** all 44 SmokeCraft screens are guest-accessible and demo-allowed; zero are `ProtectedRoute`-wrapped.
- **Backend logic:** `server/routes/smokecraftRoutes.js` (session CRUD with DB/in-memory fallback via `withDbFallback`), `smokecraftOrders.js` (legacy pairing orders), `smokecraftEatRoutes.js`, `badgeRoutes.js`, `leaderboardRoutes.js`; services in `src/services/smokecraft/` (`smokeWinnerService`, `smokePOSHandoffService`, `smokeSharedStorageService`, `smokeUniquenessService`, `smokePairingScoreService`, `smokeLeaderboardService`, `smokeBackendApiClient`, `smokeUploadLinkService`).

## 2. What Works Now

- Full guest SmokeCraft journey (enroll → mentor → score → stamp → session complete) is real and functional, backed by real session CRUD endpoints with DB/in-memory fallback.
- Passport stamp payload construction is honest — it does not fabricate fields it can't compute.
- POS 3 and E.A.T. handoffs from SmokeCraft are event-driven and unidirectional (no reverse writes), which keeps them safe from a sync/race standpoint.
- Role/permission gating (`ProtectedRoute`, role hierarchy guest→staff→manager→admin→founder_level_0, sidecar permissions `access_pos3_staff`/`access_eat_command`/`access_mentor_console`/`view_diagnostics`) is centralized and consistently applied — verified directly in `src/App.jsx` and `ProtectedRoute.jsx`.
- An operational event bus (`src/services/shared/opsEventBus.js`) already models `SYSTEMS = { SMOKECRAFT, POS3, EAT, NOVEE }` as four first-class systems publishing/consuming events — this is the existing seam a future "Novi OS" system would most naturally plug into.

## 3. What Needs Separation

- **SmokeCraft phase/flow logic is currently page-local**, not extracted into a standalone, reusable "craft session engine." The 13-phase flow, XP awards, and winner-category logic live inside `src/constants/session.js` and `src/services/smokecraft/*` but are still SmokeCraft-specific in naming and structure — if PourCraft/WineCraft/BeerCraft are to reuse this engine, it needs a generic, vendor-agnostic core (e.g., parameterized phase list, generic XP/rank table) with SmokeCraft as one configured instance, not the only instance.
- **CommandHub.jsx (1160 lines) is a monolith** mixing master-control UI, data-model definitions, ecosystem maps, and module metadata in one file — any Novi OS work should treat this as the system it must talk to, not a file to copy logic out of piecemeal.
- **Mentor data (6 named mentors) is hardcoded inside `Mentor.jsx`** rather than sourced from a config/data file — this should become a data file before any reuse outside SmokeCraft is attempted.
- **Permission/module name strings are duplicated across files** (e.g., "SmokeCraft 360" appears in `CommandHub.jsx`, `CraftHub.jsx`, `NoveeHome.jsx` independently) rather than sourced from one shared constants file — low risk today, but a real duplication-of-truth problem if Novi OS needs to reference these names too.

## 4. What Should Become a Reusable Module

- **Craft session engine** (phase sequencing, XP/rank progression, winner-category evaluation) — currently SmokeCraft-only logic in `src/constants/session.js` + `src/services/smokecraft/smokeWinnerService.js`. Should be generalized so PourCraft/WineCraft/BeerCraft (already stubbed as "coming soon" modules) and any future Novi-OS-orchestrated craft module can configure it rather than re-implement it.
- **Mentor system** (`Mentor.jsx` data + `useMentorVoice` hook + `MentorConsole.jsx`/`mentorRoutes.js`) — structurally already separate from the SmokeCraft phase flow; a clean candidate to extract into a standalone "mentor" module if other craft modules want mentor guidance.
- **Passport stamp payload builder** (`PassportStamp.jsx`'s `buildStampPayload`, `STAMP_CATALOG`) — already mostly generic; just needs its construction logic moved out of a SmokeCraft-specific page file into a shared service so PourCraft/etc. can call it identically.
- **POS/EAT handoff services** (`smokePOSHandoffService.js`, `smokecraftEatRoutes.js`) — the handoff *pattern* (unidirectional intent creation, event-driven, idempotent) is sound and reusable; the *implementation* is SmokeCraft-named and would need a generic version if other modules are to use the same POS/EAT hooks.

## 5. Security Concerns

- **No regressions found** — role/permission gating for `/admin`, `/founder`, `/ultra-command-center`, `/novee-vault`, `/remote-software-control`, `/venue-mirror`, `/pos3/*`, `/eat/*` is all intact and unchanged from prior phase audits.
- **Founder bypass** (`isFounder()` in `ProtectedRoute.jsx`) always passes every check, including demo-mode blocking — this is existing, intentional behavior, not a new finding, but worth flagging as a single point of total privilege that any Novi OS integration must not widen.
- **Dev-only staff/founder PIN credentials** in `src/data/staffHandoffRegistry.js` are gated behind `import.meta.env.DEV` and stripped from production builds via Vite dead-code elimination — confirmed not a production exposure, but should never be copied into any Novi OS scaffolding without the same `import.meta.env.DEV` guard.
- **Zero SmokeCraft screens are staff-gated** — by design, since SmokeCraft is fully guest-facing. This means SmokeCraft itself has no privileged surface to leak; the risk surface lives entirely in the POS/EAT/admin systems it hands off to, which are already gated.

## 6. POS/EAT Dependency Concerns

- SmokeCraft → POS 3 handoff (`smokePOSHandoffService.js`) and SmokeCraft → E.A.T. handoff (`smokecraftEatRoutes.js`) are both real, already-wired, unidirectional integrations — not decorative, not faked.
- These handoffs are SmokeCraft-specific in naming/implementation today. If Novi OS is meant to sit "above" CraftHub/SmokeCraft and orchestrate across modules, it should integrate via the existing `opsEventBus` (`SYSTEMS.NOVEE` already modeled) rather than calling into `smokePOSHandoffService.js` directly — calling the SmokeCraft-specific service directly would create tight coupling that defeats the purpose of a reusable module boundary.
- POS 3 and E.A.T. backend routes (`pos3Routes.js`, `eatRoutes.js`, `pos3IntegrationRoutes.js`) remain permission-gated (`access_pos3_staff`, `access_eat_command`) — any Novi OS connection must read from these via the same gated paths, not bypass them.

## 7. Must NOT Be Moved Into Novi OS

Novi OS should **control** CraftHub/SmokeCraft, not **duplicate** them. Specifically, do not move or copy:

- The 44 SmokeCraft screen files or their phase flow — these stay in `src/pages/smokecraft/`.
- The mentor data/system — stays associated with SmokeCraft/craft modules, referenced by Novi OS, not re-implemented inside it.
- Passport stamp storage/award logic (`passportService.js`, `passportRoutes.js`) — Novi OS may read aggregated Passport data but must not maintain its own copy of stamp state.
- POS 3 and E.A.T. transactional/operational data and routes — Novi OS may observe via the event bus or read gated endpoints, but must not re-implement order/kitchen/bar/humidor logic.
- Staff/admin permission logic itself (`ProtectedRoute.jsx`, `roleMap.js`, `server/config/permissions.js`) — Novi OS must consume this system, not fork a parallel one.

## 8. Staff-Only vs. User-Facing Classification

**Guest/user screens:** `/crafthub`, `/system-explained`, all `/smokecraft/*` (44 screens), all `/passport/*`, `/pourcraft`, `/beercraft`, `/winecraft`, `/leaderboard`, `/dayone360*`, `/boot`, `/offline`, `/demo`.

**Staff screens:** `/pos`, `/pos3/*` (permission `access_pos3_staff`), `/device-status` (staff+), `/kiosk-setup`, `/install-help`, `/venue-test` (manager+).

**Vendor/manager-admin screens:** `/eat`, `/eat/*`, `/eat-legacy` (permission `access_eat_command`), `/venue-mirror` (roles `manager/admin/founder_level_0`), `/system-overview`.

**Novi/NOVEE admin screens:** `/home`, `/novee-home` (roles `admin/founder_level_0/developer`), `/admin`, `/founder`, `/ultra-command-center`, `/novee-vault`, `/remote-software-control` — all `demoBlocked=true`.

**Security-sensitive features:** founder bypass logic in `ProtectedRoute.jsx`; staff PIN handoff registry (`staffHandoffRegistry.js`, dev-only); sync/audit/conflict staff panels (`SyncStatusPanel.jsx`, `SyncConflictReviewPanel.jsx`, `SyncAuditTimelinePanel.jsx`) confined to `EATCommandHub.jsx`/`POSIntegrationHub.jsx`; payment-adjacent code (`paymentService.js`/`CheckoutDrawer`).

## 9. Recommended Next Step

Do not begin moving or rebuilding code yet. Before any Novi OS connection work:

1. Extract the SmokeCraft mentor data (`MENTORS` array) and the craft-session XP/rank/winner-category logic into dedicated, vendor-agnostic data/service files — this is prerequisite groundwork for reusability, independent of Novi OS.
2. Define the exact integration contract Novi OS will use to observe CraftHub/SmokeCraft/POS/E.A.T. (most likely: extend `opsEventBus.SYSTEMS` with a `NOVI` entry and consume read-only aggregated data, never duplicate state).
3. Only after both of the above are scoped and agreed, begin a separate phase to actually wire Novi OS to read from these systems — as a controller/observer, never as a duplicate implementation.

## 10. Checks Run

- `npm run build` — **PASS** (no errors; pre-existing chunk-size/dynamic-import warnings unrelated to this audit).
- No SmokeCraft/CraftHub-specific regression script exists in `server/scripts/` today (only Phase 6H/6I sync/security checks exist, which are unrelated to CraftHub/SmokeCraft structure). No regression was introduced — this phase made no code changes.
