# Production Lockdown — Phase 6A: Internal Sync Architecture + Multi-Device Resiliency Report

## A. Executive Summary

Per the user's own 6-phase roadmap (Section "10. IMPLEMENTATION PLAN"),
**Phase 6A is Architecture Design** — Backend Event Store (6B), Sync
Queue Engine (6C), Device Synchronization (6D), Offline Recovery Testing
(6E), and Production Validation (6F) are explicitly separate, later
phases. Consistent with this phase's own rule ("If architecture is
missing, design it before coding"), **this phase produces the design
only — no event store, sync queue, or device-sync code was written.**
Writing that code now, ahead of an approved schema and queue contract,
would risk exactly the kind of "placeholder architecture" / "fake sync"
this phase explicitly forbids.

This phase confirms Phase 6's finding: `pos3IntegrationRoutes.js` is a
third-party provider adapter framework and must not be repurposed as the
internal sync layer. It also finds that **meaningful pieces of the
target architecture already exist** and should be reused rather than
rebuilt:

- A real device-registry table, `venue_devices` (migration `006`), already
  has `device_id`, `device_type`, `venue_id`, `last_seen_at`,
  `app_version` — this is most of Objective 6 ("Device Registration")
  already built, from Phase 11's kiosk/tablet deployment work.
- A normalized, typed client-side event envelope already exists —
  `opsEventBus.js`'s `normalizeEvent()` (`id`, `sourceSystem`,
  `targetSystem`, `eventType`, `payload`, `status`, `createdAt`) — this
  is the right shape to extend into the durable `SyncQueueService`
  requested in Objective 4, rather than inventing a second, parallel
  event shape.
- A DB-availability fallback pattern is already established and used
  consistently across the backend (`server/db/connection.js`'s
  `isDbAvailable()`, used by `pos3IntegrationController.js`,
  `passportService.js`'s in-memory `Map()` fallback) — the new sync
  engine should follow this same pattern rather than introduce a new one.
- `pos3_provider_events` (migration `004`) is structurally very close to
  a generic event-ingestion table, but is explicitly provider-scoped
  (`provider_key`) and tied to the third-party adapter framework per
  Phase 6's finding — it must not be reused for internal events, to avoid
  conflating the two systems (this would itself be a kind of redesign).

No code was changed this phase. `npm run build` was run as a sanity
check per the standing rule (no changes expected, none found).

## B. Current State Analysis

| System | Today | Gap |
|---|---|---|
| POS3 orders/tickets | `localStorage['pos3:tickets']`/`['pos3:tables']`, in-process reads by E.A.T. | No backend persistence, no cross-device visibility, no durability across browser data loss |
| Kitchen/bar/humidor queues | `localStorage['pos3:kitchenQueue']`/`['pos3:barQueue']`/`['pos3:humidorRequests']` | Same |
| Receipts | `receiptService.js` → localStorage | Same |
| SmokeCraft → Passport stamps | `GuestSessionContext` → localStorage (primary) + fire-and-forget POST to `/api/passport/:id/stamps` (Phase 5) | Backend path exists but is optional and falls back to an in-memory `Map()` on the server if Postgres is down — stamps can be lost on server restart even when the frontend believes sync succeeded |
| SmokeCraft → E.A.T. live ops (humidor/purchase requests) | `opsEventBus.js` (localStorage + CustomEvent/storage event) | Same-browser only; backend routes exist (`smokecraftEatRoutes.js`) but are never called |
| Auth/device identity | Real JWT sessions (Phase 4); `venue_devices` table exists for kiosk deployment | No link yet between an authenticated session/device and a sync-queue's `sourceDeviceId` |
| Third-party POS bridge | `pos3IntegrationRoutes.js` (Phase 6) | Out of scope for internal sync — confirmed, not reused |

## C. Existing Infrastructure Inventory

Reusable as-is:

- `server/db/connection.js` — `getDb()`/`isDbAvailable()`, graceful
  prototype-mode fallback when `DATABASE_URL` is unset. The new event
  store must be built on this, not a new connection pattern.
- `venue_devices`, `device_events` (migration `006`) — device registry +
  a generic per-device event log already exist. `device_events.event_type`
  + `payload JSONB` is already shaped for arbitrary device telemetry;
  Objective 6 ("Device Registration") is therefore largely satisfied and
  only needs `syncVersion`-equivalent tracking added (see Section F).
- `opsEventBus.js` (`normalizeEvent`, `emit`, `subscribe`, `eventsFor`) —
  the existing client-side event envelope and pub/sub primitive. The new
  `SyncQueueService` should wrap/extend this rather than replace it, so
  same-browser real-time UX (already working, per Phase 5) is preserved
  while adding durable backend delivery on top.
- `src/services/apiClient.js` — `apiGet`/`apiPost`/`apiPut`/`apiDelete`,
  timeout-safe, never-throws, `credentials: 'include'`. The sync queue's
  network layer should use this, consistent with every other backend
  call in the codebase (Phase 4/6 precedent).
- `syncService.js` (referenced in Phase 5, `src/services/`) — already
  implements one fire-and-forget POST-on-completion pattern
  (SmokeCraft session → `/api/sessions`, stamps →
  `/api/passport/:id/stamps`). This is the closest existing precedent
  for "write-through with offline tolerance" and should inform the new
  `SyncQueueService`'s retry semantics, but it is not itself durable
  (no persisted queue, no retry-after-refresh) — that gap is exactly
  what Objective 4 asks to fix.
- Migrations `004`/`005` (`pos3_provider_*`, `pos3_sync_runs`) — confirmed
  in Phase 6 to be provider-scoped, not reusable for internal events;
  listed here only to record that they were checked and excluded.

Not present anywhere in the codebase today (confirmed via grep across
`server/` and `src/services/`): any internal-orders table, any durable
client-side outbox/queue, any `sync_events`/`sync_failures`-style table,
any cross-device "last write wins"/conflict-resolution logic.

## D. Event Architecture Design

All internal operational state changes become events using a single
canonical envelope, extending `opsEventBus.js`'s existing shape (not
replacing it) so existing emit/subscribe call sites keep working:

