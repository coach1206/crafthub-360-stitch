/**
 * Phase D.4 — Inventory Activation Controller
 * contains_secrets: false
 */

import * as svc from '../services/phaseD/phaseDInventoryActivationService.js'

const ok500 = (res, fn) => fn().catch(e => res.status(500).json({ ok: false, error: e.message }))
const actorId = req => req.user?.id || req.headers['x-actor-id'] || 'system'
const ikey = req => req.headers['x-idempotency-key'] || req.body?.idempotencyKey
const tenantId = req => req.query.tenant_id || req.body?.tenant_id || req.user?.tenant_id || null

export const listInventoryAreas = (req, res) => ok500(res, async () => res.json(await svc.listInventoryAreas(tenantId(req))))
export const getInventoryArea = (req, res) => ok500(res, async () => res.json(await svc.getInventoryArea(tenantId(req), req.params.areaKey)))
export const getInventoryAreaStatus = (req, res) => ok500(res, async () => res.json(await svc.getInventoryAreaStatus(tenantId(req), req.params.areaKey)))
export const updateInventoryAreaStatus = (req, res) => ok500(res, async () => res.json(await svc.updateInventoryAreaStatus(tenantId(req), req.params.areaKey, req.body, actorId(req))))

export const listInventoryLocations = (req, res) => ok500(res, async () => res.json(await svc.listInventoryLocations(tenantId(req))))
export const createInventoryLocation = (req, res) => ok500(res, async () => res.json(await svc.createInventoryLocation(tenantId(req), req.body, actorId(req), ikey(req))))
export const updateInventoryLocation = (req, res) => ok500(res, async () => res.json(await svc.updateInventoryLocation(tenantId(req), req.params.locationId, req.body)))

export const listStorageZones = (req, res) => ok500(res, async () => res.json(await svc.listStorageZones(tenantId(req))))
export const createStorageZone = (req, res) => ok500(res, async () => res.json(await svc.createStorageZone(tenantId(req), req.body, actorId(req), ikey(req))))
export const updateStorageZone = (req, res) => ok500(res, async () => res.json(await svc.updateStorageZone(tenantId(req), req.params.zoneId, req.body)))

export const listInventoryItems = (req, res) => ok500(res, async () => res.json(await svc.listInventoryItems(tenantId(req))))
export const createInventoryItem = (req, res) => ok500(res, async () => res.json(await svc.createInventoryItem(tenantId(req), req.body, actorId(req), ikey(req))))
export const updateInventoryItem = (req, res) => ok500(res, async () => res.json(await svc.updateInventoryItem(tenantId(req), req.params.itemId, req.body)))

export const listInventoryItemCategories = (req, res) => ok500(res, async () => res.json(await svc.listInventoryItemCategories(tenantId(req))))
export const createInventoryItemCategory = (req, res) => ok500(res, async () => res.json(await svc.createInventoryItemCategory(tenantId(req), req.body, actorId(req), ikey(req))))

export const listInventoryItemVariants = (req, res) => ok500(res, async () => res.json(await svc.listInventoryItemVariants(tenantId(req))))
export const createInventoryItemVariant = (req, res) => ok500(res, async () => res.json(await svc.createInventoryItemVariant(tenantId(req), req.body, actorId(req), ikey(req))))

export const listInventoryUnits = (req, res) => ok500(res, async () => res.json(await svc.listInventoryUnits(tenantId(req))))
export const createInventoryUnit = (req, res) => ok500(res, async () => res.json(await svc.createInventoryUnit(tenantId(req), req.body, actorId(req), ikey(req))))

export const listParLevelProfiles = (req, res) => ok500(res, async () => res.json(await svc.listParLevelProfiles(tenantId(req))))
export const createParLevelProfile = (req, res) => ok500(res, async () => res.json(await svc.createParLevelProfile(tenantId(req), req.body, actorId(req), ikey(req))))
export const updateParLevelProfile = (req, res) => ok500(res, async () => res.json(await svc.updateParLevelProfile(tenantId(req), req.params.profileId, req.body)))

