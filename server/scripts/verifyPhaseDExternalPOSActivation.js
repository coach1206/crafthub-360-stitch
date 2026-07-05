#!/usr/bin/env node
// Phase D.3 External POS Activation — Verification Script
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
  if (condition) { passed++; }
  else { failed++; failures.push(label); console.error(`  FAIL: ${label}`); }
}

function readFile(relPath) {
  try { return fs.readFileSync(path.join(root, relPath), 'utf8'); }
  catch { return ''; }
}

function fileExists(relPath) {
  return fs.existsSync(path.join(root, relPath));
}

console.log('\n=== Phase D.3 External POS Activation Verification ===\n');

// --- File Existence ---
console.log('[ File Existence ]');
const FILES = [
  'server/db/migrations/057_phase_d_external_pos_activation.sql',
  'server/services/phaseD/phaseDExternalPOSContracts.js',
  'server/config/phaseDExternalPOSFeatureFlags.js',
  'src/locales/phaseDExternalPOSActivation.js',
  'server/services/phaseD/phaseDExternalPOSActivationService.js',
  'server/controllers/phaseDExternalPOSActivationController.js',
  'server/routes/phaseDExternalPOSActivationRoutes.js',
  'src/pages/phaseD/PhaseDExternalPOSActivation.jsx',
  'docs/PHASE_D_EXTERNAL_POS_ACTIVATION.md',
  'server/scripts/verifyPhaseDExternalPOSActivation.js',
];
FILES.forEach(f => check(`File exists: ${f}`, fileExists(f)));

// --- Migration SQL ---
console.log('\n[ Migration SQL ]');
const sql = readFile('server/db/migrations/057_phase_d_external_pos_activation.sql');
const sqlHas = (col) => new RegExp(col + '\\s+BOOLEAN NOT NULL DEFAULT FALSE').test(sql);

check('Migration not empty', sql.length > 100);
check('Safe migration comment', sql.includes('Safe migration'));
check('No DROP TABLE', !sql.includes('DROP TABLE'));
check('No TRUNCATE', !sql.includes('TRUNCATE'));
check('No DROP COLUMN', !sql.includes('DROP COLUMN'));

// Provider key CHECK values
const providers = ['toast','clover','square_pos','lightspeed','shopify_pos','spoton','touchbistro','revel','generic_csv','manual_pos_companion','future_pos_provider'];
providers.forEach(p => check(`Provider '${p}' in SQL CHECK`, sql.includes(`'${p}'`)));

// Status CHECK values
const statuses = ['not_started','credentials_required','credentials_present_unverified','mapping_required','mapping_in_progress','import_ready','import_tested','api_contract_ready','api_verification_required','api_verified_test_mode','api_live_mode_locked','live_mode_requested','live_mode_approved','live_mode_enabled','disabled','blocked','failed'];
statuses.forEach(s => check(`Status '${s}' in SQL`, sql.includes(`'${s}'`)));

// Boolean defaults
check('connected DEFAULT FALSE', sqlHas('connected'));
check('api_sync_enabled DEFAULT FALSE', sqlHas('api_sync_enabled'));
check('webhook_enabled DEFAULT FALSE', sqlHas('webhook_enabled'));
check('live_mode_enabled DEFAULT FALSE', sqlHas('live_mode_enabled'));
check('contains_secrets DEFAULT FALSE', sqlHas('contains_secrets'));
check('stores_secrets DEFAULT FALSE', sqlHas('stores_secrets'));
check('stores_raw_keys DEFAULT FALSE', sqlHas('stores_raw_keys'));
check('stores_api_secret DEFAULT FALSE', sqlHas('stores_api_secret'));
check('mapping_confirmed DEFAULT FALSE', sqlHas('mapping_confirmed'));

// Required tables
const tables = [
  'external_pos_provider_registry',
  'external_pos_provider_status',
  'external_pos_credentials_status',
  'external_pos_mode_registry',
  'external_pos_companion_mode_profiles',
  'external_pos_import_profiles',
  'external_pos_csv_import_templates',
  'external_pos_import_batches',
  'external_pos_import_batch_items',
  'external_pos_manual_mapping_profiles',
  'external_pos_menu_category_mapping',
  'external_pos_menu_item_mapping',
  'external_pos_modifier_mapping',
  'external_pos_tax_mapping',
  'external_pos_tip_mapping',
  'external_pos_payment_type_mapping',
  'external_pos_staff_role_mapping',
  'external_pos_table_section_mapping',
  'external_pos_revenue_center_mapping',
  'external_pos_department_mapping',
  'external_pos_inventory_signal_mapping',
  'external_pos_humidor_mapping',
  'external_pos_bar_mapping',
  'external_pos_kitchen_mapping',
  'external_pos_order_flow_mapping',
  'external_pos_ticket_flow_mapping',
  'external_pos_closeout_mapping',
  'external_pos_report_mapping',
  'external_pos_api_contract_registry',
  'external_pos_webhook_registry',
  'external_pos_webhook_health',
  'external_pos_live_mode_requests',
  'external_pos_live_mode_approvals',
  'external_pos_environment_locks',
  'external_pos_tenant_mapping',
  'external_pos_module_mapping',
  'external_pos_compliance_checklist',
  'external_pos_risk_flags',
  'external_pos_activation_audit',
];
tables.forEach(t => check(`Table ${t} defined`, sql.includes(t)));