```
SyncEvent {
  eventId:        string   // client-generated UUID, globally unique, idempotency key
  sourceDeviceId: string   // from device_registry (Section F)
  sourceSystem:   'POS3' | 'EAT' | 'SMOKECRAFT' | 'PASSPORT' | 'KITCHEN' | 'BAR' | 'HUMIDOR'
  eventType:      string   // e.g. 'OrderCreated', 'KitchenAccepted' (Section title's examples)
  entityId:       string   // ticketId / orderId / stampId / sessionId, etc.
  payload:        object   // event-specific data
  syncStatus:      'pending' | 'syncing' | 'synced' | 'failed'
  clientCreatedAt: number  // ms epoch, set once, never overwritten — authoritative ordering key
  syncedAt:        number | null
  attemptCount:    number
}
```

Event types (initial set, matching the prompt's examples, organized by
source system):

- **POS3/Tickets**: `OrderCreated`, `OrderUpdated`, `OrderClosed`, `ReceiptGenerated`
- **Kitchen**: `KitchenAccepted`, `KitchenCompleted`
- **Bar**: `BarAccepted`, `BarCompleted`
- **Humidor**: `HumidorAccepted`, `HumidorCompleted`
- **Inventory**: `InventoryAdjusted`, `ReorderRequested`
- **SmokeCraft**: `SmokeCraftStarted`, `SmokeCraftCompleted`
- **Passport**: `PassportStampAwarded`, `MentorAssigned`

`eventId` is generated client-side at the moment of the user action
(not at sync time), so the same event always carries the same id through
retries — this is the idempotency key referenced in Objective 7.

## E. Backend Schema Design

The existing DB (Postgres via `pg`, with `isDbAvailable()` graceful
fallback — Section C) already supports this; no new database engine is
needed. Proposed migration `012_internal_sync_engine.sql` (design only,
not applied this phase):

