/**
 * Phase D.4 — Inventory Activation Contracts
 * contains_secrets: false — no credentials, no API keys, no secrets
 * STATUS: BUILD ONLY. DO NOT ENABLE LIVE INVENTORY SYNC OR REAL VENDOR ORDERS.
 */

export const INVENTORY_AREA_KEYS = [
  'humidor',
  'bar',
  'kitchen',
  'retail',
  'general_supplies',
  'menu_ingredients',
  'cigar_inventory',
  'bottle_inventory',
  'food_inventory',
  'merchandise_inventory',
  'vendor_catalogs',
  'reorder_rules',
  'low_stock_alerts',
  'count_sessions',
  'waste_spoilage',
  'transfers',
  'adjustments',
  'import_export',
  'external_pos_inventory_signals',
  'readiness_summary',
]

export const INVENTORY_ACTIVATION_STATUSES = [
  'not_started',
  'setup_required',
  'mapping_required',
  'count_required',
  'import_required',
  'import_ready',
  'import_tested',
  'manual_tracking_ready',
  'companion_mode_ready',
  'reorder_rule_ready',
  'low_stock_rule_ready',
  'vendor_profile_required',
  'vendor_profile_ready',
  'vendor_order_preview_ready',
  'vendor_order_approval_required',
  'live_sync_locked',
  'live_sync_requested',
  'live_sync_approved',
  'live_sync_enabled',
  'disabled',
  'blocked',
  'failed',
]

export const INVENTORY_LOCATION_TYPES = ['venue', 'storage', 'offsite', 'virtual']

export const INVENTORY_STORAGE_ZONE_TYPES = [
  'humidor', 'walk_in', 'bar', 'kitchen', 'retail_floor', 'back_office',
  'cellar', 'freezer', 'cooler', 'dry_storage', 'general',
]

export const INVENTORY_UNIT_TYPES = ['count', 'weight', 'volume', 'length', 'area', 'custom']

export const INVENTORY_ADJUSTMENT_TYPES = ['manual', 'count_correction', 'damage', 'theft', 'donation', 'system']

export const INVENTORY_WASTE_TYPES = ['spoilage', 'breakage', 'expired', 'over_prep', 'other']

export const INVENTORY_VENDOR_TYPES = ['cigar', 'spirit', 'food', 'retail', 'general', 'custom']

export const INVENTORY_IMPORT_FORMATS = ['csv', 'xlsx', 'json', 'xml', 'pos_export']

export const INVENTORY_SIGNAL_TYPES = ['item_depletion', 'low_stock_flag', 'reorder_signal', 'sales_mix', 'void_signal']

export const INVENTORY_ALERT_TYPES = ['low_stock', 'below_par', 'reorder_needed', 'expiry_warning', 'count_overdue']

export const INVENTORY_AUDIT_EVENT_TYPES = [
  'area_registered', 'area_status_updated', 'location_created', 'zone_created',
  'item_created', 'item_updated', 'par_level_set', 'reorder_rule_set',
  'low_stock_rule_set', 'count_session_created', 'adjustment_recorded',
  'transfer_recorded', 'waste_recorded', 'vendor_created', 'catalog_created',
  'order_preview_created', 'order_approval_requested', 'po_preview_created',
  'import_profile_created', 'export_profile_created', 'signal_mapping_created',
  'live_sync_request_submitted', 'live_sync_request_preview_approved',
  'compliance_check_updated', 'risk_flag_created',
]

export const INVENTORY_COGS_DATA_SOURCES = ['not_configured', 'manual_entry', 'csv_import', 'pos_import', 'vendor_catalog']

export const FORBIDDEN_INVENTORY_FIELDS = [
  'api_key', 'secret_key', 'api_secret', 'private_key', 'access_token',
  'client_secret', 'auth_token', 'bearer_token', 'webhook_secret',
  'vendor_api_key', 'vendor_secret', 'vendor_password', 'vendor_token',
  'encryption_key', 'signing_secret', 'password', 'refresh_token',
]

export function validateInventoryAreaKey(key) {
  if (!INVENTORY_AREA_KEYS.includes(key)) throw new Error(`Invalid inventory area key: ${key}`)
  return true
}

export function validateInventoryActivationStatus(status) {
  if (!INVENTORY_ACTIVATION_STATUSES.includes(status)) throw new Error(`Invalid inventory activation status: ${status}`)
  return true
}

export function validateInventoryLocation(payload) {
  if (!payload || !payload.location_key) throw new Error('location_key required')
  if (!payload.location_label) throw new Error('location_label required')
  return true
}

export function validateInventoryStorageZone(payload) {
  if (!payload || !payload.zone_key) throw new Error('zone_key required')
  if (!payload.zone_label) throw new Error('zone_label required')
  return true
}

export function validateInventoryItem(payload) {
  if (!payload || !payload.item_key) throw new Error('item_key required')
  if (!payload.item_label) throw new Error('item_label required')
  if (!payload.area_key) throw new Error('area_key required')
  validateInventoryAreaKey(payload.area_key)
  return true
}

