// platformAdminGuardRequired = true on all write routes
// contains_secrets: false, stores_secrets: false

import { Router } from 'express';
import { canAccessPOS3 } from '../middleware/roleMiddleware.js';
import * as ctrl from '../controllers/phaseDExternalPOSActivationController.js';

const router = Router();

// Provider Registry
router.get('/providers',                              ctrl.listExternalPOSProviders);
router.get('/providers/:providerKey',                 ctrl.getExternalPOSProvider);
router.get('/providers/:providerKey/status',          ctrl.getExternalPOSProviderStatus);
router.get('/providers/:providerKey/capabilities',    ctrl.getExternalPOSCapabilities);
router.get('/modes',                                  ctrl.getExternalPOSModes);

// Credentials
router.get('/credentials/:providerKey',               ctrl.getExternalPOSCredentialPresenceStatus);
router.post('/credentials',                           canAccessPOS3, ctrl.recordExternalPOSCredentialPresenceStatus);

// Companion Mode
router.get('/companion-profiles',                     ctrl.listCompanionModeProfiles);
router.post('/companion-profiles',                    canAccessPOS3, ctrl.createCompanionModeProfile);
router.patch('/companion-profiles/:id',               canAccessPOS3, ctrl.updateCompanionModeProfile);

// Import Profiles
router.get('/import-profiles',                        ctrl.listImportProfiles);
router.post('/import-profiles',                       canAccessPOS3, ctrl.createImportProfile);
router.patch('/import-profiles/:id',                  canAccessPOS3, ctrl.updateImportProfile);

// CSV Templates
router.get('/csv-templates',                          ctrl.listCSVImportTemplates);
router.post('/csv-templates',                         canAccessPOS3, ctrl.createCSVImportTemplate);
router.patch('/csv-templates/:id',                    canAccessPOS3, ctrl.updateCSVImportTemplate);

// Import Batches
router.get('/import-batches',                         ctrl.listImportBatches);
router.get('/import-batches/:id',                     ctrl.getImportBatch);
router.post('/import-batches',                        canAccessPOS3, ctrl.createImportBatch);
router.get('/import-batches/:batchId/items',          ctrl.listImportBatchItems);
router.post('/import-batches/:batchId/items',         canAccessPOS3, ctrl.createImportBatchItem);

// Manual Mapping Profiles
router.get('/mapping-profiles',                       ctrl.listManualMappingProfiles);
router.post('/mapping-profiles',                      canAccessPOS3, ctrl.createManualMappingProfile);
router.patch('/mapping-profiles/:id',                 canAccessPOS3, ctrl.updateManualMappingProfile);

// Menu Mappings
router.get('/mappings/menu-categories',               ctrl.listMenuCategoryMappings);
router.post('/mappings/menu-categories',              canAccessPOS3, ctrl.createMenuCategoryMapping);
router.get('/mappings/menu-items',                    ctrl.listMenuItemMappings);
router.post('/mappings/menu-items',                   canAccessPOS3, ctrl.createMenuItemMapping);
router.get('/mappings/modifiers',                     ctrl.listModifierMappings);
router.post('/mappings/modifiers',                    canAccessPOS3, ctrl.createModifierMapping);

// Financial Mappings
router.get('/mappings/taxes',                         ctrl.listTaxMappings);
router.post('/mappings/taxes',                        canAccessPOS3, ctrl.createTaxMapping);
router.get('/mappings/tips',                          ctrl.listTipMappings);
router.post('/mappings/tips',                         canAccessPOS3, ctrl.createTipMapping);
router.get('/mappings/payment-types',                 ctrl.listPaymentTypeMappings);
router.post('/mappings/payment-types',                canAccessPOS3, ctrl.createPaymentTypeMapping);