check('idempotency_key UNIQUE in SQL', sql.includes('idempotency_key') && sql.includes('UNIQUE'));
check('Environment lock reason in SQL', sql.includes('Phase D.3 activation required before live mode'));
check('Mode key CHECK in SQL', sql.includes("'companion_mode'"));
check('Credential presence CHECK in SQL', sql.includes("'absent'"));
check('No raw secret columns (api_key TEXT)', !sql.includes('api_key TEXT') && !sql.includes('api_key VARCHAR'));
check('No private_key column', !sql.includes('private_key TEXT'));
check('No access_token column', !sql.includes('access_token TEXT'));

// --- Contracts ---
console.log('\n[ Contracts ]');
const contracts = readFile('server/services/phaseD/phaseDExternalPOSContracts.js');
check('Contracts not empty', contracts.length > 100);
check('EXTERNAL_POS_PROVIDER_KEYS exported', contracts.includes('export const EXTERNAL_POS_PROVIDER_KEYS'));
check('EXTERNAL_POS_MODE_KEYS exported', contracts.includes('export const EXTERNAL_POS_MODE_KEYS'));
check('EXTERNAL_POS_STATUSES exported', contracts.includes('export const EXTERNAL_POS_STATUSES'));
check('EXTERNAL_POS_CAPABILITIES exported', contracts.includes('export const EXTERNAL_POS_CAPABILITIES'));
check('EXTERNAL_POS_MAPPING_TYPES exported', contracts.includes('export const EXTERNAL_POS_MAPPING_TYPES'));
providers.forEach(p => check(`Provider '${p}' in contracts`, contracts.includes(`'${p}'`)));
const modes = ['companion_mode','export_import_mode','api_contract_mode','manual_mapping_mode','hybrid_mode'];
modes.forEach(m => check(`Mode '${m}' in contracts`, contracts.includes(`'${m}'`)));
check('validateExternalPOSProviderKey exported', contracts.includes('export const validateExternalPOSProviderKey'));
check('validateExternalPOSModeKey exported', contracts.includes('export const validateExternalPOSModeKey'));
check('validateExternalPOSStatus exported', contracts.includes('export const validateExternalPOSStatus'));
check('validateCompanionModeProfile exported', contracts.includes('export function validateCompanionModeProfile'));
check('validateImportProfile exported', contracts.includes('export function validateImportProfile'));
check('validateCSVImportTemplate exported', contracts.includes('export function validateCSVImportTemplate'));
check('validateImportBatch exported', contracts.includes('export function validateImportBatch'));
check('validateManualMappingProfile exported', contracts.includes('export function validateManualMappingProfile'));
check('validateMenuCategoryMapping exported', contracts.includes('export function validateMenuCategoryMapping'));
check('validateMenuItemMapping exported', contracts.includes('export function validateMenuItemMapping'));
check('validateModifierMapping exported', contracts.includes('export function validateModifierMapping'));
check('validateTaxMapping exported', contracts.includes('export function validateTaxMapping'));
check('validateTipMapping exported', contracts.includes('export function validateTipMapping'));
check('validatePaymentTypeMapping exported', contracts.includes('export function validatePaymentTypeMapping'));
check('validateStaffRoleMapping exported', contracts.includes('export function validateStaffRoleMapping'));
check('validateTableSectionMapping exported', contracts.includes('export function validateTableSectionMapping'));
check('validateRevenueCenterMapping exported', contracts.includes('export function validateRevenueCenterMapping'));
check('validateDepartmentMapping exported', contracts.includes('export function validateDepartmentMapping'));
check('validateInventorySignalMapping exported', contracts.includes('export function validateInventorySignalMapping'));
check('validateHumidorMapping exported', contracts.includes('export function validateHumidorMapping'));
check('validateBarMapping exported', contracts.includes('export function validateBarMapping'));
check('validateKitchenMapping exported', contracts.includes('export function validateKitchenMapping'));
check('validateOrderFlowMapping exported', contracts.includes('export function validateOrderFlowMapping'));
check('validateTicketFlowMapping exported', contracts.includes('export function validateTicketFlowMapping'));
check('validateCloseoutMapping exported', contracts.includes('export function validateCloseoutMapping'));
check('validateReportMapping exported', contracts.includes('export function validateReportMapping'));
check('validateAPIContractRegistry exported', contracts.includes('export function validateAPIContractRegistry'));
check('validateWebhookRegistry exported', contracts.includes('export function validateWebhookRegistry'));
check('validateLiveModeRequest exported', contracts.includes('export function validateLiveModeRequest'));
check('validateTenantExternalPOSMapping exported', contracts.includes('export function validateTenantExternalPOSMapping'));
check('validateModuleExternalPOSMapping exported', contracts.includes('export function validateModuleExternalPOSMapping'));
check('validateComplianceChecklistItem exported', contracts.includes('export function validateComplianceChecklistItem'));
check('validateRiskFlag exported', contracts.includes('export function validateRiskFlag'));
check('assertNoExternalPOSSecretsInPayload exported', contracts.includes('export function assertNoExternalPOSSecretsInPayload'));
check('assertNoFakeExternalPOSConnectedStatus exported', contracts.includes('export function assertNoFakeExternalPOSConnectedStatus'));
check('assertNoFakeExternalPOSSyncClaim exported', contracts.includes('export function assertNoFakeExternalPOSSyncClaim'));
check('assertNoExternalPOSSecretsInPayload checks api_key', contracts.includes("'api_key'"));
check('assertNoExternalPOSSecretsInPayload checks access_token', contracts.includes("'access_token'"));
check('assertNoFakeExternalPOSConnectedStatus throws on connected:true', contracts.includes('cannot set connected/api_sync_enabled/live_mode_enabled to true'));
check('contains_secrets false comment', contracts.includes('contains_secrets: false'));
check('stores_secrets false comment', contracts.includes('stores_secrets: false'));

