# SmokeCraft 360 — Integration Map (Doc 5 of 10)

Source of truth: `docs/smokecraft/integration/SMOKECRAFT_DEPENDENCY_CLOSURE.json`,
`docs/smokecraft/integration/SMOKECRAFT_MIGRATION_MAP.json`, and
`docs/smokecraft/integration/MAIN_CANDIDATE_CHANGE_MANIFEST.json`.

This branch (`integration/smokecraft-main-candidate`) merges two lineages:
**main** (`af3956bb0eacb8fff5bb285951fb0247399f1e1a`, the app this ships
alongside — POS360, E.A.T., NOVEE OS) and **recovery**
(`84f96015dcf7784982b6418546558baae1a1bb51`, `recovery/smokecraft-codex-final`,
a separately-evolved SmokeCraft build with a working live-DOM implementation).
Method: pull from recovery **only** what a genuinely reproduced runtime
failure named — never speculative imports.

## Frontend brought in from recovery

- All `src/pages/smokecraft/*.jsx` screens on the canonical spine, plus their
  supporting-module siblings (Connections, SecondHumidorMatch, MiniTasting,
  SmokeCraftChallenge)
- `src/context/SmokeCraftJourneyContext.jsx`, `SmokeCraftOrderContext.jsx`
- `src/constants/smokecraft*.js` — loyalty, landing actions/CTA, navigation
  registry, live-screen tokens, journey status, screen manifest, component
  registry, interaction manifest, entry readiness, educational enrichment,
  asset version
- `src/hooks/useStartNewSmokeCraftJourney.js`, `useSmokeCraftMentorVoice.js`,
  `useSmokeCraftMentorGuidance.js`, `useSmokeCraftPairingEngine.js`
- `src/data/*.js` referenced by tested screens (leaf challenge rounds,
  knowledge-check questions, cultivation stages, venue inventory data, loyalty
  point rules, venue commerce/inventory seed, ticket-tapper specials)
- `src/services/smokecraft/*.js` API clients actually called by a tested
  screen (`assetResolver`, `pairingEngineApiClient`, `playerStateApiClient`,
  siblings)
- `src/services/{sessionStorageService,passportService,passportAdapter}.js` —
  swapped for recovery's versions because main's own lacked exports
  `GuestSessionContext`/`VisitLockGuard` require
- `src/utils/{pairingEngine,smokeCraftMoneyBridge,smokeCraftTaxConfig,smokeCraftSpecialsEngine,smokecraftLoyaltyEngine,smokecraftQuizScoring}.js`
- `src/lib/stripeClient.js` (transitively required by an import chain; only
  reads an env var, never imports `@stripe/stripe-js`)
- `public/assets/smokecraft/**` — 62 image files restored after a prior
  session's self-QA found `FlavorMemory.jsx` rendering a broken image

## Backend brought in from recovery

- `server/routes/{pos360SmokeCraftOrderBridgeRoutes,eatSmokeCraftLiveSyncRoutes,managementSyncRoutes,smokecraftTicketTapperSpecialsRoutes,smokecraftVenueCommerceRoutes,smokecraftPlayerStateRoutes,pairingEngineRoutes}.js`
  — mounted at distinct base paths alongside main's existing `/api/smokecraft`
  and `/api/eat/smokecraft` mounts, no collision
- `server/controllers` + `server/services/smokecraft/*` transitive chain:
  `playerStateService`, `selectionClassificationService`,
  `tastingObservationService`, `scorecardEvaluationService`,
  `pairingEngineService`, `progressionEventService`, `skillTreeService`,
  `sessionRewardTable`, `passport360SyncService`,
  `passport360SmokeCraftPersistenceService`
- `server/db/migrations/015–041` — 24 migrations renumbered from recovery
  (its own 017 / 038 / 068–070 / 074 / 079 / 092–105 / 119–121), plus 3
  main-authored: `039_smokecraft_venue_registry.sql`,
  `041_smokecraft_progression_events.sql` (new tables), and
  `040_smokecraft_pairing_flavor_memory.sql` (minimal extraction). Full
  per-file source/reason table in `SMOKECRAFT_MIGRATION_MAP.json`.