export function validateInventoryItemCategory(payload) {
  if (!payload || !payload.category_key) throw new Error('category_key required')
  if (!payload.category_label) throw new Error('category_label required')
  if (!payload.area_key) throw new Error('area_key required')
  return true
}

export function validateInventoryItemVariant(payload) {
  if (!payload || !payload.variant_key) throw new Error('variant_key required')
  if (!payload.variant_label) throw new Error('variant_label required')
  return true
}

export function validateInventoryUnit(payload) {
  if (!payload || !payload.unit_key) throw new Error('unit_key required')
  if (!payload.unit_label) throw new Error('unit_label required')
  return true
}

export function validateParLevelProfile(payload) {
  if (!payload || !payload.area_key) throw new Error('area_key required')
  if (payload.par_quantity === undefined) throw new Error('par_quantity required')
  return true
}

export function validateReorderRuleProfile(payload) {
  if (!payload || !payload.area_key) throw new Error('area_key required')
  if (payload.auto_reorder_enabled === true) throw new Error('auto_reorder_enabled must be false — real vendor ordering not enabled in Phase D.4')
  if (payload.real_order_submission === true) throw new Error('real_order_submission must be false')
  return true
}

export function validateLowStockRuleProfile(payload) {
  if (!payload || !payload.area_key) throw new Error('area_key required')
  if (payload.low_stock_threshold === undefined) throw new Error('low_stock_threshold required')
  return true
}

export function validateCountSessionProfile(payload) {
  if (!payload || !payload.area_key) throw new Error('area_key required')
  if (!payload.session_label) throw new Error('session_label required')
  return true
}

export function validateCountSessionItem(payload) {
  if (!payload || !payload.session_id) throw new Error('session_id required')
  return true
}

export function validateAdjustmentRecord(payload) {
  if (!payload || !payload.area_key) throw new Error('area_key required')
  if (payload.quantity_delta === undefined) throw new Error('quantity_delta required')
  return true
}

export function validateTransferRecord(payload) {
  if (!payload || !payload.area_key) throw new Error('area_key required')
  if (payload.quantity === undefined) throw new Error('quantity required')
  return true
}

export function validateWasteSpoilageRecord(payload) {
  if (!payload || !payload.area_key) throw new Error('area_key required')
  if (payload.quantity === undefined) throw new Error('quantity required')
  return true
}

export function validateVendorRegistryPayload(payload) {
  if (!payload || !payload.vendor_key) throw new Error('vendor_key required')
  if (!payload.vendor_label) throw new Error('vendor_label required')
  return true
}

export function validateVendorCatalogProfile(payload) {
  if (!payload || !payload.vendor_key) throw new Error('vendor_key required')
  if (!payload.catalog_label) throw new Error('catalog_label required')
  return true
}

export function validateVendorCatalogItem(payload) {
  if (!payload || !payload.catalog_id) throw new Error('catalog_id required')
  if (!payload.item_label) throw new Error('item_label required')
  return true
}

export function validateVendorOrderPreviewRecord(payload) {
  if (!payload || !payload.vendor_key) throw new Error('vendor_key required')
  if (payload.is_real_order === true) throw new Error('is_real_order must be false — vendor orders are previews only in Phase D.4')
  if (payload.order_submitted === true) throw new Error('order_submitted must be false')
  if (payload.real_vendor_email_sent === true) throw new Error('real_vendor_email_sent must be false')
  return true
}

export function validateVendorOrderApprovalRequest(payload) {
  if (!payload || !payload.preview_id) throw new Error('preview_id required')
  if (!payload.vendor_key) throw new Error('vendor_key required')
  return true
}

export function validatePurchaseOrderPreviewRecord(payload) {
  if (!payload || !payload.vendor_key) throw new Error('vendor_key required')
  if (payload.is_real_po === true) throw new Error('is_real_po must be false — purchase orders are previews only in Phase D.4')
  if (payload.po_submitted === true) throw new Error('po_submitted must be false')
  return true
}

export function validateInventoryImportProfile(payload) {
  if (!payload || !payload.area_key) throw new Error('area_key required')
  if (!payload.profile_label) throw new Error('profile_label required')
  return true
}

export function validateInventoryImportTemplate(payload) {
  if (!payload || !payload.area_key) throw new Error('area_key required')
  if (!payload.template_label) throw new Error('template_label required')
  return true
}

export function validateInventoryImportBatch(payload) {
  if (!payload || !payload.area_key) throw new Error('area_key required')
  return true
}

export function validateInventoryImportBatchItem(payload) {
  if (!payload || !payload.batch_id) throw new Error('batch_id required')
  return true
}

export function validateInventoryExportProfile(payload) {
  if (!payload || !payload.area_key) throw new Error('area_key required')
  if (!payload.profile_label) throw new Error('profile_label required')
  return true
}

