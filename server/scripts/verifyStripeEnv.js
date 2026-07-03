/**
 * Stripe Environment Setup Verification Script
 * Verifies all Stripe-related files exist, are correctly structured,
 * contain no hardcoded live/test keys, and use environment variables only.
 */

import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const ROOT = resolve(process.cwd())
const pass = []
const fail = []

function assert(condition, label) {
  if (condition) {
    pass.push(label)
  } else {
    fail.push(label)
    console.error(`  FAIL: ${label}`)
  }
}

function fileExists(rel) {
  return existsSync(resolve(ROOT, rel))
}

function fileContains(rel, str) {
  if (!existsSync(resolve(ROOT, rel))) return false
  return readFileSync(resolve(ROOT, rel), 'utf8').includes(str)
}

function fileNotContains(rel, str) {
  if (!existsSync(resolve(ROOT, rel))) return true
  return !readFileSync(resolve(ROOT, rel), 'utf8').includes(str)
}

function fileNotMatchesPattern(rel, pattern) {
  if (!existsSync(resolve(ROOT, rel))) return true
  return !pattern.test(readFileSync(resolve(ROOT, rel), 'utf8'))
}

function fileSrc(rel) {
  if (!existsSync(resolve(ROOT, rel))) return ''
  return readFileSync(resolve(ROOT, rel), 'utf8')
}

const SVC   = 'server/services/payments/stripeReadinessService.js'
const CLI   = 'src/lib/stripeClient.js'
const CTRL  = 'server/controllers/eprlHealthController.js'
const ROUTE = 'server/routes/eprlHealthRoutes.js'
const ENV   = '.env.example'
const DOCS  = 'docs/STRIPE_ENVIRONMENT_SETUP.md'
const PKG   = 'package.json'

console.log('\n── Stripe Environment Setup Verification ──\n')

// ── File existence ──────────────────────────────────────────────────────────
console.log('File existence:')
assert(fileExists(SVC),   'stripeReadinessService.js exists')
assert(fileExists(CLI),   'stripeClient.js (frontend) exists')
assert(fileExists(CTRL),  'eprlHealthController.js exists')
assert(fileExists(ROUTE), 'eprlHealthRoutes.js exists')
assert(fileExists(ENV),   '.env.example exists')
assert(fileExists(DOCS),  'STRIPE_ENVIRONMENT_SETUP.md exists')

// ── stripeReadinessService.js ───────────────────────────────────────────────
console.log('\nstripeReadinessService.js:')
assert(fileContains(SVC, 'getStripeSecretKeyStatus'),        'exports getStripeSecretKeyStatus')
assert(fileContains(SVC, 'getStripePublishableKeyStatus'),   'exports getStripePublishableKeyStatus')
assert(fileContains(SVC, 'getStripeWebhookSecretStatus'),    'exports getStripeWebhookSecretStatus')
assert(fileContains(SVC, 'getStripePaymentReadiness'),       'exports getStripePaymentReadiness')
assert(fileContains(SVC, 'getStripeCheckoutReadiness'),      'exports getStripeCheckoutReadiness')
assert(fileContains(SVC, 'getStripeWebhookReadiness'),       'exports getStripeWebhookReadiness')
assert(fileContains(SVC, 'buildStripeReadinessReport'),      'exports buildStripeReadinessReport')
assert(fileContains(SVC, 'buildStripeMissingKeyResponse'),   'exports buildStripeMissingKeyResponse')
assert(fileContains(SVC, 'buildStripeConfiguredResponse'),   'exports buildStripeConfiguredResponse')
assert(fileContains(SVC, 'process.env.STRIPE_SECRET_KEY'),   'reads STRIPE_SECRET_KEY from env')
assert(fileContains(SVC, 'process.env.VITE_STRIPE_PUBLISHABLE_KEY'), 'reads VITE_STRIPE_PUBLISHABLE_KEY from env')
assert(fileContains(SVC, 'process.env.STRIPE_PUBLISHABLE_KEY'),      'reads legacy STRIPE_PUBLISHABLE_KEY from env')
assert(fileContains(SVC, 'process.env.STRIPE_WEBHOOK_SECRET'),       'reads STRIPE_WEBHOOK_SECRET from env')
assert(fileContains(SVC, 'redactKey'),                       'has redactKey helper')
assert(fileContains(SVC, '****'),                            'uses **** redaction format')
assert(fileContains(SVC, 'neverExposeToFrontend'),           'marks secret key as backend-only')
assert(fileContains(SVC, 'payment_ready_with_env'),          'uses honest payment_ready_with_env status')
assert(fileContains(SVC, 'payment_blocked_missing_env'),     'uses honest payment_blocked_missing_env status')
assert(fileContains(SVC, 'stripe_secret_key_required'),      'uses stripe_secret_key_required status')
assert(fileContains(SVC, 'stripe_publishable_key_required'), 'uses stripe_publishable_key_required status')
assert(fileContains(SVC, 'stripe_webhook_secret_required'),  'uses stripe_webhook_secret_required status')
assert(fileContains(SVC, 'Key values are never returned'),   'documents no key exposure')

