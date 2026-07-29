# Database Foundation

> Phase: 2 of 19  
> Status: foundation_ready — not live without DATABASE_URL

---

## Why PostgreSQL Is Required

Every production feature in this platform depends on a real database:

- **POS360 Integration Hub** — provider tokens, item mappings, order sync logs, webhook events, audit logs
- **Stripe Connect** — payment splits, transfer records, webhook confirmations
- **Order Lifecycle** — order state machine transitions (draft → pending → submitted → completed)
- **Venue Onboarding** — venue records, Stripe account IDs, POS connections
- **Ticket Tapper Specials** — persistent approval state, event history, inventory counts
- **Money Bridge** — settlement records, partner payout tracking
- **Analytics & Reporting** — all historical data

Without `DATABASE_URL`, none of these can persist across server restarts.

---

## How DATABASE_URL Works

Set this environment variable to a valid PostgreSQL connection string:

```
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

The server reads `process.env.DATABASE_URL` at startup. If it is missing or invalid, the server falls back to **preview fallback mode** — no crash, no data persistence.

---

## How Preview Fallback Works

When `DATABASE_URL` is missing:

- All backend services use in-memory Maps and arrays
- Responses include `storageMode: "memory_fallback"` and `persistenceStatus: "preview_fallback"`
- Data does not survive a server restart
- The `/api/system/database/status` endpoint returns `databaseStatus: "database_required"`

**Preview fallback means the app can demonstrate behavior, but it does not prove database persistence.**

This is intentional. The system must never claim records are saved without a real database.

---

## How to Run Migrations

```bash
DATABASE_URL=postgresql://... npm run db:migrate
```

Without `DATABASE_URL`, the migration runner exits safely:

```
[runMigrations] DATABASE_URL not set — status: database_required. Skipping migrations.
```

With a live database, it:

1. Reads all `.sql` files from `server/db/migrations/` in filename order
2. Creates `schema_migrations` table if it doesn't exist
3. Skips already-applied migrations (idempotent)
4. Runs pending migrations wrapped in transactions
5. Records each applied migration in `schema_migrations`
6. Returns a summary: `{ migrationsFound, migrationsApplied, migrationsSkipped, migrationsFailed }`
7. **(Holistic Fix 5B-2B-2)** When run directly (`npm run db:migrate`,
   not the `runMigrations()` export used by health checks), also runs
   every required post-migration content seed (currently:
   `server/db/seeds/seedSmokecraftEducationalContent.mjs`, which
   populates `golden_box_component_catalog` and the tables that
   foreign-key to it — required by Seed & Soil, Skill Tree, and
   mentor-guidance's skill-gap signal) as a real child process, waited
   to completion. This closes SC-D054: before this fix, a genuinely
   fresh database passed every migration yet still had zero catalog
   rows, since nothing in the automated reset path ever ran the seed
   script. The seed is idempotent (`ON CONFLICT DO NOTHING`) and
   additive-only — safe to run on every `db:migrate` invocation,
   including one against a database that already has content. To run
   the seed on its own: `npm run db:seed`.

### A clean reset, step by step

```bash
# Drop and recreate the database (destructive — local/dev only)
psql -c "DROP DATABASE IF EXISTS <name>;" && psql -c "CREATE DATABASE <name>;"

# The one command that fully restores a working database: schema +
# required content, in one idempotent step.
DATABASE_URL=postgresql://... npm run db:migrate
```

No manual `INSERT` is ever required. `verify-smokecraft-hf5b2b1-mentor-voice-service.mjs`'s
sibling test, `verify-smokecraft-hf5b2b2-clean-reset-baseline.mjs`,
performs exactly this drop/recreate/`db:migrate` sequence against the
real database and asserts real content rows exist afterward — run it
any time this workflow needs re-verifying.

---

## What schema_migrations Does

Tracks which migration files have been applied to the database:

```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
  id         SERIAL PRIMARY KEY,
  filename   TEXT NOT NULL UNIQUE,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