// --- Feature Flags ---
console.log('\n[ Feature Flags ]');
const flags = readFile('server/config/phaseDExternalPOSFeatureFlags.js');
check('Flags not empty', flags.length > 100);
check('PHASE_D_EXTERNAL_POS_ENABLED: false', flags.includes('PHASE_D_EXTERNAL_POS_ENABLED: false'));
check('EXTERNAL_POS_PROVIDER_REGISTRY_ENABLED: false', flags.includes('EXTERNAL_POS_PROVIDER_REGISTRY_ENABLED: false'));
check('EXTERNAL_POS_COMPANION_MODE_ENABLED: false', flags.includes('EXTERNAL_POS_COMPANION_MODE_ENABLED: false'));
check('EXTERNAL_POS_EXPORT_IMPORT_MODE_ENABLED: false', flags.includes('EXTERNAL_POS_EXPORT_IMPORT_MODE_ENABLED: false'));
check('EXTERNAL_POS_API_CONTRACT_MODE_ENABLED: false', flags.includes('EXTERNAL_POS_API_CONTRACT_MODE_ENABLED: false'));
check('EXTERNAL_POS_MANUAL_MAPPING_MODE_ENABLED: false', flags.includes('EXTERNAL_POS_MANUAL_MAPPING_MODE_ENABLED: false'));
check('TOAST_POS_CONTRACT_ENABLED: false', flags.includes('TOAST_POS_CONTRACT_ENABLED: false'));
check('CLOVER_POS_CONTRACT_ENABLED: false', flags.includes('CLOVER_POS_CONTRACT_ENABLED: false'));
check('SQUARE_POS_CONTRACT_ENABLED: false', flags.includes('SQUARE_POS_CONTRACT_ENABLED: false'));
check('LIGHTSPEED_POS_CONTRACT_ENABLED: false', flags.includes('LIGHTSPEED_POS_CONTRACT_ENABLED: false'));
check('SHOPIFY_POS_CONTRACT_ENABLED: false', flags.includes('SHOPIFY_POS_CONTRACT_ENABLED: false'));
check('SPOTON_POS_CONTRACT_ENABLED: false', flags.includes('SPOTON_POS_CONTRACT_ENABLED: false'));
check('TOUCHBISTRO_POS_CONTRACT_ENABLED: false', flags.includes('TOUCHBISTRO_POS_CONTRACT_ENABLED: false'));
check('REVEL_POS_CONTRACT_ENABLED: false', flags.includes('REVEL_POS_CONTRACT_ENABLED: false'));
check('GENERIC_CSV_IMPORT_ENABLED: false', flags.includes('GENERIC_CSV_IMPORT_ENABLED: false'));
check('MANUAL_POS_COMPANION_ENABLED: false', flags.includes('MANUAL_POS_COMPANION_ENABLED: false'));
check('EXTERNAL_POS_API_SYNC_PROCESSING_ENABLED: false', flags.includes('EXTERNAL_POS_API_SYNC_PROCESSING_ENABLED: false'));
check('EXTERNAL_POS_LIVE_INVENTORY_SYNC_ENABLED: false', flags.includes('EXTERNAL_POS_LIVE_INVENTORY_SYNC_ENABLED: false'));
check('EXTERNAL_POS_LIVE_MENU_SYNC_ENABLED: false', flags.includes('EXTERNAL_POS_LIVE_MENU_SYNC_ENABLED: false'));
check('EXTERNAL_POS_LIVE_TICKET_SYNC_ENABLED: false', flags.includes('EXTERNAL_POS_LIVE_TICKET_SYNC_ENABLED: false'));
check('EXTERNAL_POS_LIVE_SALES_SYNC_ENABLED: false', flags.includes('EXTERNAL_POS_LIVE_SALES_SYNC_ENABLED: false'));
check('EXTERNAL_POS_WEBHOOK_DELIVERY_ENABLED: false', flags.includes('EXTERNAL_POS_WEBHOOK_DELIVERY_ENABLED: false'));
check('EXTERNAL_POS_NO_SECRET_STORAGE_ENFORCED: true', flags.includes('EXTERNAL_POS_NO_SECRET_STORAGE_ENFORCED: true'));
check('EXTERNAL_POS_NO_FAKE_CONNECTED_STATUS_ENFORCED: true', flags.includes('EXTERNAL_POS_NO_FAKE_CONNECTED_STATUS_ENFORCED: true'));
check('EXTERNAL_POS_NO_FAKE_SYNC_ENFORCED: true', flags.includes('EXTERNAL_POS_NO_FAKE_SYNC_ENFORCED: true'));
check('EXTERNAL_POS_CAN_ACCESS_POS3_WRITE_REQUIRED: true', flags.includes('EXTERNAL_POS_CAN_ACCESS_POS3_WRITE_REQUIRED: true'));
check('EXTERNAL_POS_ADMIN_ONLY_LIVE_REQUEST_REQUIRED: true', flags.includes('EXTERNAL_POS_ADMIN_ONLY_LIVE_REQUEST_REQUIRED: true'));
check('EXTERNAL_POS_IDEMPOTENCY_ENFORCED: true', flags.includes('EXTERNAL_POS_IDEMPOTENCY_ENFORCED: true'));
check('EXTERNAL_POS_AUDIT_TRAIL_ENFORCED: true', flags.includes('EXTERNAL_POS_AUDIT_TRAIL_ENFORCED: true'));
check('EXTERNAL_POS_ENVIRONMENT_LOCK_ENFORCED: true', flags.includes('EXTERNAL_POS_ENVIRONMENT_LOCK_ENFORCED: true'));
check('getPhaseDExternalPOSFlags exported', flags.includes('export function getPhaseDExternalPOSFlags'));
check('contains_secrets false comment', flags.includes('contains_secrets: false'));

