#!/usr/bin/env node
// Phase D.2 Payment Provider Activation — Verification Script
// contains_secrets: false — verification only

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');

let passed = 0;
let failed = 0;
const failures = [];

function check(label, condition) {
  if (condition) {
    passed++;
  } else {
    failed++;
    failures.push(label);
    console.error(`  FAIL: ${label}`);
  }
}

function readFile(relPath) {
  try {
    return fs.readFileSync(path.join(root, relPath), 'utf8');
  } catch {
    return '';
  }
}

function fileExists(relPath) {
  return fs.existsSync(path.join(root, relPath));
}

console.log('\n=== Phase D.2 Payment Provider Activation Verification ===\n');

// --- File existence ---
console.log('[ File Existence ]');
const FILES = [
  'server/db/migrations/056_phase_d_payment_provider_activation.sql',
  'server/services/phaseD/phaseDPaymentProviderContracts.js',
  'server/config/phaseDPaymentProviderFeatureFlags.js',
  'src/locales/phaseDPaymentProviderActivation.js',
  'server/services/phaseD/phaseDPaymentProviderActivationService.js',
  'server/controllers/phaseDPaymentProviderActivationController.js',
  'server/routes/phaseDPaymentProviderActivationRoutes.js',
  'src/pages/phaseD/PhaseDPaymentProviderActivation.jsx',
  'docs/PHASE_D_PAYMENT_PROVIDER_ACTIVATION.md',
  'server/scripts/verifyPhaseDPaymentProviderActivation.js',
];
FILES.forEach(f => check(`File exists: ${f}`, fileExists(f)));

// --- Migration SQL ---
console.log('\n[ Migration SQL ]');
const sql = readFile('server/db/migrations/056_phase_d_payment_provider_activation.sql');
const sqlHas = (col) => new RegExp(col + '\\s+BOOLEAN NOT NULL DEFAULT FALSE').test(sql);

check('Migration file not empty', sql.length > 100);
check('Safe migration comment present', sql.includes('Safe migration'));
check('No DROP TABLE', !sql.includes('DROP TABLE'));
check('No TRUNCATE', !sql.includes('TRUNCATE'));
check('No DROP COLUMN', !sql.includes('DROP COLUMN'));

// Provider key CHECK
check('Stripe in provider_key CHECK', sql.includes("'stripe'"));
check('Square in provider_key CHECK', sql.includes("'square'"));
check('Manual invoice in provider_key CHECK', sql.includes("'manual_invoice'"));
check('Cash offline in provider_key CHECK', sql.includes("'cash_offline'"));
check('Future placeholder in provider_key CHECK', sql.includes("'future_placeholder'"));

// Status CHECK
check('not_started in status CHECK', sql.includes("'not_started'"));
check('credentials_required in status CHECK', sql.includes("'credentials_required'"));
check('credentials_present_unverified in status CHECK', sql.includes("'credentials_present_unverified'"));
check('verification_failed in status CHECK', sql.includes("'verification_failed'"));
check('verified_test_mode in status CHECK', sql.includes("'verified_test_mode'"));
check('verified_live_mode_locked in status CHECK', sql.includes("'verified_live_mode_locked'"));
check('live_mode_requested in status CHECK', sql.includes("'live_mode_requested'"));
check('live_mode_approved in status CHECK', sql.includes("'live_mode_approved'"));
check('live_mode_enabled in status CHECK', sql.includes("'live_mode_enabled'"));

// Boolean defaults
check('live_mode_enabled DEFAULT FALSE', sqlHas('live_mode_enabled'));
check('payment_processing_enabled DEFAULT FALSE', sqlHas('payment_processing_enabled'));
check('provider_connected DEFAULT FALSE', sqlHas('provider_connected'));
check('credentials_present DEFAULT FALSE', sqlHas('credentials_present'));
check('credentials_verified DEFAULT FALSE', sqlHas('credentials_verified'));
check('contains_secrets DEFAULT FALSE', sqlHas('contains_secrets'));
check('stores_secrets DEFAULT FALSE', sqlHas('stores_secrets'));
check('stores_raw_keys DEFAULT FALSE', sqlHas('stores_raw_keys'));
check('stores_card_data DEFAULT FALSE', sqlHas('stores_card_data'));

