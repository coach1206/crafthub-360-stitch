/**
 * SmokeCraft Database Adapter
 * Wraps the project's pg database layer with SmokeCraft-specific safe methods.
 * Never exposes DATABASE_URL or secret values.
 */

import { isDbAvailable, query } from '../../../db/connection.js'

export function getDatabaseAdapterStatus() {
  const configured = isDbAvailable()
  return {
    adapterId:      'smokecraft-db-adapter-v1',
    configured,
    verified:       false,
    persistenceMode: configured ? 'database_config_detected' : 'memory_fallback',
    productionReady: false,
    databaseUrlPresent: !!(process.env.DATABASE_URL),
    note: configured
      ? 'Database connection pool is available. Run migration 029 to ensure SmokeCraft tables exist.'
      : 'No DATABASE_URL configured. Adapter is in memory_fallback mode.',
  }
}

export function isDatabaseConfigured() {
  return isDbAvailable()
}

export function isDatabaseVerified() {
  return false
}

export function getPersistenceMode() {
  return isDbAvailable() ? 'database_config_detected' : 'memory_fallback'
}

export async function safeRead(areaId, sql, params = []) {
  if (!isDbAvailable()) {
    return { rows: [], rowCount: 0, persistenceMode: 'memory_fallback', error: null }
  }
  try {
    const result = await query(sql, params)
    return { rows: result.rows, rowCount: result.rowCount, persistenceMode: 'database', error: null }
  } catch (err) {
    return { rows: [], rowCount: 0, persistenceMode: 'memory_fallback', error: err.message }
  }
}

export async function safeWrite(areaId, sql, params = []) {
  if (!isDbAvailable()) {
    return { success: false, persistenceMode: 'memory_fallback', error: 'database_not_available' }
  }
  try {
    const result = await query(sql, params)
    return { success: true, rowCount: result.rowCount, persistenceMode: 'database', error: null }
  } catch (err) {
    return { success: false, persistenceMode: 'memory_fallback', error: err.message }
  }
}

export async function safeUpdate(areaId, sql, params = []) {
  return safeWrite(areaId, sql, params)
}

export async function safeList(areaId, sql, params = []) {
  return safeRead(areaId, sql, params)
}

export async function safeDeletePreviewOnly(areaId, sql, params = []) {
  return {
    success: false,
    persistenceMode: getPersistenceMode(),
    error: 'safe_delete_preview_only — deletion of production records is not permitted in this phase',
  }
}

export async function verifyTableExists(tableName) {
  if (!isDbAvailable()) return { exists: false, error: 'database_not_available' }
  try {
    const res = await query(
      `SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1`,
      [tableName]
    )
    return { exists: res.rowCount > 0, table: tableName }
  } catch (err) {
    return { exists: false, table: tableName, error: err.message }
  }
}

