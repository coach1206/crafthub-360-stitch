# Package 1 — Golden Box Architecture Contract (proposal only, not implemented)

This document defines the proposed system for approval. No migration,
API, or UI is built by this document.

## Competition lifecycle

`DRAFT_ELIGIBLE → BUILDING → SUBMITTED → UNDER_REVIEW → SCORED →
FINALIST (optional) → RESULTS_PUBLISHED → ARCHIVED`, with `WITHDRAWN` as
a learner-initiated exit at any point before `SCORED`. Draft blends
persist indefinitely until submission (see Draft saving below).

## Eligibility rules

A learner becomes `DRAFT_ELIGIBLE` once minimum knowledge prerequisites
are met — proposed rule: completion of every locked session tagged
"Golden Box relevance: direct prerequisite" in `02-LOCKED-SESSION-
REGISTRY.md` (Terroir, Format, Flavor Memory, Pairing Lab, at minimum;
final list is Decision-pending, see `09-OWNER-DECISION-REGISTER.md`
Decision 6). Eligibility is a server-side computed boolean, never
client-asserted.

## Learner progression / knowledge prerequisites

Reuses the existing Management Sync journey/snapshot data
(`smokecraft_management_sync_journeys`/`_snapshots`) as the source of
truth for "what has this learner actually completed" — never
localStorage alone (flagged as a real risk in `04-DATA-BACKEND-GAP-
REGISTRY.md`).

## Blend-building workflow (the 26 actions from the mandate, mapped to proposed screens)

1. Seed genetics → `golden_box_entry_components(component_type='seed')`
2. Country/region → same table, `component_type='region'`
3. Soil/terroir → `component_type='soil'`/`'terroir'`
4. Leaf primings → `component_type='priming'`
5. Wrapper → `component_type='wrapper'`
6. Binder → `component_type='binder'`
7. Filler blend (long/short ratio) → `component_type='filler'`, with a
   `filler_ratio` JSONB sub-field
8. Curing approach → `component_type='curing'`
9. Fermentation strategy → `component_type='fermentation'`
10. Aging duration → `component_type='aging'`
11. Vitola → `component_type='vitola'`
12. Ring gauge → `component_type='ring_gauge'`
13. Predicted profile (strength/body/aroma/flavor/burn/draw/complexity/
    time) → computed server-side from component compatibility rules,
    returned as an explainable breakdown, never a black-box number
14. Test/refine → re-submits the draft for a fresh prediction, does not
    create a new `golden_box_entries` row (versioned via
    `golden_box_blends` revision number instead)
15. Explainable feedback → same prediction response, human-readable
    per-rule explanation
16. Refine → loops back to 1-12
17. Pairing selection → reuses `pairingEngine.js` (extracted into a
    shared service, per `06-DO-NOT-TOUCH-REGISTRY.md`'s allowed-change
    note)
18. Defend pairing → free-text field on the entry, judged qualitatively
19. Name the cigar → `golden_box_entries.cigar_name`
20. Golden Box presentation → `golden_box_entries.presentation_payload`
    (JSONB: description, optional learner-uploaded image reference)
21. Present/defend full blend → free-text + optional structured Q&A
22. Mentor scoring → `golden_box_scores(scorer_type='mentor')`
23. AI scoring → `golden_box_scores(scorer_type='ai')`, explanation
    required, same explainability rule as prediction (Decision 3 governs
    whether this is required, optional, or excluded)
24. Judge/community scoring → `golden_box_scores(scorer_type='judge'|'community')`
25. Leaderboard entry → reuses the existing `leaderboard_entries`
    mechanism with a new `competition_type='golden_box'` scoping value,
    not a parallel leaderboard system
26. Badges/stamps/rewards/collections → reuses `passport_360_badges`/
    `passport_stamps` with new Golden-Box-specific type rows; Collections
    is a new domain (Package 8 dependency, not built by Package 9)

## Draft saving

Every write to `golden_box_entries`/`golden_box_blends` is a real,
persisted transaction — never only in React state. A learner closing the
tab and returning must resume exactly where they left off, matching the
resume pattern already proven for the main journey (Management Sync
Package D).

## Entry validation

Server-side only: component compatibility rules (e.g. wrapper/binder/
filler combinations that are structurally impossible), completeness
checks before allowing `SUBMITTED` status, size/length limits on
free-text fields.

## Mentor feedback / AI-assisted feedback / human judging / blind judging

