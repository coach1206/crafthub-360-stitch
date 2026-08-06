/**
 * SmokeCraft production schema verification (Truth Gate — Phase 3).
 *
 * Runs after migrations, before the HTTP server accepts traffic. Uses
 * only fixed, hardcoded information_schema/pg_catalog queries — table
 * and column names here are compile-time string literals, never built
 * from request input, so there is no SQL-injection surface.
 *
 * Verifies the exact schema Session 2 (Humidor Match tasting draft) and
 * its dependency chain require: table existence, required columns,
 * required indexes, required unique constraints, referenced player/venue
 * tables, and that the schema_migrations ledger genuinely recorded the
 * migration that created each required table.
 *
 * Never throws for a missing element — returns a structured result so
 * the caller (server/index.js in production) can decide to exit(1), and
 * so the readiness endpoint can report a precise failure code.
 */

const REQUIRED_TABLES = {
  schema_migrations: {
    migrationFile: null, // bootstrap table, created directly by runMigrations()
    columns: ['id', 'filename', 'applied_at'],
  },
  smokecraft_tasting_drafts: {
    migrationFile: '097_smokecraft_tasting_drafts.sql',
    columns: ['id', 'guest_reference', 'activity_key', 'draft_data', 'version', 'updated_at', 'created_at'],
    uniqueConstraintColumns: [['guest_reference', 'activity_key']],
    indexes: ['idx_std_guest'],
  },
  smokecraft_player_state: {
    migrationFile: '092_smokecraft_canonical_player_state.sql',
    columns: ['guest_reference'],
  },
  venues: {
    migrationFile: null, // created by an early foundational migration; presence is what matters
    columns: ['venue_id', 'name', 'venue_type', 'city', 'state', 'status'],
  },
}

async function tableExists(db, table) {
  const { rows } = await db.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
    [table]
  )
  return rows.length > 0
}

