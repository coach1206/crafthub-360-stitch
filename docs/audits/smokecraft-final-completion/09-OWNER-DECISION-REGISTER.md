# Owner Decision Register — unresolved, not silently chosen

## Addendum — Decisions 1-6 approved (Package 1)

All six decisions below were explicitly ruled on by the owner before
Package 1 began. Exact rulings, for the record:

1. 27-session order permanently locked, no 28th session, no duplicate
   records; product docs use 7 named phases; code's existing 6-group/
   3-round structure may remain temporarily — Package 1 did not alter
   `VISIT_STRUCTURE` (not required for Golden Box backend work).
2. Golden Box supports all 5 scopes (global/venue/cohort/event/private
   invitation), one scope per competition with optional scope
   identifiers — implemented exactly as ruled in migration 077
   (`golden_box_competitions.scope` CHECK + `chk_gbc_scope_venue`).
3. Hybrid judging: human-controlled official scores; AI limited to
   educational/analytical roles, structurally barred from official
   scoring (`golden_box_scores.scorer_type` CHECK excludes any AI
   value; `golden_box_ai_analyses` has no FK path into scores) —
   implemented exactly as ruled.
4. Recipe privacy: private to entrant/judges/administrators by default
   until judging closes, configurable per-role visibility — implemented
   via `visibilityService.js` + `golden_box_visibility_rules`.
5. XP normalized in Package 1 (not deferred) — `xp_accounts`/
   `xp_transactions`/`xp_award_rules` built and live-tested; existing
   flat-JSON XP left untouched, not deleted, not treated as authoritative
   going forward.
6. Golden Box core system completed before full skill tree/collections/
   challenges/quests/streaks; Package 1 established stable integration
   boundaries (`golden_box_rewards` reward-type enum includes `xp`/
   `badge`/`passport_stamp`/`leaderboard_entry`, extensible without
   redesign) without building those systems.

See `package-1/07-PACKAGE-1-COMPLETION-REPORT.md` for full as-built
detail against each ruling.

## Decision 1 — six-phase vs. seven-phase terminology

The running code (`session.js`) groups the locked 27 sessions into 6
phases/3 macro-rounds. Earlier/current mandates say 7 phases.

- **Recommended option**: keep the current 6-phase code grouping;
  update documentation/mandate language to match the code, since the
  27-session order itself (the thing that actually matters for guest
  experience) is identical either way — only the phase *label* differs.
- **Why**: changing working, tested route-guard/unlock logic in
  `session.js` to invent a 7th phase carries real regression risk for
  zero guest-facing benefit; the 27-session order is unaffected by
  phase count.
- **Risk of delaying**: low — this is a documentation/terminology
  question, not a blocker for Golden Box work, which references session
  IDs, not phase numbers.
- **Dependencies**: none.
- **What's blocked until resolved**: nothing functionally; only which
  phase-count language future SmokeCraft documents should use.

## Decision 2 — Golden Box scope (global / venue-specific / cohort / event / all)

- **Recommended option**: start global (no `venue_id` scoping) for the
  initial Golden Box launch, with the schema already supporting a
  nullable `venue_id` for venue-scoped competitions later (see
  `07-PACKAGE-1-GOLDEN-BOX-CONTRACT.md`).
- **Why**: simplest correct default; venue-scoping is additive later
  without a schema change (the nullable column already anticipates it).
- **Risk of delaying**: medium — Package 1's schema needs this answered
  before finalizing `golden_box_competitions`' shape, though the
  nullable-column design tolerates either answer without rework.
- **Dependencies**: Package 1.
- **What's blocked**: finalizing the competition-creation admin flow
  (venue-manager-initiated vs. platform-initiated).

## Decision 3 — judging model (human-only / AI-assisted / hybrid)

- **Recommended option**: hybrid — AI-assisted feedback available
  immediately (lower cost, faster iteration for learners), human/mentor
  scoring required for final competition results, community scoring
  optional/toggleable per competition.
- **Why**: matches the mandate's own listed requirement for all three
  score types; AI-only final scoring would be a lower-trust launch,
  human-only would remove the "explainable AI feedback" learning value
  the mandate explicitly wants during blend refinement.
- **Risk of delaying**: high — this decision shapes `golden_box_scores`'
  `scorer_type` enum and the entire judging-queue UI; hard to retrofit.
- **Dependencies**: Package 1, Package 9.
- **What's blocked**: `golden_box_judges` table design, blind-judging
  query shape.

## Decision 4 — blend recipe privacy until competition completion

- **Recommended option**: yes, private until `SUBMITTED`; after
  submission, private from other learners always, visible to
  judges/mentors per the blind-judging rule from Decision 3.
- **Why**: prevents copying/gaming, matches "intellectual-property
  protections" in the mandate.
- **Risk of delaying**: low-medium — affects query authorization rules
  in Package 9, not a schema blocker.
- **Dependencies**: Package 9.
- **What's blocked**: judge-facing query authorization design.

## Decision 5 — XP: migrate to normalized DB now, or defer to gamification package

- **Recommended option**: defer full XP normalization to Package 8
  (gamification), but note now that Golden Box eligibility (Decision 6)
  should read from the Management Sync journey/snapshot completion data
  (already real and server-backed) rather than from the current
  flat-JSON XP total, to avoid building Golden Box eligibility on top of
  a known-fragile data source that's about to be replaced.
- **Why**: avoids building Golden Box twice — once against the fragile
  flat-file XP, once against the real table after Package 8.
- **Risk of delaying**: low if the above eligibility approach is used;
  high if Golden Box eligibility is wired to the flat-file XP now.
- **Dependencies**: Package 8 for full XP normalization; Package 1 can
  proceed without waiting, using session-completion data instead.
- **What's blocked**: nothing, if the recommended eligibility source is
  used.

## Decision 6 — must skill tree/collections/streaks/challenges precede Golden Box, or can they follow?

- **Recommended option**: they may follow — Golden Box's core
  build-blend-score-leaderboard loop only strictly depends on Package 1's
  schema and existing Badges/Passport/Leaderboard/Pairing systems, all
  already real. Skill tree, collections, and recurring challenges can be
  layered on as reward-and-engagement enhancements after Golden Box's
  core loop works, per the soft-dependency note in
  `08-PACKAGE-EXECUTION-MAP.md`.
- **Why**: gets the mandate's stated flagship ("Golden Box is not a
  disconnected page... the culmination of the complete learning system")
  live sooner, without blocking it on four entirely new gamification
  subsystems that have no code today.
- **Risk of delaying**: if Golden Box is blocked on full Package 8
  completion, the flagship feature ships much later; if Golden Box ships
  first without skill-tree/collection hooks designed in, retrofitting
  integration points later is harder.
- **Dependencies**: mutual — Golden Box needs *some* prerequisite/
  eligibility signal (satisfied by existing session-completion data,
  Decision 5), gamification systems benefit from Golden Box existing as
  a thing to award XP/badges/collectibles for.
- **What's blocked**: the exact Package 8/9 ordering — this map defaults
  to the mandate's stated 8-then-9 order but flags this as reorderable
  with your approval.
