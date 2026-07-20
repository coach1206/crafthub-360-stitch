# SmokeCraft Management Sync — Package B Handoff Contract

## Exact tables/columns Package B builds against

- `smokecraft_management_sync_journeys(journey_id, tenant_id, venue_id,
  user_id, guest_reference, session_number, phase, status, started_at,
  completed_at, source_version, created_at, updated_at)`
- `smokecraft_management_sync_snapshots(snapshot_id, journey_id,
  snapshot_version, cigar_selection, pairing_selection, flavor_notes,
  mentor_selections, scorecard, rating, preferences, feedback_text,
  return_intent, connections_saved, completion_state, passport_state,
  staff_handoff_requested, payload_hash, created_at)`
- `smokecraft_management_sync_events(event_id, journey_id, snapshot_id,
  venue_id, guest_reference, destination, status, idempotency_key,
  payload_version, created_at, started_at, completed_at, error_code,
  error_message, retry_count, audit_metadata)`
- `smokecraft_management_sync_actions(action_id, venue_id, journey_id,
  sync_event_id, actor_user_id, action_type, action_status, metadata,
  created_at)`

## Ownership fields

`journeys.user_id` (nullable) and `journeys.guest_reference` (required)
together express ownership. `events.guest_reference` mirrors this for
convenience/query performance. `actions.actor_user_id` is a plain TEXT
field, not a verified identity yet.

## Status values (exact, enforced by CHECK constraints — Package B must use these literals)

- `journeys.status`: `in_progress`, `completed`, `abandoned`
- `snapshots.return_intent`: `yes`, `no`, `maybe` (nullable)
- `events.destination`: `venue_insights`, `eat_360`, `pos_360`,
  `novee_os`, `inventory`, `staff_handoff`
- `events.status`: `pending`, `completed`, `failed`
- `actions.action_type`: `analytics_viewed`, `staff_feedback_submitted`,
  `inventory_handoff_requested`, `sync_requested`, `sync_completed`,
  `sync_failed`
- `actions.action_status`: `completed`, `failed`

## Required venue validation

Package B must, before any write: confirm the client-supplied `venue_id`
exists in `venues` and has `status = 'active'` — the database will
reject a nonexistent `venue_id` via the FK, but an *inactive/suspended*
venue is not rejected by the schema alone (no CHECK ties `venues.status`
to this table) — this is an application-level check Package B must add.

## Guest identity fields

`guest_reference TEXT NOT NULL` on `journeys` and `events`. Package B
must implement the full JWT+cookie issuing/verification design in
`SMOKECRAFT_MANAGEMENT_SYNC_GUEST_IDENTITY_DESIGN.md` before this field
can be trusted as anything more than an opaque client-supplied string.
**Until that ships, do not treat `guest_reference` as proof of identity
in any authorization decision.**

## User soft-reference behavior

`journeys.user_id` and `actions.actor_user_id` are plain TEXT with
**no foreign key** — intentionally, pending resolution of the System 1
(`system_users`) vs. System 2 (`novee_os_platform_users`) ambiguity
found in `SMOKECRAFT_MANAGEMENT_SYNC_ROLE_MODEL_AUDIT.md`. Package B
must not assume either table is definitely correct without first
resolving that question — using `req.user.id` from `requireAuth` is
safe to *store*, but Package B should not add a hard FK to either user
table without that resolution.

## Snapshot version behavior

Append-only: a new snapshot for the same journey requires an
incremented `snapshot_version`; the unique constraint
`(journey_id, snapshot_version)` prevents overwriting history. Compute
`payload_hash` from the canonicalized JSON payload before insert — the
`(journey_id, payload_hash)` unique constraint additionally prevents
storing two snapshots with byte-identical content.

## Idempotency constraint

`UNIQUE (venue_id, journey_id, destination, payload_version)` on
`events`. Package B's `POST /sync` handler must use `INSERT ... ON
CONFLICT (venue_id, journey_id, destination, payload_version) DO
NOTHING RETURNING *`, falling back to a `SELECT` on conflict, exactly as
specified in `SMOKECRAFT_MANAGEMENT_SYNC_IDEMPOTENCY_DESIGN.md` — do not
pre-check-then-insert (race-prone); rely on the constraint.

## Transaction requirements

Any write touching more than one of these 4 tables (e.g. inserting a
snapshot and an event together) must be wrapped in `BEGIN`/`COMMIT`
matching the pattern already used by `runMigrations.js`, so a partial
failure never leaves an orphaned snapshot without its event or vice
versa.

## Service layer / controllers / API / venue-authorization / audit — all Package B, not built

Per this package's explicit scope limit, none of the following exist
yet: `server/services/managementSync/*`,
`server/controllers/managementSyncController.js`,
`server/routes/managementSyncRoutes.js`, the venue-membership
authorization check, or the guest-identity issuing endpoint. All are
specified in detail in `SMOKECRAFT_MANAGEMENT_SYNC_API_CONTRACT.md`,
`SMOKECRAFT_MANAGEMENT_SYNC_SECURITY_MODEL.md`, and
`SMOKECRAFT_MANAGEMENT_SYNC_IMPLEMENTATION_PLAN.md` (Package B section).

## Idempotent sync operations

See Idempotency Design doc — unchanged, fully implemented at the
database level in Package A, ready for Package B's service layer to use
as-is.

## Audit logging

`events.audit_metadata` and `actions.metadata` (both JSONB) are the
storage location; Package B should populate them via the existing
`auditAction()` middleware pattern (`roleMiddleware.js`), not a new
audit mechanism.

## Fields Package B must never trust from the client without server-side validation

- `venue_id` — must be checked against `venues.status = 'active'`
  server-side (schema alone only proves existence, not active status).
- `guest_reference` — must come from a verified guest JWT once that
  exists, never accepted as a raw client-supplied string.
- `user_id`/`actor_user_id` — must come from `req.user.id` (post-
  `requireAuth`), never from a request body/query param.
- `payload_version` on a sync request — must be validated against the
  latest known snapshot version for that journey, not blindly accepted
  (a client could otherwise claim an arbitrary version to bypass the
  idempotency check's intent).
- `destination` — validated server-side against the real destination
  status audit (`SMOKECRAFT_MANAGEMENT_SYNC_DESTINATION_AUDIT.md`) —
  Package B must reject `POST /sync` requests for any destination other
  than `venue_insights` until the others are independently verified
  live, even though the CHECK constraint permits all 6 values at the
  database layer (the database is permissive by design; the API layer
  is where destination availability is actually enforced).

## Addendum — Package B delivered against this handoff

All items above were implemented as specified. This handoff document is
preserved as the historical contract Package B was built against — see
`SMOKECRAFT_MANAGEMENT_SYNC_PACKAGE_B_API_REPORT.md` for the as-built
routes and `SMOKECRAFT_MANAGEMENT_SYNC_PACKAGE_C_HANDOFF.md` for the new
handoff to the next package (frontend wiring).