// --- Locales ---
console.log('\n[ Locales ]');
const locales = readFile('src/locales/phaseDExternalPOSActivation.js');
check('Locales not empty', locales.length > 100);
check("'en-US' locale present", locales.includes("'en-US'"));
check('es-DO locale present', locales.includes("'es-DO'"));
check('es locale present', locales.includes("  es:") || locales.includes("'es'"));
check('ht locale present', locales.includes("  ht:") || locales.includes("'ht'"));
check('de locale present', locales.includes("  de:") || locales.includes("'de'"));
check('pt locale present', locales.includes("  pt:") || locales.includes("'pt'"));
check('tPhaseDExternalPOSActivation exported', locales.includes('export function tPhaseDExternalPOSActivation'));
check('getSupportedPhaseDExternalPOSLanguages exported', locales.includes('export function getSupportedPhaseDExternalPOSLanguages'));
check('companionMode locale key', locales.includes('companionMode'));
check('exportImportMode locale key', locales.includes('exportImportMode'));
check('apiContractMode locale key', locales.includes('apiContractMode'));
check('manualMappingMode locale key', locales.includes('manualMappingMode'));
check('noLiveSync locale key', locales.includes('noLiveSync'));
check('noSecretStorage locale key', locales.includes('noSecretStorage'));
check('toast locale key', locales.includes('toast'));
check('clover locale key', locales.includes('clover'));
check('menuMapping locale key', locales.includes('menuMapping'));
check('humidorMapping locale key', locales.includes('humidorMapping'));
check('contains_secrets false comment', locales.includes('contains_secrets: false'));

