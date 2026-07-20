# SmokeCraft Management Sync — Database Schema Specification (Phases 3-4)

Design only — **no migration file created this package.** Conventions
follow the real precedent audited in
`SMOKECRAFT_MANAGEMENT_SYNC_BACKEND_ARCHITECTURE.md` §20 (migration 068):
`gen_random_uuid()` UUID PKs, `TIMESTAMPTZ` timestamps, `CHECK`
constraints, `CREATE UNIQUE INDEX` for dedupe/idempotency, raw SQL, no
ORM. Table names are prefixed `smokecraft_management_sync_*` to avoid any
collision with or repurposing of `eat_management_sync_events` (POS/order
scope, confirmed structurally incompatible — not reused).

## A. `smokecraft_management_sync_journeys`

Purpose: authoritative completed-journey identity + completion state.

| Column | Type | Constraint |
|---|---|---|
| `journey_id` | UUID | PK, `DEFAULT gen_random_uuid()` |
| `tenant_id` | TEXT | NOT NULL, no default (reject the migration-068 `DEFAULT 'novee-default'` anti-pattern — caller must always supply it) |
| `venue_id` | TEXT | NOT NULL, **no default** — corrects the `venue_id ... DEFAULT 'novee-grand-lounge'` anti-pattern found in migration 068 |
| `user_id` | TEXT | NULL — authenticated user id when present |
| `guest_reference` | TEXT | NOT NULL — a stable, hashed/opaque guest identifier (never raw PII); NOT NULL because every journey has at least a guest reference even when `user_id` is null |
| `session_number` | SMALLINT | NOT NULL, `CHECK (session_number BETWEEN 1 AND 27)` |
| `phase` | TEXT | NOT NULL |
| `status` | TEXT | NOT NULL DEFAULT `'in_progress'`, `CHECK (status IN ('in_progress','completed','abandoned'))` |
| `started_at` | TIMESTAMPTZ | NOT NULL DEFAULT `NOW()` |
| `completed_at` | TIMESTAMPTZ | NULL |
| `source_version` | TEXT | NOT NULL — app/schema version that wrote the record |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT `NOW()` |
| `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT `NOW()` |

Indexes: `CREATE INDEX ON (venue_id, status)`; `CREATE INDEX ON
(user_id)` where not null; `CREATE INDEX ON (guest_reference)`.
Foreign keys: `venue_id` should reference the real venue table located
during Phase 1 §16 (exact table/column **not yet confirmed** — implement-
time blocker, see validation doc). No cascade delete on venue removal;
use `ON DELETE RESTRICT` to avoid silently destroying completed-journey
history.
Retention: no automatic deletion; a future privacy-driven retention
policy is a **REQUIRES IMPLEMENTATION** decision, not assumed here.
Ownership: a journey belongs to exactly one `(user_id OR guest_reference)`
+ one `venue_id`; never editable by another user/venue (Phase 7).

## B. `smokecraft_management_sync_snapshots`

Purpose: normalized, versioned snapshot of the completed journey's
substantive content — what Management Sync actually displays/aggregates.
Append-only (never UPDATEd in place) so each sync/version is auditable.

| Column | Type | Constraint |
|---|---|---|
| `snapshot_id` | UUID | PK, `DEFAULT gen_random_uuid()` |
| `journey_id` | UUID | NOT NULL, `REFERENCES smokecraft_management_sync_journeys(journey_id) ON DELETE CASCADE` |
| `snapshot_version` | INTEGER | NOT NULL DEFAULT 1 |
| `cigar_selection` | JSONB | NULL — `{id, name, brand, wrapper, origin, shape, size, strength, body}` |
| `pairing_selection` | JSONB | NULL |
| `flavor_notes` | JSONB | NULL — first/second/final third + flavor-memory selections |
| `mentor_selections` | JSONB | NULL |
| `scorecard` | JSONB | NULL |
| `rating` | SMALLINT | NULL, `CHECK (rating BETWEEN 1 AND 5)` |
| `preferences` | JSONB | NULL |
| `feedback_text` | TEXT | NULL — free text; classified privacy-sensitive, see below |
| `return_intent` | TEXT | NULL, `CHECK (return_intent IN ('yes','no','maybe') OR return_intent IS NULL)` |
| `connections_saved` | SMALLINT | NOT NULL DEFAULT 0 |
| `completion_state` | TEXT | NOT NULL |
| `passport_state` | JSONB | NULL |
| `staff_handoff_requested` | BOOLEAN | NOT NULL DEFAULT false |
| `payload_hash` | TEXT | NOT NULL — SHA-256 of the canonicalized payload above, used for idempotency/change-detection (Phase 8) |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT `NOW()` |

Indexes: `CREATE INDEX ON (journey_id, snapshot_version)`; `CREATE UNIQUE
INDEX ON (journey_id, payload_hash)` — prevents storing two identical
snapshots for the same journey.
Privacy: `feedback_text` is free text and must be excluded from any venue
aggregate response in identifiable form (Phase 6/7) — aggregates may
count feedback presence, never echo guest free text back to venue
managers without separate, explicit consent design (out of scope here,
flagged as a real open question).
Not stored: raw email/phone, precise geolocation, payment data — none of
these appear in any journey field audited in Phase 2, so none are
included here.

## C. `smokecraft_management_sync_events`

Purpose: track explicit sync actions/status. This is the idempotent
write path — see Phase 8 for the full design.

| Column | Type | Constraint |
|---|---|---|
| `event_id` | UUID | PK, `DEFAULT gen_random_uuid()` |
| `journey_id` | UUID | NOT NULL, `REFERENCES smokecraft_management_sync_journeys(journey_id) ON DELETE CASCADE` |
| `snapshot_id` | UUID | NOT NULL, `REFERENCES smokecraft_management_sync_snapshots(snapshot_id)` |
| `venue_id` | TEXT | NOT NULL |
| `guest_reference` | TEXT | NOT NULL |
| `destination` | TEXT | NOT NULL, `CHECK (destination IN ('venue_insights','eat_360','pos_360','novee_os','inventory','staff_handoff'))` |
| `status` | TEXT | NOT NULL DEFAULT `'pending'`, `CHECK (status IN ('pending','completed','failed'))` |
| `idempotency_key` | TEXT | NOT NULL — deterministic hash of `(venue_id, journey_id, session_id≡journey_id here, destination, payload_version)` |
| `payload_version` | INTEGER | NOT NULL |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT `NOW()` |
| `completed_at` | TIMESTAMPTZ | NULL |
| `error_code` | TEXT | NULL |
| `retry_count` | SMALLINT | NOT NULL DEFAULT 0 |
| `audit_metadata` | JSONB | NULL — actor, IP-hash, client version |

**Required uniqueness (Phase 4 mandate)**:
```sql
CREATE UNIQUE INDEX idx_mgmt_sync_events_idempotency
  ON smokecraft_management_sync_events (venue_id, journey_id, destination, payload_version);
