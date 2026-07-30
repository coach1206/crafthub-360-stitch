# SmokeCraft State Ownership Map — Holistic Fix 4

Generated: Holistic Fix 4, starting commit `742e5a61`.

## Method

This map was built by direct source inspection, not inference: reading
`GuestSessionContext.jsx`, `SmokeCraftJourneyContext.jsx`,
`SmokeCraftProgressContext.jsx`, `sessionStorageService.js`,
`syncQueueService.js`, and the live database schema (`\dt` +
`\d <table>` against `crafthub_smokecraft_final`), plus a live row-count
check on every table this document claims is "real" vs "unused".

## Executive summary

**The entire primary 27-session curriculum's progression, XP, rank,
badges, and Passport-stamp state is currently client-authoritative only.**
`GuestSessionContext` (backed by `localStorage['novee_guest_session']`
via `sessionStorageService.js`) is the sole read/write authority for XP,
rank, badges, `completedSteps` (session unlock/completion), and Passport
stamps. `SmokeCraftJourneyContext` (backed by
`localStorage['sc_journey_v1']`) is the sole authority for every
per-session decision/selection/note field (identity, mentor, format,
tasting notes, scorecard, pairing, Golden Box acknowledgement, etc.).
`SmokeCraftProgressContext` is a pure derived/computed layer with no
storage of its own — and, notably, the product **already honestly
discloses this** to the guest today via its own documented "Local
Preview Mode: progression is stored on this device only" message
(`SmokeCraftProgressContext.jsx` header comment) — this was not a hidden
defect, but it is exactly the condition the mandate requires closing.

A separate, real, working durable outbox (`syncQueueService.js`, backed
by IndexedDB, POSTing to `/api/sync/events`) exists and is genuinely
functional — but it is a **write-only audit/event mirror**, called from
exactly one place in `GuestSessionContext.jsx` (session-complete), not a
read-path authority. No screen ever loads its state FROM the server; the
server is never consulted to decide what a guest has already earned.

Several **real, working, idempotent backend persistence layers already
exist** in this codebase (`smokecraft_progression_events` — 397 real
rows, `idempotency_key` UNIQUE constraint enforced — and its
`server/services/smokecraft/progressionEventService.js` +
`skillTreeService.js` / `collectionsService.js` / `blendFaultService.js`
/ `fillerArrangementService.js` consumers) — but these serve **narrow,
separate mini-features** (Skill Tree, Collections, Blend Fault
Identification, Filler Arrangement), not the primary 27-session
curriculum's XP/badge/completion ledger. A separate real "Management
Sync" journey table (`smokecraft_management_sync_journeys`, with
cookie-based guest-identity middleware and per-request ownership checks
in `server/middleware/smokecraftGuestIdentity.js`) also exists and is
real, but again scoped to one narrow screen family, not the main
curriculum. Two tables this document might otherwise assume are "the"
persistence layer — `smokecraft_guest_sessions` and
`smokecraft_reward_audit` — have **zero rows** and are not written to
by any currently-mounted route: dead/unused scaffolding, not active
persistence.

## State field inventory

Legend — **Owner**: current de facto owner. **Authoritative owner**:
where this document assigns ultimate truth going forward.
**DB**: real Postgres table if one exists and is live-verified non-empty
or newly created this pass. **Duplicate-risk**: risk of a field being
written from two different code paths without reconciliation.

### IDENTITY

| Field | Current owner | Authoritative owner (target) | DB storage | API endpoint | Client cache | Update trigger | Persistence req. | Cross-device req. | Audit req. | Duplicate-risk | Migration status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| learner/guest ID | `sessionStorageService.js` (`guestId`, generated client-side) | Server (`smokecraft_player_state.guest_reference`, cookie-issued via `ensureSmokeCraftGuestIdentity`) | none (client-generated) | `POST /api/smokecraft/guest-session` (existing, management-sync-scoped) | `novee_guest_session` | Session creation | High | High | Low | Medium (client-generated ID is not verifiable server-side) | **Not migrated** |
| account ID | not modeled | N/A (no account system in this codebase) | none | none | none | — | — | — | — | — | **Out of scope — no auth/account system exists to migrate to** |
| active venue | `SmokeCraftJourneyContext.selectedVenue` | Client cache is acceptable (low duplicate-award risk) | none | none | `sc_journey_v1` | Venue Selection screen | Low | Medium | Low | Low | Not migrated (low risk, deferred) |
| selected mentor | `SmokeCraftJourneyContext.mentor` + `GuestSessionContext.selectedMentor` (two fields, two contexts) | Single authoritative field, server-synced | none | none | both `sc_journey_v1` and `novee_guest_session` | Mentor Selection screen | Low | Medium | Low | **High — two independent owners for one concept** | **Not migrated; duplicate-ownership defect documented, not fixed this pass** |
| language | not modeled (no i18n system) | N/A | none | none | none | — | — | — | — | — | Out of scope |
| accessibility preferences | not modeled | N/A | none | none | none | — | — | — | — | — | Out of scope |

