/**
 * verifyPos360Payments.js — Phase B.7 verification (34 checks)
 */

import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '../..')

let passed = 0
let failed = 0

function check(label, fn) {
  try {
    const ok = fn()
    if (ok) { console.log(`  ✓  ${label}`); passed++ }
    else    { console.error(`  ✗  ${label}`); failed++ }
  } catch (e) {
    console.error(`  ✗  ${label} — ${e.message}`)
    failed++
  }
}

function read(rel) { return readFileSync(join(root, rel), 'utf8') }
function exists(rel) { return existsSync(join(root, rel)) }

function noDropTable(rel) {
  const lines = read(rel).split('\n')
  return !lines.some(l => !l.trimStart().startsWith('--') && /DROP\s+TABLE/i.test(l))
}

console.log('\n── Phase B.7 Payments, Tips, Receipts & Settlement — 34 Checks ────────\n')

// ── Migration ──────────────────────────────────────────────────────────────────
check('Migration file exists',
  () => exists('server/db/migrations/037_pos360_payments.sql'))

check('Migration: no DROP TABLE (non-comment lines only)',
  () => noDropTable('server/db/migrations/037_pos360_payments.sql'))

check('Migration: pos360_payment_intents table',
  () => read('server/db/migrations/037_pos360_payments.sql').includes('pos360_payment_intents'))

check('Migration: pos360_payments table',
  () => read('server/db/migrations/037_pos360_payments.sql').includes('CREATE TABLE IF NOT EXISTS pos360_payments'))

check('Migration: pos360_payment_splits table',
  () => read('server/db/migrations/037_pos360_payments.sql').includes('pos360_payment_splits'))

check('Migration: pos360_payment_tips table',
  () => read('server/db/migrations/037_pos360_payments.sql').includes('pos360_payment_tips'))

check('Migration: pos360_payment_signatures table',
  () => read('server/db/migrations/037_pos360_payments.sql').includes('pos360_payment_signatures'))

check('Migration: pos360_payment_receipts table',
  () => read('server/db/migrations/037_pos360_payments.sql').includes('pos360_payment_receipts'))

check('Migration: pos360_payment_refunds table',
  () => read('server/db/migrations/037_pos360_payments.sql').includes('pos360_payment_refunds'))

check('Migration: pos360_payment_voids table',
  () => read('server/db/migrations/037_pos360_payments.sql').includes('pos360_payment_voids'))

check('Migration: pos360_payment_settlement_batches table',
  () => read('server/db/migrations/037_pos360_payments.sql').includes('pos360_payment_settlement_batches'))

check('Migration: pos360_payment_settlement_items table',
  () => read('server/db/migrations/037_pos360_payments.sql').includes('pos360_payment_settlement_items'))

check('Migration: pos360_payment_cash_drawer_events table',
  () => read('server/db/migrations/037_pos360_payments.sql').includes('pos360_payment_cash_drawer_events'))

check('Migration: pos360_payment_eat_alerts table',
  () => read('server/db/migrations/037_pos360_payments.sql').includes('pos360_payment_eat_alerts'))

check('Migration: pos360_payment_audit table',
  () => read('server/db/migrations/037_pos360_payments.sql').includes('pos360_payment_audit'))

check('Migration: idempotency_key in pos360_payments',
  () => read('server/db/migrations/037_pos360_payments.sql').includes('idempotency_key'))

check('Migration: contains_secrets in audit table',
  () => read('server/db/migrations/037_pos360_payments.sql').includes('contains_secrets'))

// ── Event Contracts ────────────────────────────────────────────────────────────
check('Event contracts file exists',
  () => exists('server/services/pos360/pos360PaymentEventContracts.js'))

check('PAYMENT_EVENTS exported',
  () => read('server/services/pos360/pos360PaymentEventContracts.js').includes('export const PAYMENT_EVENTS'))

check('PAYMENT_METHODS exported',
  () => read('server/services/pos360/pos360PaymentEventContracts.js').includes('export const PAYMENT_METHODS'))

check('SUPPORTED_LANGUAGES exported from event contracts',
  () => read('server/services/pos360/pos360PaymentEventContracts.js').includes('export const SUPPORTED_LANGUAGES'))

// ── Feature Flags ──────────────────────────────────────────────────────────────
check('Feature flags file exists',
  () => exists('server/config/pos360PaymentFeatureFlags.js'))

check('getPaymentFlags exported',
  () => read('server/config/pos360PaymentFeatureFlags.js').includes('export function getPaymentFlags'))

// ── Localization ───────────────────────────────────────────────────────────────
check('Localization file exists',
  () => exists('src/locales/pos360Payments.js'))

check('t() function exported',
  () => read('src/locales/pos360Payments.js').includes('export function t('))

check('All 6 languages present',
  () => ['en-US', 'es-DO', 'es', 'ht', 'de', 'pt'].every(l => read('src/locales/pos360Payments.js').includes(l)))

check('English fallback present (no_provider key)',
  () => read('src/locales/pos360Payments.js').includes('No payment provider is connected. No money was processed.'))

// ── Service ────────────────────────────────────────────────────────────────────
check('Service file exists',
  () => exists('server/services/pos360/pos360PaymentService.js'))

