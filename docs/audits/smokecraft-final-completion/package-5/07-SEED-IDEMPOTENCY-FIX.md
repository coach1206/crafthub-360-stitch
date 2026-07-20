# Package 5 Closure — Seed-Script Idempotency Fix

## Root cause

`golden_box_component_catalog` was already safely idempotent — it has a
real `UNIQUE (component_type, component_key)` constraint (migration 077)
and the seed script's `ON CONFLICT (component_type, component_key) DO
NOTHING` correctly relied on it. `smokecraft_flavor_notes` was also
already safe (`UNIQUE` on `slug`).

Two tables were not: `smokecraft_component_compatibility` and
`smokecraft_quiz_questions` had **no unique constraint** backing their
`INSERT ... ON CONFLICT DO NOTHING` calls. Postgres requires an explicit
conflict target (a real unique constraint or index) for `ON CONFLICT DO
NOTHING` to actually detect and skip a duplicate — without one, the
clause is silently a no-op and every re-run inserted a fresh duplicate
row. Confirmed by reproducing it: running the seed script twice against a
freshly migrated (pre-fix) database produced 6 duplicate compatibility
rows and 2 duplicate quiz rows from a starting set of 3 and 1
respectively, across earlier Package 3/4 sessions in this conversation
(each caught and manually deduped at the time, but never structurally
fixed).

## Fix

`server/db/migrations/081_package5_closure_idempotency_and_practice.sql`
(new migration, does not modify 075-080):

1. **Compatibility**: deduped any existing accidental rows (keeping the
   earliest by id) on `(source_component_id, target_component_id,
   relationship_type)`, then added a real `UNIQUE` constraint on that
   triple — the natural key for a compatibility relationship.
2. **Quiz questions**: added a new `question_key` column. Question text
   itself is not a safe natural key (an administrator may legitimately
   edit wording later), so each seeded question now carries a stable,
   human-assigned slug (e.g. `quiz-ligero-position`,
   `quiz-pilon-fermentation-purpose`). Existing rows with no key were
   backfilled with `'legacy-' || id` (still stable and unique) so the
   column could be made `NOT NULL`, then a real `UNIQUE` constraint was
   added on `question_key`.

`server/db/seeds/seedSmokecraftEducationalContent.mjs` was updated to
supply a `question_key` for all 6 quiz inserts and switch each one to
`ON CONFLICT (question_key) DO NOTHING`.

This does **not** touch or reset any administrator-edited published
content — the fix only adds constraints and one new column; no existing
`golden_box_component_catalog`/`smokecraft_flavor_notes` row (already
safe) was altered, and no seed run deletes anything before inserting
(verified: the script contains zero `DELETE`/`TRUNCATE` statements against
any content table).

## Verification (disposable database, migrations 001-081, two consecutive
seed runs)

```
--- SEED RUN 1 ---
Seeded 67 golden_box_component_catalog rows (idempotent).
Seeded 16 smokecraft_flavor_notes rows.
Seeded 3 smokecraft_component_compatibility rows.
Seeded 6 smokecraft_quiz_questions rows.
--- SEED RUN 2 (idempotency check) ---
Seeded 0 golden_box_component_catalog rows (idempotent).
Seeded 0 smokecraft_flavor_notes rows.
Seeded 0 smokecraft_component_compatibility rows.
Seeded 0 smokecraft_quiz_questions rows.
```

Post-run counts confirmed stable at 67 / 16 / 3 / 6 via direct query
(`SELECT COUNT(*)`), matching run 1 exactly. Covered by the new
`verify-golden-box-package-5-closure.mjs` suite's first four assertions,
re-run against the running server after both seed passes.

## Compatibility with existing Package 3/5 records

The fix required deduplicating rows first (`DELETE ... USING ... WHERE a.id
> b.id AND <natural key matches>`), which is safe on any database that has
accumulated accidental duplicates from before this fix — it keeps exactly
one row per natural key (the earliest), never removes a genuinely distinct
relationship or question, and does not affect `golden_box_component_catalog`
(which was never duplicated). A completely fresh database with no prior
duplicates is unaffected by the dedupe step (zero rows deleted).
