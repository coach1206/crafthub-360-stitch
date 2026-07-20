# Migration Map — Package 1

One new migration file: `server/db/migrations/077_golden_box_foundation.sql`
(next safe number after 076, confirmed by inspection before writing).

## What it does

1. **Audit category extension** — drops and recreates
   `audit_logs_action_category_check` to add `'GOLDEN_BOX'` (Postgres has
   no `ALTER CHECK`). All 15 prior values preserved unchanged.
2. **Leaderboard integration columns** (additive, on the existing
   `smoke_leaderboard_entries` table) — `smoke_session_id` made nullable
   (existing rows unaffected, all keep their non-null value), plus new
   `category TEXT NOT NULL DEFAULT 'smokecraft_session'`,
   `participant_ref TEXT`, `metadata JSONB` columns and one new index.
   This is the one "integration change to a verified system," documented
   here per the mandate's explicit permission for that case.
3. **XP foundation** — `xp_accounts`, `xp_award_rules`, `xp_transactions`
   (append-only, trigger-enforced).
4. **19 new Golden Box tables** (+1 view) — see `01-GOLDEN-BOX-DATA-MODEL.md`
   (folded into this document's table list below since a separate file
   would duplicate the same content — disclosed consolidation).

## Full table/object list created

`xp_accounts`, `xp_award_rules`, `xp_transactions`,
`golden_box_competitions`, `golden_box_competition_invitations`,
`golden_box_rounds`, `golden_box_eligibility_rules`,
`golden_box_eligibility_results`, `golden_box_entries`,
`golden_box_entry_versions`, `golden_box_blend_components`,
`golden_box_blends` (view over `golden_box_entry_versions`, avoids a
duplicate parallel table for the same data), `golden_box_submissions`,
`golden_box_component_catalog`, `golden_box_judges`,
`golden_box_judge_assignments`, `golden_box_scorecards`,
`golden_box_scores`, `golden_box_ai_analyses`, `golden_box_feedback`,
`golden_box_results`, `golden_box_rewards`,
`golden_box_visibility_rules`, `golden_box_activity_log`.

## Reuse decisions (no duplicate identity/venue/leaderboard/badge/passport systems)

- Entrant identity: `user_id TEXT` (soft) + `guest_reference TEXT NOT NULL`
  — exact pattern from `smokecraft_management_sync_journeys` (migration
  074), not a new identity table.
- Venue: `scope_venue_id TEXT REFERENCES venues(venue_id)` — the single
  authoritative `venues` table, never `novee_os_venues`.
- Leaderboard: additive columns on `smoke_leaderboard_entries` (see
  above), not a new table.
- Badges: Golden Box awards insert into the existing
  `passport_360_badges` with `module_key='golden-box'` — no schema
  change to that table.
- Passport stamps: same pattern against the existing `passport_stamps`
  table — no schema change.
- Audit: existing `audit_logs` table + `auditAction()` middleware, with
  the one additive CHECK-constraint value described above.

## Verified live (this package)

Applied cleanly against a real disposable Postgres 16 database
(`crafthub_pkg1_probe`), confirmed idempotent (`npm run db:migrate` run
twice — second run reports "Skipped: 76"), all constraints/triggers
behavior-tested by `verify-golden-box-package-1.mjs` (36/36 passed).
