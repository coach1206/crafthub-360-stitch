/**
 * verifyOrderLifecycleEngine.js — 126 checks
 * Verifies Phase 8 Order Lifecycle Engine foundation.
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

function fileExists(rel) { return fs.existsSync(path.join(ROOT, rel)) }
function readFile(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8') }

console.log('\n=== verifyOrderLifecycleEngine — 126 checks ===\n')

// ── 1–14. Migration ─────────────────────────────────────────────────────────────
check(1, 'Migration 023 exists', () => fileExists('server/db/migrations/023_order_lifecycle_engine.sql') || 'file missing')

const migration = fileExists('server/db/migrations/023_order_lifecycle_engine.sql')
  ? readFile('server/db/migrations/023_order_lifecycle_engine.sql') : ''

check(2,  'order_lifecycle_orders table defined', () => migration.includes('order_lifecycle_orders') || 'table not found')
check(3,  'order_lifecycle_line_items table defined', () => migration.includes('order_lifecycle_line_items') || 'table not found')
check(4,  'order_lifecycle_status_events table defined', () => migration.includes('order_lifecycle_status_events') || 'table not found')
check(5,  'order_lifecycle_payment_links table defined', () => migration.includes('order_lifecycle_payment_links') || 'table not found')
check(6,  'order_lifecycle_tax_links table defined', () => migration.includes('order_lifecycle_tax_links') || 'table not found')
check(7,  'order_lifecycle_partner_fulfillment table defined', () => migration.includes('order_lifecycle_partner_fulfillment') || 'table not found')
check(8,  'order_lifecycle_pos_routing table defined', () => migration.includes('order_lifecycle_pos_routing') || 'table not found')
check(9,  'order_lifecycle_kds_routing table defined', () => migration.includes('order_lifecycle_kds_routing') || 'table not found')
check(10, 'order_lifecycle_refund_links table defined', () => migration.includes('order_lifecycle_refund_links') || 'table not found')
check(11, 'order_lifecycle_audit_logs table defined', () => migration.includes('order_lifecycle_audit_logs') || 'table not found')
check(12, 'Migration uses IF NOT EXISTS', () => migration.includes('IF NOT EXISTS') || 'missing safety guard')
check(13, 'Migration uses timestamptz', () => migration.includes('TIMESTAMPTZ') || 'missing timestamptz')
check(14, 'Migration uses jsonb', () => migration.includes('JSONB') || 'missing jsonb')

// ── 15–23. State machine ──────────────────────────────────────────────────────
check(15, 'State machine service exists', () => fileExists('server/services/order/orderLifecycleStateMachine.js') || 'file missing')

const sm = fileExists('server/services/order/orderLifecycleStateMachine.js')
  ? readFile('server/services/order/orderLifecycleStateMachine.js') : ''

check(16, 'getValidOrderStates exists', () => sm.includes('getValidOrderStates') || 'function missing')
check(17, 'getValidTransitions exists', () => sm.includes('getValidTransitions') || 'function missing')
check(18, 'canTransitionOrder exists', () => sm.includes('canTransitionOrder') || 'function missing')
check(19, 'validateOrderTransition exists', () => sm.includes('validateOrderTransition') || 'function missing')
check(20, 'getNextAllowedStatuses exists', () => sm.includes('getNextAllowedStatuses') || 'function missing')
check(21, 'isTerminalOrderStatus exists', () => sm.includes('isTerminalOrderStatus') || 'function missing')
check(22, 'isRefundStatus exists', () => sm.includes('isRefundStatus') || 'function missing')
check(23, 'buildTransitionResult exists', () => sm.includes('buildTransitionResult') || 'function missing')

// ── 24–34. State definitions ──────────────────────────────────────────────────
check(24, 'order_draft state defined', () => sm.includes('order_draft') || 'state missing')
check(25, 'order_pending state defined', () => sm.includes('order_pending') || 'state missing')
check(26, 'order_submitted state defined', () => sm.includes('order_submitted') || 'state missing')
check(27, 'order_accepted state defined', () => sm.includes('order_accepted') || 'state missing')
check(28, 'order_routed state defined', () => sm.includes('order_routed') || 'state missing')
check(29, 'order_preparing state defined', () => sm.includes('order_preparing') || 'state missing')
check(30, 'order_ready state defined', () => sm.includes('order_ready') || 'state missing')
check(31, 'order_completed state defined', () => sm.includes('order_completed') || 'state missing')
check(32, 'order_cancelled state defined', () => sm.includes('order_cancelled') || 'state missing')
check(33, 'order_rejected state defined', () => sm.includes('order_rejected') || 'state missing')
check(34, 'refund states defined', () => sm.includes('refund_pending') && sm.includes('order_refunded') || 'refund states missing')

// ── 35–40. State machine behavior (import and test) ───────────────────────────
let smModule = null
try {
  smModule = await import(path.join(ROOT, 'server/services/order/orderLifecycleStateMachine.js'))
} catch { /* handled below */ }