export const listReorderRuleProfiles = (req, res) => ok500(res, async () => res.json(await svc.listReorderRuleProfiles(tenantId(req))))
export const createReorderRuleProfile = (req, res) => ok500(res, async () => res.json(await svc.createReorderRuleProfile(tenantId(req), req.body, actorId(req), ikey(req))))
export const updateReorderRuleProfile = (req, res) => ok500(res, async () => res.json(await svc.updateReorderRuleProfile(tenantId(req), req.params.profileId, req.body)))

export const listLowStockRuleProfiles = (req, res) => ok500(res, async () => res.json(await svc.listLowStockRuleProfiles(tenantId(req))))
export const createLowStockRuleProfile = (req, res) => ok500(res, async () => res.json(await svc.createLowStockRuleProfile(tenantId(req), req.body, actorId(req), ikey(req))))
export const updateLowStockRuleProfile = (req, res) => ok500(res, async () => res.json(await svc.updateLowStockRuleProfile(tenantId(req), req.params.profileId, req.body)))

export const listCountSessions = (req, res) => ok500(res, async () => res.json(await svc.listCountSessions(tenantId(req))))
export const createCountSession = (req, res) => ok500(res, async () => res.json(await svc.createCountSession(tenantId(req), req.body, actorId(req), ikey(req))))
export const getCountSession = (req, res) => ok500(res, async () => res.json(await svc.getCountSession(tenantId(req), req.params.sessionId)))

export const listCountSessionItems = (req, res) => ok500(res, async () => res.json(await svc.listCountSessionItems(tenantId(req))))
export const createCountSessionItem = (req, res) => ok500(res, async () => res.json(await svc.createCountSessionItem(tenantId(req), req.body, actorId(req), ikey(req))))

export const listAdjustmentRecords = (req, res) => ok500(res, async () => res.json(await svc.listAdjustmentRecords(tenantId(req))))
export const createAdjustmentRecord = (req, res) => ok500(res, async () => res.json(await svc.createAdjustmentRecord(tenantId(req), req.body, actorId(req), ikey(req))))

export const listTransferRecords = (req, res) => ok500(res, async () => res.json(await svc.listTransferRecords(tenantId(req))))
export const createTransferRecord = (req, res) => ok500(res, async () => res.json(await svc.createTransferRecord(tenantId(req), req.body, actorId(req), ikey(req))))

export const listWasteSpoilageRecords = (req, res) => ok500(res, async () => res.json(await svc.listWasteSpoilageRecords(tenantId(req))))
export const createWasteSpoilageRecord = (req, res) => ok500(res, async () => res.json(await svc.createWasteSpoilageRecord(tenantId(req), req.body, actorId(req), ikey(req))))

export const listVendors = (req, res) => ok500(res, async () => res.json(await svc.listVendors(tenantId(req))))
export const createVendor = (req, res) => ok500(res, async () => res.json(await svc.createVendor(tenantId(req), req.body, actorId(req), ikey(req))))
export const updateVendor = (req, res) => ok500(res, async () => res.json(await svc.updateVendor(tenantId(req), req.params.vendorId, req.body)))

export const listVendorCatalogProfiles = (req, res) => ok500(res, async () => res.json(await svc.listVendorCatalogProfiles(tenantId(req))))
export const createVendorCatalogProfile = (req, res) => ok500(res, async () => res.json(await svc.createVendorCatalogProfile(tenantId(req), req.body, actorId(req), ikey(req))))

export const listVendorCatalogItems = (req, res) => ok500(res, async () => res.json(await svc.listVendorCatalogItems(tenantId(req))))
export const createVendorCatalogItem = (req, res) => ok500(res, async () => res.json(await svc.createVendorCatalogItem(tenantId(req), req.body, actorId(req), ikey(req))))

export const listVendorOrderPreviews = (req, res) => ok500(res, async () => res.json(await svc.listVendorOrderPreviews(tenantId(req))))
export const createVendorOrderPreview = (req, res) => ok500(res, async () => res.json(await svc.createVendorOrderPreview(tenantId(req), req.body, actorId(req), ikey(req))))

