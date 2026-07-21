# Phase 1 — Passport 360 Architecture Audit

## What already existed (migration 068 and related)

Migration `068_passport_360_smokecraft_live_persistence.sql` created **7 real, additive-only tables**, all still present and unchanged this pass:

1. `passport_360_guest_profiles` — the real identity table. `UNIQUE(tenant_id, venue_id, guest_reference)`.
2. `passport_360_guest_progress` — XP/level/session-count per `(guest_id, module_key)`. `UNIQUE(guest_id, module_key)`.
3. `passport_360_earned_stamps` — `UNIQUE(dedupe_key)` — real, working idempotent stamp storage.
4. `passport_360_badges` — badge records per guest.
5. `passport_360_smokecraft_flavor_memory` — taste-tag/tasting-notes storage.
6. `passport_360_smokecraft_sessions` — per-session completion snapshots.
7. `passport_360_sync_audit_log` — append-only sync event log.

**These tables and their schema were reused as-is. No new migration was required or created.**

## Existing backend code — what works vs. what is falsely represented as connected

- `server/services/passport360/passport360SmokeCraftPersistenceService.js` — **real, working, database-backed read/write functions** (`createOrResolveGuestProfile`, `awardPassportStampLive` with real `dedupe_key` idempotency, `getGuestEarnedStamps`, etc.). This layer is genuinely sound and was reused directly by this pass's new sync service.
- `server/controllers/passport360SmokeCraftController.js` + `server/routes/passport360SmokeCraftRoutes.js` (mounted at `/api/passport-360/smokecraft`) — **the API layer wrapping the above is insecure by design**: every route reads `guestId`, `xpAmount`, `stampId`, `sessionStatus`, etc. directly from `req.body` with **zero authentication and zero identity verification**. A client can call `POST /api/passport-360/smokecraft/xp/award` with any `guestId` and any `xpAmount` and it will be written to the real database. This is exactly the "browser can fabricate XP/stamps/completions" failure mode this Passport pass exists to close. **This is a real, pre-existing defect, confirmed by direct code inspection**, not a guess from a route name.
- `server/routes/smokecraftPassportStampRoutes.js` (mounted at `/api/smokecraft/passport-stamp`) — **an entirely separate, in-memory-only** (`new Map()`, resets on server restart) stamp-claim system. Also fully client-trusted: `xpEarned`, `totalXP`, `finalScore`, `stampCount` are all taken verbatim from `req.body`. **Never persisted to PostgreSQL at all** — directly contradicts the requirement that Passport state "must survive refreshes, sessions, supported devices."

## Existing frontend — what is static vs. what is falsely represented as connected

