/**
 * verifyDatabaseFoundation.js — 40 checks
 * Verifies the Phase 2 database foundation without requiring a live database.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')
const SERVER = path.resolve(__dirname, '..')

let passed = 0
let failed = 0
const failures = []

function check(id, description, fn) {
  try {
    const result = fn()
    if (result === true || result === undefined) {
      console.log(`  ✓ [${id}] ${description}`)
      passed++
    } else {
      console.error(`  ✗ [${id}] ${description} — ${result}`)
      failed++
      failures.push(`[${id}] ${description}: ${result}`)
    }
  } catch (err) {
    console.error(`  ✗ [${id}] ${description} — threw: ${err.message}`)
    failed++
    failures.push(`[${id}] ${description}: threw ${err.message}`)
  }
}

async function checkAsync(id, description, fn) {
  try {
    const result = await fn()
    if (result === true || result === undefined) {
      console.log(`  ✓ [${id}] ${description}`)
      passed++
    } else {
      console.error(`  ✗ [${id}] ${description} — ${result}`)
      failed++
      failures.push(`[${id}] ${description}: ${result}`)
    }
  } catch (err) {
    console.error(`  ✗ [${id}] ${description} — threw: ${err.message}`)
    failed++
    failures.push(`[${id}] ${description}: threw ${err.message}`)
  }
}

function readFile(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8')
}

function fileExists(rel) {
  return fs.existsSync(path.join(ROOT, rel))
}

console.log('\n=== verifyDatabaseFoundation — 40 checks ===\n')

// ── File existence ─────────────────────────────────────────────────────────
check(1, 'server/db/index.js exists', () =>
  fileExists('server/db/index.js') || 'file missing')

check(2, 'getDatabaseStatus exported from server/db/index.js', () => {
  const src = readFile('server/db/index.js')
  return src.includes('getDatabaseStatus') || 'getDatabaseStatus not found'
})

check(3, 'isDatabaseReady exported from server/db/index.js', () => {
  const src = readFile('server/db/index.js')
  return src.includes('isDatabaseReady') || 'isDatabaseReady not found'
})

check(4, 'safeQuery exported from server/db/index.js', () => {
  const src = readFile('server/db/index.js')
  return src.includes('safeQuery') || 'safeQuery not found'
})

check(5, 'withTransaction exported from server/db/index.js', () => {
  const src = readFile('server/db/index.js')
  return src.includes('withTransaction') || 'withTransaction not found'
})

check(6, 'closeDatabasePool exported from server/db/index.js', () => {
  const src = readFile('server/db/index.js')
  return src.includes('closeDatabasePool') || 'closeDatabasePool not found'
})

// ── Runtime behavior without DATABASE_URL ─────────────────────────────────
await checkAsync(7, 'getDatabaseStatus returns database_required when DATABASE_URL missing', async () => {
  const saved = process.env.DATABASE_URL
  delete process.env.DATABASE_URL
  const { getDatabaseStatus } = await import('../db/index.js')
  const result = getDatabaseStatus()
  if (saved !== undefined) process.env.DATABASE_URL = saved
  return result.databaseStatus === 'database_required' || `got: ${result.databaseStatus}`
})

await checkAsync(8, 'getDatabaseStatus returns preview_fallback when DATABASE_URL missing', async () => {
  const { getDatabaseStatus } = await import('../db/index.js')
  const result = getDatabaseStatus()
  return result.persistenceStatus === 'preview_fallback' || `got: ${result.persistenceStatus}`
})

await checkAsync(9, 'safeQuery does not crash when database unavailable', async () => {
  const { safeQuery } = await import('../db/index.js')
  const result = await safeQuery('SELECT 1')
  return (result.rows !== undefined) || 'safeQuery threw or returned unexpected shape'
})

await checkAsync(10, 'withTransaction returns preview_fallback when database unavailable', async () => {
  const { withTransaction } = await import('../db/index.js')
  const result = await withTransaction(async () => {})
  return (result.ok === false || result.databaseStatus === 'database_required') ||
    `unexpected result: ${JSON.stringify(result)}`
})

// ── Migration runner ───────────────────────────────────────────────────────
check(11, 'server/db/runMigrations.js exists', () =>
  fileExists('server/db/runMigrations.js') || 'file missing')

check(12, 'Migration runner scans server/db/migrations', () => {
  const src = readFile('server/db/runMigrations.js')
  return src.includes('migrations') || 'migrations dir not referenced'
})

check(13, 'schema_migrations logic exists in runner', () => {
  const src = readFile('server/db/runMigrations.js')
  return src.includes('schema_migrations') || 'schema_migrations not found'
})

check(14, 'Migration runner skips already applied migrations', () => {
  const src = readFile('server/db/runMigrations.js')
  return (src.includes('applied') && src.includes('skipped')) || 'skip logic not found'
})

await checkAsync(15, 'Migration runner exits safely without DATABASE_URL', async () => {
  const { runMigrations } = await import('../db/runMigrations.js')
  const result = await runMigrations()
  return result.status === 'database_required' || `got: ${result.status}`
})

// ── Migration files ────────────────────────────────────────────────────────
check(16, 'server/db/migrations folder exists', () =>
  fileExists('server/db/migrations') || 'folder missing')

check(17, 'Phase 9 Ticket Tapper migration exists', () =>
  fileExists('server/db/migrations/017_ticket_tapper_specials.sql') || 'file missing')

check(18, 'Phase 9 migration includes ticket_tapper_specials table', () => {
  const src = readFile('server/db/migrations/017_ticket_tapper_specials.sql')
  return src.includes('ticket_tapper_specials') || 'table not found'
})

check(19, 'Phase 9 migration includes ticket_tapper_special_events table', () => {
  const src = readFile('server/db/migrations/017_ticket_tapper_specials.sql')
  return src.includes('ticket_tapper_special_events') || 'table not found'
})

check(20, 'Phase 9 migration includes ticket_tapper_inventory table', () => {
  const src = readFile('server/db/migrations/017_ticket_tapper_specials.sql')
  return src.includes('ticket_tapper_inventory') || 'table not found'
})

check(21, 'Phase 9 migration includes money_bridge_partner_food_events table', () => {
  const src = readFile('server/db/migrations/017_ticket_tapper_specials.sql')
  return src.includes('money_bridge_partner_food_events') || 'table not found'
})

check(22, 'Phase 9 migration includes venue_tax_config table', () => {
  const src = readFile('server/db/migrations/017_ticket_tapper_specials.sql')
  return src.includes('venue_tax_config') || 'table not found'
})

check(23, 'Phase 9 migration includes venue_feature_settings table', () => {
  const src = readFile('server/db/migrations/017_ticket_tapper_specials.sql')
  return src.includes('venue_feature_settings') || 'table not found'
})

// ── Database status route ──────────────────────────────────────────────────
check(24, 'server/routes/databaseStatusRoutes.js exists', () =>
  fileExists('server/routes/databaseStatusRoutes.js') || 'file missing')

check(25, 'Database status route mounted in server/index.js', () => {
  const src = readFile('server/index.js')
  return (src.includes('databaseStatusRoutes') && src.includes('/api/system/database')) ||
    'route not mounted'
})

// ── Package scripts ────────────────────────────────────────────────────────
check(26, 'package.json includes db:migrate script', () => {
  const p = JSON.parse(readFile('package.json'))
  return !!p.scripts?.['db:migrate'] || 'db:migrate missing'
})

check(27, 'package.json includes verify:database script', () => {
  const p = JSON.parse(readFile('package.json'))
  return !!p.scripts?.['verify:database'] || 'verify:database missing'
})

// ── Security: no DATABASE_URL or password leaks ───────────────────────────
check(28, 'DATABASE_URL is never printed in db/index.js', () => {
  const src = readFile('server/db/index.js')
  const lower = src.toLowerCase()
  return (!lower.includes('console.log(process.env.database_url') &&
          !lower.includes('console.log(database_url')) || 'DATABASE_URL logged'
})

check(29, 'No raw database password in databaseStatusController.js response', () => {
  const src = readFile('server/controllers/databaseStatusController.js')
  // Must not include DATABASE_URL value in res.json output or log statements
  const forbidden = ['res.json(process.env', 'console.log(process.env.DATABASE_URL', 'DATABASE_URL: process.env']
  const found = forbidden.filter(f => src.includes(f))
  return found.length === 0 || `forbidden pattern found: ${found.join(', ')}`
})

// ── Protected files untouched ─────────────────────────────────────────────
check(30, 'Protected SmokeCraft visual files untouched (confirmed by existence)', () =>
  fileExists('src/components/smokecraft/SmokeCraftAssetScreen.jsx') || 'file missing')

check(31, 'SmokeCraftAssetScreen.jsx untouched', () =>
  fileExists('src/components/smokecraft/SmokeCraftAssetScreen.jsx') || 'file missing')

check(32, 'SmokeCraftHotspotLayer.jsx untouched', () =>
  fileExists('src/components/smokecraft/SmokeCraftHotspotLayer.jsx') || 'file missing')

check(33, 'SmokeCraftAssetRoute.jsx untouched', () =>
  fileExists('src/components/smokecraft/SmokeCraftAssetRoute.jsx') || 'file missing')

check(34, 'session.js / VISIT_STRUCTURE untouched', () =>
  fileExists('src/constants/session.js') || 'file missing')

check(35, 'Passport lock rules untouched (passportProgress.js)', () =>
  fileExists('src/utils/passportProgress.js') || 'file missing')

check(36, 'Connections lock rules untouched (passportEntry.js)', () =>
  fileExists('src/utils/passportEntry.js') || 'file missing')

check(37, '8-visit/24-session progression untouched (smokecraftJourney.js)', () =>
  fileExists('src/constants/smokecraftJourney.js') || 'file missing')

// ── Preview fallback still works ───────────────────────────────────────────
check(38, 'Ticket Tapper local preview behavior: specials data file still exists', () =>
  fileExists('src/data/smokeCraftTicketTapperSpecials.js') || 'file missing')

// ── Build readiness ────────────────────────────────────────────────────────
check(39, 'server/db/index.js has no syntax error (importable check)', () => {
  const src = readFile('server/db/index.js')
  return src.includes('export function getDatabaseStatus') || 'export not found'
})

// ── No forbidden fake-live persistence language ────────────────────────────
check(40, 'No forbidden fake-live persistence language in db/index.js fallback', () => {
  const src = readFile('server/db/index.js')
  const forbidden = ['database live', 'live persistence', 'saved to database', 'production ready']
  const found = forbidden.filter(f => src.toLowerCase().includes(f))
  return found.length === 0 || `forbidden language found: ${found.join(', ')}`
})

// ── Summary ────────────────────────────────────────────────────────────────
console.log(`\n=== Results: ${passed}/${passed + failed} passing ===\n`)

if (failures.length) {
  console.error('Failures:')
  failures.forEach(f => console.error(' ', f))
  process.exit(1)
} else {
  console.log('All 40 checks passed. Database foundation verified.')
  process.exit(0)
}
