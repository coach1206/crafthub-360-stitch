# Migration 077 Safety Review

## Corrected object count (finding from this review)

The Package 1 completion report stated "22 new tables + 1 view." Direct
inspection (`grep -c "^CREATE TABLE" 077_golden_box_foundation.sql`)
shows **23 new tables** (20 `golden_box_*` + 3 `xp_*`) **+ 1 view**
(`golden_box_blends`). The prior count was wrong; corrected in
`07-PACKAGE-1-COMPLETION-REPORT.md`. This review does not treat the
migration as safe merely because it ran successfully — every table
below was individually inspected for constraints/FKs/scope/duplication
risk.

## XP tables (3)

| Table | PK | FKs | Unique | Check | Indexes | Delete behavior | Scope | Auditable | Privacy | Required? | Duplicates? | Rollback risk |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `xp_accounts` | `id` | none | partial-unique on `user_id`/`guest_reference` (one row per identity) | `balance>=0`, identity-required | 2 unique | n/a | user/guest | Indirectly via transactions | Low | Yes (Decision 5) | No — first normalized XP table | Low, empty on rollback unless XP awarded |
| `xp_award_rules` | `id` | none | `rule_key` | `source_type` enum | none extra | n/a | global | n/a | Low | Yes | No | Low, no seed rows |
| `xp_transactions` | `id` | `xp_account_id→xp_accounts CASCADE`, `award_rule_key→xp_award_rules`, `venue_id→venues SET NULL`, `reversal_of→self` | `idempotency_key` (the actual dedup mechanism) | `source_type` enum | 1 | Trigger-blocked (append-only) | user/guest/venue | Yes, itself is the audit trail | Low | Yes | No | **Medium** — real award data would be lost on rollback; documented in `06-ROLLBACK-PLAN.md` |

## Competition/scope/round tables (3)