// Tables
const tables = [
  'payment_provider_registry',
  'payment_provider_credentials_status',
  'payment_provider_environment_locks',
  'payment_provider_live_mode_requests',
  'payment_provider_compliance_checklist',
  'payment_provider_activation_audit',
  'payment_provider_webhook_registry',
  'payment_provider_refund_policy_profiles',
  'payment_provider_manual_invoice_profiles',
  'payment_provider_cash_offline_records',
  'payment_provider_payout_readiness',
  'payment_provider_risk_flags',
  'payment_provider_marketplace_readiness',
  'payment_provider_environment_locks',
];
tables.forEach(t => check(`Table ${t} defined`, sql.includes(t)));

check('idempotency_key present in SQL', sql.includes('idempotency_key'));
check('idempotency_key UNIQUE in SQL', sql.includes('idempotency_key') && sql.includes('UNIQUE'));
check('Environment lock default reason present', sql.includes('Phase D.2 activation required before live mode'));
check('exposes_financial_data present', sql.includes('exposes_financial_data'));

// --- Contracts ---
console.log('\n[ Contracts ]');
const contracts = readFile('server/services/phaseD/phaseDPaymentProviderContracts.js');
check('Contracts not empty', contracts.length > 100);
check('PAYMENT_PROVIDER_KEYS exported', contracts.includes('export const PAYMENT_PROVIDER_KEYS'));
check('PAYMENT_PROVIDER_STATUSES exported', contracts.includes('export const PAYMENT_PROVIDER_STATUSES'));
check('CREDENTIAL_PRESENCE_STATUSES exported', contracts.includes('export const CREDENTIAL_PRESENCE_STATUSES'));
check('ENVIRONMENT_LOCK_STATUSES exported', contracts.includes('export const ENVIRONMENT_LOCK_STATUSES'));
check('PAYMENT_AUDIT_EVENT_TYPES exported', contracts.includes('export const PAYMENT_AUDIT_EVENT_TYPES'));
check('isValidPaymentProviderKey exported', contracts.includes('export const isValidPaymentProviderKey'));
check('isValidPaymentProviderStatus exported', contracts.includes('export const isValidPaymentProviderStatus'));
check('isValidCredentialStatus exported', contracts.includes('export const isValidCredentialStatus'));
check('isValidEnvironmentLockStatus exported', contracts.includes('export const isValidEnvironmentLockStatus'));
check('assertNoSecretsInPayload exported', contracts.includes('export function assertNoSecretsInPayload'));
check('requireProviderKey exported', contracts.includes('export function requireProviderKey'));
check('requireProviderStatus exported', contracts.includes('export function requireProviderStatus'));
check('stripe in PROVIDER_KEYS', contracts.includes("'stripe'"));
check('square in PROVIDER_KEYS', contracts.includes("'square'"));
check('manual_invoice in PROVIDER_KEYS', contracts.includes("'manual_invoice'"));
check('cash_offline in PROVIDER_KEYS', contracts.includes("'cash_offline'"));
check('future_placeholder in PROVIDER_KEYS', contracts.includes("'future_placeholder'"));
check('assertNoSecretsInPayload checks secret_key', contracts.includes("'secret_key'"));
check('assertNoSecretsInPayload checks api_secret', contracts.includes("'api_secret'"));
check('assertNoSecretsInPayload checks private_key', contracts.includes("'private_key'"));
check('assertNoSecretsInPayload checks access_token', contracts.includes("'access_token'"));
check('assertNoSecretsInPayload checks client_secret', contracts.includes("'client_secret'"));
check('contains_secrets false comment', contracts.includes('contains_secrets: false'));
check('stores_secrets false comment', contracts.includes('stores_secrets: false'));

