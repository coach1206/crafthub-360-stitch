/**
 * verifySmokeCraftDatabaseActivation.js
 * Production Phase A.1 — Activate and verify SmokeCraft database persistence.
 *
 * SAFETY RULES enforced in this script:
 *   - DATABASE_URL value is NEVER printed or logged.
 *   - Only test records are written; all are cleaned up after.
 *   - No destructive migrations (DROP TABLE, ALTER existing columns) are run.
 *   - Each area is only marked database_verified if INSERT + SELECT + DELETE all pass.
 *   - productionReady remains false unless all critical areas pass.
 *
 * CRITICAL AREA SOURCE OF TRUTH:
 *   CRITICAL_AREAS is imported from smokecraftPersistenceRegistry.js.
 *   The activation script does NOT define its own critical list.
 *   This prevents the script from silently dropping business-critical areas.
 *
 * AREA CATEGORIES (for reporting only — all are tracked):
 *   Business-critical: gameplay, loyalty, rewards, pairing persistence
 *     orders, staff_queue, pairing_profiles, flavor_memory,
 *     rewards, loyalty, passport_rewards, venue_admin
 *   Infrastructure-critical: sync, audit, connector tracking
 *     integration_sync_events, production_sync_queue, order_audit
 *   Optional/analytics: menu, governance, recommendations, etc.
 */

import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import { isDbAvailable } from '../db/connection.js'
import { verifyTableExists, runTableReadWriteTest } from '../services/smokecraft/persistence/smokecraftDatabaseAdapter.js'
import { setAreaVerified, CRITICAL_AREAS } from '../services/smokecraft/persistence/smokecraftPersistenceRegistry.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT      = path.resolve(__dirname, '../..')

const PASS = '✓'
const FAIL = '✗'
const WARN = '⚠'

let passed = 0
let failed = 0
const failures = []

function ok(label)   { passed++; console.log(`  ${PASS}  ${label}`) }
function fail(label, reason) { failed++; failures.push(label); console.error(`  ${FAIL}  ${label}${reason ? ' — ' + reason : ''}`) }
function warn(label) { console.log(`  ${WARN}  ${label}`) }

// ── Area → table mapping (matches migration 029) ─────────────────────────────
const AREA_TABLE_MAP = {
  orders:                    'smokecraft_orders',
  staff_queue:               'smokecraft_staff_queue',
  order_audit:               'smokecraft_order_audit',
  venue_menu:                'smokecraft_venue_menu',
  pairing_profiles:          'smokecraft_pairing_profiles',
  flavor_memory:             'smokecraft_flavor_memory',
  pairing_recommendations:   'smokecraft_pairing_recommendations',
  pairing_audit:             'smokecraft_pairing_audit',
  rewards:                   'smokecraft_rewards',
  loyalty:                   'smokecraft_loyalty_records',
  passport_rewards:          'smokecraft_passport_rewards',
  reward_audit:              'smokecraft_reward_audit',
  venue_admin:               'smokecraft_venue_admin',
  analytics_snapshots:       'smokecraft_analytics_snapshots',
  integration_sync_events:   'smokecraft_sync_events',
  production_sync_queue:     'smokecraft_sync_events',  // shares table
  connector_audit:           'smokecraft_connector_audit',
  enterprise_governance_audit: 'smokecraft_governance_audit',
}

// Shared-table areas only need one test per underlying table.
const UNIQUE_TABLES = [...new Set(Object.values(AREA_TABLE_MAP))]

// ── Area category labels (for reporting only) ─────────────────────────────────
// These are sub-groupings of CRITICAL_AREAS imported from the registry.
const BUSINESS_CRITICAL_AREAS = [
  'orders', 'staff_queue', 'pairing_profiles', 'flavor_memory',
  'rewards', 'loyalty', 'passport_rewards', 'venue_admin',
]
const INFRASTRUCTURE_CRITICAL_AREAS = [
  'integration_sync_events', 'production_sync_queue', 'order_audit',
]
// All other areas are optional/analytics — tracked but not required for Phase B.

console.log('\n=== SmokeCraft Database Activation — Production Phase A.1 ===\n')
console.log(`Critical areas source: smokecraftPersistenceRegistry.js (${CRITICAL_AREAS.length} total)`)
console.log(`  Business-critical:       ${BUSINESS_CRITICAL_AREAS.join(', ')}`)
console.log(`  Infrastructure-critical: ${INFRASTRUCTURE_CRITICAL_AREAS.join(', ')}`)
console.log('')

// ── Step 1: DATABASE_URL check ────────────────────────────────────────────────
console.log('Step 1: DATABASE_URL check')
const dbUrlPresent = !!(process.env.DATABASE_URL)
console.log(`  DATABASE_URL present: ${dbUrlPresent ? 'YES (value hidden)' : 'NO'}`)

