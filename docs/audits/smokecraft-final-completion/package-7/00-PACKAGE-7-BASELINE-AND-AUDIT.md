# Package 7 Baseline & Golden Box/Gamification Audit

Combined per the disclosed documentation-format pattern used since
Package 5. Baseline (Step 1) and audit (Step 2) together, since the
audit's findings *are* the baseline for a package this large.

## Baseline

- Branch `recovery/smokecraft-codex-final` (unchanged) · Commit `aa0b9cf8` (unchanged) · Uncommitted paths: 227 (post Package 6 closure) → 233 (post this pass)
- Current Golden Box routes: `/smokecraft/golden-box` (rules, unchanged), `/smokecraft/golden-box/status`, `/smokecraft/golden-box/competitions` (Hub), `/competitions/:id` (Detail), `/entries/:id/blend` (Workspace — extended this pass), `/results/:id` (Results Experience)
- Current Golden Box backend tables: 23 tables + 1 view, all from migration 077 (Package 1) — competitions, entries, entry_versions, blend_components, submissions, judges, judge_assignments, scorecards, scores, ai_analyses, feedback, results, rewards, visibility_rules, activity_log, plus XP tables
- Current competition lifecycle: `draft → scheduled → registration_open → registration_closed → active → submission_closed → judging → results_pending → completed/cancelled/archived` (migration 077, `lifecycleService.js`, unchanged)
- Current entry states: `draft, incomplete, eligible, ineligible, submitted, locked, under_review, finalist, winner, not_selected, withdrawn, disqualified` — all real, all already wired to `EntryWorkspace.jsx`'s status copy
- Current judging structures: **already fully built** — `golden_box_judges`, `_judge_assignments`, `_scorecards` (draft/submitted/locked/amended/voided), `_scores` (category, score, max_score, comment, scorer_type restricted to `human_judge/administrative_adjustment/tie_break/disqualification` — AI structurally cannot appear here), `judgingService.js` (`assignJudge`, `submitScorecard`, `computeAggregateResult`) — verified working end-to-end by Package 1's regression suite (36/36, re-confirmed this pass)
- Current score structures: `golden_box_scores.category` is free text, not a fixed enum — Package 1's existing categories (used by the test suite) already map reasonably to the mandate's list (blend/construction/draw/burn/flavor/balance/complexity/pairing/creativity/presentation); no schema change needed to add more categories, only content/labels
- Current reward hooks: `rewardsIntegrationService.js` — `grantXp`, `grantBadge`, `publishToLeaderboard`, all idempotent via `golden_box_rewards`'s `UNIQUE(entry_id, reward_type)`
- Current leaderboard integration: writes into the **existing** `smoke_leaderboard_entries` table (extended additively in migration 077/078) — no parallel leaderboard system
- Current badge integration: `grantBadge` calls into the existing badge system (name not duplicated here — confirmed via Package 1's test 24, which honestly fails without a real guest profile rather than fabricating one)
- Current Passport integration: `golden_box_rewards.reward_type = 'passport_stamp'` hook exists structurally; no dedicated Passport-stamp-issuing code path was found wired to it this pass (see Known Limitations)
- Current XP integration: fully live — `xpService.awardXp`, idempotent, append-only ledger, unchanged
- Current mentor integration: `journey.mentor[0]`, `MentorGuidancePanel` — unchanged, reused
- Current challenge/skill/collection/streak/recommendation systems: **none exist** — confirmed by repository-wide search, zero tables, zero routes, zero components for any of Skill Tree, Collections, Challenge Hub, Quests, Streaks, Mentor Affinity progression, or Recommended Next Journey
- Current image placeholder map: `smokecraft_hotspots`/`smokecraft_content_media` (migration 079), zero rows, unchanged
- Current SC_ASSETS registry: no Golden Box Build Studio/judging/results/rewards image keys exist
- Current protected-file diff state: migrations 075-083 empty diffs; Venue Management, Badges/Passport/Leaderboard frontend, `GoldenBox.jsx`/`GoldenBoxStatus.jsx`, `session.js`, Cutting/Lighting screens all untouched (confirmed via `git status --porcelain`, re-checked after this pass — still true)

## Audit

| Area | Classification | Notes |
|---|---|---|
| Golden Box Hub | VERIFIED_COMPLETE | Package 2, unchanged |
| Competition detail / Eligibility | VERIFIED_COMPLETE | Package 1/2, unchanged |
| Entry creation / Blend building | VERIFIED_COMPLETE | Package 1-6, unchanged this pass except the new Presentation step |
| Draft saving / Draft resume | VERIFIED_COMPLETE | Package 4 rehydration fix, re-confirmed 14/14 |
| **Draft revision (component-level)** | VERIFIED_COMPLETE | `golden_box_entry_versions` is already append-only-versioned; every save creates a new version — this *is* the revision history for blend components, already real |
| **Blend story / presentation / defense** | was STATIC_SHELL → now **FUNCTIONAL_BUT_INCOMPLETE** | Built this pass — real fields, real persistence, real privacy, real rehydration (13/13 tests). "Incomplete" because it is not yet surfaced to mentors/judges as a distinct reviewable artifact (see below) |
| Submission / Entry status | VERIFIED_COMPLETE | Unchanged |
| **Human judging workflow** | VERIFIED_COMPLETE | Fully built in Package 1 — judge assignment, blind-judging-ready scorecard model, draft/submit/lock/amend/void states, score range validation, aggregate computation. Never rebuilt or duplicated this pass. |
| **Golden Box Judging Scorecard (UI)** | STATIC_SHELL (backend only) | The backend fully supports it; no dedicated judge-facing scorecard **screen** exists in the frontend — judging was only ever tested via direct API calls (Package 1's test suite), never through a real UI. Not built this pass (see Known Limitations). |
| **AI educational review** | VERIFIED_COMPLETE (backend) | `golden_box_ai_analyses`, structurally separate from `golden_box_scores`, honest `not_configured` state (no provider configured) — real, tested (Package 1). No frontend display of AI analysis exists yet (backend-only). |
| **Results and ranking** | FUNCTIONAL_BUT_INCOMPLETE | `golden_box_results` + `ResultsExperience.jsx` exist (Package 2) and link to the real Leaderboard; not extended this pass to show score breakdown/mentor feedback/badge-award detail (see Known Limitations) |
| **Leaderboard integration** | VERIFIED_COMPLETE | Existing system, not rebuilt, confirmed unaffected |
| **Badges / Passport / Rewards** | FUNCTIONAL_BUT_INCOMPLETE (backend hooks only) | Idempotent granting hooks exist and are tested; no dedicated Rewards Center screen exists |
| **Skill Tree** | MISSING_CONTENT | Not built this pass |
| **Collections** | MISSING_CONTENT | Not built this pass |
| **Challenge Hub / Daily / Weekly / Quests** | MISSING_CONTENT | Not built this pass |
| **Streaks** | MISSING_CONTENT | Not built this pass |
| **Mentor progress / affinity** | MISSING_CONTENT | Not built this pass |
| **Recommended Next Journey** | MISSING_CONTENT | Not built this pass |
| Migrations 075-083, Venue Management, Badges/Passport/Leaderboard frontend, `GoldenBox.jsx`/`GoldenBoxStatus.jsx`, `session.js`, Cutting/Lighting | PROTECTED | Untouched |

No item above was marked complete because a table or file merely exists —
each reflects direct reading of the code and, where applicable, a real
passing test.
