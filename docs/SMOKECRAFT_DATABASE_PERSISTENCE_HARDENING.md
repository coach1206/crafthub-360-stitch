# SmokeCraft Database Persistence Hardening

Production Phase A of L — NOVEE OS SmokeCraft Module

## Overview

This document describes the database persistence hardening work completed in Production Phase A. The goal of this phase was to replace or prepare all SmokeCraft `memory_fallback` storage areas with real database-backed persistence.

**Current Status:** Database schema contracts are ready. Migration 029 must be applied to create all SmokeCraft tables. Until that migration is applied and the connection is verified, all SmokeCraft data areas remain in `memory_fallback` mode.

## Memory Fallback Limitations

Without a configured and verified database, SmokeCraft loses all operational data when the server restarts. This includes:

- Orders (lost on restart)
- Staff queue items (lost on restart)
- Pairing profiles (lost on restart)
- Flavor Memory records (lost on restart)
- Reward records (lost on restart)
- Loyalty records (lost on restart)
- Passport reward records (lost on restart)
- Venue admin records (lost on restart)
- Analytics snapshots (lost on restart)
- Integration sync events (lost on restart)

## Database Adapter

`server/services/smokecraft/persistence/smokecraftDatabaseAdapter.js`

Wraps the project's existing `pg` connection layer with SmokeCraft-specific safe methods:

- `getDatabaseAdapterStatus()` — returns configured/verified status (never exposes DATABASE_URL value)
- `isDatabaseConfigured()` — boolean from `isDbAvailable()`
- `getPersistenceMode()` — `'database_config_detected'` or `'memory_fallback'`
- `safeRead()` / `safeWrite()` / `safeUpdate()` / `safeList()` — DB-first with silent fallback
- `safeDeletePreviewOnly()` — always returns an error; no production records deleted
- `getDatabaseWarnings()` — human-readable warning list

DATABASE_URL is **never logged, never sent to frontend, never exposed** in API responses.

## Persistence Registry

`server/services/smokecraft/persistence/smokecraftPersistenceRegistry.js`

Tracks 20 SmokeCraft data areas:

| Area | Table | Migration |
|------|-------|-----------|
| orders | smokecraft_orders | 029 |
| staff_queue | smokecraft_staff_queue | 029 |
| order_audit | smokecraft_order_audit | 029 |
| venue_menu | smokecraft_venue_menu | 029 |
| pairing_profiles | smokecraft_pairing_profiles | 029 |
| flavor_memory | smokecraft_flavor_memory | 029 |
| pairing_recommendations | smokecraft_pairing_recommendations | 029 |
| pairing_audit | smokecraft_pairing_audit | 029 |
| rewards | smokecraft_rewards | 029 |
| loyalty | smokecraft_loyalty_records | 029 |
| passport_rewards | smokecraft_passport_rewards | 029 |
| reward_audit | smokecraft_reward_audit | 029 |
| venue_admin | smokecraft_venue_admin | 029 |
| analytics_snapshots | smokecraft_analytics_snapshots | 029 |
| integration_sync_events | smokecraft_sync_events | 029 |
| production_sync_queue | smokecraft_sync_events | 029 |
| connector_audit | smokecraft_connector_audit | 029 |
| enterprise_governance_audit | smokecraft_governance_audit | 029 |
| final_qa_records | — (not applicable) | — |
| handoff_records | — (not applicable) | — |

## Persistence Health

`server/services/smokecraft/persistence/smokecraftPersistenceHealthService.js`

Reports:
- `databaseConfigured` — true if DATABASE_URL is present and `pg` pool is established
- `databaseVerified` — false until explicitly tested post-migration
- `overallPersistenceMode` — current mode across all areas
- `productionReady` — **always false** until database is configured, migration applied, and persistence verified
- `criticalAreasMemoryFallback` — list of critical areas still using memory only

**Critical areas** (data loss on restart if memory_fallback):
orders, staff_queue, pairing_profiles, flavor_memory, rewards, loyalty, passport_rewards, venue_admin, integration_sync_events, production_sync_queue, order_audit

## Migration Plan

`server/services/smokecraft/persistence/smokecraftPersistenceMigrationPlanService.js`

Creates a migration plan document. **Does NOT run migrations automatically.**

Migration file: `server/db/migrations/029_smokecraft_persistence_hardening.sql`

Safe migration rules:
1. All statements use `CREATE TABLE IF NOT EXISTS` — idempotent, safe to re-run
2. No tables are dropped
3. No existing data is altered or deleted
4. Apply with: `npm run db:migrate`
5. `safeToRun: false` — manual review required before applying

## Persistence Audit

`server/services/smokecraft/persistence/smokecraftPersistenceAuditService.js`

Audit entries for all persistence events:
- `smokeCraft.persistence.healthChecked`
- `smokeCraft.persistence.areaReviewed`
- `smokeCraft.persistence.databaseConfigDetected`
- `smokeCraft.persistence.memoryFallbackDetected`
- `smokeCraft.persistence.migrationPlanCreated`
- `smokeCraft.persistence.databaseVerified`
- `smokeCraft.persistence.productionBlocked`

Every entry: `containsSecrets: false`, `exposesPrivateData: false`.
DATABASE_URL is never logged.

## Areas Currently Database-Contract-Ready

All 18 table-backed areas have:
- Schema defined in migration 029
- Persistence service with DB write + memory fallback
- Persistence registry entry
- `databaseReady: true` (schema exists)
- `databaseVerified: false` (requires live DB verification)
- `usesMemoryFallback: true` (until DATABASE_URL is configured and migration applied)

## Areas Still memory_fallback

All areas remain `memory_fallback` until:
1. DATABASE_URL is configured in the production environment
2. Migration 029 is applied (`npm run db:migrate`)
3. Each table is verified to exist and accept reads/writes
4. `databaseVerified` is updated to `true` per area

