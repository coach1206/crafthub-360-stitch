/**
 * Migration runner for CraftHub 360 Stitch.
 * Reads SQL files from server/db/migrations/, runs them in alphabetical order,
 * and tracks applied migrations in the schema_migrations table.
 *
 * If DATABASE_URL is missing, logs honestly and returns without crashing.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

let getDb;
try {
  const conn = await import('./connection.js');
  getDb = conn.getDb;
} catch (err) {
  // connection module unavailable — will be handled per-call
  getDb = null;
}

/**
 * Ensure the schema_migrations tracking table exists.
 */
async function ensureMigrationsTable(db) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id          SERIAL PRIMARY KEY,
      filename    TEXT NOT NULL UNIQUE,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

/**
 * Return the list of already-applied migration filenames.
 */
async function getAppliedMigrations(db) {
  const result = await db.query(
    'SELECT filename FROM schema_migrations ORDER BY filename ASC'
  );
  return new Set(result.rows.map((r) => r.filename));
}

/**
 * Mark a migration as applied.
 */
async function recordMigration(db, filename) {
  await db.query(
    'INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING',
    [filename]
  );
}

/**
 * Run all pending SQL migrations in order.
 * @returns {Promise<{ status: string, applied: string[], skipped: string[], error?: string }>}
 */
export async function runMigrations() {
  if (!process.env.DATABASE_URL) {
    console.log(
      '[runMigrations] DATABASE_URL not set — status: database_required. Skipping migrations.'
    );
    return {
      databaseStatus: 'database_required',
      persistenceStatus: 'preview_fallback',
      status: 'database_required',
      message: 'DATABASE_URL not configured. Migrations not run. Running in preview fallback mode.',
      migrationsFound: 0,
      migrationsApplied: 0,
      migrationsSkipped: 0,
      migrationsFailed: 0,
      applied: [],
      skipped: [],
    };
  }

  if (!getDb) {
    console.warn(
      '[runMigrations] getDb unavailable — status: database_required.'
    );
    return {
      status: 'database_required',
      message: 'Database connection module unavailable.',
      applied: [],
      skipped: [],
    };
  }

  let db;
  try {
    db = getDb();
  } catch (err) {
    console.error('[runMigrations] Failed to get DB connection:', err.message);
    return {
      status: 'database_required',
      message: `DB connection failed: ${err.message}`,
      applied: [],
      skipped: [],
    };
  }

  // Read migration files
  let files;
  try {
    files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort(); // alphabetical = chronological when files are named with timestamps/numbers
  } catch (err) {
    console.error('[runMigrations] Cannot read migrations directory:', err.message);
    return {
      status: 'sync_required',
      message: `Cannot read migrations directory: ${err.message}`,
      applied: [],
      skipped: [],
    };
  }

  try {
    await ensureMigrationsTable(db);
  } catch (err) {
    console.error('[runMigrations] Cannot ensure migrations table:', err.message);
    return {
      status: 'database_required',
      message: `Cannot create schema_migrations table: ${err.message}`,
      applied: [],
      skipped: [],
    };
  }

  const applied = new Set();
  try {
    const prev = await getAppliedMigrations(db);
    applied.forEach((f) => applied.add(f));
    // rebuild from db result
    for (const f of prev) applied.add(f);
  } catch (err) {
    console.error('[runMigrations] Cannot read applied migrations:', err.message);
    return {
      status: 'database_required',
      message: `Cannot read applied migrations: ${err.message}`,
      applied: [],
      skipped: [],
    };
  }

  const ranThisRun = [];
  const skipped = [];

  for (const filename of files) {
    if (applied.has(filename)) {
      skipped.push(filename);
      continue;
    }

    const filePath = path.join(MIGRATIONS_DIR, filename);
    let sql;
    try {
      sql = fs.readFileSync(filePath, 'utf8');
    } catch (err) {
      console.error(`[runMigrations] Cannot read ${filename}:`, err.message);
      return {
        status: 'sync_required',
        message: `Cannot read migration file ${filename}: ${err.message}`,
        applied: ranThisRun,
        skipped,
      };
    }

    try {
      await db.query('BEGIN');
      await db.query(sql);
      await recordMigration(db, filename);
      await db.query('COMMIT');
      ranThisRun.push(filename);
      console.log(`[runMigrations] Applied: ${filename}`);
    } catch (err) {
      await db.query('ROLLBACK').catch(() => {});
      console.error(`[runMigrations] Failed on ${filename}:`, err.message);
      return {
        status: 'sync_required',
        message: `Migration failed on ${filename}: ${err.message}`,
        applied: ranThisRun,
        skipped,
        failedOn: filename,
      };
    }
  }

  const summary = {
    databaseStatus: 'database_ready',
    migrationsFound: files.length,
    migrationsApplied: ranThisRun.length,
    migrationsSkipped: skipped.length,
    migrationsFailed: 0,
    status: ranThisRun.length > 0 ? 'migration_applied' : 'migration_skipped',
    message: `Migrations complete. Applied ${ranThisRun.length} new migration(s). Skipped ${skipped.length}.`,
    applied: ranThisRun,
    skipped,
  };
  console.log(
    `[runMigrations] Done. Applied: ${ranThisRun.length}, Skipped: ${skipped.length}`
  );
  return summary;
}

