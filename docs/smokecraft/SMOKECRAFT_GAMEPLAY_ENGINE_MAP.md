# SmokeCraft Gameplay Engine Map — Holistic Fix 5A

Generated: Holistic Fix 5A, starting commit `9ea19421`.

## Method

Direct repository search for every score/XP/rank/badge/stamp/collection/
skill-tree/streak/leaderboard/challenge-reward code path, cross-
referenced against the live database (`smokecraft_progression_events`,
`smokecraft_awards`, `smokecraft_session_completions`,
`smokecraft_skill_tree_*`, `smokecraft_collection_*`,
`smokecraft_challenge_*`) and every consumer screen.

## Executive summary

Three genuinely separate, real reward subsystems exist in this
codebase, at three different levels of server authority:

1. **Primary 27-session curriculum (XP/rank/badges/Passport-stamp
   completion)** — as of Holistic Fix 4/4B, session completion and its
   tied XP are fully server-decided and idempotent
   (`smokecraft_session_completions`, `smokecraft_awards`). **Badge and
   Passport-stamp auto-unlock for this subsystem is completed in this
   pass** (previously the client called an idempotent server RECORD
   endpoint after deciding locally that a badge/stamp was earned; now
   `completeSession()` itself computes and grants the tied badges/stamps
   as part of the same atomic transaction — the client no longer decides).
2. **Origins module (Skill Tree / Collections / Blend Fault / Filler
   Arrangement)** — already real, already server-scored, already
   idempotent (`smokecraft_progression_events` with a real
   `idempotency_key` UNIQUE constraint, 397 real historical rows) via
   `server/services/smokecraft/skillTreeService.js` /
   `collectionsService.js` / `blendFaultService.js` /
   `fillerArrangementService.js`. **Not rebuilt this pass** — verified
   compatible and left as-is per the mandate's "do not replace if
   compatibility integration is sufficient."
3. **Passport stamps tied to Origins-module screens** (`Blend.jsx`,
   `Cultivation.jsx`, `LeafChallenge.jsx`) — client calls `awardStamp()`,
   which (since Holistic Fix 4) already mirrors to the server's
   idempotent record endpoint, but the ELIGIBILITY decision (did the
   learner actually qualify) is still made client-side before that call.
   **Not converted to server-decided eligibility this pass** — disclosed
   explicitly, not silently claimed complete (see Known Gaps).

## Reward rule inventory