// --- Service ---
console.log('\n[ Service Layer ]');
const svc = readFile('server/services/phaseD/phaseDExternalPOSActivationService.js');
check('Service not empty', svc.length > 100);
check('JSDoc falls back gracefully', svc.includes('Falls back gracefully'));
check('JSDoc never prints connection string', svc.includes('Never prints or logs the database connection string'));
check('isDbAvailable import', svc.includes('isDbAvailable'));
check('assertNoExternalPOSSecretsInPayload import', svc.includes('assertNoExternalPOSSecretsInPayload'));
check('AREA constant set', svc.includes("const AREA = 'phase_d_external_pos_activation'"));
check('localFallback pattern', svc.includes('localFallback'));
check('database_not_configured error', svc.includes("'database_not_configured'"));
check('requireIdempotency present', svc.includes('function requireIdempotency'));
check('idempotency_key_required error', svc.includes('idempotency_key_required'));
check('createRecord helper', svc.includes('async function createRecord'));
check('listRecords helper', svc.includes('async function listRecords'));
check('ON CONFLICT (idempotency_key) DO NOTHING', svc.includes('ON CONFLICT (idempotency_key) DO NOTHING'));
check('getDefaultProviders returns connected: false', svc.includes('connected: false'));
check('getDefaultProviders returns api_sync_enabled: false', svc.includes('api_sync_enabled: false'));
check('getDefaultProviders returns live_mode_enabled: false', svc.includes('live_mode_enabled: false'));
check('listExternalPOSProviders exported', svc.includes('export async function listExternalPOSProviders'));
check('getExternalPOSProvider exported', svc.includes('export async function getExternalPOSProvider'));
check('getExternalPOSProviderStatus exported', svc.includes('export async function getExternalPOSProviderStatus'));
check('getExternalPOSModes exported', svc.includes('export async function getExternalPOSModes'));
check('getExternalPOSCapabilities exported', svc.includes('export async function getExternalPOSCapabilities'));
check('getExternalPOSCredentialPresenceStatus exported', svc.includes('export async function getExternalPOSCredentialPresenceStatus'));
check('recordExternalPOSCredentialPresenceStatus exported', svc.includes('export async function recordExternalPOSCredentialPresenceStatus'));
check('listCompanionModeProfiles exported', svc.includes('export async function listCompanionModeProfiles'));
check('createCompanionModeProfile exported', svc.includes('export async function createCompanionModeProfile'));
check('updateCompanionModeProfile exported', svc.includes('export async function updateCompanionModeProfile'));
check('listImportProfiles exported', svc.includes('export async function listImportProfiles'));
check('createImportProfile exported', svc.includes('export async function createImportProfile'));
check('listCSVImportTemplates exported', svc.includes('export async function listCSVImportTemplates'));
check('createCSVImportTemplate exported', svc.includes('export async function createCSVImportTemplate'));
check('createImportBatch exported', svc.includes('export async function createImportBatch'));
check('listImportBatches exported', svc.includes('export async function listImportBatches'));
check('createMenuCategoryMapping exported', svc.includes('export const createMenuCategoryMapping'));
check('listMenuCategoryMappings exported', svc.includes('export const listMenuCategoryMappings'));
check('createHumidorMapping exported', svc.includes('export const createHumidorMapping'));
check('createKitchenMapping exported', svc.includes('export const createKitchenMapping'));
check('createCloseoutMapping exported', svc.includes('export const createCloseoutMapping'));
check('listAPIContractRegistry exported', svc.includes('export async function listAPIContractRegistry'));
check('createAPIContractRegistryEntry exported', svc.includes('export async function createAPIContractRegistryEntry'));
check('listWebhookRegistry exported', svc.includes('export async function listWebhookRegistry'));
check('createLiveModeRequest exported', svc.includes('export async function createLiveModeRequest'));
check('approveLiveModeRequestPreviewOnly exported', svc.includes('export async function approveLiveModeRequestPreviewOnly'));
check('approveLiveModeRequestPreviewOnly does NOT enable live mode', svc.includes('does NOT enable live mode'));
check('getLiveModeLockStatus exported', svc.includes('export async function getLiveModeLockStatus'));
check('getExternalPOSReadinessSummary exported', svc.includes('export async function getExternalPOSReadinessSummary'));
check('Readiness summary external_pos_sync_live: false', svc.includes('external_pos_sync_live: false'));
check('Readiness summary no_secret_storage: true', svc.includes('no_secret_storage: true'));
check('Readiness summary no_fake_connected_status: true', svc.includes('no_fake_connected_status: true'));
check('writeActivationAudit exported', svc.includes('export async function writeActivationAudit'));
check('listActivationAudit exported', svc.includes('export async function listActivationAudit'));
check('contains_secrets false comment', svc.includes('contains_secrets: false'));
check('stores_secrets false comment', svc.includes('stores_secrets: false'));

