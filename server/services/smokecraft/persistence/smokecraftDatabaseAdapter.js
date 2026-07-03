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
