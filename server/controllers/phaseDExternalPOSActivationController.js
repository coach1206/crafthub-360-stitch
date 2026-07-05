// contains_secrets: false, stores_secrets: false

import * as svc from '../services/phaseD/phaseDExternalPOSActivationService.js';

const ok500 = (res, fn) => fn().catch(e => res.status(500).json({ ok: false, error: e.message }));
const actorId = req => req.user?.id || req.headers['x-actor-id'] || 'system';
const ikey = req => req.headers['x-idempotency-key'] || req.body?.idempotencyKey;

export const listExternalPOSProviders              = (req, res) => ok500(res, async () => res.json(await svc.listExternalPOSProviders()));
export const getExternalPOSProvider                = (req, res) => ok500(res, async () => res.json(await svc.getExternalPOSProvider(req.params.providerKey)));
export const getExternalPOSProviderStatus          = (req, res) => ok500(res, async () => res.json(await svc.getExternalPOSProviderStatus(req.params.providerKey)));
export const getExternalPOSModes                   = (req, res) => ok500(res, async () => res.json(await svc.getExternalPOSModes()));
export const getExternalPOSCapabilities            = (req, res) => ok500(res, async () => res.json(await svc.getExternalPOSCapabilities(req.params.providerKey)));

export const getExternalPOSCredentialPresenceStatus = (req, res) => ok500(res, async () => res.json(await svc.getExternalPOSCredentialPresenceStatus(req.params.providerKey)));
export const recordExternalPOSCredentialPresenceStatus = (req, res) => ok500(res, async () => res.json(await svc.recordExternalPOSCredentialPresenceStatus(req.body, actorId(req), ikey(req))));

export const listCompanionModeProfiles             = (req, res) => ok500(res, async () => res.json(await svc.listCompanionModeProfiles(req.query)));
export const createCompanionModeProfile            = (req, res) => ok500(res, async () => res.json(await svc.createCompanionModeProfile(req.body, actorId(req), ikey(req))));
export const updateCompanionModeProfile            = (req, res) => ok500(res, async () => res.json(await svc.updateCompanionModeProfile(req.params.id, req.body, actorId(req))));

export const listImportProfiles                    = (req, res) => ok500(res, async () => res.json(await svc.listImportProfiles(req.query)));
export const createImportProfile                   = (req, res) => ok500(res, async () => res.json(await svc.createImportProfile(req.body, actorId(req), ikey(req))));
export const updateImportProfile                   = (req, res) => ok500(res, async () => res.json(await svc.updateImportProfile(req.params.id, req.body, actorId(req))));

export const listCSVImportTemplates                = (req, res) => ok500(res, async () => res.json(await svc.listCSVImportTemplates(req.query)));
export const createCSVImportTemplate               = (req, res) => ok500(res, async () => res.json(await svc.createCSVImportTemplate(req.body, actorId(req), ikey(req))));
export const updateCSVImportTemplate               = (req, res) => ok500(res, async () => res.json(await svc.updateCSVImportTemplate(req.params.id, req.body, actorId(req))));

export const createImportBatch                     = (req, res) => ok500(res, async () => res.json(await svc.createImportBatch(req.body, actorId(req), ikey(req))));
export const listImportBatches                     = (req, res) => ok500(res, async () => res.json(await svc.listImportBatches(req.query)));
export const getImportBatch                        = (req, res) => ok500(res, async () => res.json(await svc.getImportBatch(req.params.id)));
export const createImportBatchItem                 = (req, res) => ok500(res, async () => res.json(await svc.createImportBatchItem(req.body, actorId(req))));
export const listImportBatchItems                  = (req, res) => ok500(res, async () => res.json(await svc.listImportBatchItems(req.params.batchId)));

export const listManualMappingProfiles             = (req, res) => ok500(res, async () => res.json(await svc.listManualMappingProfiles(req.query)));
export const createManualMappingProfile            = (req, res) => ok500(res, async () => res.json(await svc.createManualMappingProfile(req.body, actorId(req), ikey(req))));
export const updateManualMappingProfile            = (req, res) => ok500(res, async () => res.json(await svc.updateManualMappingProfile(req.params.id, req.body, actorId(req))));