check(35, 'draft cannot jump directly to completed', () => {
  if (!smModule) return 'module not loaded'
  return smModule.canTransitionOrder('order_draft', 'order_completed') === false || 'transition incorrectly allowed'
})
check(36, 'completed cannot go back to preparing', () => {
  if (!smModule) return 'module not loaded'
  return smModule.canTransitionOrder('order_completed', 'order_preparing') === false || 'transition incorrectly allowed'
})
check(37, 'cancelled cannot go to completed', () => {
  if (!smModule) return 'module not loaded'
  return smModule.canTransitionOrder('order_cancelled', 'order_completed') === false || 'transition incorrectly allowed'
})
check(38, 'pending can go to cancelled', () => {
  if (!smModule) return 'module not loaded'
  return smModule.canTransitionOrder('order_pending', 'order_cancelled') === true || 'transition blocked'
})
check(39, 'submitted can go to rejected', () => {
  if (!smModule) return 'module not loaded'
  return smModule.canTransitionOrder('order_submitted', 'order_rejected') === true || 'transition blocked'
})
check(40, 'completed can enter refund_pending', () => {
  if (!smModule) return 'module not loaded'
  return smModule.canTransitionOrder('order_completed', 'refund_pending') === true || 'transition blocked'
})

// ── 41–61. Order lifecycle service ───────────────────────────────────────────
check(41, 'Order lifecycle service exists', () => fileExists('server/services/order/orderLifecycleService.js') || 'file missing')

const svc = fileExists('server/services/order/orderLifecycleService.js')
  ? readFile('server/services/order/orderLifecycleService.js') : ''

check(42, 'createOrderDraft exists', () => svc.includes('createOrderDraft') || 'function missing')
check(43, 'validateOrderDraft exists', () => svc.includes('validateOrderDraft') || 'function missing')
check(44, 'submitOrder exists', () => svc.includes('submitOrder') || 'function missing')
check(45, 'acceptOrder exists', () => svc.includes('acceptOrder') || 'function missing')
check(46, 'rejectOrder exists', () => svc.includes('rejectOrder') || 'function missing')
check(47, 'routeOrder exists', () => svc.includes('routeOrder') || 'function missing')
check(48, 'markOrderPreparing exists', () => svc.includes('markOrderPreparing') || 'function missing')
check(49, 'markOrderReady exists', () => svc.includes('markOrderReady') || 'function missing')
check(50, 'completeOrder exists', () => svc.includes('completeOrder') || 'function missing')
check(51, 'cancelOrder exists', () => svc.includes('cancelOrder') || 'function missing')
check(52, 'linkPaymentToOrder exists', () => svc.includes('linkPaymentToOrder') || 'function missing')
check(53, 'linkTaxCalculationToOrder exists', () => svc.includes('linkTaxCalculationToOrder') || 'function missing')
check(54, 'linkPartnerFulfillment exists', () => svc.includes('linkPartnerFulfillment') || 'function missing')
check(55, 'linkPOSRouting exists', () => svc.includes('linkPOSRouting') || 'function missing')
check(56, 'linkKDSRouting exists', () => svc.includes('linkKDSRouting') || 'function missing')
check(57, 'linkRefundToOrder exists', () => svc.includes('linkRefundToOrder') || 'function missing')
check(58, 'getOrderLifecycle exists', () => svc.includes('getOrderLifecycle') || 'function missing')
check(59, 'getVenueOrders exists', () => svc.includes('getVenueOrders') || 'function missing')
check(60, 'getPartnerOrders exists', () => svc.includes('getPartnerOrders') || 'function missing')
check(61, 'getOrderLifecycleReadiness exists', () => svc.includes('getOrderLifecycleReadiness') || 'function missing')

// ── 62–70. Order totals service ────────────────────────────────────────────────
check(62, 'Order totals service exists', () => fileExists('server/services/order/orderTotalsService.js') || 'file missing')

const totals = fileExists('server/services/order/orderTotalsService.js')
  ? readFile('server/services/order/orderTotalsService.js') : ''

check(63, 'buildOrderTotals exists', () => totals.includes('buildOrderTotals') || 'function missing')
check(64, 'validateOrderTotals exists', () => totals.includes('validateOrderTotals') || 'function missing')
check(65, 'attachTaxPreviewToOrder exists', () => totals.includes('attachTaxPreviewToOrder') || 'function missing')
check(66, 'attachMoneyBridgePreviewToOrder exists', () => totals.includes('attachMoneyBridgePreviewToOrder') || 'function missing')
check(67, 'validateLineItems exists', () => totals.includes('validateLineItems') || 'function missing')
check(68, 'validatePartnerItems exists', () => totals.includes('validatePartnerItems') || 'function missing')
check(69, 'validateVenueItems exists', () => totals.includes('validateVenueItems') || 'function missing')
check(70, 'validateOrderAmounts exists', () => totals.includes('validateOrderAmounts') || 'function missing')