// ── No hardcoded keys in service ────────────────────────────────────────────
// Allow prefix strings in startsWith() checks but reject actual key values (8+ chars after prefix)
console.log('\nNo hardcoded keys in stripeReadinessService.js:')
assert(fileNotMatchesPattern(SVC, /sk_live_[A-Za-z0-9]{8}/), 'no hardcoded sk_live_ key value')
assert(fileNotMatchesPattern(SVC, /sk_test_[A-Za-z0-9]{8}/), 'no hardcoded sk_test_ key value')
assert(fileNotMatchesPattern(SVC, /pk_live_[A-Za-z0-9]{8}/), 'no hardcoded pk_live_ key value')
assert(fileNotMatchesPattern(SVC, /pk_test_[A-Za-z0-9]{8}/), 'no hardcoded pk_test_ key value')
assert(fileNotMatchesPattern(SVC, /whsec_[A-Za-z0-9]{8}/),   'no hardcoded whsec_ key value')

// ── stripeClient.js (frontend) ──────────────────────────────────────────────
console.log('\nsrc/lib/stripeClient.js (frontend):')
assert(fileContains(CLI, 'VITE_STRIPE_PUBLISHABLE_KEY'),     'reads VITE_STRIPE_PUBLISHABLE_KEY')
assert(fileContains(CLI, 'import.meta.env'),                 'uses import.meta.env (Vite safe)')
assert(fileContains(CLI, 'getStripePublishableKey'),         'exports getStripePublishableKey')
assert(fileContains(CLI, 'isStripeCheckoutEnabled'),         'exports isStripeCheckoutEnabled')
assert(fileContains(CLI, 'getCheckoutDisabledReason'),       'exports getCheckoutDisabledReason')
assert(fileNotMatchesPattern(CLI, /process\.env\.STRIPE_SECRET_KEY/), 'no process.env.STRIPE_SECRET_KEY in frontend')
assert(fileNotContains(CLI, 'process.env'),                  'no process.env in frontend Vite file')
assert(fileNotMatchesPattern(CLI, /sk_live_[A-Za-z0-9]{8}/), 'no hardcoded sk_live_ in frontend')
assert(fileNotMatchesPattern(CLI, /sk_test_[A-Za-z0-9]{8}/), 'no hardcoded sk_test_ in frontend')
assert(fileNotMatchesPattern(CLI, /whsec_[A-Za-z0-9]{8}/),   'no hardcoded whsec_ in frontend')

// ── Health controller ───────────────────────────────────────────────────────
console.log('\neprlHealthController.js payments handler:')
assert(fileContains(CTRL, 'handlePaymentsHealth'),           'exports handlePaymentsHealth')
assert(fileContains(CTRL, 'stripeReadinessService'),         'imports stripeReadinessService')
assert(fileContains(CTRL, 'buildStripeReadinessReport'),     'calls buildStripeReadinessReport')
assert(fileContains(CTRL, "service: 'payments'"),            'tags response with service: payments')
assert(fileContains(CTRL, 'await import('),                  'uses dynamic ESM import (not require)')
assert(fileNotContains(CTRL, 'require('),                    'no CommonJS require() usage')

// ── Health route ────────────────────────────────────────────────────────────
console.log('\neprlHealthRoutes.js:')
assert(fileContains(ROUTE, 'handlePaymentsHealth'),          'imports handlePaymentsHealth')
assert(fileContains(ROUTE, "'/payments'"),                   'registers /payments route')