This ensures migrations never run twice, even if the runner is called multiple times.

---

## Existing Migrations (18 files)

| # | File | Content |
|---|---|---|
| 001 | `001_initial_novee_schema.sql` | Initial schema |
| 002 | `002_admin_roles_security.sql` | Admin roles |
| 003 | `003_auth_hardening.sql` | Auth hardening |
| 004 | `004_pos3_provider_prep.sql` | POS3 prep |
| 005 | `005_pos3_operational_hardening.sql` | POS3 hardening |
| 006 | `006_device_deployment.sql` | Device deployment |
| 008 | `008_venue_testing.sql` | Venue testing |
| 009 | `009_demo_pilot_package.sql` | Demo/pilot |
| 010 | `010_new_roles_and_tables.sql` | New roles |
| 011 | `011_smokecraft_schema.sql` | SmokeCraft schema |
| 012 | `012_internal_sync_engine.sql` | Internal sync |
| 013 | `013_sync_reconciliation.sql` | Sync reconciliation |
| 014 | `014_sync_audit_lifecycle.sql` | Sync audit |
| 015 | `015_venue_commerce.sql` | Venue commerce |
| 016 | `016_pos3_commerce_foundation.sql` | POS3 commerce |
| 017 | `017_ticket_tapper_specials.sql` | 6 Ticket Tapper tables |
| 018 | `018_pos360_integration_hub.sql` | 9 POS360 tables |

---

## API: Database Status

```
GET /api/system/database/status
```

Response without `DATABASE_URL`:
```json
{
  "databaseStatus": "database_required",
  "persistenceStatus": "preview_fallback",
  "message": "DATABASE_URL is not configured. Running in preview fallback mode.",
  "migrationRunnerStatus": "database_required",
  "migrationsFolderFound": true,
  "migrationCount": 18,
  "lastCheckedAt": "2026-07-02T..."
}
```

Response with connected database:
```json
{
  "databaseStatus": "database_ready",
  "persistenceStatus": "persistence_ready",
  "message": "PostgreSQL connection verified.",
  "migrationRunnerStatus": "migration_applied",
  "migrationsFolderFound": true,
  "migrationCount": 18,
  "lastCheckedAt": "2026-07-02T..."
}
```

`DATABASE_URL` is never included in the response.

---

## Environment Variables Required

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes (for persistence) | PostgreSQL connection string |
| `ENCRYPTION_SECRET` | Yes (for POS tokens) | AES-256-CBC key for provider OAuth tokens |
| `NODE_ENV` | Recommended | `production` enables SSL on the DB connection |

---

## Safe Local Preview Behavior

Without `DATABASE_URL`:

- Server starts normally
- All SmokeCraft frontend features work in preview mode
- Ticket Tapper Specials work with in-memory fallback
- Money Bridge calculations work with preview tax
- POS360 hub responds with `provider_not_connected` and `manual_pos360` fallback
- No crash, no error screen

---

## Live vs Not Live

| Feature | Status |
|---|---|
| PostgreSQL persistence | `database_required` — DATABASE_URL not configured |
| Migration runner | `migration_ready` — runs safely when DATABASE_URL exists |
| Preview fallback | **active** — all services degrade gracefully |
| Stripe Connect | `missing` — Phase 3 of 19 |
| POS provider OAuth | `oauth_required` — credentials not set |
| Real-time events | `annotation_only` — WebSocket not wired |

---

## How Future Engines Depend on This Foundation

```
DATABASE_URL configured
        ↓
npm run db:migrate
        ↓
schema_migrations table created
        ↓
All 18 migrations applied
        ↓
POS360 tables available (018_pos360_integration_hub.sql)
Ticket Tapper tables available (017_ticket_tapper_specials.sql)
        ↓
Phase 3: Stripe Connect can write payment records
Phase 4: Order Lifecycle can persist state transitions
Phase 5: Venue Onboarding can persist venue records
...
```

Every subsequent phase requires this foundation.
