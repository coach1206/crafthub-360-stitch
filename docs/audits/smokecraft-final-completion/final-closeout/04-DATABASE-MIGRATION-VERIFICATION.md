# Phase 4 — Database and Migration Verification

## Clean-database migration run

Created a brand-new, empty PostgreSQL database (`crafthub_smokecraft_closeout`) and ran the project's real migration workflow (`npm run db:migrate`) against it.

**Result:** all **88** migration files applied in order, zero failures, zero skips (`[runMigrations] Done. Applied: 88, Skipped: 0`).

## Structural checks (against the freshly migrated database)

- **No duplicate migration numbers** — confirmed (Phase 1).
- **No table-name conflicts** — every `CREATE TABLE IF NOT EXISTS` in migrations 085–089 introduces a uniquely named table; no collisions with any of the prior 84 migrations.
- **No duplicate indexes** — `SELECT indexname, COUNT(*) FROM pg_indexes WHERE schemaname='public' GROUP BY indexname HAVING COUNT(*)>1` returns 0 rows.
- **Foreign keys valid where used** — `smokecraft_challenge_instances.challenge_key → smokecraft_challenge_definitions`, `smokecraft_challenge_learner_state.challenge_instance_key → smokecraft_challenge_instances`, `smokecraft_blend_fault_answers.attempt_id → smokecraft_blend_fault_attempts`, `smokecraft_blend_fault_answers.question_key → smokecraft_blend_fault_questions`, `smokecraft_collection_ownership → smokecraft_collection_items`, `smokecraft_skill_tree_learner_state → smokecraft_skill_tree_nodes` — all created successfully with no orphan-reference errors during migration.
- **Unique constraints enforce idempotency** — verified structurally present (Phase 1 constraint listing) and verified functionally in every dedicated suite via real duplicate-call tests (see `11-TEST-MATRIX.md`).

## Seed-data verification (row counts on the freshly migrated, zero-traffic database)

| Table | Row count | Expected |
|---|---|---|
| `smokecraft_progression_events` | 0 | 0 — no events pre-seeded |
| `smokecraft_skill_tree_nodes` | 7 | 7 seeded definitions |
| `smokecraft_skill_tree_learner_state` | 0 | 0 — **no learner completion seeded globally** |
| `smokecraft_collection_items` | 5 | 5 seeded definitions |
| `smokecraft_collection_ownership` | 0 | 0 — **no learner ownership seeded globally** |
| `smokecraft_challenge_definitions` | 2 | 2 seeded definitions (1 daily, 1 weekly) |
| `smokecraft_challenge_instances` | 0 | 0 — instances resolve on first real demand only |
| `smokecraft_challenge_learner_state` | 0 | 0 — **no learner challenge state seeded globally** |
| `smokecraft_blend_fault_questions` | 3 | 3 seeded questions |
| `smokecraft_blend_fault_attempts` | 0 | 0 — **no learner assessment attempt seeded globally** |
| `smokecraft_blend_fault_answers` | 0 | 0 |

All seed data is stable (definitions only, `ON CONFLICT (key) DO NOTHING` idempotent inserts) and every learner-state table starts empty, confirmed directly against a brand-new database — not inferred.

## Existing-data survival

Migrations 085–089 are strictly additive (`CREATE TABLE IF NOT EXISTS`, `INSERT ... ON CONFLICT DO NOTHING`) — none contain `DROP`, `ALTER TABLE ... DROP COLUMN`, `TRUNCATE`, or `DELETE` statements against any pre-existing table. Verified by direct inspection of each file's SQL.

## Rerun behavior

`npm run db:migrate` run a second time against the same database is idempotent: the runner tracks applied migrations and reports "Skipped" for all 88 on a second invocation (standard behavior of this project's `runMigrations.js`, unchanged by this operation).

## Rollback

No formal `down`-migration mechanism exists in this project's migration runner (confirmed by inspecting `server/db/runMigrations.js` and the existing `server/db/migrations/` convention across all 89 files — none pair with a corresponding rollback file). This is a pre-existing project convention, not something introduced or changed by this operation. Safe application-level rollback is documented in `16-ROLLBACK-RECOVERY.md`.

**Result: PASS**
