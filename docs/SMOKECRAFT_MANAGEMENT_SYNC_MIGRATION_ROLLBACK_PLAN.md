# SmokeCraft Management Sync — Offline/Recovery Design (Phase 11) & Migration/Rollback Plan (Phase 12)

## Phase 11 — Offline and recovery design

No offline-sync infrastructure exists to reuse (Backend Architecture doc
§25 — confirmed none found). Per instruction ("Do not introduce an
offline queue unless persisted safely, venue scoped, user scoped,
idempotent, testable, auditable... If no safe queue exists, require
explicit retry after reconnection"): **this package does not design a
new offline queue.** Instead:

| Scenario | Behavior |
|---|---|
| Offline journey completion | Journey/snapshot data stays in `localStorage` (existing `SmokeCraftJourneyContext` behavior, unchanged) until the guest is back online and explicitly taps "Sync" — no background queue |
| Delayed sync | The `POST /sync` idempotency key means a delayed sync is safe to send whenever connectivity returns — no time-sensitivity in the key itself |
| Network interruption mid-request | Client sees a request failure; UI shows `offline`/`error` availability, no partial write occurs (the DB `INSERT` either commits or doesn't — no partial row) |
| Stale local snapshot | `payload_hash` (Phase 4) lets the server detect an unchanged resubmission; a stale snapshot with the same hash simply hits the same idempotency conflict, no duplicate |
| Duplicate retry | Handled by the idempotency design (Phase 8) |
| Failed sync | `status = 'failed'` row retained; explicit user-triggered retry required, no automatic background retry (no job runner exists to do this safely — Phase 1 §1/§25) |
| Reconnect | No special handling needed beyond normal browser `online` event already used elsewhere (`VenueSelect.jsx`, `SessionComplete.jsx`) to re-enable the "Sync" action |
| Version mismatch | A new `payload_version` is required for a resync of changed content (Phase 8) — an old client attempting to reuse a stale version against a since-changed snapshot is rejected with a 409-style conflict response (exact status code TBD in Package B), not silently overwritten |

## Phase 12 — Migration and rollback plan

Implementation-ready sequence for **Package A** (next package, not run
here):

1. **New table creation order** (respects FK dependencies):
   1. `smokecraft_management_sync_journeys`
   2. `smokecraft_management_sync_snapshots` (FK → journeys)
   3. `smokecraft_management_sync_events` (FK → journeys, snapshots)
   4. `smokecraft_management_sync_actions` (FK → journeys, nullable)
   5. `smokecraft_management_sync_venue_insights` (only if the on-demand
      vs. materialized decision, Phase 3 §D, lands on materialized —
      otherwise this table is deferred/skipped entirely)
2. **New indexes**: created in the same migration file as each table
   (per the migration-068 precedent of co-locating `CREATE INDEX` with
   `CREATE TABLE`), not deferred to a later file.
3. **New constraints**: all `CHECK`/`UNIQUE`/`FK` constraints defined
   inline at table-creation time (matches existing convention — no
   migrations here ever `ALTER TABLE ... ADD CONSTRAINT` after the fact).
4. **Optional backfill**: none needed — these are net-new tables with no
   prior data to migrate.
5. **Data validation**: post-migration smoke test — insert one journey +
   snapshot + event row with a real (test) `venue_id`, confirm the unique
   idempotency index rejects a duplicate insert, confirm cascade delete
   removes snapshots/events when a test journey is deleted.
6. **Deployment order**: migration file first (schema only, additive,
   `CREATE TABLE IF NOT EXISTS` — safe to deploy ahead of any code that
   uses it, same as every existing migration in this repo), then Package
   B (service/API), then Package C (frontend).
7. **Feature-flag strategy**: gate the new `POST /sync` write path and
   the frontend's "Sync" action behind a single boolean flag (naming/
   mechanism TBD — no existing feature-flag system was located in Phase
   1; this is a **REQUIRES IMPLEMENTATION** decision for Package B, not
   assumed to exist).
8. **Frontend compatibility**: `ManagementSync.jsx`'s current honest
   "not connected yet" disclosure (already shipped, this session) remains
   the default until Package C explicitly wires the new API — no
   frontend change is required at migration time.
9. **API rollout**: `GET` endpoints (read-only, low risk) can ship before
   `POST /sync` (write path) if a staged rollout is wanted — not required,
   but available as an option since the endpoints have no interdependency
   beyond needing the journey to exist for the `POST` to succeed.
10. **Rollback SQL**: since every `CREATE TABLE` uses `IF NOT EXISTS` and
    every migration in this repo is additive/non-destructive, rollback is
    simply *not running* migration 074+ (or `DROP TABLE IF EXISTS` for
    the 5 new tables, in reverse FK order, if a hard rollback is ever
    needed):
    ```sql
    DROP TABLE IF EXISTS smokecraft_management_sync_venue_insights;
    DROP TABLE IF EXISTS smokecraft_management_sync_actions;
    DROP TABLE IF EXISTS smokecraft_management_sync_events;
    DROP TABLE IF EXISTS smokecraft_management_sync_snapshots;
    DROP TABLE IF EXISTS smokecraft_management_sync_journeys;
    ```
    No existing table is ever altered, so no existing-table rollback is
    needed.
11. **Partial-deployment handling**: because the new tables are additive
    and the frontend isn't wired until Package C, a partially-deployed
    state (schema live, API not yet live, or API live, frontend not yet
    wired) is safe by construction — nothing reads from or depends on the
    new tables until Package C ships.
12. **Preview-only service retirement/isolation**:
    `smokecraftEatSyncBridgeService.js` is **not retired or modified**
    by this design — it remains an isolated, separate, honestly-labeled
    preview stub for a different concern (E.A.T. order bridging).
    Management Sync's new tables/services are fully independent of it.
13. **No-data-loss rollback**: guaranteed by construction — rollback only
    ever `DROP`s the 5 new, empty-until-used tables; no existing table or
    existing user data is ever touched by this plan.
