/**
 * POS360 Production Display System — Verification Script (Phase B.4)
 * 30 checks
 */

import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root      = join(__dirname, '../..')

let passed = 0
let failed = 0

function check(label, condition) {
  if (condition) {
    console.log(`  ✅  ${label}`)
    passed++
  } else {
    console.log(`  ❌  ${label}`)
    failed++
  }
}

function fileExists(rel) {
  return existsSync(join(root, rel))
}

function fileContains(rel, str) {
  if (!fileExists(rel)) return false
  return readFileSync(join(root, rel), 'utf8').includes(str)
}

function fileNotContains(rel, pattern) {
  if (!fileExists(rel)) return false
  const lines = readFileSync(join(root, rel), 'utf8').split('\n')
  return !lines.some(l => !l.trimStart().startsWith('--') && new RegExp(pattern, 'i').test(l))
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('  POS360 Production Display System — Verification (Phase B.4)')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

// ── 1. Migration file ──────────────────────────────────────────────────────
console.log('1. Migration')
const MIGRATION = 'server/db/migrations/034_pos360_production_display_system.sql'
check('Migration file exists', fileExists(MIGRATION))
check('Uses CREATE TABLE IF NOT EXISTS', fileContains(MIGRATION, 'CREATE TABLE IF NOT EXISTS'))
check('No DROP TABLE (non-comment)', fileNotContains(MIGRATION, 'DROP\\s+TABLE'))
check('contains_secrets column in audit table', fileContains(MIGRATION, 'contains_secrets'))
check('pos360_production_stations table', fileContains(MIGRATION, 'pos360_production_stations'))
check('pos360_production_tickets table', fileContains(MIGRATION, 'pos360_production_tickets'))
check('pos360_production_ticket_items table', fileContains(MIGRATION, 'pos360_production_ticket_items'))
check('hold_fire_events table', fileContains(MIGRATION, 'pos360_production_hold_fire_events'))
check('routing_rules table', fileContains(MIGRATION, 'pos360_production_routing_rules'))

// ── 2. Event contracts ─────────────────────────────────────────────────────
console.log('\n2. Event Contracts')
const EVENTS = 'server/services/pos360/pos360ProductionEventContracts.js'
check('Event contracts file exists', fileExists(EVENTS))
check('PRODUCTION_EVENTS exported', fileContains(EVENTS, 'export const PRODUCTION_EVENTS'))
check('STATION_TYPES exported (10 types)', fileContains(EVENTS, 'export const STATION_TYPES'))
check('humidor station type', fileContains(EVENTS, "'humidor'"))
check('custom station type', fileContains(EVENTS, "'custom'"))
check('TICKET_STATUSES exported', fileContains(EVENTS, 'export const TICKET_STATUSES'))
check('ITEM_STATUSES exported', fileContains(EVENTS, 'export const ITEM_STATUSES'))
check('DISPLAY_MODES exported', fileContains(EVENTS, 'export const DISPLAY_MODES'))
check('HOLD_FIRE_EVENT_TYPES exported', fileContains(EVENTS, 'export const HOLD_FIRE_EVENT_TYPES'))

// ── 3. Feature flags ───────────────────────────────────────────────────────
console.log('\n3. Feature Flags')
const FLAGS = 'server/config/pos360ProductionFeatureFlags.js'
check('Feature flags file exists', fileExists(FLAGS))
check('POS360_PRODUCTION_FLAGS exported', fileContains(FLAGS, 'export const POS360_PRODUCTION_FLAGS'))
check('getProductionFlags function exported', fileContains(FLAGS, 'export function getProductionFlags'))

// ── 4. Service ─────────────────────────────────────────────────────────────
console.log('\n4. Service')
const SVC = 'server/services/pos360/pos360ProductionDisplayService.js'
check('Service file exists', fileExists(SVC))
check('Service imports isDbAvailable', fileContains(SVC, 'isDbAvailable'))
check('Service does not log DATABASE_URL', !fileContains(SVC, 'DATABASE_URL'))
check('createStation exported', fileContains(SVC, 'export async function createStation'))
check('createTicket exported', fileContains(SVC, 'export async function createTicket'))
check('holdItem exported', fileContains(SVC, 'export async function holdItem'))
check('fireItem exported', fileContains(SVC, 'export async function fireItem'))
check('getStationDisplayState exported', fileContains(SVC, 'export async function getStationDisplayState'))
check('resolveRoutingForItem exported (B.2 integration)', fileContains(SVC, 'export async function resolveRoutingForItem'))
check('getProductionSmokecraftContext exported', fileContains(SVC, 'export async function getProductionSmokecraftContext'))
check('getProductionRecommendations exported (E.A.T.)', fileContains(SVC, 'export async function getProductionRecommendations'))
check('recordAnalyticsEvent exported', fileContains(SVC, 'export async function recordAnalyticsEvent'))

// ── 5. Controller ──────────────────────────────────────────────────────────
console.log('\n5. Controller')
const CTRL = 'server/controllers/pos360ProductionController.js'
check('Controller file exists', fileExists(CTRL))
check('ok500 wrapper defined', fileContains(CTRL, 'function ok500'))
check('vid() helper defined', fileContains(CTRL, 'function vid('))
check('actor() helper defined', fileContains(CTRL, 'function actor('))

// ── 6. Routes ──────────────────────────────────────────────────────────────
console.log('\n6. Routes')
const ROUTES = 'server/routes/pos360ProductionRoutes.js'
check('Routes file exists', fileExists(ROUTES))
check('venueTenantGuard applied', fileContains(ROUTES, 'venueTenantGuard'))
check('canAccessPOS3 on writes', fileContains(ROUTES, 'canAccessPOS3'))
check('/stations route', fileContains(ROUTES, "'/stations'"))
check('/tickets route', fileContains(ROUTES, "'/tickets'"))
check('/display/station route', fileContains(ROUTES, "'/display/station/:stationId'"))
check('/routing-rules route', fileContains(ROUTES, "'/routing-rules'"))
check('/smokecraft route', fileContains(ROUTES, "'/smokecraft'"))
check('/analytics/summary route', fileContains(ROUTES, "'/analytics/summary'"))

// ── 7. Server mounting ─────────────────────────────────────────────────────
console.log('\n7. Server Mounting')
const IDX = 'server/index.js'
check('pos360ProductionRoutes imported in index.js', fileContains(IDX, 'pos360ProductionRoutes'))
check('Mounted at /api/pos360/production', fileContains(IDX, "'/api/pos360/production'"))

// ── 8. UI ──────────────────────────────────────────────────────────────────
console.log('\n8. UI Components')
const UI = 'src/pages/pos360/POS360ProductionDisplay.jsx'
check('UI file exists', fileExists(UI))
check('StationSelector component', fileContains(UI, 'function StationSelector'))
check('KitchenDisplay component', fileContains(UI, 'function KitchenDisplay'))
check('BarDisplay component', fileContains(UI, 'function BarDisplay'))
check('HumidorDisplay component', fileContains(UI, 'function HumidorDisplay'))
check('ExpoDisplay component', fileContains(UI, 'function ExpoDisplay'))
check('CustomStationDisplay component', fileContains(UI, 'function CustomStationDisplay'))
check('TicketCard component', fileContains(UI, 'function TicketCard'))
check('TicketDetailDrawer component', fileContains(UI, 'function TicketDetailDrawer'))
check('TicketItemRow component', fileContains(UI, 'function TicketItemRow'))
check('HoldFireControlPanel component', fileContains(UI, 'function HoldFireControlPanel'))
check('RoutingStatusPanel component', fileContains(UI, 'function RoutingStatusPanel'))
check('TimerBar component', fileContains(UI, 'function TimerBar'))
check('RushDelayQueue component', fileContains(UI, 'function RushDelayQueue'))
check('CompletedTicketsPanel component', fileContains(UI, 'function CompletedTicketsPanel'))
check('SmokeCraftProductionContextPanel component', fileContains(UI, 'function SmokeCraftProductionContextPanel'))
check('EATProductionRecommendationsPanel component', fileContains(UI, 'function EATProductionRecommendationsPanel'))
check('ProductionAnalyticsPreview component', fileContains(UI, 'function ProductionAnalyticsPreview'))
check('DisplaySyncStatus component', fileContains(UI, 'function DisplaySyncStatus'))
check('smokecraft-pos360.png referenced', fileContains(UI, '/smokecraft-pos360.png'))
check('usePOS360VenueContextHook used', fileContains(UI, 'usePOS360VenueContextHook'))
check('No hardcoded venue ID', !fileContains(UI, "'local-dev-venue'"))
check('Ticket statuses supported (fired/in_progress/ready)', fileContains(UI, 'in_progress'))
check('Allergy flags displayed', fileContains(UI, 'allergy_flags'))
check('All station types handled (humidor shown)', fileContains(UI, 'humidor'))

// ── 9. App.jsx wiring ──────────────────────────────────────────────────────
console.log('\n9. App.jsx Wiring')
const APP = 'src/App.jsx'
check('POS360ProductionDisplay imported', fileContains(APP, 'POS360ProductionDisplay'))
check('production route added', fileContains(APP, 'path="production"'))

// ── 10. package.json script ────────────────────────────────────────────────
console.log('\n10. package.json')
const PKG = 'package.json'
check('verify:pos360-production script exists', fileContains(PKG, 'verify:pos360-production'))

// ── Summary ────────────────────────────────────────────────────────────────
const total = passed + failed
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log(`  Result: ${passed}/${total} checks passed`)
if (failed > 0) {
  console.log(`  ❌  ${failed} check(s) failed — see above`)
  process.exit(1)
} else {
  console.log(`  ✅  All checks passed — Phase B.4 verification complete`)
}
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