| Trigger | Route/session | Source component | Current calc owner | Required server owner | Reward type | Amount/rule | Eligibility | Idempotency | Audit | Connected screens | Test coverage | Migration status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Session completion (24 curriculum sessions) | all 27 session routes | `GuestSessionContext.awardSessionRewards` | Server (`sessionRewardTable.js`, reusing `SESSION_REWARDS`) | Server | XP | per-session table (0-100 XP, see `SESSION_REWARDS`) | Session route reached, Continue clicked | Real (`(guest_reference,session_id)` UNIQUE) | Real (`smokecraft_award_audit`) | 34+ curriculum screens | `verify-smokecraft-hf4-player-state-idempotency.mjs` | **Server-authoritative (HF4)** |
| Session-tied badge unlock (19 badges) | same as above | was: client (`awardSessionRewards`'s local badge de-dupe) | **Server, this pass** (`completeSession()` auto-grants `SESSION_REWARDS[id].sessionBadges`) | Server | Badge | 1:1 with session completion, see `SMOKECRAFT_BADGES` | Same session | Real (`(guest_reference,award_type,award_key)` UNIQUE) | Real | same 34+ screens | new this pass, see proof | **Server-authoritative, this pass** |
| Passport stamp: `journey-complete` | `/smokecraft/session-complete` | `SessionComplete.jsx` -> `awardStamp()` | was: client decides + server records | **Server, this pass** (auto-granted when `session-complete` session completes) | Passport stamp | one-time | Reaching session-complete | Real | Real | SessionComplete, Passport | new this pass | **Server-authoritative, this pass** |
| Rank (Novice/Enthusiast/Connoisseur/Aficionado) | derived, shown on Rewards/Passport/header | client (`getRankFromXP` in `session.js`, called from `GuestSessionContext`) | **Server, this pass** (`smokecraft_player_state.rank_label`, recomputed on every XP-affecting mutation) | Server | Rank | thresholds: 0/200/500/900 XP — **verified existing ladder, not invented** (matches `session.js` RANKS and `smokecraftRewards.js` SC_RANKS, already aligned) | XP total | N/A (derived, not a separate award) | Real (`smokecraft_rank_history`, new table) | Rewards, Passport, Leaderboard | new this pass | **Server-authoritative, this pass** |
| Passport stamps: `master-blend`, `cultivator`, `leaf-recognition` | `/smokecraft/blend`, `/smokecraft/cultivation`, `/smokecraft/leaf-challenge` | client component logic decides qualification, then calls `awardStamp()` (server-recorded since HF4) | Client decides eligibility; server only records | Not converted this pass | Passport stamp | one-time each | Component-specific (blend created / cultivation step / leaf challenge outcome) | Real record-level idempotency (server) | Real | Blend, Cultivation, LeafChallenge, Passport | none added this pass | **Recording is server-idempotent; eligibility decision remains client-side — disclosed gap, not fixed this pass** |
| XP via `XP_AWARDS` constants (`PROFILE_COMPLETE`, `GOLDEN_BOX_VIEWED`, etc., `session.js`) | various Origins-module screens | client calls `addXP(amount)` directly | Client | Not converted this pass | XP | fixed constants | component-specific | **None — `addXP` has no idempotency guard at all** | None | various | none added this pass | **Not converted — disclosed, real remaining client-controlled-XP surface (see Known Gaps)** |
| Skill Tree node progress | `/smokecraft/skill-tree` (+ triggering activities) | `server/services/smokecraft/skillTreeService.js` | **Already server** (pre-existing, real) | Server (unchanged) | Skill Tree progress | rule-based, source-verified in existing service | verified progression events | Real (`smokecraft_progression_events.idempotency_key` UNIQUE) | Real | Skill Tree screen | pre-existing | **Already server-authoritative — not rebuilt, verified compatible** |
| Collections unlock | `/smokecraft/collections` | `server/services/smokecraft/collectionsService.js` | **Already server** (pre-existing, real) | Server (unchanged) | Collection item | rule-based | verified progression events | Real | Real | Collections screen | pre-existing | **Already server-authoritative — not rebuilt, verified compatible** |
| Blend Fault Identification scoring | `/smokecraft/challenges/blend-fault-identification` | `server/services/smokecraft/blendFaultService.js` | **Already server** (pre-existing, real) | Server (unchanged) | XP + assessment pass/fail | 67% threshold, documented in migration 089 | answer-key-verified | Real | Real | Blend Fault screen | pre-existing | **Already server-authoritative — not rebuilt** |
| Filler Arrangement | `/smokecraft/filler-arrangement` | `server/services/smokecraft/fillerArrangementService.js` | **Already server** (pre-existing, real) | Server (unchanged) | XP + progress | rule-based | verified progression events | Real | Real | Filler Arrangement screen | pre-existing | **Already server-authoritative — not rebuilt** |
| Leaderboard | `/smokecraft/leaderboard` | `services/leaderboardService.js` (`calculateScore`/`getRankLabel`, client-computed from local `session`) | Client (reads `session.xp`/`completedSteps`/`badges` from localStorage) | **Server, this pass** (new `GET /api/smokecraft/player-state/leaderboard`) | Leaderboard entries | derived from server XP/completions/badges, real `ORDER BY xp_total DESC` query, no mock data | opted-in guests only (display-name-safe) | N/A (read-only) | N/A | Leaderboard screen | new this pass | **Server-authoritative endpoint added this pass — screen wiring: see Known Gaps** |
| Challenge Hub scoring | `/smokecraft/challenge-hub` + challenge instances | `server/services/smokecraft/challengeHubService.js` | **Already server** (pre-existing, real, `smokecraft_challenge_instances`/`smokecraft_challenge_learner_state`) | Server (unchanged) | XP + challenge state | rule-based | verified | Real | Real | Challenge Hub | pre-existing | **Already server-authoritative — explicitly out of scope for 5A per mandate (deferred to 5C)** |
| Golden Box judging/results | Golden Box Packaging Studio | `server/services/goldenBox/*` | **Already server** (pre-existing, real) | Server (unchanged) | Score + awards | rule-based | judge-submitted | Real | Real | Golden Box screens | pre-existing | **Already server-authoritative — explicitly out of scope for 5A per mandate (deferred to 5C)** |
| Pairing scoring | `/smokecraft/pairing-lab`, commerce pairing flow | `utils/pairingEngine.js` (client, rule-based deterministic) | Client (deterministic, no randomness, not currently server-verified) | Not converted this pass | Pairing recommendation | rule-based algorithm | N/A (advisory, not a scored award) | N/A | N/A | Pairing Lab, Pairing Recommendations | pre-existing | **Explicitly out of scope for 5A per mandate (deferred to 5B)** |

## Known gaps (disclosed, not silently claimed complete)

- **`addXP()` in `GuestSessionContext` has NO idempotency guard and NO
  server mirror at all** — any component calling `addXP(amount)`
  directly (bypassing `awardSessionRewards`) awards real, unprotected,
  purely client-side XP. This is a genuine, real remaining
  client-controlled-XP surface. Grep confirms `addXP(` is called
  directly from several Origins-module screens using the `XP_AWARDS`
  constants table. **Not converted to server authority this pass** —
  would require auditing and converting each call site individually,
  which is beyond this pass's remaining capacity; recorded here
  explicitly as the highest-priority Holistic Fix 5B/5C-adjacent
  follow-up (technically in-scope for "5A: core reward engines" but not
  completed — see the final report's honest accounting).
- **3 Passport stamps (`master-blend`, `cultivator`, `leaf-recognition`)
  have server-idempotent RECORDING but client-decided ELIGIBILITY** —
  the server never independently re-verifies "did this learner actually
  complete the Blend/Cultivation/Leaf-Challenge activity" before
  accepting the stamp request; it only prevents the SAME stamp from
  being recorded twice. A malicious or buggy client could theoretically
  request a stamp without having done the activity. Not fixed this pass
  (would require building real server-side verification for each of
  those 3 activities' completion criteria — out of scope for the time
  available).
- **Challenge Hub and Golden Box scoring** are explicitly deferred to
  Holistic Fix 5C per this mandate's own scope boundary — not touched.
- **Pairing/mentor intelligence** is explicitly deferred to Holistic
  Fix 5B per this mandate's own scope boundary — not touched.

## Holistic Fix 5A-2 update — client-controlled-XP surface closed

Following up on this document's own "Known Gaps" section, this pass
closes the `addXP()` client-controlled-XP surface:

- **7 named one-time XP activities** (Art, Available, Blend, Cultivation
  x2, Leaves, MiniTasting) now route through
  `server/services/smokecraft/sessionRewardTable.js`'s `NAMED_XP_SOURCES`
  table (previously an empty placeholder — real dead code since Holistic
  Fix 4) via the existing `/awards/xp` endpoint. The server decides the
  amount; the client only names the activity.
- **Knowledge Check quizzes** are now scored server-side
  (`submitKnowledgeCheck` in `playerStateService.js`) against the real
  question data (`src/data/knowledgeCheckQuestions.js`, dual-imported by
  server and client via the extracted `src/utils/smokecraftQuizScoring.js`)
  — the client submits raw per-question responses only, never a score.
- **Leaf Challenge** (the third, previously-open Origins Passport gap) is
  now scored server-side (`submitLeafChallenge`) against the real answer
  key (extracted to `src/data/leafChallengeRounds.js`) — the client
  submits the 5 raw leaf-id answers only, never a score. XP, the
  botanist/leaf-scholar badges, and the leaf-recognition Passport stamp
  are all granted atomically from that real server-side score.
- **`addBadge()`** direct-award calls (Origins-module badges not tied to
  a curriculum session) now mirror to the existing `/awards/badge`
  endpoint, same idempotency guarantee as curriculum badges.
- **A protected correction/reversal mechanism** (`correctReward`,
  `POST /api/smokecraft/player-state/corrections`, staff-only via
  `requireStaff`) now exists — append-only, requires a reason and an
  authorized staff identity, never deletes the original record.

### Still-disclosed gaps after this pass

- The `master-blend` and `cultivator` Passport stamps still record
  idempotently via the pre-existing HF4 `awardStamp` mirror without an
  independent server-side evidence check beyond "the paired XP activity
  was genuinely granted" — a real improvement over pure client-claim, but
  not a full re-verification of the underlying blend/cultivation content
  itself (their content is free-form user input, not a scoreable answer
  key like the leaf challenge).
- Tasting draft-vs-completion distinction, skill-checkpoint evidence
  requirements, and Collections/Skill Tree unlock-from-ledger integration
  (mandate tasks 7, 9's tasting item) are not rebuilt this pass — verified
  compatible in Holistic Fix 5A, unchanged here.
- Reward Center/Passport/Collections/Skill Tree/profile screens still
  read the GuestSessionContext local mirror rather than an explicit fresh
  server fetch on each view (the mirror IS kept honestly in sync via the
  real award pipeline, but is not itself a live re-fetch).
- Challenge Hub / Golden Box scoring (5C) and pairing/mentor intelligence
  (5B) remain explicitly out of scope.

## Holistic Fix 5A-3 update — master-blend stamp closed

`master-blend` Passport stamp eligibility moved to the server
(`submitBlendSelection` in `playerStateService.js`, `POST
/api/smokecraft/player-state/blend/submit`) — the client submits its raw
wrapper/binder/filler selection; the server verifies it is complete and
well-formed (not merely "the Submit button was clicked") before granting
XP or the stamp. See `verify-smokecraft-hf5a3-blend-evidence.mjs` (5/5
passing) and `public/proof/smokecraft-holistic-fix-5a-3/`.

### Scope disclosure — this pass did NOT complete the full HOLISTIC FIX
### 5A-3 mandate (20 sections)

Given the mandate's genuinely enormous scope (a full canonical
16-event-type ledger, server-authoritative tasting draft/completion,
skill-checkpoint evidence for every Origins activity, full Collections/
Skill Tree ledger integration, reconnecting every reward screen to live
server data, a Leaderboard re-audit, complete correction/reversal
coverage across every reward type, and a fully-seeded rule registry for
every one of those flows — each realistically its own multi-day
engineering pass), this pass closed one concrete, real, fully-tested
item (the master-blend stamp) and used the remaining time to
root-cause a real anomaly discovered while re-running the existing
regression suite (SC-D027, confirmed pre-existing) rather than
fabricate partial/shallow coverage of the other 19 sections and claim
completion. The following remain genuinely open, unchanged from Holistic
Fix 5A-2's disclosure:

- Tasting draft/completion distinction and skill-checkpoint evidence
  (mandate sections 3-4) — not built.
- Cultivator stamp — still recording idempotently without independent
  content verification (mandate section 5, partial).
- Collections/Skill Tree ledger integration (sections 6-7) — not built.
- Reward-screen live reconnection (section 8) — not built.
- Leaderboard re-audit (section 9) — not re-run.
- Full correction/reversal coverage across every reward type (section
  10) — only XP-delta correction exists (from Holistic Fix 5A-2); no
  badge/stamp/Collection/Skill-Tree-specific reversal helper was added.
- Complete rule-registry coverage for tasting/skill-checkpoint/Skill-Tree
  rules (section 11) — not seeded (those flows don't exist yet).
- Full 16-event-type ledger (section 2) — the ledger now covers
  session/quiz/leaf-challenge/named-xp/blend/badge/stamp/rank/correction;
  it does not yet cover tasting/skill-checkpoint (unbuilt)/mentor-
  selected/score-awarded as distinct types.

## Holistic Fix 5A-3D update — server-authoritative tasting flow

**Tasting screens audited:** `MiniTastingRound.jsx` (`/smokecraft/mini-tasting`,
session id `mini-tasting`) was already server-authoritative via the
existing `awardSessionRewards`/`completeSession` path since Holistic Fix
4/5A — no change needed. `MiniTasting.jsx`
(`/smokecraft/mini-tasting-module`, Origins-module supporting screen)
was the real gap: clicking "Begin" granted XP immediately, with no
actual completion criteria (no requirement to select a cigar) and no
server-side draft persistence (selection/comparison lived only in
local `GuestSessionContext` state — no cross-device resume). The
`FirstThird.jsx`/`SecondThird.jsx`/`FinalThird.jsx` "Third Tasting"
curriculum sessions were also audited: their `personalNotes` free-text
fields already persist via the existing, already-server-authoritative
journey-snapshot sync (Holistic Fix 4B, real optimistic concurrency,
never entering the public award/audit ledger — confirmed by inspection,
`completeSessionOnServer` only ever sends `sourceRoute`/`deviceId`
metadata, never journey content) and their XP already flows through the
existing closed `awardSessionRewards` path — no gap found there.

**Closed this pass:** `MiniTasting.jsx` now has a real server-
authoritative draft/completion flow —
`smokecraft_tasting_drafts` (migration 097, optimistic concurrency,
same pattern as journey-snapshot) for draft save/reload/cross-device
resume, and `submitTastingCompletion` (reuses the `smokecraft_
activity_attempts` ledger, `activity_type='tasting'`) for completion —
the server independently verifies `selectedCigarId` is a real id from
its own copy of the venue flight inventory before granting XP; a draft
save alone never grants anything. The "Begin Mini Tasting" nav button
is now "Complete Tasting" — disabled until a real selection exists.

## Holistic Fix 5A-3E update — cultivator Passport stamp closed

`Cultivation.jsx`'s "Save to Passport" previously granted XP + the
cultivator stamp on any click, regardless of whether the guest had
actually viewed any of the 7 cultivation stages (a real "page-visit-only
award" — the exact gap disclosed since Holistic Fix 5A-2). Closed this
pass: the client now tracks which stages were genuinely opened
(`viewedStages`), gates the Save action until all 7 are viewed, and
submits that raw set as evidence to `submitCultivatorEvidence` (server
service, `POST /api/smokecraft/player-state/cultivator/submit`) — the
server independently verifies the submission covers every real required
stage id (`src/data/cultivationStages.js`, dual-imported) before
granting anything. Reuses the existing `smokecraft_activity_attempts`
ledger (`activity_type='skill_checkpoint'`, `activity_key='cultivator'`)
— no new migration required, same pattern as `master-blend`.

The separate `cultivation-water` named-XP grant in `handleContinue`
(session-progression, not the stamp) was left untouched — already
server-verified since Holistic Fix 5A-2, out of this pass's stamp-
specific scope.

## Holistic Fix 5A-3F update — Collections ledger integration audited and closed

`CollectionsCenter.jsx` (`/smokecraft/collections`) and its backend
(migration 087, `collectionsService.js`/`collectionsController.js`/
`collectionsRoutes.js`) were already a genuinely real, server-
authoritative, evidence-checked system before this pass — no client
unlock path exists; every item's ownership is recalculated fresh from
real backend evidence tables (`EVIDENCE_CHECKS`) on every request, never
trusted from the client, and duplicate ownership is impossible at the
DB level (`UNIQUE(guest_reference, collection_item_key)`). The audit
found and this pass closed 3 real, concrete defects rather than
rebuilding an already-correct system:

1. **Missing rate-limiter dev/test skip** (same class as SC-D021) —
   would throttle automated test suites.
2. **Identity-prefix inconsistency for authenticated accounts** —
   Collections used the raw `req.smokecraftIdentity.id` instead of the
   established `user:${id}` convention every other player-state table
   uses, and **guest-to-account conversion never transferred Collections
   ownership at all** as a direct consequence (no matching `user:`
   reference existed for it to find).
3. **Missing `ensureSmokeCraftGuestIdentity`** — a genuinely first-ever
   visit directly to `/smokecraft/collections` (before visiting any
   other SmokeCraft route) 401'd instead of getting a real guest
   identity issued, confirmed live via a fresh-browser Playwright smoke
   test.

Also added this pass: a real, evidence-preserving correction/reversal
mechanism (reuses the existing `smokecraft_reward_corrections` ledger
from Holistic Fix 5A-2, `correctionType='collection'`, staff-only via
the existing `requireStaff`-gated `/corrections` route) — a reversed
item's original earn record is never deleted or edited; `recalculate()`
now reads the corrections ledger to report an honest `'corrected'`
state without touching history.

The 5 seeded Collection items (Tool Collection and Lounge Collection
categories were already disclosed in migration 087's own comments as
having no legitimate backend earn condition — not fabricated this
pass) each map to a real source event:

| Item | Qualifying activity | Evidence table |
|---|---|---|
| filler-mastery-badge | Complete Filler Arrangement lesson | smokecraft_filler_arrangement_completion |
| seed-soil-scholar-badge | Explore ≥1 Seed & Soil component | smokecraft_seed_soil_progress |
| master-roller-badge | Complete ≥1 rolling-process step | smokecraft_rolling_progress |
| skill-tree-starter-badge | Complete Skill Tree Foundation node | smokecraft_skill_tree_learner_state |
| progression-pioneer-badge | ≥2 distinct progression event types | smokecraft_progression_events |

## Holistic Fix 5A-3G update (Skill Tree ledger integration)

Skill Tree (migration 086, `skillTreeService.js`) was already a real,
evidence-derived, server-authoritative rule engine before this pass — no
client-authority path ever existed. This pass closed 4 real integration
gaps found during audit (identity-prefix, rate-limiter dev-skip,
first-visit identity issuance, guest-to-account evidence transfer — see
`SMOKECRAFT_SYSTEM_DEFECT_REGISTER.md` SC-D034 through SC-D037) and
added staff-only correction/reversal support
(`correctionType='skill_tree'`, reusing the existing
`smokecraft_reward_corrections` ledger — same pattern as Collections).
No new nodes, progression rules, or migrations were added; the existing
7-node evidence map (Foundation → Community & Legacy) is unchanged. See
`public/proof/smokecraft-holistic-fix-5a-3g/00-proof-index.md` for the
full node-to-evidence table.

## Holistic Fix 5A-3H update (Leaderboard ledger integration and integrity closure)

The Leaderboard backend (migration 095, `getLeaderboard`/
`setLeaderboardPreference` in `playerStateService.js`) was already a
real, evidence-derived, server-authoritative ranking query before this
pass — no client-submitted score path ever existed. This pass closed 3
real integration gaps (dead venue-scope column, missing account-
conversion preference transfer, and the screen never rendering the real
fetched entries — see `SMOKECRAFT_SYSTEM_DEFECT_REGISTER.md` SC-D041
through SC-D043) and added real pagination controls + a genuine
live-refresh action. See
`public/proof/smokecraft-holistic-fix-5a-3h/00-proof-index.md`.

## Holistic Fix 5B-1 update (server-authoritative pairing engine)

Both real, reachable pairing screens (`PairingLab.jsx` S11,
`PairingRecommendations.jsx` S22) previously computed their
compatibility score entirely client-side via
`src/utils/pairingEngine.js`. This pass ported that same approved
scoring logic into a new, versioned, server-authoritative engine
(migration 098, `server/services/smokecraft/pairingEngineService.js`,
`/api/smokecraft/pairing-engine/*`) and rewired both screens through
one shared adapter (`useSmokeCraftPairingEngine`). No new cigar/
beverage facts were invented — only the fields already collected by
these screens are used. See `SMOKECRAFT_PAIRING_ENGINE_RULES.md` for
the full rule/scoring model.
