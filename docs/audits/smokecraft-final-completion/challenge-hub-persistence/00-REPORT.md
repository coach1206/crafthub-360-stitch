# Challenge Hub Live State and Persistence — Completion Report

**Starting commit:** `5469d1c0` (verified: local HEAD and `origin/recovery/smokecraft-codex-final` both matched, working tree clean, before any work began).

## 1. Discovery audit findings

- `src/pages/smokecraft/ChallengeHub.jsx` was a fully static, local-only shell: one hard-coded challenge card (Blend Fault Identification) routing to its own working 3-step flow, and an honest pre-existing disclosure that streaks/XP/badge unlocks/countdowns were "not yet backend-connected." There was no fake streak or leaderboard data anywhere to remove — none existed.
- No existing challenge/assignment/submission/schedule table exists anywhere in the codebase. `golden_box_rounds`/`golden_box_submissions` are Golden-Box-specific and were **not** reused, per the explicit Golden Box boundary in the mandate — this is genuinely new architecture.
- `smokecraft_progression_events` (migration 085) was reused as the single shared evidence/event log, exactly as in the Skill Tree and Collections passes — no competing event system was created.
- No per-guest timezone system exists anywhere in the 87 prior migrations; every timestamp column is `TIMESTAMPTZ` backed by Postgres `now()`. Challenge periods use this same convention: UTC calendar day (daily), UTC ISO week Monday-start (weekly).
- `passport_360_badges` and Golden Box tables were inspected and confirmed unrelated/not reusable, consistent with prior passes' findings.

## 2. Architecture built (migration 088, additive only)

Three new tables, following the exact `definitions -> instances -> learner_state` naming pattern established by Skill Tree/Collections:

- `smokecraft_challenge_definitions` — stable challenge catalog. **Exactly 2 seeded, disclosed as a deliberately small, real catalog**: `daily-lesson-practice` (Daily, single-event) and `weekly-multi-activity-builder` (Weekly, multi-event, breadth ≥3 distinct activity types) — satisfying the mandate's minimum-seed requirement (≥1 Daily, ≥1 Weekly, ≥1 single-event, ≥1 multi-event) without inventing "dozens of generic challenges."
- `smokecraft_challenge_instances` — deterministic per-period rows. `instance_key` is derived server-side from `(challenge_key, period_start_date)`; a `UNIQUE(challenge_key, effective_start)` plus `UNIQUE(instance_key)` constraint makes instance creation genuinely idempotent — repeated hub loads never create a second instance for the same period, verified in the test suite by loading the hub twice and confirming the instance row count stays at 2.
- `smokecraft_challenge_learner_state` — per-guest per-instance participation, gated by `UNIQUE(guest_reference, challenge_instance_key)` and a separate `idempotency_key` unique constraint, with `participation_state` restricted to `available | in_progress | completed | expired` (no `submitted`/`failed`/`locked`/`cancelled` states were needed — none of the two seeded challenges require them).

`server/services/smokecraft/challengeHubService.js` is the rule engine:
- `resolveCurrentInstance()` — idempotent `INSERT ... ON CONFLICT (instance_key) DO NOTHING`, falling back to a `SELECT` when the row already exists.
- `evaluateProgress()` — reads real `smokecraft_progression_events` rows within the instance's real `[effective_start, effective_end)` window and counts distinct `event_type`s.
- `getHub()` — the full per-learner read-model: resolves both instances, computes a real `timeStatus` (`upcoming | active | expired | cancelled`) from server timestamps, and — while a period is `active` — re-evaluates evidence and completes the challenge in-line the moment real evidence is met (writing a `challenge_completed` progression event with a per-instance idempotency key first).
- `startChallenge()` — idempotent (`ON CONFLICT (guest_reference, challenge_instance_key) DO UPDATE`), explicitly **never completes or awards** — it only transitions `available -> in_progress` and records a `challenge_started` event.

**Bug found and fixed during testing:** the evidence query initially counted *all* progression events in the window, which meant a challenge's own `challenge_started` bookkeeping event counted as "1 distinct activity" — trivially auto-completing `daily-lesson-practice` the instant a learner clicked Start, with zero real lesson evidence. Fixed by excluding the Challenge Hub's own bookkeeping event types (`challenge_started`, `challenge_progress_updated`, `challenge_completed`, `challenge_reward_granted`, `challenge_recalculated`) from the evidence count — only real lesson/activity events from other passes (Filler Arrangement, Seed & Soil, Skill Tree, Collections, etc.) can satisfy a challenge's requirement. This is disclosed here rather than hidden, and is directly covered by dedicated tests (see below) proving Start does not, by itself, complete a challenge.

## 3. XP / reward rules

Both seeded challenge definitions have `xp_reward = 0` — a deliberate, disclosed design choice (no reward has been approved for this pass), matching the same "zero XP, disclosed" pattern used for every Skill Tree node and Collection item. No `awardXp()` call is fired anywhere in the Challenge Hub completion path. Verified directly: zero `xp_transactions` rows referencing "challenge" exist after a real completion.

## 4. API surface

Mounted at `/api/smokecraft/challenge-hub` in `server/index.js`, same `optionalAuth` + `attachSmokeCraftIdentity` + `requireSmokeCraftIdentity` + local `bridgeIdentity` middleware pattern as every prior pass:

- `GET /` — Read Challenge Hub (full per-learner read-model, real server timestamps).
- `GET /challenges/:challengeKey` — Read Single Challenge.
- `POST /challenges/:challengeKey/start` — Start Challenge (idempotent; never completes or awards).
- `POST /recalculate` — Recalculate Challenge Progress (idempotent; ignores any client-submitted `progress`/`completed` fields entirely — verified directly by sending a forged body).