### JOURNEY

| Field | Current owner | Authoritative owner (target) | DB storage | API endpoint | Client cache | Update trigger | Persistence req. | Cross-device req. | Audit req. | Duplicate-risk | Migration status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| current phase/session | `GuestSessionContext.completedSteps` (derived via `getCurrentAllowedSession`) | Server (`smokecraft_session_completions`) | **New this pass** (see schema) | **New**: `GET /api/smokecraft/player-state`, `POST /api/smokecraft/sessions/:id/complete` | `novee_guest_session` | Session completion | **High** | **High** | **High** | **High (client `if (done) return` only)** | **Migrated this pass (session-complete mutation only)** |
| unlocked sessions | derived client-side from `completedSteps` | Derived server-side from `smokecraft_session_completions` | New this pass | `GET /api/smokecraft/player-state` | `novee_guest_session` | recomputed on load | High | High | Medium | Medium | Migrated (read path) |
| completed sessions | `GuestSessionContext.completedSteps` array | `smokecraft_session_completions` rows | New this pass | `POST /api/smokecraft/sessions/:id/complete` | `novee_guest_session` (cache) | `completeSmokeCraftSession()` | High | High | High | High | **Migrated this pass** |
| completion timestamps | not separately tracked (only array membership) | `smokecraft_session_completions.completed_at` (server timestamp) | New this pass | same as above | none previously | same | Medium | Medium | High | Low | Migrated this pass |
| resume location | `SmokeCraftJourneyContext.resumeRoute/resumeScreenId` | Client cache acceptable; server-derivable from completions | none | derivable from player-state | `sc_journey_v1` | ResumeJourney mount | Low | Medium | Low | Low | Not migrated (derivable, low risk) |
| session attempts | not modeled | Deferred | none | none | none | — | — | — | — | — | Not modeled anywhere; out of scope this pass |
| lesson decisions (per-session selections) | `SmokeCraftJourneyContext` (30+ fields) | Client cache acceptable — these are learning-content inputs, not awards | none | none | `sc_journey_v1` | per-screen setters | Medium | Medium | Low | Low | Not migrated (no duplicate-award risk; deferred) |

### LEARNING

| Field | Current owner | Authoritative owner (target) | DB storage | API endpoint | Client cache | Update trigger | Persistence req. | Cross-device req. | Audit req. | Duplicate-risk | Migration status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| quiz answers/results | scattered: `smokecraft_quiz_questions`/`smokecraft_blend_fault_answers` (real DB, used by Blend Fault only) + `SmokeCraftJourneyContext.knowledgeDrop.quizScore` (client-only, main curriculum) | Split: Blend Fault already server-authoritative; main-curriculum quiz remains client cache (low risk — not an award trigger by itself) | Partial (Blend Fault only) | Blend Fault: existing `/api/smokecraft/blend-fault/*` | `sc_journey_v1` (main curriculum) | varies | Medium | Medium | Medium | Medium | Partially migrated (pre-existing, feature-specific) |
| slider decisions, hotspots, tasting entries, notes, reflections | `SmokeCraftJourneyContext` (firstThird, secondThird, flavorMemory, finalThird, scorecard) | Client cache acceptable | none | none | `sc_journey_v1` | per-screen setters | Low | Low | Low | Low | Not migrated (no award tied directly; deferred) |
| uploaded evidence | not modeled (no upload feature found in current curriculum screens) | N/A | none | none | none | — | — | — | — | — | Not applicable — no such feature exists to migrate |
| mentor interactions | `SmokeCraftJourneyContext.mentorCommentary` | Client cache acceptable | none | none | `sc_journey_v1` | MentorCommentary screen | Low | Low | Low | Low | Not migrated |

### GAMEPLAY

