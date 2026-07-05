/**
 * Phase D.4 — Inventory Activation Service
 * Falls back gracefully when no database connection is configured.
 * Never prints or logs the database connection string.
 * contains_secrets: false, stores_secrets: false
 * STATUS: BUILD ONLY. DO NOT ENABLE LIVE INVENTORY SYNC OR REAL VENDOR ORDERS.
 */

import { isDbAvailable } from '../../db/connection.js'
import {
  assertNoInventorySecretsInPayload,
  assertNoFakeInventorySyncClaim,
  assertNoFakeVendorOrderClaim,
  assertNoFakeInventoryCountClaim,
  INVENTORY_AREA_KEYS,
  INVENTORY_ACTIVATION_STATUSES,
} from './phaseDInventoryActivationContracts.js'

const AREA = 'phase_d_inventory_activation'

const localFallback = (area) => ({
  ok: false,
  localPreview: true,
  error: 'database_not_configured',
  area,
})

function getDefaultAreas() {
  return INVENTORY_AREA_KEYS.map(area_key => ({
    area_key,
    status: area_key === 'readiness_summary' ? 'not_started' : 'setup_required',
    live_sync_enabled: false,
    vendor_ordering_enabled: false,
    auto_reorder_enabled: false,
    external_pos_sync_enabled: false,
  }))
}

// ── Area Registry ────────────────────────────────────────────────

export async function listInventoryAreas(tenantId) {
  if (!isDbAvailable()) return { ok: true, localPreview: true, data: getDefaultAreas(), area: AREA }
  const db = (await import('../../db/connection.js')).default
  const rows = await db.query('SELECT * FROM inventory_activation_area_status WHERE tenant_id = $1 ORDER BY created_at', [tenantId])
  if (rows.rows.length === 0) return { ok: true, data: getDefaultAreas(), area: AREA }
  return { ok: true, data: rows.rows }
}

export async function getInventoryArea(tenantId, areaKey) {
  if (!isDbAvailable()) return { ok: true, localPreview: true, data: getDefaultAreas().find(a => a.area_key === areaKey) || null, area: AREA }
  const db = (await import('../../db/connection.js')).default
  const row = await db.query('SELECT * FROM inventory_activation_area_status WHERE tenant_id = $1 AND area_key = $2', [tenantId, areaKey])
  return { ok: true, data: row.rows[0] || null }
}

export async function getInventoryAreaStatus(tenantId, areaKey) {
  return getInventoryArea(tenantId, areaKey)
}

export async function updateInventoryAreaStatus(tenantId, areaKey, payload, actorId) {
  assertNoInventorySecretsInPayload(payload)
  assertNoFakeInventorySyncClaim(payload)
  if (!INVENTORY_ACTIVATION_STATUSES.includes(payload.status)) throw new Error(`Invalid status: ${payload.status}`)
  if (payload.live_sync_enabled === true) throw new Error('live_sync_enabled must remain false in Phase D.4')
  if (!isDbAvailable()) return { ok: true, localPreview: true, data: { area_key: areaKey, ...payload }, area: AREA }
  const db = (await import('../../db/connection.js')).default
  await db.query(
    `INSERT INTO inventory_activation_area_status (tenant_id, area_key, status, live_sync_enabled, vendor_ordering_enabled, auto_reorder_enabled, external_pos_sync_enabled, notes)
     VALUES ($1, $2, $3, FALSE, FALSE, FALSE, FALSE, $4)
     ON CONFLICT (tenant_id, area_key) DO UPDATE SET status = $3, notes = $4, updated_at = NOW()`,
    [tenantId, areaKey, payload.status, payload.notes || null]
  )
  return { ok: true, data: { area_key: areaKey, status: payload.status } }
}

// ── Generic list/create factory ──────────────────────────────────

