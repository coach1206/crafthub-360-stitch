/**
 * Phase D.4 — Inventory Activation Routes
 * Mounted at: /api/phase-d/inventory-activation
 * platformAdminGuardRequired = true on all write routes
 * contains_secrets: false
 */

import { Router } from 'express'
import { canAccessPOS3 } from '../middleware/roleMiddleware.js'
import * as ctrl from '../controllers/phaseDInventoryActivationController.js'

const router = Router()

// ── Area Registry ─────────────────────────────────────────────────
router.get('/areas',                           ctrl.listInventoryAreas)
router.get('/areas/:areaKey',                  ctrl.getInventoryArea)
router.get('/areas/:areaKey/status',           ctrl.getInventoryAreaStatus)
router.patch('/areas/:areaKey/status',         canAccessPOS3, ctrl.updateInventoryAreaStatus)

// ── Locations ─────────────────────────────────────────────────────
router.get('/locations',                       ctrl.listInventoryLocations)
router.post('/locations',                      canAccessPOS3, ctrl.createInventoryLocation)
router.patch('/locations/:locationId',         canAccessPOS3, ctrl.updateInventoryLocation)

// ── Storage Zones ─────────────────────────────────────────────────
router.get('/storage-zones',                   ctrl.listStorageZones)
router.post('/storage-zones',                  canAccessPOS3, ctrl.createStorageZone)
router.patch('/storage-zones/:zoneId',         canAccessPOS3, ctrl.updateStorageZone)

// ── Items ─────────────────────────────────────────────────────────
router.get('/items',                           ctrl.listInventoryItems)
router.post('/items',                          canAccessPOS3, ctrl.createInventoryItem)
router.patch('/items/:itemId',                 canAccessPOS3, ctrl.updateInventoryItem)

// ── Categories / Variants / Units ─────────────────────────────────
router.get('/item-categories',                 ctrl.listInventoryItemCategories)
router.post('/item-categories',                canAccessPOS3, ctrl.createInventoryItemCategory)
router.get('/item-variants',                   ctrl.listInventoryItemVariants)
router.post('/item-variants',                  canAccessPOS3, ctrl.createInventoryItemVariant)
router.get('/units',                           ctrl.listInventoryUnits)
router.post('/units',                          canAccessPOS3, ctrl.createInventoryUnit)

// ── Par Levels ────────────────────────────────────────────────────
router.get('/par-levels',                      ctrl.listParLevelProfiles)
router.post('/par-levels',                     canAccessPOS3, ctrl.createParLevelProfile)
router.patch('/par-levels/:profileId',         canAccessPOS3, ctrl.updateParLevelProfile)

// ── Reorder Rules ─────────────────────────────────────────────────
router.get('/reorder-rules',                   ctrl.listReorderRuleProfiles)
router.post('/reorder-rules',                  canAccessPOS3, ctrl.createReorderRuleProfile)
router.patch('/reorder-rules/:profileId',      canAccessPOS3, ctrl.updateReorderRuleProfile)

// ── Low Stock Rules ───────────────────────────────────────────────
router.get('/low-stock-rules',                 ctrl.listLowStockRuleProfiles)
router.post('/low-stock-rules',                canAccessPOS3, ctrl.createLowStockRuleProfile)
router.patch('/low-stock-rules/:profileId',    canAccessPOS3, ctrl.updateLowStockRuleProfile)

// ── Count Sessions ────────────────────────────────────────────────
router.get('/count-sessions',                  ctrl.listCountSessions)
router.post('/count-sessions',                 canAccessPOS3, ctrl.createCountSession)
router.get('/count-sessions/:sessionId',       ctrl.getCountSession)
router.get('/count-session-items',             ctrl.listCountSessionItems)
router.post('/count-session-items',            canAccessPOS3, ctrl.createCountSessionItem)

// ── Adjustments / Transfers / Waste ───────────────────────────────
router.get('/adjustments',                     ctrl.listAdjustmentRecords)
router.post('/adjustments',                    canAccessPOS3, ctrl.createAdjustmentRecord)
router.get('/transfers',                       ctrl.listTransferRecords)
router.post('/transfers',                      canAccessPOS3, ctrl.createTransferRecord)
router.get('/waste-spoilage',                  ctrl.listWasteSpoilageRecords)
router.post('/waste-spoilage',                 canAccessPOS3, ctrl.createWasteSpoilageRecord)

// ── Vendors ───────────────────────────────────────────────────────
router.get('/vendors',                         ctrl.listVendors)
router.post('/vendors',                        canAccessPOS3, ctrl.createVendor)
router.patch('/vendors/:vendorId',             canAccessPOS3, ctrl.updateVendor)

// ── Vendor Catalogs ───────────────────────────────────────────────
router.get('/vendor-catalog-profiles',         ctrl.listVendorCatalogProfiles)
router.post('/vendor-catalog-profiles',        canAccessPOS3, ctrl.createVendorCatalogProfile)
router.get('/vendor-catalog-items',            ctrl.listVendorCatalogItems)
router.post('/vendor-catalog-items',           canAccessPOS3, ctrl.createVendorCatalogItem)

