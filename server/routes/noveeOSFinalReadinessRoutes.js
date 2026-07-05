// Phase C.7 — NOVEE OS Final Readiness Routes
// platformAdminGuardRequired = true on all write routes
// Mounted under /api/novee-os/final-readiness

import { Router } from 'express';
import { canAccessPOS3 } from '../middleware/roleMiddleware.js';
import * as ctrl from '../controllers/noveeOSFinalReadinessController.js';

const router = Router();

// Default (public read)
router.get('/default',                                                    ctrl.getDefaultFinalReadinessDashboard);
router.get('/default/audit-categories',                                   ctrl.getDefaultPlatformAuditCategories);
router.get('/default/module-matrix',                                      ctrl.getDefaultModuleReadinessMatrix);
router.get('/default/safe-claims',                                        ctrl.getDefaultSafeSalesClaims);
router.get('/default/unsafe-claims',                                      ctrl.getDefaultUnsafeSalesClaims);
router.get('/default/blockers',                                           ctrl.getDefaultLaunchBlockers);
router.get('/default/activation-requirements',                            ctrl.getDefaultActivationRequirements);
router.get('/default/phase-completions',                                  ctrl.getDefaultPhaseCompletionRecords);

// Sessions
router.post('/sessions',                           canAccessPOS3,         ctrl.createFinalReadinessSession);
router.get('/sessions',                                                   ctrl.listFinalReadinessSessions);
router.patch('/sessions/:readinessSessionId/status', canAccessPOS3,      ctrl.updateFinalReadinessSessionStatus);

// Checks / results
router.post('/checks',                             canAccessPOS3,         ctrl.createFinalReadinessCheck);
router.get('/checks',                                                     ctrl.listFinalReadinessChecks);
router.post('/results',                            canAccessPOS3,         ctrl.createFinalReadinessResult);
router.get('/results',                                                    ctrl.listFinalReadinessResults);

// Audit
router.post('/audit/categories',                   canAccessPOS3,         ctrl.createPlatformAuditCategory);
router.get('/audit/categories',                                           ctrl.listPlatformAuditCategories);
router.post('/audit/findings',                     canAccessPOS3,         ctrl.createPlatformAuditFinding);
router.get('/audit/findings',                                             ctrl.listPlatformAuditFindings);
router.patch('/audit/findings/:findingId/status',  canAccessPOS3,        ctrl.updatePlatformAuditFindingStatus);

// Blockers
router.post('/blockers',                           canAccessPOS3,         ctrl.createPlatformLaunchBlocker);
router.get('/blockers',                                                   ctrl.listPlatformLaunchBlockers);
router.patch('/blockers/:blockerId/status',        canAccessPOS3,        ctrl.updatePlatformLaunchBlockerStatus);

// Activation requirements
router.post('/activation-requirements',            canAccessPOS3,         ctrl.createPlatformActivationRequirement);
router.get('/activation-requirements',                                    ctrl.listPlatformActivationRequirements);
router.patch('/activation-requirements/:requirementId/status', canAccessPOS3, ctrl.updatePlatformActivationRequirementStatus);

// Marketplace
router.post('/marketplace/prep',                   canAccessPOS3,         ctrl.createMarketplacePrepRecord);
router.get('/marketplace/prep',                                           ctrl.listMarketplacePrepRecords);
router.post('/marketplace/listings/placeholders',  canAccessPOS3,         ctrl.createMarketplaceListingPlaceholder);
router.get('/marketplace/listings/placeholders',                          ctrl.listMarketplaceListingPlaceholders);
router.post('/marketplace/purchase-readiness',     canAccessPOS3,         ctrl.createMarketplacePurchaseReadiness);
router.get('/marketplace/purchase-readiness',                             ctrl.listMarketplacePurchaseReadiness);

// Provider / deployment / mode readiness
router.post('/provider-activation',                canAccessPOS3,         ctrl.createProviderActivationReadiness);
router.get('/provider-activation',                                        ctrl.listProviderActivationReadiness);
router.post('/deployment-readiness',               canAccessPOS3,         ctrl.createDeploymentReadinessRecord);
router.get('/deployment-readiness',                                       ctrl.listDeploymentReadinessRecords);
router.post('/demo-live-readiness',                canAccessPOS3,         ctrl.createDemoLiveReadinessRecord);
router.get('/demo-live-readiness',                                        ctrl.listDemoLiveReadinessRecords);

// Claims
router.post('/claims/safe',                        canAccessPOS3,         ctrl.createSafeSalesClaim);
router.get('/claims/safe-records',                                        ctrl.listSafeSalesClaims);
router.post('/claims/unsafe',                      canAccessPOS3,         ctrl.createUnsafeSalesClaim);
router.get('/claims/unsafe-records',                                      ctrl.listUnsafeSalesClaims);
router.get('/claims/final-safe',                                          ctrl.getSafeFinalSalesClaims);
router.get('/claims/final-unsafe',                                        ctrl.getUnsafeFinalSalesClaims);
router.get('/claims/honest-limitations',                                  ctrl.getFinalHonestLimitations);

// Foundation / phase / matrix
router.post('/foundation-locks',                   canAccessPOS3,         ctrl.createFoundationLockRecord);
router.get('/foundation-locks',                                           ctrl.listFoundationLockRecords);
router.post('/phase-completions',                  canAccessPOS3,         ctrl.createPhaseCompletionRecord);
router.get('/phase-completions',                                          ctrl.listPhaseCompletionRecords);
router.post('/module-matrix',                      canAccessPOS3,         ctrl.createModuleReadinessMatrixRecord);
router.get('/module-matrix',                                              ctrl.listModuleReadinessMatrix);

// Readiness categories
router.post('/documentation-readiness',            canAccessPOS3,         ctrl.createDocumentationReadiness);
router.get('/documentation-readiness',                                    ctrl.listDocumentationReadiness);
router.post('/verification-readiness',             canAccessPOS3,         ctrl.createVerificationReadiness);
router.get('/verification-readiness',                                     ctrl.listVerificationReadiness);
router.post('/build-readiness',                    canAccessPOS3,         ctrl.createBuildReadiness);
router.get('/build-readiness',                                            ctrl.listBuildReadiness);
router.post('/route-readiness',                    canAccessPOS3,         ctrl.createRouteReadiness);
router.get('/route-readiness',                                            ctrl.listRouteReadiness);
router.post('/ui-readiness',                       canAccessPOS3,         ctrl.createUIReadiness);
router.get('/ui-readiness',                                               ctrl.listUIReadiness);
router.post('/governance-readiness',               canAccessPOS3,         ctrl.createGovernanceReadiness);
router.get('/governance-readiness',                                       ctrl.listGovernanceReadiness);
router.post('/security-readiness',                 canAccessPOS3,         ctrl.createSecurityReadiness);
router.get('/security-readiness',                                         ctrl.listSecurityReadiness);
router.post('/billing-readiness',                  canAccessPOS3,         ctrl.createBillingReadiness);
router.get('/billing-readiness',                                          ctrl.listBillingReadiness);
router.post('/integration-readiness',              canAccessPOS3,         ctrl.createIntegrationReadiness);
router.get('/integration-readiness',                                      ctrl.listIntegrationReadiness);

// Snapshots / roadmap / summary
router.post('/snapshots',                          canAccessPOS3,         ctrl.createFinalLaunchSnapshot);
router.get('/snapshots/latest',                                           ctrl.getLatestFinalLaunchSnapshot);
router.get('/roadmap',                                                    ctrl.getFinalLaunchPhaseRoadmap);
router.get('/summary',                                                    ctrl.getFinalLaunchSummary);

export default router;
