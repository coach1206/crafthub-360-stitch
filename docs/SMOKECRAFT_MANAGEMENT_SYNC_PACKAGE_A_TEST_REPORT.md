# SmokeCraft Management Sync — Package A Test Report

## Database environment used for validation

This sandbox environment has no `DATABASE_URL` configured (confirmed —
the app normally runs in prototype/preview-fallback mode). Rather than
skip real database validation, a **PostgreSQL 16 server already
installed in this container** (`postgresql-16`, previously stopped) was
started and used to create a single, disposable, isolated local database
(`crafthub_pkg_a_test`) for this package only. This is not production,
not Railway, and not any externally-reachable database — it is a
same-container, session-local Postgres instance created solely for this
validation and **dropped, with the server stopped, at the end of this
package** (see commands below). No `DATABASE_URL` secret, hostname, or
credential is included in any proof file, per instruction.

All 72 pre-existing migrations (`001` through `073`) were applied first,
via the real, unmodified migration runner (`npm run db:migrate`), to
bring the test database to a realistic state before adding migration
074 — so `venues` and every other referenced table are the actual
production schema, not a hand-built stand-in.

Teardown commands run at the end of this package:
```
DROP DATABASE crafthub_pkg_a_test;
service postgresql stop
```

## Results

1. **Migration 074 discoverable by the runner**: PASS — appeared in
   `runMigrations()`'s file listing and was applied on the next
   `npm run db:migrate` run.
2. **Migration executes successfully**: PASS —
   `public/proof/smokecraft-management-sync-package-a/migration-command-output.txt`.
3. **Re-running the migration does not corrupt schema**: PASS — second
   `npm run db:migrate` run reported `Applied: 0, Skipped: 73` (074
   correctly skipped as already-applied); table/constraint/index counts
   unchanged.
4. **Valid venue-scoped journey insert**: PASS.
5. **Invalid `venue_id` rejected**: PASS — Postgres error code `23503`
   (foreign_key_violation).
6. **Valid snapshot insert**: PASS.
7. **Duplicate snapshot version rejected**: PASS — error code `23505`
   (unique_violation) on `(journey_id, snapshot_version)`.
8. **Valid Management Sync event insert**: PASS.
9. **Duplicate idempotency combination rejected**: PASS — error code
   `23505` on `(venue_id, journey_id, destination, payload_version)`.
10. **Valid management action insert**: PASS.
11. **Invalid status rejected**: PASS — error code `23514`
    (check_violation).
12. **Required ownership fields cannot be omitted**: PASS — omitting
    `venue_id` on a journey insert raised `23502` (not_null_violation).
13. **Foreign-key deletion behavior matches design**: PASS — deleting a
    journey cascade-deleted its snapshots and events (`ON DELETE
    CASCADE`), and set the dependent action's `journey_id` to `NULL`
    (`ON DELETE SET NULL`), exactly as designed.
14. **JSONB fields reject invalid input naturally**: PASS — malformed
    JSON text cast to `::jsonb` raised Postgres error `22P02`
    (invalid_text_representation) without any application-level
    validation code needed.
15. **No table contains seed or fabricated data**: PASS — post-test
    `SELECT COUNT(*) FROM smokecraft_management_sync_journeys` = 0.
16. **No unrelated table modified**: PASS — see Schema Report.
17. **Transaction rollback leaves no partial schema/test data**: PASS —
    verified via a `BEGIN; DROP TABLE...; ROLLBACK;` cycle that left all
    4 tables, all rows, and the total `public` schema table count
    (982) unchanged.
18. **Migration tracking contains exactly one migration-074 record**:
    PASS.

**16/16 assertions passed** in the automated suite
(`verify-smokecraft-management-sync-package-a.mjs`), after one iteration
fixing a test-script bug (an earlier assertion queried by a foreign key
column that had already been nulled by an unrelated cascade, not a
schema defect — corrected to query by `actor_user_id` instead) and
manually clearing leftover rows from that same interrupted first run
before the clean, final run.

## Cleanup confirmation

All test rows (one test venue, its journeys/snapshots/events/actions)
were deleted by the test script itself before the final assertions ran;
`public/proof/smokecraft-management-sync-package-a/test-data-cleanup.txt`
shows `0` rows remaining in `smokecraft_management_sync_journeys`. The
entire test database was additionally dropped at the very end of this
package, so no artifact of this testing persists anywhere.

## Regression suites (frontend, run against the built app — unrelated to the database work)

| Suite | Result |
|---|---|
| `npm run build` | PASS |
| `verify-smokecraft-ticket-tapper-focused-integration.mjs` | 8/8 passed |
| `verify-smokecraft-full-approved-image-reconciliation.mjs` | 33/33 passed |
| `verify-crafthub-approved-image.mjs` | 22/22 passed |
| `verify-smokecraft-start-journey-crafthub-mvp2.mjs` | 18/18 passed |
| `verify-smokecraft-authoritative-sequence.mjs` | 20/20 passed |
| `verify-all-smokecraft-assets.mjs` | 62/62 passed |

Zero new failures. This confirms the database-only nature of Package A —
no frontend behavior changed.
