# Final Golden Box Data Model — Package 1

Full column-level definitions live in
`server/db/migrations/077_golden_box_foundation.sql` (the single source
of truth — not re-transcribed here to avoid drift). This document
summarizes structure, lifecycle states, and reuse decisions.

## Competitions & scoping (Decision 2)

`golden_box_competitions` — `scope CHECK(global|venue|cohort|event|private_invitation)`,
`scope_venue_id`/`scope_cohort_id`/`scope_event_id` (only `scope_venue_id`
has a real FK today, to `venues`; cohort/event are metadata-backed
integration points since no cohort/event tables exist elsewhere in this
codebase — per the mandate's "design safe nullable references... without
fabricating unrelated systems" instruction). `chk_gbc_scope_venue`
enforces `scope_venue_id NOT NULL` when `scope='venue'`.
`golden_box_competition_invitations` — private-invitation allowlist,
either `invited_user_id` or `invited_guest_reference`.

## Lifecycle states (Step 3)

- **Competition**: `draft → scheduled → registration_open →
  registration_closed → active → submission_closed → judging →
  results_pending → completed`, with `cancelled`/`archived` side states.
  Enforced by `lifecycleService.js`'s `COMPETITION_TRANSITIONS` map —
  every mutation goes through one central service, never a route file
  directly.
- **Entry**: `draft → incomplete → eligible/ineligible → submitted →
  locked → under_review → finalist/not_selected → winner`, plus
  `withdrawn`/`disqualified`. `draft`/`incomplete` can transition
  directly to `submitted` (the real gate is `entryService.submitEntry`'s
  component-completeness validation, not a forced `eligible` waypoint —
  documented design choice, see `07-PACKAGE-1-COMPLETION-REPORT.md`
  known limitations).
- **Scorecard**: `draft → submitted → locked/amended → voided`.

## Eligibility (Step 7)

`golden_box_eligibility_rules` (per-competition, `rule_type` +
`rule_config` JSONB) and `golden_box_eligibility_results` (persisted
per-evaluation: rule, result, reason, timestamp, source snapshot,
override fields). 9 rule types supported per the mandate's list; `quiz`
scoring fails closed honestly (`quiz_score_data_not_available`) since no
quiz-persistence exists yet (Package 0 gap finding).

## Entries, versions, blends (Step 8/9)

`golden_box_entries` (one per competition+guest_reference, `UNIQUE`
constraint), `golden_box_entry_versions` (immutable snapshot per
version — a new version is created on every draft save, the prior one
is never mutated), `golden_box_blend_components` (per-version, typed
`component_type` CHECK covering all 21 categories from the mandate's
Step 9 list), `golden_box_blends` (a **view**, not a duplicate table —
an entry_version IS the versioned blend). `golden_box_submissions`
records validation pass/fail at the moment of submission.
`golden_box_component_catalog` is the curated-starter-content table
(Step 9's "not a live supplier inventory" requirement) — no seed rows
inserted this package (disclosed, not fabricated).

## Judging (Step 10, Decision 3)

`golden_box_judges`, `golden_box_judge_assignments`,
`golden_box_scorecards` (one per judge per entry, amendable via
`amended_from` self-reference), `golden_box_scores` (`scorer_type`
CHECK restricts to `human_judge`/`administrative_adjustment`/
`tie_break`/`disqualification` — **never `ai`**, structurally
enforcing "AI may not silently select the winner").

## AI educational analysis (Step 11, Decision 3)

`golden_box_ai_analyses` — completely separate table, no FK path into
`golden_box_scores`. `status` honestly defaults to `not_configured`
since no AI provider is wired in this environment
(`GOLDEN_BOX_AI_PROVIDER` env var unset). `limitation_notes` defaults to
an explicit "no physical tasting data" disclosure string.
`golden_box_feedback` covers mentor/judge/administrator free-text notes.

## Results, rewards, visibility, audit

`golden_box_results` (aggregate score, placement, finalist/winner flags,
tie-break reason, disqualification — one row per competition+entry,
computed read-side, never overwrites individual judge scores).
`golden_box_rewards` (idempotent grant record, `UNIQUE(entry_id,
reward_type)`). `golden_box_visibility_rules` (explicit per-entry
per-role override; default policy computed by `visibilityService.js`
when no row exists). `golden_box_activity_log` (append-only, trigger-
enforced, mirrors `audit_logs`' pattern but scoped for query
performance).

## XP foundation (Decision 5)

`xp_accounts` (one per user_id OR guest_reference, partial unique
indexes enforce exactly one), `xp_award_rules` (config table, no seed
rows inserted this package), `xp_transactions` (append-only,
`idempotency_key UNIQUE` — the actual duplicate-prevention mechanism).
Balance is a maintained cache on `xp_accounts`, never written outside
the same transaction as a `xp_transactions` insert.
