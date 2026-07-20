# Do-Not-Touch / Protection Registry

For each protected system: why protected, what change is allowed, what
test is required after a permitted change, rollback path.

## VERIFIED_COMPLETE SmokeCraft systems

| System | Files | Why protected | Allowed change | Required test after change | Rollback |
|---|---|---|---|---|---|
| Flavor Memory | `src/pages/smokecraft/FlavorMemory.jsx`, `smokecraft_flavor_memory`/`passport_360_smokecraft_flavor_memory` tables | Real, tested, interactive game with persistence | Additive extension only (e.g. new flavor-family tagging for Golden Box reuse) | Re-run existing manual verification + any new Golden Box integration test | `git diff`/`git checkout` the specific file (never a blanket reset) |
| Pairing Lab | `src/pages/smokecraft/PairingLab.jsx`, `src/utils/pairingEngine.js`, `smokecraft_pairing_*` tables | Real interactive pairing builder with real engine logic | Extract `pairingEngine.js` into a reusable service for Golden Box (additive), never modify its existing session-scoped behavior | Existing PairingLab manual flow + new Golden Box pairing-defense flow | Same as above |
| Badges | `passport_360_badges`, `badgeController.js`/`badgeRoutes.js` | Real, persisted | Additive: new Golden-Box-specific badge rows/types | Badge award flow re-tested | Same |
| Passport Stamps | `passport_stamps`, `passport_360_earned_stamps`, `PassportStamp.jsx`, `smokecraftPassportStampRoutes.js` | Real, persisted, animated | Additive: new Golden-Box-completion stamp type | Stamp award/animation re-tested | Same |
| Leaderboard | `leaderboard_entries`/`smoke_leaderboard_entries`, `Leaderboard.jsx`, `leaderboardController.js` | Real, persisted | Additive: new Golden-Box-specific leaderboard view/query | Leaderboard render + query re-tested | Same |
| All 27 locked-session spine screens (§02 registry) | `src/pages/smokecraft/*.jsx` per session.js | Approved, live guest journey, real backend integration (Management Sync Packages B-D) | New content must be inserted as sub-panels/steps/overlays within the existing screen, never a screen replacement | Full A-E Management Sync regression suite + affected session's manual flow | Per-file `git diff`/targeted revert |
| Locked 27-session sequence itself | `src/constants/session.js` (`VISIT_STRUCTURE`, `TOTAL_SESSIONS`, `SUPPORTING_MODULES`, `ENTRY_LAYER_SCREENS`) | The single source of truth for route guards, unlock logic, progress UI across the entire journey | No renumbering, no reordering, no new primary session without explicit owner approval (see Decision 1) | Full sequence-integrity check (`verify-smokecraft-authoritative-sequence.mjs` once confirmed passing) | Per-file revert |

## Venue Management Command Hub (unrelated protected module, this session's Package 6A/6B)

| Files | Why protected | Allowed change | Required test | Rollback |
|---|---|---|---|---|
| `server/db/migrations/075_venue_management_command_hub.sql`, `076_venue_management_profiles.sql` | Approved, tested schema for a completely separate module (venue-manager-facing, not guest-facing) | None from SmokeCraft completion work | `verify-venue-management-command-hub-package-6b.mjs` (33/33 must remain passing) | Do not touch — if ever needed, revert only these two files |
| `server/services/venueManagement/*`, `server/controllers/venueManagementController.js`, `server/routes/venueManagementRoutes.js` | Same | None | Same | Same |
| `src/pages/venueManagement/*`, `src/services/venueManagement/*` | Same | None | Same | Same |
| `server/index.js` route-mount lines for `venueManagementRoutes` | Shared entry file, but this specific mount line belongs to Venue Management | Must remain present; SmokeCraft work may add its own new mount lines but must never remove this one | Confirm `/api/venue-management` still resolves after any `server/index.js` edit | Diff review before any `server/index.js` commit |

## Shared platform infrastructure (touch with care, never remove existing lines)

| File | Why sensitive | Allowed change | Required test |
|---|---|---|---|
| `server/index.js` | Mounts every module's routes; a bad edit here breaks the whole platform | Additive route mounts only | Boot the server, confirm `/api/health` 200 and all existing mounted routes still resolve |
| `src/App.jsx` | Registers every route in the app | Additive route registrations only, within the correct nested guard structure | `npm run build` + spot-check a few unrelated routes still render |
| `.gitignore` | Shared | Additive only | N/A |

## Test scripts and proof (Category A/F from the path registry)

All `verify-*.mjs` scripts and `public/proof/**` directories from prior
packages (Management Sync A-E, Ticket Tapper, Venue Management 6A/6B,
CraftHub visual corrections) are protected evidence — modify only to fix
a script bug, never to weaken an assertion, and never delete proof
directories without regenerating them via the owning suite first.