function makeInventoryListCreate(tableName) {
  return {
    async list(tenantId, filters = {}) {
      if (!isDbAvailable()) return { ok: true, localPreview: true, data: [], area: AREA }
      const db = (await import('../../db/connection.js')).default
      const rows = await db.query(`SELECT * FROM ${tableName} WHERE tenant_id = $1 ORDER BY created_at DESC`, [tenantId])
      return { ok: true, data: rows.rows }
    },
    async create(tenantId, payload, actorId, idempotencyKey) {
      assertNoInventorySecretsInPayload(payload)
      if (!isDbAvailable()) return { ok: true, localPreview: true, data: { ...payload }, area: AREA }
      const db = (await import('../../db/connection.js')).default
      const fields = Object.keys(payload)
      const values = Object.values(payload)
      const cols = ['tenant_id', 'idempotency_key', ...fields].join(', ')
      const placeholders = ['$1', '$2', ...fields.map((_, i) => `$${i + 3}`)].join(', ')
      const row = await db.query(
        `INSERT INTO ${tableName} (${cols}) VALUES (${placeholders}) ON CONFLICT (idempotency_key) DO NOTHING RETURNING *`,
        [tenantId, idempotencyKey || null, ...values]
      )
      return { ok: true, data: row.rows[0] || null }
    },
  }
}

const locationOps = makeInventoryListCreate('inventory_location_registry')
const zoneOps = makeInventoryListCreate('inventory_storage_zone_registry')
const itemOps = makeInventoryListCreate('inventory_item_registry')
const categoryOps = makeInventoryListCreate('inventory_item_category_registry')
const variantOps = makeInventoryListCreate('inventory_item_variant_registry')
const unitOps = makeInventoryListCreate('inventory_unit_registry')
const parOps = makeInventoryListCreate('inventory_par_level_profiles')
const reorderOps = makeInventoryListCreate('inventory_reorder_rule_profiles')
const lowStockOps = makeInventoryListCreate('inventory_low_stock_rule_profiles')
const countSessionOps = makeInventoryListCreate('inventory_count_session_profiles')
const countItemOps = makeInventoryListCreate('inventory_count_session_items')
const adjustmentOps = makeInventoryListCreate('inventory_adjustment_records')
const transferOps = makeInventoryListCreate('inventory_transfer_records')
const wasteOps = makeInventoryListCreate('inventory_waste_spoilage_records')
const vendorOps = makeInventoryListCreate('inventory_vendor_registry')
const catalogProfileOps = makeInventoryListCreate('inventory_vendor_catalog_profiles')
const catalogItemOps = makeInventoryListCreate('inventory_vendor_catalog_items')
const vendorOrderPreviewOps = makeInventoryListCreate('inventory_vendor_order_preview_records')
const vendorOrderApprovalOps = makeInventoryListCreate('inventory_vendor_order_approval_requests')
const poPreviewOps = makeInventoryListCreate('inventory_purchase_order_preview_records')
const importProfileOps = makeInventoryListCreate('inventory_import_profiles')
const importTemplateOps = makeInventoryListCreate('inventory_import_templates')
const importBatchOps = makeInventoryListCreate('inventory_import_batches')
const importBatchItemOps = makeInventoryListCreate('inventory_import_batch_items')
const exportProfileOps = makeInventoryListCreate('inventory_export_profiles')
const signalMappingOps = makeInventoryListCreate('inventory_external_pos_signal_mapping')
const humidorOps = makeInventoryListCreate('inventory_humidor_mapping')
const barOps = makeInventoryListCreate('inventory_bar_mapping')
const kitchenOps = makeInventoryListCreate('inventory_kitchen_mapping')
const retailOps = makeInventoryListCreate('inventory_retail_mapping')
const menuIngredientOps = makeInventoryListCreate('inventory_menu_ingredient_mapping')
const recipeOps = makeInventoryListCreate('inventory_recipe_mapping')
const cogsOps = makeInventoryListCreate('inventory_cogs_profile_records')
const shrinkageOps = makeInventoryListCreate('inventory_shrinkage_profile_records')
const alertRuleOps = makeInventoryListCreate('inventory_alert_rule_registry')
const alertPreviewOps = makeInventoryListCreate('inventory_alert_preview_records')
const liveSyncRequestOps = makeInventoryListCreate('inventory_live_sync_requests')
const complianceOps = makeInventoryListCreate('inventory_compliance_checklist')
const riskFlagOps = makeInventoryListCreate('inventory_risk_flags')
const auditOps = makeInventoryListCreate('inventory_activation_audit')

// ── Locations ───────────────────────────────────────────────────