if (!dbUrlPresent) {
  console.log(`\n  ${FAIL} DATABASE_URL is not configured in this environment.`)
  console.log('  To activate SmokeCraft database persistence:')
  console.log('    1. Set DATABASE_URL in your environment (Railway: Variables tab)')
  console.log('    2. Re-run: npm run verify:smokecraft-database-activation')
  console.log('    3. After tables are verified, Phase B POS360 work may begin.')
  console.log('\n  Business-critical areas that will be verified when DATABASE_URL is present:')
  BUSINESS_CRITICAL_AREAS.forEach(id => console.log(`    - ${id}`))
  console.log('\n  Infrastructure-critical areas that will be verified:')
  INFRASTRUCTURE_CRITICAL_AREAS.forEach(id => console.log(`    - ${id}`))
  console.log('\n=== Result: DATABASE_URL not configured — all areas remain memory_fallback ===\n')
  process.exit(0)  // Not a script failure — just not yet configured
}

// ── Step 2: Run migration ─────────────────────────────────────────────────────
console.log('\nStep 2: Run migration (npm run db:migrate)')
let migrationPassed = false
try {
  const out = execSync('npm run db:migrate --silent 2>&1', { cwd: ROOT, encoding: 'utf8' })
  console.log('  Migration output:')
  out.split('\n').filter(Boolean).forEach(l => console.log(`    ${l}`))
  migrationPassed = !out.includes('sync_required') && !out.includes('ERROR')
  if (migrationPassed) {
    ok('Migration ran without errors')
  } else {
    fail('Migration reported errors or sync_required', 'check migration output above')
  }
} catch (err) {
  fail('Migration command failed', err.message.split('\n')[0])
}

if (!migrationPassed) {
  console.log('\n  Cannot proceed with table verification until migration succeeds.')
  console.log('\n=== Result: Migration failed — tables cannot be verified ===\n')
  process.exit(1)
}

// ── Step 3: Wait for pool ─────────────────────────────────────────────────────
console.log('\nStep 3: Verify database connection')
// Small delay to ensure pool initialises after migration
await new Promise(r => setTimeout(r, 500))
const dbUp = isDbAvailable()
if (dbUp) {
  ok('Database connection pool available')
} else {
  fail('Database connection pool not available after migration')
  console.log('\n=== Result: Database not available — cannot verify tables ===\n')
  process.exit(1)
}

// ── Step 4: Verify tables exist ───────────────────────────────────────────────
console.log('\nStep 4: Verify SmokeCraft tables exist (migration 029)')
const tableExistsResults = {}
for (const table of UNIQUE_TABLES) {
  const r = await verifyTableExists(table)
  tableExistsResults[table] = r.exists
  if (r.exists) {
    ok(`Table exists: ${table}`)
  } else {
    fail(`Table missing: ${table}`, r.error ?? 'not found in information_schema')
  }
}

// ── Step 5: Read/write tests for each unique table ────────────────────────────
console.log('\nStep 5: Read/write tests (INSERT + SELECT + DELETE per table)')
const tableTestResults = {}
for (const table of UNIQUE_TABLES) {
  if (!tableExistsResults[table]) {
    tableTestResults[table] = false
    warn(`Skipping read/write test for ${table} — table does not exist`)
    continue
  }
  const testId = `phase-a1-test-${randomUUID()}`
  const r = await runTableReadWriteTest(table, testId)
  tableTestResults[table] = r.passed
  if (r.passed) {
    ok(`Read/write test passed: ${table}`)
  } else {
    fail(`Read/write test failed: ${table}`, r.error)
  }
}

// ── Step 6: Update registry for each area ─────────────────────────────────────
console.log('\nStep 6: Update persistence registry')
const areaResults = {}
for (const [areaId, table] of Object.entries(AREA_TABLE_MAP)) {
  const dbVerified    = tableExistsResults[table] && tableTestResults[table]
  const productionReady = dbVerified
  setAreaVerified(areaId, { databaseVerified: dbVerified, productionReady })
  areaResults[areaId] = { databaseVerified: dbVerified, productionReady, table }
  if (dbVerified) {
    ok(`Area database_verified: ${areaId}`)
  } else {
    warn(`Area NOT verified: ${areaId} (table: ${table})`)
  }
}

// Final QA / handoff areas have no DB table — mark not_applicable
for (const areaId of ['final_qa_records', 'handoff_records']) {
  setAreaVerified(areaId, { databaseVerified: false, productionReady: false })
}

// ── Step 7: Critical area check (imported from registry — single source of truth) ──
console.log('\nStep 7: Critical area readiness')

const businessCriticalPassed = BUSINESS_CRITICAL_AREAS.filter(id => areaResults[id]?.databaseVerified)
const businessCriticalFailed = BUSINESS_CRITICAL_AREAS.filter(id => !areaResults[id]?.databaseVerified)