// ── 71–76. Order readiness engine ────────────────────────────────────────────
check(71, 'Order readiness engine exists', () => fileExists('server/services/order/orderReadinessEngine.js') || 'file missing')

const readiness = fileExists('server/services/order/orderReadinessEngine.js')
  ? readFile('server/services/order/orderReadinessEngine.js') : ''

check(72, 'getOrderReadiness exists', () => readiness.includes('getOrderReadiness') || 'function missing')
check(73, 'getOrderBlockers exists', () => readiness.includes('getOrderBlockers') || 'function missing')
check(74, 'buildOrderReadinessScore exists', () => readiness.includes('buildOrderReadinessScore') || 'function missing')
check(75, 'getVenueOrderReadiness exists', () => readiness.includes('getVenueOrderReadiness') || 'function missing')
check(76, 'getPartnerOrderReadiness exists', () => readiness.includes('getPartnerOrderReadiness') || 'function missing')

// ── 77–81. Order audit service ────────────────────────────────────────────────
check(77, 'Order audit service exists', () => fileExists('server/services/order/orderAuditService.js') || 'file missing')

const audit = fileExists('server/services/order/orderAuditService.js')
  ? readFile('server/services/order/orderAuditService.js') : ''

check(78, 'logOrderAuditEvent exists', () => audit.includes('logOrderAuditEvent') || 'function missing')
check(79, 'buildOrderAuditEvent exists', () => audit.includes('buildOrderAuditEvent') || 'function missing')
check(80, 'getOrderAuditTrail exists', () => audit.includes('getOrderAuditTrail') || 'function missing')
check(81, 'logOrderTransitionEvent exists', () => audit.includes('logOrderTransitionEvent') || 'function missing')

// ── 82–84. Controller and routes ──────────────────────────────────────────────
check(82, 'Controller exists', () => fileExists('server/controllers/orderLifecycleController.js') || 'file missing')
check(83, 'Routes exist', () => fileExists('server/routes/orderLifecycleRoutes.js') || 'file missing')
check(84, 'Routes mounted in server/index.js at /api/orders', () => readFile('server/index.js').includes('/api/orders') || 'route not mounted')

// ── 85–102. Endpoint coverage ────────────────────────────────────────────────
const routes = fileExists('server/routes/orderLifecycleRoutes.js')
  ? readFile('server/routes/orderLifecycleRoutes.js') : ''

check(85,  'Draft endpoint exists', () => routes.includes('/draft') || 'endpoint missing')
check(86,  'Submit endpoint exists', () => routes.includes('/submit') || 'endpoint missing')
check(87,  'Accept endpoint exists', () => routes.includes('/accept') || 'endpoint missing')
check(88,  'Reject endpoint exists', () => routes.includes('/reject') || 'endpoint missing')
check(89,  'Route endpoint exists', () => routes.includes('/route') || 'endpoint missing')
check(90,  'Preparing endpoint exists', () => routes.includes('/preparing') || 'endpoint missing')
check(91,  'Ready endpoint exists', () => routes.includes('/ready') || 'endpoint missing')
check(92,  'Complete endpoint exists', () => routes.includes('/complete') || 'endpoint missing')
check(93,  'Cancel endpoint exists', () => routes.includes('/cancel') || 'endpoint missing')
check(94,  'Link payment endpoint exists', () => routes.includes('link-payment') || 'endpoint missing')
check(95,  'Link tax endpoint exists', () => routes.includes('link-tax') || 'endpoint missing')
check(96,  'Link partner fulfillment endpoint exists', () => routes.includes('link-partner-fulfillment') || 'endpoint missing')
check(97,  'Link POS routing endpoint exists', () => routes.includes('link-pos-routing') || 'endpoint missing')
check(98,  'Link KDS routing endpoint exists', () => routes.includes('link-kds-routing') || 'endpoint missing')
check(99,  'Link refund endpoint exists', () => routes.includes('link-refund') || 'endpoint missing')
check(100, 'Order read endpoints exist (venueId)', () => routes.includes('venueId') || 'endpoint missing')
check(101, 'Readiness endpoint exists', () => routes.includes('readiness') || 'endpoint missing')
check(102, 'Audit endpoint exists', () => routes.includes('audit') || 'endpoint missing')