// ── .env.example placeholders ───────────────────────────────────────────────
console.log('\n.env.example:')
assert(fileContains(ENV, 'STRIPE_SECRET_KEY='),              'STRIPE_SECRET_KEY placeholder present')
assert(fileContains(ENV, 'VITE_STRIPE_PUBLISHABLE_KEY='),    'VITE_STRIPE_PUBLISHABLE_KEY placeholder present')
assert(fileContains(ENV, 'STRIPE_WEBHOOK_SECRET='),          'STRIPE_WEBHOOK_SECRET placeholder present')

const envSrc = fileSrc(ENV)
// placeholders must not have real key prefixes
assert(!envSrc.match(/STRIPE_SECRET_KEY=sk_(live|test)_/),  '.env.example has no real secret key value')
assert(!envSrc.match(/STRIPE_PUBLISHABLE_KEY=pk_(live|test)_/), '.env.example has no real publishable key value')
assert(!envSrc.match(/STRIPE_WEBHOOK_SECRET=whsec_/),        '.env.example has no real webhook secret value')

// ── Documentation ───────────────────────────────────────────────────────────
console.log('\ndocs/STRIPE_ENVIRONMENT_SETUP.md:')
assert(fileContains(DOCS, 'NOVEE OS'),                       'mentions NOVEE OS platform context')
assert(fileContains(DOCS, 'STRIPE_SECRET_KEY'),              'documents STRIPE_SECRET_KEY')
assert(fileContains(DOCS, 'VITE_STRIPE_PUBLISHABLE_KEY'),    'documents VITE_STRIPE_PUBLISHABLE_KEY')
assert(fileContains(DOCS, 'STRIPE_WEBHOOK_SECRET'),          'documents STRIPE_WEBHOOK_SECRET')
assert(fileContains(DOCS, 'process.env'),                    'shows backend env access pattern')
assert(fileContains(DOCS, 'import.meta.env'),                'shows frontend Vite env access pattern')
assert(fileContains(DOCS, 'never'),                          'has never-expose security guidance')
assert(fileContains(DOCS, 'Railway'),                        'documents Railway deployment setup')
assert(fileContains(DOCS, '/api/health/payments'),           'documents health check endpoint')
assert(fileContains(DOCS, 'payment_ready_with_env'),         'documents readiness statuses')
assert(fileContains(DOCS, 'payment_blocked_missing_env'),    'documents blocked status')
assert(fileContains(DOCS, '****'),                           'shows redaction format in docs')
assert(fileNotContains(DOCS, 'sk_live_ey'),                  'docs contain no real secret key')
assert(fileNotContains(DOCS, 'pk_live_ey'),                  'docs contain no real publishable key')

// ── package.json scripts ────────────────────────────────────────────────────
console.log('\npackage.json:')
assert(fileContains(PKG, 'verify:stripe-env'),               'verify:stripe-env script in package.json')

// ── No hardcoded keys anywhere in source ────────────────────────────────────
console.log('\nNo hardcoded Stripe keys in source tree (spot check):')
const criticalSrcFiles = [
  'server/index.js',
  'server/services/payments/stripeReadinessService.js',
  'server/controllers/eprlHealthController.js',
  'src/lib/stripeClient.js',
  'server/services/environment/environmentReadinessService.js',
]
for (const f of criticalSrcFiles) {
  assert(fileNotMatchesPattern(f, /sk_live_[A-Za-z0-9]{8}/), `no sk_live_ key value in ${f}`)
  assert(fileNotMatchesPattern(f, /sk_test_[A-Za-z0-9]{8}/), `no sk_test_ key value in ${f}`)
  assert(fileNotMatchesPattern(f, /whsec_[A-Za-z0-9]{8}/),   `no whsec_ key value in ${f}`)
}

// ── Summary ─────────────────────────────────────────────────────────────────
console.log('\n── Results ──')
console.log(`  Passed: ${pass.length}`)
console.log(`  Failed: ${fail.length}`)

if (fail.length > 0) {
  console.error('\nFailed assertions:')
  fail.forEach(f => console.error(`  - ${f}`))
  process.exit(1)
} else {
  console.log('\n  All Stripe environment setup assertions passed.')
  console.log('  Stripe keys are wired via environment variables only.')
  console.log('  No hardcoded keys detected in source.')
  console.log('  Frontend reads publishable key only via import.meta.env.')
  console.log('  Backend reads secret key only via process.env.')
  process.exit(0)
}