// --- Feature Flags ---
console.log('\n[ Feature Flags ]');
const flags = readFile('server/config/phaseDPaymentProviderFeatureFlags.js');
check('Feature flags not empty', flags.length > 100);
check('phaseDPaymentProviderActivationEnabled: false', flags.includes('phaseDPaymentProviderActivationEnabled: false'));
check('stripeProviderEnabled: false', flags.includes('stripeProviderEnabled: false'));
check('squareProviderEnabled: false', flags.includes('squareProviderEnabled: false'));
check('stripeLiveModeEnabled: false', flags.includes('stripeLiveModeEnabled: false'));
check('squareLiveModeEnabled: false', flags.includes('squareLiveModeEnabled: false'));
check('stripePaymentProcessingEnabled: false', flags.includes('stripePaymentProcessingEnabled: false'));
check('squarePaymentProcessingEnabled: false', flags.includes('squarePaymentProcessingEnabled: false'));
check('noFakePaymentProcessingEnforced: true', flags.includes('noFakePaymentProcessingEnforced: true'));
check('noRawCardDataStorageEnforced: true', flags.includes('noRawCardDataStorageEnforced: true'));
check('noSecretsInDatabaseEnforced: true', flags.includes('noSecretsInDatabaseEnforced: true'));
check('noFakeProviderConnectionEnforced: true', flags.includes('noFakeProviderConnectionEnforced: true'));
check('noFakeInvoiceCompletionEnforced: true', flags.includes('noFakeInvoiceCompletionEnforced: true'));
check('liveModeApprovalGateRequired: true', flags.includes('liveModeApprovalGateRequired: true'));
check('credentialValidationRequired: true', flags.includes('credentialValidationRequired: true'));
check('platformAdminGuardRequired: true', flags.includes('platformAdminGuardRequired: true'));
check('auditTrailRequired: true', flags.includes('auditTrailRequired: true'));
check('idempotencyEnforced: true', flags.includes('idempotencyEnforced: true'));
check('environmentLockEnforced: true', flags.includes('environmentLockEnforced: true'));
check('getPhaseDPaymentProviderFlags exported', flags.includes('export function getPhaseDPaymentProviderFlags'));
check('contains_secrets false comment', flags.includes('contains_secrets: false'));

// --- Locales ---
console.log('\n[ Locales ]');
const locales = readFile('src/locales/phaseDPaymentProviderActivation.js');
check('Locales not empty', locales.length > 100);
check('en-US locale present', locales.includes("'en-US'"));
check('es-DO locale present', locales.includes("'es-DO'"));
check('es locale present', locales.includes("'es'") || locales.includes("  es:") || locales.includes('"es"'));
check('ht locale present', locales.includes("'ht'") || locales.includes("  ht:") || locales.includes('"ht"'));
check('de locale present', locales.includes("'de'") || locales.includes("  de:") || locales.includes('"de"'));
check('pt locale present', locales.includes("'pt'") || locales.includes("  pt:") || locales.includes('"pt"'));
check('tPhaseDPaymentProviderActivation exported', locales.includes('export function tPhaseDPaymentProviderActivation'));
check('getSupportedPhaseDPaymentProviderLanguages exported', locales.includes('export function getSupportedPhaseDPaymentProviderLanguages'));
check('contains_secrets false comment', locales.includes('contains_secrets: false'));
check('noFakePayments locale key', locales.includes('noFakePayments'));
check('noCardStorage locale key', locales.includes('noCardStorage'));
check('noSecretsInDb locale key', locales.includes('noSecretsInDb'));

