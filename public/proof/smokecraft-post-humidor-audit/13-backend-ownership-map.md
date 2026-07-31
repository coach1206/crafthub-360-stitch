# Backend Ownership Map — Post–Venue Humidor Remaining Systems

For each major remaining SmokeCraft feature area: canonical service,
database table(s), API surface, and whether persistence is real
(server/DB-owned) or frontend-only. Venue Humidor's own ownership map
is unchanged and out of scope here (see
`docs/smokecraft/SMOKECRAFT_VENUE_HUMIDOR_ARCHITECTURE_MAP.md`).

| Feature | Canonical service | DB table(s) | API mount | Ownership |
|---|---|---|---|---|
| Curriculum XP/progression | gameplay engine (Holistic Fix 5A) service files | player-state tables (migration set covering HF4/5A) | `/api/smokecraft/...` gameplay routes | ✅ Server/DB-owned, idempotent |
| Golden Box submissions | `server/services/goldenBox/packagingStudioService.js` | migrations 090, 102 | Golden Box routes | ✅ Server/DB-owned |
| Golden Box judging | `server/services/goldenBox/judgingService.js` | migration 103 | judge/scorecard routes | ✅ Server/DB-owned |
| Golden Box results | (results-authority service, migration 104) | migration 104 | results routes | ✅ Server/DB-owned |
| Golden Box awards | `server/services/goldenBox/awardsService.js` | migration 105 | awards routes | ✅ Server/DB-owned, single reachability path confirmed |
| Golden Box events | `server/services/goldenBox/goldenBoxEventService.js` | dedicated Golden Box event tables | n/a (internal) | ✅ Append-only, server-owned |
| Pairing engine | `server/services/smokecraft/pairingEngineService.js` | `smokecraft_pairing_saves`, `smokecraft_pairing_save_revisions` | pairing engine routes | ✅ Server/DB-owned |
| Mentor guidance/voice/narration | mentor guidance/voice/narration services (HF5B) | mentor-related tables (HF5B migrations) | mentor routes | ✅ Server/DB-owned, guest-scoped isolation confirmed |
| Collections (Passport, in-game) | collections service (HF5A-3F) | `smokecraft_collection_ownership` | collections routes | ✅ Server/DB-owned |
| Skill tree | skill-tree service (HF5A-3G) | skill-tree tables | skill-tree routes | ✅ Server/DB-owned |
| Leaderboard | leaderboard service (HF5A-3H) | leaderboard-backed by real score totals | leaderboard routes | ✅ Server/DB-owned |
| Tasting drafts (gameplay, non-purchase) | tasting service | `smokecraft_tasting_drafts` (migration 097) | tasting routes | ✅ Server/DB-owned — confirmed in Venue Humidor 1B-2B-4 discovery audit as gameplay-only, not purchase-linked |
| Progression event ledger (shared) | `progressionEventService.js` | `smokecraft_progression_events` (migration 085) | n/a (internal, reused by many domains) | ✅ Append-only, idempotent, shared correctly (not duplicated) across pairing/mentor/Venue Humidor/collections |

## What was NOT found to be frontend-only or unowned

No feature audited this pass was found storing its authoritative state
only in `localStorage` or component state without a real server/DB
counterpart. Every domain's own dedicated test suite (all re-run and
passing this pass) specifically asserts server-side persistence,
idempotency, and cross-session/cross-tab correctness — these are not
assumptions, they are the literal assertions in the passing suites
cited in each companion audit document.

## Scope boundary

This map was built by re-running existing suites and reading existing
canonical docs/source, not by exhaustively re-deriving every table and
route from a blank slate. Areas not covered by a passing dedicated
suite this pass (e.g. some of the ~78 "supporting module" routes
outside the 27-session curriculum spine, per
`docs/smokecraft/SMOKECRAFT_GAME_MANIFEST.json`'s own classification
system) were not individually re-verified — see
`05-interaction-defects.md` for the route-level sweep results, which is
the broader coverage mechanism for anything not covered by a named
domain suite.