```sql
-- Generic durable event log — append-only, source of truth for ordering/audit
CREATE TABLE IF NOT EXISTS sync_events (
  event_id          UUID PRIMARY KEY,          -- client-generated, idempotency key
  source_device_id  TEXT        NOT NULL,
  source_system     TEXT        NOT NULL,
  event_type        TEXT        NOT NULL,
  entity_id         TEXT,
  payload           JSONB       NOT NULL DEFAULT '{}'::jsonb,
  sync_status       TEXT        NOT NULL DEFAULT 'synced'
                      CHECK (sync_status IN ('pending','syncing','synced','failed')),
  client_created_at TIMESTAMPTZ NOT NULL,       -- authoritative ordering key (Section H)
  received_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  attempt_count     INTEGER     NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_sync_events_entity ON sync_events(entity_id);
CREATE INDEX IF NOT EXISTS idx_sync_events_type   ON sync_events(event_type);
CREATE INDEX IF NOT EXISTS idx_sync_events_created ON sync_events(client_created_at DESC);

-- Materialized current-state tables, derived from sync_events, read by E.A.T./POS3 UIs
CREATE TABLE IF NOT EXISTS pos_orders (
  order_id     TEXT PRIMARY KEY,
  venue_id     TEXT NOT NULL,
  table_id     TEXT,
  staff_id     TEXT,
  status       TEXT NOT NULL DEFAULT 'open',
  opened_at    TIMESTAMPTZ NOT NULL,
  updated_at   TIMESTAMPTZ NOT NULL,
  closed_at    TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS pos_order_items (
  id        BIGSERIAL PRIMARY KEY,
  order_id  TEXT NOT NULL REFERENCES pos_orders(order_id),
  item_id   TEXT NOT NULL,
  name      TEXT NOT NULL,
  qty       INTEGER NOT NULL DEFAULT 1,
  price     NUMERIC(10,2),
  status    TEXT NOT NULL DEFAULT 'ordered'
);

CREATE TABLE IF NOT EXISTS pos_order_events (
  id         BIGSERIAL PRIMARY KEY,
  order_id   TEXT NOT NULL REFERENCES pos_orders(order_id),
  event_id   UUID NOT NULL REFERENCES sync_events(event_id),
  event_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kitchen_queue (
  id          BIGSERIAL PRIMARY KEY,
  order_id    TEXT NOT NULL REFERENCES pos_orders(order_id),
  item_id     TEXT,
  status      TEXT NOT NULL DEFAULT 'queued'
               CHECK (status IN ('queued','accepted','completed','cancelled')),
  accepted_by TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bar_queue (LIKE kitchen_queue);
CREATE TABLE IF NOT EXISTS humidor_queue (LIKE kitchen_queue);

CREATE TABLE IF NOT EXISTS inventory_events (
  id          BIGSERIAL PRIMARY KEY,
  event_id    UUID NOT NULL REFERENCES sync_events(event_id),
  sku         TEXT NOT NULL,
  delta       INTEGER NOT NULL,
  reason      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS passport_events (
  id          BIGSERIAL PRIMARY KEY,
  event_id    UUID NOT NULL REFERENCES sync_events(event_id),
  passport_id TEXT NOT NULL,
  event_type  TEXT NOT NULL,
  payload     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS smokecraft_events (
  id          BIGSERIAL PRIMARY KEY,
  event_id    UUID NOT NULL REFERENCES sync_events(event_id),
  session_id  TEXT NOT NULL,
  event_type  TEXT NOT NULL,
  payload     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Device registry: EXTEND existing venue_devices rather than duplicate it.
ALTER TABLE venue_devices ADD COLUMN IF NOT EXISTS sync_version INTEGER NOT NULL DEFAULT 0;
-- device_registry as referenced in the prompt = venue_devices + this column;
-- no separate table is created (see Section F).

CREATE TABLE IF NOT EXISTS sync_failures (
  id           BIGSERIAL PRIMARY KEY,
  event_id     UUID,
  source_device_id TEXT,
  reason       TEXT NOT NULL,
  payload      JSONB,
  occurred_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved     BOOLEAN NOT NULL DEFAULT FALSE
);
```

`pos_orders`/`*_queue`/`*_events` tables are deliberately **derived/
materialized** from `sync_events`, not the primary source of truth —
`sync_events` is append-only and replayable, which is what makes the
recovery scenarios in Section I possible (a device can always recover
state by replaying events newer than its last-seen `event_id`/timestamp).

## F. Device Registration Design

**Reuse `venue_devices` (migration `006`) — do not create a parallel
`device_registry` table.** It already has `device_id` (UNIQUE),
`device_type` (constrained enum, needs `kitchen_terminal`/`bar_terminal`/
`humidor_terminal` added to the CHECK list), `venue_id`, `last_seen_at`,
`app_version`. The only gap is `syncVersion` (Objective 6) — added via
`ALTER TABLE ... ADD COLUMN sync_version` above. A device's `sync_version`
increments each time it successfully applies a batch of synced events,
and is used to ask the backend "give me everything since version N" on
reconnect (Section I, Scenarios F/G).

`lastSeen` is already updated by the existing kiosk heartbeat mechanism
from Phase 11 (`device_events` table) — the sync engine should call the
same update path rather than add a second heartbeat.

## G. Sync Queue Design

`SyncQueueService` (new client-side module, design only):