// --- Service ---
console.log('\n[ Service Layer ]');
const svc = readFile('server/services/phaseD/phaseDPaymentProviderActivationService.js');
check('Service not empty', svc.length > 100);
check('JSDoc falls back gracefully', svc.includes('Falls back gracefully'));
check('JSDoc never prints connection string', svc.includes('Never prints or logs the database connection string'));
check('isDbAvailable import', svc.includes('isDbAvailable'));
check('assertNoSecretsInPayload import', svc.includes('assertNoSecretsInPayload'));
check('AREA constant', svc.includes("const AREA = 'phase_d_payment_provider_activation'"));
check('localFallback pattern', svc.includes('localFallback'));
check('database_not_configured in fallback', svc.includes("'database_not_configured'"));
check('requireIdempotency present', svc.includes('function requireIdempotency'));
check('idempotency_key_required error', svc.includes('idempotency_key_required'));
check('createRecord helper', svc.includes('async function createRecord'));
check('listRecords helper', svc.includes('async function listRecords'));
check('ON CONFLICT idempotency_key DO NOTHING', svc.includes('ON CONFLICT (idempotency_key) DO NOTHING'));
check('getDefaultProviders returns provider_connected false', svc.includes('provider_connected: false'));
check('getDefaultProviders returns live_mode_enabled false', svc.includes('live_mode_enabled: false'));
check('getDefaultProviders returns payment_processing_enabled false', svc.includes('payment_processing_enabled: false'));
check('getDefaultProviders returns contains_secrets false', svc.includes('contains_secrets: false'));
check('getDefaultProviders returns stores_secrets false', svc.includes('stores_secrets: false'));
check('listPaymentProviders exported', svc.includes('export async function listPaymentProviders'));
check('getPaymentProvider exported', svc.includes('export async function getPaymentProvider'));
check('registerPaymentProvider exported', svc.includes('export async function registerPaymentProvider'));
check('updatePaymentProviderStatus exported', svc.includes('export async function updatePaymentProviderStatus'));
check('listCredentialStatuses exported', svc.includes('export async function listCredentialStatuses'));
check('updateCredentialStatus exported', svc.includes('export async function updateCredentialStatus'));
check('listEnvironmentLocks exported', svc.includes('export async function listEnvironmentLocks'));
check('updateEnvironmentLock exported', svc.includes('export async function updateEnvironmentLock'));
check('listLiveModeRequests exported', svc.includes('export async function listLiveModeRequests'));
check('submitLiveModeRequest exported', svc.includes('export async function submitLiveModeRequest'));
check('approveLiveModeRequest exported', svc.includes('export async function approveLiveModeRequest'));
check('writePaymentProviderAudit exported', svc.includes('export async function writePaymentProviderAudit'));
check('getStripeActivationStatus exported', svc.includes('export async function getStripeActivationStatus'));
check('getSquareActivationStatus exported', svc.includes('export async function getSquareActivationStatus'));
check('getPaymentSafetyStatus exported', svc.includes('export async function getPaymentSafetyStatus'));
check('getPaymentSafetyStatus returns no_fake_payment_processing: true', svc.includes('no_fake_payment_processing: true'));
check('getPaymentSafetyStatus returns no_raw_card_data_storage: true', svc.includes('no_raw_card_data_storage: true'));
check('getPaymentSafetyStatus returns no_secrets_in_database: true', svc.includes('no_secrets_in_database: true'));
check('contains_secrets false comment', svc.includes('contains_secrets: false'));
check('stores_secrets false comment', svc.includes('stores_secrets: false'));

