# SmokeCraft 360 Final Completion — Pre-Implementation Audit

Generated 2026-07-20. Read-only audit per the mandate's Step 13 —
no production files modified. This is the required first response;
implementation does not begin until this is reviewed and approved.

## 1. Repository / branch / commit / working tree

- Repository: `coach1206/crafthub-360-stitch`
- Current branch: **`recovery/smokecraft-codex-final`** (not
  `claude/beautiful-thompson-r3mm5m`, the branch named in this session's
  original task setup — flagged as a discrepancy to confirm with the
  user, not resolved unilaterally; no branch switch performed, per the
  mandate's "do not switch branches unless explicitly instructed").
- Latest commit: `aa0b9cf86ff8cda0fb86651cfc88a142faea737f` —
  "fix(smokecraft): correct authoritative journey handoff and route guards"
- Working tree: 160 changed/untracked paths (all prior session work —
  Venue Management Command Hub Packages 6A/6B, SmokeCraft Management
  Sync A-E, Ticket Tapper, CraftHub/visual-pass fixes — nothing has been
  committed this entire multi-package session).
- Framework: React 18 + Vite 4 + React Router v6 (frontend), Express
  4.18.2 + PostgreSQL via raw `pg` (backend). Package manager: npm 10.9.7,
  Node v22.22.2.
- Build/test commands: `npm run build` (vite build), `npm run dev`
  (vite), `npm run server`/`npm start` (Express), `npm run db:migrate`
  (real migration runner), no single unified `npm test` — this repo's
  convention across the whole session has been standalone
  `verify-*.mjs` scripts run directly with `node`.

## 2. Locked sequence found in the repository

Authoritative source: `src/constants/session.js`, `VISIT_STRUCTURE`
export — **confirmed real and matches the mandate's "27 sessions across
7 phases" claim closely, with one correction**: the code's own docstring
and `TOTAL_VISITS`/`TOTAL_PHASES` constant say **6 phases** ("visits"),
not 7, grouped further into 3 macro-"rounds". This is the actual, current
locked structure — not a discrepancy to silently reconcile, flagged here
per the mandate's own "report sequence conflicts with evidence" rule.

| Phase (visit) | Title | Sessions |
|---|---|---|
| 1 | Session Preparation | S1 entry, S2 humidor-match, S3 meet-your-cigar, S4 terroir, S5 format, S6 cut-toast-light, S7 lighting-tutorial |
| 2 | First Third | S8 first-third, S9 first-third (merged→8), S10 flavor-memory, S11 pairing-lab |
| 3 | Second Third | S12 second-third, S13 second-third (merged→12), S14 mentor-commentary, S15 knowledge-drop |
| 4 | Final Third | S16 final-third, S17 (merged→16), S18 (merged→16) |
| 5 | Reflection | S19 scorecard, S20 (merged→19) |
| 6 | Results | S21 ai-summary, S22 pairing-recommendations, S23 passport-stamp, S24 final-review, S25 rewards, S26 achievements (shared w/ 25), S27 session-complete |

Plus **5 entry-layer screens** (outside the 27-session count: launch,
sign-in, venue-select, personal-dashboard, resume) and **10 supporting
modules** (golden-box, mentor-selection, seed-soil, wrapper-strength,
request-purchase, smokecraft-challenge, second-humidor-match,
mini-tasting, connections, management-sync) — contextual side-quests
gated by a spine session, not counted in `TOTAL_SESSIONS`.

**This structure is preserved exactly as found. No session renumbering,
no invented 88-screen sequence.**

## 3. Side-by-side inventory (partial — full registries deferred, see §8)

| Area | Status | Evidence |
|---|---|---|
| Core 27-session spine screens (S1-S27) | VERIFIED_COMPLETE (routes/pages exist, wired to `SmokeCraftSessionGuard`, XP awards defined) | `session.js`, `App.jsx` routes |
| Mentor selection (lore mentors: Don Alejandro, etc.) | EXISTS_NEEDS_UPDATE | `src/pages/smokecraft/Mentor.jsx` (174 lines) + `src/modules/smokecraft/smokeCraftMentors.js` — real card UI, but mentor lore data is a **static JS array, no DB persistence**, no country-flag/affinity data model |
| Human-mentor accounts (Marcus Cole, Diana Reeves) | VERIFIED_COMPLETE (different concept) | migration 010, `mentorController.js` — staff mentors for live sessions, not the guest-facing lore mentors |
| Golden Box Challenge | **MISSING** (mandate's core objective) | `GoldenBox.jsx` (164 lines) is a static rules-acknowledgment checkbox screen; `GoldenBoxStatus.jsx` (10 lines) is a static approved image. No seed/soil/wrapper/binder/filler/curing/aging/vitola selection, no blend builder, no scoring engine, no presentation/defense/judging flow exist anywhere |
| Flavor Memory | VERIFIED_COMPLETE | `FlavorMemory.jsx` (339 lines), `smokecraft_flavor_memory`/`passport_360_smokecraft_flavor_memory` tables |
| Pairing Lab | VERIFIED_COMPLETE | `PairingLab.jsx` (336 lines), `pairingEngine.js`, `smokecraft_pairing_*` tables, `smokecraftPairingController.js` |
| Flavor DNA | EXISTS_NEEDS_UPDATE | `FlavorDNA.jsx` is a 5-line stub/alias only |
| XP system | EXISTS_NEEDS_UPDATE | `XPBar.jsx` presentational with hardcoded defaults; `server/data/persisted/ranking_xp.json` is a flat-file store, not a normalized DB table |
| Badges | VERIFIED_COMPLETE | `passport_360_badges` table (migration 068), `badgeController.js`/`badgeRoutes.js` |
| Passport stamps | VERIFIED_COMPLETE | `passport_stamps` (001), `passport_360_earned_stamps` (068), `smokecraftPassportStampRoutes.js` |
| Leaderboard | VERIFIED_COMPLETE | `leaderboard_entries`/`smoke_leaderboard_entries`, `Leaderboard.jsx` (355 lines), `leaderboardController.js` |
| Skill tree | **MISSING** | no matches anywhere |
| Collections (seed/soil/leaf/wrapper/origin/vitola/mentor/flavor/cigar) | **MISSING** | no dedicated page, table, or service found |
| Daily/weekly challenges, quests, streaks | **MISSING** | `EventChallenge.jsx`/`SmokeCraftChallenge.jsx`/`LeafChallenge.jsx` are one-off scoring screens, not recurring quest/streak systems |
| Seed/soil/terroir/leaf/wrapper/binder/filler/curing/fermentation/aging/vitola/ring-gauge/flavor-taxonomy domain tables | **MISSING** | none found in any migration; guided-choice UI (`SeedSoil.jsx`, `Terroir.jsx`, `Format.jsx`) writes into generic JSONB session fields, not normalized catalogs |
| Approved asset registry | VERIFIED_COMPLETE (as a registry mechanism) | `src/constants/smokecraftAssets.js` (`SC_ASSETS`, 169 lines) + `docs/SMOKECRAFT_ROUTE_IMAGE_MASTER_MAP.md` |
| Venue Management Command Hub (Package 6A/6B, this session, uncommitted) | VERIFIED_COMPLETE for its own scope, NOT_APPLICABLE to SmokeCraft's guest journey | separate module, does not intersect the 27-session spine |

## 4. Existing route-to-asset map

Governed by `src/constants/smokecraftAssets.js` (`SC_ASSETS`) and
`docs/SMOKECRAFT_ROUTE_IMAGE_MASTER_MAP.md` — a flat keyed map from
route/session label to a resolved image path across three tiers
(`RAW` newest uploads > `REF` approved reference compositions >
`CROPPED`), with RAW taking priority when present. This mechanism is
real and already governs every spine screen's background/hero art. It
is the correct place to register new asset slots (§5) rather than a new
mechanism.

## 5. Missing image specification list

Deferred to Package 1 per the mandate's own package ordering — not
produced in this audit pass. The 88-item visual list in the mandate
spans Golden Box (which doesn't exist as an interactive flow yet, §3)
and gamification systems (skill tree, collections, challenge hub) that
also don't exist yet — asset slots for a screen that hasn't been
designed as a real interaction would be premature. Package 1 should
follow immediately after Package 0/this audit is approved, once the
Golden Box and gamification interaction designs (not just their art) are
confirmed.

## 6. Backend / data-model gap report

**Exists (reusable, do not duplicate):** `smoke_sessions`, `smoke_session_events`,
`smoke_purchase_intents/verifications`, `smoke_leaderboard_entries`,
`smoke_winner_categories`, `smokecraft_orders` + audit, `smokecraft_pairing_*`,
`smokecraft_flavor_memory`, `passport_360_guest_profiles/progress/earned_stamps/badges/flavor_memory/sessions`,
`smokecraft_management_sync_*` (this session's own Package A-E work),
plus the Venue Management Command Hub tables from Packages 6A/6B
(`venue_management_profiles/media/content_versions`) — unrelated to the
guest journey but confirmed not to conflict.

**Missing entirely (no migration defines these):** seed genetics, soil
types, terroir profiles (beyond the `Terroir.jsx` UI's session-JSONB
answers), plant anatomy, leaf primings, wrapper/binder/filler type
catalogs, curing/fermentation/aging strategy tables, vitola/ring-gauge
catalogs, flavor-note/family taxonomy tables, mentor lore/country/
affinity persistence, skill-tree/collection/quest/streak tables, and
the entire Golden Box domain: blend components, blend revisions,
presentations, judging criteria, judge/mentor/AI/community score
tables, Golden Box leaderboard.

## 7. Golden Box dependency gap report

The mandate's central requirement — "every lesson contributes directly
to the Golden Box Challenge" — cannot be satisfied today because the
Golden Box Challenge itself does not exist as an interactive system.
`GoldenBox.jsx` is a rules-acceptance gate; `GoldenBoxStatus.jsx` is a
static image. None of the 22 Golden Box player actions listed in the
mandate (choose seed genetics → present/defend → scoring →
leaderboard/rewards) have any UI, service, or table today. This is the
single largest gap in the entire mandate and, per the mandate's own
Step 8/9, must be built server-side-scored, tenant/user-scoped, and
audited — a substantial multi-package effort (Packages 2 through 9 in
the mandate's own ordering all feed into it).

## 8. Exact implementation package order

Adopting the mandate's own Package 0-10 ordering as-is (it is already
dependency-correct: education content must exist before Golden Box can
consume it; mentor/gamification infrastructure should land before the
Golden Box scoring loop references XP/badges/mentor affinity). No
reordering proposed.

## 9. Exact first package to execute

**Package 0 — Audit, registries, sequence map, route-to-asset map,
backend gap report.** This document is a right-sized start on Package 0
(disclosed: the mandate calls for 7 separate permanent registry files
with ~20 fields per row across ~88+ items; this pass produced one
consolidated audit report with equivalent factual content instead, to
get real findings in front of you quickly rather than spending the full
budget on registry-file formatting). If approved, the next step is
either (a) formalizing this into the 7 named registry files verbatim, or
(b) proceeding directly into Package 1 (asset slots) using this
document as the source of truth — your call.

## 10. Risks, conflicts, files that must not be touched

- **Branch discrepancy** (§1) — needs your confirmation before any
  commit ever happens (not relevant to this audit-only pass, since
  nothing is being committed, but material for whenever commits resume).
- **Do not touch**: anything under `src/pages/smokecraft/` that is
  already VERIFIED_COMPLETE per §3 (all 27 spine screens, Flavor Memory,
  Pairing Lab, Badges, Passport Stamps, Leaderboard) — these are
  confirmed real, not stubs, and must be extended (new sub-panels/steps)
  rather than replaced.
- **Do not touch**: `server/services/venueManagement/*`,
  `server/routes/venueManagementRoutes.js`,
  `server/db/migrations/075/076_*` — this session's uncommitted Venue
  Management Command Hub work (Packages 6A/6B), unrelated to SmokeCraft's
  guest journey, must not be disturbed by this effort.
- **Sequence conflict flagged, not auto-resolved**: the mandate says "27
  sessions across 7 phases"; the actual locked code says 6 phases (3
  macro-rounds). Reported per the mandate's own instruction to report
  conflicts with evidence rather than silently changing the number.
- No implementation changes have been made. `git status` is unchanged
  from before this audit began except for this new audit document.