export const listVendorOrderApprovalRequests = (req, res) => ok500(res, async () => res.json(await svc.listVendorOrderApprovalRequests(tenantId(req))))
export const createVendorOrderApprovalRequest = (req, res) => ok500(res, async () => res.json(await svc.createVendorOrderApprovalRequest(tenantId(req), req.body, actorId(req), ikey(req))))

export const listPurchaseOrderPreviews = (req, res) => ok500(res, async () => res.json(await svc.listPurchaseOrderPreviews(tenantId(req))))
export const createPurchaseOrderPreview = (req, res) => ok500(res, async () => res.json(await svc.createPurchaseOrderPreview(tenantId(req), req.body, actorId(req), ikey(req))))

export const listInventoryImportProfiles = (req, res) => ok500(res, async () => res.json(await svc.listInventoryImportProfiles(tenantId(req))))
export const createInventoryImportProfile = (req, res) => ok500(res, async () => res.json(await svc.createInventoryImportProfile(tenantId(req), req.body, actorId(req), ikey(req))))

export const listInventoryImportTemplates = (req, res) => ok500(res, async () => res.json(await svc.listInventoryImportTemplates(tenantId(req))))
export const createInventoryImportTemplate = (req, res) => ok500(res, async () => res.json(await svc.createInventoryImportTemplate(tenantId(req), req.body, actorId(req), ikey(req))))

export const listInventoryImportBatches = (req, res) => ok500(res, async () => res.json(await svc.listInventoryImportBatches(tenantId(req))))
export const createInventoryImportBatch = (req, res) => ok500(res, async () => res.json(await svc.createInventoryImportBatch(tenantId(req), req.body, actorId(req), ikey(req))))

export const listInventoryImportBatchItems = (req, res) => ok500(res, async () => res.json(await svc.listInventoryImportBatchItems(tenantId(req))))
export const createInventoryImportBatchItem = (req, res) => ok500(res, async () => res.json(await svc.createInventoryImportBatchItem(tenantId(req), req.body, actorId(req), ikey(req))))

export const listInventoryExportProfiles = (req, res) => ok500(res, async () => res.json(await svc.listInventoryExportProfiles(tenantId(req))))
export const createInventoryExportProfile = (req, res) => ok500(res, async () => res.json(await svc.createInventoryExportProfile(tenantId(req), req.body, actorId(req), ikey(req))))

export const listExternalPOSInventorySignalMappings = (req, res) => ok500(res, async () => res.json(await svc.listExternalPOSInventorySignalMappings(tenantId(req))))
export const createExternalPOSInventorySignalMapping = (req, res) => ok500(res, async () => res.json(await svc.createExternalPOSInventorySignalMapping(tenantId(req), req.body, actorId(req), ikey(req))))

export const listHumidorMappings = (req, res) => ok500(res, async () => res.json(await svc.listHumidorMappings(tenantId(req))))
export const createHumidorMapping = (req, res) => ok500(res, async () => res.json(await svc.createHumidorMapping(tenantId(req), req.body, actorId(req), ikey(req))))

export const listBarMappings = (req, res) => ok500(res, async () => res.json(await svc.listBarMappings(tenantId(req))))
export const createBarMapping = (req, res) => ok500(res, async () => res.json(await svc.createBarMapping(tenantId(req), req.body, actorId(req), ikey(req))))

export const listKitchenMappings = (req, res) => ok500(res, async () => res.json(await svc.listKitchenMappings(tenantId(req))))
export const createKitchenMapping = (req, res) => ok500(res, async () => res.json(await svc.createKitchenMapping(tenantId(req), req.body, actorId(req), ikey(req))))

export const listRetailMappings = (req, res) => ok500(res, async () => res.json(await svc.listRetailMappings(tenantId(req))))
export const createRetailMapping = (req, res) => ok500(res, async () => res.json(await svc.createRetailMapping(tenantId(req), req.body, actorId(req), ikey(req))))

export const listMenuIngredientMappings = (req, res) => ok500(res, async () => res.json(await svc.listMenuIngredientMappings(tenantId(req))))
export const createMenuIngredientMapping = (req, res) => ok500(res, async () => res.json(await svc.createMenuIngredientMapping(tenantId(req), req.body, actorId(req), ikey(req))))