- `src/pages/passport/PassportProfile.jsx` — **was 100% static/local before this pass**: XP from a general NOVEE OS `useGuestSession()` local session object, `stamps = session.smokecraftStamps?.length ?? 11` (a **hardcoded fallback of 11**), `conns = 12`, `events = 5` (both **hardcoded literal constants**), `Passport No.: 'PC-2026-001'`, `Issued: 'Jun 1, 2026'` — all fabricated, never backend-read. **Fixed this pass** — see `03-SMOKECRAFT-SYNC.md`.
- `src/pages/passport/PassportStamps.jsx` — **already partially honest**: it attempts a real backend read (`getEarnedStampsWithBackend()` → `src/services/passportService.js`) and, when the backend is unavailable, explicitly displays "LOCAL PASSPORT PREVIEW — Backend Not Connected" rather than fabricating data. This is a good, pre-existing pattern. However, it reads via a **different local identity** (`session.passport.passportId`, generated client-side by the general NOVEE OS guest-session system) than the real, server-verified SmokeCraft `guest_reference` this pass's new sync uses — see "Identity fragmentation" below. **Not rewired this pass** (see `02-IDENTITY-MAPPING.md` for why).
- `src/pages/passport/PassportDirectory.jsx` — **fully fake**: 8 hardcoded fictional people ("Michael Reynolds", "Alicia Chen", "David Harper", etc.) with fabricated bios, companies, and "shared events." No real cross-learner directory architecture exists anywhere in the codebase. **Fixed this pass**: gated behind a real backend check that honestly reports "Directory Not Yet Available" instead of showing fabricated people (per the mandate's explicit instruction not to build a real people directory this pass, and to show an honest unavailable state instead).
- `src/pages/passport/PassportConnections.jsx` (825 lines) — uses `src/api/passportConnectionsApi.js`, which is **fully simulated**: `getAllConnections()`/`findConnection()` read from a hardcoded local file (`src/data/connectionsData.js`), `verifyConnection()` and `scanConnection()` use `setTimeout` delays and (for scan) return a **random** person from the fake list. This is a "meet a stranger via QR scan" social feature — a fundamentally different concept from what this mandate's "Passport Connections" domain means (real Craft/mentor/venue/event connections). Building a real version of this specific feature is explicitly out of scope this pass ("New Passport social network," "Public people directory without an approved privacy model"). **Not rebuilt this pass** — disclosed here, left untouched.
- `src/pages/smokecraft/PassportStamp.jsx` — a well-built, honest-feeling UX (real eligibility checks, real duplicate detection, real offline handling) but its backend target is the insecure in-memory `/api/smokecraft/passport-stamp/claim` route described above. Its `completedSteps` eligibility check is also client-reported, not server-verified against real per-session completion state — a limitation of the broader, pre-existing 27-session journey-tracking architecture (client-tracked `journey` state via `SmokeCraftJourneyContext`), not something invented or fixable within this pass's scope without a "broad refactor" across all 27 sessions (explicitly forbidden). **Disclosed, not touched.**
- `src/pages/smokecraft/Connections.jsx` — despite the name, this is **not** a people-connections feature at all — it is a local, session-scoped "which platforms would you like to share your journey on" preference selector (Instagram/Facebook/etc. checkboxes), persisted only to `SmokeCraftJourneyContext` local journey state, same as every other session-preference screen in the 27-session flow. It makes no completion or ownership claim requiring backend verification. **No fix needed — this screen was never falsely representing itself as backend-connected Passport data.**

## Identity fragmentation (a real, discovered architectural fact)

Three separate "identity" concepts coexist in the codebase:
1. **SmokeCraft's verified guest identity** (`req.smokecraftIdentity.id`, a signed JWT `guest_reference`) — the identity every completed SmokeCraft pass (Filler Arrangement, Skill Tree, Collections, Challenge Hub, Blend Fault) is scoped by, and the identity this pass's new secure sync uses.
2. **The general NOVEE OS `GuestSessionContext` local session**, which generates its own client-side `session.passport.passportId` — used by the pre-existing `PassportProfile.jsx`/`PassportStamps.jsx`/`passportService.js` code path, calling the insecure Phase F.5 API.
3. **The fully local, fake `connectionsData.js` fixture people** used by `PassportDirectory.jsx`/`PassportConnections.jsx`.

**This pass's real, secure Passport identity is #1** — matching the mandate's primary objective ("SmokeCraft must connect to one persistent 360 Passport identity"). Unifying #1 and #2 into a single passport identity system app-wide would be a large, cross-cutting architectural change well beyond this pass's scope (it touches every NOVEE OS module, not just SmokeCraft) — disclosed here as a real, known limitation rather than silently ignored or fabricated as "already unified."

## What can be reused

The full migration-068 schema, `passport360SmokeCraftPersistenceService.js`'s write/read primitives (`createOrResolveGuestProfile`, `awardPassportStampLive`, `saveSmokeCraftSessionToPassport`, `getGuestPassportProgress`, `getGuestEarnedStamps`, `getGuestBadges`), and the existing `smokecraft_progression_events` shared event log plus every completed pass's own learner-state table (`smokecraft_skill_tree_learner_state`, `smokecraft_collection_ownership`, `smokecraft_challenge_learner_state`, `smokecraft_blend_fault_attempts`, `smokecraft_filler_arrangement_completion`) and `xp_accounts.balance` as the real evidence sources.

## What was fixed this pass

A new, secure, identity-gated synchronization layer (`server/services/passport360/passport360SyncService.js` + controller + routes, mounted at `/api/passport-360/sync`) that never trusts a client-submitted `guestId`, stamp, XP amount, or completion flag — every write is derived from real evidence and gated by the verified `req.smokecraftIdentity.id`. `PassportProfile.jsx` was rewired to read real data from it. `PassportDirectory.jsx` was gated to show an honest unavailable state instead of fake people.

## What is intentionally deferred

- Unifying the NOVEE OS general Passport identity (#2 above) with SmokeCraft's verified identity (#1).
- Rebuilding the old, insecure `/api/passport-360/smokecraft/*` and `/api/smokecraft/passport-stamp/*` APIs to be secure (left running, unchanged, disclosed as insecure — not used by the new sync layer).
- A real cross-learner Directory or social-scan Connections feature (both explicitly out of scope).
- Golden Box milestone sync into Passport (no approved mapping exists yet — `goldenBox.connected: false`, disclosed).
- Taste-profile sync (no confirmed real data source per guest exists yet — `tasteProfile.connected: false`, disclosed).
