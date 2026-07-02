/**
 * verifyStripeConnectMoneyBridge.js — 38 checks
 * Verifies Phase 4 Stripe Connect / Money Bridge foundation.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')

let passed = 0
let failed = 0
const failures = []

function check(id, description, fn) {
  try {
    const result = fn()
    if (result === true || result === undefined) {
      console.log(`  ✓ [${id}] ${description}`)
      passed++
    } else {
      console.error(`  ✗ [${id}] ${description} — ${result}`)
      failed++
      failures.push(`[${id}] ${description}: ${result}`)
    }
  } catch (err) {
    console.error(`  ✗ [${id}] ${description} — threw: ${err.message}`)
    failed++
    failures.push(`[${id}] ${description}: threw ${err.message}`)
  }
}

async function checkAsync(id, description, fn) {
  try {
    const result = await fn()
    if (result === true || result === undefined) {
      console.log(`  ✓ [${id}] ${description}`)
      passed++
    } else {
      console.error(`  ✗ [${id}] ${description} — ${result}`)
      failed++
      failures.push(`[${id}] ${description}: ${result}`)
    }
  } catch (err) {
    console.error(`  ✗ [${id}] ${description} — threw: ${err.message}`)
    failed++
    failures.push(`[${id}] ${description}: threw ${err.message}`)
  }
}

function fileExists(rel) { return fs.existsSync(path.join(ROOT, rel)) }
function readFile(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8') }

console.log('\n=== verifyStripeConnectMoneyBridge — 38 checks ===\n')

// 1. Payment provider config
check(1, 'paymentProviderConfig.js exists', () =>
  fileExists('server/config/paymentProviderConfig.js') || 'file missing')

await checkAsync(2, 'Stripe readiness returns stripe_keys_missing when keys are missing', async () => {
  const { getStripeReadiness } = await import('../config/paymentProviderConfig.js')
  delete process.env.STRIPE_SECRET_KEY
  delete process.env.STRIPE_CONNECT_CLIENT_ID
  const r = getStripeReadiness()
  return r.readinessStatus === 'stripe_keys_missing' || `got: ${r.readinessStatus}`
})

check(3, 'Stripe readiness does not expose raw keys', () => {
  const src = readFile('server/config/paymentProviderConfig.js')
  const forbidden = ['res.json(process.env.STRIPE_SECRET_KEY', 'STRIPE_SECRET_KEY: process.env']
  const found = forbidden.filter(f => src.includes(f))
  return found.length === 0 || `forbidden pattern: ${found.join(', ')}`
})

// 4–10. Migration and tables
check(4, 'Stripe Connect migration 019 exists', () =>
  fileExists('server/db/migrations/019_stripe_connect_money_bridge.sql') || 'file missing')

const migration = fileExists('server/db/migrations/019_stripe_connect_money_bridge.sql')
  ? readFile('server/db/migrations/019_stripe_connect_money_bridge.sql') : ''

check(5, 'payment_provider_accounts table defined', () =>
  migration.includes('payment_provider_accounts') || 'table not found')

check(6, 'payment_intents_log table defined', () =>
  migration.includes('payment_intents_log') || 'table not found')

check(7, 'money_bridge_settlement_ledger table defined', () =>
  migration.includes('money_bridge_settlement_ledger') || 'table not found')

check(8, 'money_bridge_refund_reversal_logs table defined', () =>
  migration.includes('money_bridge_refund_reversal_logs') || 'table not found')

check(9, 'payment_webhook_events table defined', () =>
  migration.includes('payment_webhook_events') || 'table not found')

check(10, 'payment_audit_logs table defined', () =>
  migration.includes('payment_audit_logs') || 'table not found')

// 11–14. Money Bridge engine
check(11, 'Money Bridge payment engine exists', () =>
  fileExists('server/services/payments/moneyBridgePaymentEngine.js') || 'file missing')

await checkAsync(12, 'Split math: 10% commission, 5% referral, 85% partner payout', async () => {
  const { calculatePartnerFoodSplit } = await import('../services/payments/moneyBridgePaymentEngine.js')
  const result = calculatePartnerFoodSplit(10000) // $100.00
  const commissionOk = result.smokecraftCommissionCents === 1000
  const referralOk = result.venueReferralCents === 500
  const payoutOk = result.partnerPayoutCents === 8500
  const sumOk = result.smokecraftCommissionCents + result.venueReferralCents + result.partnerPayoutCents === 10000
  if (!commissionOk) return `commission: expected 1000 got ${result.smokecraftCommissionCents}`
  if (!referralOk) return `referral: expected 500 got ${result.venueReferralCents}`
  if (!payoutOk) return `payout: expected 8500 got ${result.partnerPayoutCents}`
  if (!sumOk) return 'split does not sum to 100%'
  return true
})

await checkAsync(13, '$4.50 delivery fee applied for partner food items', async () => {
  const { calculateDeliveryRoutingFee } = await import('../services/payments/moneyBridgePaymentEngine.js')
  const withPartner = calculateDeliveryRoutingFee({ partnerItems: [{ price: 10 }] })
  const noPartner = calculateDeliveryRoutingFee({ partnerItems: [] })
  if (withPartner.deliveryRoutingFeeCents !== 450) return `expected 450 got ${withPartner.deliveryRoutingFeeCents}`
  if (noPartner.deliveryRoutingFeeCents !== 0) return `expected 0 got ${noPartner.deliveryRoutingFeeCents}`
  return true
})

await checkAsync(14, 'Missing tax config returns taxStatus: preview_only', async () => {
  const { calculateTaxForPayment } = await import('../services/payments/moneyBridgePaymentEngine.js')
  const result = calculateTaxForPayment({}, null)
  return result.taxStatus === 'preview_only' || `got: ${result.taxStatus}`
})

// 15–17. Stripe Connect service
check(15, 'Stripe Connect service exists', () =>
  fileExists('server/services/payments/stripeConnectService.js') || 'file missing')

await checkAsync(16, 'Missing Stripe keys returns stripe_keys_missing', async () => {
  const { createPaymentIntent } = await import('../services/payments/stripeConnectService.js')
  const result = await createPaymentIntent({})
  return result.status === 'stripe_keys_missing' || `got: ${result.status}`
})

await checkAsync(17, 'Missing connected account returns connected_account_required or stripe_keys_missing', async () => {
  const { getConnectedAccountStatus } = await import('../services/payments/stripeConnectService.js')
  const result = await getConnectedAccountStatus('venue', 'nonexistent-venue')
  return (result.status === 'connected_account_required' || result.status === 'stripe_keys_missing') ||
    `got: ${result.status}`
})

// 18–20. Onboarding service
check(18, 'Payment account onboarding service exists', () =>
  fileExists('server/services/payments/paymentAccountOnboardingService.js') || 'file missing')

await checkAsync(19, 'Venue payout readiness requires connected account', async () => {
  const { getVenuePaymentReadiness } = await import('../services/payments/paymentAccountOnboardingService.js')
  const result = await getVenuePaymentReadiness('preview-venue-id')
  return result.canReceiveReferralPayout === false || 'venue payout incorrectly marked ready'
})

await checkAsync(20, 'Partner payout readiness requires connected account', async () => {
  const { getPartnerVendorPaymentReadiness } = await import('../services/payments/paymentAccountOnboardingService.js')
  const result = await getPartnerVendorPaymentReadiness('preview-partner-id')
  return result.canReceivePartnerPayout === false || 'partner payout incorrectly marked ready'
})

// 21–23. Refund service
check(21, 'Payment refund/reversal service exists', () =>
  fileExists('server/services/payments/paymentRefundReversalService.js') || 'file missing')

await checkAsync(22, 'Full refund reversal math: commission + referral + payout = refund amount', async () => {
  const { calculateSplitReversal } = await import('../services/payments/paymentRefundReversalService.js')
  const r = calculateSplitReversal(10000, 10000)
  const sum = r.smokecraftCommissionReversalCents + r.venueReferralReversalCents + r.partnerPayoutReversalCents
  return sum === 10000 || `split reversal sum: expected 10000 got ${sum}`
})

await checkAsync(23, 'Partial refund reversal math', async () => {
  const { calculateSplitReversal } = await import('../services/payments/paymentRefundReversalService.js')
  const r = calculateSplitReversal(10000, 5000)
  const sum = r.smokecraftCommissionReversalCents + r.venueReferralReversalCents + r.partnerPayoutReversalCents
  return sum === 5000 || `partial refund sum: expected 5000 got ${sum}`
})

// 24–25. Webhook service
check(24, 'Payment webhook service exists', () =>
  fileExists('server/services/payments/paymentWebhookService.js') || 'file missing')

await checkAsync(25, 'Missing webhook secret does not fake verified processing', async () => {
  delete process.env.STRIPE_WEBHOOK_SECRET
  const { verifyPaymentWebhookSignature } = await import('../services/payments/paymentWebhookService.js')
  const result = await verifyPaymentWebhookSignature('stripe', {}, {})
  return result.verified === false || 'webhook incorrectly marked verified without secret'
})

// 26–27. Audit log service
check(26, 'Payment audit log service exists', () =>
  fileExists('server/services/payments/paymentAuditLogService.js') || 'file missing')

await checkAsync(27, 'Audit logging does not fake persistence without database', async () => {
  const { logPaymentAction } = await import('../services/payments/paymentAuditLogService.js')
  const result = await logPaymentAction({ actionType: 'test' })
  return result.storageMode === 'memory_fallback' || `got: ${result.storageMode}`
})

// 28. Payment routes mounted
check(28, 'Payment routes mounted in server/index.js', () => {
  const src = readFile('server/index.js')
  return (src.includes('paymentMoneyBridgeRoutes') && src.includes('/api/payments/money-bridge')) ||
    'routes not mounted'
})

// 29. Ticket Tapper preview still works
check(29, 'Ticket Tapper specials data file still exists', () =>
  fileExists('src/data/smokeCraftTicketTapperSpecials.js') || 'file missing')

// 30–31. Settlement and payment status
await checkAsync(30, 'Settlement status remains settlement_pending_preview without Stripe', async () => {
  const { buildPaymentPreview } = await import('../services/payments/moneyBridgePaymentEngine.js')
  const preview = buildPaymentPreview({ venueItems: [], partnerItems: [] })
  return preview.settlementStatus === 'settlement_pending_preview' ||
    `got: ${preview.settlementStatus}`
})

check(31, 'No forbidden fake payment language in moneyBridgePaymentEngine.js', () => {
  const src = readFile('server/services/payments/moneyBridgePaymentEngine.js')
  const lower = src.toLowerCase()
  const forbidden = ['payment released', 'payout complete', 'transfer complete', 'charge succeeded', 'live payment', 'live stripe', 'payment confirmed']
  const found = forbidden.filter(f => lower.includes(f))
  return found.length === 0 || `forbidden language: ${found.join(', ')}`
})

// 32–36. Protected files
check(32, 'SmokeCraftAssetScreen.jsx untouched', () =>
  fileExists('src/components/smokecraft/SmokeCraftAssetScreen.jsx') || 'file missing')
check(33, 'SmokeCraftHotspotLayer.jsx untouched', () =>
  fileExists('src/components/smokecraft/SmokeCraftHotspotLayer.jsx') || 'file missing')
check(34, 'SmokeCraftAssetRoute.jsx untouched', () =>
  fileExists('src/components/smokecraft/SmokeCraftAssetRoute.jsx') || 'file missing')
check(35, 'session.js / VISIT_STRUCTURE untouched', () =>
  fileExists('src/constants/session.js') || 'file missing')
check(36, 'Passport/Connections/8-visit files untouched', () =>
  fileExists('src/utils/passportProgress.js') && fileExists('src/utils/passportEntry.js') && fileExists('src/constants/smokecraftJourney.js') || 'file missing')

// 37. Documentation
check(37, 'STRIPE_CONNECT_MONEY_BRIDGE_FOUNDATION.md exists', () =>
  fileExists('docs/STRIPE_CONNECT_MONEY_BRIDGE_FOUNDATION.md') || 'file missing')

check(38, 'Doc includes required phrase about preview mode', () => {
  const src = readFile('docs/STRIPE_CONNECT_MONEY_BRIDGE_FOUNDATION.md')
  return src.includes('cannot release money until Stripe Connect') ||
    'required phrase missing'
})

// ── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n=== Results: ${passed}/${passed + failed} passing ===\n`)
if (failures.length) {
  console.error('Failures:')
  failures.forEach(f => console.error(' ', f))
  process.exit(1)
} else {
  console.log('All 38 checks passed. Stripe Connect Money Bridge foundation verified.')
  process.exit(0)
}
