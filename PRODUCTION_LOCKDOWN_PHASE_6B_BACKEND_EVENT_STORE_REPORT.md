# Production Lockdown — Phase 6B: Backend Event Store Build Report

## A. Executive Summary

This phase builds the backend half of the Phase 6A architecture: a durable
event store for internal multi-device sync, completely separate from the
third-party POS provider bridge (`pos3IntegrationRoutes.js`, confirmed
out-of-scope in Phase 6). **No frontend behavior was changed** — POS3,
E.A.T., SmokeCraft, and Passport's existing localStorage/JWT flows are
untouched. Only new backend files and one new migration were added.

Built this phase:
- Migration `012_internal_sync_engine.sql` — `sync_events`, `sync_failures`,
  `pos_orders`/`pos_order_items`/`pos_order_events`, `kitchen_queue`,
  `bar_queue`, `humidor_queue`, `inventory_events`, `passport_events`,
  `smokecraft_events`, plus a `sync_version` column added to the
  **existing** `venue_devices` table (migration 006) — no duplicate device
  registry was created, per the explicit instruction.
- `server/services/syncEventService.js` — idempotent event recording,
  per-event-type projection into materialized tables, catch-up
  pull (`getEventsSince`), status reporting, and an explicit
  `DbUnavailableError` that is thrown — never swallowed into a fake
  success — whenever Postgres is not connected.
- `server/controllers/syncController.js` / `server/routes/syncRoutes.js`,
  mounted at `/api/sync` in `server/index.js`.
- `server/scripts/verifySyncEventStore.js` — a runnable verification
  script (the repo has no jest/vitest test runner, so this is a live
  HTTP smoke-test script, documented as such).

**Verified live in this environment** (no `DATABASE_URL` is set here, so
this also genuinely exercises the degraded-mode path, not just a
documented intent):
- An unauthenticated POS3/staff-scoped event is rejected with `403`,
  in every environment, regardless of DB availability.
- An unauthenticated guest-scoped SmokeCraft/Passport event is accepted
  past the auth layer (mirroring existing passport/smokecraft route
  design), then correctly reported as `degraded: true` because no DB
  is connected — **the server never reports "synced" without a real
  database write.**
- Malformed events are rejected with a clear validation error, not a
  crash.
- The `/api/sync/status` read endpoint requires staff authentication and
  rejects anonymous requests.

`npm run build` passed cleanly with no errors.

## B. Migrations Added

