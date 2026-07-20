# SmokeCraft Management Sync — Package A Rollback

## Tested (isolated test database, not production)

```sql
DROP TABLE IF EXISTS smokecraft_management_sync_actions;
DROP TABLE IF EXISTS smokecraft_management_sync_events;
DROP TABLE IF EXISTS smokecraft_management_sync_snapshots;
DROP TABLE IF EXISTS smokecraft_management_sync_journeys;
DELETE FROM schema_migrations WHERE filename = '074_smokecraft_management_sync.sql';
```

Run twice this pass:
1. Inside `BEGIN;...ROLLBACK;` to prove the drop sequence is syntactically
   correct and reversible without committing — table count unchanged
   (982 before/after).
2. For real (committed), in the same disposable test database, to prove
   the drop actually works: table count for
   `smokecraft_management_sync_*` went from 4 to 0; `venues` (0 rows,
   confirmed still present as a table) and `ticket_tapper_promotions`
   (confirmed still present) were unaffected. Then `npm run db:migrate`
   was re-run and recreated all 4 tables cleanly, proving the migration
   is safe to re-apply after a rollback.

Full output: `public/proof/smokecraft-management-sync-package-a/rollback-test.txt`.

## Manual controlled production rollback procedure (documented, not automated)

**No automatic rollback script exists or was created** — per instruction,
rollback for this platform's migration system is always a manual,
human-run action against the target database:

1. Confirm no Package B code (service/controller/route) is deployed and
   depending on these tables — check before rolling back, since Package
   A's tables have no dependents yet in this repository, this step is
   currently a no-op, but must be re-checked once Package B ships.
2. Connect to the target database with an operator credential (not
   committed anywhere in this repo).
3. Run the 5 statements above, in that exact order (respects FK
   dependency — `actions` first, `journeys` last).
4. Verify: `SELECT COUNT(*) FROM pg_tables WHERE tablename LIKE
   'smokecraft_management_sync%';` returns `0`.
5. Verify: `venues` and every other existing table are unaffected (spot
   check row counts before/after if there is any doubt).
6. If migration 074 should be re-applied later, no code change is
   needed — `npm run db:migrate` will pick it up again automatically
   (it was never deleted from `server/db/migrations/`, only its
   database effect was reversed).

## No-data-loss guarantee

Since Package A's tables are net-new and, before Package B ships, have
no application code writing to them, a rollback at this stage is
guaranteed to lose zero real data — there is no real data in these
tables yet outside of test rows, which are never present in a real
deployment. This guarantee weakens once Package B/C ship and guests
begin creating real journey/snapshot/event rows — at that point,
rollback would destroy real historical sync data, and should not be
undertaken without a separate data-retention decision.