export function validateExternalPOSInventorySignalMapping(payload) {
  if (!payload || !payload.area_key) throw new Error('area_key required')
  if (!payload.provider_key) throw new Error('provider_key required')
  if (payload.live_sync_enabled === true) throw new Error('live_sync_enabled must be false — external POS inventory sync is not live in Phase D.4')
  return true
}

export function validateHumidorInventoryMapping(payload) {
  if (!payload || !payload.item_key) throw new Error('item_key required')
  return true
}

export function validateBarInventoryMapping(payload) {
  if (!payload || !payload.item_key) throw new Error('item_key required')
  return true
}

export function validateKitchenInventoryMapping(payload) {
  if (!payload || !payload.item_key) throw new Error('item_key required')
  return true
}

export function validateRetailInventoryMapping(payload) {
  if (!payload || !payload.item_key) throw new Error('item_key required')
  return true
}

export function validateMenuIngredientMapping(payload) {
  if (!payload || !payload.menu_item_key) throw new Error('menu_item_key required')
  if (!payload.ingredient_key) throw new Error('ingredient_key required')
  return true
}

export function validateRecipeMapping(payload) {
  if (!payload || !payload.recipe_key) throw new Error('recipe_key required')
  if (!payload.recipe_label) throw new Error('recipe_label required')
  return true
}

export function validateCOGSProfileRecord(payload) {
  if (!payload || !payload.area_key) throw new Error('area_key required')
  if (!payload.profile_label) throw new Error('profile_label required')
  if (payload.cogs_calculated === true) throw new Error('cogs_calculated must be false without real cost and sales data')
  return true
}

export function validateShrinkageProfileRecord(payload) {
  if (!payload || !payload.area_key) throw new Error('area_key required')
  if (!payload.profile_label) throw new Error('profile_label required')
  return true
}

export function validateInventoryAlertRule(payload) {
  if (!payload || !payload.area_key) throw new Error('area_key required')
  return true
}

export function validateInventoryAlertPreviewRecord(payload) {
  if (!payload || !payload.area_key) throw new Error('area_key required')
  if (payload.is_real_alert === true) throw new Error('is_real_alert must be false without real inventory data')
  return true
}

export function validateLiveSyncRequest(payload) {
  if (!payload || !payload.area_key) throw new Error('area_key required')
  return true
}

export function validateTenantInventoryMapping(payload) {
  if (!payload || !payload.tenant_id) throw new Error('tenant_id required')
  if (!payload.area_key) throw new Error('area_key required')
  return true
}

export function validateModuleInventoryMapping(payload) {
  if (!payload || !payload.module_key) throw new Error('module_key required')
  if (!payload.area_key) throw new Error('area_key required')
  return true
}

export function validateComplianceChecklistItem(payload) {
  if (!payload || !payload.check_key) throw new Error('check_key required')
  return true
}

export function validateRiskFlag(payload) {
  if (!payload || !payload.flag_key) throw new Error('flag_key required')
  if (!payload.flag_label) throw new Error('flag_label required')
  return true
}

export function assertNoInventorySecretsInPayload(payload) {
  if (!payload || typeof payload !== 'object') return true
  for (const field of FORBIDDEN_INVENTORY_FIELDS) {
    if (field in payload) throw new Error(`Forbidden field in inventory payload: ${field}. Phase D.4 does not store vendor secrets or inventory provider credentials.`)
  }
  return true
}

export function assertNoFakeInventorySyncClaim(payload) {
  if (!payload) return true
  const fake = ['live_sync_enabled', 'external_pos_sync_live', 'inventory_sync_active', 'real_time_sync_enabled']
  for (const f of fake) {
    if (payload[f] === true) throw new Error(`Fake inventory sync claim blocked: ${f} cannot be true in Phase D.4`)
  }
  return true
}

export function assertNoFakeVendorOrderClaim(payload) {
  if (!payload) return true
  if (payload.is_real_order === true) throw new Error('Fake vendor order claim blocked: is_real_order cannot be true in Phase D.4')
  if (payload.order_submitted === true) throw new Error('Fake vendor order claim blocked: order_submitted cannot be true in Phase D.4')
  if (payload.real_vendor_email_sent === true) throw new Error('Fake vendor order claim blocked: real_vendor_email_sent cannot be true in Phase D.4')
  if (payload.is_real_po === true) throw new Error('Fake PO claim blocked: is_real_po cannot be true in Phase D.4')
  if (payload.po_submitted === true) throw new Error('Fake PO claim blocked: po_submitted cannot be true in Phase D.4')
  return true
}

export function assertNoFakeInventoryCountClaim(payload) {
  if (!payload) return true
  if (payload.is_real_count === true && !payload.count_date) throw new Error('is_real_count requires a count_date — cannot claim real count without actual count data')
  if (payload.is_real_alert === true) throw new Error('is_real_alert cannot be true without real inventory count data')
  return true
}