export async function runTableReadWriteTest(tableName, testId) {
  if (!isDbAvailable()) return { passed: false, error: 'database_not_available' }

  const TABLE_TESTS = {
    smokecraft_orders: {
      insert: `INSERT INTO smokecraft_orders (order_id, order_mode, order_status, source_module)
               VALUES ($1, 'test', 'draft', 'smokecraft-phase-a-test')`,
      select: `SELECT order_id FROM smokecraft_orders WHERE order_id=$1`,
      delete: `DELETE FROM smokecraft_orders WHERE order_id=$1`,
    },
    smokecraft_staff_queue: {
      insert: `INSERT INTO smokecraft_staff_queue (queue_id, queue_type, status, priority)
               VALUES ($1, 'test', 'queued', 0)`,
      select: `SELECT queue_id FROM smokecraft_staff_queue WHERE queue_id=$1`,
      delete: `DELETE FROM smokecraft_staff_queue WHERE queue_id=$1`,
    },
    smokecraft_order_audit: {
      insert: `INSERT INTO smokecraft_order_audit (audit_id, event_type) VALUES ($1, 'phase_a_test')`,
      select: `SELECT audit_id FROM smokecraft_order_audit WHERE audit_id=$1`,
      delete: `DELETE FROM smokecraft_order_audit WHERE audit_id=$1`,
    },
    smokecraft_sync_events: {
      insert: `INSERT INTO smokecraft_sync_events (event_id, event_type, sync_status) VALUES ($1, 'phase_a_test', 'not_connected')`,
      select: `SELECT event_id FROM smokecraft_sync_events WHERE event_id=$1`,
      delete: `DELETE FROM smokecraft_sync_events WHERE event_id=$1`,
    },
    smokecraft_connector_audit: {
      insert: `INSERT INTO smokecraft_connector_audit (audit_id, event_type) VALUES ($1, 'phase_a_test')`,
      select: `SELECT audit_id FROM smokecraft_connector_audit WHERE audit_id=$1`,
      delete: `DELETE FROM smokecraft_connector_audit WHERE audit_id=$1`,
    },
    smokecraft_venue_admin: {
      insert: `INSERT INTO smokecraft_venue_admin (admin_id, action_type) VALUES ($1, 'phase_a_test')`,
      select: `SELECT admin_id FROM smokecraft_venue_admin WHERE admin_id=$1`,
      delete: `DELETE FROM smokecraft_venue_admin WHERE admin_id=$1`,
    },
    smokecraft_analytics_snapshots: {
      insert: `INSERT INTO smokecraft_analytics_snapshots (snapshot_id) VALUES ($1)`,
      select: `SELECT snapshot_id FROM smokecraft_analytics_snapshots WHERE snapshot_id=$1`,
      delete: `DELETE FROM smokecraft_analytics_snapshots WHERE snapshot_id=$1`,
    },
    smokecraft_pairing_profiles: {
      insert: `INSERT INTO smokecraft_pairing_profiles (profile_id) VALUES ($1)`,
      select: `SELECT profile_id FROM smokecraft_pairing_profiles WHERE profile_id=$1`,
      delete: `DELETE FROM smokecraft_pairing_profiles WHERE profile_id=$1`,
    },
    smokecraft_flavor_memory: {
      insert: `INSERT INTO smokecraft_flavor_memory (memory_id) VALUES ($1)`,
      select: `SELECT memory_id FROM smokecraft_flavor_memory WHERE memory_id=$1`,
      delete: `DELETE FROM smokecraft_flavor_memory WHERE memory_id=$1`,
    },
    smokecraft_pairing_recommendations: {
      insert: `INSERT INTO smokecraft_pairing_recommendations (recommendation_id) VALUES ($1)`,
      select: `SELECT recommendation_id FROM smokecraft_pairing_recommendations WHERE recommendation_id=$1`,
      delete: `DELETE FROM smokecraft_pairing_recommendations WHERE recommendation_id=$1`,
    },
    smokecraft_pairing_audit: {
      insert: `INSERT INTO smokecraft_pairing_audit (audit_id, event_type) VALUES ($1, 'phase_a_test')`,
      select: `SELECT audit_id FROM smokecraft_pairing_audit WHERE audit_id=$1`,
      delete: `DELETE FROM smokecraft_pairing_audit WHERE audit_id=$1`,
    },
    smokecraft_rewards: {
      insert: `INSERT INTO smokecraft_rewards (reward_id) VALUES ($1)`,
      select: `SELECT reward_id FROM smokecraft_rewards WHERE reward_id=$1`,
      delete: `DELETE FROM smokecraft_rewards WHERE reward_id=$1`,
    },
    smokecraft_loyalty_records: {
      insert: `INSERT INTO smokecraft_loyalty_records (loyalty_id) VALUES ($1)`,
      select: `SELECT loyalty_id FROM smokecraft_loyalty_records WHERE loyalty_id=$1`,
      delete: `DELETE FROM smokecraft_loyalty_records WHERE loyalty_id=$1`,
    },
    smokecraft_passport_rewards: {
      insert: `INSERT INTO smokecraft_passport_rewards (passport_id) VALUES ($1)`,
      select: `SELECT passport_id FROM smokecraft_passport_rewards WHERE passport_id=$1`,
      delete: `DELETE FROM smokecraft_passport_rewards WHERE passport_id=$1`,
    },
    smokecraft_reward_audit: {
      insert: `INSERT INTO smokecraft_reward_audit (audit_id, event_type) VALUES ($1, 'phase_a_test')`,
      select: `SELECT audit_id FROM smokecraft_reward_audit WHERE audit_id=$1`,
      delete: `DELETE FROM smokecraft_reward_audit WHERE audit_id=$1`,
    },
    smokecraft_venue_menu: {
      insert: `INSERT INTO smokecraft_venue_menu (menu_id, menu_source) VALUES ($1, 'test')`,
      select: `SELECT menu_id FROM smokecraft_venue_menu WHERE menu_id=$1`,
      delete: `DELETE FROM smokecraft_venue_menu WHERE menu_id=$1`,
    },
    smokecraft_governance_audit: {
      insert: `INSERT INTO smokecraft_governance_audit (audit_id, event_type) VALUES ($1, 'phase_a_test')`,
      select: `SELECT audit_id FROM smokecraft_governance_audit WHERE audit_id=$1`,
      delete: `DELETE FROM smokecraft_governance_audit WHERE audit_id=$1`,
    },
    smokecraft_persistence_audit: {
      insert: `INSERT INTO smokecraft_persistence_audit (audit_id, event_type, database_configured, database_verified, production_ready, contains_secrets, exposes_private_data) VALUES ($1, 'phase_a_test', false, false, false, false, false)`,
      select: `SELECT audit_id FROM smokecraft_persistence_audit WHERE audit_id=$1`,
      delete: `DELETE FROM smokecraft_persistence_audit WHERE audit_id=$1`,
    },
  }

  const spec = TABLE_TESTS[tableName]
  if (!spec) return { passed: false, error: `no_test_spec_for_${tableName}` }

  const result = { table: tableName, testId, insertPassed: false, selectPassed: false, deletePassed: false, passed: false, error: null }

  try {
    await query(spec.insert, [testId])
    result.insertPassed = true
  } catch (err) {
    result.error = `insert_failed: ${err.message}`
    return result
  }
  try {
    const sel = await query(spec.select, [testId])
    result.selectPassed = sel.rowCount > 0
  } catch (err) {
    result.error = `select_failed: ${err.message}`
  }
  try {
    await query(spec.delete, [testId])
    result.deletePassed = true
  } catch (err) {
    result.error = result.error ?? `delete_failed: ${err.message}`
  }

  result.passed = result.insertPassed && result.selectPassed && result.deletePassed
  return result
}

export function getDatabaseWarnings() {
  const configured = isDbAvailable()
  const warnings   = []
  if (!configured) {
    warnings.push('DATABASE_URL is not configured. SmokeCraft is running in memory_fallback mode.')
    warnings.push('All SmokeCraft operational data will be lost on server restart.')
    warnings.push('Run migration 029 against a configured database to enable persistence.')
  } else {
    warnings.push('DATABASE_URL is detected but SmokeCraft database persistence is not yet verified.')
    warnings.push('Ensure migration 029 has been applied before marking any area production-ready.')
  }
  return warnings
}