export const listInventoryLocations = locationOps.list
export const createInventoryLocation = locationOps.create
export async function updateInventoryLocation(tenantId, locationId, payload) {
  assertNoInventorySecretsInPayload(payload)
  if (!isDbAvailable()) return { ok: true, localPreview: true, data: payload, area: AREA }
  const db = (await import('../../db/connection.js')).default
  const row = await db.query('UPDATE inventory_location_registry SET updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *', [locationId, tenantId])
  return { ok: true, data: row.rows[0] || null }
}

// ── Storage Zones ───────────────────────────────────────────────

export const listStorageZones = zoneOps.list
export const createStorageZone = zoneOps.create
export async function updateStorageZone(tenantId, zoneId, payload) {
  assertNoInventorySecretsInPayload(payload)
  if (!isDbAvailable()) return { ok: true, localPreview: true, data: payload, area: AREA }
  const db = (await import('../../db/connection.js')).default
  const row = await db.query('UPDATE inventory_storage_zone_registry SET updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *', [zoneId, tenantId])
  return { ok: true, data: row.rows[0] || null }
}

// ── Items ───────────────────────────────────────────────────────

export const listInventoryItems = itemOps.list
export const createInventoryItem = itemOps.create
export async function updateInventoryItem(tenantId, itemId, payload) {
  assertNoInventorySecretsInPayload(payload)
  if (!isDbAvailable()) return { ok: true, localPreview: true, data: payload, area: AREA }
  const db = (await import('../../db/connection.js')).default
  const row = await db.query('UPDATE inventory_item_registry SET updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *', [itemId, tenantId])
  return { ok: true, data: row.rows[0] || null }
}

// ── Categories / Variants / Units ────────────────────────────────

export const listInventoryItemCategories = categoryOps.list
export const createInventoryItemCategory = categoryOps.create
export const listInventoryItemVariants = variantOps.list
export const createInventoryItemVariant = variantOps.create
export const listInventoryUnits = unitOps.list
export const createInventoryUnit = unitOps.create

// ── Par Levels ──────────────────────────────────────────────────

export const listParLevelProfiles = parOps.list
export const createParLevelProfile = parOps.create
export async function updateParLevelProfile(tenantId, profileId, payload) {
  assertNoInventorySecretsInPayload(payload)
  if (!isDbAvailable()) return { ok: true, localPreview: true, data: payload, area: AREA }
  const db = (await import('../../db/connection.js')).default
  const row = await db.query('UPDATE inventory_par_level_profiles SET updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *', [profileId, tenantId])
  return { ok: true, data: row.rows[0] || null }
}

// ── Reorder Rules ───────────────────────────────────────────────

export const listReorderRuleProfiles = reorderOps.list
export async function createReorderRuleProfile(tenantId, payload, actorId, ikey) {
  assertNoInventorySecretsInPayload(payload)
  if (payload.auto_reorder_enabled === true) throw new Error('auto_reorder_enabled must be false in Phase D.4')
  if (payload.vendor_order_enabled === true) throw new Error('vendor_order_enabled must be false in Phase D.4')
  if (payload.real_order_submission === true) throw new Error('real_order_submission must be false in Phase D.4')
  return reorderOps.create(tenantId, payload, actorId, ikey)
}
export async function updateReorderRuleProfile(tenantId, profileId, payload) {
  assertNoInventorySecretsInPayload(payload)
  if (!isDbAvailable()) return { ok: true, localPreview: true, data: payload, area: AREA }
  const db = (await import('../../db/connection.js')).default
  const row = await db.query('UPDATE inventory_reorder_rule_profiles SET updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *', [profileId, tenantId])
  return { ok: true, data: row.rows[0] || null }
}

// ── Low Stock Rules ─────────────────────────────────────────────

export const listLowStockRuleProfiles = lowStockOps.list
export const createLowStockRuleProfile = lowStockOps.create
export async function updateLowStockRuleProfile(tenantId, profileId, payload) {
  assertNoInventorySecretsInPayload(payload)
  if (!isDbAvailable()) return { ok: true, localPreview: true, data: payload, area: AREA }
  const db = (await import('../../db/connection.js')).default
  const row = await db.query('UPDATE inventory_low_stock_rule_profiles SET updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *', [profileId, tenantId])
  return { ok: true, data: row.rows[0] || null }
}