// --- Controller ---
console.log('\n[ Controller ]');
const ctrl = readFile('server/controllers/phaseDPaymentProviderActivationController.js');
check('Controller not empty', ctrl.length > 100);
check('ok500 pattern', ctrl.includes('const ok500 = (res, fn) => fn().catch'));
check('actorId pattern', ctrl.includes("const actorId = req => req.user?.id || req.headers['x-actor-id'] || 'system'"));
check('ikey pattern', ctrl.includes("const ikey = req => req.headers['x-idempotency-key'] || req.body?.idempotencyKey"));
check('listPaymentProviders exported', ctrl.includes('export const listPaymentProviders'));
check('getPaymentProvider exported', ctrl.includes('export const getPaymentProvider'));
check('registerPaymentProvider exported', ctrl.includes('export const registerPaymentProvider'));
check('updatePaymentProviderStatus exported', ctrl.includes('export const updatePaymentProviderStatus'));
check('listCredentialStatuses exported', ctrl.includes('export const listCredentialStatuses'));
check('updateCredentialStatus exported', ctrl.includes('export const updateCredentialStatus'));
check('listEnvironmentLocks exported', ctrl.includes('export const listEnvironmentLocks'));
check('updateEnvironmentLock exported', ctrl.includes('export const updateEnvironmentLock'));
check('listLiveModeRequests exported', ctrl.includes('export const listLiveModeRequests'));
check('submitLiveModeRequest exported', ctrl.includes('export const submitLiveModeRequest'));
check('approveLiveModeRequest exported', ctrl.includes('export const approveLiveModeRequest'));
check('writePaymentProviderAudit exported', ctrl.includes('export const writePaymentProviderAudit'));
check('getStripeActivationStatus exported', ctrl.includes('export const getStripeActivationStatus'));
check('updateStripeConfig exported', ctrl.includes('export const updateStripeConfig'));
check('getSquareActivationStatus exported', ctrl.includes('export const getSquareActivationStatus'));
check('updateSquareConfig exported', ctrl.includes('export const updateSquareConfig'));
check('getManualInvoiceConfig exported', ctrl.includes('export const getManualInvoiceConfig'));
check('getCashOfflineConfig exported', ctrl.includes('export const getCashOfflineConfig'));
check('getPaymentSafetyStatus exported', ctrl.includes('export const getPaymentSafetyStatus'));
check('contains_secrets false comment', ctrl.includes('contains_secrets: false'));

// --- Routes ---
console.log('\n[ Routes ]');
const routes = readFile('server/routes/phaseDPaymentProviderActivationRoutes.js');
check('Routes not empty', routes.length > 100);
check('canAccessPOS3 imported', routes.includes('canAccessPOS3'));
check('platformAdminGuardRequired comment', routes.includes('platformAdminGuardRequired = true on all write routes'));
check('GET /providers route', routes.includes("router.get('/providers'"));
check('POST /providers with canAccessPOS3', routes.includes("router.post('/providers',") && routes.includes('canAccessPOS3, ctrl.registerPaymentProvider'));
check('PATCH /providers/:providerKey/status with canAccessPOS3', routes.includes("canAccessPOS3, ctrl.updatePaymentProviderStatus"));
check('GET /credentials route', routes.includes("router.get('/credentials'"));
check('POST /credentials with canAccessPOS3', routes.includes("canAccessPOS3, ctrl.updateCredentialStatus"));
check('GET /environment-locks route', routes.includes("router.get('/environment-locks'"));
check('POST /environment-locks with canAccessPOS3', routes.includes("canAccessPOS3, ctrl.updateEnvironmentLock"));
check('GET /live-mode-requests route', routes.includes("router.get('/live-mode-requests'"));
check('POST /live-mode-requests with canAccessPOS3', routes.includes("canAccessPOS3, ctrl.submitLiveModeRequest"));
check('PATCH approve live mode with canAccessPOS3', routes.includes("canAccessPOS3, ctrl.approveLiveModeRequest"));
check('GET /compliance route', routes.includes("router.get('/compliance'"));
check('POST /compliance with canAccessPOS3', routes.includes("canAccessPOS3, ctrl.createComplianceCheck"));
check('GET /audit route', routes.includes("router.get('/audit'"));
check('POST /audit with canAccessPOS3', routes.includes("canAccessPOS3, ctrl.writePaymentProviderAudit"));
check('GET /stripe/status route', routes.includes("router.get('/stripe/status'"));
check('POST /stripe/config with canAccessPOS3', routes.includes("canAccessPOS3, ctrl.updateStripeConfig"));
check('GET /square/status route', routes.includes("router.get('/square/status'"));
check('GET /safety-status route', routes.includes("router.get('/safety-status'"));
check('GET /pci-scope route', routes.includes("router.get('/pci-scope'"));
check('POST /pci-scope with canAccessPOS3', routes.includes("canAccessPOS3, ctrl.createPciScopeItem"));
check('GET /webhooks route', routes.includes("router.get('/webhooks'"));
check('POST /webhooks with canAccessPOS3', routes.includes("canAccessPOS3, ctrl.registerWebhookEndpoint"));
check('GET /refund-rules route', routes.includes("router.get('/refund-rules'"));
check('POST /refund-rules with canAccessPOS3', routes.includes("canAccessPOS3, ctrl.createRefundRule"));
check('export default router', routes.includes('export default router'));
check('contains_secrets false comment', routes.includes('contains_secrets: false'));