// ── Vendor Order Previews ─────────────────────────────────────────
router.get('/vendor-order-previews',           ctrl.listVendorOrderPreviews)
router.post('/vendor-order-previews',          canAccessPOS3, ctrl.createVendorOrderPreview)
router.get('/vendor-order-approvals',          ctrl.listVendorOrderApprovalRequests)
router.post('/vendor-order-approvals',         canAccessPOS3, ctrl.createVendorOrderApprovalRequest)

// ── Purchase Order Previews ───────────────────────────────────────
router.get('/purchase-order-previews',         ctrl.listPurchaseOrderPreviews)
router.post('/purchase-order-previews',        canAccessPOS3, ctrl.createPurchaseOrderPreview)

// ── Import / Export ───────────────────────────────────────────────
router.get('/import-profiles',                 ctrl.listInventoryImportProfiles)
router.post('/import-profiles',                canAccessPOS3, ctrl.createInventoryImportProfile)
router.get('/import-templates',                ctrl.listInventoryImportTemplates)
router.post('/import-templates',               canAccessPOS3, ctrl.createInventoryImportTemplate)
router.get('/import-batches',                  ctrl.listInventoryImportBatches)
router.post('/import-batches',                 canAccessPOS3, ctrl.createInventoryImportBatch)
router.get('/import-batch-items',              ctrl.listInventoryImportBatchItems)
router.post('/import-batch-items',             canAccessPOS3, ctrl.createInventoryImportBatchItem)
router.get('/export-profiles',                 ctrl.listInventoryExportProfiles)
router.post('/export-profiles',                canAccessPOS3, ctrl.createInventoryExportProfile)

// ── External POS Signal Mapping ───────────────────────────────────
router.get('/external-pos-signal-mappings',    ctrl.listExternalPOSInventorySignalMappings)
router.post('/external-pos-signal-mappings',   canAccessPOS3, ctrl.createExternalPOSInventorySignalMapping)

// ── Area Mappings ─────────────────────────────────────────────────
router.get('/humidor-mappings',                ctrl.listHumidorMappings)
router.post('/humidor-mappings',               canAccessPOS3, ctrl.createHumidorMapping)
router.get('/bar-mappings',                    ctrl.listBarMappings)
router.post('/bar-mappings',                   canAccessPOS3, ctrl.createBarMapping)
router.get('/kitchen-mappings',                ctrl.listKitchenMappings)
router.post('/kitchen-mappings',               canAccessPOS3, ctrl.createKitchenMapping)
router.get('/retail-mappings',                 ctrl.listRetailMappings)
router.post('/retail-mappings',                canAccessPOS3, ctrl.createRetailMapping)
router.get('/menu-ingredient-mappings',        ctrl.listMenuIngredientMappings)
router.post('/menu-ingredient-mappings',       canAccessPOS3, ctrl.createMenuIngredientMapping)
router.get('/recipe-mappings',                 ctrl.listRecipeMappings)
router.post('/recipe-mappings',                canAccessPOS3, ctrl.createRecipeMapping)

// ── COGS / Shrinkage ──────────────────────────────────────────────
router.get('/cogs-profiles',                   ctrl.listCOGSProfiles)
router.post('/cogs-profiles',                  canAccessPOS3, ctrl.createCOGSProfile)
router.get('/shrinkage-profiles',              ctrl.listShrinkageProfiles)
router.post('/shrinkage-profiles',             canAccessPOS3, ctrl.createShrinkageProfile)

// ── Alert Rules / Previews ────────────────────────────────────────
router.get('/alert-rules',                     ctrl.listInventoryAlertRules)
router.post('/alert-rules',                    canAccessPOS3, ctrl.createInventoryAlertRule)
router.get('/alert-previews',                  ctrl.listInventoryAlertPreviews)
router.post('/alert-previews',                 canAccessPOS3, ctrl.createInventoryAlertPreview)

// ── Live Sync ─────────────────────────────────────────────────────
router.get('/live-sync-requests',              ctrl.listLiveSyncRequests)
router.post('/live-sync-requests',             canAccessPOS3, ctrl.createLiveSyncRequest)
router.post('/live-sync-requests/:requestId/approve-preview', canAccessPOS3, ctrl.approveLiveSyncRequestPreviewOnly)
router.get('/live-sync-lock/:areaKey',         ctrl.getLiveSyncLockStatus)

// ── Tenant / Module Mapping ───────────────────────────────────────
router.get('/tenant-mapping',                  ctrl.getTenantInventoryMapping)
router.post('/tenant-mapping',                 canAccessPOS3, ctrl.createTenantInventoryMapping)
router.get('/module-mapping/:moduleKey',       ctrl.getModuleInventoryMapping)
router.post('/module-mapping',                 canAccessPOS3, ctrl.createModuleInventoryMapping)

// ── Compliance / Risk / Audit ─────────────────────────────────────
router.get('/compliance-checklist',            ctrl.listComplianceChecklist)
router.patch('/compliance-checklist/:itemId',  canAccessPOS3, ctrl.updateComplianceChecklistItem)
router.get('/risk-flags',                      ctrl.listRiskFlags)
router.post('/risk-flags',                     canAccessPOS3, ctrl.createRiskFlag)
router.get('/audit',                           ctrl.listActivationAudit)
router.post('/audit',                          canAccessPOS3, ctrl.writeActivationAudit)

// ── Readiness Summary ─────────────────────────────────────────────
router.get('/readiness-summary',               ctrl.getInventoryReadinessSummary)

export default router
