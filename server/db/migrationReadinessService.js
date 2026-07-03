/**
 * EPRL — Migration Readiness Service
 * Compares expected migrations against applied migrations.
 */

import { existsSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const MIGRATIONS_DIR = join(__dirname, 'migrations')

export function getExpectedMigrations() {
  if (!existsSync(MIGRATIONS_DIR)) return []
  return readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort()
}

export async function getAppliedMigrations(pool) {
  if (!pool) return { ok: false, status: 'database_required', migrations: [] }
  try {
    const res = await pool.query(
      `SELECT filename FROM schema_migrations ORDER BY filename ASC`
    )
    return { ok: true, migrations: res.rows.map(r => r.filename) }
  } catch {
    return { ok: false, status: 'migration_table_missing', migrations: [] }
  }
}

export function getLatestExpectedMigration() {
  const migrations = getExpectedMigrations()
  return migrations.length > 0 ? migrations[migrations.length - 1] : null
}

export async function getLatestAppliedMigration(pool) {
  const result = await getAppliedMigrations(pool)
  if (!result.ok || result.migrations.length === 0) return null
  return result.migrations[result.migrations.length - 1]
}

export async function detectPendingMigrations(pool) {
  const expected = getExpectedMigrations()
  const applied  = await getAppliedMigrations(pool)
  if (!applied.ok) {
    return {
      ok: false,
      status: applied.status,
      pending: expected,
      pendingCount: expected.length,
    }
  }
  const pending = expected.filter(m => !applied.migrations.includes(m))
  return {
    ok:           pending.length === 0,
    status:       pending.length === 0 ? 'migrations_ready' : 'migrations_pending',
    pending,
    pendingCount: pending.length,
    applied:      applied.migrations,
    expected,
  }
}

export async function detectMigrationMismatch(pool) {
  const applied  = await getAppliedMigrations(pool)
  const expected = getExpectedMigrations()
  if (!applied.ok) return { ok: false, status: 'migration_table_missing', mismatch: false }
  const extra = applied.migrations.filter(m => !expected.includes(m))
  return {
    ok:       extra.length === 0,
    mismatch: extra.length > 0,
    status:   extra.length > 0 ? 'migration_mismatch' : 'migrations_consistent',
    extraMigrations: extra,
  }
}

export async function validateRequiredTables(pool) {
  const required = [
    'inventory_records','inventory_adjustments','inventory_audit_events',
    'reorder_approvals','receiving_records','receiving_items','operational_sync_events',
    'venue_inventory','inventory_events','product_availability_blocks',
    'reorder_vendors','reorder_recommendations','purchase_order_drafts',
    'purchase_order_items','reorder_demand_signals','inventory_receiving_previews',
  ]
  if (!pool) {
    return { ok: false, status: 'database_required', missing: required, present: [] }
  }
  try {
    const res = await pool.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
    `)
    const present = res.rows.map(r => r.table_name)
    const missing = required.filter(t => !present.includes(t))
    return {
      ok:      missing.length === 0,
      status:  missing.length === 0 ? 'required_tables_present' : 'required_tables_missing',
      missing,
      present: required.filter(t => present.includes(t)),
    }
  } catch {
    return { ok: false, status: 'database_unavailable', missing: required, present: [] }
  }
}

export async function validateRequiredIndexes(pool) {
  if (!pool) return { ok: false, status: 'database_required' }
  try {
    const res = await pool.query(`
      SELECT indexname FROM pg_indexes WHERE schemaname = 'public'
    `)
    const indexes = res.rows.map(r => r.indexname)
    return { ok: true, status: 'indexes_checked', indexCount: indexes.length }
  } catch {
    return { ok: false, status: 'database_unavailable' }
  }
}

export async function buildMigrationReadinessReport(pool) {
  if (!pool) {
    return {
      ok: false,
      status: 'database_required',
      expectedMigrations: getExpectedMigrations(),
      appliedMigrations: [],
      pendingMigrations: getExpectedMigrations(),
      latestExpected: getLatestExpectedMigration(),
      latestApplied: null,
      degradedMode: true,
      databaseRequired: true,
    }
  }
  const pending  = await detectPendingMigrations(pool)
  const tables   = await validateRequiredTables(pool)
  const latest   = await getLatestAppliedMigration(pool)
  return {
    ok:                pending.ok && tables.ok,
    status:            pending.status,
    expectedMigrations: getExpectedMigrations(),
    appliedMigrations:  pending.applied ?? [],
    pendingMigrations:  pending.pending ?? [],
    latestExpected:     getLatestExpectedMigration(),
    latestApplied:      latest,
    tableStatus:        tables,
    degradedMode:       false,
  }
}

export function buildMigrationPendingResponse(pending = []) {
  return {
    ok:               false,
    status:           'migrations_pending',
    message:          `${pending.length} migration(s) not yet applied`,
    pendingMigrations: pending,
    degradedMode:     true,
    databaseRequired: true,
    action:           'Run npm run db:migrate to apply pending migrations',
  }
}

export function buildMigrationMismatchResponse(extra = []) {
  return {
    ok:               false,
    status:           'migration_mismatch',
    message:          'Applied migrations contain entries not in expected set',
    extraMigrations:  extra,
    degradedMode:     true,
    action:           'Review migration history — extra entries may indicate manual changes',
  }
}