Score category breakdown (per the mandate's list): seed-region
compatibility, region-soil compatibility, leaf-priming balance,
wrapper-binder-filler compatibility, combustion, structural integrity,
strength balance, body, aroma, flavor architecture, complexity, flavor
progression, fermentation suitability, aging suitability, vitola
compatibility, ring-gauge compatibility, predicted draw, predicted burn,
pairing compatibility, creativity, technical reasoning, presentation and
defense. Each category stored as its own row in `golden_box_scores`
(category, score, max_score, explanation, scorer_type, scorer_id).
**Blind judging option**: if enabled, judge-facing queries must omit
`user_id`/`cigar_name`/any learner-identifying field until scoring is
submitted — a real query-shape requirement, not a UI toggle alone.

## Score categories / tie-breaking / rounds / finalists / winner selection

Tie-breaking: proposed rule — highest technical-reasoning score, then
earliest submission timestamp (deterministic, server-computed, never a
coin-flip presented as fair). Rounds/finalists: only if Decision 2/6
scope the competition as multi-round; a single-round model is simpler
and should be the default unless explicitly required.

## Leaderboard / badge / passport / XP / rewards / collections / skill-tree / challenge integration

All reuse existing systems with new Golden-Box-scoped type/category
values, per the "integrate existing systems, do not rebuild" rule in
`04-DATA-BACKEND-GAP-REGISTRY.md`. Skill tree, collections, daily/weekly
challenges do not exist yet (Package 8 dependency) — Golden Box
integration points for them should be designed as extension hooks now,
not blocked on their full build (Decision 6).

## Audit logging

Every state transition and score write goes through `auditAction()` —
requires adding a new `'GOLDEN_BOX'` value to `audit_logs.action_category`'s
CHECK constraint (a small, additive migration), not reusing `'VENUE'`
(would misclassify, exactly the kind of bug already found and fixed once
in Management Sync Package B for a different category).

## Moderation / admin controls

Proposed: platform-admin and venue-manager (where venue-scoped) can
withdraw/hide an entry for policy violations, logged via the same audit
mechanism; no silent deletion (matches `audit_logs`' append-only
convention).

## Venue-scoped vs. global competitions

Proposed schema supports both via a nullable `venue_id` on
`golden_box_competitions` — null means global. Decision 2 governs which
is actually required for launch.

## Image uploads / blend privacy / IP protection

If learner-submitted presentation images are required, reuse the
Venue Management Command Hub's proven upload-validation pattern
(manual MIME sniffing, size/dimension limits, server-generated object
keys) as a **pattern to replicate**, not a shared code path — the two
modules should stay separately scoped per `06-DO-NOT-TOUCH-REGISTRY.md`.
Blend privacy: draft blends visible only to their owner + platform admin
until `SUBMITTED`; after submission, visibility follows the blind-judging
decision (Decision 3).

## Data retention / export

Proposed: entries retained indefinitely (matches this codebase's
append-only audit convention); no export requirement identified in the
mandate beyond what existing admin tooling already provides.

## Accessibility / responsive / offline / error/empty/loading states / demo labeling

Must follow the exact same rules already proven in Venue Management
Command Hub Package 6B (ARIA live regions, real loading/saving/failed/
permission-denied/stale-conflict states, no fake success) — same
pattern, new module.

## Security and permissions

Server-side scoring logic never shipped to the client (mandate's
explicit requirement) — scoring rule weights/thresholds live only in
`server/services/goldenBox/scoringService.js` (proposed), never in a
`src/` file. Every write tenant/user-scoped and authorized via the same
`requireAuth` pattern already proven across Management Sync and Venue
Management.

## Proposed entities

`golden_box_competitions`, `golden_box_rounds`, `golden_box_entries`,
`golden_box_entry_components`, `golden_box_blends` (versioned
revisions), `golden_box_scores`, `golden_box_judges`,
`golden_box_feedback`, `golden_box_rewards`, `golden_box_eligibility`,
`golden_box_activity_log` — exactly the mandate's list, no additions.
Relationships: `entries` belong to a `competition` (nullable →
standalone/global) and a learner; `entry_components` belong to an
`entry`; `blends` are versioned snapshots of an `entry`'s components;
`scores` reference an `entry` + `scorer`; `judges` reference `system_users`
with a `golden_box_judge` role/flag; `activity_log` mirrors `audit_logs`'
append-only pattern but scoped to Golden Box for query performance.

## Existing verified systems to integrate, not rebuild

Pairing engine (`pairingEngine.js`), Passport/Badges tables, Leaderboard
tables, Management Sync journey/snapshot data (for eligibility), Venue
Management's upload-validation *pattern* (not shared code), the existing
`requireAuth`/`auditAction` middleware family.
