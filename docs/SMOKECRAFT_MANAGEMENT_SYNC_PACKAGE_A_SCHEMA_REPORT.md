# SmokeCraft Management Sync — Package A Schema Report (Real Database Metadata)

Generated from live PostgreSQL `information_schema`/`pg_catalog` queries
against a real, isolated local test database — not from reading the
migration file's text. See the Test Report for environment detail.

## Tables created (4/4)

```
smokecraft_management_sync_actions
smokecraft_management_sync_events
smokecraft_management_sync_journeys
smokecraft_management_sync_snapshots
```
(`public/proof/smokecraft-management-sync-package-a/tables-created.txt`)

## Foreign keys (8, all confirmed via `information_schema.table_constraints`)

| Table | Column | References |
|---|---|---|
| `smokecraft_management_sync_journeys` | `venue_id` | `venues(venue_id)` |
| `smokecraft_management_sync_snapshots` | `journey_id` | `smokecraft_management_sync_journeys(journey_id)` |
| `smokecraft_management_sync_events` | `venue_id` | `venues(venue_id)` |
| `smokecraft_management_sync_events` | `journey_id` | `smokecraft_management_sync_journeys(journey_id)` |
| `smokecraft_management_sync_events` | `snapshot_id` | `smokecraft_management_sync_snapshots(snapshot_id)` |
| `smokecraft_management_sync_actions` | `venue_id` | `venues(venue_id)` |
| `smokecraft_management_sync_actions` | `journey_id` | `smokecraft_management_sync_journeys(journey_id)` |
| `smokecraft_management_sync_actions` | `sync_event_id` | `smokecraft_management_sync_events(event_id)` |

(`public/proof/smokecraft-management-sync-package-a/foreign-keys.txt`)

## Indexes (15)

11 explicit `idx_*` indexes + 4 automatic unique-constraint-backing
indexes. Full list in
`public/proof/smokecraft-management-sync-package-a/indexes.txt`.

## Constraints (23 total: 4 PK, 8 FK, 4 UNIQUE, 9 CHECK)

Includes the required idempotency constraint
`uq_sms_events_idempotency` on `(venue_id, journey_id, destination,
payload_version)`, confirmed present via `pg_constraint` (type `u`).
Full list in `public/proof/smokecraft-management-sync-package-a/constraints.txt`.

## Migration tracking

`schema_migrations` contains exactly one row for
`074_smokecraft_management_sync.sql`, confirmed via direct `SELECT`
(`public/proof/smokecraft-management-sync-package-a/schema-migrations-record.txt`).

## Unrelated tables

`venues`, `venue_memberships`, `ticket_tapper_promotions`,
`passport_360_guest_profiles`, `eat_management_sync_events` all confirmed
still present and unmodified after the migration
(`public/proof/smokecraft-management-sync-package-a/unrelated-tables-unchanged.txt`).
Total `public` schema table count was identical before and after a test
`DROP`+`ROLLBACK` cycle (982 tables both times), confirming transactional
isolation.