```
This is a database-level constraint, not merely frontend-enforced — an
`INSERT ... ON CONFLICT (venue_id, journey_id, destination,
payload_version) DO NOTHING RETURNING *` (falling back to `SELECT`
on conflict) gives exactly-once semantics per Phase 8.

## D. `smokecraft_management_sync_venue_insights` (materialized, see tradeoff below)

Purpose: venue-scoped aggregate data.

| Column | Type | Constraint |
|---|---|---|
| `venue_id` | TEXT | PK |
| `completed_journey_count` | INTEGER | NOT NULL DEFAULT 0 |
| `most_selected_cigar` | JSONB | NULL — `{cigarId, name, count}`, null when sample size below threshold |
| `most_selected_pairing` | JSONB | NULL |
| `average_satisfaction` | NUMERIC(3,2) | NULL |
| `sample_size` | INTEGER | NOT NULL DEFAULT 0 |
| `repeat_interest_count` | INTEGER | NOT NULL DEFAULT 0 |
| `feedback_count` | INTEGER | NOT NULL DEFAULT 0 |
| `staff_handoff_count` | INTEGER | NOT NULL DEFAULT 0 |
| `inventory_linked_selection_count` | INTEGER | NOT NULL DEFAULT 0 |
| `last_computed_at` | TIMESTAMPTZ | NOT NULL DEFAULT `NOW()` |

**Materialized vs. on-demand tradeoff** (required decision, Phase 3):
- *On-demand* (`SELECT` aggregate over `smokecraft_management_sync_snapshots`
  joined to `journeys` filtered by `venue_id`): simplest, always fresh,
  but scans grow with venue journey volume; no caching invalidation bugs
  possible since there's no cache.
- *Materialized table* (this design) updated asynchronously after each
  completed sync event: fast reads for the Management Sync summary
  screen, but introduces staleness and a recompute trigger to get right.
- **Recommendation for this platform**: given (a) no background job
  runner was found in the Phase 1 audit, and (b) SmokeCraft venue volumes
  are unproven, start **on-demand** in Package A/B and only add this
  materialized table in a later package if query load actually requires
  it. This table is documented here as the target shape for that future
  step, not something Package A should build. Recompute trigger, if/when
  built, should be a synchronous update inside the same transaction as
  the sync-event insert (simplest correct option given no job queue
  exists) rather than a new async worker.

## E. `smokecraft_management_sync_actions`

Purpose: track only real, supported management actions.

| Column | Type | Constraint |
|---|---|---|
| `action_id` | UUID | PK, `DEFAULT gen_random_uuid()` |
| `venue_id` | TEXT | NOT NULL |
| `journey_id` | UUID | NULL — null for venue-level actions not tied to one journey |
| `actor_user_id` | TEXT | NOT NULL |
| `action_type` | TEXT | NOT NULL, `CHECK (action_type IN ('analytics_viewed','staff_feedback_submitted','inventory_handoff_requested','sync_requested','sync_completed','sync_failed'))` |
| `metadata` | JSONB | NULL |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT `NOW()` |

No action types for E.A.T. 360 / POS360 / NOVEE OS "sent" events are
included, since none of those destinations are currently live (Phase 10)
— adding them now would fabricate an implied integration.

## Addendum — corrections after venue/role model audit (this package)

- `venue_id` on every table is now confirmed backed by a real table:
  `TEXT REFERENCES venues(venue_id)` (System 1, migration 010) — not a
  placeholder assumption. See `SMOKECRAFT_MANAGEMENT_SYNC_VENUE_MODEL_AUDIT.md`.
- `user_id`/`actor_user_id` remain intentionally **without** a foreign
  key — two competing user tables exist (`system_users` vs.
  `novee_os_platform_users`) and picking the wrong one would be worse
  than leaving it soft. Resolve before Package B if a hard FK is
  desired.
- `smokecraft_management_sync_venue_insights` is confirmed **deferred**
  out of Package A's initial migration (see the on-demand-first
  recommendation, unchanged) — Package A ships 4 tables, not 5.
  Full per-table Package A readiness verdicts:
  `SMOKECRAFT_MANAGEMENT_SYNC_PACKAGE_A_READINESS.md`.

## Addendum — Package A implemented and verified

This design was implemented exactly as specified (with the two
corrections noted above) in `server/db/migrations/074_smokecraft_management_sync.sql`,
applied and fully validated against a real, isolated PostgreSQL instance.
See `SMOKECRAFT_MANAGEMENT_SYNC_PACKAGE_A_SCHEMA_REPORT.md` for the
real-database-metadata confirmation and
`SMOKECRAFT_MANAGEMENT_SYNC_PACKAGE_A_TEST_REPORT.md` for the 16/16
behavior-test results. This design document is preserved unchanged above
as the historical record of what was designed before implementation.

## Explicit non-reuse of `eat_management_sync_events`

Confirmed incompatible by structure and semantics (POS/order commerce
events, not journey/venue analytics — see backend architecture doc §18,
28 and the prior Management Sync Phase 1 audit). Not modified, not
referenced by any new foreign key.

## Addendum — Package D analytics use these tables directly (no new migration)

Real venue analytics (Package D) query `smokecraft_management_sync_journeys`
and `smokecraft_management_sync_snapshots` directly — no new table, no
new migration (074 remains the latest, confirmed via `npm run db:migrate`
showing 0 new applies). See `SMOKECRAFT_MANAGEMENT_SYNC_PACKAGE_D_ANALYTICS_MODEL.md`
for the on-demand-vs-materialized decision this finalizes.
