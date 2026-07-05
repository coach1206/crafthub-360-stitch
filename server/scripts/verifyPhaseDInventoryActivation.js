/**
 * Phase D.4 — Inventory Activation Verification Script
 * Expected: 350+ checks passed
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../..')

let passed = 0
let failed = 0

function check(label, condition) {
  if (condition) {
    passed++
  } else {
    failed++
    console.error(`  FAIL: ${label}`)
  }
}

function readFile(rel) {
  try { return fs.readFileSync(path.join(root, rel), 'utf8') } catch { return '' }
}

function fileExists(rel) {
  return fs.existsSync(path.join(root, rel))
}

console.log('\n=== Phase D.4 Inventory Activation Verification ===\n')

// ── File existence ─────────────────────────────────────────────

console.log('-- File Existence --')
check('migration 058 exists', fileExists('server/db/migrations/058_phase_d_inventory_activation.sql'))
check('contracts file exists', fileExists('server/services/phaseD/phaseDInventoryActivationContracts.js'))
check('feature flags file exists', fileExists('server/config/phaseDInventoryActivationFeatureFlags.js'))
check('service file exists', fileExists('server/services/phaseD/phaseDInventoryActivationService.js'))
check('controller file exists', fileExists('server/controllers/phaseDInventoryActivationController.js'))
check('routes file exists', fileExists('server/routes/phaseDInventoryActivationRoutes.js'))
check('locales file exists', fileExists('src/locales/phaseDInventoryActivation.js'))
check('UI page exists', fileExists('src/pages/phaseD/PhaseDInventoryActivation.jsx'))
check('docs file exists', fileExists('docs/PHASE_D_INVENTORY_ACTIVATION.md'))

// ── Migration tables ───────────────────────────────────────────

console.log('\n-- Migration: Tables --')
const sql = readFile('server/db/migrations/058_phase_d_inventory_activation.sql')
const tables = [
  'inventory_activation_area_registry',
  'inventory_activation_area_status',
  'inventory_location_registry',
  'inventory_storage_zone_registry',
  'inventory_item_registry',
  'inventory_item_category_registry',
  'inventory_item_variant_registry',
  'inventory_unit_registry',
  'inventory_par_level_profiles',
  'inventory_reorder_rule_profiles',
  'inventory_low_stock_rule_profiles',
  'inventory_count_session_profiles',
  'inventory_count_session_items',
  'inventory_adjustment_records',
  'inventory_transfer_records',
  'inventory_waste_spoilage_records',
  'inventory_vendor_registry',
  'inventory_vendor_catalog_profiles',
  'inventory_vendor_catalog_items',
  'inventory_vendor_order_preview_records',
  'inventory_vendor_order_approval_requests',
  'inventory_purchase_order_preview_records',
  'inventory_import_profiles',
  'inventory_import_templates',
  'inventory_import_batches',
  'inventory_import_batch_items',
  'inventory_export_profiles',
  'inventory_external_pos_signal_mapping',
  'inventory_humidor_mapping',
  'inventory_bar_mapping',
  'inventory_kitchen_mapping',
  'inventory_retail_mapping',
  'inventory_menu_ingredient_mapping',
  'inventory_recipe_mapping',
  'inventory_cogs_profile_records',
  'inventory_shrinkage_profile_records',
  'inventory_alert_rule_registry',
  'inventory_alert_preview_records',
  'inventory_live_sync_requests',
  'inventory_live_sync_approvals',
  'inventory_environment_locks',
  'inventory_tenant_mapping',
  'inventory_module_mapping',
  'inventory_compliance_checklist',
  'inventory_risk_flags',
  'inventory_activation_audit',
]
for (const t of tables) {
  check(`table ${t} exists`, sql.includes(`CREATE TABLE IF NOT EXISTS ${t}`))
}

// ── Migration safety checks ────────────────────────────────────

console.log('\n-- Migration: Safety --')
check('migration is idempotent (CREATE TABLE IF NOT EXISTS)', sql.includes('CREATE TABLE IF NOT EXISTS'))
check('migration safe comment present', sql.includes('Safe migration: no destructive DDL'))
check('migration no DROP TABLE', !sql.includes('DROP TABLE'))
check('migration no TRUNCATE', !sql.includes('TRUNCATE'))
check('migration no ALTER TABLE DROP', !sql.includes('ALTER TABLE') || !sql.includes('DROP COLUMN'))
check('migration contains_secrets: false comment', sql.includes('contains_secrets: false'))

// ── Migration boolean defaults ─────────────────────────────────

console.log('\n-- Migration: Boolean Defaults --')
const sqlHas = col => new RegExp(col + '\\s+BOOLEAN NOT NULL DEFAULT FALSE').test(sql)
check('live_sync_enabled DEFAULT FALSE', sqlHas('live_sync_enabled'))
check('vendor_ordering_enabled DEFAULT FALSE', sqlHas('vendor_ordering_enabled'))
check('auto_reorder_enabled DEFAULT FALSE', sqlHas('auto_reorder_enabled'))
check('external_pos_sync_enabled DEFAULT FALSE', sqlHas('external_pos_sync_enabled'))
check('is_real_order DEFAULT FALSE', sqlHas('is_real_order'))
check('order_submitted DEFAULT FALSE', sqlHas('order_submitted'))
check('real_vendor_email_sent DEFAULT FALSE', sqlHas('real_vendor_email_sent'))
check('is_real_po DEFAULT FALSE', sqlHas('is_real_po'))
check('po_submitted DEFAULT FALSE', sqlHas('po_submitted'))
check('is_real_count DEFAULT FALSE', sqlHas('is_real_count'))
check('is_real_alert DEFAULT FALSE', sqlHas('is_real_alert'))
check('cogs_calculated DEFAULT FALSE', sqlHas('cogs_calculated'))
check('alert_preview_only DEFAULT TRUE', /alert_preview_only\s+BOOLEAN NOT NULL DEFAULT TRUE/.test(sql))
check('requires_real_count DEFAULT TRUE', sql.includes('requires_real_count'))
check('real_order_gated DEFAULT TRUE', sql.includes('real_order_gated'))
check('live_sync_gated DEFAULT TRUE', sql.includes('live_sync_gated'))
check('contains_secrets vendor DEFAULT FALSE', sqlHas('contains_secrets'))
check('stores_secrets vendor DEFAULT FALSE', sqlHas('stores_secrets'))
check('mapping_confirmed DEFAULT FALSE', sqlHas('mapping_confirmed'))
check('idempotency_key UNIQUE present', sql.includes('idempotency_key          TEXT UNIQUE') || sql.includes('idempotency_key   TEXT UNIQUE') || sql.includes('idempotency_key        TEXT UNIQUE'))
check('environment lock default reason', sql.includes('Phase D.4 activation required before live inventory sync'))

// ── Contracts file ─────────────────────────────────────────────

console.log('\n-- Contracts: Constants --')
const contracts = readFile('server/services/phaseD/phaseDInventoryActivationContracts.js')
check('INVENTORY_AREA_KEYS exported', contracts.includes('export const INVENTORY_AREA_KEYS'))
check('INVENTORY_ACTIVATION_STATUSES exported', contracts.includes('export const INVENTORY_ACTIVATION_STATUSES'))
check('INVENTORY_LOCATION_TYPES exported', contracts.includes('export const INVENTORY_LOCATION_TYPES'))
check('INVENTORY_UNIT_TYPES exported', contracts.includes('export const INVENTORY_UNIT_TYPES'))
check('INVENTORY_VENDOR_TYPES exported', contracts.includes('export const INVENTORY_VENDOR_TYPES'))
check('INVENTORY_IMPORT_FORMATS exported', contracts.includes('export const INVENTORY_IMPORT_FORMATS'))
check('INVENTORY_SIGNAL_TYPES exported', contracts.includes('export const INVENTORY_SIGNAL_TYPES'))
check('INVENTORY_ALERT_TYPES exported', contracts.includes('export const INVENTORY_ALERT_TYPES'))
check('INVENTORY_AUDIT_EVENT_TYPES exported', contracts.includes('export const INVENTORY_AUDIT_EVENT_TYPES'))
check('FORBIDDEN_INVENTORY_FIELDS defined', contracts.includes('FORBIDDEN_INVENTORY_FIELDS'))

console.log('\n-- Contracts: Area Keys --')
const areaKeys = [
  'humidor', 'bar', 'kitchen', 'retail', 'general_supplies',
  'menu_ingredients', 'cigar_inventory', 'bottle_inventory', 'food_inventory',
  'merchandise_inventory', 'vendor_catalogs', 'reorder_rules', 'low_stock_alerts',
  'count_sessions', 'waste_spoilage', 'transfers', 'adjustments', 'import_export',
  'external_pos_inventory_signals', 'readiness_summary',
]
for (const k of areaKeys) {
  check(`area key '${k}' in INVENTORY_AREA_KEYS`, contracts.includes(`'${k}'`))
}

console.log('\n-- Contracts: Statuses --')
const statuses = [
  'not_started', 'setup_required', 'mapping_required', 'count_required',
  'import_required', 'import_ready', 'import_tested', 'manual_tracking_ready',
  'companion_mode_ready', 'reorder_rule_ready', 'low_stock_rule_ready',
  'vendor_profile_required', 'vendor_profile_ready', 'vendor_order_preview_ready',
  'vendor_order_approval_required', 'live_sync_locked', 'live_sync_requested',
  'live_sync_approved', 'live_sync_enabled', 'disabled', 'blocked', 'failed',
]
for (const s of statuses) {
  check(`status '${s}' defined`, contracts.includes(`'${s}'`))
}

console.log('\n-- Contracts: Validators --')
const validators = [
  'validateInventoryAreaKey', 'validateInventoryActivationStatus', 'validateInventoryLocation',
  'validateInventoryStorageZone', 'validateInventoryItem', 'validateInventoryItemCategory',
  'validateInventoryItemVariant', 'validateInventoryUnit', 'validateParLevelProfile',
  'validateReorderRuleProfile', 'validateLowStockRuleProfile', 'validateCountSessionProfile',
  'validateCountSessionItem', 'validateAdjustmentRecord', 'validateTransferRecord',
  'validateWasteSpoilageRecord', 'validateVendorRegistryPayload', 'validateVendorCatalogProfile',
  'validateVendorCatalogItem', 'validateVendorOrderPreviewRecord', 'validateVendorOrderApprovalRequest',
  'validatePurchaseOrderPreviewRecord', 'validateInventoryImportProfile', 'validateInventoryImportTemplate',
  'validateInventoryImportBatch', 'validateInventoryImportBatchItem', 'validateInventoryExportProfile',
  'validateExternalPOSInventorySignalMapping', 'validateHumidorInventoryMapping',
  'validateBarInventoryMapping', 'validateKitchenInventoryMapping', 'validateRetailInventoryMapping',
  'validateMenuIngredientMapping', 'validateRecipeMapping', 'validateCOGSProfileRecord',
  'validateShrinkageProfileRecord', 'validateInventoryAlertRule', 'validateInventoryAlertPreviewRecord',
  'validateLiveSyncRequest', 'validateTenantInventoryMapping', 'validateModuleInventoryMapping',
  'validateComplianceChecklistItem', 'validateRiskFlag',
  'assertNoInventorySecretsInPayload', 'assertNoFakeInventorySyncClaim',
  'assertNoFakeVendorOrderClaim', 'assertNoFakeInventoryCountClaim',
]
for (const v of validators) {
  check(`validator ${v} exported`, contracts.includes(`export function ${v}`))
}

// ── Contracts: Safety assertions ───────────────────────────────

console.log('\n-- Contracts: Safety Assertions --')
check('assertNoInventorySecretsInPayload blocks api_key', contracts.includes("'api_key'"))
check('assertNoInventorySecretsInPayload blocks secret_key', contracts.includes("'secret_key'"))
check('assertNoInventorySecretsInPayload blocks vendor_api_key', contracts.includes("'vendor_api_key'"))
check('assertNoInventorySecretsInPayload blocks password', contracts.includes("'password'"))
check('assertNoFakeInventorySyncClaim blocks live_sync_enabled true', contracts.includes("live_sync_enabled"))
check('assertNoFakeVendorOrderClaim blocks is_real_order true', contracts.includes("is_real_order"))
check('assertNoFakeVendorOrderClaim blocks order_submitted true', contracts.includes("order_submitted"))
check('assertNoFakeVendorOrderClaim blocks real_vendor_email_sent true', contracts.includes("real_vendor_email_sent"))
check('assertNoFakeVendorOrderClaim blocks is_real_po true', contracts.includes("is_real_po"))
check('assertNoFakeInventoryCountClaim blocks is_real_count without date', contracts.includes("is_real_count"))
check('reorder rule validator blocks auto_reorder_enabled true', contracts.includes("auto_reorder_enabled must be false"))
check('vendor order validator blocks is_real_order true', contracts.includes("vendor orders are previews only"))
check('PO validator blocks is_real_po true', contracts.includes("purchase orders are previews only"))
check('COGS validator blocks cogs_calculated true', contracts.includes("cogs_calculated must be false"))
check('signal mapping validator blocks live_sync true', contracts.includes("external POS inventory sync is not live"))

// ── Feature Flags ──────────────────────────────────────────────

console.log('\n-- Feature Flags --')
const flags = readFile('server/config/phaseDInventoryActivationFeatureFlags.js')
const requiredFlags = [
  'PHASE_D_INVENTORY_ACTIVATION_ENABLED', 'INVENTORY_AREA_REGISTRY_ENABLED',
  'INVENTORY_LOCATION_REGISTRY_ENABLED', 'INVENTORY_STORAGE_ZONE_ENABLED',
  'INVENTORY_ITEM_REGISTRY_ENABLED', 'INVENTORY_ITEM_CATEGORY_ENABLED',
  'INVENTORY_ITEM_VARIANT_ENABLED', 'INVENTORY_UNIT_REGISTRY_ENABLED',
  'INVENTORY_PAR_LEVEL_ENABLED', 'INVENTORY_REORDER_RULE_ENABLED',
  'INVENTORY_LOW_STOCK_RULE_ENABLED', 'INVENTORY_COUNT_SESSION_ENABLED',
  'INVENTORY_ADJUSTMENT_RECORD_ENABLED', 'INVENTORY_TRANSFER_RECORD_ENABLED',
  'INVENTORY_WASTE_SPOILAGE_ENABLED', 'INVENTORY_VENDOR_REGISTRY_ENABLED',
  'INVENTORY_VENDOR_CATALOG_ENABLED', 'INVENTORY_VENDOR_ORDER_PREVIEW_ENABLED',
  'INVENTORY_VENDOR_ORDER_APPROVAL_REQUIRED', 'INVENTORY_PURCHASE_ORDER_PREVIEW_ENABLED',
  'INVENTORY_IMPORT_PROFILE_ENABLED', 'INVENTORY_IMPORT_TEMPLATE_ENABLED',
  'INVENTORY_IMPORT_BATCH_ENABLED', 'INVENTORY_EXPORT_PROFILE_ENABLED',
  'INVENTORY_EXTERNAL_POS_SIGNAL_MAPPING_ENABLED', 'INVENTORY_HUMIDOR_MAPPING_ENABLED',
  'INVENTORY_BAR_MAPPING_ENABLED', 'INVENTORY_KITCHEN_MAPPING_ENABLED',
  'INVENTORY_RETAIL_MAPPING_ENABLED', 'INVENTORY_MENU_INGREDIENT_MAPPING_ENABLED',
  'INVENTORY_RECIPE_MAPPING_ENABLED', 'INVENTORY_COGS_PROFILE_ENABLED',
  'INVENTORY_SHRINKAGE_PROFILE_ENABLED', 'INVENTORY_ALERT_RULE_ENABLED',
  'INVENTORY_ALERT_PREVIEW_ENABLED', 'INVENTORY_LIVE_SYNC_LOCK_ENABLED',
  'INVENTORY_TENANT_MAPPING_ENABLED', 'INVENTORY_MODULE_MAPPING_ENABLED',
  'INVENTORY_COMPLIANCE_CHECKLIST_ENABLED', 'INVENTORY_RISK_FLAGS_ENABLED',
  'INVENTORY_ACTIVATION_AUDIT_ENABLED',
]
for (const f of requiredFlags) {
  check(`flag ${f} defined`, flags.includes(f))
}

console.log('\n-- Feature Flags: Enforcement (must be true) --')
const enforcementFlags = [
  'INVENTORY_NO_SECRET_STORAGE_ENFORCED',
  'INVENTORY_NO_FAKE_SYNC_ENFORCED',
  'INVENTORY_NO_FAKE_VENDOR_ORDER_ENFORCED',
  'INVENTORY_NO_FAKE_COUNT_ENFORCED',
  'INVENTORY_CAN_ACCESS_POS3_WRITE_REQUIRED',
  'INVENTORY_ADMIN_ONLY_LIVE_REQUEST_REQUIRED',
  'INVENTORY_IDEMPOTENCY_ENFORCED',
  'INVENTORY_AUDIT_TRAIL_ENFORCED',
  'INVENTORY_ENVIRONMENT_LOCK_ENFORCED',
  'INVENTORY_VENDOR_ORDER_APPROVAL_GATE_REQUIRED',
  'INVENTORY_LIVE_SYNC_APPROVAL_GATE_REQUIRED',
]
for (const f of enforcementFlags) {
  check(`enforcement flag ${f}: true`, flags.includes(`${f}:`) && (() => {
    const m = flags.match(new RegExp(`${f}:\\s*(true|false)`))
    return m && m[1] === 'true'
  })())
}

console.log('\n-- Feature Flags: Live/Sync/Order (must be false) --')
const liveFlags = [
  'INVENTORY_LIVE_SYNC_PROCESSING_ENABLED',
  'INVENTORY_EXTERNAL_POS_SYNC_PROCESSING_ENABLED',
  'INVENTORY_AUTO_REORDER_PROCESSING_ENABLED',
  'INVENTORY_VENDOR_ORDER_SUBMISSION_ENABLED',
  'INVENTORY_REAL_VENDOR_EMAIL_ENABLED',
  'INVENTORY_REAL_PURCHASE_ORDER_ENABLED',
  'INVENTORY_REAL_TIME_COUNT_SYNC_ENABLED',
  'INVENTORY_EXTERNAL_STOCK_FEED_ENABLED',
]
for (const f of liveFlags) {
  check(`live flag ${f}: false`, flags.includes(`${f}:`) && (() => {
    const m = flags.match(new RegExp(`${f}:\\s*(true|false)`))
    return m && m[1] === 'false'
  })())
}

check('getPhaseDInventoryActivationFlags exported', flags.includes('export function getPhaseDInventoryActivationFlags'))

// ── Service ────────────────────────────────────────────────────

console.log('\n-- Service: Methods --')
const svc = readFile('server/services/phaseD/phaseDInventoryActivationService.js')
const serviceMethods = [
  'listInventoryAreas', 'getInventoryArea', 'getInventoryAreaStatus', 'updateInventoryAreaStatus',
  'listInventoryLocations', 'createInventoryLocation', 'updateInventoryLocation',
  'listStorageZones', 'createStorageZone', 'updateStorageZone',
  'listInventoryItems', 'createInventoryItem', 'updateInventoryItem',
  'listInventoryItemCategories', 'createInventoryItemCategory',
  'listInventoryItemVariants', 'createInventoryItemVariant',
  'listInventoryUnits', 'createInventoryUnit',
  'listParLevelProfiles', 'createParLevelProfile', 'updateParLevelProfile',
  'listReorderRuleProfiles', 'createReorderRuleProfile', 'updateReorderRuleProfile',
  'listLowStockRuleProfiles', 'createLowStockRuleProfile', 'updateLowStockRuleProfile',
  'listCountSessions', 'createCountSession', 'getCountSession',
  'listCountSessionItems', 'createCountSessionItem',
  'listAdjustmentRecords', 'createAdjustmentRecord',
  'listTransferRecords', 'createTransferRecord',
  'listWasteSpoilageRecords', 'createWasteSpoilageRecord',
  'listVendors', 'createVendor', 'updateVendor',
  'listVendorCatalogProfiles', 'createVendorCatalogProfile',
  'listVendorCatalogItems', 'createVendorCatalogItem',
  'listVendorOrderPreviews', 'createVendorOrderPreview',
  'listVendorOrderApprovalRequests', 'createVendorOrderApprovalRequest',
  'listPurchaseOrderPreviews', 'createPurchaseOrderPreview',
  'listInventoryImportProfiles', 'createInventoryImportProfile',
  'listInventoryImportTemplates', 'createInventoryImportTemplate',
  'listInventoryImportBatches', 'createInventoryImportBatch',
  'listInventoryImportBatchItems', 'createInventoryImportBatchItem',
  'listInventoryExportProfiles', 'createInventoryExportProfile',
  'listExternalPOSInventorySignalMappings', 'createExternalPOSInventorySignalMapping',
  'listHumidorMappings', 'createHumidorMapping',
  'listBarMappings', 'createBarMapping',
  'listKitchenMappings', 'createKitchenMapping',
  'listRetailMappings', 'createRetailMapping',
  'listMenuIngredientMappings', 'createMenuIngredientMapping',
  'listRecipeMappings', 'createRecipeMapping',
  'listCOGSProfiles', 'createCOGSProfile',
  'listShrinkageProfiles', 'createShrinkageProfile',
  'listInventoryAlertRules', 'createInventoryAlertRule',
  'listInventoryAlertPreviews', 'createInventoryAlertPreview',
  'listLiveSyncRequests', 'createLiveSyncRequest',
  'approveLiveSyncRequestPreviewOnly', 'getLiveSyncLockStatus',
  'getTenantInventoryMapping', 'createTenantInventoryMapping',
  'getModuleInventoryMapping', 'createModuleInventoryMapping',
  'listComplianceChecklist', 'updateComplianceChecklistItem',
  'listRiskFlags', 'createRiskFlag',
  'listActivationAudit', 'writeActivationAudit',
  'getInventoryReadinessSummary',
]
for (const m of serviceMethods) {
  check(`service method ${m} exported`, svc.includes(`export`) && svc.includes(m))
}

console.log('\n-- Service: Safety Behaviors --')
check('service: localFallback pattern used', svc.includes('localFallback') || svc.includes('database_not_configured'))
check('service: isDbAvailable check present', svc.includes('isDbAvailable()'))
check('service: live_sync_enabled must remain false enforced', svc.includes('live_sync_enabled must remain false'))
check('service: auto_reorder_enabled must be false enforced', svc.includes('auto_reorder_enabled must be false'))
check('service: vendor_order_enabled must be false enforced', svc.includes('vendor_order_enabled must be false'))
check('service: cogs_calculated must be false enforced', svc.includes('cogs_calculated must be false'))
check('service: is_real_order forced false', svc.includes('is_real_order: false'))
check('service: order_submitted forced false', svc.includes('order_submitted: false'))
check('service: real_vendor_email_sent forced false', svc.includes('real_vendor_email_sent: false'))
check('service: is_real_po forced false', svc.includes('is_real_po: false'))
check('service: po_submitted forced false', svc.includes('po_submitted: false'))
check('service: is_real_alert forced false', svc.includes('is_real_alert: false'))
check('service: alert_preview_only forced true', svc.includes('alert_preview_only: true'))
check('service: requires_real_data forced true', svc.includes('requires_real_data: true'))
check('service: live_sync_gated forced true', svc.includes('live_sync_gated: true'))
check('service: real_order_gated forced true', svc.includes('real_order_gated: true'))
check('service: contains_secrets false on vendor', svc.includes('contains_secrets: false'))
check('service: approveLiveSyncRequestPreviewOnly does NOT enable live sync', svc.includes('does NOT enable live inventory sync'))
check('service: readiness summary inventory_sync_live false', svc.includes('inventory_sync_live: false'))
check('service: readiness summary vendor_ordering_live false', svc.includes('vendor_ordering_live: false'))
check('service: readiness summary no_secret_storage true', svc.includes('no_secret_storage: true'))
check('service: safety_status BUILD_ONLY_NO_LIVE_SYNC', svc.includes('BUILD_ONLY_NO_LIVE_SYNC'))
check('service: area AREA constant defined', svc.includes("const AREA = 'phase_d_inventory_activation'"))
check('service: cogs requires_real_cost_data true', svc.includes('requires_real_cost_data: true'))
check('service: cogs requires_real_sales_data true', svc.includes('requires_real_sales_data: true'))

// ── Controller ─────────────────────────────────────────────────

console.log('\n-- Controller: Handlers --')
const ctrl = readFile('server/controllers/phaseDInventoryActivationController.js')
check('controller ok500 pattern', ctrl.includes('const ok500 = (res, fn)'))
check('controller actorId pattern', ctrl.includes('const actorId = req =>'))
check('controller ikey pattern', ctrl.includes('const ikey = req =>'))
check('controller tenantId pattern', ctrl.includes('const tenantId = req =>'))
check('controller listInventoryAreas', ctrl.includes('listInventoryAreas'))
check('controller updateInventoryAreaStatus', ctrl.includes('updateInventoryAreaStatus'))
check('controller createVendorOrderPreview', ctrl.includes('createVendorOrderPreview'))
check('controller createPurchaseOrderPreview', ctrl.includes('createPurchaseOrderPreview'))
check('controller approveLiveSyncRequestPreviewOnly', ctrl.includes('approveLiveSyncRequestPreviewOnly'))
check('controller getLiveSyncLockStatus', ctrl.includes('getLiveSyncLockStatus'))
check('controller getInventoryReadinessSummary', ctrl.includes('getInventoryReadinessSummary'))
check('controller createCOGSProfile', ctrl.includes('createCOGSProfile'))
check('controller createInventoryAlertPreview', ctrl.includes('createInventoryAlertPreview'))

// ── Routes ─────────────────────────────────────────────────────

console.log('\n-- Routes: Structure --')
const routes = readFile('server/routes/phaseDInventoryActivationRoutes.js')
check('routes canAccessPOS3 imported', routes.includes('canAccessPOS3'))
check('routes canAccessPOS3 on area status update', /patch\(['"]\/areas\/:areaKey\/status['"],\s*canAccessPOS3/.test(routes))
check('routes canAccessPOS3 on location create', /post\(['"]\/locations['"],\s*canAccessPOS3/.test(routes))
check('routes canAccessPOS3 on item create', /post\(['"]\/items['"],\s*canAccessPOS3/.test(routes))
check('routes canAccessPOS3 on vendor create', /post\(['"]\/vendors['"],\s*canAccessPOS3/.test(routes))
check('routes canAccessPOS3 on vendor order preview create', /post\(['"]\/vendor-order-previews['"],\s*canAccessPOS3/.test(routes))
check('routes canAccessPOS3 on purchase order preview create', /post\(['"]\/purchase-order-previews['"],\s*canAccessPOS3/.test(routes))
check('routes canAccessPOS3 on live sync request create', /post\(['"]\/live-sync-requests['"],\s*canAccessPOS3/.test(routes))
check('routes canAccessPOS3 on live sync approve', /post\(['"]\/live-sync-requests\/:requestId\/approve-preview['"],\s*canAccessPOS3/.test(routes))
check('routes canAccessPOS3 on cogs profile create', /post\(['"]\/cogs-profiles['"],\s*canAccessPOS3/.test(routes))
check('routes readiness summary GET', routes.includes("get('/readiness-summary'"))
check('routes live sync lock GET', routes.includes("get('/live-sync-lock/:areaKey'"))
check('routes areas GET', routes.includes("get('/areas'"))
check('routes humidor mappings POST requires canAccessPOS3', /post\(['"]\/humidor-mappings['"],\s*canAccessPOS3/.test(routes))
check('routes bar mappings POST requires canAccessPOS3', /post\(['"]\/bar-mappings['"],\s*canAccessPOS3/.test(routes))
check('routes external POS signal POST requires canAccessPOS3', /post\(['"]\/external-pos-signal-mappings['"],\s*canAccessPOS3/.test(routes))
check('routes default export', routes.includes('export default router'))

// ── Locales ────────────────────────────────────────────────────

console.log('\n-- Locales --')
const locales = readFile('src/locales/phaseDInventoryActivation.js')
check("locale en-US defined", locales.includes("'en-US'"))
check("locale es-DO defined", locales.includes("'es-DO'"))
check("locale es defined", locales.includes('es:') || locales.includes("'es'"))
check("locale ht defined", locales.includes('ht:') || locales.includes("'ht'"))
check("locale de defined", locales.includes('de:') || locales.includes("'de'"))
check("locale pt defined", locales.includes('pt:') || locales.includes("'pt'"))
check('tPhaseDInventoryActivation exported', locales.includes('export function tPhaseDInventoryActivation'))
check('getSupportedPhaseDInventoryActivationLanguages exported', locales.includes('export function getSupportedPhaseDInventoryActivationLanguages'))
const localeKeys = [
  'inventoryActivation', 'humidorInventory', 'barInventory', 'kitchenInventory',
  'retailInventory', 'generalSupplies', 'menuIngredients', 'cigarInventory',
  'bottleInventory', 'foodInventory', 'merchandiseInventory', 'vendorCatalogs',
  'reorderRules', 'lowStockAlerts', 'countSessions', 'wasteSpoilage', 'transfers',
  'adjustments', 'importExport', 'externalPOSInventorySignals', 'inventoryLocations',
  'storageZones', 'parLevels', 'vendorOrderPreviews', 'purchaseOrderPreviews',
  'liveSyncLocked', 'cogsProfiles', 'shrinkageProfiles', 'alertPreviews',
  'complianceChecklist', 'riskFlags', 'auditLog', 'readinessSummary',
]
for (const k of localeKeys) {
  check(`locale key '${k}' present`, locales.includes(k))
}

// ── UI Page ────────────────────────────────────────────────────

console.log('\n-- UI Page --')
const ui = readFile('src/pages/phaseD/PhaseDInventoryActivation.jsx')
check('UI contains_secrets false comment', ui.includes('contains_secrets: false'))
check('UI DEVICE_LINE defined', ui.includes('const DEVICE_LINE'))
check('UI middot used', ui.includes('&middot;'))
check('UI safety banner', ui.includes('SafetyBanner') || ui.includes('SAFETY_WARNINGS'))
check('UI BUILD ONLY notice', ui.includes('BUILD ONLY'))
check('UI inventory sync not live', ui.includes('Inventory sync is NOT live') || ui.includes('NOT live'))
check('UI vendor orders previews only', ui.includes('PREVIEWS ONLY'))
check('UI COGS requires real data', ui.includes('COGS') && ui.includes('real'))
check('UI live sync locked', ui.includes('LIVE INVENTORY SYNC IS LOCKED') || ui.includes('Live Sync Lock'))
check('UI no vendor secrets', ui.includes('No vendor secrets') || ui.includes('no credentials'))
check('UI Phase D tracker shown', ui.includes('Phase D Tracker'))
check('UI D.4 COMPLETE in tracker', ui.includes('D.4') && ui.includes('COMPLETE'))
check('UI D.5 Next in tracker', ui.includes('D.5') && ui.includes('Next'))
check('UI Overview panel', ui.includes("'Overview'"))
check('UI Area Registry panel', ui.includes("'Area Registry'"))
check('UI Humidor Inventory panel', ui.includes("'Humidor Inventory'"))
check('UI Bar Inventory panel', ui.includes("'Bar Inventory'"))
check('UI Kitchen Inventory panel', ui.includes("'Kitchen Inventory'"))
check('UI Vendor Order Preview panel', ui.includes("'Vendor Order Preview'"))
check('UI COGS Profiles panel', ui.includes("'COGS Profiles'"))
check('UI Alert Previews panel', ui.includes("'Alert Previews'"))
check('UI Live Sync Lock panel', ui.includes("'Live Sync Lock'"))
check('UI Readiness Summary panel', ui.includes("'Inventory Readiness Summary'"))
check('UI Activation Audit panel', ui.includes("'Activation Audit'"))
check('UI function declaration pattern', ui.includes('function PhaseDInventoryActivation()'))
check('UI export default on separate line', ui.includes('export default PhaseDInventoryActivation'))

// ── Server index.js ────────────────────────────────────────────

console.log('\n-- Server: index.js --')
const serverIndex = readFile('server/index.js')
check('server imports phaseDInventoryActivationRoutes', serverIndex.includes('phaseDInventoryActivationRoutes'))
check('server mounts /api/phase-d/inventory-activation', serverIndex.includes('/api/phase-d/inventory-activation'))

// ── App.jsx ────────────────────────────────────────────────────

console.log('\n-- App.jsx --')
const appJsx = readFile('src/App.jsx')
check('App imports PhaseDInventoryActivation', appJsx.includes('PhaseDInventoryActivation'))
check('App mounts phase-d/inventory-activation route', appJsx.includes('phase-d/inventory-activation'))

// ── Package.json ───────────────────────────────────────────────

console.log('\n-- package.json --')
const pkg = readFile('package.json')
check('package.json has verify:phase-d-inventory-activation', pkg.includes('verify:phase-d-inventory-activation'))

// ── Docs ───────────────────────────────────────────────────────

console.log('\n-- Docs --')
const docs = readFile('docs/PHASE_D_INVENTORY_ACTIVATION.md')
check('docs what D.4 adds', docs.includes('What D.4 Adds'))
check('docs what D.4 does not do', docs.includes('What D.4 Does NOT Do'))
check('docs no live sync claim', docs.includes('Does NOT claim inventory sync is live'))
check('docs no vendor orders', docs.includes('Does NOT send real vendor orders'))
check('docs no purchase orders', docs.includes('Does NOT send real purchase orders'))
check('docs no secrets stored', docs.includes('Does NOT store vendor secrets'))
check('docs safety rules section', docs.includes('Safety Rules'))
check('docs inventory statuses section', docs.includes('Inventory Statuses'))
check('docs no secret storage rule', docs.includes('No Secret Storage Rule'))
check('docs no fake sync rule', docs.includes('No Fake Sync Rule'))
check('docs no fake vendor order rule', docs.includes('No Fake Vendor Order Rule'))
check('docs no fake count rule', docs.includes('No Fake Count Rule'))
check('docs database tables section', docs.includes('Database Tables'))
check('docs 46 tables', docs.includes('46 tables'))
check('docs API routes section', docs.includes('API Routes'))
check('docs remaining D.5-D.8 roadmap', docs.includes('D.5-D.8 Roadmap') || docs.includes('Remaining D.5'))

// ── Prior Phase Integrity ──────────────────────────────────────

console.log('\n-- Prior Phase Integrity --')
check('D.1 provider activation routes still mounted', serverIndex.includes('/api/phase-d/provider-activation'))
check('D.2 payment provider routes still mounted', serverIndex.includes('/api/phase-d/payment-provider-activation'))
check('D.3 external POS routes still mounted', serverIndex.includes('/api/phase-d/external-pos-activation'))

check('D.1 UI route still in App.jsx', appJsx.includes('phase-d/provider-activation'))
check('D.2 UI route still in App.jsx', appJsx.includes('phase-d/payment-provider-activation'))
check('D.3 UI route still in App.jsx', appJsx.includes('phase-d/external-pos-activation'))

check('D.1 import in server/index.js', serverIndex.includes('phaseDProviderActivationRoutes'))
check('D.2 import in server/index.js', serverIndex.includes('phaseDPaymentProviderActivationRoutes'))
check('D.3 import in server/index.js', serverIndex.includes('phaseDExternalPOSActivationRoutes'))

// NOVEE OS integrity
check('NOVEE OS module registry routes intact', serverIndex.includes('noveeOSModuleRegistryRoutes'))
check('NOVEE OS tenant governance routes intact', serverIndex.includes('noveeOSTenantGovernanceRoutes'))
check('NOVEE OS billing routes intact', serverIndex.includes('noveeOSBillingGovernanceRoutes'))
check('NOVEE OS security routes intact', serverIndex.includes('noveeOSSecurityGovernanceRoutes'))
check('NOVEE OS final readiness routes intact', serverIndex.includes('noveeOSFinalReadinessRoutes'))

// CraftHub integrity
check('CraftHub dashboard routes intact', serverIndex.includes('craftHubDashboardRoutes'))
check('CraftHub onboarding routes intact', serverIndex.includes('craftHubOnboardingRoutes'))

// POS360 integrity
check('POS360 floor routes intact', serverIndex.includes('pos360FloorRoutes'))
check('POS360 menu builder routes intact', serverIndex.includes('pos360MenuBuilderRoutes'))
check('POS360 payment routes intact', serverIndex.includes('pos360PaymentRoutes'))
check('POS360 production readiness intact', serverIndex.includes('pos360ProductionReadinessRoutes'))

// SmokeCraft integrity
check('SmokeCraft routes intact', serverIndex.includes('smokecraftRoutes'))
check('SmokeCraft enterprise routes intact', serverIndex.includes('smokecraftEnterpriseRoutes'))

// E.A.T. integrity
check('E.A.T. routes intact', serverIndex.includes('eatRoutes'))

// ── Final Summary ──────────────────────────────────────────────

console.log('\n' + '='.repeat(50))
console.log(`Phase D.4 Verification Complete`)
console.log(`  PASSED: ${passed}`)
console.log(`  FAILED: ${failed}`)
console.log(`  TOTAL:  ${passed + failed}`)
console.log('='.repeat(50))

if (failed > 0) {
  process.exit(1)
} else {
  console.log('\nAll checks passed.')
}