| Field | Current owner | Authoritative owner (target) | DB storage | API endpoint | Client cache | Update trigger | Persistence req. | Cross-device req. | Audit req. | Duplicate-risk | Migration status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| score/XP | `GuestSessionContext.xp` (client-computed sum, `completeSmokeCraftSession` has a client `if (completedSteps.includes(...)) return prev` guard) | **Server (`smokecraft_awards`, idempotency-key enforced)** | **New this pass** | **New**: `POST /api/smokecraft/awards/xp` (idempotent) | `novee_guest_session` (cache) | session completion | **High** | **High** | **High** | **High (was client-only)** | **Migrated this pass for the session-completion award path** |
| rank | derived client-side from `xp` via `getRankFromXP` | Same derivation, server-side authoritative once XP is server-tracked | derived (no separate column) | derivable from player-state | `novee_guest_session` | on XP change | Medium | Medium | Low | Low (pure function of XP) | Migrated (follows XP) |
| badges | `GuestSessionContext.badges` (client array, `addBadge` de-dupes by `id` client-side only) | **Server (`smokecraft_awards` type=badge, idempotency-key enforced)** | **New this pass** | **New**: `POST /api/smokecraft/awards/badge` (idempotent) | `novee_guest_session` (cache) | session completion / milestones | High | High | High | **High (was client-only)** | **Migrated this pass** |
| Passport stamps | `GuestSessionContext.smokecraftStamps` + `utils/passportProgress.js` (client) — separately, `smokecraft_passport_rewards` table exists in DB but is **not written by any mounted route** | **Server (`smokecraft_awards` type=passport_stamp, idempotency-key enforced)** | **New this pass** (existing `smokecraft_passport_rewards` table confirmed unused — not reused, see note below) | **New**: `POST /api/smokecraft/awards/passport-stamp` (idempotent) | `novee_guest_session` (cache) | Passport Stamp screen | High | High | High | **High (was client-only)** | **Migrated this pass** |
| collections | `smokecraft_collection_ownership`/`smokecraft_collection_items` (real DB, used by the separate Collections mini-feature only) | Already server-authoritative for that feature; not connected to main curriculum awards | Existing (pre-dates this pass) | Existing `/api/smokecraft/collections/*` | n/a | feature-specific | High | High | High | Low (already has `source_progression_event_id` FK to the idempotent events table) | Pre-existing, not touched this pass |
| streaks | not modeled | N/A | none | none | none | — | — | — | — | — | Not modeled anywhere; out of scope |
| challenge state | `smokecraft_challenge_instances`/`smokecraft_challenge_learner_state` (real DB, Challenge Hub feature only) | Already server-authoritative for that feature | Existing | Existing `/api/smokecraft/challenge-hub/*` | n/a | feature-specific | High | High | High | Low | Pre-existing, not touched this pass |
| leaderboard eligibility | `GuestSessionContext` computed score (client) | Deferred — depends on XP being server-authoritative first (now true for the completion path) | none | none | `novee_guest_session` | on demand | Medium | Medium | Low | Medium | Not migrated this pass (foundation laid, not wired) |

### PAIRING

| Field | Current owner | Authoritative owner (target) | DB storage | API endpoint | Client cache | Update trigger | Persistence req. | Cross-device req. | Audit req. | Duplicate-risk | Migration status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| cigar/beverage selections, pairing scores, reasoning | `SmokeCraftJourneyContext.pairing`/`pairingRecommendations` (client) — separately `smokecraft_pairing_drafts`/`smokecraft_pairing_profiles`/`smokecraft_pairing_recommendations` exist in DB (real, used by the venue-commerce pairing-lab flow, not the curriculum PairingLab screen) | Client cache acceptable for curriculum PairingLab (no award tied to it); DB path already exists for the commerce pairing flow | Partial (commerce flow only) | Existing `/api/smokecraft/pairing/*` (commerce flow) | `sc_journey_v1` (curriculum) | per-screen setters | Low (curriculum) / High (commerce, pre-existing) | Low / High | Low / Medium | Low | Not migrated (curriculum); pre-existing (commerce) |
| saved pairings / revision history | `smokecraft_pairing_draft_revisions` (real DB, commerce flow only) | Already server-authoritative for that feature | Existing | Existing | n/a | feature-specific | High | High | Medium | Low | Pre-existing, not touched this pass |

### GOLDEN BOX