const infraCriticalPassed = INFRASTRUCTURE_CRITICAL_AREAS.filter(id => areaResults[id]?.databaseVerified)
const infraCriticalFailed = INFRASTRUCTURE_CRITICAL_AREAS.filter(id => !areaResults[id]?.databaseVerified)

const criticalPassed  = CRITICAL_AREAS.filter(id => areaResults[id]?.databaseVerified)
const criticalFailed  = CRITICAL_AREAS.filter(id => !areaResults[id]?.databaseVerified)
const criticalAllPass = criticalFailed.length === 0

console.log('\n  Business-critical areas:')
for (const id of BUSINESS_CRITICAL_AREAS) {
  const pass = areaResults[id]?.databaseVerified
  if (pass) { ok(`Business-critical area ready: ${id}`) } else { fail(`Business-critical area NOT ready: ${id}`) }
}

console.log('\n  Infrastructure-critical areas:')
for (const id of INFRASTRUCTURE_CRITICAL_AREAS) {
  const pass = areaResults[id]?.databaseVerified
  if (pass) { ok(`Infrastructure-critical area ready: ${id}`) } else { fail(`Infrastructure-critical area NOT ready: ${id}`) }
}

// ── Summary ───────────────────────────────────────────────────────────────────
const totalVerified = Object.values(areaResults).filter(a => a.databaseVerified).length
const totalAreas    = Object.keys(AREA_TABLE_MAP).length

console.log('\n=== Activation Summary ===')
console.log(`DATABASE_URL present:              YES (value hidden)`)
console.log(`Migration result:                  ${migrationPassed ? 'PASS' : 'FAIL'}`)
console.log(`Tables verified:                   ${UNIQUE_TABLES.filter(t => tableExistsResults[t]).length} / ${UNIQUE_TABLES.length}`)
console.log(`Areas database_verified:           ${totalVerified} / ${totalAreas}`)
console.log(`Business-critical passed:          ${businessCriticalPassed.length} / ${BUSINESS_CRITICAL_AREAS.length}`)
console.log(`Infrastructure-critical passed:    ${infraCriticalPassed.length} / ${INFRASTRUCTURE_CRITICAL_AREAS.length}`)
console.log(`All critical areas ready:          ${criticalPassed.length} / ${CRITICAL_AREAS.length}`)
console.log(`Phase B POS360 safe to start:      ${criticalAllPass ? 'YES' : 'NO — fix critical areas first'}`)

if (businessCriticalFailed.length > 0) {
  console.log(`\n  Business-critical NOT verified: ${businessCriticalFailed.join(', ')}`)
}
if (infraCriticalFailed.length > 0) {
  console.log(`  Infrastructure-critical NOT verified: ${infraCriticalFailed.join(', ')}`)
}

if (failures.length > 0) {
  console.log('\nFailures:')
  failures.forEach(f => console.log(`  ${FAIL}  ${f}`))
}

console.log('\n=== Honest Status ===')
console.log(`  databaseConfigured:         true`)
console.log(`  databaseVerified:           ${totalVerified > 0}`)
console.log(`  businessCriticalPassed:     ${businessCriticalFailed.length === 0}`)
console.log(`  infrastructureCriticalPassed: ${infraCriticalFailed.length === 0}`)
console.log(`  productionReady:            ${criticalAllPass && totalVerified === totalAreas}`)
console.log(`  POS360 live sync:           still not active (Phase B)`)
console.log(`  E.A.T. live sync:           still not active (Phase C)`)
console.log(`  Billing:                    still not active`)
console.log(`  Marketplace:                still not live`)
console.log(`  License:                    still not enforced`)

if (criticalAllPass) {
  console.log('\n✓ All critical persistence areas are database_verified.')
  console.log('  ✓ All business-critical areas verified (orders, staff_queue, pairing_profiles,')
  console.log('    flavor_memory, rewards, loyalty, passport_rewards, venue_admin)')
  console.log('  ✓ All infrastructure-critical areas verified')
  console.log('  PRODUCTION PHASE B — POS360 Live Connector Implementation — is safe to start.')
} else {
  if (businessCriticalFailed.length > 0) {
    console.log(`\n${FAIL} ${businessCriticalFailed.length} business-critical area(s) not verified. Phase B BLOCKED.`)
    console.log(`  Unverified: ${businessCriticalFailed.join(', ')}`)
  }
  if (infraCriticalFailed.length > 0) {
    console.log(`${FAIL} ${infraCriticalFailed.length} infrastructure-critical area(s) not verified.`)
    console.log(`  Unverified: ${infraCriticalFailed.join(', ')}`)
  }
}

console.log('')
process.exit(criticalAllPass ? 0 : 1)