/**
 * Return migration status without running any migrations.
 * @returns {Promise<{ status: string, migrations: Array, pendingCount: number }>}
 */
export async function getMigrationStatus() {
  if (!process.env.DATABASE_URL) {
    return {
      status: 'database_required',
      message: 'DATABASE_URL not configured.',
      migrations: [],
      pendingCount: 0,
    };
  }

  if (!getDb) {
    return {
      status: 'database_required',
      message: 'Database connection module unavailable.',
      migrations: [],
      pendingCount: 0,
    };
  }

  let db;
  try {
    db = getDb();
  } catch (err) {
    return {
      status: 'database_required',
      message: `DB connection failed: ${err.message}`,
      migrations: [],
      pendingCount: 0,
    };
  }

  let files = [];
  try {
    files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();
  } catch (err) {
    return {
      status: 'sync_required',
      message: `Cannot read migrations directory: ${err.message}`,
      migrations: [],
      pendingCount: 0,
    };
  }

  let appliedSet = new Set();
  try {
    await ensureMigrationsTable(db);
    appliedSet = await getAppliedMigrations(db);
  } catch (err) {
    return {
      status: 'database_required',
      message: `Cannot query schema_migrations: ${err.message}`,
      migrations: [],
      pendingCount: 0,
    };
  }

  const migrations = files.map((filename) => ({
    filename,
    status: appliedSet.has(filename) ? 'applied' : 'pending',
  }));

  const pendingCount = migrations.filter((m) => m.status === 'pending').length;

  return {
    status: pendingCount > 0 ? 'sync_required' : 'audit_logged',
    message: `${pendingCount} pending migration(s).`,
    migrations,
    pendingCount,
  };
}

// ── Self-invoke when run directly: `node server/db/runMigrations.js` ──────────
// Without this block the file only exports functions and npm run db:migrate
// exits without applying any migrations.
if (resolve(__filename) === resolve(process.argv[1] ?? '')) {
  const result = await runMigrations()
  const ok = result.status === 'migration_applied'
           || result.status === 'migration_skipped'
           || result.status === 'database_required'  // no DB = not an error
  if (result.applied?.length) {
    console.log(`[runMigrations] Applied migrations: ${result.applied.join(', ')}`)
  }
  if (result.skipped?.length) {
    console.log(`[runMigrations] Already applied (skipped): ${result.skipped.length}`)
  }
  if (!ok) {
    console.error(`[runMigrations] Exit with error: ${result.message ?? result.status}`)
  }
  process.exit(ok ? 0 : 1)
}