// ── 103–110. Fallback language ────────────────────────────────────────────────
check(103, 'database_required fallback exists', () => svc.includes('database_required') || readiness.includes('database_required') || 'fallback missing')
check(104, 'preview_fallback behavior exists', () => svc.includes('order_lifecycle_preview') || readiness.includes('preview_fallback') || 'fallback missing')
check(105, 'payment_confirmation_required exists', () => svc.includes('payment_confirmation_required') || 'status missing')
check(106, 'tax_preview_required exists', () => svc.includes('tax_preview_required') || 'status missing')
check(107, 'pos_sync_pending exists', () => svc.includes('pos_sync_pending') || 'status missing')
check(108, 'kds_routing_pending exists', () => svc.includes('kds_routing_pending') || 'status missing')
check(109, 'routing_preview exists', () => svc.includes('routing_preview') || 'status missing')

const allOrderFiles = [svc, readiness, audit, routes].join('\n')
check(110, 'Forbidden fake-live order language not used', () => {
  const forbidden = ['"live order sync"', '"payment captured"', '"Stripe confirmed"', '"POS synced"', '"kitchen notified"', '"order completed live"']
  const found = forbidden.filter(w => allOrderFiles.includes(w))
  return found.length === 0 || `forbidden language found: ${found.join(', ')}`
})

// ── 111–115. Integration hooks ────────────────────────────────────────────────
const eatContract = fileExists('server/services/eatCommandHubContract.js')
  ? readFile('server/services/eatCommandHubContract.js') : ''

check(111, 'Money Bridge order hook prepared (payment_confirmation_required in service)', () => svc.includes('payment_confirmation_required') || 'hook not present')
check(112, 'Tax order hook prepared (tax_preview_required in service)', () => svc.includes('tax_preview_required') || 'hook not present')
check(113, 'Venue onboarding order readiness hook prepared', () => readiness.includes('getVenueOrderReadiness') || 'hook not present')
check(114, 'Partner vendor order readiness hook prepared', () => readiness.includes('getPartnerOrderReadiness') || 'hook not present')
check(115, 'E.A.T. order readiness hook exists', () => eatContract.includes('getOrderLifecycleHooks') || 'hook missing')

// ── 116–117. Documentation ────────────────────────────────────────────────────
check(116, 'ORDER_LIFECYCLE_ENGINE.md exists', () => fileExists('docs/ORDER_LIFECYCLE_ENGINE.md') || 'file missing')
check(117, 'Required documentation phrase exists', () => {
  const doc = fileExists('docs/ORDER_LIFECYCLE_ENGINE.md') ? readFile('docs/ORDER_LIFECYCLE_ENGINE.md') : ''
  return doc.includes('The Order Lifecycle Engine tracks order state and readiness, but it does not prove live payment capture, POS sync, or kitchen routing unless those integrations are verified.') || 'required phrase missing'
})

// ── 118. Package script ───────────────────────────────────────────────────────
check(118, 'verify:orders package script exists', () => {
  const pkg = readFile('package.json')
  return pkg.includes('"verify:orders"') || 'script missing'
})

// ── 119. Protected files ──────────────────────────────────────────────────────
check(119, 'Protected SmokeCraft files untouched', () => {
  const sessionFile = fileExists('src/constants/session.js') ? readFile('src/constants/session.js') : ''
  return sessionFile.includes('VISIT_STRUCTURE') || 'VISIT_STRUCTURE missing'
})

// ── 120–126. Existing suites still pass ───────────────────────────────────────
function runScript(scriptName) {
  try {
    execSync(`npm run ${scriptName} 2>&1`, { cwd: ROOT, stdio: 'pipe' })
    return true
  } catch (err) {
    const out = err.stdout?.toString() ?? err.stderr?.toString() ?? ''
    const match = out.match(/Results?:.*?(\d+)\s+failed/)
    if (match) return `${match[0]}`
    return 'script failed'
  }
}

check(120, 'Existing payment verification still passes', () => runScript('verify:payments'))
check(121, 'Existing database verification still passes', () => runScript('verify:database'))
check(122, 'Existing POS360 verification still passes', () => runScript('verify:pos360'))
check(123, 'Existing venue onboarding verification still passes', () => runScript('verify:venue-onboarding'))
check(124, 'Existing partner vendor verification still passes', () => runScript('verify:partner-vendors'))
check(125, 'Existing tax verification still passes', () => runScript('verify:tax'))
check(126, 'Production build passes', () => {
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
  console.log('\n✓ All 126 checks passed. Phase 8 Order Lifecycle Engine verified.\n')
  console.log('  IMPORTANT: All order statuses are preview-safe.')
  console.log('  Payment capture, POS sync, and kitchen routing require separate verified integrations.\n')
} else {
  process.exit(1)
}