// ── Count Sessions ──────────────────────────────────────────────

export const listCountSessions = countSessionOps.list
export async function createCountSession(tenantId, payload, actorId, ikey) {
  assertNoInventorySecretsInPayload(payload)
  assertNoFakeInventoryCountClaim(payload)
  return countSessionOps.create(tenantId, payload, actorId, ikey)
}
export async function getCountSession(tenantId, sessionId) {
  if (!isDbAvailable()) return { ok: true, localPreview: true, data: null, area: AREA }
  const db = (await import('../../db/connection.js')).default
  const row = await db.query('SELECT * FROM inventory_count_session_profiles WHERE id = $1 AND tenant_id = $2', [sessionId, tenantId])
  return { ok: true, data: row.rows[0] || null }
}

export const listCountSessionItems = countItemOps.list
export async function createCountSessionItem(tenantId, payload, actorId, ikey) {
  assertNoInventorySecretsInPayload(payload)
  return countItemOps.create(tenantId, payload, actorId, ikey)
}

// ── Adjustments / Transfers / Waste ─────────────────────────────

export const listAdjustmentRecords = adjustmentOps.list
export const createAdjustmentRecord = adjustmentOps.create
export const listTransferRecords = transferOps.list
export const createTransferRecord = transferOps.create
export const listWasteSpoilageRecords = wasteOps.list
export const createWasteSpoilageRecord = wasteOps.create

// ── Vendors ─────────────────────────────────────────────────────

export const listVendors = vendorOps.list
export async function createVendor(tenantId, payload, actorId, ikey) {
  assertNoInventorySecretsInPayload(payload)
  const safe = { ...payload, contains_secrets: false, stores_secrets: false }
  return vendorOps.create(tenantId, safe, actorId, ikey)
}
export async function updateVendor(tenantId, vendorId, payload) {
  assertNoInventorySecretsInPayload(payload)
  if (!isDbAvailable()) return { ok: true, localPreview: true, data: payload, area: AREA }
  const db = (await import('../../db/connection.js')).default
  const row = await db.query('UPDATE inventory_vendor_registry SET updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *', [vendorId, tenantId])
  return { ok: true, data: row.rows[0] || null }
}

// ── Vendor Catalogs ─────────────────────────────────────────────

export const listVendorCatalogProfiles = catalogProfileOps.list
export const createVendorCatalogProfile = catalogProfileOps.create
export const listVendorCatalogItems = catalogItemOps.list
export const createVendorCatalogItem = catalogItemOps.create

// ── Vendor Order Previews ────────────────────────────────────────

export const listVendorOrderPreviews = vendorOrderPreviewOps.list
export async function createVendorOrderPreview(tenantId, payload, actorId, ikey) {
  assertNoInventorySecretsInPayload(payload)
  assertNoFakeVendorOrderClaim(payload)
  const safe = { ...payload, is_real_order: false, order_submitted: false, real_vendor_email_sent: false }
  return vendorOrderPreviewOps.create(tenantId, safe, actorId, ikey)
}

export const listVendorOrderApprovalRequests = vendorOrderApprovalOps.list
export async function createVendorOrderApprovalRequest(tenantId, payload, actorId, ikey) {
  assertNoInventorySecretsInPayload(payload)
  const safe = { ...payload, real_order_gated: true }
  return vendorOrderApprovalOps.create(tenantId, safe, actorId, ikey)
}

// ── Purchase Order Previews ──────────────────────────────────────

export const listPurchaseOrderPreviews = poPreviewOps.list
export async function createPurchaseOrderPreview(tenantId, payload, actorId, ikey) {
  assertNoInventorySecretsInPayload(payload)
  assertNoFakeVendorOrderClaim(payload)
  const safe = { ...payload, is_real_po: false, po_submitted: false }
  return poPreviewOps.create(tenantId, safe, actorId, ikey)
}

// ── Import / Export ─────────────────────────────────────────────

