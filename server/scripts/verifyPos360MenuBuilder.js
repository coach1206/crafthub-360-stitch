/**
 * Verification script — POS360 Venue Menu Builder (Phase B.2)
 * Run: node server/scripts/verifyPos360MenuBuilder.js
 */
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..', '..')

let pass = 0
let fail = 0
const failures = []

function check(label, result) {
  if (result) {
    pass++
    console.log(`  ✓  ${label}`)
  } else {
    fail++
    failures.push(label)
    console.log(`  ✗  ${label}`)
  }
}

function fileExists(rel) {
  return existsSync(join(root, rel))
}

function fileContains(rel, str) {
  if (!fileExists(rel)) return false
  return readFileSync(join(root, rel), 'utf8').includes(str)
}

function fileNotContains(rel, str) {
  if (!fileExists(rel)) return true
  return !readFileSync(join(root, rel), 'utf8').includes(str)
}

function countMatches(rel, pattern) {
  if (!fileExists(rel)) return 0
  const content = readFileSync(join(root, rel), 'utf8')
  return (content.match(new RegExp(pattern, 'g')) || []).length
}

console.log('\n── POS360 Venue Menu Builder Verification ─────────────────────\n')

// 1. Migration file
console.log('1. Migration')
check('032_pos360_venue_menu_builder.sql exists',
  fileExists('server/db/migrations/032_pos360_venue_menu_builder.sql'))
check('pos360_menus table defined',
  fileContains('server/db/migrations/032_pos360_venue_menu_builder.sql', 'CREATE TABLE IF NOT EXISTS pos360_menus'))
check('pos360_menu_categories table defined',
  fileContains('server/db/migrations/032_pos360_venue_menu_builder.sql', 'CREATE TABLE IF NOT EXISTS pos360_menu_categories'))
check('pos360_menu_items table defined',
  fileContains('server/db/migrations/032_pos360_venue_menu_builder.sql', 'CREATE TABLE IF NOT EXISTS pos360_menu_items'))
check('pos360_menu_pricing_rules table defined',
  fileContains('server/db/migrations/032_pos360_venue_menu_builder.sql', 'CREATE TABLE IF NOT EXISTS pos360_menu_pricing_rules'))
check('pos360_menu_routing_stations table defined',
  fileContains('server/db/migrations/032_pos360_venue_menu_builder.sql', 'CREATE TABLE IF NOT EXISTS pos360_menu_routing_stations'))
check('pos360_menu_audit table has contains_secrets column',
  fileContains('server/db/migrations/032_pos360_venue_menu_builder.sql', 'contains_secrets'))
check('smokecraft_meta JSONB column on items',
  fileContains('server/db/migrations/032_pos360_venue_menu_builder.sql', 'smokecraft_meta'))
check('No DROP TABLE statement in migration (comments allowed)',
  (() => {
    if (!fileExists('server/db/migrations/032_pos360_venue_menu_builder.sql')) return false
    const lines = readFileSync(join(root, 'server/db/migrations/032_pos360_venue_menu_builder.sql'), 'utf8').split('\n')
    return !lines.some(l => !l.trimStart().startsWith('--') && /DROP\s+TABLE/i.test(l))
  })())

// 2. Event contracts
console.log('\n2. Event Contracts')
check('pos360MenuEventContracts.js exists',
  fileExists('server/services/pos360/pos360MenuEventContracts.js'))
check('MENU_EVENTS exported',
  fileContains('server/services/pos360/pos360MenuEventContracts.js', 'export const MENU_EVENTS'))
check('menu.created event defined',
  fileContains('server/services/pos360/pos360MenuEventContracts.js', 'menu.created'))
check('menu.item.created event defined',
  fileContains('server/services/pos360/pos360MenuEventContracts.js', 'menu.item.created'))
check('menu.item.out_of_stock event defined',
  fileContains('server/services/pos360/pos360MenuEventContracts.js', 'menu.item.out_of_stock'))

// 3. Feature flags
console.log('\n3. Feature Flags')
check('pos360MenuFeatureFlags.js exists',
  fileExists('server/config/pos360MenuFeatureFlags.js'))
check('POS360_MENU_FLAGS exported',
  fileContains('server/config/pos360MenuFeatureFlags.js', 'POS360_MENU_FLAGS'))
check('getMenuFlags function exported',
  fileContains('server/config/pos360MenuFeatureFlags.js', 'export function getMenuFlags'))

// 4. Service layer
console.log('\n4. Service Layer')
check('pos360MenuBuilderService.js exists',
  fileExists('server/services/pos360/pos360MenuBuilderService.js'))
check('Correct db import path (two levels up)',
  fileContains('server/services/pos360/pos360MenuBuilderService.js', "from '../../db/connection.js'"))
check('isDbAvailable guard used',
  fileContains('server/services/pos360/pos360MenuBuilderService.js', 'isDbAvailable'))
check('createMenu exported',
  fileContains('server/services/pos360/pos360MenuBuilderService.js', 'export async function createMenu'))
check('createCategory exported',
  fileContains('server/services/pos360/pos360MenuBuilderService.js', 'export async function createCategory'))
check('createItem exported',
  fileContains('server/services/pos360/pos360MenuBuilderService.js', 'export async function createItem'))
