// CraftHub Onboarding Controller — Phase C.6
// contains_secrets: false, stores_secrets: false — hardcoded; audit rows never hold secrets

import * as svc from '../services/crafthub/craftHubOnboardingService.js';

const ok500 = (res, fn) => fn().catch(e => res.status(500).json({ ok: false, error: e.message }));
const actorUserId = req => req.user?.id || req.headers['x-actor-id'] || 'system';
const ikey = req => req.headers['x-idempotency-key'] || req.body?.idempotencyKey;
const body = req => req.body || {};
const params = req => req.params || {};
const query = req => req.query || {};

export const getDefaultVenueOnboardingFlow     = (req, res) => ok500(res, async () => res.json(svc.getDefaultVenueOnboardingFlow()));
export const getDefaultOnboardingSteps         = (req, res) => ok500(res, async () => res.json(svc.getDefaultOnboardingSteps()));
export const getDefaultSetupChecklist          = (req, res) => ok500(res, async () => res.json(svc.getDefaultSetupChecklist()));
export const getDefaultLaunchReadinessChecklist= (req, res) => ok500(res, async () => res.json(svc.getDefaultLaunchReadinessChecklist()));

export const createOnboardingSession           = (req, res) => ok500(res, async () => res.json(await svc.createOnboardingSession({ payload: body(req), actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const listOnboardingSessions            = (req, res) => ok500(res, async () => res.json(await svc.listOnboardingSessions({ filters: query(req) })));
export const updateOnboardingSessionStatus     = (req, res) => ok500(res, async () => res.json(await svc.updateOnboardingSessionStatus({ onboardingSessionId: params(req).onboardingSessionId, status: body(req).status, actorUserId: actorUserId(req), reason: body(req).reason, idempotencyKey: ikey(req) })));

export const createOnboardingStep              = (req, res) => ok500(res, async () => res.json(await svc.createOnboardingStep({ payload: body(req), actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const listOnboardingSteps               = (req, res) => ok500(res, async () => res.json(await svc.listOnboardingSteps({ filters: query(req) })));

export const createOnboardingStepProgress      = (req, res) => ok500(res, async () => res.json(await svc.createOnboardingStepProgress({ onboardingSessionId: params(req).onboardingSessionId, stepKey: params(req).stepKey, payload: body(req), actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const listOnboardingStepProgress        = (req, res) => ok500(res, async () => res.json(await svc.listOnboardingStepProgress({ filters: query(req) })));
export const updateOnboardingStepProgressStatus= (req, res) => ok500(res, async () => res.json(await svc.updateOnboardingStepProgressStatus({ stepProgressId: params(req).stepProgressId, status: body(req).status, actorUserId: actorUserId(req), reason: body(req).reason, idempotencyKey: ikey(req) })));

export const createChecklistItem               = (req, res) => ok500(res, async () => res.json(await svc.createChecklistItem({ payload: body(req), actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const listChecklistItems                = (req, res) => ok500(res, async () => res.json(await svc.listChecklistItems({ filters: query(req) })));
export const updateChecklistItemStatus         = (req, res) => ok500(res, async () => res.json(await svc.updateChecklistItemStatus({ checklistItemId: params(req).checklistItemId, status: body(req).status, actorUserId: actorUserId(req), reason: body(req).reason, idempotencyKey: ikey(req) })));

export const createOnboardingBlocker           = (req, res) => ok500(res, async () => res.json(await svc.createOnboardingBlocker({ payload: body(req), actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const listOnboardingBlockers            = (req, res) => ok500(res, async () => res.json(await svc.listOnboardingBlockers({ filters: query(req) })));
export const updateOnboardingBlockerStatus     = (req, res) => ok500(res, async () => res.json(await svc.updateOnboardingBlockerStatus({ blockerId: params(req).blockerId, status: body(req).status, actorUserId: actorUserId(req), reason: body(req).reason, idempotencyKey: ikey(req) })));

export const createActivationRequirement       = (req, res) => ok500(res, async () => res.json(await svc.createActivationRequirement({ payload: body(req), actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const listActivationRequirements        = (req, res) => ok500(res, async () => res.json(await svc.listActivationRequirements({ filters: query(req) })));

export const createOrganizationSetup           = (req, res) => ok500(res, async () => res.json(await svc.createOrganizationSetup({ payload: body(req), actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const listOrganizationSetup             = (req, res) => ok500(res, async () => res.json(await svc.listOrganizationSetup({ filters: query(req) })));
export const createVenueSetup                  = (req, res) => ok500(res, async () => res.json(await svc.createVenueSetup({ payload: body(req), actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const listVenueSetup                    = (req, res) => ok500(res, async () => res.json(await svc.listVenueSetup({ filters: query(req) })));
export const createWorkspaceSetup              = (req, res) => ok500(res, async () => res.json(await svc.createWorkspaceSetup({ payload: body(req), actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const listWorkspaceSetup                = (req, res) => ok500(res, async () => res.json(await svc.listWorkspaceSetup({ filters: query(req) })));
export const createBusinessUnitSetup           = (req, res) => ok500(res, async () => res.json(await svc.createBusinessUnitSetup({ payload: body(req), actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const listBusinessUnitSetup             = (req, res) => ok500(res, async () => res.json(await svc.listBusinessUnitSetup({ filters: query(req) })));
export const createDepartmentSetup             = (req, res) => ok500(res, async () => res.json(await svc.createDepartmentSetup({ payload: body(req), actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const listDepartmentSetup               = (req, res) => ok500(res, async () => res.json(await svc.listDepartmentSetup({ filters: query(req) })));
export const createLocationSetup               = (req, res) => ok500(res, async () => res.json(await svc.createLocationSetup({ payload: body(req), actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const listLocationSetup                 = (req, res) => ok500(res, async () => res.json(await svc.listLocationSetup({ filters: query(req) })));
export const createRoleSetup                   = (req, res) => ok500(res, async () => res.json(await svc.createRoleSetup({ payload: body(req), actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const listRoleSetup                     = (req, res) => ok500(res, async () => res.json(await svc.listRoleSetup({ filters: query(req) })));
export const createStaffInvitePlaceholder      = (req, res) => ok500(res, async () => res.json(await svc.createStaffInvitePlaceholder({ payload: body(req), actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const listStaffInvitePlaceholders       = (req, res) => ok500(res, async () => res.json(await svc.listStaffInvitePlaceholders({ filters: query(req) })));

export const createModuleSelection             = (req, res) => ok500(res, async () => res.json(await svc.createModuleSelection({ payload: body(req), actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const listModuleSelections              = (req, res) => ok500(res, async () => res.json(await svc.listModuleSelections({ filters: query(req) })));
export const createModuleSetupStatus           = (req, res) => ok500(res, async () => res.json(await svc.createModuleSetupStatus({ moduleKey: params(req).moduleKey, payload: body(req), actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const listModuleSetupStatuses           = (req, res) => ok500(res, async () => res.json(await svc.listModuleSetupStatuses({ filters: query(req) })));
export const createPOS360Setup                 = (req, res) => ok500(res, async () => res.json(await svc.createPOS360Setup({ payload: body(req), actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const listPOS360Setup                   = (req, res) => ok500(res, async () => res.json(await svc.listPOS360Setup({ filters: query(req) })));
export const createSmokeCraftSetup             = (req, res) => ok500(res, async () => res.json(await svc.createSmokeCraftSetup({ payload: body(req), actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const listSmokeCraftSetup               = (req, res) => ok500(res, async () => res.json(await svc.listSmokeCraftSetup({ filters: query(req) })));
export const createPourCraftSetup              = (req, res) => ok500(res, async () => res.json(await svc.createPourCraftSetup({ payload: body(req), actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const listPourCraftSetup                = (req, res) => ok500(res, async () => res.json(await svc.listPourCraftSetup({ filters: query(req) })));
export const createEATSetup                    = (req, res) => ok500(res, async () => res.json(await svc.createEATSetup({ payload: body(req), actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const listEATSetup                      = (req, res) => ok500(res, async () => res.json(await svc.listEATSetup({ filters: query(req) })));
export const createPassportConnectionsSetup    = (req, res) => ok500(res, async () => res.json(await svc.createPassportConnectionsSetup({ payload: body(req), actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const listPassportConnectionsSetup      = (req, res) => ok500(res, async () => res.json(await svc.listPassportConnectionsSetup({ filters: query(req) })));
export const createLoyaltyRewardsSetup         = (req, res) => ok500(res, async () => res.json(await svc.createLoyaltyRewardsSetup({ payload: body(req), actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const listLoyaltyRewardsSetup           = (req, res) => ok500(res, async () => res.json(await svc.listLoyaltyRewardsSetup({ filters: query(req) })));
export const createInventorySetup              = (req, res) => ok500(res, async () => res.json(await svc.createInventorySetup({ payload: body(req), actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const listInventorySetup                = (req, res) => ok500(res, async () => res.json(await svc.listInventorySetup({ filters: query(req) })));
export const createMenuSetup                   = (req, res) => ok500(res, async () => res.json(await svc.createMenuSetup({ payload: body(req), actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const listMenuSetup                     = (req, res) => ok500(res, async () => res.json(await svc.listMenuSetup({ filters: query(req) })));
export const createFulfillmentAreaSetup        = (req, res) => ok500(res, async () => res.json(await svc.createFulfillmentAreaSetup({ payload: body(req), actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const listFulfillmentAreaSetup          = (req, res) => ok500(res, async () => res.json(await svc.listFulfillmentAreaSetup({ filters: query(req) })));
export const createTablePatioSetup             = (req, res) => ok500(res, async () => res.json(await svc.createTablePatioSetup({ payload: body(req), actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const listTablePatioSetup               = (req, res) => ok500(res, async () => res.json(await svc.listTablePatioSetup({ filters: query(req) })));

export const createPaymentProviderPlaceholder  = (req, res) => ok500(res, async () => res.json(await svc.createPaymentProviderPlaceholder({ payload: body(req), actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const listPaymentProviderPlaceholders   = (req, res) => ok500(res, async () => res.json(await svc.listPaymentProviderPlaceholders({ filters: query(req) })));
export const createBillingLicensePlaceholder   = (req, res) => ok500(res, async () => res.json(await svc.createBillingLicensePlaceholder({ payload: body(req), actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const listBillingLicensePlaceholders    = (req, res) => ok500(res, async () => res.json(await svc.listBillingLicensePlaceholders({ filters: query(req) })));
export const createSecurityPlaceholder         = (req, res) => ok500(res, async () => res.json(await svc.createSecurityPlaceholder({ payload: body(req), actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const listSecurityPlaceholders          = (req, res) => ok500(res, async () => res.json(await svc.listSecurityPlaceholders({ filters: query(req) })));

export const createDemoLiveModeControl         = (req, res) => ok500(res, async () => res.json(await svc.createDemoLiveModeControl({ payload: body(req), actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const listDemoLiveModeControls          = (req, res) => ok500(res, async () => res.json(await svc.listDemoLiveModeControls({ filters: query(req) })));
export const updateDemoLiveModeControl         = (req, res) => ok500(res, async () => res.json(await svc.updateDemoLiveModeControl({ modeControlId: params(req).modeControlId, mode: body(req).mode, actorUserId: actorUserId(req), reason: body(req).reason, idempotencyKey: ikey(req) })));

export const createReadinessScore              = (req, res) => ok500(res, async () => res.json(await svc.createReadinessScore({ payload: body(req), actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const listReadinessScores               = (req, res) => ok500(res, async () => res.json(await svc.listReadinessScores({ filters: query(req) })));
export const createLaunchReadinessRecord       = (req, res) => ok500(res, async () => res.json(await svc.createLaunchReadinessRecord({ payload: body(req), actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const listLaunchReadinessRecords        = (req, res) => ok500(res, async () => res.json(await svc.listLaunchReadinessRecords({ filters: query(req) })));
export const evaluateLaunchReadinessPlaceholder= (req, res) => ok500(res, async () => res.json(svc.evaluateLaunchReadinessPlaceholder(body(req))));

export const createSafeClaimRecord             = (req, res) => ok500(res, async () => res.json(await svc.createSafeClaimRecord({ payload: body(req), actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const listSafeClaimRecords              = (req, res) => ok500(res, async () => res.json(await svc.listSafeClaimRecords({ filters: query(req) })));
export const createUnsafeClaimRecord           = (req, res) => ok500(res, async () => res.json(await svc.createUnsafeClaimRecord({ payload: body(req), actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const listUnsafeClaimRecords            = (req, res) => ok500(res, async () => res.json(await svc.listUnsafeClaimRecords({ filters: query(req) })));
export const getSafeOnboardingClaims           = (req, res) => ok500(res, async () => res.json(svc.getSafeOnboardingClaims()));
export const getUnsafeOnboardingClaims         = (req, res) => ok500(res, async () => res.json(svc.getUnsafeOnboardingClaims()));
export const getOnboardingHonestLimitations    = (req, res) => ok500(res, async () => res.json(svc.getOnboardingHonestLimitations()));
export const getOnboardingPhaseRoadmap         = (req, res) => ok500(res, async () => res.json(svc.getOnboardingPhaseRoadmap()));

export const createOnboardingSnapshot          = (req, res) => ok500(res, async () => res.json(await svc.createOnboardingSnapshot({ actorUserId: actorUserId(req), idempotencyKey: ikey(req) })));
export const getLatestOnboardingSnapshot       = (req, res) => ok500(res, async () => res.json(await svc.getLatestOnboardingSnapshot()));
