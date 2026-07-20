# SmokeCraft Management Sync — Package A Implementation (Database Foundation)

## Phase 1 — Reconciled approved schema (final, as implemented)

Reconciled against all 8 named documents. No material conflicts were
found between them — the Package A Readiness doc's two corrections
(soft `user_id`, deferred `venue_insights`) were already the governing
decisions carried into this implementation; nothing else diverged.

### `smokecraft_management_sync_journeys`
PK `journey_id UUID DEFAULT gen_random_uuid()`. Columns: `tenant_id TEXT
NOT NULL`, `venue_id TEXT NOT NULL REFERENCES venues(venue_id) ON DELETE
RESTRICT`, `user_id TEXT` (nullable, no FK — deferred), `guest_reference
TEXT NOT NULL`, `session_number SMALLINT NOT NULL CHECK (1-27)`, `phase
TEXT NOT NULL`, `status TEXT NOT NULL DEFAULT 'in_progress' CHECK
(in_progress/completed/abandoned)`, `started_at/completed_at
TIMESTAMPTZ`, `source_version TEXT NOT NULL`, `created_at/updated_at
TIMESTAMPTZ DEFAULT NOW()`. Indexes: venue+status, user, guest_reference.
No JSONB, no privacy-sensitive fields. Rollback order: 4th (last, most
depended-upon).

### `smokecraft_management_sync_snapshots`
PK `snapshot_id UUID`. FK `journey_id → journeys(journey_id) ON DELETE
CASCADE`. `snapshot_version INTEGER DEFAULT 1`, 6 JSONB fields
(`cigar_selection`, `pairing_selection`, `flavor_notes`,
`mentor_selections`, `scorecard`, `passport_state`), `rating SMALLINT
CHECK (1-5)`, `preferences JSONB`, `feedback_text TEXT` (privacy-
sensitive, never exposed in venue aggregates), `return_intent TEXT CHECK
(yes/no/maybe)`, `connections_saved SMALLINT DEFAULT 0`,
`completion_state TEXT NOT NULL`, `staff_handoff_requested BOOLEAN
DEFAULT FALSE`, `payload_hash TEXT NOT NULL`, `created_at TIMESTAMPTZ`.
Unique: `(journey_id, snapshot_version)`, `(journey_id, payload_hash)`.
Rollback order: 3rd.

### `smokecraft_management_sync_events`
PK `event_id UUID`. FKs: `journey_id → journeys ON DELETE CASCADE`,
`snapshot_id → snapshots ON DELETE RESTRICT`, `venue_id → venues(venue_id)
ON DELETE RESTRICT`. `guest_reference TEXT NOT NULL`, `destination TEXT
CHECK (6 values)`, `status TEXT DEFAULT 'pending' CHECK
(pending/completed/failed)`, `idempotency_key TEXT NOT NULL`,
`payload_version INTEGER NOT NULL`, `created_at/started_at/completed_at
TIMESTAMPTZ`, `error_code/error_message TEXT`, `retry_count SMALLINT
DEFAULT 0`, `audit_metadata JSONB`. **Idempotency unique constraint**:
`(venue_id, journey_id, destination, payload_version)`. Rollback order:
2nd.

### `smokecraft_management_sync_actions`
PK `action_id UUID`. FKs: `venue_id → venues(venue_id) ON DELETE
RESTRICT`, `journey_id → journeys ON DELETE SET NULL` (nullable),
`sync_event_id → events ON DELETE SET NULL` (nullable). `actor_user_id
TEXT NOT NULL` (soft, no FK — deferred, same reason as `journeys.user_id`),
`action_type TEXT CHECK (6 values)`, `action_status TEXT DEFAULT
'completed' CHECK (completed/failed)`, `metadata JSONB`, `created_at
TIMESTAMPTZ`. Rollback order: 1st (dropped first, depends on the other 3).

`venue_insights` remains explicitly **not built** in Package A, per the
approved on-demand-first decision.

## Phase 2-3 — implementation notes

Table names, columns, and constraints match the reconciled schema above
exactly. All 4 tables use `CREATE TABLE IF NOT EXISTS`, matching every
existing migration in this repo. No existing table was altered, renamed,
or had records deleted. No production sample data, seed journeys, or
fake venue records were inserted into the actual migration file — the
one test venue row used during Phase 7 testing was inserted and deleted
entirely within the isolated test database (see the Test Report), never
touching a shared/production database.

## Phase 4 — pre-migration foreign-key validation (real, run before writing SQL)

Confirmed against a live database instance (see Test Report for
environment detail): `venues` exists; `venues.venue_id` exists and is
`UNIQUE` (constraint `venues_venue_id_key`); no table-name collision for
any of the 4 new names; no index-name collision; no constraint-name
collision; `schema_migrations` contained zero rows for `074_...` before
the run; no other file in `server/db/migrations/` uses number 074; none
of the 4 table names pre-existed under another name.

## Result

Migration created at `server/db/migrations/074_smokecraft_management_sync.sql`,
applied successfully, fully validated (see the Schema Report and Test
Report), and rollback-tested. See `SMOKECRAFT_MANAGEMENT_SYNC_PACKAGE_B_HANDOFF.md`
for what Package B must build next.