## Already on main, reused as-is (not duplicated)

- `server/middleware/{smokecraftGuestIdentity,roleMiddleware,authMiddleware}.js`
  — main's own real JWT-cookie identity system; no second identity scheme was
  invented for SmokeCraft
- Main's own `smoke_*`-prefixed and
  `smokecraft_activity_attempts/player_state/session_completions/tasting_drafts`
  tables — confirmed via `psql \dt` before pulling any migration referencing
  them; non-colliding naming convention vs. recovery's
  `pos360_*`/`eat_smokecraft_*`/`smokecraft_management_sync_*` tables

## Superseded, not extended

Main's pre-existing SmokeCraft screens (old `Identity.jsx`, `PassportStamp.jsx`,
parts of `Format.jsx`) used a **screenshot-hotspot architecture**
(`SmokeCraftAssetRoute` + invisible %-positioned hotspots over a baked PNG).
These were replaced wholesale by recovery's live-DOM equivalents, per the
explicit standing instruction not to reintroduce that pattern. Main's old
`/api/smokecraft` and `/api/eat/smokecraft` route handlers backing those
screens remain mounted (harmless, unreferenced by any live-DOM screen) rather
than deleted, matching the additive-integration approach.

## Deliberately excluded

- The full VenueHumidor commerce/admin/payment subsystem
  (`src/pages/smokecraft/venueHumidor/**`) — would have required an untested
  `@stripe/stripe-js` dependency and sits outside the tested canonical
  journey. Files remain present but unrouted.
- `helmet`, `sharp` *(initially — later added as a tooling-only dev
  dependency, see below)*, `@aws-sdk/client-s3`, `@dnd-kit/core`,
  `@dnd-kit/utilities`, `stripe` — none actually imported by any required
  runtime code path
- Roughly 80 of recovery's ~107 candidate migrations, classified
  UNRELATED or OBSOLETE-SUPERSEDED (VenueHumidor schema, unused Golden Box
  sub-detail tables, duplicate/renamed variants of tables main already has)

## New dependencies added to this branch

| Package | Why |
|---|---|
| `express-rate-limit ^8.5.2` | Runtime — required by `managementSyncRoutes.js`'s real rate limiter |
| `sharp` | Dev/tooling only — used by `scripts/captureSmokecraftMigrationRealJourney.mjs` to composite contact sheets and by the owner-rebuild image-crop passes; not imported by any app runtime code path |

## Database migration safety

- Applied to a **disposable** database (`crafthub_integration_candidate`),
  never production
- Every migration uses `CREATE TABLE IF NOT EXISTS` / `CREATE INDEX IF NOT
  EXISTS` — confirmed idempotent by applying the full loop twice
- Verified via `\dt` before/after: no table-naming collisions between
  recovery's and main's conventions
- Zero destructive operations — every migration is additive (`CREATE`,
  never `DROP` or `ALTER … DROP COLUMN`)

## Real defects found and fixed while building this branch

1. Missing `/api/smokecraft/player-state` routes — stalled the journey at
   Humidor Match (S2)
2. Missing `/api/smokecraft/pairing-engine` route — stalled it at Pairing
   Recommendations (S22)
3. Missing `pairingType` field in the frontend's pairing-engine request
   payload — a pre-existing bug in the ported source, second half of the
   same stall
4. Missing `smokecraft_progression_events` table — third root cause of the
   same stall (`42P01 undefined_table` on every pairing-engine call)
5. Missing `venues`/`venue_memberships`/`venue_permissions` tables — broke
   Management Sync entirely
6. 62 missing image assets, including the one causing `FlavorMemory.jsx` to
   render raw broken-image alt text
7. Two visual dead-space defects (Connections, Second Humidor Match), fixed
   with real content sections
8. A trailing-slash string-comparison bug in the canonical-journey test
   script itself (2 locations)
9. Three stale/missing selectors in supporting test scripts

## server/index.js reconciliation

Reconciled **additively**: 7 new route mounts added, 0 removed. Main's
identity middleware, existing `smoke_*` tables, and all non-SmokeCraft routes
are untouched.
