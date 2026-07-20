# Rollback Plan — Package 1

## Migration rollback (`077_golden_box_foundation.sql`)

In reverse dependency order:

```sql
DROP VIEW IF EXISTS golden_box_blends;
DROP TABLE IF EXISTS golden_box_activity_log;
DROP TABLE IF EXISTS golden_box_visibility_rules;
DROP TABLE IF EXISTS golden_box_rewards;
DROP TABLE IF EXISTS golden_box_results;
DROP TABLE IF EXISTS golden_box_feedback;
DROP TABLE IF EXISTS golden_box_ai_analyses;
DROP TABLE IF EXISTS golden_box_scores;
DROP TABLE IF EXISTS golden_box_scorecards;
DROP TABLE IF EXISTS golden_box_judge_assignments;
DROP TABLE IF EXISTS golden_box_judges;
DROP TABLE IF EXISTS golden_box_component_catalog;
DROP TABLE IF EXISTS golden_box_submissions;
DROP TABLE IF EXISTS golden_box_blend_components;
DROP TABLE IF EXISTS golden_box_entry_versions;
DROP TABLE IF EXISTS golden_box_entries;
DROP TABLE IF EXISTS golden_box_eligibility_results;
DROP TABLE IF EXISTS golden_box_eligibility_rules;
DROP TABLE IF EXISTS golden_box_rounds;
DROP TABLE IF EXISTS golden_box_competition_invitations;
DROP TABLE IF EXISTS golden_box_competitions;
DROP TABLE IF EXISTS xp_transactions;
DROP TABLE IF EXISTS xp_award_rules;
DROP TABLE IF EXISTS xp_accounts;

-- Leaderboard integration columns (only if fully reverting):
ALTER TABLE smoke_leaderboard_entries DROP COLUMN IF EXISTS metadata;
ALTER TABLE smoke_leaderboard_entries DROP COLUMN IF EXISTS participant_ref;
ALTER TABLE smoke_leaderboard_entries DROP COLUMN IF EXISTS category;
-- smoke_session_id NOT NULL is intentionally NOT restored automatically —
-- if any Golden Box rows were inserted with a null smoke_session_id,
-- restoring NOT NULL would fail until those rows are removed first.

-- Audit category (restore the pre-Package-1 constraint):
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_action_category_check;
ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_action_category_check
  CHECK (action_category IN (
    'AUTH','ROLE','ADMIN','POS','EAT','INVENTORY','TICKER','PAYMENT',
    'DEVELOPER','FOUNDER','MENTOR','PASSPORT_CONNECTION','VENUE',
    'SYSTEM_SETTINGS','FEATURE_FLAGS'
  ));
```

This repo's migration runner does not currently execute rollback SQL
automatically (no `down` migration convention found elsewhere in
`server/db/migrations/`) — the above is a documented manual script,
consistent with how Package A's and Venue Management 6A's rollback plans
were also written as manual, reviewed SQL rather than an automated
`db:rollback` command.

## Application-code rollback

Delete: `server/services/goldenBox/*`,
`server/controllers/goldenBoxController.js`,
`server/routes/goldenBoxRoutes.js`, `verify-golden-box-package-1.mjs`.
Revert the two additive lines in `server/index.js` (import + `app.use`).
No frontend files were created or modified this package (disclosed —
Step 15's minimal frontend foundation was not built this pass, see
`07-PACKAGE-1-COMPLETION-REPORT.md` known limitations).

## Blast radius if rolled back

Zero impact on any other module — every table is new, the one
integration change (`smoke_leaderboard_entries` additive columns) is
backward-compatible with existing rows, and the `audit_logs` CHECK
constraint change only adds a value (removing it does not affect any
pre-existing audit row, since no pre-Package-1 code ever wrote
`'GOLDEN_BOX'`).