export const listRecipeMappings = (req, res) => ok500(res, async () => res.json(await svc.listRecipeMappings(tenantId(req))))
export const createRecipeMapping = (req, res) => ok500(res, async () => res.json(await svc.createRecipeMapping(tenantId(req), req.body, actorId(req), ikey(req))))

export const listCOGSProfiles = (req, res) => ok500(res, async () => res.json(await svc.listCOGSProfiles(tenantId(req))))
export const createCOGSProfile = (req, res) => ok500(res, async () => res.json(await svc.createCOGSProfile(tenantId(req), req.body, actorId(req), ikey(req))))

export const listShrinkageProfiles = (req, res) => ok500(res, async () => res.json(await svc.listShrinkageProfiles(tenantId(req))))
export const createShrinkageProfile = (req, res) => ok500(res, async () => res.json(await svc.createShrinkageProfile(tenantId(req), req.body, actorId(req), ikey(req))))

export const listInventoryAlertRules = (req, res) => ok500(res, async () => res.json(await svc.listInventoryAlertRules(tenantId(req))))
export const createInventoryAlertRule = (req, res) => ok500(res, async () => res.json(await svc.createInventoryAlertRule(tenantId(req), req.body, actorId(req), ikey(req))))

export const listInventoryAlertPreviews = (req, res) => ok500(res, async () => res.json(await svc.listInventoryAlertPreviews(tenantId(req))))
export const createInventoryAlertPreview = (req, res) => ok500(res, async () => res.json(await svc.createInventoryAlertPreview(tenantId(req), req.body, actorId(req), ikey(req))))

export const listLiveSyncRequests = (req, res) => ok500(res, async () => res.json(await svc.listLiveSyncRequests(tenantId(req))))
export const createLiveSyncRequest = (req, res) => ok500(res, async () => res.json(await svc.createLiveSyncRequest(tenantId(req), req.body, actorId(req), ikey(req))))
export const approveLiveSyncRequestPreviewOnly = (req, res) => ok500(res, async () => res.json(await svc.approveLiveSyncRequestPreviewOnly(tenantId(req), req.params.requestId, actorId(req))))
export const getLiveSyncLockStatus = (req, res) => ok500(res, async () => res.json(await svc.getLiveSyncLockStatus(tenantId(req), req.params.areaKey)))

export const getTenantInventoryMapping = (req, res) => ok500(res, async () => res.json(await svc.getTenantInventoryMapping(tenantId(req))))
export const createTenantInventoryMapping = (req, res) => ok500(res, async () => res.json(await svc.createTenantInventoryMapping(tenantId(req), req.body, actorId(req), ikey(req))))

export const getModuleInventoryMapping = (req, res) => ok500(res, async () => res.json(await svc.getModuleInventoryMapping(tenantId(req), req.params.moduleKey)))
export const createModuleInventoryMapping = (req, res) => ok500(res, async () => res.json(await svc.createModuleInventoryMapping(tenantId(req), req.body, actorId(req), ikey(req))))

export const listComplianceChecklist = (req, res) => ok500(res, async () => res.json(await svc.listComplianceChecklist(tenantId(req))))
export const updateComplianceChecklistItem = (req, res) => ok500(res, async () => res.json(await svc.updateComplianceChecklistItem(tenantId(req), req.params.itemId, req.body)))

export const listRiskFlags = (req, res) => ok500(res, async () => res.json(await svc.listRiskFlags(tenantId(req))))
export const createRiskFlag = (req, res) => ok500(res, async () => res.json(await svc.createRiskFlag(tenantId(req), req.body, actorId(req), ikey(req))))

export const listActivationAudit = (req, res) => ok500(res, async () => res.json(await svc.listActivationAudit(tenantId(req))))
export const writeActivationAudit = (req, res) => ok500(res, async () => res.json(await svc.writeActivationAudit(tenantId(req), req.body, actorId(req), ikey(req))))

export const getInventoryReadinessSummary = (req, res) => ok500(res, async () => res.json(await svc.getInventoryReadinessSummary(tenantId(req))))
