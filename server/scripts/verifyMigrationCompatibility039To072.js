/**
 * Migration Compatibility Verification: 039–072
 *
 * Confirms:
 * - Migration 039 exists and contains ADD COLUMN IF NOT EXISTS for 'active' before using it
 * - Migrations 039–072 contain no destructive SQL (DROP TABLE, DROP COLUMN, TRUNCATE)
 * - Migration 039 is safe to rerun after partial failure (idempotent)
 * - All migrations use CREATE TABLE IF NOT EXISTS
 */

import { readFileSync, existsSync, readdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '../../')
const MIGRATIONS_DIR = resolve(ROOT, 'server/db/migrations')

let passed = 0
let failed = 0

function check(label, ok, detail = '') {
  if (ok) {
    console.log(`  ✅ ${label}`)
    passed++
  } else {
    console.log(`  ❌ ${label}${detail ? ' — ' + detail : ''}`)
    failed++
  }
}

function read(filename) {
  const p = resolve(MIGRATIONS_DIR, filename)
  if (!existsSync(p)) return null
  return readFileSync(p, 'utf8')
}

function getMigrations(from, to) {
  return readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .filter(f => {
      const num = parseInt(f.split('_')[0], 10)
      return num >= from && num <= to
    })
    .sort()
}

console.log('\nMigration Compatibility Verification: 039–072\n')

// ── Gate 1: Migration 039 exists ─────────────────────────────────────────────
console.log('Gate 1 — Migration 039 exists')
const m039 = read('039_pos360_reservations_guest_flow.sql')
check('039_pos360_reservations_guest_flow.sql exists', m039 !== null)

if (m039) {
  // ── Gate 2: 039 adds active column before using it ─────────────────────────
  console.log('\nGate 2 — Migration 039 guards active column with ADD COLUMN IF NOT EXISTS')
  check(
    '039 has ADD COLUMN IF NOT EXISTS active for pos360_floor_sections',
    /ALTER\s+TABLE\s+(IF\s+EXISTS\s+)?pos360_floor_sections\s+ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+active/i.test(m039),
  )
  check(
    '039 has ADD COLUMN IF NOT EXISTS active for pos360_tables',
    /ALTER\s+TABLE\s+(IF\s+EXISTS\s+)?pos360_tables\s+ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+active/i.test(m039),
  )
  // Guard must appear before the index that uses it
  const guardFloor = m039.indexOf('ADD COLUMN IF NOT EXISTS active BOOLEAN')
  const indexFloor = m039.indexOf('idx_pos360_sections_venue')
  check(
    '039 active column guard appears before idx_pos360_sections_venue index',
    guardFloor !== -1 && indexFloor !== -1 && guardFloor < indexFloor,
  )

  // ── Gate 3: 039 is idempotent ──────────────────────────────────────────────
  console.log('\nGate 3 — Migration 039 is idempotent (safe to rerun)')
  check('039 uses CREATE TABLE IF NOT EXISTS', m039.includes('CREATE TABLE IF NOT EXISTS'))
  check('039 uses CREATE INDEX IF NOT EXISTS', m039.includes('CREATE INDEX IF NOT EXISTS'))
  check('039 ALTER TABLE uses ADD COLUMN IF NOT EXISTS', m039.includes('ADD COLUMN IF NOT EXISTS'))
  // Strip single-line comments before checking for destructive SQL
  const m039noComments = m039.split('\n').filter(l => !l.trim().startsWith('--')).join('\n')
  check('039 does not contain DROP TABLE', !m039noComments.match(/\bDROP\s+TABLE\b/i))
  check('039 does not contain DROP COLUMN', !m039noComments.match(/\bDROP\s+COLUMN\b/i))
  check('039 does not contain TRUNCATE TABLE', !m039.match(/\bTRUNCATE\s+TABLE\b/i))
}

// ── Gate 4: Migrations 039–072 — no destructive SQL ──────────────────────────
console.log('\nGate 4 — Migrations 039–072: no destructive SQL')
const migrations039to072 = getMigrations(39, 72)
check(`Found migrations 039–072 (expected ≥34)`, migrations039to072.length >= 34,
  `found ${migrations039to072.length}`)

let destructiveFound = false
for (const filename of migrations039to072) {
  const sql = read(filename)
  if (!sql) continue
  // Strip comments before checking — prevents false positives from comment text
  const sqlNoComments = sql.split('\n').filter(l => !l.trim().startsWith('--')).join('\n')
  if (sqlNoComments.match(/\bDROP\s+TABLE\b/i)) {
    check(`${filename}: no DROP TABLE`, false)
    destructiveFound = true
  }
  if (sqlNoComments.match(/\bTRUNCATE\s+TABLE\b/i)) {
    check(`${filename}: no TRUNCATE TABLE`, false)
    destructiveFound = true
  }
  if (sqlNoComments.match(/\bDROP\s+COLUMN\b/i)) {
    check(`${filename}: no DROP COLUMN`, false)
    destructiveFound = true
  }
}
if (!destructiveFound) {
  check('No DROP TABLE / TRUNCATE TABLE / DROP COLUMN found in any migration 039–072', true)
}