`server/db/migrations/012_internal_sync_engine.sql` — all `CREATE TABLE
IF NOT EXISTS` (safe to run multiple times, consistent with prior
migrations' convention):

| Table | Purpose |
|---|---|
| `sync_events` | Append-only event log, source of truth for ordering/audit (`event_id` UUID PK = idempotency key) |
| `sync_failures` | Conflicts/rejected/stale events — never silently dropped |
| `pos_orders` | Materialized order state |
| `pos_order_items` | Materialized order line items |
| `pos_order_events` | Per-order event audit trail |
| `kitchen_queue` / `bar_queue` / `humidor_queue` | Materialized station queue state |
| `inventory_events` | Append log of inventory deltas |
| `passport_events` | Append log of passport-related events |
| `smokecraft_events` | Append log of SmokeCraft session events |

**`venue_devices` (migration 006) was reused, not duplicated** — this
migration only runs `ALTER TABLE venue_devices ADD COLUMN IF NOT EXISTS
sync_version INTEGER NOT NULL DEFAULT 0`.

No automated migration runner exists in this repo (confirmed via search —
prior migrations 001–011 are also applied manually); this migration
follows the same convention and was not auto-applied, since no
`DATABASE_URL` is configured in this environment. It has not been run
against a live database this phase — only validated by reading and by
the application code's queries matching its column names exactly.

## C. Routes Added

Mounted at `/api/sync` in `server/index.js`:

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/sync/events` | POST | `optionalAuth` (per-event check in controller) | Submit one or more `SyncEvent`s |
| `/api/sync/events` | GET | `requireAuth` + `requireStaff` | List recent events (operational visibility, staff+) |
| `/api/sync/events/since/:timestamp` | GET | `requireAuth` + `requireStaff` | Catch-up pull for reconnecting devices |
| `/api/sync/retry` | POST | `optionalAuth` (per-event check) | Re-submit previously-failed-on-client events; idempotent |
| `/api/sync/status` | GET | `requireAuth` + `requireStaff` | DB availability + event/failure counts |

Reads are staff-gated because they expose cross-device, cross-venue
operational data (every device's events) — this mirrors
`pos3IntegrationRoutes.js`'s existing `requireManager`-tier `/eat-feed`
precedent (Phase 6 finding) rather than inventing a new policy.

## D. Auth Rules

Enforced in `syncController.js`'s `authorizeEvent()`, evaluated
per-event (not per-route), because a single batch POST can mix sources:

- **Staff/operational events** (`POS3`, `EAT`, `KITCHEN`, `BAR`,
  `HUMIDOR`, `INVENTORY`) — require `req.user` to exist and
  `meetsMinRole(role, 'staff')`, i.e. staff/manager/admin/founder.
  Rejected with `403` otherwise, in all environments (verified live:
  an unauthenticated POS3 `OrderCreated` event is rejected even when
  the server is running in development/prototype mode, because
  `optionalAuth` does not synthesize a `staff` role for guests).
- **Guest-facing events** (`SMOKECRAFT`, `PASSPORT`) — allowed without
  a JWT. This is **not a new capability** — it mirrors the existing,
  already-shipped `passportRoutes.js` (`POST /:passportId/stamps` has
  no `requireAuth` at all) and `smokecraftOrders.js` design, which scope
  guest writes by a capability id (`passportId`/`sessionId`) carried in
  the payload rather than by backend identity, because guests have no
  JWT session (Phase 4 finding: guest routes are intentionally
  ungated). "Users can write their own SmokeCraft/Passport events only"
  is satisfied the same way the existing app already satisfies it: the
  `entityId` (passport/session id) is itself the access-scoping token —
  there is no broader backend user-identity model for guests to check
  ownership against, and inventing one would be new architecture beyond
  this phase's scope.
- **Unknown `sourceSystem`** — rejected with a validation error before
  any auth check.
- **Reads** (`GET /events`, `/events/since/:ts`, `/status`) — staff+ only,
  unconditionally (Section C).

## E. Idempotency Rules

- `sync_events.event_id` is the primary key (`UUID`), generated
  client-side at action time (Phase 6A design) — this is the
  idempotency key.
- `recordEvent()` first does a plain `SELECT` by `event_id`; if found,
  returns the existing row with `duplicate: true` and does **not**
  re-run the projection into materialized tables (no duplicate orders,
  no double-counted inventory deltas, etc.).
- The `INSERT ... ON CONFLICT (event_id) DO NOTHING` covers the race
  where two near-simultaneous submissions both miss the initial
  `SELECT` — the losing insert returns zero rows, and the code re-reads
  the now-existing row instead of erroring.
- `OrderUpdated`'s projection additionally guards on `updated_at <= $3`
  (stale-update check) — an event with an older `client_created_at`
  than the order's current `updated_at` is recorded in `sync_events`
  (for audit) but does not overwrite materialized state, and is logged
  to `sync_failures` with `reason: 'stale_update'` instead of silently
  discarded (Phase 6A, Section H).
- `/api/sync/retry` reuses the exact same `recordEvent()` path — retried
  events are never re-applied if already synced.

## F. Database Availability Behavior

Confirmed live in this environment (no `DATABASE_URL` set, so the
backend runs in genuine degraded mode, not a simulation):

- `syncEventService.js` exports `DbUnavailableError`; `recordEvent()`,
  `getEventsSince()`, `listEvents()`, and the non-degraded branch of
  `getSyncStatus()` all call `assertDb()` first and throw it immediately
  if `isDbAvailable()` is false.
- The controller catches `DbUnavailableError` specifically and returns
  `{ success: false, degraded: true, error: <explicit message> }` with
  HTTP `503` — **never** `{ success: true }` and never a `sync_status`
  of `'synced'`.
- **No in-memory fallback is used anywhere in this new code**, by
  design — unlike `passportService.js`'s existing in-memory `Map()`
  fallback (flagged as a silent-data-loss risk in Phase 5), this sync
  engine has zero in-memory state. If the DB is down, the event is
  reported as not-synced, full stop, so the client outbox (Phase 6A,
  Section G — not yet built) knows to keep retrying rather than being
  told a false "success."
- Live verification output (captured this phase):
  ```
  POST /api/sync/events { sourceSystem: 'PASSPORT', ... }  (no DB configured)
  → { "success": true, "data": { "results": [{
        "eventId": "...", "success": false, "degraded": true,
        "error": "Sync store is unavailable (no database connection).
                   This event was NOT durably saved — keep it pending
                   in your local outbox and retry later. The server
                   will never report \"synced\" without a real write."
      }]}}
  ```
  (Outer `success: true` reflects "the request was processed," not "the
  event was saved" — the per-event `degraded`/`success: false` field is
  the authoritative signal, consistent with the existing
  `ok()`/`fail()` response envelope convention used elsewhere.)

## G. Verification Results

No jest/vitest or other test runner exists in this repo (confirmed via
search of `package.json` and the filesystem — prior phases also have no
test suite). Per the task's "add tests or verification script if repo
has test structure" instruction, a runnable script was added instead:
`server/scripts/verifySyncEventStore.js`.

Run this phase against the live dev server (`node server/index.js`,
no `DATABASE_URL`):

```
Verifying sync event store at http://localhost:3001 ...

  PASS  Guest SmokeCraft write is not auth-rejected
  PASS  Unauthenticated POS3 write is rejected
  PASS  Malformed event is rejected without crashing
  PASS  Unauthenticated read of /api/sync/status is rejected

4 passed, 0 failed
```

Additionally manually verified via `curl` (Section F) that the degraded
response body matches the "no fake sync success" contract exactly, and
that staff-only rejection (`POS3` event, no auth) returns the expected
`403` with a clear message, even in development mode.

`npm run build` — passed cleanly, no errors (pre-existing chunk-size
warning only).

## H. Files Changed

- `server/db/migrations/012_internal_sync_engine.sql` (new)
- `server/services/syncEventService.js` (new)
- `server/controllers/syncController.js` (new)
- `server/routes/syncRoutes.js` (new)
- `server/scripts/verifySyncEventStore.js` (new)
- `server/index.js` (modified — added `syncRoutes` import and
  `app.use('/api/sync', syncRoutes)` mount; no other lines changed)

No frontend file was touched. No existing backend route, controller, or
service was modified beyond the one-line addition in `server/index.js`.

## I. Remaining Gaps

- **This migration has not been run against a real database** — no
  `DATABASE_URL` exists in this environment. It must be applied (e.g.
  `psql $DATABASE_URL -f server/db/migrations/012_internal_sync_engine.sql`)
  before any real event can be durably synced; until then, the honest
  degraded-mode path (Section F) is what every caller will see, which is
  the correct and intended behavior for an unmigrated/unconfigured
  database — not a bug.
- **No client-side `SyncQueueService`/outbox exists yet** (Phase 6C,
  per the roadmap) — nothing in the frontend calls `/api/sync/*` yet,
  matching this phase's explicit "do not change frontend behavior yet."
- **No catch-up consumer exists in E.A.T.** yet (Phase 6D) — the
  `GET /events/since/:timestamp` endpoint exists and is staff-gated, but
  no page reads from it yet.
- **Conflict/stale-update audit has no UI** — `sync_failures` rows are
  written but there's no admin/manager view of them yet (would belong to
  a later phase, not invented here).
- **Retry endpoint has no caller yet** — `/api/sync/retry` is built and
  reachable but is intended to be driven by the future client outbox.

## J. Next Phase Recommendation

Proceed to **Phase 6C — Sync Queue Engine**, per the Phase 6A build
order: build `src/services/shared/syncQueueService.js` (IndexedDB
outbox) and wire it to *additionally* enqueue events at the existing
`pos3Service.js`/queue-service call sites — purely additive, with zero
behavior change to the current localStorage-based flows, so the new
backend store starts receiving real traffic without any cutover risk.
Apply migration `012` to a real database before that phase begins
integration testing, so Phase 6C's writes can be verified end-to-end
rather than only against the degraded-mode path exercised here.