async function getColumns(db, table) {
  const { rows } = await db.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1`,
    [table]
  )
  return new Set(rows.map(r => r.column_name))
}

async function hasUniqueConstraintOn(db, table, columns) {
  const { rows } = await db.query(
    `SELECT tc.constraint_name, kcu.column_name
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu
         ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
      WHERE tc.table_schema = 'public' AND tc.table_name = $1 AND tc.constraint_type = 'UNIQUE'`,
    [table]
  )
  const byConstraint = {}
  for (const r of rows) {
    byConstraint[r.constraint_name] = byConstraint[r.constraint_name] || []
    byConstraint[r.constraint_name].push(r.column_name)
  }
  const wanted = [...columns].sort().join(',')
  return Object.values(byConstraint).some(cols => [...cols].sort().join(',') === wanted)
}

async function indexExists(db, indexName) {
  const { rows } = await db.query(
    `SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = $1`,
    [indexName]
  )
  return rows.length > 0
}

async function migrationRecorded(db, filename) {
  const { rows } = await db.query(
    `SELECT 1 FROM schema_migrations WHERE filename = $1`,
    [filename]
  )
  return rows.length > 0
}

async function noDuplicateMigrationFilenames(db) {
  const { rows } = await db.query(
    `SELECT filename, COUNT(*) c FROM schema_migrations GROUP BY filename HAVING COUNT(*) > 1`
  )
  return rows.length === 0
}

/**
 * @returns {Promise<{ ok: boolean, checks: Array<{name:string, ok:boolean, code?:string, detail?:string}>, failureCode: string|null }>}
 */
export async function verifySmokecraftSchema(db) {
  const checks = []
  let failureCode = null

  if (!db) {
    return {
      ok: false,
      checks: [{ name: 'database_connection', ok: false, code: 'DATABASE_UNAVAILABLE', detail: 'No database connection available for schema verification.' }],
      failureCode: 'DATABASE_UNAVAILABLE',
    }
  }

  for (const [table, spec] of Object.entries(REQUIRED_TABLES)) {
    let exists = false
    try {
      exists = await tableExists(db, table)
    } catch (err) {
      checks.push({ name: `table_exists:${table}`, ok: false, code: 'DATABASE_UNAVAILABLE', detail: err.message })
      failureCode = failureCode || 'DATABASE_UNAVAILABLE'
      continue
    }
    if (!exists) {
      const code = table === 'smokecraft_tasting_drafts' ? 'TASTING_DRAFT_TABLE_MISSING' : 'MIGRATIONS_INCOMPLETE'
      checks.push({ name: `table_exists:${table}`, ok: false, code, detail: `Required table "${table}" does not exist.` })
      failureCode = failureCode || code
      continue
    }
    checks.push({ name: `table_exists:${table}`, ok: true })

    let columns
    try {
      columns = await getColumns(db, table)
    } catch (err) {
      checks.push({ name: `columns:${table}`, ok: false, code: 'DATABASE_UNAVAILABLE', detail: err.message })
      failureCode = failureCode || 'DATABASE_UNAVAILABLE'
      continue
    }
    const missingColumns = (spec.columns || []).filter(c => !columns.has(c))
    if (missingColumns.length > 0) {
      const code = table === 'smokecraft_tasting_drafts' ? 'TASTING_DRAFT_COLUMN_MISSING' : 'MIGRATIONS_INCOMPLETE'
      checks.push({ name: `columns:${table}`, ok: false, code, detail: `Missing columns on "${table}": ${missingColumns.join(', ')}` })
      failureCode = failureCode || code
    } else {
      checks.push({ name: `columns:${table}`, ok: true })
    }

    for (const uc of spec.uniqueConstraintColumns || []) {
      let has = false
      try {
        has = await hasUniqueConstraintOn(db, table, uc)
      } catch (err) {
        checks.push({ name: `unique:${table}:${uc.join('+')}`, ok: false, code: 'MIGRATIONS_INCOMPLETE', detail: err.message })
        failureCode = failureCode || 'MIGRATIONS_INCOMPLETE'
        continue
      }
      checks.push({ name: `unique:${table}:${uc.join('+')}`, ok: has, code: has ? undefined : 'MIGRATIONS_INCOMPLETE' })
      if (!has) failureCode = failureCode || 'MIGRATIONS_INCOMPLETE'
    }

    for (const idx of spec.indexes || []) {
      let has = false
      try {
        has = await indexExists(db, idx)
      } catch (err) {
        checks.push({ name: `index:${idx}`, ok: false, code: 'MIGRATIONS_INCOMPLETE', detail: err.message })
        failureCode = failureCode || 'MIGRATIONS_INCOMPLETE'
        continue
      }
      checks.push({ name: `index:${idx}`, ok: has, code: has ? undefined : 'MIGRATIONS_INCOMPLETE' })
      if (!has) failureCode = failureCode || 'MIGRATIONS_INCOMPLETE'
    }

    if (spec.migrationFile) {
      let recorded = false
      try {
        recorded = await migrationRecorded(db, spec.migrationFile)
      } catch (err) {
        checks.push({ name: `migration_recorded:${spec.migrationFile}`, ok: false, code: 'MIGRATIONS_INCOMPLETE', detail: err.message })
        failureCode = failureCode || 'MIGRATIONS_INCOMPLETE'
        continue
      }
      checks.push({ name: `migration_recorded:${spec.migrationFile}`, ok: recorded, code: recorded ? undefined : 'MIGRATIONS_INCOMPLETE' })
      if (!recorded) failureCode = failureCode || 'MIGRATIONS_INCOMPLETE'
    }
  }

  try {
    const noDupes = await noDuplicateMigrationFilenames(db)
    checks.push({ name: 'no_duplicate_migration_filenames', ok: noDupes, code: noDupes ? undefined : 'MIGRATIONS_INCOMPLETE' })
    if (!noDupes) failureCode = failureCode || 'MIGRATIONS_INCOMPLETE'
  } catch (err) {
    checks.push({ name: 'no_duplicate_migration_filenames', ok: false, code: 'DATABASE_UNAVAILABLE', detail: err.message })
    failureCode = failureCode || 'DATABASE_UNAVAILABLE'
  }

  const ok = checks.every(c => c.ok)
  return { ok, checks, failureCode: ok ? null : failureCode }
}