// Operational Mappings
router.get('/mappings/staff-roles',                   ctrl.listStaffRoleMappings);
router.post('/mappings/staff-roles',                  canAccessPOS3, ctrl.createStaffRoleMapping);
router.get('/mappings/table-sections',                ctrl.listTableSectionMappings);
router.post('/mappings/table-sections',               canAccessPOS3, ctrl.createTableSectionMapping);
router.get('/mappings/revenue-centers',               ctrl.listRevenueCenterMappings);
router.post('/mappings/revenue-centers',              canAccessPOS3, ctrl.createRevenueCenterMapping);
router.get('/mappings/departments',                   ctrl.listDepartmentMappings);
router.post('/mappings/departments',                  canAccessPOS3, ctrl.createDepartmentMapping);

// Inventory / Venue Mappings
router.get('/mappings/inventory-signals',             ctrl.listInventorySignalMappings);
router.post('/mappings/inventory-signals',            canAccessPOS3, ctrl.createInventorySignalMapping);
router.get('/mappings/humidor',                       ctrl.listHumidorMappings);
router.post('/mappings/humidor',                      canAccessPOS3, ctrl.createHumidorMapping);
router.get('/mappings/bar',                           ctrl.listBarMappings);
router.post('/mappings/bar',                          canAccessPOS3, ctrl.createBarMapping);
router.get('/mappings/kitchen',                       ctrl.listKitchenMappings);
router.post('/mappings/kitchen',                      canAccessPOS3, ctrl.createKitchenMapping);

// Flow Mappings
router.get('/mappings/order-flows',                   ctrl.listOrderFlowMappings);
router.post('/mappings/order-flows',                  canAccessPOS3, ctrl.createOrderFlowMapping);
router.get('/mappings/ticket-flows',                  ctrl.listTicketFlowMappings);
router.post('/mappings/ticket-flows',                 canAccessPOS3, ctrl.createTicketFlowMapping);
router.get('/mappings/closeouts',                     ctrl.listCloseoutMappings);
router.post('/mappings/closeouts',                    canAccessPOS3, ctrl.createCloseoutMapping);
router.get('/mappings/reports',                       ctrl.listReportMappings);
router.post('/mappings/reports',                      canAccessPOS3, ctrl.createReportMapping);

// API Contract Registry
router.get('/api-contracts',                          ctrl.listAPIContractRegistry);
router.post('/api-contracts',                         canAccessPOS3, ctrl.createAPIContractRegistryEntry);

// Webhook Registry
router.get('/webhooks',                               ctrl.listWebhookRegistry);
router.post('/webhooks',                              canAccessPOS3, ctrl.createWebhookRegistryEntry);
router.get('/webhooks/:providerKey/health',           ctrl.getWebhookHealth);
router.post('/webhooks/health',                       canAccessPOS3, ctrl.updateWebhookHealth);

// Live Mode Requests
router.get('/live-mode-requests',                     ctrl.listLiveModeRequests);
router.post('/live-mode-requests',                    canAccessPOS3, ctrl.createLiveModeRequest);
router.patch('/live-mode-requests/:requestId/approve-preview', canAccessPOS3, ctrl.approveLiveModeRequestPreviewOnly);
router.get('/live-mode-lock/:providerKey',            ctrl.getLiveModeLockStatus);

// Tenant and Module Mapping
router.get('/tenant-mapping/:tenantId',               ctrl.getTenantExternalPOSMapping);
router.post('/tenant-mapping',                        canAccessPOS3, ctrl.createTenantExternalPOSMapping);
router.get('/module-mapping/:moduleKey',              ctrl.getModuleExternalPOSMapping);
router.post('/module-mapping',                        canAccessPOS3, ctrl.createModuleExternalPOSMapping);

// Compliance
router.get('/compliance',                             ctrl.listComplianceChecklist);
router.post('/compliance',                            canAccessPOS3, ctrl.updateComplianceChecklistItem);

// Risk Flags
router.get('/risk-flags',                             ctrl.listRiskFlags);
router.post('/risk-flags',                            canAccessPOS3, ctrl.createRiskFlag);

// Audit
router.get('/audit',                                  ctrl.listActivationAudit);
router.post('/audit',                                 canAccessPOS3, ctrl.writeActivationAudit);

// Readiness Summary
router.get('/readiness-summary',                      ctrl.getExternalPOSReadinessSummary);

export default router;
