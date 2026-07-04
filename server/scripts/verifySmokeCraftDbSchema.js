/**
 * verifySmokeCraftDbSchema.js
 * Checks every SmokeCraft table in Railway Postgres against the expected schema.
 *
 * SAFETY RULES:
 *   - Never prints DATABASE_URL or passwords.
 *   - Only reads information_schema and runs safe SELECT COUNT(*) checks.
 *   - Does not modify any data.
 *   - Safe to run against production.
 */

import { isDbAvailable, query } from '../db/connection.js'

const SEP = '─'.repeat(60)

// Expected tables and their required NOT NULL columns (minimum viable set for
// the activation INSERT tests — does not need to list all columns).
const EXPECTED_SCHEMA = {
  smokecraft_orders:                { pk: 'order_id',          requiredCols: ['order_id', 'order_status', 'source_module'] },
  smokecraft_order_audit:           { pk: 'audit_id',          requiredCols: ['audit_id', 'event_type'] },
  smokecraft_staff_queue:           { pk: 'queue_id',          requiredCols: ['queue_id', 'queue_type', 'status', 'priority'] },
  smokecraft_venue_menu:            { pk: 'menu_id',           requiredCols: ['menu_id', 'menu_source'] },
  smokecraft_pairing_profiles:      { pk: 'profile_id',        requiredCols: ['profile_id'] },
  smokecraft_pairing_recommendations: { pk: 'recommendation_id', requiredCols: ['recommendation_id'] },
  smokecraft_pairing_audit:         { pk: 'audit_id',          requiredCols: ['audit_id', 'event_type'] },
  smokecraft_flavor_memory:         { pk: 'memory_id',         requiredCols: ['memory_id'] },
  smokecraft_rewards:               { pk: 'reward_id',         requiredCols: ['reward_id'] },
  smokecraft_reward_audit:          { pk: 'audit_id',          requiredCols: ['audit_id', 'event_type'] },
  smokecraft_loyalty_records:       { pk: 'loyalty_id',        requiredCols: ['loyalty_id'] },
  smokecraft_passport_rewards:      { pk: 'passport_id',       requiredCols: ['passport_id'] },
  smokecraft_venue_admin:           { pk: 'admin_id',          requiredCols: ['admin_id', 'action_type'] },
  smokecraft_analytics_snapshots:   { pk: 'snapshot_id',       requiredCols: ['snapshot_id'] },
  smokecraft_sync_events:           { pk: 'event_id',          requiredCols: ['event_id', 'event_type', 'sync_status'] },
  smokecraft_connector_audit:       { pk: 'audit_id',          requiredCols: ['audit_id', 'event_type'] },
  smokecraft_governance_audit:      { pk: 'audit_id',          requiredCols: ['audit_id', 'event_type'] },
  smokecraft_persistence_audit:     { pk: 'audit_id',          requiredCols: ['audit_id', 'event_type'] },
}

console.log('\n' + SEP)
console.log('  SmokeCraft DB Schema Verification')
console.log(SEP + '\n')

if (!isDbAvailable()) {
  console.log('DATABASE_URL present: NO')
  console.log('Cannot check schema — database not available.')
  console.log('Run npm run verify:railway-env first to confirm DB connection.\n')
  process.exit(0)
}

console.log('DATABASE_URL present: YES (value hidden)')
console.log('Database connection: AVAILABLE\n')

// Fetch all columns for all smokecraft tables at once
const { rows: colRows } = await query(`
  SELECT table_name, column_name
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name LIKE 'smokecraft_%'
  ORDER BY table_name, ordinal_position
`)

// Build a map: tableName → Set<columnName>
const actualCols = {}
for (const row of colRows) {
  if (!actualCols[row.table_name]) actualCols[row.table_name] = new Set()
  actualCols[row.table_name].add(row.column_name)
}

const tables = Object.keys(EXPECTED_SCHEMA)
let allPass = true
const issues = []

for (const table of tables) {
  const { requiredCols } = EXPECTED_SCHEMA[table]
  const exists = !!actualCols[table]
  const foundCols = actualCols[table] ?? new Set()
  const missingCols = requiredCols.filter(c => !foundCols.has(c))

  if (!exists) {
    console.log(`  ✗  MISSING  ${table}`)
    issues.push(`Table missing: ${table} — run npm run db:migrate`)
    allPass = false
  } else if (missingCols.length > 0) {
    console.log(`  ✗  SCHEMA   ${table}`)
    console.log(`       Missing columns: ${missingCols.join(', ')}`)
    issues.push(`${table}: missing columns: ${missingCols.join(', ')}`)
    allPass = false
  } else {
    console.log(`  ✓  OK       ${table}`)
  }
}

// Tables in DB not in expected list
const extraTables = Object.keys(actualCols).filter(t => !EXPECTED_SCHEMA[t])
if (extraTables.length > 0) {
  console.log(`\n  ⚠  Extra smokecraft tables (not in expected list): ${extraTables.join(', ')}`)
}

console.log('\n' + SEP)
console.log(`  Tables expected:  ${tables.length}`)
console.log(`  Tables found:     ${Object.keys(actualCols).length}`)
console.log(`  Tables missing:   ${tables.filter(t => !actualCols[t]).length}`)
console.log(`  Schema issues:    ${issues.length}`)
console.log(`  Schema clean:     ${allPass ? 'YES ✓' : 'NO ✗'}`)
console.log(SEP + '\n')

if (!allPass) {
  console.log('Issues found:')
  issues.forEach(i => console.log(`  - ${i}`))
  console.log('\nFix: npm run db:migrate (applies migration 029 which creates all tables)\n')
} else {
  console.log('All SmokeCraft tables and required columns exist.')
  console.log('Next: npm run verify:smokecraft-database-activation\n')
}

process.exit(allPass ? 0 : 1)