// ── Gate 5: All migrations 039–072 use CREATE TABLE IF NOT EXISTS ─────────────
console.log('\nGate 5 — Migrations 039–072: use CREATE TABLE IF NOT EXISTS (not bare CREATE TABLE)')
let bareCreateFound = false
for (const filename of migrations039to072) {
  const sql = read(filename)
  if (!sql) continue
  // Match CREATE TABLE not followed by IF NOT EXISTS
  if (/\bCREATE\s+TABLE\s+(?!IF\s+NOT\s+EXISTS)\w/i.test(sql)) {
    check(`${filename}: uses CREATE TABLE IF NOT EXISTS only`, false, 'bare CREATE TABLE found')
    bareCreateFound = true
  }
}
if (!bareCreateFound) {
  check('All migrations 039–072 use CREATE TABLE IF NOT EXISTS', true)
}

// ── Gate 5b: Migration 039 cross-migration FK check ──────────────────────────
console.log('\nGate 5b — Migration 039: no cross-migration FK type mismatches')
// Migration 031 uses SERIAL PRIMARY KEY for pos360_tables and pos360_floor_sections.
// Migration 039 must NOT reference pos360_tables(id) or pos360_floor_sections(id) with UUID columns
// (type mismatch: UUID vs SERIAL/integer).
if (m039) {
  check(
    '039: no REFERENCES pos360_tables(id) that would conflict with SERIAL PK from migration 031',
    !m039.match(/REFERENCES\s+pos360_tables\s*\(\s*id\s*\)/i),
  )
  check(
    '039: no REFERENCES pos360_floor_sections(id) that would conflict with SERIAL PK from migration 031',
    !m039.match(/REFERENCES\s+pos360_floor_sections\s*\(\s*id\s*\)/i),
  )
  check(
    '039: cross-migration FK columns are documented with fk-ref comments',
    m039.includes('fk-ref: pos360_tables') && m039.includes('fk-ref: pos360_floor_sections'),
  )
  // Internal FKs within 039 are fine — reservations, waitlist, private_events are all UUID
  check(
    '039: internal FKs to pos360_reservations still present (same-migration UUID ref)',
    m039.match(/REFERENCES\s+pos360_reservations\s*\(\s*id\s*\)/i) !== null,
  )
}

// ── Gate 6b: Migration 041 cross-migration column guards ─────────────────────
console.log('\nGate 6b — Migration 041: guards for columns missing from migration 037 version of pos360_payment_intents')
const m041 = read('041_pos360_payments_tips_closeout.sql')
if (m041) {
  check(
    '041 has ADD COLUMN IF NOT EXISTS reservation_id for pos360_payment_intents',
    /ALTER\s+TABLE\s+IF\s+EXISTS\s+pos360_payment_intents\s+ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+reservation_id/i.test(m041),
  )
  check(
    '041 has ADD COLUMN IF NOT EXISTS private_event_id for pos360_payment_intents',
    /ALTER\s+TABLE\s+IF\s+EXISTS\s+pos360_payment_intents\s+ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+private_event_id/i.test(m041),
  )
  check(
    '041 has ADD COLUMN IF NOT EXISTS customer_id for pos360_payment_intents',
    /ALTER\s+TABLE\s+IF\s+EXISTS\s+pos360_payment_intents\s+ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+customer_id/i.test(m041),
  )
  check(
    '041 has ADD COLUMN IF NOT EXISTS payment_intent_status for pos360_payment_intents',
    /ALTER\s+TABLE\s+IF\s+EXISTS\s+pos360_payment_intents\s+ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+payment_intent_status/i.test(m041),
  )
  const m041noComments = m041.split('\n').filter(l => !l.trim().startsWith('--')).join('\n')
  check('041 does not contain DROP TABLE', !m041noComments.match(/\bDROP\s+TABLE\b/i))
  check('041 does not contain DROP COLUMN', !m041noComments.match(/\bDROP\s+COLUMN\b/i))
} else {
  check('041_pos360_payments_tips_closeout.sql exists', false)
}

// ── Gate 6: Migration count ───────────────────────────────────────────────────
console.log('\nGate 6 — Expected migrations present')
const expected = [
  '039_pos360_reservations_guest_flow.sql',
  '040_pos360_event_packages_monetization.sql',
  '041_pos360_payments_tips_closeout.sql',
  '042_pos360_staff_roles_labor_governance.sql',
  '043_pos360_reports_analytics_decision_layer.sql',
  '044_pos360_system_settings_venue_admin.sql',
  '045_pos360_external_integrations_sync_governance.sql',
  '046_pos360_fulfillment_kds_order_routing.sql',
]
for (const f of expected) {
  check(`${f} exists`, existsSync(resolve(MIGRATIONS_DIR, f)))
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n─────────────────────────────────────────────────`)
console.log(`Migration Compatibility 039–072: ${passed + failed} checks, ${passed} passed, ${failed} failed`)

if (failed === 0) {
  console.log('\n✅ Migration 039 is safe to rerun on Railway. No destructive SQL in 039–072.')
  process.exit(0)
} else {
  console.log('\n❌ Migration compatibility issues found — fix before Railway redeploy.')
  process.exit(1)
}