| Table | PK | FKs | Unique | Check | Indexes | Delete behavior | Scope | Auditable | Privacy | Required? | Duplicates? | Rollback risk |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `golden_box_competitions` | `id` | `scope_venue_id→venues SET NULL` | `competition_key` | `scope` enum (5 values), `chk_gbc_scope_venue` (venue scope requires venue id) | 2 | n/a | global/venue/cohort/event/private | Via `golden_box_activity_log` | Low | Yes | No — new domain | Low if no entries exist yet |
| `golden_box_competition_invitations` | `id` | `competition_id→competitions CASCADE` | none | identity-required | 1 | Cascades with competition | private_invitation scope | Via activity log | Low | Yes (Decision 2) | No | Low |
| `golden_box_rounds` | `id` | `competition_id→competitions CASCADE` | `(competition_id, round_number)` | `round_number>0` | none extra | Cascades | competition | Via activity log | Low | Yes (mandate's proposed entity list) | No | Low |

## Eligibility tables (2)

| Table | PK | FKs | Unique | Check | Indexes | Delete behavior | Scope | Auditable | Privacy | Required? | Duplicates? | Rollback risk |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `golden_box_eligibility_rules` | `id` | `competition_id→competitions CASCADE` | none | `rule_type` enum (9 values) | 1 | Cascades | competition | Via activity log | Low | Yes (Step 7) | No | Low |
| `golden_box_eligibility_results` | `id` | `competition_id→competitions CASCADE`, `eligibility_rule_id→rules SET NULL` | none | `result` enum, identity-required | 1 | Cascades/SET NULL | user/guest | Self-auditing (persists reason+timestamp) | Low-medium (`source_snapshot` JSONB — no free-text PII by construction) | Yes | No | Low |

## Entry/version/blend tables (4 + 1 view)

| Table | PK | FKs | Unique | Check | Indexes | Delete behavior | Scope | Auditable | Privacy | Required? | Duplicates? | Rollback risk |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `golden_box_entries` | `id` (+`entry_id UUID` public key) | `competition_id CASCADE`, `round_id SET NULL` | `(competition_id, guest_reference)` — max-1-entry enforcement, `entry_id` | `status` enum (12 values), `current_version>0` | 2 | Cascades | user/guest | Via activity log | **High** (cigar_name, entrant identity) | Yes | No | **Medium** — real entrant data |
| `golden_box_entry_versions` | `id` | `entry_id→entries CASCADE` | `(entry_id, version_number)` | `version_number>0` | none extra | Cascades | entry | Via activity log | **High** (`presentation_payload`, `pairing_defense` free text) | Yes | No | **Medium** |
| `golden_box_blend_components` | `id` | `entry_version_id CASCADE` | none | `component_type` enum (21 values) | 1 | Cascades | entry version | Via activity log | **High** (the actual recipe) | Yes | No — 21-category coverage matches the mandate's Step 9 list exactly, no overlap with any existing table | **Medium** |
| `golden_box_blends` (VIEW) | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | Same as `entry_versions` | Yes, per mandate's named-entity list | **Deliberately not a table** — avoids storing the same data twice | None (view, no data of its own) |
| `golden_box_submissions` | `id` | `entry_id CASCADE`, `entry_version_id RESTRICT` | `entry_id` (one submission record per entry) | `validation_passed` boolean | none extra | Cascades/Restrict | entry | Yes (`validation_errors` JSONB) | Medium | Yes (Step 8) | No | Low |

## Component catalog (1)

| Table | PK | FKs | Unique | Check | Required? | Duplicates? |
|---|---|---|---|---|---|---|
| `golden_box_component_catalog` | `id` | none | `(component_type, component_key)` | none extra | Yes (Step 9, "curated platform content" requirement) | No — no existing tobacco-component catalog exists anywhere in this codebase (confirmed Package 0 audit) |

## Judging tables (4)

| Table | PK | FKs | Unique | Check | Delete behavior | Scope | Privacy | Rollback risk |
|---|---|---|---|---|---|---|---|---|
| `golden_box_judges` | `id` | none | `user_id` | none extra | n/a | global judge roster | Low | Low |
| `golden_box_judge_assignments` | `id` | `competition_id CASCADE`, `judge_id CASCADE`, `entry_id CASCADE` | `(judge_id, entry_id)` | none extra | Cascades | competition/entry | Low-medium (reveals who judges what) | Low |
| `golden_box_scorecards` | `id` | `entry_id CASCADE`, `judge_id CASCADE`, `amended_from→self` | `(entry_id, judge_id, amended_from)` | `status` enum (5 values) | Cascades | entry/judge | Medium | Medium |
| `golden_box_scores` | `id` | `scorecard_id CASCADE` | none | `scorer_type` enum (**excludes any AI value — structural enforcement of Decision 3**), `chk_gbs_score_range` | Cascades | scorecard | Medium (judge comments) | Medium |

## AI-analysis / feedback tables (2)

| Table | PK | FKs | Check | Privacy | Required? | Duplicates official scoring? |
|---|---|---|---|---|---|---|
| `golden_box_ai_analyses` | `id` | `entry_id CASCADE` | `analysis_type` enum (9), `visibility` enum, `human_review_status` enum, `status` enum (6, includes `not_configured`) | Medium | Yes (Step 11) | **No — structurally cannot**, no FK path into `golden_box_scores` |
| `golden_box_feedback` | `id` | `entry_id CASCADE` | `author_type` enum, `visibility` enum | Medium | Yes | No |

## Results/rewards/visibility/activity tables (4)

| Table | PK | FKs | Unique | Check | Privacy | Required? | Rollback risk |
|---|---|---|---|---|---|---|---|
| `golden_box_results` | `id` | `competition_id CASCADE`, `entry_id CASCADE` | `(competition_id, entry_id)` | none extra | Medium (score visible pre-close to admins only, enforced at app layer) | Yes (Step 3/mandate list) | Medium |
| `golden_box_rewards` | `id` | `entry_id CASCADE` | `(entry_id, reward_type)` — **the actual duplicate-reward guard** | `reward_type` enum (4) | Low | Yes | Low |
| `golden_box_visibility_rules` | `id` | `entry_id CASCADE` | `(entry_id, viewer_role)` | `viewer_role` enum (8) | Low (booleans only) | Yes (Step 5) | Low |
| `golden_box_activity_log` | `id` | `entry_id SET NULL`, `competition_id SET NULL` | none | none extra | Append-only (trigger) | Low-medium | Yes (Step 3/13) | **Medium** — real audit history lost on rollback |

## Existing-table alterations — see `10-PACKAGE-1-API-SERVICE-TEST-INVENTORY.md`'s sibling review

Detailed separately per Step 5 of the review request — see the
dedicated section in this same document below rather than a duplicate
file, since Step 5's content is small enough not to warrant its own
file (disclosed consolidation).

### `smoke_leaderboard_entries` alteration detail

- **3 columns added**: `category TEXT NOT NULL DEFAULT 'smokecraft_session'`,
  `participant_ref TEXT` (nullable), `metadata JSONB` (nullable).
- **1 constraint relaxed**: `smoke_session_id` NOT NULL → nullable.
- **How Golden Box uses them**: `rewardsIntegrationService.publishToLeaderboard`
  inserts `category='golden_box'`, `participant_ref=<guest_reference>`,
  `smoke_session_id=NULL` (no smoke_sessions row exists for a Golden Box
  result), `metadata={competitionId, entryId}`.
- **Existing rows remain valid?** Yes — `category` defaults to
  `'smokecraft_session'` for every pre-existing row (verified: the
  `DEFAULT` applies to existing rows on `ADD COLUMN`, confirmed by
  Postgres semantics and not further tested live this pass since no
  pre-existing `smoke_leaderboard_entries` rows exist in the disposable
  test databases used — **flagged**: not verified against a database
  with real pre-existing leaderboard rows, since none exist in this
  session's disposable test environments).
- **Existing reads remain compatible?** Yes — no column was removed or
  retyped, only added (nullable or defaulted) and one constraint
  loosened (relaxing NOT NULL never breaks an existing read).
- **Could the relaxation permit invalid non-Golden-Box records?**
  Technically yes — any future insert with `smoke_session_id=NULL` and
  `category != 'golden_box'` would not be structurally rejected. **A
  narrower constraint would be safer**: e.g.
  `CHECK (smoke_session_id IS NOT NULL OR category = 'golden_box')`.
  This was not added during Package 1 (an omission, not a deliberate
  choice) — **flagged as a follow-up recommendation**, not blocking,
  since no such invalid insert path exists in current application code.

### `audit_logs` alteration detail

- **Previous constraint**: `action_category` CHECK limited to 15 named
  values (migration 010).
- **Added value**: `'GOLDEN_BOX'` (16th value).
- **Existing inserts remain compatible?** Yes — the constraint was
  dropped and recreated with all 15 original values plus the new one;
  no existing value was removed.
- **Does any code assume a closed 15-value list?** Searched
  `action_category` usage across `server/` — only `roleMiddleware.js`'s
  `auditAction(category, ...)` passes the category through as a string
  parameter to the INSERT; no code enumerates or switches on the full
  value set. No assumption-of-closed-list risk found.
- **Rollback risk if Golden Box audit rows exist**: restoring the
  original 15-value constraint would fail with a constraint-violation
  error on any existing `'GOLDEN_BOX'` row — documented explicitly in
  `06-ROLLBACK-PLAN.md` as a required precondition (delete/migrate those
  rows first, or accept the same data-loss profile as `xp_transactions`/
  `golden_box_activity_log`).

## Overall migration safety verdict

No unexplained duplicate structures found. Every table maps to a named
entity in the approved `07-PACKAGE-1-GOLDEN-BOX-CONTRACT.md` (Package 0)
or a directly-required supporting structure (indexes, the append-only
triggers). The one real risk identified this review — the loosened
`smoke_leaderboard_entries.smoke_session_id` constraint lacking a
compensating CHECK — is disclosed as a follow-up, not a blocker, since
no current code path can trigger it incorrectly.
