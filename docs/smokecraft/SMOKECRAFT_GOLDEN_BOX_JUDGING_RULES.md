# SmokeCraft Golden Box — Judging Rules

Holistic Fix 5C-2A. Formalizes the Golden Box judge-assignment and
scorecard-scoring authority. This document does not invent a new
rubric — it records, verbatim, the rubric that was already live and
approved in `JudgeEntryReview.jsx`'s `CATEGORIES` array and
`judgingService.js`'s pre-existing `VALID_CATEGORIES` Set, now
persisted as a real, versioned database table
(`golden_box_rubric_criteria`, migration 103).

## Rubric — rule version 1

Weight is equal (1) across all criteria, matching the pre-existing
unweighted-average behavior of `computeAggregateResult()`. Range is
0–10 for every criterion. No criterion requires a comment (comments
are documented as optional in the existing UI).

| Criterion ID | Label | Description | Min | Max | Weight | Comment required | Rule version |
|---|---|---|---|---|---|---|---|
| `construction` | Construction | How evenly and securely the cigar is built — firmness, seams, cap security. | 0 | 10 | 1 | No | 1 |
| `draw` | Draw | Airflow resistance when drawing smoke through the cigar. | 0 | 10 | 1 | No | 1 |
| `burn` | Burn | How evenly the cigar burns down its length. | 0 | 10 | 1 | No | 1 |
| `aroma` | Aroma (Blend) | Cold and lit aroma character of the blend as a whole. | 0 | 10 | 1 | No | 1 |
| `flavor` | Flavor | Overall flavor quality and clarity of the blend. | 0 | 10 | 1 | No | 1 |
| `balance` | Balance | Whether strength, body, and flavor work together rather than one dominating. | 0 | 10 | 1 | No | 1 |
| `complexity` | Complexity | How many distinct, well-integrated notes the blend presents. | 0 | 10 | 1 | No | 1 |
| `progression` | Flavor Progression | How the flavor evolves from first to final third. | 0 | 10 | 1 | No | 1 |
| `finish` | Finish | The sensation and flavor that lingers after each puff. | 0 | 10 | 1 | No | 1 |
| `creativity` | Creativity | Originality of the blend concept and pairing rationale. | 0 | 10 | 1 | No | 1 |
| `rule_compliance` | Presentation (Rule Compliance) | Whether the entry followed competition requirements and presented a complete, defensible submission. | 0 | 10 | 1 | No | 1 |
| `overall_impression` | Overall Impression (incl. Pairing) | Holistic judgment of the blend, presentation, and pairing rationale together. | 0 | 10 | 1 | No | 1 |

The weighted total is computed server-side only, inside
`submitScorecard()`, as:

```
weightedTotal   = Σ(score_i * weight_i)
weightPossible  = Σ(max_score_i * weight_i)
normalizedTotal = round(weightedTotal / weightPossible * 100, 2)
```

A client-submitted `weightedTotal`/`totalScore` field in the request
body is always ignored — verified live in
`verify-smokecraft-hf5c2a-scorecard-api.mjs` by injecting a fabricated
value and confirming the persisted result is the real server
computation.

## Judge-assignment authority

- **Authorization**: only an authenticated user with the `admin` role
  may call `POST /api/smokecraft/golden-box/competitions/:competitionId/entries/:entryId/judges`
  (route-level `requireAuth + requireRole('admin')`).
- **Eligibility**: the target entry must be in one of
  `ELIGIBLE_ENTRY_STATUSES_FOR_ASSIGNMENT = ['submitted', 'locked',
  'under_review']` — a still-editable draft entry can never be
  assigned a judge.
- **No duplicate assignment**: `golden_box_judge_assignments` has
  `UNIQUE(judge_id, entry_id)`; a repeat assignment call is a real
  database no-op (`ON CONFLICT DO NOTHING`), reported as
  `alreadyAssigned: true`, never a second row.
- **No self-assignment**: an entrant (`entry.user_id`) can never be
  assigned as the judge of their own entry (`judge_self_assignment_prohibited`).
- **Venue/competition boundary**: for a competition with `scope =
  'venue'`, the judge must have a real, active `venue_memberships` row
  for that competition's `scope_venue_id` (`judge_outside_venue_scope`
  otherwise).
