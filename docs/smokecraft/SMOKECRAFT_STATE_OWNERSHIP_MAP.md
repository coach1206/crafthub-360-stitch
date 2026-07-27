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
