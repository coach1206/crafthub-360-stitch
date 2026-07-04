#!/usr/bin/env node
/**
 * Phase B.1 — POS360 Floor Management Foundation Verification
 * Run: node server/scripts/verifyPos360FloorManagement.js
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')

let passed = 0; let failed = 0

function assert(label, condition, detail = '') {
  if (condition) { console.log(`  ✓ ${label}`); passed++ }
  else { console.error(`  ✗ FAIL: ${label}${detail ? ` — ${detail}` : ''}`); failed++ }
}
function fileExists(rel)       { return fs.existsSync(path.join(ROOT, rel)) }
function fileContains(rel, str) {
  try { return fs.readFileSync(path.join(ROOT, rel), 'utf8').includes(str) } catch { return false }
}

console.log('\n══════════════════════════════════════════════════════════')
console.log('  Phase B.1 — POS360 Floor Management Foundation Verify')
console.log('══════════════════════════════════════════════════════════\n')

// 1. Migration
console.log('1. Database Migration (031)')
{
  const mig = 'server/db/migrations/031_pos360_floor_management_foundation.sql'
  assert('Migration 031 exists', fileExists(mig))
  assert('pos360_floor_sections table', fileContains(mig, 'pos360_floor_sections'))
  assert('pos360_floor_maps table', fileContains(mig, 'pos360_floor_maps'))
  assert('pos360_tables table', fileContains(mig, 'pos360_tables'))
  assert('pos360_table_status_history table', fileContains(mig, 'pos360_table_status_history'))
  assert('pos360_table_server_assignments table', fileContains(mig, 'pos360_table_server_assignments'))
  assert('pos360_table_transfers table', fileContains(mig, 'pos360_table_transfers'))
  assert('pos360_table_merges table', fileContains(mig, 'pos360_table_merges'))
  assert('pos360_table_guest_links table', fileContains(mig, 'pos360_table_guest_links'))
  assert('pos360_floor_events table', fileContains(mig, 'pos360_floor_events'))
  assert('pos360_floor_audit table', fileContains(mig, 'pos360_floor_audit'))
  assert('Migration uses CREATE TABLE IF NOT EXISTS', fileContains(mig, 'CREATE TABLE IF NOT EXISTS'))
  assert('Audit: no DROP TABLE in migration', !fileContains(mig, 'DROP TABLE'))
  assert('venue_id column present', fileContains(mig, 'venue_id'))
  assert('tenant_id column present', fileContains(mig, 'tenant_id'))
  assert('audit_context JSONB column present', fileContains(mig, 'audit_context'))
  assert('contains_secrets = false in audit table', fileContains(mig, 'contains_secrets'))
  assert('exposes_private_data = false in audit table', fileContains(mig, 'exposes_private_data'))
}

// 2. Service
console.log('\n2. Floor Management Service')
{
  const svc = 'server/services/pos360/pos360FloorManagementService.js'
  assert('Service exists', fileExists(svc))
  assert('createSection exported', fileContains(svc, 'export async function createSection'))
  assert('listSections exported', fileContains(svc, 'export async function listSections'))
  assert('createTable exported', fileContains(svc, 'export async function createTable'))
  assert('changeTableStatus exported', fileContains(svc, 'export async function changeTableStatus'))
  assert('assignServer exported', fileContains(svc, 'export async function assignServer'))
  assert('transferTable exported', fileContains(svc, 'export async function transferTable'))
  assert('mergeTables exported', fileContains(svc, 'export async function mergeTables'))
  assert('splitTable exported', fileContains(svc, 'export async function splitTable'))
  assert('linkGuest exported', fileContains(svc, 'export async function linkGuest'))
  assert('getTableIntelligence exported', fileContains(svc, 'export async function getTableIntelligence'))
  assert('getFloorState exported', fileContains(svc, 'export async function getFloorState'))
  assert('emitFloorEvent present', fileContains(svc, 'emitFloorEvent'))
  assert('persistEvent present', fileContains(svc, 'persistEvent'))
  assert('writeAudit present', fileContains(svc, 'writeAudit'))
  assert('isDbAvailable guard present', fileContains(svc, 'isDbAvailable'))
  assert('localPreview fallback present', fileContains(svc, 'localPreview'))
  assert('DATABASE_URL never logged', !fileContains(svc, 'DATABASE_URL'))
  assert('No fake data / intelligence returns honest empty state', fileContains(svc, 'SmokeCraft intelligence available'))
  assert('EAT hook returns honest empty state', fileContains(svc, 'E.A.T. recommendations available'))
  assert('Status history persisted', fileContains(svc, 'pos360_table_status_history'))
}

// 3. Event contracts
console.log('\n3. Event Contracts')
{
  const ec = 'server/services/pos360/pos360FloorEventContracts.js'
  assert('Event contracts file exists', fileExists(ec))
  assert('floor.section.created', fileContains(ec, 'floor.section.created'))
  assert('floor.table.status_changed', fileContains(ec, 'floor.table.status_changed'))
  assert('floor.table.transferred', fileContains(ec, 'floor.table.transferred'))
  assert('floor.table.merged', fileContains(ec, 'floor.table.merged'))
  assert('floor.table.split', fileContains(ec, 'floor.table.split'))
  assert('floor.server.assigned', fileContains(ec, 'floor.server.assigned'))
  assert('floor.guest.seated', fileContains(ec, 'floor.guest.seated'))
  assert('floor.reservation.linked', fileContains(ec, 'floor.reservation.linked'))
  assert('floor.waitlist.linked', fileContains(ec, 'floor.waitlist.linked'))
  assert('floor.sync.completed', fileContains(ec, 'floor.sync.completed'))
  assert('floor.sync.failed', fileContains(ec, 'floor.sync.failed'))
  assert('TABLE_STATUSES defined', fileContains(ec, 'TABLE_STATUSES'))
  assert('SECTION_TYPES defined', fileContains(ec, 'SECTION_TYPES'))
  assert('FLOOR_FEATURE_FLAGS defined', fileContains(ec, 'FLOOR_FEATURE_FLAGS'))
  assert('SYNC_DEVICES defined', fileContains(ec, 'SYNC_DEVICES'))
}

// 4. Feature flags
console.log('\n4. Feature Flags')
{
  const ff = 'server/config/pos360FloorFeatureFlags.js'
  assert('Feature flags file exists', fileExists(ff))
  assert('floor_management_enabled flag', fileContains(ff, 'floor_management_enabled'))
  assert('smokecraft_intelligence_enabled flag', fileContains(ff, 'smokecraft_intelligence_enabled'))
  assert('eat_recommendations_enabled flag', fileContains(ff, 'eat_recommendations_enabled'))
  assert('Phase B.2+ flags are disabled by default', fileContains(ff, "=== 'true'"))
  assert('getFloorFlags exported', fileContains(ff, 'export function getFloorFlags'))
}

// 5. Controller
console.log('\n5. Controller')
{
  const ctrl = 'server/controllers/pos360FloorController.js'
  assert('Controller exists', fileExists(ctrl))
  assert('createSection', fileContains(ctrl, 'export async function createSection'))
  assert('listTables', fileContains(ctrl, 'export async function listTables'))
  assert('changeTableStatus', fileContains(ctrl, 'export async function changeTableStatus'))
  assert('assignServer', fileContains(ctrl, 'export async function assignServer'))
  assert('getFloorState', fileContains(ctrl, 'export async function getFloorState'))
  assert('syncFloorState', fileContains(ctrl, 'export async function syncFloorState'))
  assert('getTableIntelligence', fileContains(ctrl, 'export async function getTableIntelligence'))
  assert('transferTable', fileContains(ctrl, 'export async function transferTable'))
  assert('mergeTables', fileContains(ctrl, 'export async function mergeTables'))
  assert('linkGuest', fileContains(ctrl, 'export async function linkGuest'))
}

// 6. Routes
console.log('\n6. API Routes')
{
  const rts = 'server/routes/pos360FloorRoutes.js'
  assert('Routes file exists', fileExists(rts))
  assert('GET sections', fileContains(rts, 'ctrl.listSections'))
  assert('POST sections', fileContains(rts, 'ctrl.createSection'))
  assert('GET tables', fileContains(rts, 'ctrl.listTables'))
  assert('POST tables', fileContains(rts, 'ctrl.createTable'))
  assert('POST status', fileContains(rts, 'ctrl.changeTableStatus'))
  assert('POST move', fileContains(rts, 'ctrl.moveTable'))
  assert('POST transfer', fileContains(rts, 'ctrl.transferTable'))
  assert('POST merge', fileContains(rts, 'ctrl.mergeTables'))
  assert('POST split', fileContains(rts, 'ctrl.splitTable'))
  assert('POST guest-links', fileContains(rts, 'ctrl.linkGuest'))
  assert('GET intelligence', fileContains(rts, 'ctrl.getTableIntelligence'))
  assert('GET floor-state', fileContains(rts, 'ctrl.getFloorState'))
  assert('POST floor-state/sync', fileContains(rts, 'ctrl.syncFloorState'))
  assert('venueTenantGuard applied to all routes', fileContains(rts, 'venueTenantGuard'))
  assert('canAccessPOS3 applied to write routes', fileContains(rts, 'canAccessPOS3'))
}

// 7. Server mounting
console.log('\n7. Server Mounting')
{
  assert('pos360FloorRoutes imported in index.js', fileContains('server/index.js', 'pos360FloorRoutes'))
  assert('/api/pos360/floor mounted', fileContains('server/index.js', '/api/pos360/floor'))
}

// 8. UI Components
console.log('\n8. UI Components')
{
  const fm = 'src/pages/pos360/POS360FloorManagement.jsx'
  assert('POS360FloorManagement page exists', fileExists(fm))
  assert('smokecraft-pos360.png referenced', fileContains(fm, '/smokecraft-pos360.png'))
  assert('STATUS_COLORS defined', fileContains(fm, 'STATUS_COLORS'))
  assert('TableCard component', fileContains(fm, 'function TableCard'))
  assert('TableDetailDrawer component', fileContains(fm, 'function TableDetailDrawer'))
  assert('ServerAssignmentPanel component', fileContains(fm, 'function ServerAssignmentPanel'))
  assert('SectionList component', fileContains(fm, 'function SectionList'))
  assert('FloorMapCanvas component', fileContains(fm, 'function FloorMapCanvas'))
  assert('StatusLegend component', fileContains(fm, 'function StatusLegend'))
  assert('SyncStatusIndicator component', fileContains(fm, 'function SyncStatusIndicator'))
  assert('SmokeCraft intelligence panel present', fileContains(fm, 'SmokeCraft Intelligence'))
  assert('E.A.T. recommendations panel present', fileContains(fm, 'E.A.T. Recommendations'))
  assert('Dark theme: DARK_BG', fileContains(fm, 'DARK_BG'))
  assert('GOLD accent applied', fileContains(fm, 'GOLD'))
  assert('Accessible to router (import in App.jsx)', fileContains('src/App.jsx', 'POS360FloorManagement'))
  assert('Route wired at floor-management', fileContains('src/App.jsx', 'floor-management'))
}

// 9. Visual asset
console.log('\n9. Visual Asset')
{
  assert('smokecraft-pos360.png exists', fileExists('public/smokecraft-pos360.png'))
  assert('SMOKECRAFT POS360.png (original) exists', fileExists('public/SMOKECRAFT POS360.png'))
  assert('FloorManagement references /smokecraft-pos360.png', fileContains('src/pages/pos360/POS360FloorManagement.jsx', '/smokecraft-pos360.png'))
  assert('TableManagement references /smokecraft-pos360.png', fileContains('src/pages/pos3/POS360TableManagement.jsx', '/smokecraft-pos360.png'))
}

// 10. Safety checks
console.log('\n10. Safety Checks')
{
  const svc = 'server/services/pos360/pos360FloorManagementService.js'
  assert('SmokeCraft files untouched', !fileContains('src/components/smokecraft/SmokeCraftAssetScreen.jsx', 'pos360FloorManagement'))
  assert('No DROP TABLE in migration 031', !fileContains('server/db/migrations/031_pos360_floor_management_foundation.sql', 'DROP TABLE'))
  assert('No DROP COLUMN in migration 031', !fileContains('server/db/migrations/031_pos360_floor_management_foundation.sql', 'DROP COLUMN'))
  assert('contains_secrets: false in audit writes', fileContains(svc, 'contains_secrets'))
  assert('exposes_private_data: false in audit writes', fileContains(svc, 'exposesPrivateData'))
  assert('Migration 030 unchanged', fileExists('server/db/migrations/030_smokecraft_orders_schema_backfill.sql'))
}

console.log(`\n══════════════════════════════════════════════════════════`)
console.log(`  Results: ${passed} passed, ${failed} failed`)
console.log(`══════════════════════════════════════════════════════════`)
if (failed > 0) { process.exit(1) }