- Backed by IndexedDB (not localStorage) for the outbox itself, because
  the outbox must hold an unbounded, ordered list of pending events
  without the ~5MB localStorage ceiling risk under heavy offline use —
  this is the one deliberate infrastructure choice beyond what already
  exists, and is necessary to honestly satisfy "survives refresh,"
  "survives browser restart," and "preserves event ordering" for
  high-volume venues (a busy kitchen night can generate hundreds of
  events). `opsEventBus.js`'s existing localStorage-based events remain
  for same-tab/cross-tab real-time UX (Phase 5's working mechanism) —
  `SyncQueueService` sits alongside it, not in place of it.
- API: `enqueue(event)`, `flush()`, `getPending()`, `getFailed()`.
- `flush()` walks pending events in `clientCreatedAt` order, POSTs each
  via `apiClient.js`'s `apiPost('/api/sync/events', event)`, marks
  `synced` on `200`, leaves `pending` (with `attemptCount++`) on network
  failure (so it is retried, never silently dropped), marks `failed` only
  on an explicit server-side rejection (e.g. malformed payload) and
  writes a row to `sync_failures`.
- Triggered: on every `enqueue()` (best-effort immediate attempt), on
  `window.addEventListener('online', ...)`, and on a periodic interval
  (e.g. 15s) as a backstop for missed `online` events.
- Never deletes a pending event before the server confirms receipt
  (Objective 7) — `synced` events may be pruned from the local outbox
  after confirmation, `pending`/`failed` never are until resolved.

## H. Conflict Resolution Strategy

- **`eventId` uniqueness**: `sync_events.event_id` is the primary key;
  a duplicate POST (Scenario H) is an idempotent upsert
  (`ON CONFLICT (event_id) DO NOTHING`) — the second submission is a
  no-op, not an error, so retry-after-timeout is always safe.
- **Newest timestamp wins**: for entity-level state (e.g. `pos_orders.status`),
  any event with `client_created_at` older than the entity's current
  `updated_at` is recorded in `sync_events` (for audit) but does not
  overwrite materialized state — this is enforced in the event-applier,
  not by deleting the stale event.
- **Audit every conflict**: any event whose `client_created_at` is older
  than the current materialized state's `updated_at` is logged to
  `sync_failures` with `reason = 'stale_update'`, `resolved = false`,
  for later staff review — not silently dropped.
- **Reconnect**: a device's `flush()` simply resumes from its own
  pending queue; the server's idempotent upsert handles the case where
  some of those events actually already landed before the disconnect.

## I. Recovery Strategy

| Scenario | Behavior under this design |
|---|---|
| A. POS loses Wi-Fi mid-order | Order event already enqueued to the IndexedDB outbox at action time, before any network attempt — stays `pending`, retried on reconnect. Local `pos3Service.js` localStorage write (today's behavior) is unaffected, so the order is usable on-device immediately regardless of network. |
| B. Browser refresh right after order creation | Outbox is IndexedDB (persists across refresh) — `pending`/`failed` events survive; `flush()` resumes on next load. |
| C. Device shuts down unexpectedly | Same as B — IndexedDB is durable storage, not memory; nothing in the outbox is lost. |
| D. Backend unavailable | `flush()` attempts fail at the network layer (via `apiClient.js`'s existing timeout/never-throws behavior), events stay `pending`, retried on the periodic interval — no data loss, no fake "synced" status ever set without a real 200. |
| E. Backend returns online | Periodic interval or `online` event triggers `flush()`; all pending events submit in original order. |
| F. Kitchen device reconnects after offline | Pulls `GET /api/sync/events?since=<its own last sync_version>` (Section L) to catch up on events from *other* devices it missed, then resumes its own `flush()` for outbound events. |
| G. Manager tablet reconnects after offline | Same pull-since-version mechanism — read-only devices (E.A.T./manager tablets) only need the pull side, not an outbox. |
| H. Duplicate sync submissions | Idempotent `event_id` upsert (Section H) — second submission is a no-op. |
| I. SmokeCraft completes offline | `SmokeCraftCompleted` event enqueued the same way as any POS3 event; existing localStorage session completion (Phase 5's working mechanism) is unaffected and remains primary for that guest's own device; the sync queue adds the cross-device/durability layer on top, consistent with "do not remove existing working systems." |
| J. Passport stamp awarded offline | `PassportStampAwarded` event enqueued; this directly replaces the current fire-and-forget, non-durable POST in `syncService.js` (Phase 5 finding) with a retried, durable one — closing that phase's documented gap. |

## J. Multi-Device Architecture Diagram

```
 [POS Device A]      [Kitchen B]      [Bar C]      [Humidor D]      [Manager E]
      |                   |              |              |               |
      |  enqueue          |  enqueue      |  enqueue     |  enqueue      |  (read-only)
      v                   v              v              v               |
 +----------------------------------------------------------------+      |
 |        SyncQueueService (IndexedDB outbox, per device)         |      |
 +----------------------------------------------------------------+      |
      |  flush() — apiPost /api/sync/events (apiClient.js)              |
      v                                                                  |
 +----------------------------------------------------------------+      |
 |  Backend: requireAuth -> sync_events (append-only, idempotent) |      |
 |       -> applier -> pos_orders / kitchen_queue / bar_queue /   |      |
 |          humidor_queue / inventory_events / passport_events /  |      |
 |          smokecraft_events (materialized current state)        |<-----+
 +----------------------------------------------------------------+   pull /api/sync/events?since=
      |                                                                  ^
      |  GET /api/sync/events?since=<sync_version>  (catch-up pull)      |
      +------------------------------------------------------------------+
                          E.A.T. Command Hub reads materialized tables
```

Existing localStorage/`opsEventBus.js` same-browser paths (Phase 5)
continue operating unchanged alongside this — they are the immediate-UX
layer; the sync engine is the cross-device durability layer.

## K. Required Files (future phases, not created this phase)

- `server/db/migrations/012_internal_sync_engine.sql`
- `server/services/syncEventService.js` (applier: validates, upserts
  `sync_events`, projects into materialized tables)
- `server/controllers/syncController.js`
- `server/routes/syncRoutes.js`
- `src/services/shared/syncQueueService.js` (client outbox, IndexedDB)
- `src/services/shared/syncApiClient.js` (thin wrapper over `apiClient.js`
  for `/api/sync/*`)
- Read-path updates (later phase) to `pos3Service.js`,
  `kitchenQueueService.js`, `barQueueService.js`, `humidorQueueService.js`
  to read materialized backend state first, localStorage as fallback —
  explicitly **not** done this phase.

## L. Required Backend Endpoints (future phases, not implemented this phase)

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/sync/events` | POST | Submit one or more `SyncEvent`s (idempotent upsert) |
| `/api/sync/events` | GET `?since=<sync_version or timestamp>` | Catch-up pull for reconnecting/read-only devices |
| `/api/sync/devices/:deviceId/heartbeat` | POST | Update `venue_devices.last_seen_at`/`sync_version` (reuses Phase 11's existing heartbeat pattern) |
| `/api/sync/failures` | GET | Manager-facing list of unresolved conflicts (`sync_failures` where `resolved = false`) |

All would require `requireAuth` + role middleware, consistent with every
other backend route audited in Phases 4 and 6.

## M. Launch Risks

- This design is not yet built — POS3/E.A.T. multi-device sync remains
  unavailable until Phases 6B-6F are implemented and validated.
- IndexedDB outbox introduces a new client-side storage dependency not
  used elsewhere in the codebase today — needs its own browser-support
  check (acceptable risk: IndexedDB is supported in all target browsers
  per the existing kiosk/tablet deployment baseline).
- Migrating `pos3Service.js`'s read path from localStorage-first to
  backend-first (Section K, deferred) is the highest-risk step in this
  whole roadmap, since it changes the source of truth for live venue
  operations — must be done with the localStorage fallback intact and
  thoroughly tested in Phase 6E before relied upon in production (6F).

## N. Recommended Build Order

1. **6B** — Apply `012_internal_sync_engine.sql`, build
   `syncEventService.js`'s applier + `/api/sync/events` POST/GET, with
   no frontend changes yet (backend-only, testable via direct API calls).
2. **6C** — Build `syncQueueService.js` (IndexedDB outbox) and wire it to
   *also* enqueue (not yet replace) at the same call sites where
   `pos3Service.js`/queue services already write to localStorage — purely
   additive, zero behavior change for existing flows.
3. **6D** — Add the catch-up GET pull to E.A.T.'s pages, displayed
   alongside (not replacing) current localStorage-derived views, to prove
   parity before cutover.
4. **6E** — Execute and document every Scenario A-J in Section I against
   the real implementation (multi-tab/multi-browser-profile testing,
   simulated network loss).
5. **6F** — Only after 6E passes, switch read paths to backend-first with
   localStorage fallback, per the explicit "don't remove fallback" rule.

## O. Estimated Complexity

| Phase | Complexity | Primary risk |
|---|---|---|
| 6B Backend Event Store | Medium | Schema correctness, idempotency under concurrent writes |
| 6C Sync Queue Engine | Medium-High | IndexedDB reliability across browsers, ordering guarantees |
| 6D Device Synchronization | Medium | Catch-up pull correctness, avoiding duplicate UI renders |
| 6E Offline Recovery Testing | High (time, not code) | Requires real multi-device/network-loss test harness, not just unit tests |
| 6F Production Validation | Medium | Cutover risk if read-path switch is rushed |

No code changes were made this phase. `npm run build` was run as a
sanity check and passed cleanly (no errors; pre-existing chunk-size
warning only), confirming this design-only phase introduced no
regressions.