export const createMenuCategoryMapping             = (req, res) => ok500(res, async () => res.json(await svc.createMenuCategoryMapping(req.body, actorId(req), ikey(req))));
export const listMenuCategoryMappings              = (req, res) => ok500(res, async () => res.json(await svc.listMenuCategoryMappings(req.query)));
export const createMenuItemMapping                 = (req, res) => ok500(res, async () => res.json(await svc.createMenuItemMapping(req.body, actorId(req), ikey(req))));
export const listMenuItemMappings                  = (req, res) => ok500(res, async () => res.json(await svc.listMenuItemMappings(req.query)));
export const createModifierMapping                 = (req, res) => ok500(res, async () => res.json(await svc.createModifierMapping(req.body, actorId(req), ikey(req))));
export const listModifierMappings                  = (req, res) => ok500(res, async () => res.json(await svc.listModifierMappings(req.query)));
export const createTaxMapping                      = (req, res) => ok500(res, async () => res.json(await svc.createTaxMapping(req.body, actorId(req), ikey(req))));
export const listTaxMappings                       = (req, res) => ok500(res, async () => res.json(await svc.listTaxMappings(req.query)));
export const createTipMapping                      = (req, res) => ok500(res, async () => res.json(await svc.createTipMapping(req.body, actorId(req), ikey(req))));
export const listTipMappings                       = (req, res) => ok500(res, async () => res.json(await svc.listTipMappings(req.query)));
export const createPaymentTypeMapping              = (req, res) => ok500(res, async () => res.json(await svc.createPaymentTypeMapping(req.body, actorId(req), ikey(req))));
export const listPaymentTypeMappings               = (req, res) => ok500(res, async () => res.json(await svc.listPaymentTypeMappings(req.query)));
export const createStaffRoleMapping                = (req, res) => ok500(res, async () => res.json(await svc.createStaffRoleMapping(req.body, actorId(req), ikey(req))));
export const listStaffRoleMappings                 = (req, res) => ok500(res, async () => res.json(await svc.listStaffRoleMappings(req.query)));
export const createTableSectionMapping             = (req, res) => ok500(res, async () => res.json(await svc.createTableSectionMapping(req.body, actorId(req), ikey(req))));
export const listTableSectionMappings              = (req, res) => ok500(res, async () => res.json(await svc.listTableSectionMappings(req.query)));
export const createRevenueCenterMapping            = (req, res) => ok500(res, async () => res.json(await svc.createRevenueCenterMapping(req.body, actorId(req), ikey(req))));
export const listRevenueCenterMappings             = (req, res) => ok500(res, async () => res.json(await svc.listRevenueCenterMappings(req.query)));
export const createDepartmentMapping               = (req, res) => ok500(res, async () => res.json(await svc.createDepartmentMapping(req.body, actorId(req), ikey(req))));
export const listDepartmentMappings                = (req, res) => ok500(res, async () => res.json(await svc.listDepartmentMappings(req.query)));
export const createInventorySignalMapping          = (req, res) => ok500(res, async () => res.json(await svc.createInventorySignalMapping(req.body, actorId(req), ikey(req))));
export const listInventorySignalMappings           = (req, res) => ok500(res, async () => res.json(await svc.listInventorySignalMappings(req.query)));
export const createHumidorMapping                  = (req, res) => ok500(res, async () => res.json(await svc.createHumidorMapping(req.body, actorId(req), ikey(req))));
export const listHumidorMappings                   = (req, res) => ok500(res, async () => res.json(await svc.listHumidorMappings(req.query)));
export const createBarMapping                      = (req, res) => ok500(res, async () => res.json(await svc.createBarMapping(req.body, actorId(req), ikey(req))));
export const listBarMappings                       = (req, res) => ok500(res, async () => res.json(await svc.listBarMappings(req.query)));
export const createKitchenMapping                  = (req, res) => ok500(res, async () => res.json(await svc.createKitchenMapping(req.body, actorId(req), ikey(req))));
export const listKitchenMappings                   = (req, res) => ok500(res, async () => res.json(await svc.listKitchenMappings(req.query)));
export const createOrderFlowMapping                = (req, res) => ok500(res, async () => res.json(await svc.createOrderFlowMapping(req.body, actorId(req), ikey(req))));
export const listOrderFlowMappings                 = (req, res) => ok500(res, async () => res.json(await svc.listOrderFlowMappings(req.query)));
export const createTicketFlowMapping               = (req, res) => ok500(res, async () => res.json(await svc.createTicketFlowMapping(req.body, actorId(req), ikey(req))));
export const listTicketFlowMappings                = (req, res) => ok500(res, async () => res.json(await svc.listTicketFlowMappings(req.query)));
export const createCloseoutMapping                 = (req, res) => ok500(res, async () => res.json(await svc.createCloseoutMapping(req.body, actorId(req), ikey(req))));
export const listCloseoutMappings                  = (req, res) => ok500(res, async () => res.json(await svc.listCloseoutMappings(req.query)));
export const createReportMapping                   = (req, res) => ok500(res, async () => res.json(await svc.createReportMapping(req.body, actorId(req), ikey(req))));
export const listReportMappings                    = (req, res) => ok500(res, async () => res.json(await svc.listReportMappings(req.query)));