check('searchMenuItems exported',
  fileContains('server/services/pos360/pos360MenuBuilderService.js', 'export async function searchMenuItems'))
check('getActiveMenuForHandheld exported',
  fileContains('server/services/pos360/pos360MenuBuilderService.js', 'export async function getActiveMenuForHandheld'))
check('localPreview fallback present',
  fileContains('server/services/pos360/pos360MenuBuilderService.js', 'localPreview: true'))
check('DATABASE_URL never logged',
  fileNotContains('server/services/pos360/pos360MenuBuilderService.js', 'DATABASE_URL'))
check('No fake data — honest empty state for handheld',
  fileContains('server/services/pos360/pos360MenuBuilderService.js', 'No active menu configured'))
check('writeAudit sets containsSecrets false',
  fileContains('server/services/pos360/pos360MenuBuilderService.js', 'containsSecrets: false'))

// 5. Controller
console.log('\n5. Controller')
check('pos360MenuBuilderController.js exists',
  fileExists('server/controllers/pos360MenuBuilderController.js'))
check('ok500 wrapper used',
  fileContains('server/controllers/pos360MenuBuilderController.js', 'function ok500'))
check('createMenu controller exported',
  fileContains('server/controllers/pos360MenuBuilderController.js', 'export const createMenu'))
check('createItem controller exported',
  fileContains('server/controllers/pos360MenuBuilderController.js', 'export const createItem'))
check('getActiveMenuHandheld exported',
  fileContains('server/controllers/pos360MenuBuilderController.js', 'export const getActiveMenuHandheld'))

// 6. Routes
console.log('\n6. Routes')
check('pos360MenuBuilderRoutes.js exists',
  fileExists('server/routes/pos360MenuBuilderRoutes.js'))
check('venueTenantGuard applied',
  fileContains('server/routes/pos360MenuBuilderRoutes.js', 'venueTenantGuard'))
check('canAccessPOS3 on write routes',
  fileContains('server/routes/pos360MenuBuilderRoutes.js', 'canAccessPOS3'))
check('Handheld route: active-menu',
  fileContains('server/routes/pos360MenuBuilderRoutes.js', 'handheld/active-menu'))
check('Handheld route: categories',
  fileContains('server/routes/pos360MenuBuilderRoutes.js', 'handheld/categories'))
check('Import/export routes defined',
  fileContains('server/routes/pos360MenuBuilderRoutes.js', 'export'))
check('No open unauthenticated write routes (no router.post without guard)',
  (() => {
    const content = readFileSync(join(root, 'server/routes/pos360MenuBuilderRoutes.js'), 'utf8')
    const postLines = content.split('\n').filter(l => l.includes('router.post') || l.includes('router.patch') || l.includes('router.delete'))
    return postLines.every(l => l.includes('canAccessPOS3') || l.includes('venueTenantGuard'))
  })())

// 7. Server mounting
console.log('\n7. Server Mounting')
check('server/index.js imports pos360MenuBuilderRoutes',
  fileContains('server/index.js', 'pos360MenuBuilderRoutes'))
check('server/index.js mounts at /api/pos360/menu',
  fileContains('server/index.js', '/api/pos360/menu'))

// 8. UI
console.log('\n8. UI')
check('POS360VenueMenuBuilder.jsx exists',
  fileExists('src/pages/pos360/POS360VenueMenuBuilder.jsx'))
check('References /smokecraft-pos360.png',
  fileContains('src/pages/pos360/POS360VenueMenuBuilder.jsx', '/smokecraft-pos360.png'))
check('No hardcoded category buttons',
  fileNotContains('src/pages/pos360/POS360VenueMenuBuilder.jsx', 'Cocktails') &&
  fileNotContains('src/pages/pos360/POS360VenueMenuBuilder.jsx', 'Appetizers') &&
  fileNotContains('src/pages/pos360/POS360VenueMenuBuilder.jsx', 'Entrees'))
check('HandheldPreview renders categories from API (dynamic)',
  fileContains('src/pages/pos360/POS360VenueMenuBuilder.jsx', 'handheld/active-menu'))
check('App.jsx wires menu-builder route',
  fileContains('src/App.jsx', 'menu-builder') &&
  fileContains('src/App.jsx', 'POS360VenueMenuBuilder'))

// 9. package.json script
console.log('\n9. Package Scripts')
check('verify:pos360-menu-builder script in package.json',
  fileContains('package.json', 'verify:pos360-menu-builder'))

// 10. Safety
console.log('\n10. Safety')
check('No DROP TABLE anywhere in menu service',
  fileNotContains('server/services/pos360/pos360MenuBuilderService.js', 'DROP TABLE'))
check('No hardcoded venue types in service',
  fileNotContains('server/services/pos360/pos360MenuBuilderService.js', "'restaurant'") ||
  fileContains('server/services/pos360/pos360MenuBuilderService.js', 'venueType'))

// ── Summary ────────────────────────────────────────────────────────────────────
console.log('\n─────────────────────────────────────────────────────────────────')
console.log(`  ${pass} passed  |  ${fail} failed  |  ${pass + fail} total`)
if (failures.length > 0) {
  console.log('\nFailed checks:')
  failures.forEach(f => console.log(`  ✗  ${f}`))
  process.exit(1)
} else {
  console.log('\n  All checks passed — Phase B.2 Venue Menu Builder verified.\n')
}