## Production Blockers

These blockers from the original list remain:
- DATABASE_URL persistence not fully verified (this phase creates contracts but does not verify live DB)
- POS360 live sync not connected (Phase B)
- E.A.T. live sync not connected (Phase C)
- Live AI/pairing provider not connected (Phase D)

## API Routes

All persistence routes are available under `/api/modules/smokecraft/persistence/`:

| Endpoint | Description |
|----------|-------------|
| GET /status | Overall persistence status |
| GET /health | Persistence health report |
| GET /registry | All 20 areas with current modes |
| GET /area/:areaId | Single area status |
| GET /database | Database adapter status (no credentials) |
| GET /migration-plan | Full migration plan |
| POST /migration-plan/create | Create migration plan document |
| GET /audit | Persistence audit log |

## Production Phase A.1 — Database Activation

**Script:** `server/scripts/verifySmokeCraftDatabaseActivation.js`

**Run:** `npm run verify:smokecraft-database-activation`

Phase A.1 activates and verifies live database persistence. It runs automatically when DATABASE_URL is present.

### Steps performed:

1. **DATABASE_URL check** — If absent, exits 0 with setup instructions. Never prints the value.
2. **Migration** — Runs `npm run db:migrate` to apply migration 029.
3. **Connection check** — Calls `isDbAvailable()` to confirm the pool is up.
4. **Table existence** — Calls `verifyTableExists()` for each of the 17 unique tables.
5. **Read/write test** — Calls `runTableReadWriteTest()` per table: INSERT a test record, SELECT it, DELETE it. All test data is cleaned up.
6. **Registry update** — Calls `setAreaVerified(areaId, { databaseVerified, productionReady })` for each area that passes. Areas that fail remain `memory_fallback`.
7. **Critical area gate** — Checks 8 critical areas. Exits 0 only if all pass.

### Critical areas required for Phase B gate:

- orders, staff_queue, order_audit
- integration_sync_events, production_sync_queue
- connector_audit, venue_admin, analytics_snapshots

### DATABASE_URL setup (Railway):

1. Go to Railway → your project → Variables tab
2. Add `DATABASE_URL` pointing to your Postgres instance
3. Re-deploy, then run: `npm run verify:smokecraft-database-activation`
4. If all critical areas pass, Phase B (POS360 Live Connector) is safe to start.

### Area progression after activation:

| Before activation | After activation (table verified) |
|---|---|
| `database_contract_ready` | `database_verified` |
| `productionReady: false` | `productionReady: true` |
| `usesMemoryFallback: true` | `usesMemoryFallback: false` |

Areas whose table test fails remain `memory_fallback`. DATABASE_URL value is never logged at any step.

## Production Phase A.2 — Railway Live Database Activation

**Attempted:** 2026-07-03

**Result: BLOCKED — DATABASE_URL not present in cloud execution environment**

### Honest activation attempt log:

| Step | Result |
|---|---|
| DATABASE_URL detected | NO — not configured in this execution environment |
| Migration run | NOT EXECUTED — requires DATABASE_URL |
| Database connection | NOT AVAILABLE |
| Tables verified | 0 / 17 |
| Read/write tests | NOT RUN |
| Areas database_verified | 0 / 20 |
| Areas memory_fallback | 20 / 20 |
| Critical areas passed | 0 / 8 |
| productionReady | false |
| Phase B safe to begin | **NO** |

### What passed without DATABASE_URL:

| Script | Result |
|---|---|
| verify:smokecraft-database-activation | Exits 0 — setup instructions printed (correct behavior) |
| verify:smokecraft-database-persistence | 60/60 PASS |
| verify:smokecraft-final-qa-release-candidate | PASS |
| verify:smokecraft-enterprise-packaging | PASS |
| verify:smokecraft-production-sync-readiness | PASS |
| verify:smokecraft-venue-admin-operations | PASS |
| verify:smokecraft-rewards-monetization | PASS |
| verify:smokecraft-pairing-intelligence | PASS |
| verify:smokecraft-ordering-integration | PASS |
| verify:smokecraft-experience-module | PASS |
| verify:module-foundation | PASS |
| npm run build | PASS |

### What is required to complete Phase A.2 on Railway:

The activation script is deployed and ready. To complete live verification:

1. In Railway dashboard → your project → **Variables** tab
2. Provision a Postgres database (Railway Postgres plugin or external)
3. Copy the `DATABASE_URL` connection string into the Variables tab
4. **Redeploy** the service so the server picks up the new variable
5. In Railway's **Shell** or your terminal (with Railway env exported):
   ```
   npm run db:migrate
   npm run verify:smokecraft-database-activation
   ```
6. The activation script will:
   - Detect DATABASE_URL (value never printed)
   - Apply migration 029 (all 18 SmokeCraft tables, `CREATE TABLE IF NOT EXISTS`)
   - Verify all 17 unique tables exist
   - Run INSERT → SELECT → DELETE test per table (test data cleaned up)
   - Mark passing areas `database_verified` in the persistence registry
   - Report critical area gate: all 8 must pass for Phase B to begin
7. If exit code is 0 and all 8 critical areas pass → Phase B is safe to start

### DATABASE_URL is never printed at any step. No credentials appear in logs.

## What Phase B Should Handle Next

**PRODUCTION PHASE B OF L — POS360 Live Connector Implementation**

Phase B should connect real SmokeCraft orders to POS360 with:
- Confirmed POS order acceptance
- Item mapping between SmokeCraft menu items and POS SKUs
- Failed sync handling and retry logic
- Dead-letter queue for unrecoverable sync failures
- Honest `pos_sync_status` reporting (no fake `sent_to_pos`)
- Real connector replacing `not_connected` status
