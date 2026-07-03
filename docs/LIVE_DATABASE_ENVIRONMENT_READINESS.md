# EPRL — Live Database Environment Readiness (Phase 16)

## Overview

Phase 16 introduces the Environment Persistence Readiness Layer (EPRL), which sits above
database utilities and below OIPSL, ISPAE, DMRC, and all operational services.

EPRL controls environment detection, database readiness, and safe mode switching.
It does not replace Phase 15 persistence services — it governs whether they run in
`real_database` or `in_memory_only` mode.

## What Phase 16 Adds

- `environmentReadinessService.js` — detects NODE_ENV, APP_ENV, DATABASE_URL, deployment provider
- `databaseConnectionManager.js` — safe connection status, redacted URL, pool status
- `migrationReadinessService.js` — compares expected vs applied migrations
- `schemaReadinessService.js` — validates Phase 14/15 tables exist
- `persistenceModeService.js` — central switch: `real_database` vs `in_memory_only`
- `deploymentReadinessService.js` — Railway/Postgres checklist, production blockers
- `safeEnvironmentLogger.js` — redacts DATABASE_URL, Stripe keys, tokens from logs
- `eprlHealthController.js` + `eprlHealthRoutes.js` — health sub-routes
- 10 admin/manager UI components in `src/components/environment/`
- 8 new E.A.T. EPRL hooks in `eatCommandHubContract.js`
- `verifyEnvironmentReadiness.js` — 180+ assertion verification script

## What Remains Degraded Without DATABASE_URL

When `DATABASE_URL` is not set:

- `persistenceMode: 'in_memory_only'`
- `degradedMode: true`
- `databaseRequired: true`
- All Phase 15 persistence services return `persistenceStatus: 'in_memory_only'`
- Receiving confirmation returns `receiving_preview_only + adjusted_in_memory_only`
- Purchase orders remain at `reorder_not_submitted`
- Sync events remain `database_required`
- All data is lost on server restart

## How DATABASE_URL Changes Persistence Mode

When `DATABASE_URL` is set to a valid PostgreSQL URL:

1. `environmentReadinessService` detects `local_database`, `staging_database`, or `production_database`
2. `persistenceModeService` returns `persistenceMode: 'real_database'`
3. All Phase 15 persistence services can write to the database
4. Receiving confirmation can persist inventory adjustments
5. Purchase orders persist as drafts
6. Sync events queue as `sync_status: 'queued'`
7. Audit events write to `inventory_audit_events`

## How Migration Readiness Is Checked

`migrationReadinessService.js` reads all `.sql` files in `server/db/migrations/` and
compares them against the `schema_migrations` table in the database.

Functions:
- `getExpectedMigrations()` — scans the migrations directory
- `getAppliedMigrations(pool)` — queries `schema_migrations`
- `detectPendingMigrations(pool)` — finds unapplied migrations
- `buildMigrationReadinessReport(pool)` — full report

Without a database, all migration checks return `status: 'database_required'`.

## How Schema Readiness Is Checked

`schemaReadinessService.js` queries `information_schema.tables` to verify
that Phase 14/15 tables exist.

Sections checked:
- `inventory` — inventory_records, inventory_adjustments, inventory_audit_events
- `reorder` — reorder_recommendations, purchase_order_drafts, reorder_vendors
- `receiving` — receiving_records, receiving_items
- `sync` — operational_sync_events
- `vendor` — reorder_vendors, reorder_approvals
- `payment` — stripe_connect_accounts, payment_intents
- `pos360` — pos360_sessions, pos360_orders

Without a database, all schema checks return `status: 'database_required'`.

## How Health Routes Work

New sub-routes mounted at `/api/health/*`:

| Route | Returns |
|---|---|
| `GET /api/health/environment` | Environment mode, DATABASE_URL status, blockers |
| `GET /api/health/database` | Connection status, redacted URL, degraded mode |
| `GET /api/health/migrations` | Expected vs applied migrations, pending list |
| `GET /api/health/schema` | Per-subsystem table presence |
| `GET /api/health/persistence` | Current persistence mode, fallback status |
| `GET /api/health/inventory` | Inventory persistence readiness |
| `GET /api/health/reorder` | Reorder/PO persistence readiness |
| `GET /api/health/eat` | E.A.T. hook availability |
| `GET /api/health/pos360` | POS360 persistence + external sync status |
| `GET /api/health/ncie` | NCIE persistence status |
| `GET /api/health/deployment` | Full deployment readiness report |

All responses include `timestamp`, `degradedMode`, `persistenceMode`. No secrets exposed.

## How Deployment Readiness Works

`deploymentReadinessService.buildDeploymentReadinessReport()` returns:

- Environment mode and deployment provider
- Missing required env vars
- Production blockers (DATABASE_URL, Stripe keys, NODE_ENV)
- Staging warnings
- Safe env summary (redacted)
- Railway readiness checklist
- Postgres readiness checklist
- Per-subsystem readiness (database, migrations, payments, inventory, reorder, pos360, eat)

## Railway/Postgres Setup Expectations

To move from `degraded_mode` to `production_database`:

1. Attach Railway Postgres plugin → copies `DATABASE_URL` into env automatically
2. Set `NODE_ENV=production` in Railway variables
3. Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in Railway variables
4. Run `npm run db:migrate` in the deploy command or manually
5. Verify at `GET /api/health/environment` — status should be `production_database`

## What Not to Claim Yet

- `external_pos_required` — no live POS sync active
- `vendor_sync_not_live` — no vendor/distributor API push
- `reorder_not_submitted` — no purchase orders submitted to any external system
- `real_time_push_pending` — WebSocket/webhook sync not implemented
- `distributor_connection_required` — no distributor API connected
- `manufacturer_connection_required` — no manufacturer API connected

## What External POS/Vendor Sync Still Requires

- Phase 17+: WebSocket or webhook consumer for `operational_sync_events`
- Phase 17+: External POS API integration (resolves `external_pos_required`)
- Phase 17+: Vendor/distributor API (resolves `reorder_not_submitted`)
- Phase 17+: Automated reorder with manager approval gate

## What Phase 17 Should Handle Next

Phase 17 can begin building:
- Live vendor API ordering pipeline (with approval-first gate)
- External POS inventory push (webhook/WebSocket)
- Multi-user real-time availability sync
- Automated reorder threshold triggers
