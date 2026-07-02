/**
 * Database Foundation — server/db/index.js
 *
 * Wraps the pg connection with safe helpers.
 * Falls back to preview_fallback when DATABASE_URL is missing.
 * Never crashes the server when the database is unavailable.
 */

import { getDb, isDbAvailable, query as rawQuery } from './connection.js'

export { getDb, isDbAvailable }

export function getDatabaseStatus() {
  if (!process.env.DATABASE_URL) {
    return {
      databaseStatus: 'database_required',
      persistenceStatus: 'preview_fallback',
      message: 'DATABASE_URL is not configured. Running in preview fallback mode.',
    }
  }
  if (!isDbAvailable()) {
    return {
      databaseStatus: 'database_required',
      persistenceStatus: 'preview_fallback',
      message: 'DATABASE_URL is set but PostgreSQL connection is unavailable. Running in preview fallback mode.',
    }
  }
  return {
    databaseStatus: 'database_ready',
    persistenceStatus: 'persistence_ready',
    message: 'PostgreSQL connection verified.',
  }
}

export function isDatabaseReady() {
  return isDbAvailable()
}

/**
 * Safe query helper — returns { rows: [], rowCount: 0, error } instead of throwing
 * when the database is unavailable.
 */
export async function safeQuery(sql, params = []) {
  if (!isDbAvailable()) {
    return {
      rows: [],
      rowCount: 0,
      databaseStatus: 'database_required',
      persistenceStatus: 'preview_fallback',
      error: 'Database not available. Query not executed.',
    }
  }
  try {
    const result = await rawQuery(sql, params)
    return result
  } catch (err) {
    return {
      rows: [],
      rowCount: 0,
      databaseStatus: 'database_required',
      persistenceStatus: 'preview_fallback',
      error: err.message,
    }
  }
}

/**
 * Transaction helper — executes callback(client) inside BEGIN/COMMIT.
 * Returns preview_fallback when database is unavailable.
 */
export async function withTransaction(callback) {
  if (!isDbAvailable()) {
    return {
      ok: false,
      databaseStatus: 'database_required',
      persistenceStatus: 'preview_fallback',
      message: 'Transaction not executed. DATABASE_URL not configured or database unavailable.',
    }
  }
  const db = getDb()
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return { ok: true, result }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    return {
      ok: false,
      databaseStatus: 'database_required',
      error: err.message,
    }
  } finally {
    client.release()
  }
}

export async function closeDatabasePool() {
  const db = getDb()
  if (db) {
    await db.end().catch(() => {})
  }
}
