// CraftHub Onboarding Routes — Phase C.6
// platformAdminGuardRequired = true on all write routes

import { Router } from 'express';
import { canAccessPOS3 } from '../middleware/roleMiddleware.js';
import * as ctrl from '../controllers/craftHubOnboardingController.js';

const router = Router();

// Default flows (public read)
router.get('/default',                                                      ctrl.getDefaultVenueOnboardingFlow);
router.get('/default/steps',                                                ctrl.getDefaultOnboardingSteps);
router.get('/default/checklist',                                            ctrl.getDefaultSetupChecklist);
router.get('/default/launch-readiness',                                     ctrl.getDefaultLaunchReadinessChecklist);

// Sessions
router.post('/sessions',                          canAccessPOS3,            ctrl.createOnboardingSession);
router.get('/sessions',                                                     ctrl.listOnboardingSessions);
router.patch('/sessions/:onboardingSessionId/status', canAccessPOS3,       ctrl.updateOnboardingSessionStatus);

// Steps
router.post('/steps',                             canAccessPOS3,            ctrl.createOnboardingStep);
router.get('/steps',                                                        ctrl.listOnboardingSteps);

// Step progress
router.post('/sessions/:onboardingSessionId/steps/:stepKey/progress', canAccessPOS3, ctrl.createOnboardingStepProgress);
router.get('/step-progress',                                                ctrl.listOnboardingStepProgress);
router.patch('/step-progress/:stepProgressId/status', canAccessPOS3,       ctrl.updateOnboardingStepProgressStatus);

// Checklist
router.post('/checklist',                         canAccessPOS3,            ctrl.createChecklistItem);
router.get('/checklist',                                                    ctrl.listChecklistItems);
router.patch('/checklist/:checklistItemId/status', canAccessPOS3,          ctrl.updateChecklistItemStatus);

// Blockers
router.post('/blockers',                          canAccessPOS3,            ctrl.createOnboardingBlocker);
router.get('/blockers',                                                     ctrl.listOnboardingBlockers);
router.patch('/blockers/:blockerId/status',       canAccessPOS3,            ctrl.updateOnboardingBlockerStatus);

// Activation requirements
router.post('/activation-requirements',           canAccessPOS3,            ctrl.createActivationRequirement);
router.get('/activation-requirements',                                      ctrl.listActivationRequirements);

// Organization setup
router.post('/setup/organization',                canAccessPOS3,            ctrl.createOrganizationSetup);
router.get('/setup/organization',                                           ctrl.listOrganizationSetup);

// Venue setup
router.post('/setup/venue',                       canAccessPOS3,            ctrl.createVenueSetup);
router.get('/setup/venue',                                                  ctrl.listVenueSetup);

// Workspace setup
router.post('/setup/workspace',                   canAccessPOS3,            ctrl.createWorkspaceSetup);
router.get('/setup/workspace',                                              ctrl.listWorkspaceSetup);

// Business units
router.post('/setup/business-units',              canAccessPOS3,            ctrl.createBusinessUnitSetup);
router.get('/setup/business-units',                                         ctrl.listBusinessUnitSetup);

// Departments
router.post('/setup/departments',                 canAccessPOS3,            ctrl.createDepartmentSetup);
router.get('/setup/departments',                                            ctrl.listDepartmentSetup);

// Locations
router.post('/setup/locations',                   canAccessPOS3,            ctrl.createLocationSetup);
router.get('/setup/locations',                                              ctrl.listLocationSetup);

// Roles
router.post('/setup/roles',                       canAccessPOS3,            ctrl.createRoleSetup);
router.get('/setup/roles',                                                  ctrl.listRoleSetup);

// Staff invites (placeholder only)
router.post('/setup/staff-invites',               canAccessPOS3,            ctrl.createStaffInvitePlaceholder);
router.get('/setup/staff-invites',                                          ctrl.listStaffInvitePlaceholders);

// Module selection
router.post('/setup/modules',                     canAccessPOS3,            ctrl.createModuleSelection);
router.get('/setup/modules',                                                ctrl.listModuleSelections);

// Module setup status
router.post('/setup/modules/:moduleKey/status',   canAccessPOS3,            ctrl.createModuleSetupStatus);
router.get('/setup/module-status',                                          ctrl.listModuleSetupStatuses);

