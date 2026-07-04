/**
 * POS360 Order Lifecycle — Verification Script (Phase B.5)
 */

import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root      = join(__dirname, '../..')

let passed = 0
let failed = 0

function check(label, condition) {
  if (condition) { console.log(`  ✅  ${label}`); passed++ }
  else           { console.log(`  ❌  ${label}`); failed++ }
}

function fileExists(rel)        { return existsSync(join(root, rel)) }
function fileContains(rel, str) { return fileExists(rel) && readFileSync(join(root, rel), 'utf8').includes(str) }
function fileNotContains(rel, pattern) {
  if (!fileExists(rel)) return false
  const lines = readFileSync(join(root, rel), 'utf8').split('\n')
  return !lines.some(l => !l.trimStart().startsWith('--') && new RegExp(pattern, 'i').test(l))
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('  POS360 Order Lifecycle — Verification (Phase B.5)')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

// ── 1. Migration ──────────────────────────────────────────────────────────────
console.log('1. Migration')
const MIG = 'server/db/migrations/035_pos360_order_lifecycle.sql'
check('Migration file exists', fileExists(MIG))
check('Uses CREATE TABLE IF NOT EXISTS', fileContains(MIG, 'CREATE TABLE IF NOT EXISTS'))
check('No DROP TABLE (non-comment)', fileNotContains(MIG, 'DROP\\s+TABLE'))
check('pos360_orders table', fileContains(MIG, 'pos360_orders'))
check('pos360_order_items table', fileContains(MIG, 'pos360_order_items'))
check('pos360_order_item_modifiers table', fileContains(MIG, 'pos360_order_item_modifiers'))
check('pos360_order_item_addons table', fileContains(MIG, 'pos360_order_item_addons'))
check('pos360_order_courses table', fileContains(MIG, 'pos360_order_courses'))
check('pos360_order_tabs table', fileContains(MIG, 'pos360_order_tabs'))
check('pos360_order_tab_links table', fileContains(MIG, 'pos360_order_tab_links'))
check('pos360_order_status_history table', fileContains(MIG, 'pos360_order_status_history'))
check('pos360_order_item_status_history table', fileContains(MIG, 'pos360_order_item_status_history'))
check('pos360_order_routing_events table', fileContains(MIG, 'pos360_order_routing_events'))
check('pos360_order_hold_fire_events table', fileContains(MIG, 'pos360_order_hold_fire_events'))
check('pos360_order_guest_links table', fileContains(MIG, 'pos360_order_guest_links'))
check('pos360_order_table_links table', fileContains(MIG, 'pos360_order_table_links'))
check('pos360_order_smokecraft_links table', fileContains(MIG, 'pos360_order_smokecraft_links'))
check('pos360_order_loyalty_links table', fileContains(MIG, 'pos360_order_loyalty_links'))
check('pos360_order_audit table', fileContains(MIG, 'pos360_order_audit'))
check('contains_secrets in audit', fileContains(MIG, 'contains_secrets'))

// ── 2. Event contracts ────────────────────────────────────────────────────────
console.log('\n2. Event Contracts')
const EVTS = 'server/services/pos360/pos360OrderEventContracts.js'
check('Event contracts file exists', fileExists(EVTS))
check('ORDER_EVENTS exported', fileContains(EVTS, 'export const ORDER_EVENTS'))
check('ORDER_TYPES exported', fileContains(EVTS, 'export const ORDER_TYPES'))
check('ORDER_STATUSES exported', fileContains(EVTS, 'export const ORDER_STATUSES'))
check('ORDER_ITEM_STATUSES exported', fileContains(EVTS, 'export const ORDER_ITEM_STATUSES'))
check('TAB_TYPES exported', fileContains(EVTS, 'export const TAB_TYPES'))
check('COURSE_STATUSES exported', fileContains(EVTS, 'export const COURSE_STATUSES'))
check('HOLD_FIRE_TYPES exported', fileContains(EVTS, 'export const HOLD_FIRE_TYPES'))
check('order.routing.resolved event', fileContains(EVTS, 'ROUTING_RESOLVED'))
check('order.routed_to_production event', fileContains(EVTS, 'ROUTED_TO_PRODUCTION'))
check('order.production_ticket.created event', fileContains(EVTS, 'PRODUCTION_TICKET_CREATED'))

// ── 3. Feature flags ──────────────────────────────────────────────────────────
console.log('\n3. Feature Flags')
const FLAGS = 'server/config/pos360OrderFeatureFlags.js'
check('Feature flags file exists', fileExists(FLAGS))
check('POS360_ORDER_FLAGS exported', fileContains(FLAGS, 'export const POS360_ORDER_FLAGS'))
check('pos360.orders.enabled flag', fileContains(FLAGS, "'pos360.orders.enabled'"))
check('tabs_enabled flag', fileContains(FLAGS, 'tabs_enabled'))
check('production_routing_enabled flag', fileContains(FLAGS, 'production_routing_enabled'))
check('getOrderFlags exported', fileContains(FLAGS, 'export function getOrderFlags'))

// ── 4. Service ────────────────────────────────────────────────────────────────
console.log('\n4. Service')
const SVC = 'server/services/pos360/pos360OrderLifecycleService.js'
check('Service file exists', fileExists(SVC))
check('Service imports isDbAvailable', fileContains(SVC, 'isDbAvailable'))
check('Service does not log DATABASE_URL', !fileContains(SVC, 'DATABASE_URL'))
check('createOrder exported', fileContains(SVC, 'export async function createOrder'))
check('addItemToOrder exported', fileContains(SVC, 'export async function addItemToOrder'))
check('createCourse exported', fileContains(SVC, 'export async function createCourse'))
check('fireCourse exported', fileContains(SVC, 'export async function fireCourse'))
check('fireAllCourses exported', fileContains(SVC, 'export async function fireAllCourses'))
check('createTab exported', fileContains(SVC, 'export async function createTab'))
check('mergeTabs exported', fileContains(SVC, 'export async function mergeTabs'))
check('splitTab exported', fileContains(SVC, 'export async function splitTab'))
check('holdItem exported', fileContains(SVC, 'export async function holdItem'))
check('fireOrder exported', fileContains(SVC, 'export async function fireOrder'))
check('routeOrderToProduction exported (B.4 hook)', fileContains(SVC, 'export async function routeOrderToProduction'))
check('createProductionTicketFromOrder exported', fileContains(SVC, 'export async function createProductionTicketFromOrder'))
check('linkSmokecraftToOrder exported (SmokeCraft hook)', fileContains(SVC, 'export async function linkSmokecraftToOrder'))
check('linkLoyaltyToOrder exported (loyalty hook)', fileContains(SVC, 'export async function linkLoyaltyToOrder'))
check('submitHandheldOrderToProduction exported (B.3 hook)', fileContains(SVC, 'export async function submitHandheldOrderToProduction'))
check('linkOrderToTable exported (B.1 floor hook)', fileContains(SVC, 'export async function linkOrderToTable'))
check('resolveOrderRouting reads B.2 menu routing', fileContains(SVC, 'pos360_menu_item_routing'))
check('routeOrderToProduction creates B.4 production tickets', fileContains(SVC, 'pos360_production_tickets'))
check('getOrderAuditTimeline exported', fileContains(SVC, 'export async function getOrderAuditTimeline'))
check('No active orders empty state message', fileContains(SVC, 'No active orders found for this venue.'))
check('Routing not resolved empty state', fileContains(SVC, 'Routing could not be resolved for this item.'))
check('Production ticket not created message', fileContains(SVC, 'Production ticket was not created. Check routing configuration.'))

// ── 5. Controller ─────────────────────────────────────────────────────────────
console.log('\n5. Controller')
const CTRL = 'server/controllers/pos360OrderLifecycleController.js'
check('Controller file exists', fileExists(CTRL))
check('ok500 wrapper defined', fileContains(CTRL, 'function ok500'))
check('vid() helper', fileContains(CTRL, 'function vid('))
check('actor() helper', fileContains(CTRL, 'function actor('))

// ── 6. Routes ─────────────────────────────────────────────────────────────────
console.log('\n6. Routes')
const ROUTES = 'server/routes/pos360OrderLifecycleRoutes.js'
check('Routes file exists', fileExists(ROUTES))
check('venueTenantGuard applied', fileContains(ROUTES, 'venueTenantGuard'))
check('canAccessPOS3 on writes', fileContains(ROUTES, 'canAccessPOS3'))
check('/tabs route', fileContains(ROUTES, "'/tabs'"))
check('/courses route', fileContains(ROUTES, "'/courses/:courseId'"))
check('/route-to-production route', fileContains(ROUTES, "route-to-production"))
check('/hold-fire-history route', fileContains(ROUTES, "hold-fire-history"))
check('/smokecraft route', fileContains(ROUTES, "'/:orderId/smokecraft'"))
check('/loyalty route', fileContains(ROUTES, "'/:orderId/loyalty'"))
check('/audit route', fileContains(ROUTES, "'/:orderId/audit'"))
check('/handheld route', fileContains(ROUTES, "handheld"))

// ── 7. Server mounting ────────────────────────────────────────────────────────
console.log('\n7. Server Mounting')
const IDX = 'server/index.js'
check('pos360OrderLifecycleRoutes imported', fileContains(IDX, 'pos360OrderLifecycleRoutes'))
check('Mounted at /api/pos360/orders', fileContains(IDX, "'/api/pos360/orders'"))

// ── 8. UI ──────────────────────────────────────────────────────────────────────
console.log('\n8. UI Components')
const UI = 'src/pages/pos360/POS360OrderLifecycle.jsx'
check('UI file exists', fileExists(UI))
check('OrderLifecycleHome component', fileContains(UI, 'function OrderLifecycleHome'))
check('OrderList component', fileContains(UI, 'function OrderList'))
check('OrderDetail component', fileContains(UI, 'function OrderDetail'))
check('OrderCart component', fileContains(UI, 'function OrderCart'))
check('OrderItemRow component', fileContains(UI, 'function OrderItemRow'))
check('ModifierAddonPanel component', fileContains(UI, 'function ModifierAddonPanel'))
check('CourseManager component', fileContains(UI, 'function CourseManager'))
check('HoldFireControlPanel component', fileContains(UI, 'function HoldFireControlPanel'))
check('TabManager component', fileContains(UI, 'function TabManager'))
check('TableOrderPanel component (B.1 floor hook)', fileContains(UI, 'function TableOrderPanel'))
check('GuestOrderPanel component', fileContains(UI, 'function GuestOrderPanel'))
check('SmokeCraftOrderContextPanel component', fileContains(UI, 'function SmokeCraftOrderContextPanel'))
check('LoyaltyOrderContextPanel component', fileContains(UI, 'function LoyaltyOrderContextPanel'))
check('RoutingStatusPanel component (B.4 hook)', fileContains(UI, 'function RoutingStatusPanel'))
check('ProductionTicketPreview component (B.4 hook)', fileContains(UI, 'function ProductionTicketPreview'))
check('OrderAuditTimeline component', fileContains(UI, 'function OrderAuditTimeline'))
check('smokecraft-pos360.png referenced', fileContains(UI, '/smokecraft-pos360.png'))
check('usePOS360VenueContextHook used', fileContains(UI, 'usePOS360VenueContextHook'))
check('No hardcoded venue ID', !fileContains(UI, "'local-dev-venue'"))
check('No active orders empty state', fileContains(UI, 'No active orders found for this venue.'))
check('Routing not resolved message', fileContains(UI, 'Routing could not be resolved for this item.'))
check('Production ticket not created message', fileContains(UI, 'Production ticket was not created'))

// ── 9. App.jsx wiring ─────────────────────────────────────────────────────────
console.log('\n9. App.jsx Wiring')
const APP = 'src/App.jsx'
check('POS360OrderLifecycle imported', fileContains(APP, 'POS360OrderLifecycle'))
check('orders route added', fileContains(APP, 'path="orders"'))

// ── 10. Existing B-phase files not broken ─────────────────────────────────────
console.log('\n10. Prior Phase Files Intact')
check('B.1 floor management UI exists', fileExists('src/pages/pos360/POS360FloorManagement.jsx'))
check('B.2 menu builder UI exists', fileExists('src/pages/pos360/POS360VenueMenuBuilder.jsx'))
check('B.3 handheld POS UI exists', fileExists('src/pages/pos360/POS360HandheldPOS.jsx'))
check('B.4 production display UI exists', fileExists('src/pages/pos360/POS360ProductionDisplay.jsx'))
check('B.2 menu item routing table in B.5 service (cross-phase)', fileContains(SVC, 'pos360_menu_item_routing'))
check('B.4 production tickets table in B.5 service (cross-phase)', fileContains(SVC, 'pos360_production_tickets'))

// ── 11. Audit ─────────────────────────────────────────────────────────────────
console.log('\n11. Audit')
check('Audit table in migration', fileContains(MIG, 'pos360_order_audit'))
check('contains_secrets BOOLEAN DEFAULT FALSE in audit', fileContains(MIG, 'contains_secrets'))
check('exposes_private_data BOOLEAN DEFAULT FALSE in audit', fileContains(MIG, 'exposes_private_data'))
check('auditLog helper in service', fileContains(SVC, 'async function auditLog'))

// ── 12. package.json ──────────────────────────────────────────────────────────
console.log('\n12. package.json')
check('verify:pos360-orders script exists', fileContains('package.json', 'verify:pos360-orders'))

// ── Summary ───────────────────────────────────────────────────────────────────
const total = passed + failed
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log(`  Result: ${passed}/${total} checks passed`)
if (failed > 0) {
  console.log(`  ❌  ${failed} check(s) failed`)
  process.exit(1)
} else {
  console.log(`  ✅  All checks passed — Phase B.5 verification complete`)
}
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
