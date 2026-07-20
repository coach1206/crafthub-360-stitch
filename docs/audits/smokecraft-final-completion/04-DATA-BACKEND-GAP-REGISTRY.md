# Data & Backend Gap Registry

For each domain: current source, existing table, existing API, frontend
consumer, persistence level, scope, missing fields/relationships,
security concern, migration requirement, implementation package.

| Domain | Current source | Existing table | Existing API | Frontend consumer | Persistence | Scope | Missing | Security concern | Migration needed | Package |
|---|---|---|---|---|---|---|---|---|---|---|
| Users | `system_users` | migration 002 | `authService.js`, various | app-wide | Real DB | Global | — | none new | No | — |
| SmokeCraft enrollment | `smoke_sessions` and journey context | migration 011 | session routes | `enroll`/`WelcomeExperience.jsx` | Real DB + journey context | User/guest | — | none new | No | — |
| Visit/session progress | `completedSteps` in journey context, `smokecraft_management_sync_journeys` | migration 074 | Management Sync API | all spine screens | Real DB (server-backed since Package D) | User/guest | Not all 27 sessions independently trackable (merges) | none new | No | — |
| Session completion | Same as above | same | same | same | Real | User/guest | Same merge limitation | none new | No | — |
| Quiz answers | Unclear — `KnowledgeDrop.jsx` not deep-audited | none identified | none identified | `KnowledgeDrop.jsx` | UNKNOWN | UNKNOWN | Not confirmed persisted | UNKNOWN | Possibly, pending confirmation | Package 2/8 |
| XP | `server/data/persisted/ranking_xp.json` (flat file), `XPBar.jsx` (hardcoded defaults) | **none** (no XP table) | none identified | `XPBar.jsx`, `Rewards.jsx` | Flat JSON file, not normalized | Unclear tenant/user scope | Real `xp_transactions`/`xp_balances` tables | flat file is not auditable/tenant-scoped | **Yes** | Package 8 |
| Achievements | Shared with Badges/Rewards | see Badges | `badgeController.js` | `Rewards.jsx` | Real DB | User | — | none new | No | — |
| Badges | `passport_360_badges` | migration 068 | `badgeController.js`/`badgeRoutes.js` | `Rewards.jsx` | Real DB | User | — | none new | No | — |
| Passport stamps | `passport_stamps`, `passport_360_earned_stamps` | migrations 001, 068 | `smokecraftPassportStampRoutes.js` | `PassportStamp.jsx` | Real DB | User | — | none new | No | — |
| Mentors (lore/guest-facing) | `src/modules/smokecraft/smokeCraftMentors.js` static array | **none** | **none** | `Mentor.jsx`, `MentorCommentary.jsx` | **Static JS, no DB** | N/A (not scoped) | Full DB persistence: id, portrait, flag, country, specialty, bio, affinity, unlock requirements | none currently — becomes relevant once affinity/scoring is added | **Yes** | Package 7 |
| Mentor lore | same as above | same | same | same | same | same | same | same | Yes | Package 7 |
| Human mentor accounts (staff, e.g. Marcus Cole) | `mentor_specialties`, `mentor_sessions`, `mentor_tasting_notes` | migration 010 | `mentorController.js` | staff-facing mentor console | Real DB | Staff/venue | Different concept from guest-facing lore mentors — do not conflate | none new | No | — |
| Flavor Memory | `smokecraft_flavor_memory`, `passport_360_smokecraft_flavor_memory` | migrations 029, 068 | `FlavorMemory.jsx` direct | `FlavorMemory.jsx` | Real DB | User | No shared flavor-family taxonomy table | none new | Taxonomy table optional | Package 6 |
| Pairing Lab | `smokecraft_pairing_profiles/recommendations/audit` | migration 029 | `smokecraftPairingController.js` | `PairingLab.jsx` | Real DB | User | Pairing engine not exposed as a reusable Golden Box service | none new | Service refactor, no migration | Package 6/9 |
| Leaderboard | `leaderboard_entries`, `smoke_leaderboard_entries` | migrations 001, 011 | `leaderboardController.js` | `Leaderboard.jsx` | Real DB | Global/venue | No Golden-Box-specific leaderboard | Yes, additive | Package 9 |
| Golden Box competition | **none** | **none** | **none** | `GoldenBox.jsx` (rules only) | **None** | **None** | Entire domain — see `07-PACKAGE-1-GOLDEN-BOX-CONTRACT.md` | Server-side scoring must never leak client-side | **Yes, extensive** | Package 9 |
| Golden Box entries | none | none | none | none | none | none | `golden_box_entries` + related | proprietary formula protection | Yes | Package 9 |
| Blend recipes | none | none | none | none | none | none | `golden_box_blends`, `golden_box_entry_components` | privacy (blind judging) | Yes | Package 9 |
| Seed genetics | none | none | none | `SeedSoil.jsx` writes free-text/JSONB only | session JSONB only | User (loose) | `seed_genetics` catalog table | none new | Yes | Package 2 |
| Soils | none | none | none | `SeedSoil.jsx` | session JSONB only | User (loose) | `soil_types` catalog table | none new | Yes | Package 2 |
| Terroir | none | none | none | `Terroir.jsx` | session JSONB only | User (loose) | `terroir_profiles`/`growing_regions` catalog | none new | Yes | Package 2 |
| Plant anatomy | none | none | none | none | none | none | `plant_anatomy` reference table (or static content, TBD) | none | Maybe (could be static content) | Package 2 |
| Leaf primings | none | none | none | none | none | none | `leaf_primings` catalog | none | Yes | Package 2 |
| Wrapper | none | none | none | none | none | none | `wrapper_types` catalog | none | Yes | Package 3 |
| Binder | none | none | none | none | none | none | `binder_types` catalog | none | Yes | Package 3 |
| Filler | none | none | none | none | none | none | `filler_types` catalog | none | Yes | Package 3 |
| Long/short filler | none | none | none | none | none | none | field on `filler_types` or separate enum | none | Yes (part of above) | Package 3 |
| Curing | none | none | none | none | none | none | `curing_methods` catalog | none | Yes | Package 3 |
| Fermentation | none | none | none | none | none | none | `fermentation_strategies` catalog | none | Yes | Package 3 |
| Aging | none | none | none | none | none | none | `aging_strategies` catalog | none | Yes | Package 3 |
| Vitolas | none (Format.jsx is UI-only) | none | none | `Format.jsx` | session JSONB only | User (loose) | `vitolas` + `ring_gauges` catalogs | none | Yes | Package 4 |
| Flavor taxonomy | Partially in `smokecraft_flavor_memory` payloads, no shared table | see Flavor Memory | none dedicated | `FlavorMemory.jsx`, `PairingLab.jsx` | Partial/informal | User | `flavor_notes`/`flavor_families` catalog | none | Yes (optional but recommended) | Package 6 |
| Judging | none | none | none | none | none | none | `golden_box_judges`, `judging_criteria`, `golden_box_scores` | judge identity/anti-collusion | Yes | Package 9 |
| Scores | none (Scorecard.jsx is session-scoped self-rating, different concept) | see Scorecard | `Scorecard.jsx` writes to session/Management Sync snapshot | `Scorecard.jsx` | Real (session-scoped) | User | Golden-Box-specific multi-category scoring is a separate, new concept | proprietary formula protection | Yes (Golden Box scores) | Package 9 |
| Competition rounds | none | none | none | none | none | none | `golden_box_rounds` | none | Yes | Package 9 |
| Collections | none | none | none | none | none | none | Entire domain missing (seed/soil/leaf/wrapper/origin/vitola/mentor/flavor/cigar collections) | none | Yes | Package 8 |
| Skill tree | none | none | none | none | none | none | Entire domain missing | none | Yes | Package 8 |
| Daily challenges | none (only one-off scoring screens) | none | none | `SmokeCraftChallenge.jsx` (one-off, not recurring) | none | none | Entire recurring-challenge domain missing | none | Yes | Package 8 |
| Weekly challenges | none | none | none | none | none | none | same | none | Yes | Package 8 |
| Quests | none | none | none | none | none | none | same | none | Yes | Package 8 |
| Streaks | none | none | none | none | none | none | same | none | Yes | Package 8 |
| Rewards | `passport_360_badges`, `passport_stamps`, `Rewards.jsx` | migrations 001/068 | `badgeController.js` | `Rewards.jsx` | Real DB | User | Golden-Box-specific reward tier not yet defined | none new | Extend, minimal migration | Package 9 |
| Image uploads | **none for guest-facing SmokeCraft content** — Venue Management Command Hub (Package 6B, separate module) built a real upload pipeline this session, not reusable for guest-facing Golden Box content without review | `venue_management_media` (unrelated module) | `server/services/venueManagement/*` (unrelated module) | Venue Management Command Hub only | Real DB (different module) | Venue-manager scoped | SmokeCraft guest-facing image uploads (if the mandate needs learner-submitted Golden Box presentation images) are unbuilt | Same MIME/size/dimension rigor as 6B if built | Yes, if learner uploads are required | Package 9 |
| Audit events | `audit_logs` (category `VENUE`, `AUTH`, etc., fixed CHECK list) | migration 001+ | `auditAction()` middleware | all privileged endpoints | Real DB, append-only (trigger-enforced) | Global | No `GOLDEN_BOX` category exists in the `action_category` CHECK constraint yet | Must add a category value via migration before Golden Box audit calls can use it (reusing `'VENUE'` would misclassify) | Yes, small ALTER | Package 9 |

## Frontend-only state currently doing the work of a backend (flagged)

- `localStorage`/`sessionStorage`: `SmokeCraftJourneyContext.jsx`
  (`sc_journey_v1`), `GuestSessionContext.jsx` — real, intentional guest-
  session state, not a gap by itself, but any Golden Box work that reads
  "what has this learner learned" must pull from the **server-backed**
  Management Sync journey/snapshot data (Package B-D), not re-derive
  truth from client-side local storage alone.
- Hardcoded arrays: `smokeCraftMentors.js` (mentor lore), `session.js`
  (`XP_AWARDS` constant values) — both real and intentional as static
  content/config, but XP amounts being hardcoded in frontend JS rather
  than server-validated is a real gap once Golden Box scoring depends on
  cumulative XP for eligibility (Decision 5).