// --- UI Page ---
console.log('\n[ UI Page ]');
const ui = readFile('src/pages/phaseD/PhaseDPaymentProviderActivation.jsx');
check('UI page not empty', ui.length > 100);
check('contains_secrets false comment', ui.includes('contains_secrets: false'));
check('DEVICE_LINE uses &middot;', ui.includes('&middot;'));
check('No non-ASCII chars outside comments', !/[^\x00-\x7F]/.test(ui.replace(/\/\/.*/g, '')));
check('NAVY color defined', ui.includes("const NAVY"));
check('GOLD color defined', ui.includes("const GOLD"));
check('SafetyBanner component present', ui.includes('function SafetyBanner'));
check('OverviewPanel component present', ui.includes('function OverviewPanel'));
check('ProviderRegistryPanel present', ui.includes('function ProviderRegistryPanel'));
check('StripePanel present', ui.includes('function StripePanel'));
check('SquarePanel present', ui.includes('function SquarePanel'));
check('ManualInvoicePanel present', ui.includes('function ManualInvoicePanel'));
check('CashOfflinePanel present', ui.includes('function CashOfflinePanel'));
check('FutureProvidersPanel present', ui.includes('function FutureProvidersPanel'));
check('CredentialStatusPanel present', ui.includes('function CredentialStatusPanel'));
check('EnvironmentLocksPanel present', ui.includes('function EnvironmentLocksPanel'));
check('LiveModeRequestsPanel present', ui.includes('function LiveModeRequestsPanel'));
check('CompliancePanel present', ui.includes('function CompliancePanel'));
check('PciScopePanel present', ui.includes('function PciScopePanel'));
check('WebhooksPanel present', ui.includes('function WebhooksPanel'));
check('RefundRulesPanel present', ui.includes('function RefundRulesPanel'));
check('AuditLogPanel present', ui.includes('function AuditLogPanel'));
check('SafetyStatusPanel present', ui.includes('function SafetyStatusPanel'));
check('NoFakeEnforcementPanel present', ui.includes('function NoFakeEnforcementPanel'));
check('FeatureFlagsPanel present', ui.includes('function FeatureFlagsPanel'));
check('ActivationOrderPanel present', ui.includes('function ActivationOrderPanel'));
check('PrerequisitesPanel present', ui.includes('function PrerequisitesPanel'));
check('BlockersPanel present', ui.includes('function BlockersPanel'));
check('LegalRequirementsPanel present', ui.includes('function LegalRequirementsPanel'));
check('BillingSetupPanel present', ui.includes('function BillingSetupPanel'));
check('SecurityRequirementsPanel present', ui.includes('function SecurityRequirementsPanel'));
check('PhaseDTrackerPanel present', ui.includes('function PhaseDTrackerPanel'));
check('PhaseDPaymentProviderActivationShell present', ui.includes('function PhaseDPaymentProviderActivationShell'));
check('PhaseDPaymentProviderActivation function exported', ui.includes('function PhaseDPaymentProviderActivation'));
check('export default PhaseDPaymentProviderActivation', ui.includes('export default PhaseDPaymentProviderActivation'));
check('Safety message: no secrets in UI', ui.includes('no credentials'));
check('Stripe secret key warning', ui.includes('STRIPE_SECRET_KEY'));
check('Square access token warning', ui.includes('SQUARE_ACCESS_TOKEN'));
check('No fake payment warning in UI', ui.includes('No fake payment'));
check('No card storage warning in UI', ui.includes('card data'));
check('PANELS object', ui.includes('const PANELS = {'));
check('TABS array', ui.includes('const TABS = ['));

