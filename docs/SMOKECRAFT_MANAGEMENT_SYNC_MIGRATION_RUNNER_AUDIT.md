# SmokeCraft Management Sync — Migration Runner Audit (Part 1)

**BLOCKER 1 RESOLVED: VERIFIED.**

## Exact mechanism

`server/db/runMigrations.js` — a real, complete migration runner (full
file read this pass).

1. **Migration runner file**: `server/db/runMigrations.js`.
2. **Exact command**: `npm run db:migrate` → `node server/db/runMigrations.js`
   (`package.json` `"db:migrate": "node server/db/runMigrations.js"`).
3. **Automatic on server startup?** Not found wired into `server/index.js`'s
   boot sequence in this pass — the script is self-invoking only when run
   directly (`if (resolve(__filename) === resolve(process.argv[1] ?? ''))`
   block at the bottom of the file). **Requires a separate confirmation of
   deploy tooling** (see #4/#12 below) to know if it's called automatically
   during deploy.
4. **Automatic during deploy?** No deploy script (Railway config,
   `Procfile`, CI workflow) was found in this pass that explicitly invokes
   `npm run db:migrate`. **PARTIAL** — the mechanism exists and is safe to
   call, but nothing in the repo proves it currently runs unattended on
   deploy. Treat migration 074 as requiring a manual `npm run db:migrate`
   run against the target database until deploy automation is confirmed
   or added.
5. **Manual execution**: yes, confirmed — `npm run db:migrate`.
6. **Filename order**: yes — `fs.readdirSync(MIGRATIONS_DIR).filter(f =>
   f.endsWith('.sql')).sort()`, alphabetical, which is chronological given
   the zero-padded numeric filename convention (`074_...`).
7. **Migration history table**: yes — `schema_migrations` (`id SERIAL
   PRIMARY KEY, filename TEXT NOT NULL UNIQUE, applied_at TIMESTAMPTZ`),
   created via `ensureMigrationsTable()` on every run.
8. **Transactional**: yes — each migration file runs inside `BEGIN` /
   `COMMIT`, with `ROLLBACK` on any error.
9. **Failed migrations roll back**: yes — confirmed by the `catch` block
   (`ROLLBACK`) and the runner stops (returns `sync_required` with
   `failedOn: filename`) rather than continuing past a failure.
10. **`CREATE TABLE IF NOT EXISTS` relied on instead of migration
    history?** No — both mechanisms are used together: `schema_migrations`
    tracks exactly which files have run (so a file is never re-executed),
    and `CREATE TABLE IF NOT EXISTS` inside each file is a defense-in-depth
    safety net for the case a migration is manually re-run outside the
    tracked path.
11. **Re-running a migration safe?** Yes for the tracked path (already-applied
    filenames are skipped via `schema_migrations`). If a migration file
    were manually executed via raw `psql` (bypassing the runner), the
    `IF NOT EXISTS`/`ON CONFLICT` patterns in the SQL itself make most
    statements idempotent, but this is a secondary safety net, not the
    primary mechanism.
12. **Railway execution**: **BLOCKED** — no Railway-specific config
    (`railway.json`, `nixpacks.toml`, a `start`/`release` command
    referencing `db:migrate`) was found in this pass referencing the
    migration command. `npm run start` (`"start": "npm run build && node
    server/index.js"`) does **not** call `db:migrate`. **This is a real,
    unresolved gap**: unless Railway's deploy configuration separately
    invokes `npm run db:migrate` (not confirmed here), migration 074 will
    not run automatically on a Railway deploy.
13. **Local development execution**: manual only, via `npm run db:migrate`.
14. **Test environments**: not found to run migrations automatically;
    `runMigrations()` gracefully no-ops (`database_required` status) when
    `DATABASE_URL` is unset, which is the local/prototype default.
15. **Evidence**: `server/db/runMigrations.js` (full file),
    `package.json` `db:migrate` script,
    `server/scripts/verifyDatabaseFoundation.js` (imports and calls
    `runMigrations` as part of its own verification, confirming this is
    the actual, exercised runner and not dead code).
16. **Safe procedure for adding migration 074 later**: add
    `server/db/migrations/074_smokecraft_management_sync.sql` following
    the same `CREATE TABLE IF NOT EXISTS` convention, then run `npm run
    db:migrate` against the target database. The runner will pick it up
    automatically (alphabetical/numeric order) and record it in
    `schema_migrations` — no runner code change needed.
17. **Rollback method**: no automated rollback exists in the runner
    itself (it does not support "down" migrations). Rollback is manual:
    run the reverse SQL (`DROP TABLE IF EXISTS ...` per the Migration
    Rollback Plan doc) directly against the database, then optionally
    `DELETE FROM schema_migrations WHERE filename = '074_...'` if the
    migration should be considered un-applied.
18. **Risk of migration 074 not executing in production**: **real and
    current** — since no confirmed automatic-deploy trigger exists (#12),
    the operational risk is that migration 074 (or any future migration)
    could ship in code without ever being run against the production
    database unless a human explicitly runs `npm run db:migrate` post-deploy.
    This is a pre-existing platform gap, not something introduced by
    Management Sync — every migration since at least #010 shares this
    same risk profile.

## Assignment

**VERIFIED** — the runner mechanism itself (file, command, transaction
safety, tracking table) is fully confirmed and safe to use. **PARTIAL**
on the deploy-automation question specifically (#4, #12) — flagged as an
operational gap to close (ideally by wiring `db:migrate` into the deploy
process) rather than a blocker to designing/writing migration 074.