All identity-gated endpoints reject unauthenticated requests (400/401), and there is no route that accepts a client-submitted `participationState`, `progress`, or completion flag anywhere.

## 5. Frontend (`src/pages/smokecraft/ChallengeHub.jsx`)

Rewritten to load live state via `src/services/smokecraft/challengeHubApiClient.js`, matching the Skill Tree/Collections live-loading pattern: real `loading/ready/error/offline` states, no default-highlighted challenge, every card a real interactive control opening a real detail panel with real progress, a real Start Challenge action (gated to only appear while `timeStatus === 'active'` and `participationState === 'available'`), and an honest countdown computed from the server's real `effectiveEnd` timestamp (the UI only re-renders the display every 30s — it never invents the deadline itself). The pre-existing Blend Fault Identification practice card is retained unchanged as a separate practice activity (its own scoring remains explicitly out of scope for this pass). The honest "streaks and leaderboards are not yet backend-connected" disclosure is retained, since neither system exists anywhere in the codebase to connect to or fake.

## 6. Dedicated test suite — `verify-smokecraft-challenge-hub.mjs`

**58/58 passing.** Covers: migration/table/constraint existence; exactly 2 seeded definitions (1 Daily, 1 Weekly, 1 single-event, 1 multi-event); zero XP on both; no globally-seeded instances or learner state; unauthenticated/forged-request rejection; new-learner correct initial state; deterministic idempotent instance resolution (repeated loads, same instance keys, exactly 2 instance rows); single-challenge read + 404 on a nonexistent key; idempotent Start (does not complete/award, does not duplicate on a second call); real-evidence-driven completion (Filler Arrangement completion event completes the Daily challenge); persisted completion referencing a real supporting progression event; idempotent duplicate re-evaluation (no duplicate learner-state row, no duplicate `challenge_completed` event); weekly breadth-based progress tracking; two-learner isolation at the API and DB level; state persistence across "refresh"; server-timestamp-based (not client-invented) time-window checks; recalculate ignoring forged client progress/completion; and UI checks (real titles, real completed state, no fake streak value beyond the honest disclosure text, no rendered leaderboard widget, real clickable detail panels, keyboard-accessible cards, no horizontal overflow on desktop/tablet/handheld).

## 7. Regression battery (all re-run against a freshly migrated + re-seeded database)

| Suite | Result |
|---|---|
| `verify-smokecraft-filler-arrangement.mjs` | 17/17 |
| `verify-smokecraft-skill-tree.mjs` | 32/32 |
| `verify-smokecraft-collections.mjs` | 34/34 |
| `verify-golden-box-package-5-leaf-construction.mjs` | 27/27 |
| `verify-smokecraft-journey-state.mjs` | 7/7 |
| `verify-smokecraft-new-gamification-screens.mjs` | 24/24 (updated — see below) |
| `verify-venue-management-command-hub-package-6b.mjs` | 33/33 |
| `verify-smokecraft-challenge-hub.mjs` (new) | 58/58 |
| `npm run build` | Succeeds (pre-existing >500kB main-chunk warning, unrelated to this pass) |

**`verify-smokecraft-new-gamification-screens.mjs` update (disclosed):** its Challenge Hub section previously asserted the old static-shell text ("Blend Fault Identification" as the sole listed item, with a click navigating straight to the challenge route). Updated to additionally assert the real live Daily Practice challenge title now renders, while keeping the existing Blend Fault Identification navigation assertion intact (that card/flow is unchanged). This follows the same disclosed-update pattern used twice already for Skill Tree and Collections in this file.

**Environment note (not a regression):** this pass ran in a fresh container with a newly created database. `npm run db:migrate` applied all 88 migrations cleanly, including 088 on top of 087 with no data loss. `golden_box_component_catalog`/quiz/flavor-note rows are seeded by a separate application-level script (`server/db/seeds/seedSmokecraftEducationalContent.mjs`, not a migration) that had to be re-run once to restore Package 5/6/7 fixture data in this fresh environment — this is an existing, pre-dating-this-pass seed script, run here only to make the regression battery runnable, not modified. `verify-golden-box-package-7a.mjs` still requires a one-time `pkill7a-live-comp` competition fixture that this suite's own script does not create; this is a pre-existing gap unrelated to Challenge Hub and was not touched.

## 8. Proof screenshots

`public/proof/smokecraft-challenge-hub-persistence/`: `01-desktop-available.png`, `02-desktop-detail-available.png`, `03-desktop-in-progress.png` (after Start), `04-tablet.png`, `05-handheld.png`, `06-evidence-completed.png` (real Filler Arrangement evidence auto-completing the Daily challenge), `07-refresh-preserves-state.png` (same completed state after a full page reload), `08-weekly-progress-countdown.png` (real weekly breadth progress + real server-timestamp countdown).

## 9. Out of scope (not touched)

Blend Fault Identification backend scoring, full leaderboard infrastructure, any streak system, social/multiplayer/tournament features, merchandise, new Skill Tree branches, new Collection categories, POS360, E.A.T. 360, general NOVEE OS redesign, final deployment closeout. No shallow stubs were created for any of these.

## Completion gate

- [x] Migration applied cleanly, additive only, no data loss to prior passes.
- [x] Backend is the sole source of truth; no client-submitted completion/progress accepted anywhere (verified by forged-request tests).
- [x] Idempotency enforced via real database UNIQUE constraints (instances and learner state), proven by duplicate-call and row-count tests.
- [x] No fake streaks, leaderboards, or fabricated countdowns; honest disclosure retained where no backend system exists.
- [x] Dedicated test suite passes (58/58); full regression battery passes; `npm run build` succeeds.
- [x] Real proof screenshots captured from the running app.
- [x] No partial/fake completion claimed.

**PASS — CHALLENGE HUB LIVE STATE COMPLETE**
