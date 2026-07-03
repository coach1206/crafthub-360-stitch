/**
 * EPRL — Database Connection Manager
 * Safe connection detection, status reporting, and redacted URL handling.
 * Never exposes raw DATABASE_URL in logs or responses.
 */

import { redactDatabaseUrl, assertNoSecretLeak } from '../utils/safeEnvironmentLogger.js'
import { validateDatabaseUrlShape } from '../services/environment/environmentReadinessService.js'

export function hasDatabaseUrl() {
  return !!process.env.DATABASE_URL
}

export function getDatabaseUrlRedacted() {
  const url = process.env.DATABASE_URL
  if (!url) return null
  return redactDatabaseUrl(url)
}

export async function validateDatabaseConnection() {
  if (!hasDatabaseUrl()) {
    return {
      ok:      false,
      status:  'missing_database_url',
      message: 'DATABASE_URL is not set — running in degraded mode',
      degradedMode: true,
    }
  }
  const shape = validateDatabaseUrlShape(process.env.DATABASE_URL)
  if (!shape.valid) {
    return {
      ok:      false,
      status:  'invalid_database_url',
      message: `DATABASE_URL shape invalid: ${shape.reason}`,
      degradedMode: true,
    }
  }
  return {
    ok:      true,
    status:  'url_valid',
    message: 'DATABASE_URL is present and valid — connection not tested without DB driver',
    redacted: getDatabaseUrlRedacted(),
    note:    'Live connection test requires active pool (db pool imported separately)',
  }
}

export async function testDatabaseConnection(pool) {
  if (!pool) {
    return { ok: false, status: 'missing_database_url', degradedMode: true }
  }
  try {
    await pool.query('SELECT 1')
    return {
      ok:      true,
      status:  'connected',
      message: 'Database connection successful',
      degradedMode: false,
    }
  } catch (err) {
    return {
      ok:      false,
      status:  'connection_failed',
      message: 'Database connection failed',
      errorCode: err.code ?? 'unknown',
      degradedMode: true,
    }
  }
}

export function getDatabaseConnectionStatus() {
  if (!hasDatabaseUrl()) {
    return { status: 'missing_database_url', degradedMode: true, databaseRequired: true }
  }
  const shape = validateDatabaseUrlShape(process.env.DATABASE_URL)
  if (!shape.valid) {
    return { status: 'invalid_database_url', reason: shape.reason, degradedMode: true, databaseRequired: true }
  }
  return {
    status:        'url_present',
    redacted:      getDatabaseUrlRedacted(),
    degradedMode:  false,
    databaseRequired: false,
    note:          'Connection pool status requires runtime pool query',
  }
}

export function getDatabasePoolStatus(pool) {
  if (!pool) return { status: 'pool_error', degradedMode: true, totalCount: 0, idleCount: 0, waitingCount: 0 }
  return {
    status:       'pool_ready',
    totalCount:   pool.totalCount   ?? 0,
    idleCount:    pool.idleCount    ?? 0,
    waitingCount: pool.waitingCount ?? 0,
    degradedMode: false,
  }
}

export async function closeDatabaseConnection(pool) {
  if (!pool) return { ok: false, status: 'no_pool' }
  try {
    await pool.end()
    return { ok: true, status: 'connection_closed' }
  } catch (err) {
    return { ok: false, status: 'close_failed', errorCode: err.code ?? 'unknown' }
  }
}

export function buildDatabaseUnavailableResponse(context = {}) {
  const response = {
    ok:               false,
    status:           'database_unavailable',
    message:          'Database is not available — running in degraded mode',
    degradedMode:     true,
    databaseRequired: true,
    persistenceMode:  'in_memory_only',
    ...context,
  }
  assertNoSecretLeak(response)
  return response
}

export function buildDatabaseRequiredResponse(context = {}) {
  const response = {
    ok:               false,
    status:           'database_required',
    message:          'DATABASE_URL required for this operation',
    degradedMode:     true,
    databaseRequired: true,
    persistenceMode:  'in_memory_only',
    ...context,
  }
  assertNoSecretLeak(response)
  return response
}