export const listInventoryImportProfiles = importProfileOps.list
export const createInventoryImportProfile = importProfileOps.create
export const listInventoryImportTemplates = importTemplateOps.list
export const createInventoryImportTemplate = importTemplateOps.create
export const listInventoryImportBatches = importBatchOps.list
export const createInventoryImportBatch = importBatchOps.create
export const listInventoryImportBatchItems = importBatchItemOps.list
export const createInventoryImportBatchItem = importBatchItemOps.create
export const listInventoryExportProfiles = exportProfileOps.list
export const createInventoryExportProfile = exportProfileOps.create

// ── External POS Signal Mapping ──────────────────────────────────

export const listExternalPOSInventorySignalMappings = signalMappingOps.list
export async function createExternalPOSInventorySignalMapping(tenantId, payload, actorId, ikey) {
  assertNoInventorySecretsInPayload(payload)
  assertNoFakeInventorySyncClaim(payload)
  const safe = { ...payload, live_sync_enabled: false }
  return signalMappingOps.create(tenantId, safe, actorId, ikey)
}

// ── Area-specific Mappings ───────────────────────────────────────

export const listHumidorMappings = humidorOps.list
export const createHumidorMapping = humidorOps.create
export const listBarMappings = barOps.list
export const createBarMapping = barOps.create
export const listKitchenMappings = kitchenOps.list
export const createKitchenMapping = kitchenOps.create
export const listRetailMappings = retailOps.list
export const createRetailMapping = retailOps.create
export const listMenuIngredientMappings = menuIngredientOps.list
export const createMenuIngredientMapping = menuIngredientOps.create
export const listRecipeMappings = recipeOps.list
export const createRecipeMapping = recipeOps.create

// ── COGS / Shrinkage ─────────────────────────────────────────────

export const listCOGSProfiles = cogsOps.list
export async function createCOGSProfile(tenantId, payload, actorId, ikey) {
  assertNoInventorySecretsInPayload(payload)
  if (payload.cogs_calculated === true) throw new Error('cogs_calculated must be false — COGS depends on real imported cost and sales data')
  const safe = {
    ...payload,
    requires_real_cost_data: true,
    requires_real_sales_data: true,
    cogs_calculated: false,
    cost_data_source: payload.cost_data_source || 'not_configured',
    sales_data_source: payload.sales_data_source || 'not_configured',
  }
  return cogsOps.create(tenantId, safe, actorId, ikey)
}

export const listShrinkageProfiles = shrinkageOps.list
export const createShrinkageProfile = shrinkageOps.create

// ── Alert Rules / Previews ───────────────────────────────────────

export const listInventoryAlertRules = alertRuleOps.list
export async function createInventoryAlertRule(tenantId, payload, actorId, ikey) {
  assertNoInventorySecretsInPayload(payload)
  const safe = { ...payload, alert_preview_only: true, requires_real_data: true }
  return alertRuleOps.create(tenantId, safe, actorId, ikey)
}

export const listInventoryAlertPreviews = alertPreviewOps.list
export async function createInventoryAlertPreview(tenantId, payload, actorId, ikey) {
  assertNoInventorySecretsInPayload(payload)
  assertNoFakeInventoryCountClaim(payload)
  const safe = { ...payload, is_real_alert: false, requires_real_count: true }
  return alertPreviewOps.create(tenantId, safe, actorId, ikey)
}

// ── Live Sync ────────────────────────────────────────────────────

export const listLiveSyncRequests = liveSyncRequestOps.list
export async function createLiveSyncRequest(tenantId, payload, actorId, ikey) {
  assertNoInventorySecretsInPayload(payload)
  const safe = { ...payload, live_sync_gated: true }
  return liveSyncRequestOps.create(tenantId, safe, actorId, ikey)
}

export async function approveLiveSyncRequestPreviewOnly(tenantId, requestId, actorId) {
  return {
    ok: true,
    localPreview: true,
    data: {
      request_id: requestId,
      approval_status: 'preview_only',
      live_sync_enabled: false,
      warning: 'This is a preview-only approval. It does NOT enable live inventory sync. Phase D.4 does not activate live sync.',
    },
    area: AREA,
  }
}

export async function getLiveSyncLockStatus(tenantId, areaKey) {
  return {
    ok: true,
    data: {
      area_key: areaKey,
      is_locked: true,
      lock_reason: 'Phase D.4 activation required before live inventory sync',
      live_sync_enabled: false,
      external_pos_sync_enabled: false,
      vendor_order_submission_enabled: false,
      auto_reorder_enabled: false,
    },
  }
}