export const listAPIContractRegistry               = (req, res) => ok500(res, async () => res.json(await svc.listAPIContractRegistry(req.query)));
export const createAPIContractRegistryEntry        = (req, res) => ok500(res, async () => res.json(await svc.createAPIContractRegistryEntry(req.body, actorId(req), ikey(req))));

export const listWebhookRegistry                   = (req, res) => ok500(res, async () => res.json(await svc.listWebhookRegistry(req.query)));
export const createWebhookRegistryEntry            = (req, res) => ok500(res, async () => res.json(await svc.createWebhookRegistryEntry(req.body, actorId(req), ikey(req))));
export const updateWebhookHealth                   = (req, res) => ok500(res, async () => res.json(await svc.updateWebhookHealth(req.body, actorId(req))));
export const getWebhookHealth                      = (req, res) => ok500(res, async () => res.json(await svc.getWebhookHealth(req.params.providerKey)));

export const createLiveModeRequest                 = (req, res) => ok500(res, async () => res.json(await svc.createLiveModeRequest(req.body, actorId(req), ikey(req))));
export const listLiveModeRequests                  = (req, res) => ok500(res, async () => res.json(await svc.listLiveModeRequests(req.query)));
export const approveLiveModeRequestPreviewOnly     = (req, res) => ok500(res, async () => res.json(await svc.approveLiveModeRequestPreviewOnly(req.params.requestId, actorId(req))));
export const getLiveModeLockStatus                 = (req, res) => ok500(res, async () => res.json(await svc.getLiveModeLockStatus(req.params.providerKey)));

export const getTenantExternalPOSMapping           = (req, res) => ok500(res, async () => res.json(await svc.getTenantExternalPOSMapping(req.params.tenantId)));
export const createTenantExternalPOSMapping        = (req, res) => ok500(res, async () => res.json(await svc.createTenantExternalPOSMapping(req.body, actorId(req), ikey(req))));
export const getModuleExternalPOSMapping           = (req, res) => ok500(res, async () => res.json(await svc.getModuleExternalPOSMapping(req.params.moduleKey)));
export const createModuleExternalPOSMapping        = (req, res) => ok500(res, async () => res.json(await svc.createModuleExternalPOSMapping(req.body, actorId(req), ikey(req))));

export const listComplianceChecklist               = (req, res) => ok500(res, async () => res.json(await svc.listComplianceChecklist(req.query)));
export const updateComplianceChecklistItem         = (req, res) => ok500(res, async () => res.json(await svc.updateComplianceChecklistItem(req.body, actorId(req), ikey(req))));
export const listRiskFlags                         = (req, res) => ok500(res, async () => res.json(await svc.listRiskFlags(req.query)));
export const createRiskFlag                        = (req, res) => ok500(res, async () => res.json(await svc.createRiskFlag(req.body, actorId(req), ikey(req))));

export const listActivationAudit                   = (req, res) => ok500(res, async () => res.json(await svc.listActivationAudit(req.query)));
export const writeActivationAudit                  = (req, res) => ok500(res, async () => res.json(await svc.writeActivationAudit(req.body, actorId(req), ikey(req))));

export const getExternalPOSReadinessSummary        = (req, res) => ok500(res, async () => res.json(await svc.getExternalPOSReadinessSummary()));