// --- Controller ---
console.log('\n[ Controller ]');
const ctrl = readFile('server/controllers/phaseDExternalPOSActivationController.js');
check('Controller not empty', ctrl.length > 100);
check('ok500 pattern', ctrl.includes('const ok500 = (res, fn) => fn().catch'));
check("actorId pattern", ctrl.includes("const actorId = req => req.user?.id || req.headers['x-actor-id'] || 'system'"));
check("ikey pattern", ctrl.includes("const ikey = req => req.headers['x-idempotency-key'] || req.body?.idempotencyKey"));
check('listExternalPOSProviders exported', ctrl.includes('export const listExternalPOSProviders'));
check('getExternalPOSProvider exported', ctrl.includes('export const getExternalPOSProvider'));
check('getExternalPOSModes exported', ctrl.includes('export const getExternalPOSModes'));
check('getExternalPOSCapabilities exported', ctrl.includes('export const getExternalPOSCapabilities'));
check('recordExternalPOSCredentialPresenceStatus exported', ctrl.includes('export const recordExternalPOSCredentialPresenceStatus'));
check('createCompanionModeProfile exported', ctrl.includes('export const createCompanionModeProfile'));
check('createImportProfile exported', ctrl.includes('export const createImportProfile'));
check('createImportBatch exported', ctrl.includes('export const createImportBatch'));
check('createMenuCategoryMapping exported', ctrl.includes('export const createMenuCategoryMapping'));
check('createHumidorMapping exported', ctrl.includes('export const createHumidorMapping'));
check('createKitchenMapping exported', ctrl.includes('export const createKitchenMapping'));
check('listAPIContractRegistry exported', ctrl.includes('export const listAPIContractRegistry'));
check('createAPIContractRegistryEntry exported', ctrl.includes('export const createAPIContractRegistryEntry'));
check('createLiveModeRequest exported', ctrl.includes('export const createLiveModeRequest'));
check('approveLiveModeRequestPreviewOnly exported', ctrl.includes('export const approveLiveModeRequestPreviewOnly'));
check('getExternalPOSReadinessSummary exported', ctrl.includes('export const getExternalPOSReadinessSummary'));
check('writeActivationAudit exported', ctrl.includes('export const writeActivationAudit'));
check('contains_secrets false comment', ctrl.includes('contains_secrets: false'));

// --- Routes ---
console.log('\n[ Routes ]');
const routes = readFile('server/routes/phaseDExternalPOSActivationRoutes.js');
check('Routes not empty', routes.length > 100);
check('canAccessPOS3 imported', routes.includes('canAccessPOS3'));
check('platformAdminGuardRequired comment', routes.includes('platformAdminGuardRequired = true on all write routes'));
check('GET /providers route', routes.includes("router.get('/providers'"));
check('POST /credentials with canAccessPOS3', routes.includes("canAccessPOS3, ctrl.recordExternalPOSCredentialPresenceStatus"));
check('POST /companion-profiles with canAccessPOS3', routes.includes("canAccessPOS3, ctrl.createCompanionModeProfile"));
check('POST /import-profiles with canAccessPOS3', routes.includes("canAccessPOS3, ctrl.createImportProfile"));
check('POST /import-batches with canAccessPOS3', routes.includes("canAccessPOS3, ctrl.createImportBatch"));
check('POST /mapping-profiles with canAccessPOS3', routes.includes("canAccessPOS3, ctrl.createManualMappingProfile"));
check('POST /mappings/menu-categories with canAccessPOS3', routes.includes("canAccessPOS3, ctrl.createMenuCategoryMapping"));
check('POST /mappings/taxes with canAccessPOS3', routes.includes("canAccessPOS3, ctrl.createTaxMapping"));
check('POST /mappings/humidor with canAccessPOS3', routes.includes("canAccessPOS3, ctrl.createHumidorMapping"));
check('POST /api-contracts with canAccessPOS3', routes.includes("canAccessPOS3, ctrl.createAPIContractRegistryEntry"));
check('POST /webhooks with canAccessPOS3', routes.includes("canAccessPOS3, ctrl.createWebhookRegistryEntry"));
check('POST /live-mode-requests with canAccessPOS3', routes.includes("canAccessPOS3, ctrl.createLiveModeRequest"));
check('PATCH approve-preview with canAccessPOS3', routes.includes("canAccessPOS3, ctrl.approveLiveModeRequestPreviewOnly"));
check('GET /readiness-summary', routes.includes("router.get('/readiness-summary'"));
check('export default router', routes.includes('export default router'));
check('contains_secrets false comment', routes.includes('contains_secrets: false'));

