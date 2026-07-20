# SmokeCraft Management Sync — Package A Readiness Validation (Parts 8-9)

## Part 8 — Per-table validation against confirmed repository facts

| Table | Real venue FK | Real user FK | Guest-reference design | Journey/session ID type | Migration-runner compatible | Naming convention | Timestamp convention | JSON convention | UUID/int convention | Index/FK naming | Schema conflicts | Rollback compatible | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `smokecraft_management_sync_journeys` | `venue_id TEXT REFERENCES venues(venue_id)` — corrected from the original doc's unresolved placeholder, now a real target | `user_id TEXT` nullable, no FK yet (System 1/System 2 user-table ambiguity unresolved, see role audit #1) | `guest_reference TEXT NOT NULL` per the new guest-identity design | UUID (`journey_id`) | yes (`CREATE TABLE IF NOT EXISTS`, filename `074_...`) | matches `smokecraft_management_sync_*` prefix, no collision found | `TIMESTAMPTZ ... DEFAULT NOW()`, matches convention | n/a (no JSON columns on this table) | UUID via `gen_random_uuid()`, matches convention | `idx_` prefix, matches convention | none found | yes (`DROP TABLE IF EXISTS`) | **REQUIRES DESIGN CHANGE** — `user_id` FK target intentionally left soft (TEXT, no FK) until the System 1/System 2 user-table ambiguity (role audit finding #1) is resolved; not a blocker, but not "READY" as originally drafted either |
| `smokecraft_management_sync_snapshots` | n/a (inherits venue scope via `journey_id` FK) | n/a | n/a | UUID (`snapshot_id`), FK to `journey_id` | yes | matches | matches | `JSONB` columns, matches `passport_360_*`/`ticket_tapper_*` precedent of using JSONB for structured payloads | UUID | matches | none found | yes | **READY FOR MIGRATION** |
| `smokecraft_management_sync_events` | inherits via `journey_id`; also carries its own `venue_id TEXT` for the idempotency composite key (by design, not a redundancy bug — needed in the unique index itself) | n/a | `guest_reference TEXT NOT NULL` | UUID (`event_id`) | yes | matches | matches | `audit_metadata JSONB`, matches convention | UUID | matches | none found | yes | **READY FOR MIGRATION** |
| `smokecraft_management_sync_venue_insights` | `venue_id TEXT PRIMARY KEY REFERENCES venues(venue_id)` | n/a | n/a | n/a | yes, if built (see tradeoff decision) | matches | `last_computed_at TIMESTAMPTZ` | none | n/a (TEXT PK) | matches | none found | yes | **REQUIRES DESIGN CHANGE** — deferred to a later package per the on-demand-first recommendation already made in the schema doc; not part of Package A's initial migration |
| `smokecraft_management_sync_actions` | `venue_id TEXT NOT NULL` (no FK specified in the original doc — corrected here to `REFERENCES venues(venue_id)`) | `actor_user_id TEXT NOT NULL` (same soft-FK caveat as `journeys.user_id`) | n/a (actions are staff/manager-initiated, not guest) | UUID (`action_id`), `journey_id UUID NULL` (soft FK, nullable) | yes | matches | matches | `metadata JSONB`, matches | UUID | matches | none found | yes | **READY FOR MIGRATION** |

## Part 9 — Updated Package A build plan (verified facts only)

1. **Exact migration filename**: `server/db/migrations/074_smokecraft_management_sync.sql`
   (next sequential number after `073_novee_entry_demo_sessions.sql`,
   confirmed by `ls server/db/migrations | tail -1` this pass).
2. **Exact tables** (Package A scope — 4 tables, `venue_insights`
   deferred per the on-demand decision): `smokecraft_management_sync_journeys`,
   `smokecraft_management_sync_snapshots`, `smokecraft_management_sync_events`,
   `smokecraft_management_sync_actions`.
3. **Exact columns/SQL types**: as specified in
   `SMOKECRAFT_MANAGEMENT_SYNC_DATABASE_SCHEMA.md`, with these two
   corrections from this package's findings: (a) `venue_id` on all four
   tables is `TEXT REFERENCES venues(venue_id)` — **not** a default-less
   assumption anymore, now backed by the confirmed `venues` table; (b)
   `user_id`/`actor_user_id` remain plain `TEXT`, **no FK**, until the
   System 1 (`system_users`) vs. System 2 (`novee_os_platform_users`)
   ambiguity is resolved — adding a wrong FK now would be worse than no
   FK.
4. **Exact foreign keys**:
   - `smokecraft_management_sync_journeys.venue_id → venues(venue_id)`
   - `smokecraft_management_sync_snapshots.journey_id → smokecraft_management_sync_journeys(journey_id) ON DELETE CASCADE`
   - `smokecraft_management_sync_events.journey_id → smokecraft_management_sync_journeys(journey_id) ON DELETE CASCADE`
   - `smokecraft_management_sync_events.snapshot_id → smokecraft_management_sync_snapshots(snapshot_id)`
   - `smokecraft_management_sync_events.venue_id → venues(venue_id)`
   - `smokecraft_management_sync_actions.venue_id → venues(venue_id)`
   - `smokecraft_management_sync_actions.journey_id → smokecraft_management_sync_journeys(journey_id)` (nullable)
