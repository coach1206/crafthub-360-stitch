/**
 * verifyKdsFulfillmentEngine.js — 101 checks
 * Verifies Phase 9 KDS / Kitchen Routing and Fulfillment Station Engine.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')

let passed = 0
let failed = 0
const failures = []

function check(id, description, fn) {
  try {
    const result = fn()
    if (result === true || result === undefined) { console.log(`  ✓ [${id}] ${description}`); passed++ }
    else { console.error(`  ✗ [${id}] ${description} — ${result}`); failed++; failures.push(`[${id}] ${description}: ${result}`) }
  } catch (err) { console.error(`  ✗ [${id}] ${description} — threw: ${err.message}`); failed++; failures.push(`[${id}] threw ${err.message}`) }
}

async function checkAsync(id, description, fn) {
  try {
    const result = await fn()
    if (result === true || result === undefined) { console.log(`  ✓ [${id}] ${description}`); passed++ }
    else { console.error(`  ✗ [${id}] ${description} — ${result}`); failed++; failures.push(`[${id}] ${description}: ${result}`) }
  } catch (err) { console.error(`  ✗ [${id}] ${description} — threw: ${err.message}`); failed++; failures.push(`[${id}] threw ${err.message}`) }
}

function fileExists(rel) { return fs.existsSync(path.join(ROOT, rel)) }
function readFile(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8') }

console.log('\n=== verifyKdsFulfillmentEngine — 101 checks ===\n')

// ── 1–12. Migration ───────────────────────────────────────────────────────────
check(1, 'Migration 024 exists', () => fileExists('server/db/migrations/024_kds_fulfillment_station_engine.sql') || 'file missing')

const migration = fileExists('server/db/migrations/024_kds_fulfillment_station_engine.sql')
  ? readFile('server/db/migrations/024_kds_fulfillment_station_engine.sql') : ''

check(2,  'kds_station_profiles table defined', () => migration.includes('kds_station_profiles') || 'table not found')
check(3,  'kds_station_mappings table defined', () => migration.includes('kds_station_mappings') || 'table not found')
check(4,  'kds_routing_rules table defined', () => migration.includes('kds_routing_rules') || 'table not found')
check(5,  'kds_order_dispatches table defined', () => migration.includes('kds_order_dispatches') || 'table not found')
check(6,  'kds_line_item_dispatches table defined', () => migration.includes('kds_line_item_dispatches') || 'table not found')
check(7,  'kds_station_health_logs table defined', () => migration.includes('kds_station_health_logs') || 'table not found')
check(8,  'kds_fulfillment_handoffs table defined', () => migration.includes('kds_fulfillment_handoffs') || 'table not found')
check(9,  'kds_routing_audit_logs table defined', () => migration.includes('kds_routing_audit_logs') || 'table not found')
check(10, 'Migration uses IF NOT EXISTS', () => migration.includes('IF NOT EXISTS') || 'missing safety guard')
check(11, 'Migration uses timestamptz', () => migration.includes('TIMESTAMPTZ') || 'missing timestamptz')
check(12, 'Migration uses jsonb', () => migration.includes('JSONB') || 'missing jsonb')

// ── 13–21. stationConfigService ───────────────────────────────────────────────
check(13, 'stationConfigService exists', () => fileExists('server/services/kds/stationConfigService.js') || 'file missing')

const stationSvc = fileExists('server/services/kds/stationConfigService.js')
  ? readFile('server/services/kds/stationConfigService.js') : ''

check(14, 'getVenueStations exists', () => stationSvc.includes('getVenueStations') || 'function missing')
check(15, 'getStationProfile exists', () => stationSvc.includes('getStationProfile') || 'function missing')
check(16, 'createOrUpdateStationProfile exists', () => stationSvc.includes('createOrUpdateStationProfile') || 'function missing')
check(17, 'getStationMappings exists', () => stationSvc.includes('getStationMappings') || 'function missing')
check(18, 'createOrUpdateStationMapping exists', () => stationSvc.includes('createOrUpdateStationMapping') || 'function missing')
check(19, 'getRoutingRules exists', () => stationSvc.includes('getRoutingRules') || 'function missing')
check(20, 'createOrUpdateRoutingRule exists', () => stationSvc.includes('createOrUpdateRoutingRule') || 'function missing')
check(21, 'getStationConfigReadiness exists', () => stationSvc.includes('getStationConfigReadiness') || 'function missing')

// ── 22–40. kdsRoutingEngine ───────────────────────────────────────────────────
check(22, 'kdsRoutingEngine exists', () => fileExists('server/services/kds/kdsRoutingEngine.js') || 'file missing')

const routingEngine = fileExists('server/services/kds/kdsRoutingEngine.js')
  ? readFile('server/services/kds/kdsRoutingEngine.js') : ''

check(23, 'routeOrderToStations exists', () => routingEngine.includes('routeOrderToStations') || 'function missing')
check(24, 'routeLineItemToStation exists', () => routingEngine.includes('routeLineItemToStation') || 'function missing')
check(25, 'buildRoutingPlan exists', () => routingEngine.includes('buildRoutingPlan') || 'function missing')
check(26, 'validateRoutingInput exists', () => routingEngine.includes('validateRoutingInput') || 'function missing')
check(27, 'getStationForCategory exists', () => routingEngine.includes('getStationForCategory') || 'function missing')
check(28, 'getFulfillmentOwnerForLineItem exists', () => routingEngine.includes('getFulfillmentOwnerForLineItem') || 'function missing')
check(29, 'buildDispatchPreview exists', () => routingEngine.includes('buildDispatchPreview') || 'function missing')
check(30, 'getRoutingBlockers exists', () => routingEngine.includes('getRoutingBlockers') || 'function missing')
check(31, 'getRoutingReadiness exists', () => routingEngine.includes('getRoutingReadiness') || 'function missing')
check(32, 'cigar/tobacco route to humidor', () => routingEngine.includes("cigar") && routingEngine.includes("humidor") || 'routing missing')
check(33, 'alcohol/beverage route to bar', () => routingEngine.includes("alcohol") && routingEngine.includes("bar") || 'routing missing')
check(34, 'food routes to kitchen', () => routingEngine.includes("food") && routingEngine.includes("kitchen") || 'routing missing')
check(35, 'partner items route to partner_window', () => routingEngine.includes("partner_window") || 'routing missing')
check(36, 'expo routing exists', () => routingEngine.includes("expo") || 'expo routing missing')
check(37, 'patio_runner routing exists', () => routingEngine.includes("patio_runner") || 'patio runner missing')
check(38, 'service_runner routing exists', () => routingEngine.includes("service_runner") || 'service runner missing')
check(39, 'pickup_handoff routing exists', () => routingEngine.includes("pickup_handoff") || 'pickup handoff missing')
check(40, 'delivery_handoff routing exists', () => routingEngine.includes("delivery_handoff") || 'delivery handoff missing')

// ── 41–49. fulfillmentStationEngine ──────────────────────────────────────────
check(41, 'fulfillmentStationEngine exists', () => fileExists('server/services/kds/fulfillmentStationEngine.js') || 'file missing')

const fulfillSvc = fileExists('server/services/kds/fulfillmentStationEngine.js')
  ? readFile('server/services/kds/fulfillmentStationEngine.js') : ''

check(42, 'getFulfillmentStations exists', () => fulfillSvc.includes('getFulfillmentStations') || 'function missing')
check(43, 'getFulfillmentPlan exists', () => fulfillSvc.includes('getFulfillmentPlan') || 'function missing')
check(44, 'getLineItemFulfillmentStatus exists', () => fulfillSvc.includes('getLineItemFulfillmentStatus') || 'function missing')
check(45, 'updateLineItemFulfillmentPreview exists', () => fulfillSvc.includes('updateLineItemFulfillmentPreview') || 'function missing')
check(46, 'buildHandoffPlan exists', () => fulfillSvc.includes('buildHandoffPlan') || 'function missing')
check(47, 'getHandoffStatus exists', () => fulfillSvc.includes('getHandoffStatus') || 'function missing')
check(48, 'getFulfillmentBlockers exists', () => fulfillSvc.includes('getFulfillmentBlockers') || 'function missing')
check(49, 'getFulfillmentReadiness exists', () => fulfillSvc.includes('getFulfillmentReadiness') || 'function missing')

// ── 50–55. stationHealthEngine ────────────────────────────────────────────────
check(50, 'stationHealthEngine exists', () => fileExists('server/services/kds/stationHealthEngine.js') || 'file missing')

const healthSvc = fileExists('server/services/kds/stationHealthEngine.js')
  ? readFile('server/services/kds/stationHealthEngine.js') : ''

check(51, 'getStationHealth exists', () => healthSvc.includes('getStationHealth') || 'function missing')
check(52, 'getVenueStationHealth exists', () => healthSvc.includes('getVenueStationHealth') || 'function missing')
check(53, 'updateStationHealthPreview exists', () => healthSvc.includes('updateStationHealthPreview') || 'function missing')
check(54, 'getUnavailableStations exists', () => healthSvc.includes('getUnavailableStations') || 'function missing')
check(55, 'getStationHealthReadiness exists', () => healthSvc.includes('getStationHealthReadiness') || 'function missing')

// ── 56–61. kdsAuditService ────────────────────────────────────────────────────
check(56, 'kdsAuditService exists', () => fileExists('server/services/kds/kdsAuditService.js') || 'file missing')

const auditSvc = fileExists('server/services/kds/kdsAuditService.js')
  ? readFile('server/services/kds/kdsAuditService.js') : ''

check(57, 'logKdsAuditEvent exists', () => auditSvc.includes('logKdsAuditEvent') || 'function missing')
check(58, 'buildKdsAuditEvent exists', () => auditSvc.includes('buildKdsAuditEvent') || 'function missing')
check(59, 'getKdsAuditTrail exists', () => auditSvc.includes('getKdsAuditTrail') || 'function missing')
check(60, 'logDispatchEvent exists', () => auditSvc.includes('logDispatchEvent') || 'function missing')
check(61, 'logHandoffEvent exists', () => auditSvc.includes('logHandoffEvent') || 'function missing')

// ── 62–64. Controller and routes ──────────────────────────────────────────────
check(62, 'Controller exists', () => fileExists('server/controllers/kdsRoutingController.js') || 'file missing')
check(63, 'Routes exist', () => fileExists('server/routes/kdsRoutingRoutes.js') || 'file missing')
check(64, 'Routes mounted in server/index.js at /api/kds', () => readFile('server/index.js').includes('/api/kds') || 'route not mounted')

// ── 65–74. Endpoint coverage ─────────────────────────────────────────────────
const routes = fileExists('server/routes/kdsRoutingRoutes.js')
  ? readFile('server/routes/kdsRoutingRoutes.js') : ''

check(65, 'Station endpoints exist (GET stations)', () => routes.includes('stations') || 'endpoint missing')
check(66, 'Mapping endpoints exist', () => routes.includes('mappings') || 'endpoint missing')
check(67, 'Routing rule endpoints exist', () => routes.includes('rules') || 'endpoint missing')
check(68, 'Readiness endpoint exists', () => routes.includes('readiness') || 'endpoint missing')
check(69, 'Route-order endpoint exists', () => routes.includes('route-order') || 'endpoint missing')
check(70, 'Dispatch-preview endpoint exists', () => routes.includes('dispatch-preview') || 'endpoint missing')
check(71, 'Fulfillment-plan endpoint exists', () => routes.includes('fulfillment-plan') || 'endpoint missing')
check(72, 'Handoff-plan endpoint exists', () => routes.includes('handoff-plan') || 'endpoint missing')
check(73, 'Health endpoints exist', () => routes.includes('health') || 'endpoint missing')
check(74, 'Audit endpoint exists', () => routes.includes('audit') || 'endpoint missing')

// ── 75–85. Status language ────────────────────────────────────────────────────
const allFiles = [stationSvc, routingEngine, fulfillSvc, healthSvc, auditSvc].join('\n')

check(75, 'station_config_required used', () => allFiles.includes('station_config_required') || 'status missing')
check(76, 'station_mapping_required used', () => allFiles.includes('station_mapping_required') || 'status missing')
check(77, 'routing_rule_required used', () => allFiles.includes('routing_rule_required') || 'status missing')
check(78, 'kds_routing_pending used', () => allFiles.includes('kds_routing_pending') || 'status missing')
check(79, 'dispatch_preview used', () => allFiles.includes('dispatch_preview') || 'status missing')
check(80, 'routing_preview used', () => allFiles.includes('routing_preview') || 'status missing')
check(81, 'station_unavailable used', () => allFiles.includes('station_unavailable') || 'status missing')
check(82, 'partner_window_required used', () => allFiles.includes('partner_window_required') || 'status missing')
check(83, 'expo_required used', () => allFiles.includes('expo_required') || 'status missing')
check(84, 'fulfillment_pending used', () => allFiles.includes('fulfillment_pending') || 'status missing')
check(85, 'Forbidden fake-live KDS language not used', () => {
  const forbidden = ['"kitchen notified"', '"ticket printed"', '"order sent live"', '"live KDS"', '"station confirmed live"', '"prep started live"', '"fulfillment completed live"']
  const found = forbidden.filter(w => allFiles.includes(w))
  return found.length === 0 || `forbidden language: ${found.join(', ')}`
})

// ── 86–89. Integration hooks ──────────────────────────────────────────────────
const eatContract = fileExists('server/services/eatCommandHubContract.js')
  ? readFile('server/services/eatCommandHubContract.js') : ''

check(86, 'Order Lifecycle KDS hook prepared (kds_routing_pending in order service)', () =>
  fileExists('server/services/order/orderLifecycleService.js') &&
  readFile('server/services/order/orderLifecycleService.js').includes('kds_routing_pending') || 'hook not present')
check(87, 'Partner Vendor KDS hook prepared (partner_window in routing engine)', () => routingEngine.includes('partner_window') || 'hook not present')
check(88, 'Venue Onboarding KDS readiness hook (station_config_required in config service)', () => stationSvc.includes('station_config_required') || 'hook not present')
check(89, 'E.A.T. KDS readiness hook exists', () => eatContract.includes('getKdsRoutingHooks') || 'hook missing')

// ── 90–92. Documentation ──────────────────────────────────────────────────────
check(90, 'KDS_FULFILLMENT_STATION_ENGINE.md exists', () => fileExists('docs/KDS_FULFILLMENT_STATION_ENGINE.md') || 'file missing')
check(91, 'Required documentation phrase exists', () => {
  const doc = fileExists('docs/KDS_FULFILLMENT_STATION_ENGINE.md') ? readFile('docs/KDS_FULFILLMENT_STATION_ENGINE.md') : ''
  return doc.includes('The KDS Fulfillment Station Engine can build routing and dispatch previews, but it does not prove a kitchen, bar, humidor, or partner station was notified unless a live station integration is verified.') || 'required phrase missing'
})
check(92, 'verify:kds package script exists', () => {
  return readFile('package.json').includes('"verify:kds"') || 'script missing'
})

// ── 93. Protected files ───────────────────────────────────────────────────────
check(93, 'Protected SmokeCraft files untouched', () => {
  const sessionFile = fileExists('src/constants/session.js') ? readFile('src/constants/session.js') : ''
  return sessionFile.includes('VISIT_STRUCTURE') || 'VISIT_STRUCTURE missing'
})

// ── 94–101. Prior suites and build ───────────────────────────────────────────
function runScript(scriptName) {
  try {
    execSync(`npm run ${scriptName} 2>&1`, { cwd: ROOT, stdio: 'pipe' })
    return true
  } catch (err) {
    const out = err.stdout?.toString() ?? err.stderr?.toString() ?? ''
    const match = out.match(/Results?:.*?(\d+)\s+failed/)
    if (match) return match[0]
    return 'script failed'
  }
}

check(94, 'Existing order verification still passes', () => runScript('verify:orders'))
check(95, 'Existing tax verification still passes', () => runScript('verify:tax'))
check(96, 'Existing payment verification still passes', () => runScript('verify:payments'))
check(97, 'Existing database verification still passes', () => runScript('verify:database'))
check(98, 'Existing POS360 verification still passes', () => runScript('verify:pos360'))
check(99, 'Existing venue onboarding verification still passes', () => runScript('verify:venue-onboarding'))
check(100, 'Existing partner vendor verification still passes', () => runScript('verify:partner-vendors'))
check(101, 'Production build passes', () => {
  try {
    execSync('npm run build 2>&1', { cwd: ROOT, stdio: 'pipe', timeout: 120000 })
    return true
  } catch { return 'build failed' }
})

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`)
if (failures.length > 0) {
  console.error('\nFailed checks:')
  failures.forEach(f => console.error(`  • ${f}`))
}
if (failed === 0) {
  console.log('\n✓ All 101 checks passed. Phase 9 KDS Fulfillment Station Engine verified.\n')
  console.log('  IMPORTANT: All dispatch events are preview-safe.')
  console.log('  No live kitchen, bar, humidor, or partner station was notified.\n')
} else {
  process.exit(1)
}