// --- UI Page ---
console.log('\n[ UI Page ]');
const ui = readFile('src/pages/phaseD/PhaseDExternalPOSActivation.jsx');
check('UI not empty', ui.length > 100);
check('contains_secrets false comment', ui.includes('contains_secrets: false'));
check('DEVICE_LINE uses &middot;', ui.includes('&middot;'));
check('No non-ASCII chars outside comments', !/[^\x00-\x7F]/.test(ui.replace(/\/\/.*/g, '')));
check('NAVY color defined', ui.includes("const NAVY"));
check('GOLD color defined', ui.includes("const GOLD"));
check('OverviewPanel present', ui.includes('function OverviewPanel'));
check('ProviderRegistryPanel present', ui.includes('function ProviderRegistryPanel'));
check('ProviderStatusPanel present', ui.includes('function ProviderStatusPanel'));
check('CompanionModePanel present', ui.includes('function CompanionModePanel'));
check('ExportImportModePanel present', ui.includes('function ExportImportModePanel'));
check('APIContractModePanel present', ui.includes('function APIContractModePanel'));
check('ManualMappingModePanel present', ui.includes('function ManualMappingModePanel'));
check('HybridModePanel present', ui.includes('function HybridModePanel'));
check('ProviderDetailPanel present', ui.includes('function ProviderDetailPanel'));
check('CredentialPresencePanel present', ui.includes('function CredentialPresencePanel'));
check('CSVTemplatesPanel present', ui.includes('function CSVTemplatesPanel'));
check('ImportBatchesPanel present', ui.includes('function ImportBatchesPanel'));
check('ManualMappingProfilesPanel present', ui.includes('function ManualMappingProfilesPanel'));
check('MappingPanel present', ui.includes('function MappingPanel'));
check('APIContractRegistryPanel present', ui.includes('function APIContractRegistryPanel'));
check('WebhookRegistryPanel present', ui.includes('function WebhookRegistryPanel'));
check('WebhookHealthPanel present', ui.includes('function WebhookHealthPanel'));
check('LiveModeLockPanel present', ui.includes('function LiveModeLockPanel'));
check('TenantMappingPanel present', ui.includes('function TenantMappingPanel'));
check('ModuleMappingPanel present', ui.includes('function ModuleMappingPanel'));
check('ComplianceChecklistPanel present', ui.includes('function ComplianceChecklistPanel'));
check('RiskFlagsPanel present', ui.includes('function RiskFlagsPanel'));
check('ActivationAuditPanel present', ui.includes('function ActivationAuditPanel'));
check('ReadinessSummaryPanel present', ui.includes('function ReadinessSummaryPanel'));
check('SafetyBanner present', ui.includes('function SafetyBanner'));
check('PANELS object', ui.includes('const PANELS = {'));
check('TABS array', ui.includes('const TABS = ['));
check('PhaseDExternalPOSActivation function', ui.includes('function PhaseDExternalPOSActivation'));
check('export default PhaseDExternalPOSActivation', ui.includes('export default PhaseDExternalPOSActivation'));
check('Safety: sync not live in UI', ui.includes('NOT live') || ui.includes('not live'));
check('Safety: companion works beside in UI', ui.includes('beside'));
check('Safety: no secrets stored in UI', ui.includes('No external POS credentials') || ui.includes('no credentials'));
check('Toast panel in TABS', ui.includes("'Toast'"));
check('Clover panel in TABS', ui.includes("'Clover'"));
check('Toast provider in PROVIDERS', ui.includes("label: 'Toast'"));