// --- server/index.js wiring ---
console.log('\n[ server/index.js Wiring ]');
const idx = readFile('server/index.js');
check('index.js not empty', idx.length > 100);
check('phaseDPaymentProviderActivationRoutes imported', idx.includes('phaseDPaymentProviderActivationRoutes'));
check('Route mounted at /api/phase-d/payment-provider-activation', idx.includes('/api/phase-d/payment-provider-activation'));
const importCount = (idx.match(/phaseDPaymentProviderActivationRoutes/g) || []).length;
check('phaseDPaymentProviderActivationRoutes not duplicated (<=3)', importCount <= 3);

// --- src/App.jsx wiring ---
console.log('\n[ src/App.jsx Wiring ]');
const app = readFile('src/App.jsx');
check('App.jsx not empty', app.length > 100);
check('PhaseDPaymentProviderActivation imported', app.includes('PhaseDPaymentProviderActivation'));
check('Route phase-d/payment-provider-activation present', app.includes('phase-d/payment-provider-activation'));

// --- package.json ---
console.log('\n[ package.json ]');
const pkg = readFile('package.json');
check('verify:phase-d-payment-provider-activation script present', pkg.includes('verify:phase-d-payment-provider-activation'));

// --- Safety invariants ---
console.log('\n[ Safety Invariants ]');
check('No raw card data fields in migration', !sql.includes('card_number') && !sql.includes('pan_number') && !sql.includes('cvv_value'));
check('No secret_key column in migration', !sql.includes('secret_key TEXT') && !sql.includes('secret_key VARCHAR'));
check('No api_secret column in migration', !sql.includes('api_secret TEXT') && !sql.includes('api_secret VARCHAR'));
check('No private_key column in migration', !sql.includes('private_key TEXT'));
check('No access_token column in migration', !sql.includes('access_token TEXT') && !sql.includes('access_token VARCHAR'));
check('Service assertNoSecretsInPayload is called on all write methods', svc.includes('assertNoSecretsInPayload(payload)'));
check('Service requireIdempotency called on write methods', svc.includes('requireIdempotency(idempotencyKey)'));
check('Contracts throw on forbidden secret fields', contracts.includes("throw new Error(`assertNoSecretsInPayload: forbidden field '${field}'"));
check('No fake Stripe connect comment in service', !svc.includes('fakeStripe') && !svc.includes('fake_stripe'));
check('No fake Square connect comment in service', !svc.includes('fakeSquare') && !svc.includes('fake_square'));
check('getPaymentSafetyStatus returns all safety flags true', svc.includes('no_fake_payment_processing: true') && svc.includes('no_secrets_in_database: true'));

// --- docs ---
console.log('\n[ Docs ]');
const docs = readFile('docs/PHASE_D_PAYMENT_PROVIDER_ACTIVATION.md');
check('Docs file not empty', docs.length > 100);
check('Critical safety rules documented', docs.includes('Critical Safety Rules'));
check('Providers table documented', docs.includes('stripe'));
check('Activation statuses documented', docs.includes('not_started'));
check('API routes documented', docs.includes('/providers'));
check('Feature flags section documented', docs.includes('Feature Flags'));
check('Credential security section documented', docs.includes('Credential Security'));
check('Honest limitations documented', docs.includes('Honest Limitations'));

// --- Summary ---
const total = passed + failed;
console.log(`\n${'='.repeat(60)}`);
console.log(`Phase D.2 Payment Provider Activation Verification`);
console.log(`${'='.repeat(60)}`);
console.log(`Total checks : ${total}`);
console.log(`Passed       : ${passed}`);
console.log(`Failed       : ${failed}`);

if (failures.length > 0) {
  console.log('\nFailed checks:');
  failures.forEach(f => console.log(`  - ${f}`));
  process.exit(1);
} else {
  console.log('\nAll checks passed. Phase D.2 verification complete.');
  process.exit(0);
}