| Field | Current owner | Authoritative owner (target) | DB storage | API endpoint | Client cache | Update trigger | Persistence req. | Cross-device req. | Audit req. | Duplicate-risk | Migration status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| drafts, versions, blend/packaging/branding config, judge submissions, scores, results, awards | Golden Box Packaging Studio has its own pre-existing real backend (`server/services/goldenBox/*`, `packagingStudioRoutes`, `goldenBoxContentRoutes`) — separate from the curriculum's simple `SmokeCraftJourneyContext.goldenBox` acknowledgement flag | Already server-authoritative for the Packaging Studio; curriculum's `goldenBox` field is only an "acknowledged" boolean, not the studio's real state | Existing (pre-dates this pass) | Existing `/api/smokecraft/golden-box/*`, `/api/smokecraft/golden-box/packaging-studio/*` | `sc_journey_v1.goldenBox` (curriculum ack only) | screen-specific | High (studio) / Low (curriculum ack) | High (studio) / Low (curriculum ack) | Medium | Low | Pre-existing (studio), not touched this pass |

### SYSTEM

| Field | Current owner | Authoritative owner (target) | DB storage | API endpoint | Client cache | Update trigger | Persistence req. | Cross-device req. | Audit req. | Duplicate-risk | Migration status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| schema version | `sessionStorageService.js` `__version` (client) + `SmokeCraftJourneyContext.stateVersion` (client) — two independent client-side version counters | Server schema versioned via migration numbering (`server/db/migrations/`); client versions remain local-cache versions | New: `smokecraft_player_state.schema_version` | part of player-state payload | both `novee_guest_session` and `sc_journey_v1` | on load | Medium | Low | Low | Low (two client counters, but they don't govern server truth) | Migrated (server side added; client counters left as-is, low risk) |
| last synchronized time | not modeled today | New: `smokecraft_player_state.last_synced_at` | New this pass | part of player-state payload | none previously | on every server write | Medium | High | Low | Low | Migrated this pass |
| device/session metadata | `services/shared/deviceIdService.js` (`getDeviceId`), used only by `syncQueueService.js` | Reused as-is for the new award mutations' audit trail | n/a (client-generated, stored in audit payload) | included in mutation payloads | localStorage device-id key | on install | Low | Medium | Medium | Low | Reused, not redesigned |
| audit trail | `smokecraft_progression_events`/`smokecraft_reward_audit` (mixed: one real+used, one real+unused) | New: `smokecraft_award_audit` (this pass), reusing the same idempotency-key pattern already proven in `smokecraft_progression_events` | New this pass | included via award mutation responses | n/a | every award mutation | High | High | **This IS the audit layer** | n/a | **Migrated this pass** |
| conflict status | not modeled anywhere | Deferred — no multi-writer conflict scenario exists yet for the newly-migrated fields (single-writer: the owning guest via one idempotent mutation) | none | none | none | — | — | — | — | — | **Not built this pass — see Known Gaps** |
| deletion/retention state | not modeled | Deferred | none | none | none | — | — | — | — | — | Not built this pass |

## Known gaps (explicitly not closed this pass)

- **Guest-to-account conversion**: no account/auth system exists anywhere
  in this codebase for SmokeCraft guests to convert into (confirmed via
  source search — no SmokeCraft-guest-facing login/registration flow).
  The mandate's "safe guest-to-account transfer" requirement cannot be
  implemented against a target that does not exist; this is a hard
  blocker, not a scoping choice.
- **True cross-device resume** requires the guest's *cookie-issued*
  identity (`ensureSmokeCraftGuestIdentity`, already real and working for
  the Management Sync feature) to also govern the new award mutations —
  implemented this pass — but there is still no mechanism for a guest to
  deliberately re-associate that identity on a second physical device
  (e.g. a QR/code handoff); only the same-browser, same-cookie case is
  provably testable.
- **Two-tab / stale-client conflict policy**: the new award mutations are
  idempotent (safe against duplicate awards from any number of tabs/
  devices/retries), but no separate "last-write-wins vs. reject-stale"
  policy was built for the *non-award* per-session decision fields
  (tasting notes, selections) — those remain client-cache-only this
  pass, so no conflict can occur server-side (there is nothing server-
  side to conflict with yet).
- **Most `SmokeCraftJourneyContext` fields remain client-cache-only.**
  This is a deliberate, disclosed scope decision, not an oversight: the
  mandate's core risk ("duplicate progress, scores, XP, badges, Passport
  stamps, completions, and submissions") is specifically about *awards
  and completions*, which this pass migrates. Migrating all ~30 pure
  content-selection fields (mentor pick, tasting notes, quiz answers)
  to server authority as well was not achievable in this pass and is
  handed off explicitly (see the final report's Holistic Fix 5 handoff).

## Holistic Fix 4B update — account identity, guest conversion, journey-content migration

**Identity layer closed the real blocker from Holistic Fix 4**: reused
the existing, proven `passport_member` role / `system_users` +
`auth_credentials` + `passport_member_profiles` + `auth_sessions`
infrastructure (bcrypt PIN hashing, JWT, revocable sessions — the same
system already used for staff/founder/passport_member auth). Added the
one thing genuinely missing: a real login endpoint for an existing
member (`POST /api/smokecraft/account/login`) — before this pass, an
account (via `promoteGuestToMember`) could only ever be created once,
with no way to sign back in on a second device anywhere in the
codebase.

**Guest ID / Account ID / Authenticated session** are now real,
distinct, and connected: `guest_reference` (raw cookie-issued guest
UUID) → `smokecraft_guest_conversions` (one-time, idempotent) →
`user:<userId>` (the account's `guest_reference` going forward). Both
identities can coexist on one browser (guest cookie + account cookie,
independently verified) — this is exactly how the conversion endpoint
proves the caller controls both without trusting a client-submitted
guest reference.

**Journey content fields — migrated this pass** (previously listed as
"Not migrated" in the Holistic Fix 4 table above): identity, selected
venue/mentor, meetYourCigar, mentorCommentary, format, seedSoil,
terroir, knowledgeDrop, pairing, selectedCigar, requestPurchase,
cutToastLight, firstThird/secondThird/flavorMemory/finalThird,
scorecard, aiSummary, pairingRecommendations, rewards/achievements
view-state, welcomeExperience fields, finalReview, connections,
resumeRoute/resumeScreenId. All of these now round-trip through
`smokecraft_player_state.journey_snapshot` (migration 094), synced via
the shared client `stateAdapter.js`, with real optimistic-concurrency
version protection (`journey_version`). **Authoritative owner is now
the server** for the whole snapshot as a unit; **DB storage**: yes
(JSONB). **API endpoint**: `GET`/`PUT /api/smokecraft/player-state/journey-snapshot`.
**Client cache**: `sc_journey_v1` (unchanged key, now a cache/offline-
queue/pre-login-recovery store per the mandate, not the sole authority).
**Cross-device requirement**: met (verified live — Device Y, a real
second login, sees Device X2's written content). **Duplicate-risk**:
low (single JSONB blob per identity, guarded by version, not
per-sub-mutation — see Known Gaps below for the coarseness trade-off).

**Still NOT migrated / remaining client-only**: none of the journey
fields — all are now covered by the snapshot mechanism. What remains
genuinely out of scope: per-field granular conflict resolution (the
snapshot is whole-blob versioned, not per-field — see
`SMOKECRAFT_GUEST_ACCOUNT_MERGE_POLICY.md`'s disclosed trade-off);
Golden Box Packaging Studio's own separate, pre-existing, already-
server-authoritative state (untouched, out of scope); the narrower
mini-features (Skill Tree, Collections, Blend Fault, Challenge Hub) that
already had their own real persistence before this operation began.

## Holistic Fix 5A update — mentor dual-ownership defect CLOSED

`SmokeCraftJourneyContext.mentor` (already server-synced via the
Holistic Fix 4B `journey_snapshot` mechanism) is now the sole write
target for a mentor selection. `GuestSessionContext.selectedMentor`/
`selectedMentorCountry` remain as fields (real, active cross-module
consumers outside the `/smokecraft` route tree — NCIE, POS3, staff
handoff, EAT analytics, leaderboard service — read them and are not
wrapped by `SmokeCraftJourneyProvider`, so they cannot be removed or
made to read `journey.mentor` directly), but they are no longer
independently settable by user action: `src/pages/smokecraft/Mentor.jsx`
now derives them reactively FROM `journey.mentor` in a dedicated
`useEffect`, so the two values can never diverge — one write path
(`setMentor`), one derived mirror (`setSelectedMentor`), not two
independent owners. **Duplicate-risk downgraded from High to Low.**
**Migration status: Closed** (structural fix — derivation guarantees
consistency; server authority already existed via the journey snapshot).

## Holistic Fix 5A-2 update — addXP()/addBadge() authority closed

`GuestSessionContext.addXP(amount, namedSource)` and `addBadge(badge)`
now both mirror to server-authoritative, idempotent endpoints (same
local-optimistic-UI + fire-and-forget-authoritative-server pattern
already used by `awardSessionRewards`/`awardStamp` since Holistic Fix
4). Knowledge Check and Leaf Challenge no longer call `addXP()` at all —
they submit raw evidence via new `submitKnowledgeCheck`/
`submitLeafChallenge` context methods, and the server is the sole author
of the resulting score/XP/badge/stamp. See
`SMOKECRAFT_GAMEPLAY_ENGINE_MAP.md`'s Holistic Fix 5A-2 section for the
full list of closed call sites and the still-disclosed remaining gaps.

## Holistic Fix 5A-3D update — tasting draft ownership

`MiniTasting.jsx`'s `selectedCigarId`/`compareIds` are no longer owned
by local `GuestSessionContext` state — they are now server-authoritative
(`smokecraft_tasting_drafts`, migration 097), loaded on mount and saved
via a debounced, optimistic-concurrency PUT (same "server value wins on
conflict" rule as the journey-snapshot sync). Completion validity, score,
and XP are exclusively server-decided (`submitTastingCompletion`) — the
client only ever submits the raw selection as evidence.

## Holistic Fix 5A-3E update — cultivator evidence ownership

`Cultivation.jsx`'s `viewedStages` (which of the 7 stage cards were
genuinely opened) is real, real-time UI state; the server never trusts
it directly — it is only ever submitted as one-shot evidence to
`submitCultivatorEvidence`, which independently verifies completeness
before deciding XP/Passport-stamp eligibility. The client has zero
authority over the reward decision itself.

## Holistic Fix 5A-3F update — Collections ownership

`smokecraft_collection_ownership` is, and was already, fully server-
owned — never client-writable. This pass fixed the *identity key* used
to write/read it: an authenticated account's guest_reference is now
`user:${id}` (was previously unprefixed, inconsistent with every other
player-state table), and guest-to-account conversion
(`convertGuestToAccount`) now transfers Collections ownership rows,
which it previously never did at all.

## Holistic Fix 5A-3G update (Skill Tree ledger integration)

`smokecraft_skill_tree_learner_state` (migration 086) remains the sole
owner of cached node state, always re-derived from 6 real evidence
tables (`smokecraft_seed_soil_progress`,
`smokecraft_filler_arrangement_completion`, `smokecraft_rolling_progress`,
`smokecraft_flavor_stage_observations`, `smokecraft_pairing_drafts`,
`golden_box_entries`) plus `smokecraft_progression_events` breadth for
the final node. This pass fixed `convertGuestToAccount`
(`playerStateService.js`) to transfer all 6 evidence tables (previously
transferred none — SC-D037), and added a read-time-only `'corrected'`
overlay sourced from `smokecraft_reward_corrections` (never persisted to
the `state` column's CHECK-constrained enum, never a second competing
source of truth).

## Holistic Fix 5A-3H update (Leaderboard ledger integration and integrity closure)

`smokecraft_leaderboard_eligibility` (migration 095) remains the sole
owner of a guest's leaderboard preference (opt-out, display name, venue
scope). This pass fixed `convertGuestToAccount`
(`playerStateService.js`) to transfer this row on conversion (previously
transferred none — SC-D042), and fixed `setLeaderboardPreference` to
actually persist the pre-existing `venue_id` column (previously
SC-D041, a dead write path). The Leaderboard screen's own displayed
"current player" data now sources from the real
`smokecraft_player_state` table via `fetchPlayerState()` rather than the
local `GuestSessionContext` mirror (SC-D043) — the mirror remains the
fast offline-safe UI cache elsewhere in the app but is no longer the
value actually rendered on this screen once real data is available.

## Holistic Fix 5B-1 update (server-authoritative pairing engine)

New: `smokecraft_pairing_saves` (migration 098) is the sole owner of a
saved pairing (guest_reference, full input, every scoring output,
rule_set_version, learner_rating/notes, save_version). New:
`smokecraft_pairing_save_revisions` is the append-only history of every
edit. `convertGuestToAccount` transfers both tables on conversion
(`transferSavedPairings`, wired from day one). Ledger events
(`pairing_requested`/`pairing_recommended`/`pairing_saved`/
`pairing_rated`) reuse the existing `smokecraft_progression_events`
table — no new competing event log.

## Holistic Fix 5B-2B-1 update (ElevenLabs voice foundation and secure preview)

New: `smokecraft_voice_preferences` (migration 099) is the sole owner
of a learner's voice preferences (voice enabled/disabled, preferred
playback speed, captions enabled, last-previewed mentor), keyed by
`guest_reference` — same identity model as every other SmokeCraft
state table, server-authoritative, survives refresh and a second
device under the same identity. New: `smokecraft_voice_preview_cache`
holds only already-synthesized preview audio (never private learner
data — preview text is always server-owned, identical for every
learner who previews a given mentor at a given speed), bounded to a
30-minute lifetime, existing purely to avoid duplicate ElevenLabs
provider calls. `server/services/smokecraft/mentorVoiceService.js` is
the one place the ElevenLabs API key is read; it never appears in any
response payload or client bundle.

## Holistic Fix 5C-1A update (Challenge Hub scoring authority)

New: `smokecraft_challenge_rewards` (migration 101) is the sole owner
of a Challenge Hub XP reward grant, one row per (guest_reference,
challenge_instance_key), database-UNIQUE-enforced. `smokecraft_challenge_learner_state`
(migration 088) remains the sole owner of a learner's participation
state per challenge instance; unchanged this pass except that its
completion transition now happens inside a row-locked transaction
(`FOR UPDATE`) rather than a plain read-then-update, closing a real
two-tab race. `convertGuestToAccount()` now also transfers Challenge
Hub learner state, Challenge Hub reward grants, and Blend Fault
attempts/answers — previously none of these were transferred at all
(the same recurring "never transferred" defect class as SC-D037/
SC-D042), silently losing a guest's challenge/assessment progress on
every conversion to an account.

## Holistic Fix 5C-1B update (Golden Box scoring and persistence audit)

`golden_box_entries.current_version` is the sole optimistic-
concurrency token for a Golden Box draft — `saveDraft()` now rejects a
write whose `expectedVersion` doesn't match it (real conflict, never
silent overwrite), enforced under a row lock (`FOR UPDATE`) so two
concurrent saves genuinely serialize rather than racing. Migration 102
adds `idempotency_key` (UNIQUE) to `golden_box_entry_versions` and
`golden_box_submissions` — the same database-enforced-idempotency
pattern used everywhere else in this operation. `convertGuestToAccount()`
was found to be transferring `golden_box_entries` INCORRECTLY (not
just missing) — the generic set-union copy let `entry_id`
auto-generate a new UUID, silently orphaning every real FK-referencing
`golden_box_entry_versions`/`golden_box_blend_components`/
`golden_box_submissions` row. Fixed with a bespoke transfer that
preserves the parent/child relationship (same technique as the Blend
Fault attempt transfer in 5C-1A).

## Holistic Fix 5C-2A update (Golden Box judge assignment and scorecard authority)

`golden_box_scorecards.draft_version` is the optimistic-concurrency
token for a scorecard draft (mirrors `current_version` on
`golden_box_entries`) — `saveScorecardDraft()` rejects a write whose
`expectedVersion` doesn't match, enforced under a row lock (`FOR
UPDATE`). `golden_box_scorecards.weighted_total` and `rule_version`
are exclusively server-owned: computed and stamped only inside
`submitScorecard()`'s transaction, never accepted from the client.
`golden_box_scorecards.status` (`draft` → `submitted` → `locked`, or
`amended`/`voided`) is the sole ownership boundary for editability —
once `status !== 'draft'`, `saveScorecardDraft()` unconditionally
rejects further writes; a locked scorecard's real edits must go
through `amendScorecard()`, which creates a new row rather than
mutating the original. Migration 103 adds `idempotency_key` (UNIQUE)
to `golden_box_scorecards` for final-submission dedupe, and a partial
unique index (`idx_gbsc_one_original_per_judge_entry ... WHERE
amended_from IS NULL`) that is the REAL ownership boundary for "one
original scorecard per judge+entry" — the table's pre-existing
`UNIQUE(entry_id, judge_id, amended_from)` never actually enforced
this (SC-D060).

## Holistic Fix 5C-2B-1 update (Golden Box results aggregation and final ranking)

`golden_box_result_finalizations`' `UNIQUE(competition_id,
result_version)` is the real ownership boundary for "at most one
finalization per competition per result version" — a repeated
finalize call detects this row and returns the original finalized
result rather than recomputing. `golden_box_results.finalized_at`
(set only inside `finalizeResults()`'s transaction) is the sole marker
of immutability: `handleGetCompetitionResults()` treats a finalized
row's existence as authoritative for every caller (admin included),
never recomputing a live view once one exists. Live (unfinalized)
computation in `computeCompetitionResults()` never persists anything —
it is a pure read, so it can never drift from or corrupt a real
finalized record.

## Holistic Fix 5C-2B-2 update (Golden Box award and reward issuance)

`golden_box_award_issuances`' `UNIQUE(competition_id, result_version)`
is the real ownership boundary for "at most one award issuance per
finalized result version" — mirrors `golden_box_result_finalizations`
exactly. `golden_box_awards`' `UNIQUE(competition_id, entry_id,
result_version)` is the ownership boundary for "at most one award
record per entry per result version." Each reward-type status column
(`xp_status`/`badge_status`/`passport_stamp_status`) is independently
owned: `awardsService.issueAwards()` is the only writer, and each only
ever transitions from its `'unavailable'` default to `'issued'` inside
the same call that performs the real grant through the canonical
xpService/rewardsIntegrationService/passport360 services — never
flipped speculatively.

## Stage 5 Closure Gate update

`goldenBoxController.js`'s `identityFrom()` is the single ownership-
resolution point for every `requireAuth`-only Golden Box route
(results/award visibility) — it must produce the exact same `user:`-
prefixed `guestReference` that `convertGuestToAccount()` writes and
that `bridgeIdentity` already produces for guest-bridged routes
(SC-D063, closed this pass). There are now exactly two identity-
bridging code paths in Golden Box (`bridgeIdentity` for guest-bridged
routes, `identityFrom()` for `requireAuth`-only routes) and both are
verified to produce the same `user:${id}` prefix for an authenticated
non-guest identity — no third, competing identity resolution exists.

## Venue Humidor 1A update

`venue_cigar_products.physical_quantity` is the sole authoritative
stock value — mutated ONLY inside `inventoryService.applyInventoryEvent()`
under a row lock, never directly by `orderService.js` or any route
handler. `venue_cigar_inventory_events` is the append-only ledger that
explains every change to it — the same "one column, one writer,
one append-only explanation ledger" pattern already established by
`xp_accounts.balance`/`xp_transactions` and
`golden_box_scorecards.weighted_total`/its computing transaction.
Available quantity (`physical_quantity - unavailable_quantity -
active holds - active reservations`) is never itself stored — always
computed live on read, the same "never duplicate/cache an aggregate
that could drift" principle `golden_box_results` follows relative to
individual judge scores. `venue_memberships` (reused, not duplicated)
remains the sole ownership record for "who may act as staff for which
venue" — Venue Humidor invented no parallel staff-role table.

## Venue Humidor 1B-1 update

`venue_cigar_favorites`' `UNIQUE(guest_reference, product_id)` is the
real ownership boundary for "at most one favorite per guest per
product." Favorite state is never cached client-side as the source of
truth — `VenueHumidorCigarDetail.jsx` re-fetches the real persisted
favorite list on every mount via `listFavorites()`, so a page reload
or second device always reflects the server's real record, never a
stale local toggle. `is_archived`/`is_customer_visible` on
`venue_cigar_products` are staff-owned columns (set via 1A's staff
routes, unchanged this pass) that the customer catalog reads but never
writes.

## Venue Humidor 1B-2A update

`venue_cigar_orders.status`/`payment_status` are owned exclusively by
`checkoutService.js` — `createOrderFromHold()` is the only writer of
`status = 'pending_payment'`, and `completeOrder()`/`cancelOrder()`
are the only writers of `'completed'`/`'cancelled'`/`'refunded'`. A
hold's `status` transition to `'converted'` is owned by
`createOrderFromHold()` alone (under a row lock); its transition to
`'released'` is owned by `releaseHold()` alone. Physical inventory
(`venue_cigar_products.physical_quantity`) remains mutated only inside
`inventoryService.applyInventoryEvent()` (unchanged ownership from
1A) — `checkoutService.js` calls that same function rather than
writing the column itself, so there is still exactly one writer.
Available quantity's held-holds computation now correctly counts
`status IN ('active', 'converted')` (SC-D065) — a converted hold still
represents un-invoiced, un-cancelled commitment against real stock
until the order completes or is cancelled. Idempotency for order
creation and completion is enforced by the real `idempotency_key`
unique constraint on `venue_cigar_orders`, checked in-lock as the
authoritative source of truth (never a pre-lock-only check, per
SC-D066).

## Venue Humidor 1B-2B-1 update

`productService.js` remains the sole owner of every
`venue_cigar_products` create/update write — `updateProductClassification()`
is now the single writer of `is_archived`/`status`/`is_customer_visible`/
`is_featured`/`is_staff_pick`/`is_limited_release`/`is_venue_exclusive`,
the exact same columns 1B-1's customer catalog service already reads,
so staff changes and customer visibility can never drift onto two
separate representations. `sealed_box_count`/`opened_box_count`
(migration 109) are administrative display counters, updated only
alongside — never instead of — the authoritative `physical_quantity`
mutation inside the same admin request; they are not a second source
of truth for stick count. RBAC ownership: `venue_memberships.membership_type`
(unchanged, migration 010) remains the sole role record — 1B-2B-1
introduces no parallel role/permission table, only a route-level
tier mapping (`requireVenueRole()` in `venueHumidorRoutes.js`) that
reads that same column.