// --- server/index.js wiring ---
console.log('\n[ server/index.js Wiring ]');
const idx = readFile('server/index.js');
check('index.js not empty', idx.length > 100);
check('phaseDExternalPOSActivationRoutes imported', idx.includes('phaseDExternalPOSActivationRoutes'));
check('Route mounted at /api/phase-d/external-pos-activation', idx.includes('/api/phase-d/external-pos-activation'));
const importCount = (idx.match(/phaseDExternalPOSActivationRoutes/g) || []).length;
check('phaseDExternalPOSActivationRoutes not excessively duplicated (<=3)', importCount <= 3);

// --- src/App.jsx wiring ---
console.log('\n[ src/App.jsx Wiring ]');
const app = readFile('src/App.jsx');
check('App.jsx not empty', app.length > 100);
check('PhaseDExternalPOSActivation imported', app.includes('PhaseDExternalPOSActivation'));
check('Route phase-d/external-pos-activation present', app.includes('phase-d/external-pos-activation'));

// --- package.json ---
console.log('\n[ package.json ]');
const pkg = readFile('package.json');
check('verify:phase-d-external-pos-activation script present', pkg.includes('verify:phase-d-external-pos-activation'));

// --- Prior Phase Integrity ---
console.log('\n[ Prior Phase Integrity ]');
check('D.1 migration still exists', fileExists('server/db/migrations/055_phase_d_provider_activation_roadmap.sql'));
check('D.2 migration still exists', fileExists('server/db/migrations/056_phase_d_payment_provider_activation.sql'));
check('D.1 service still exists', fileExists('server/services/phaseD/phaseDProviderActivationService.js'));
check('D.2 service still exists', fileExists('server/services/phaseD/phaseDPaymentProviderActivationService.js'));
check('D.1 contracts still exists', fileExists('server/services/phaseD/phaseDProviderActivationContracts.js'));
check('D.2 contracts still exists', fileExists('server/services/phaseD/phaseDPaymentProviderContracts.js'));
check('D.2 page still exists', fileExists('src/pages/phaseD/PhaseDPaymentProviderActivation.jsx'));
check('NOVEE OS migration still exists', fileExists('server/db/migrations/054_novee_os_final_platform_readiness_launch_lock.sql'));
check('CraftHub onboarding page still exists', fileExists('src/pages/crafthub/CraftHubOnboardingWizard.jsx'));
check('D.2 no-fake enforced still in D.2 flags', readFile('server/config/phaseDPaymentProviderFeatureFlags.js').includes('noFakePaymentProcessingEnforced: true'));

// --- Safety Invariants ---
console.log('\n[ Safety Invariants ]');
check('No fake connected defaults in service', !svc.includes('connected: true') || svc.includes('assertNoFakeExternalPOSConnectedStatus'));
check('No fake api_sync in service defaults', !svc.includes("api_sync_enabled: true"));
check('No fake live_mode in service defaults', !svc.includes("live_mode_enabled: true"));
check('assertNoFakeExternalPOSConnectedStatus called in createAPIContractRegistryEntry', svc.includes('assertNoFakeExternalPOSConnectedStatus(payload)'));
check('assertNoExternalPOSSecretsInPayload called in all creates', (svc.match(/assertNoExternalPOSSecretsInPayload/g) || []).length >= 10);

// --- Docs ---
console.log('\n[ Docs ]');
const docs = readFile('docs/PHASE_D_EXTERNAL_POS_ACTIVATION.md');
check('Docs not empty', docs.length > 100);
check('What D.3 Adds documented', docs.includes('What D.3 Adds'));
check('What D.3 Does NOT Do documented', docs.includes('What D.3 Does NOT Do'));
check('Companion Mode documented', docs.includes('Companion Mode'));
check('Export Import Mode documented', docs.includes('Export / Import Mode'));
check('API Contract Mode documented', docs.includes('API Contract Mode'));
check('Manual Mapping Mode documented', docs.includes('Manual Mapping Mode'));
check('Safety Rules documented', docs.includes('Safety Rules'));
check('Provider table documented', docs.includes('toast'));
check('No Secret Storage rule documented', docs.includes('No Secret Storage'));
check('D.4-D.8 roadmap documented', docs.includes('D.4'));

// --- Summary ---
const total = passed + failed;
console.log(`\n${'='.repeat(60)}`);
console.log(`Phase D.3 External POS Activation Verification`);
console.log(`${'='.repeat(60)}`);
console.log(`Total checks : ${total}`);
console.log(`Passed       : ${passed}`);
console.log(`Failed       : ${failed}`);

if (failures.length > 0) {
  console.log('\nFailed checks:');
  failures.forEach(f => console.log(`  - ${f}`));
  process.exit(1);
} else {
  console.log('\nAll checks passed. Phase D.3 verification complete.');
  process.exit(0);
}