5. **Exact indexes**: `idx_sms_journeys_venue_status ON
   smokecraft_management_sync_journeys(venue_id, status)`;
   `idx_sms_journeys_user ON ...(user_id)`;
   `idx_sms_journeys_guest_ref ON ...(guest_reference)`;
   `idx_sms_snapshots_journey_version ON
   smokecraft_management_sync_snapshots(journey_id, snapshot_version)`;
   `idx_sms_actions_venue ON smokecraft_management_sync_actions(venue_id)`.
6. **Exact unique constraints**: `UNIQUE (journey_id, payload_hash)` on
   `snapshots`; `UNIQUE (venue_id, journey_id, destination,
   payload_version)` on `events` (the idempotency key, Phase 8).
7. **Exact check constraints**: `journeys.session_number BETWEEN 1 AND
   27`; `journeys.status IN ('in_progress','completed','abandoned')`;
   `snapshots.rating BETWEEN 1 AND 5`; `snapshots.return_intent IN
   ('yes','no','maybe')`; `events.destination IN ('venue_insights',
   'eat_360','pos_360','novee_os','inventory','staff_handoff')`;
   `events.status IN ('pending','completed','failed')`;
   `actions.action_type IN ('analytics_viewed','staff_feedback_submitted',
   'inventory_handoff_requested','sync_requested','sync_completed','sync_failed')`.
8. **Exact guest identity reference**: `guest_reference TEXT NOT NULL`
   on `journeys` and `events`, populated from the new guest-JWT `sub`
   claim (Part 4 design) — **the guest-identity issuing
   endpoint/middleware itself is Package B scope, not Package A**;
   Package A's schema only needs the column to exist.
9. **Exact migration-runner command**: `npm run db:migrate` (→ `node
   server/db/runMigrations.js`), confirmed real this pass.
10. **Exact local validation command**: `npm run db:migrate` against a
    local/dev `DATABASE_URL`, then a one-off Node script (not yet
    written) that inserts one test journey/snapshot/event row and
    confirms the unique index rejects a duplicate `INSERT`.
11. **Exact test-database validation**: same script run against a
    disposable test database — no dedicated test-DB tooling was found
    in this repo this pass, so this remains a manual step until/unless a
    test-DB harness is added.
12. **Exact production deployment sequence**: deploy code containing
    `074_...sql` → **manually run** `npm run db:migrate` against
    production `DATABASE_URL` (automatic-on-deploy is **not** confirmed,
    per the migration runner audit's Railway finding) → verify via
    `getMigrationStatus()` (already exported by `runMigrations.js`) that
    `074_smokecraft_management_sync.sql` shows `applied`.
13. **Exact rollback SQL**: `DROP TABLE IF EXISTS
    smokecraft_management_sync_actions;` then `..._events;` then
    `..._snapshots;` then `..._journeys;` (reverse FK order), plus
    optionally `DELETE FROM schema_migrations WHERE filename =
    '074_smokecraft_management_sync.sql';`.
14. **Exact files to create**: `server/db/migrations/074_smokecraft_management_sync.sql` only.
15. **Exact files to modify**: none — Package A is additive-only, no
    existing file needs a change (the migration runner already picks up
    new files automatically, per its audited behavior).
16. **Package A tests**: one new Node smoke-test script (not yet
    written) covering insert/duplicate-reject/cascade-delete.
17. **Package A proof**: script output showing the 3 assertions above
    passing against a real (dev) Postgres instance.
18. **Acceptance criteria**: migration applies cleanly; `schema_migrations`
    records it; the 3 smoke-test assertions pass; no existing table
    altered (verified via `git diff` touching only the new migration
    file).
19. **Security gates**: none apply to Package A itself (schema only, no
    endpoints) — Package B is where `requireAuth`/venue-membership
    checks must be implemented before any endpoint goes live.
20. **Stop conditions**: do not proceed to Package B until (a) the
    System 1 vs. System 2 user-table question is resolved (affects
    whether `user_id`/`actor_user_id` ever get a real FK), and (b) the
    guest-identity JWT design (Part 4) has an explicit go/no-go decision,
    since Package B's guest-facing endpoints depend on it entirely.

## Net readiness

**3 of 5 originally-proposed tables are READY FOR MIGRATION as designed.**
2 require the design adjustments already folded into this document
(soft `user_id`, deferred `venue_insights`) — both are now resolved
*decisions*, not open blockers, so Package A can proceed with 4 tables
once approved.

## Addendum — implemented and verified (this package)

Package A was approved and built. All 4 tables (with the soft `user_id`
and deferred `venue_insights` decisions applied exactly as recommended
above) now exist in a real, tested database instance — 4 tables, 8 FKs,
15 indexes, 23 constraints, 16/16 behavior-test assertions passed,
rollback tested twice (transactional and committed). Full record:
`SMOKECRAFT_MANAGEMENT_SYNC_PACKAGE_A_IMPLEMENTATION.md`,
`_PACKAGE_A_SCHEMA_REPORT.md`, `_PACKAGE_A_TEST_REPORT.md`,
`_PACKAGE_A_ROLLBACK.md`. Package B handoff contract:
`_PACKAGE_B_HANDOFF.md`.