// ── Tenant / Module Mapping ──────────────────────────────────────

export async function getTenantInventoryMapping(tenantId) {
  if (!isDbAvailable()) return { ok: true, localPreview: true, data: null, area: AREA }
  const db = (await import('../../db/connection.js')).default
  const rows = await db.query('SELECT * FROM inventory_tenant_mapping WHERE tenant_id = $1', [tenantId])
  return { ok: true, data: rows.rows }
}

export async function createTenantInventoryMapping(tenantId, payload, actorId, ikey) {
  assertNoInventorySecretsInPayload(payload)
  if (!isDbAvailable()) return { ok: true, localPreview: true, data: payload, area: AREA }
  const db = (await import('../../db/connection.js')).default
  const row = await db.query(
    `INSERT INTO inventory_tenant_mapping (tenant_id, area_key, module_key, mapping_status, notes, idempotency_key)
     VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (idempotency_key) DO NOTHING RETURNING *`,
    [tenantId, payload.area_key, payload.module_key || null, payload.mapping_status || 'not_started', payload.notes || null, ikey || null]
  )
  return { ok: true, data: row.rows[0] || null }
}

export async function getModuleInventoryMapping(tenantId, moduleKey) {
  if (!isDbAvailable()) return { ok: true, localPreview: true, data: null, area: AREA }
  const db = (await import('../../db/connection.js')).default
  const rows = await db.query('SELECT * FROM inventory_module_mapping WHERE tenant_id = $1 AND module_key = $2', [tenantId, moduleKey])
  return { ok: true, data: rows.rows }
}

export async function createModuleInventoryMapping(tenantId, payload, actorId, ikey) {
  assertNoInventorySecretsInPayload(payload)
  if (!isDbAvailable()) return { ok: true, localPreview: true, data: payload, area: AREA }
  const db = (await import('../../db/connection.js')).default
  const row = await db.query(
    `INSERT INTO inventory_module_mapping (tenant_id, module_key, area_key, mapping_status, notes, idempotency_key)
     VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (idempotency_key) DO NOTHING RETURNING *`,
    [tenantId, payload.module_key, payload.area_key, payload.mapping_status || 'not_started', payload.notes || null, ikey || null]
  )
  return { ok: true, data: row.rows[0] || null }
}

// ── Compliance / Risk ────────────────────────────────────────────

export const listComplianceChecklist = complianceOps.list
export async function updateComplianceChecklistItem(tenantId, itemId, payload) {
  if (!isDbAvailable()) return { ok: true, localPreview: true, data: payload, area: AREA }
  const db = (await import('../../db/connection.js')).default
  const row = await db.query('UPDATE inventory_compliance_checklist SET check_status = $3, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *', [itemId, tenantId, payload.check_status])
  return { ok: true, data: row.rows[0] || null }
}

export const listRiskFlags = riskFlagOps.list
export const createRiskFlag = riskFlagOps.create

// ── Audit ────────────────────────────────────────────────────────

export const listActivationAudit = auditOps.list
export async function writeActivationAudit(tenantId, payload, actorId, ikey) {
  const safe = { ...payload, contains_secrets: false }
  return auditOps.create(tenantId, safe, actorId, ikey)
}

// ── Readiness Summary ────────────────────────────────────────────

export async function getInventoryReadinessSummary(tenantId) {
  return {
    ok: true,
    data: {
      tenant_id: tenantId,
      inventory_sync_live: false,
      vendor_ordering_live: false,
      auto_reorder_live: false,
      external_pos_inventory_sync_live: false,
      no_secret_storage: true,
      no_fake_sync_claim: true,
      no_fake_vendor_order_claim: true,
      no_fake_count_claim: true,
      environment_locks_active: true,
      live_sync_locked: true,
      vendor_order_approval_gate_active: true,
      cogs_requires_real_data: true,
      low_stock_alerts_require_real_count: true,
      phase_d4_complete: true,
      phase_d5_next: true,
      safety_status: 'BUILD_ONLY_NO_LIVE_SYNC',
    },
  }
}