// Module-specific setups
router.post('/setup/pos360',                      canAccessPOS3,            ctrl.createPOS360Setup);
router.get('/setup/pos360',                                                 ctrl.listPOS360Setup);

router.post('/setup/smokecraft',                  canAccessPOS3,            ctrl.createSmokeCraftSetup);
router.get('/setup/smokecraft',                                             ctrl.listSmokeCraftSetup);

router.post('/setup/pourcraft',                   canAccessPOS3,            ctrl.createPourCraftSetup);
router.get('/setup/pourcraft',                                              ctrl.listPourCraftSetup);

router.post('/setup/eat',                         canAccessPOS3,            ctrl.createEATSetup);
router.get('/setup/eat',                                                    ctrl.listEATSetup);

router.post('/setup/passport-connections',        canAccessPOS3,            ctrl.createPassportConnectionsSetup);
router.get('/setup/passport-connections',                                   ctrl.listPassportConnectionsSetup);

router.post('/setup/loyalty-rewards',             canAccessPOS3,            ctrl.createLoyaltyRewardsSetup);
router.get('/setup/loyalty-rewards',                                        ctrl.listLoyaltyRewardsSetup);

router.post('/setup/inventory',                   canAccessPOS3,            ctrl.createInventorySetup);
router.get('/setup/inventory',                                              ctrl.listInventorySetup);

router.post('/setup/menu',                        canAccessPOS3,            ctrl.createMenuSetup);
router.get('/setup/menu',                                                   ctrl.listMenuSetup);

router.post('/setup/fulfillment-areas',           canAccessPOS3,            ctrl.createFulfillmentAreaSetup);
router.get('/setup/fulfillment-areas',                                      ctrl.listFulfillmentAreaSetup);

router.post('/setup/tables-patio',                canAccessPOS3,            ctrl.createTablePatioSetup);
router.get('/setup/tables-patio',                                           ctrl.listTablePatioSetup);

// Provider placeholders
router.post('/placeholders/payment-provider',     canAccessPOS3,            ctrl.createPaymentProviderPlaceholder);
router.get('/placeholders/payment-provider',                                ctrl.listPaymentProviderPlaceholders);

router.post('/placeholders/billing-license',      canAccessPOS3,            ctrl.createBillingLicensePlaceholder);
router.get('/placeholders/billing-license',                                 ctrl.listBillingLicensePlaceholders);

router.post('/placeholders/security',             canAccessPOS3,            ctrl.createSecurityPlaceholder);
router.get('/placeholders/security',                                        ctrl.listSecurityPlaceholders);

// Mode controls
router.post('/mode-controls',                     canAccessPOS3,            ctrl.createDemoLiveModeControl);
router.get('/mode-controls',                                                ctrl.listDemoLiveModeControls);
router.patch('/mode-controls/:modeControlId',     canAccessPOS3,            ctrl.updateDemoLiveModeControl);

// Readiness scores
router.post('/readiness-scores',                  canAccessPOS3,            ctrl.createReadinessScore);
router.get('/readiness-scores',                                             ctrl.listReadinessScores);

// Launch readiness
router.post('/launch-readiness',                  canAccessPOS3,            ctrl.createLaunchReadinessRecord);
router.get('/launch-readiness',                                             ctrl.listLaunchReadinessRecords);
router.post('/launch-readiness/evaluate-placeholder', canAccessPOS3,        ctrl.evaluateLaunchReadinessPlaceholder);

// Claims
router.post('/claims/safe-records',               canAccessPOS3,            ctrl.createSafeClaimRecord);
router.get('/claims/safe-records',                                          ctrl.listSafeClaimRecords);
router.post('/claims/unsafe-records',             canAccessPOS3,            ctrl.createUnsafeClaimRecord);
router.get('/claims/unsafe-records',                                        ctrl.listUnsafeClaimRecords);
router.get('/claims/safe',                                                  ctrl.getSafeOnboardingClaims);
router.get('/claims/unsafe',                                                ctrl.getUnsafeOnboardingClaims);
router.get('/claims/honest-limitations',                                    ctrl.getOnboardingHonestLimitations);
router.get('/roadmap',                                                      ctrl.getOnboardingPhaseRoadmap);

// Snapshots
router.post('/snapshots',                         canAccessPOS3,            ctrl.createOnboardingSnapshot);
router.get('/snapshots/latest',                                             ctrl.getLatestOnboardingSnapshot);

export default router;
