# SmokeCraft Management Sync — API Contract (Phase 5)

Design only — **no routes implemented this package.** Follows the
real controller/service/`wrap()`-envelope convention audited in the
backend architecture doc (§7-9), mounted under
`/api/smokecraft/management-sync`.

## `GET /api/smokecraft/management-sync/journeys/:journeyId`

- **Auth**: `requireAuth` (own journey) — guest access permitted only
  when `guest_reference` in the journey record matches the caller's
  session-derived reference (exact mechanism TBD, Phase 1 §14 blocker).
- **Authorization**: journey owner (`user_id` or `guest_reference` match)
  or a venue manager/admin scoped to that journey's `venue_id`
  (`requireRole`/`requirePermission`, roleMiddleware.js).
- **Params**: `journeyId` (UUID, path).
- **Body**: none.
- **Validation**: `journeyId` must be a valid UUID; 400 otherwise.
- **Response**: the standard envelope (Phase 6) with `scope: 'journey'`.
- **Errors**: 401 no auth; 403 authenticated but not owner/not
  authorized venue role; 404 journey not found.
- **Audit**: `auditAction('management_sync', 'journey_summary_viewed',
  'post')`.
- **Idempotency**: N/A (read-only).
- **Rate limiting**: standard per-user read rate limit (existing platform
  default, not newly designed here).

## `POST /api/smokecraft/management-sync/journeys/:journeyId/sync`

- **Auth**: `requireAuth`.
- **Authorization**: journey owner only — a guest/user may only sync
  their own journey; venue staff/managers cannot trigger a sync on a
  guest's behalf (prevents forged "venue benefit" events).
- **Params**: `journeyId` (UUID, path).
- **Body**: `{ destination: 'venue_insights', payloadVersion: number }`
  (initial scope: `venue_insights` only — E.A.T./POS/NOVEE OS destinations
  stay `NOT CONNECTED` per Phase 10 until each is independently verified
  live).
- **Validation**: journey must have `status = 'completed'` (400
  `journey_incomplete` otherwise); `destination` must be one of the
  `CHECK`-constrained values.
- **Behavior**: compute/lookup the latest snapshot for `journeyId`;
  compute `idempotencyKey = hash(venueId, journeyId, destination,
  payloadVersion)`; `INSERT ... ON CONFLICT (venue_id, journey_id,
  destination, payload_version) DO NOTHING RETURNING *`; on conflict,
  `SELECT` and return the existing record instead of erroring (Phase 8).
- **Response**: the created or existing sync-event record, echoed in the
  standard envelope under `sync`.
- **Errors**: 401, 403 (not owner), 404 (journey not found), 400
  (`journey_incomplete`, invalid destination).
- **Audit**: `auditAction('management_sync', 'sync_requested', 'pre')`
  then `'sync_completed'`/`'sync_failed'` post.
- **Idempotency**: database-enforced (Phase 8) — this is the endpoint the
  unique index protects.
- **Rate limiting**: standard write rate limit.

## `GET /api/smokecraft/management-sync/journeys/:journeyId/status`

- **Auth**: `requireAuth`, same ownership rule as the summary endpoint.
- **Response**: latest `smokecraft_management_sync_events` row(s) for the
  journey, per destination, under `sync`.
- **Errors**: 401, 403, 404.
- **Audit**: read-only, not separately audited (low sensitivity).

## `GET /api/smokecraft/management-sync/venues/:venueId/insights`

- **Auth**: `requireAuth`.
- **Authorization**: `requireRole('venue_manager')` or higher — **guests
  are rejected with 403**, not merely hidden client-side. This is the one
  endpoint in this contract explicitly restricted per the mandate's
  access-control requirement ("Guests cannot access venue-wide data").
- **Params**: `venueId` (path). Server derives the caller's authorized
  venue(s) from `req.user` — the path `venueId` is validated against
  that server-side set, never trusted from the client alone ("No
  endpoint accepts client-supplied venue ownership without server
  validation").
- **Response**: `smokecraft_management_sync_venue_insights` row (or the
  on-demand-computed equivalent per the Phase 3/4 tradeoff decision),
  with `insufficient_data` reasons per metric below its sample-size
  threshold (Phase 9).
- **Errors**: 401, 403 (guest or wrong-venue manager), 404 (venue not
  found / no data yet — distinguished from 403 in the response body, not
  the status code, since "no data yet" for an authorized venue is not an
  authorization failure — actually returns 200 with `availability:
  'insufficient_data'` per field, not a 404, to avoid conflating "empty"
  with "not found").
- **Audit**: `auditAction('management_sync', 'venue_insights_viewed',
  'post')`.

## `POST /api/smokecraft/management-sync/venues/:venueId/staff-feedback`

- **Status**: **not included in this contract's Package A/B scope.** No
  real staff-feedback persistence exists yet (Phase 1 §22 — NOT STORED).
  Documented here only as a placeholder route name reserved for Package D
  — building it now would be exactly the "build production endpoints
  yet" this package is instructed not to do.

## Cross-cutting rules for every endpoint above

- 401 for missing/invalid auth, 403 for authenticated-but-unauthorized,
  404 for a genuinely missing owned record — never conflate these.
- No endpoint ever infers `venueId` or `journeyId` from a client-supplied
  default; both must resolve to a real row the caller is authorized to
  see.
- No endpoint returns a fabricated fallback value on error — errors
  return the `errors`/`warnings` shape (Phase 6), never a substituted
  zero or placeholder metric.

## Addendum — implemented in Package B

The journey/snapshot/sync endpoints designed above were implemented
essentially as specified, with one intentional simplification: response
bodies use a flat `{success, error}` shape rather than the full
`warnings`/`errors` array structure originally sketched, since Package
B's error cases are all single, specific, named error codes rather than
multi-field partial-failure states. See
`SMOKECRAFT_MANAGEMENT_SYNC_PACKAGE_B_API_REPORT.md` for the exact,
as-built contract (routes, bodies, responses, error codes) and
`SMOKECRAFT_MANAGEMENT_SYNC_PACKAGE_B_IMPLEMENTATION.md` for what
changed from this design during real testing.

## Addendum — consumed by a real frontend client (Package C)

`src/services/smokecraft/managementSyncApiClient.js` now consumes this
exact contract from a real browser, confirmed via live end-to-end
testing (`verify-smokecraft-management-sync-package-c.mjs`, 23/23). No
endpoint path, method, or response field needed to change from what was
specified here.

## Addendum — analytics endpoint added (Package D)

`GET /venues/:venueId/insights` (Phase 5's originally-designed path) is
now real, implemented exactly as specified. See
`SMOKECRAFT_MANAGEMENT_SYNC_PACKAGE_D_API_REPORT.md`.

## Addendum — integration status endpoint added (Package E)

`GET /venues/:venueId/integrations` — new, real, live-tested (23/23).
See `SMOKECRAFT_MANAGEMENT_SYNC_INTEGRATION_REGISTRY.md` and
`SMOKECRAFT_MANAGEMENT_SYNC_CONNECTION_STATE_MODEL.md`.
