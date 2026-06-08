/**
 * Database connection — PostgreSQL via `pg`, with graceful prototype-mode
 * fallback when DATABASE_URL is not set or the connection fails.
 *
 * Uses top-level await (valid in ES modules) to test the connection at
 * startup before any requests arrive.
 */

let pool = null

async function initPool() {
  if (!process.env.DATABASE_URL) {
    console.log('[NOVEE OS DB] No DATABASE_URL — prototype mode active (in-memory)')
    return
  }
  try {
    const pg = (await import('pg')).default
    pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
      max:              10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    })
    await pool.query('SELECT 1')   // smoke-test
    console.log('[NOVEE OS DB] PostgreSQL connected ✓')
  } catch (err) {
    console.warn('[NOVEE OS DB] PostgreSQL unavailable — prototype mode active:', err.message)
    pool = null
  }
}

await initPool()

/** Returns the pg Pool, or null if no DB is available. */
export const getDb = () => pool

/** True when a live PostgreSQL connection exists. */
export const isDbAvailable = () => pool !== null

/**
 * Run a parameterised query.
 * Throws if DB is not available — callers should guard with isDbAvailable().
 */
export const query = (sql, params = []) => {
  if (!pool) throw new Error('Database not available in prototype mode')
  return pool.query(sql, params)
}