check('Service: correct DB import path',
  () => read('server/services/pos360/pos360PaymentService.js').includes("from '../../db/connection.js'"))

check('Service: fallback comment (no DATABASE_URL mention)',
  () => {
    const src = read('server/services/pos360/pos360PaymentService.js')
    return src.includes('Falls back gracefully when no database connection is configured') &&
           !src.includes('DATABASE_URL')
  })

check('Service: createPaymentIntent exported',
  () => read('server/services/pos360/pos360PaymentService.js').includes('export async function createPaymentIntent'))

check('Service: createRefundHook exported',
  () => read('server/services/pos360/pos360PaymentService.js').includes('export async function createRefundHook'))

check('Service: voidPaymentHook exported',
  () => read('server/services/pos360/pos360PaymentService.js').includes('export async function voidPaymentHook'))

check('Service: createSettlementBatch exported',
  () => read('server/services/pos360/pos360PaymentService.js').includes('export async function createSettlementBatch'))

check('Service: queueOfflinePaymentPlaceholder exported',
  () => read('server/services/pos360/pos360PaymentService.js').includes('export async function queueOfflinePaymentPlaceholder'))

check('Service: no fake payment success language',
  () => {
    const src = read('server/services/pos360/pos360PaymentService.js')
    return src.includes('No money was processed') && !src.includes('payment_success: true')
  })

check('Service: idempotency duplicate check present',
  () => read('server/services/pos360/pos360PaymentService.js').includes('idempotency_key'))

// ── Controller & Routes ────────────────────────────────────────────────────────
check('Controller file exists',
  () => exists('server/controllers/pos360PaymentController.js'))

check('Routes file exists',
  () => exists('server/routes/pos360PaymentRoutes.js'))

check('Routes: mounted at /api/pos360/payments in server/index.js',
  () => read('server/index.js').includes('/api/pos360/payments'))

// ── UI ─────────────────────────────────────────────────────────────────────────
check('UI page exists',
  () => exists('src/pages/pos360/POS360Payments.jsx'))

check('UI: /smokecraft-pos360.png referenced',
  () => read('src/pages/pos360/POS360Payments.jsx').includes('/smokecraft-pos360.png'))

check('UI: PaymentMethodSelector component present',
  () => read('src/pages/pos360/POS360Payments.jsx').includes('PaymentMethodSelector'))

check('UI: TipSelectionPanel component present',
  () => read('src/pages/pos360/POS360Payments.jsx').includes('TipSelectionPanel'))

check('UI: SignatureCapturePanel component present',
  () => read('src/pages/pos360/POS360Payments.jsx').includes('SignatureCapturePanel'))

check('UI: ReceiptPreviewPanel component present',
  () => read('src/pages/pos360/POS360Payments.jsx').includes('ReceiptPreviewPanel'))

check('UI: SplitPaymentPanel component present',
  () => read('src/pages/pos360/POS360Payments.jsx').includes('SplitPaymentPanel'))

check('UI: RefundVoidPanel component present',
  () => read('src/pages/pos360/POS360Payments.jsx').includes('RefundVoidPanel'))

check('UI: SettlementBatchPanel component present',
  () => read('src/pages/pos360/POS360Payments.jsx').includes('SettlementBatchPanel'))

check('UI: CashDrawerPanel component present',
  () => read('src/pages/pos360/POS360Payments.jsx').includes('CashDrawerPanel'))

check('UI: ProviderStatusPanel component present',
  () => read('src/pages/pos360/POS360Payments.jsx').includes('ProviderStatusPanel'))

check('UI: OfflinePaymentQueuePanel component present',
  () => read('src/pages/pos360/POS360Payments.jsx').includes('OfflinePaymentQueuePanel'))

check('UI: EATPaymentAlertsPanel component present',
  () => read('src/pages/pos360/POS360Payments.jsx').includes('EATPaymentAlertsPanel'))

check('UI: ManagerApprovalPanel component present',
  () => read('src/pages/pos360/POS360Payments.jsx').includes('ManagerApprovalPanel'))

check('UI: PaymentLanguageSelector component present',
  () => read('src/pages/pos360/POS360Payments.jsx').includes('PaymentLanguageSelector'))

check('UI: honest empty state — no provider message',
  () => read('src/pages/pos360/POS360Payments.jsx').includes('No payment provider is connected'))

check('App.jsx: payments route registered',
  () => read('src/App.jsx').includes('path="payments"') && read('src/App.jsx').includes('POS360Payments'))

// ── PCI / Security ─────────────────────────────────────────────────────────────
check('No raw card number storage (no raw_card / full_pan column)',
  () => {
    const sql = read('server/db/migrations/037_pos360_payments.sql')
    return !sql.includes('raw_card') && !sql.includes('full_pan') && !sql.includes('cvv')
  })

check('No raw card data in service (no cvv / full_pan reference)',
  () => {
    const src = read('server/services/pos360/pos360PaymentService.js')
    return !src.includes('cvv') && !src.includes('full_pan')
  })

console.log(`\n── Result: ${passed} passed, ${failed} failed ──────────────────────────\n`)
if (failed > 0) process.exit(1)