- **Audit trail**: every assignment records `assigned_by` (who) and
  `assigned_at` (when, via the row's own timestamp), and emits an
  append-only `golden_box_judge_assigned` canonical event.

## Scorecard authority

- **Draft**: `saveScorecardDraft()` accepts a partial set of scores,
  never transitions status, supports `expectedVersion` (optimistic
  concurrency against `draft_version`, real `409 stale_version` on
  conflict) and `idempotencyKey` (dedupe for rapid double-clicks).
- **Final submission**: `submitScorecard()` requires every rubric
  criterion to be present (`422 missing_criterion:<key>` otherwise),
  computes the weighted total and stamps the active `rule_version`
  server-side, and locks the scorecard — no further draft edits are
  accepted (`409 scorecard_already_submitted`), and a resubmission
  with different scores never changes the immutable, already-submitted
  result.
- **Idempotent final submission**: `golden_box_scorecards.idempotency_key`
  is a real UNIQUE index; a retried submit with the same key returns
  the same real row, never a duplicate.
- **One original scorecard per judge per entry**: enforced by the
  partial unique index `idx_gbsc_one_original_per_judge_entry ON
  golden_box_scorecards (entry_id, judge_id) WHERE amended_from IS
  NULL` (migration 103) — closes a real NULL-uniqueness race found and
  fixed this pass (see `SMOKECRAFT_SYSTEM_DEFECT_REGISTER.md`, SC-D060).
- **Amendment**: a locked scorecard's real correction goes through
  `amendScorecard()`, which creates a new row with `amended_from` set
  to the original — the original scorecard is never mutated.

## Canonical events

`golden_box_judge_assigned`, `golden_box_scorecard_draft_saved`,
`golden_box_scorecard_submitted`, `golden_box_entry_scored` — all
recorded via the existing `smokecraft_progression_events` log
(`goldenBoxEventService.js`), keyed by the judge's own identity
(`guestReference: user:${judgeUserId}`) since these describe judging
activity, not learner progress.

## Results aggregation and final ranking (Holistic Fix 5C-2B-1)

### Eligibility

An entry enters final ranking only when: it has a real submission
(`golden_box_submissions` row), it was never withdrawn or
disqualified, it has at least one judge assignment, every assigned
judge has a completed (`submitted`/`locked`) scorecard, and every
counted scorecard was scored under the currently active rubric
version. An entry missing any of the above is returned as an honest
pending state (`awaiting_submission`, `awaiting_judges`,
`judging_in_progress`, or `rubric_version_mismatch`) — never silently
treated as scored or averaged with a zero.

### Aggregation

For each eligible entry, computed server-side from every judge's
LATEST scorecard (an amendment supersedes the scorecard it was
amended from — never double-counted): judge count, completed
scorecard count, average weighted score, per-criterion averages,
minimum/maximum judge score, and population variance of judges'
weighted totals.

### Deterministic tie-break — rule version 1

1. Higher final weighted score (average of judges' weighted totals)
2. Higher `construction` criterion average
3. Higher `aroma` criterion average (its own approved label is "Aroma
   (Blend)" — the blend-quality measure)
4. Higher `rule_compliance` criterion average (its own approved label
   is "Presentation (Rule Compliance)")
5. Lower score variance (more consistent judging preferred)
6. Earlier valid final submission timestamp (`golden_box_entries.submitted_at`)
7. Stable entry ID ordering — the final, deterministic fallback

The rule version used (`RESULT_TIE_BREAK_RULE_VERSION`) is recorded on
every finalized result and canonical event.

### Finalization

Authorized staff only (`requireRole('admin')`). Atomic — every ranked
entry's result row is written inside a single transaction. Idempotent
— `golden_box_result_finalizations` has a real
`UNIQUE(competition_id, result_version)` constraint plus an
`idempotency_key`; a repeated finalize call for the same
(competition, result_version) returns the ORIGINAL finalized result,
never a recomputation. Blocked (`409 judging_incomplete`) while any
entry with real judge assignments is still genuinely mid-judging — an
entry with zero assignments never blocks finalization of the entries
that were actually judged. Once finalized, a `golden_box_results` row
is immutable and is the ONLY thing every caller (including admins)
sees for that competition going forward — never a freshly recomputed
live view that could drift from what was actually finalized.

## Award issuance (Holistic Fix 5C-2B-2)

### Approved award types

`first_place` / `second_place` / `third_place` — objective descriptors
of an entry's real, immutable placement (`golden_box_results.placement`
from the 5C-2B-1 finalized ranking), never invented content. Rule:
`golden_box_placement_award` v1. No award record beyond third place
exists (no approved "finalist"/"participation" reward content was
ever defined anywhere in this codebase, despite `golden_box_entries.status`
having a `finalist` value — that status field belongs to the entry
lifecycle, not to this award pipeline, and is left untouched here).

### XP, badge, and Passport stamp — documented gap

`xp_award_rules` (provisioned since migration 077) has never been
seeded with a `golden_box` row; no golden-box badge catalog entry or
Passport stamp catalog entry exists. These three reward types are
therefore genuinely unavailable today (`xp_status`/`badge_status`/
`passport_stamp_status = 'unavailable'` on every award record) — never
fabricated. The moment a real rule/catalog entry exists, the same
`awardsService.issueAwards()` grants it through the canonical
`xpService.awardXp()` / `rewardsIntegrationService.grantBadge()` /
`passport360SmokeCraftPersistenceService.awardPassportStampLive()` —
no new reward mechanism was created.

### Issuance

Authorized staff only. Requires an existing finalized result for the
requested result version (`409 finalized_result_required` otherwise).
Atomic and database-enforced idempotent
(`golden_box_award_issuances` `UNIQUE(competition_id, result_version)`
+ idempotency key) — a repeated issuance request for the same
finalized result version returns the ORIGINAL issuance, never
recomputes or duplicates.

## Explicitly out of scope for this pass

The competition leaderboard beyond the finalized ranking already
completed, and Venue Humidor, are not built here.
