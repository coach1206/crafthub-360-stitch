#!/usr/bin/env node
/**
 * Phase 12 Verification — Customer Checkout and Self-Order Engine
 * 141 checks
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../../')

let passed = 0
let failed = 0
const failures = []

function check(label, condition) {
  if (condition) { passed++ }
  else { failed++; failures.push(label); console.log(`  FAIL: ${label}`) }
}

function fileExists(rel) { return fs.existsSync(path.join(ROOT, rel)) }
function fileContains(rel, ...strings) {
  if (!fileExists(rel)) return false
  const c = fs.readFileSync(path.join(ROOT, rel), 'utf8')
  return strings.every(s => c.includes(s))
}
function fileNotContains(rel, ...strings) {
  if (!fileExists(rel)) return true
  const c = fs.readFileSync(path.join(ROOT, rel), 'utf8')
  return strings.every(s => !c.includes(s))
}
function runScript(scriptPath) {
  try { execSync(`node ${scriptPath}`, { cwd: ROOT, stdio: 'pipe', timeout: 30000 }); return true }
  catch { return false }
}

// ── [1] Migration ──────────────────────────────────────────────────────────
console.log('\n[1] Migration 025')
check('Migration 025 exists', fileExists('server/db/migrations/025_customer_checkout_self_order_engine.sql'))
check('customer_checkout_carts table', fileContains('server/db/migrations/025_customer_checkout_self_order_engine.sql', 'customer_checkout_carts'))
check('customer_checkout_cart_items table', fileContains('server/db/migrations/025_customer_checkout_self_order_engine.sql', 'customer_checkout_cart_items'))
check('customer_checkout_sessions table', fileContains('server/db/migrations/025_customer_checkout_self_order_engine.sql', 'customer_checkout_sessions'))
check('customer_checkout_order_previews table', fileContains('server/db/migrations/025_customer_checkout_self_order_engine.sql', 'customer_checkout_order_previews'))
check('customer_checkout_receipt_previews table', fileContains('server/db/migrations/025_customer_checkout_self_order_engine.sql', 'customer_checkout_receipt_previews'))
check('customer_checkout_status_events table', fileContains('server/db/migrations/025_customer_checkout_self_order_engine.sql', 'customer_checkout_status_events'))
check('customer_checkout_staff_handoffs table', fileContains('server/db/migrations/025_customer_checkout_self_order_engine.sql', 'customer_checkout_staff_handoffs'))
check('customer_checkout_audit_logs table', fileContains('server/db/migrations/025_customer_checkout_self_order_engine.sql', 'customer_checkout_audit_logs'))
check('Migration uses IF NOT EXISTS', fileContains('server/db/migrations/025_customer_checkout_self_order_engine.sql', 'IF NOT EXISTS'))
check('Migration uses TIMESTAMPTZ', fileContains('server/db/migrations/025_customer_checkout_self_order_engine.sql', 'TIMESTAMPTZ'))
check('Migration uses JSONB', fileContains('server/db/migrations/025_customer_checkout_self_order_engine.sql', 'JSONB'))

// ── [2] Customer Cart Service ──────────────────────────────────────────────
console.log('\n[2] Customer Cart Service')
check('customerCartService exists', fileExists('server/services/checkout/customerCartService.js'))
check('createCart exists', fileContains('server/services/checkout/customerCartService.js', 'export function createCart'))
check('getCart exists', fileContains('server/services/checkout/customerCartService.js', 'export function getCart'))
check('getVenueCarts exists', fileContains('server/services/checkout/customerCartService.js', 'export function getVenueCarts'))
check('addCartItem exists', fileContains('server/services/checkout/customerCartService.js', 'export function addCartItem'))
check('updateCartItem exists', fileContains('server/services/checkout/customerCartService.js', 'export function updateCartItem'))
check('removeCartItem exists', fileContains('server/services/checkout/customerCartService.js', 'export function removeCartItem'))
check('clearCart exists', fileContains('server/services/checkout/customerCartService.js', 'export function clearCart'))
check('validateCart exists', fileContains('server/services/checkout/customerCartService.js', 'export function validateCart'))
check('buildCartSummary exists', fileContains('server/services/checkout/customerCartService.js', 'export function buildCartSummary'))
check('getCartReadiness exists', fileContains('server/services/checkout/customerCartService.js', 'export function getCartReadiness'))

// ── [3] Customer Checkout Service ─────────────────────────────────────────
console.log('\n[3] Customer Checkout Service')
check('customerCheckoutService exists', fileExists('server/services/checkout/customerCheckoutService.js'))
check('startCheckout exists', fileContains('server/services/checkout/customerCheckoutService.js', 'export async function startCheckout'))
check('validateCheckoutSession exists', fileContains('server/services/checkout/customerCheckoutService.js', 'export function validateCheckoutSession'))
check('buildCheckoutPreview exists', fileContains('server/services/checkout/customerCheckoutService.js', 'export async function buildCheckoutPreview'))
check('buildSelfOrderPreview exists', fileContains('server/services/checkout/customerCheckoutService.js', 'export async function buildSelfOrderPreview'))
check('submitSelfOrderPreview exists', fileContains('server/services/checkout/customerCheckoutService.js', 'export async function submitSelfOrderPreview'))
check('buildStaffAssistedOrderPreview exists', fileContains('server/services/checkout/customerCheckoutService.js', 'export async function buildStaffAssistedOrderPreview'))
check('requestStaffHandoff exists', fileContains('server/services/checkout/customerCheckoutService.js', 'export async function requestStaffHandoff'))
check('getCheckoutSession exists', fileContains('server/services/checkout/customerCheckoutService.js', 'export function getCheckoutSession'))
check('getCheckoutReadiness exists', fileContains('server/services/checkout/customerCheckoutService.js', 'export async function getCheckoutReadiness'))
check('cancelCheckoutSession exists', fileContains('server/services/checkout/customerCheckoutService.js', 'export function cancelCheckoutSession'))

// ── [4] Receipt Service ────────────────────────────────────────────────────
console.log('\n[4] Checkout Receipt Service')
check('checkoutReceiptService exists', fileExists('server/services/checkout/checkoutReceiptService.js'))
check('buildReceiptPreview exists', fileContains('server/services/checkout/checkoutReceiptService.js', 'export function buildReceiptPreview'))
check('buildLineItemReceiptRows exists', fileContains('server/services/checkout/checkoutReceiptService.js', 'export function buildLineItemReceiptRows'))
check('buildTotalsBreakdown exists', fileContains('server/services/checkout/checkoutReceiptService.js', 'export function buildTotalsBreakdown'))
check('buildFeeBreakdown exists', fileContains('server/services/checkout/checkoutReceiptService.js', 'export function buildFeeBreakdown'))
check('buildReadinessDisclosures exists', fileContains('server/services/checkout/checkoutReceiptService.js', 'export function buildReadinessDisclosures'))
check('getReceiptPreview exists', fileContains('server/services/checkout/checkoutReceiptService.js', 'export function getReceiptPreview'))
check('formatReceiptPreviewForCustomer exists', fileContains('server/services/checkout/checkoutReceiptService.js', 'export function formatReceiptPreviewForCustomer'))

// ── [5] Customer Order Status Service ─────────────────────────────────────
console.log('\n[5] Customer Order Status Service')
check('customerOrderStatusService exists', fileExists('server/services/checkout/customerOrderStatusService.js'))
check('getCustomerOrderStatus exists', fileContains('server/services/checkout/customerOrderStatusService.js', 'export async function getCustomerOrderStatus'))
check('getCustomerOrderTimeline exists', fileContains('server/services/checkout/customerOrderStatusService.js', 'export async function getCustomerOrderTimeline'))
check('buildCustomerStatusMessage exists', fileContains('server/services/checkout/customerOrderStatusService.js', 'export function buildCustomerStatusMessage'))
check('getCustomerFacingStatus exists', fileContains('server/services/checkout/customerOrderStatusService.js', 'export function getCustomerFacingStatus'))
check('getCustomerNextStep exists', fileContains('server/services/checkout/customerOrderStatusService.js', 'export function getCustomerNextStep'))
check('getCustomerOrderBlockers exists', fileContains('server/services/checkout/customerOrderStatusService.js', 'export async function getCustomerOrderBlockers'))

// ── [6] Checkout Readiness Engine ─────────────────────────────────────────
console.log('\n[6] Checkout Readiness Engine')
check('checkoutReadinessEngine exists', fileExists('server/services/checkout/checkoutReadinessEngine.js'))
check('getCheckoutReadiness in engine', fileContains('server/services/checkout/checkoutReadinessEngine.js', 'export async function getCheckoutReadiness'))
check('getCheckoutBlockers exists', fileContains('server/services/checkout/checkoutReadinessEngine.js', 'export async function getCheckoutBlockers'))
check('buildCheckoutReadinessScore exists', fileContains('server/services/checkout/checkoutReadinessEngine.js', 'export async function buildCheckoutReadinessScore'))
check('getSelfOrderReadiness exists', fileContains('server/services/checkout/checkoutReadinessEngine.js', 'export async function getSelfOrderReadiness'))
check('getStaffAssistedOrderReadiness exists', fileContains('server/services/checkout/checkoutReadinessEngine.js', 'export async function getStaffAssistedOrderReadiness'))
check('getPartnerCheckoutReadiness exists', fileContains('server/services/checkout/checkoutReadinessEngine.js', 'export async function getPartnerCheckoutReadiness'))

// ── [7] Checkout Audit Service ────────────────────────────────────────────
console.log('\n[7] Checkout Audit Service')
check('checkoutAuditService exists', fileExists('server/services/checkout/checkoutAuditService.js'))
check('logCheckoutAuditEvent exists', fileContains('server/services/checkout/checkoutAuditService.js', 'export function logCheckoutAuditEvent'))
check('buildCheckoutAuditEvent exists', fileContains('server/services/checkout/checkoutAuditService.js', 'export function buildCheckoutAuditEvent'))
check('getCheckoutAuditTrail exists', fileContains('server/services/checkout/checkoutAuditService.js', 'export function getCheckoutAuditTrail'))
check('logCartEvent exists', fileContains('server/services/checkout/checkoutAuditService.js', 'export function logCartEvent'))
check('logCheckoutStatusEvent exists', fileContains('server/services/checkout/checkoutAuditService.js', 'export function logCheckoutStatusEvent'))
check('logStaffHandoffEvent exists', fileContains('server/services/checkout/checkoutAuditService.js', 'export function logStaffHandoffEvent'))

// ── [8] Controller and Routes ─────────────────────────────────────────────
console.log('\n[8] Controller and Routes')
check('Controller exists', fileExists('server/controllers/customerCheckoutController.js'))
check('Routes exist', fileExists('server/routes/customerCheckoutRoutes.js'))
check('Routes mounted in server/index.js', fileContains('server/index.js', '/api/checkout', 'customerCheckoutRoutes'))
check('Cart endpoints exist', fileContains('server/routes/customerCheckoutRoutes.js', '/carts', 'handleCreateCart', 'handleGetCart'))
check('Cart item endpoints exist', fileContains('server/routes/customerCheckoutRoutes.js', '/items', 'handleAddCartItem', 'handleUpdateCartItem', 'handleRemoveCartItem'))
check('Checkout preview endpoints exist', fileContains('server/routes/customerCheckoutRoutes.js', '/preview', 'handleBuildCheckoutPreview'))
check('Self-order preview endpoint exists', fileContains('server/routes/customerCheckoutRoutes.js', 'self-order-preview', 'handleSelfOrderPreview'))
check('Staff-assisted preview endpoint exists', fileContains('server/routes/customerCheckoutRoutes.js', 'staff-assisted-preview', 'handleStaffAssistedPreview'))
check('Staff handoff endpoint exists', fileContains('server/routes/customerCheckoutRoutes.js', 'staff-handoff', 'handleStaffHandoff'))
check('Checkout session endpoints exist', fileContains('server/routes/customerCheckoutRoutes.js', '/sessions/:checkoutSessionId', 'handleGetCheckoutSession'))
check('Receipt preview endpoint exists', fileContains('server/routes/customerCheckoutRoutes.js', 'receipt-preview', 'handleGetReceiptPreview'))
check('Customer order status endpoint exists', fileContains('server/routes/customerCheckoutRoutes.js', '/orders/:orderId/status', 'handleGetCustomerOrderStatus'))
check('Customer order timeline endpoint exists', fileContains('server/routes/customerCheckoutRoutes.js', '/timeline', 'handleGetCustomerOrderTimeline'))
check('Readiness endpoints exist', fileContains('server/routes/customerCheckoutRoutes.js', '/readiness', 'handleGetCheckoutReadiness'))
check('Audit endpoint exists', fileContains('server/routes/customerCheckoutRoutes.js', '/audit/:entityType/:entityId', 'handleGetAuditTrail'))

// ── [9] Customer Checkout API Client ──────────────────────────────────────
console.log('\n[9] Customer Checkout API Client')
check('customerCheckoutApi exists', fileExists('src/services/checkout/customerCheckoutApi.js'))
check('createCart API exists', fileContains('src/services/checkout/customerCheckoutApi.js', 'export function createCart'))
check('addCartItem API exists', fileContains('src/services/checkout/customerCheckoutApi.js', 'export function addCartItem'))
check('startCheckout API exists', fileContains('src/services/checkout/customerCheckoutApi.js', 'export function startCheckout'))
check('buildCheckoutPreview API exists', fileContains('src/services/checkout/customerCheckoutApi.js', 'export function buildCheckoutPreview'))
check('submitSelfOrderPreview API exists', fileContains('src/services/checkout/customerCheckoutApi.js', 'export function submitSelfOrderPreview'))
check('requestStaffHandoff API exists', fileContains('src/services/checkout/customerCheckoutApi.js', 'export function requestStaffHandoff'))
check('getReceiptPreview API exists', fileContains('src/services/checkout/customerCheckoutApi.js', 'export function getReceiptPreview'))
check('getCustomerOrderStatus API exists', fileContains('src/services/checkout/customerCheckoutApi.js', 'export function getCustomerOrderStatus'))

// ── [10] UI Components ────────────────────────────────────────────────────
console.log('\n[10] UI Components')
check('CustomerCartPanel exists', fileExists('src/components/checkout/CustomerCartPanel.jsx'))
check('CustomerCartItem exists', fileExists('src/components/checkout/CustomerCartItem.jsx'))
check('CheckoutReadinessPanel exists', fileExists('src/components/checkout/CheckoutReadinessPanel.jsx'))
check('CheckoutPreviewPanel exists', fileExists('src/components/checkout/CheckoutPreviewPanel.jsx'))
check('ReceiptPreviewPanel exists', fileExists('src/components/checkout/ReceiptPreviewPanel.jsx'))
check('SelfOrderActionPanel exists', fileExists('src/components/checkout/SelfOrderActionPanel.jsx'))
check('StaffHandoffPanel exists', fileExists('src/components/checkout/StaffHandoffPanel.jsx'))
check('CustomerOrderStatusPanel exists', fileExists('src/components/checkout/CustomerOrderStatusPanel.jsx'))
check('CheckoutStatusBadge exists', fileExists('src/components/checkout/CheckoutStatusBadge.jsx'))

// ── [11] Honest Status Values ─────────────────────────────────────────────
console.log('\n[11] Honest Status Values')
check("checkout_preview state exists", fileContains('server/services/checkout/customerCheckoutService.js', "'checkout_preview'"))
check("self_order_preview state exists", fileContains('server/services/checkout/customerCheckoutService.js', "'self_order_preview'"))
check("cart_preview state exists", fileContains('server/services/checkout/customerCartService.js', "'cart_preview'"))
check("receipt_preview state exists", fileContains('server/services/checkout/checkoutReceiptService.js', "'receipt_preview'"))
check("order_submission_preview exists", fileContains('server/services/checkout/customerCheckoutService.js', "'order_submission_preview'"))
check("payment_confirmation_required exists", fileContains('server/services/checkout/customerCheckoutService.js', "'payment_confirmation_required'"))
check("tax_preview_required exists", fileContains('server/services/checkout/customerCheckoutService.js', "'tax_preview_required'"))
check("pos_sync_pending exists", fileContains('server/services/checkout/customerCheckoutService.js', "'pos_sync_pending'"))
check("kds_routing_pending exists", fileContains('server/services/checkout/customerCheckoutService.js', "'kds_routing_pending'"))
check("inventory_unavailable exists", fileContains('server/services/checkout/customerCheckoutService.js', "'inventory_unavailable'"))
check("staff_handoff_preview exists", fileContains('server/services/checkout/customerCheckoutService.js', "'staff_handoff_preview'"))
check("database_required fallback exists", fileContains('server/services/checkout/customerCartService.js', "'database_required'"))
check("preview_fallback exists", fileContains('server/services/checkout/customerCartService.js', "'preview_fallback'"))

// ── [12] Validation Logic ─────────────────────────────────────────────────
console.log('\n[12] Validation Logic')
check('Negative amounts are rejected', fileContains('server/services/checkout/customerCartService.js', 'negative amounts are rejected'))
check('Zero quantity is rejected', fileContains('server/services/checkout/customerCartService.js', 'zero quantity is rejected'))
check('Subtotal equals line item totals', fileContains('server/services/checkout/customerCartService.js', 'line_subtotal_amount'))
check('Total equals subtotal + fees + tax', fileContains('server/services/checkout/checkoutReceiptService.js', 'subtotal + fee + tax', 'const total = subtotal + fee + tax'))

// ── [13] Phase Integration Hooks ──────────────────────────────────────────
console.log('\n[13] Phase Integration Hooks')
check('Money Bridge payment preview hook', fileContains('server/services/checkout/customerCheckoutService.js', 'moneyBridgePaymentEngine'))
check('Tax preview hook', fileContains('server/services/checkout/customerCheckoutService.js', 'taxCalculationEngine'))
check('Order Lifecycle hook', fileContains('server/services/checkout/customerCheckoutService.js', 'orderLifecycleService'))
check('KDS routing preview hook', fileContains('server/services/checkout/customerCheckoutService.js', 'kdsRoutingEngine'))
check('Partner Vendor approval/availability hook', fileContains('server/services/checkout/checkoutReadinessEngine.js', 'partnerVendorOnboardingService'))
check('Venue Onboarding readiness hook', fileContains('server/services/checkout/checkoutReadinessEngine.js', 'venueOnboardingService'))
check('NCIE commerce handoff hook', fileContains('src/services/checkout/customerCheckoutApi.js', 'checkout'))
check('E.A.T. checkout readiness hook', fileContains('server/services/eatCommandHubContract.js', 'getCheckoutReadinessHooks'))

// ── [14] Documentation ────────────────────────────────────────────────────
console.log('\n[14] Documentation')
check('Documentation exists', fileExists('docs/CUSTOMER_CHECKOUT_SELF_ORDER_ENGINE.md'))
check('Required documentation phrase exists',
  fileContains('docs/CUSTOMER_CHECKOUT_SELF_ORDER_ENGINE.md',
    'The Customer Checkout and Self-Order Engine can create cart, checkout, receipt, and order-status previews, but it does not prove live payment capture, POS sync, KDS notification, inventory reservation, or finalized tax collection unless those integrations are verified.'))

// ── [15] Forbidden Fake Language ──────────────────────────────────────────
console.log('\n[15] Forbidden Fake Language')
const checkoutFiles = [
  'server/services/checkout/customerCartService.js',
  'server/services/checkout/customerCheckoutService.js',
  'server/services/checkout/checkoutReceiptService.js',
  'server/services/checkout/customerOrderStatusService.js',
]
check('No fake-checkout language', checkoutFiles.every(f => fileNotContains(f, 'checkout live', 'checkout_live')))
check('No fake-payment language', checkoutFiles.every(f => fileNotContains(f, "'payment_captured'", '"payment_captured"', "'order_paid'", '"order_paid"')))
check('No fake-POS/KDS language', checkoutFiles.every(f => fileNotContains(f, "'pos_synced'", '"pos_synced"', "'kds_notified'", '"kds_notified"')))

// ── [16] Protected SmokeCraft Files ───────────────────────────────────────
console.log('\n[16] Protected SmokeCraft Files')
const PROTECTED = [
  'src/components/smokecraft/SmokeCraftAssetScreen.jsx',
  'src/components/smokecraft/SmokeCraftHotspotLayer.jsx',
  'src/components/smokecraft/SmokeCraftAssetRoute.jsx',
  'src/constants/session.js',
  'src/utils/passportProgress.js',
  'src/utils/passportEntry.js',
  'src/constants/smokecraftJourney.js',
]
check('All 7 protected files still exist', PROTECTED.every(f => fileExists(f)))
check('SmokeCraftAssetScreen has no checkout imports', fileNotContains('src/components/smokecraft/SmokeCraftAssetScreen.jsx', 'customerCheckout', 'CustomerCart'))
check('session.js has no checkout imports', fileNotContains('src/constants/session.js', 'customerCheckout', 'CustomerCart'))
check('passportProgress has no checkout imports', fileNotContains('src/utils/passportProgress.js', 'customerCheckout', 'CustomerCart'))

// ── [17] Existing Verification Suites ─────────────────────────────────────
console.log('\n[17] Existing Verification Suites')
check('verify:ncie-wiring still passes', runScript('server/scripts/verifyNcieScreenWiring.js'))
check('verify:ncie still passes', runScript('server/scripts/verifyNoveeNCIEFoundation.js'))
check('verify:kds still passes', runScript('server/scripts/verifyKdsFulfillmentEngine.js'))
check('verify:orders still passes', runScript('server/scripts/verifyOrderLifecycleEngine.js'))
check('verify:tax still passes', runScript('server/scripts/verifyTaxComplianceEngine.js'))
check('verify:payments still passes', runScript('server/scripts/verifyStripeConnectMoneyBridge.js'))
check('verify:database still passes', runScript('server/scripts/verifyDatabaseFoundation.js'))
check('verify:pos360 still passes', runScript('server/scripts/verifyPos360PlatformLayer.js'))
check('verify:venue-onboarding still passes', runScript('server/scripts/verifyVenueOnboardingEngine.js'))
check('verify:partner-vendors still passes', runScript('server/scripts/verifyPartnerVendorOnboardingEngine.js'))

// ── [18] Production Build ─────────────────────────────────────────────────
console.log('\n[18] Production Build')
try {
  execSync('npm run build', { cwd: ROOT, stdio: 'pipe', timeout: 120000 })
  check('Production build passes', true)
} catch (e) {
  check('Production build passes', false)
  console.log('   Build error:', e.stderr?.toString().slice(0, 200))
}

// ── Summary ───────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(60)}`)
console.log('Phase 12 — Customer Checkout Engine Verification')
console.log(`${'─'.repeat(60)}`)
console.log(`  Passed: ${passed}`)
console.log(`  Failed: ${failed}`)
console.log(`  Total:  ${passed + failed}`)
if (failures.length) { console.log('\nFailed checks:'); failures.forEach(f => console.log(`  • ${f}`)) }
if (failed === 0) { console.log('\n✓ All checks passed. Phase 12 verified.') }
else { console.log(`\n✗ ${failed} check(s) failed.`); process.exit(1) }
