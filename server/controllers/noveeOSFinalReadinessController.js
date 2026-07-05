// Phase C.7 — NOVEE OS Final Readiness Controller
// contains_secrets: false, stores_secrets: false — hardcoded; audit rows never hold secrets

import * as svc from '../services/noveeOS/noveeOSFinalReadinessService.js';

const ok500 = (res, fn) => fn().catch(e => res.status(500).json({ ok: false, error: e.message }));
const actorUserId = req => req.user?.id || req.headers['x-actor-id'] || 'system';
const ikey = req => req.headers['x-idempotency-key'] || req.body?.idempotencyKey;

export const getDefaultFinalReadinessDashboard      = (req, res) => ok500(res, async () => res.json(svc.getDefaultFinalReadinessDashboard()));
export const getDefaultPlatformAuditCategories      = (req, res) => ok500(res, async () => res.json(svc.getDefaultPlatformAuditCategories()));
export const getDefaultModuleReadinessMatrix        = (req, res) => ok500(res, async () => res.json(svc.getDefaultModuleReadinessMatrix()));
export const getDefaultSafeSalesClaims              = (req, res) => ok500(res, async () => res.json(svc.getDefaultSafeSalesClaims()));
export const getDefaultUnsafeSalesClaims            = (req, res) => ok500(res, async () => res.json(svc.getDefaultUnsafeSalesClaims()));
export const getDefaultLaunchBlockers               = (req, res) => ok500(res, async () => res.json(svc.getDefaultLaunchBlockers()));
export const getDefaultActivationRequirements       = (req, res) => ok500(res, async () => res.json(svc.getDefaultActivationRequirements()));
export const getDefaultPhaseCompletionRecords       = (req, res) => ok500(res, async () => res.json(svc.getDefaultPhaseCompletionRecords()));

export const createFinalReadinessSession            = (req, res) => ok500(res, () => svc.createFinalReadinessSession({ payload: req.body, actorUserId: actorUserId(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listFinalReadinessSessions             = (req, res) => ok500(res, () => svc.listFinalReadinessSessions({ filters: req.query }).then(d => res.json(d)));
export const updateFinalReadinessSessionStatus      = (req, res) => ok500(res, () => svc.updateFinalReadinessSessionStatus({ readinessSessionId: req.params.readinessSessionId, status: req.body?.status, actorUserId: actorUserId(req), reason: req.body?.reason, idempotencyKey: ikey(req) }).then(d => res.json(d)));

export const createFinalReadinessCheck              = (req, res) => ok500(res, () => svc.createFinalReadinessCheck({ payload: req.body, actorUserId: actorUserId(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listFinalReadinessChecks               = (req, res) => ok500(res, () => svc.listFinalReadinessChecks({ filters: req.query }).then(d => res.json(d)));

export const createFinalReadinessResult             = (req, res) => ok500(res, () => svc.createFinalReadinessResult({ payload: req.body, actorUserId: actorUserId(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listFinalReadinessResults              = (req, res) => ok500(res, () => svc.listFinalReadinessResults({ filters: req.query }).then(d => res.json(d)));

export const createPlatformAuditCategory            = (req, res) => ok500(res, () => svc.createPlatformAuditCategory({ payload: req.body, actorUserId: actorUserId(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listPlatformAuditCategories            = (req, res) => ok500(res, () => svc.listPlatformAuditCategories({ filters: req.query }).then(d => res.json(d)));
export const createPlatformAuditFinding             = (req, res) => ok500(res, () => svc.createPlatformAuditFinding({ payload: req.body, actorUserId: actorUserId(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listPlatformAuditFindings              = (req, res) => ok500(res, () => svc.listPlatformAuditFindings({ filters: req.query }).then(d => res.json(d)));
export const updatePlatformAuditFindingStatus       = (req, res) => ok500(res, () => svc.updatePlatformAuditFindingStatus({ findingId: req.params.findingId, status: req.body?.status, actorUserId: actorUserId(req), reason: req.body?.reason, idempotencyKey: ikey(req) }).then(d => res.json(d)));

export const createPlatformLaunchBlocker            = (req, res) => ok500(res, () => svc.createPlatformLaunchBlocker({ payload: req.body, actorUserId: actorUserId(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listPlatformLaunchBlockers             = (req, res) => ok500(res, () => svc.listPlatformLaunchBlockers({ filters: req.query }).then(d => res.json(d)));
export const updatePlatformLaunchBlockerStatus      = (req, res) => ok500(res, () => svc.updatePlatformLaunchBlockerStatus({ blockerId: req.params.blockerId, status: req.body?.status, actorUserId: actorUserId(req), reason: req.body?.reason, idempotencyKey: ikey(req) }).then(d => res.json(d)));

export const createPlatformActivationRequirement    = (req, res) => ok500(res, () => svc.createPlatformActivationRequirement({ payload: req.body, actorUserId: actorUserId(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listPlatformActivationRequirements     = (req, res) => ok500(res, () => svc.listPlatformActivationRequirements({ filters: req.query }).then(d => res.json(d)));
export const updatePlatformActivationRequirementStatus = (req, res) => ok500(res, () => svc.updatePlatformActivationRequirementStatus({ requirementId: req.params.requirementId, status: req.body?.status, actorUserId: actorUserId(req), reason: req.body?.reason, idempotencyKey: ikey(req) }).then(d => res.json(d)));

export const createMarketplacePrepRecord            = (req, res) => ok500(res, () => svc.createMarketplacePrepRecord({ payload: req.body, actorUserId: actorUserId(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listMarketplacePrepRecords             = (req, res) => ok500(res, () => svc.listMarketplacePrepRecords({ filters: req.query }).then(d => res.json(d)));
export const createMarketplaceListingPlaceholder    = (req, res) => ok500(res, () => svc.createMarketplaceListingPlaceholder({ payload: req.body, actorUserId: actorUserId(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listMarketplaceListingPlaceholders     = (req, res) => ok500(res, () => svc.listMarketplaceListingPlaceholders({ filters: req.query }).then(d => res.json(d)));
export const createMarketplacePurchaseReadiness     = (req, res) => ok500(res, () => svc.createMarketplacePurchaseReadiness({ payload: req.body, actorUserId: actorUserId(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listMarketplacePurchaseReadiness       = (req, res) => ok500(res, () => svc.listMarketplacePurchaseReadiness({ filters: req.query }).then(d => res.json(d)));

export const createProviderActivationReadiness      = (req, res) => ok500(res, () => svc.createProviderActivationReadiness({ payload: req.body, actorUserId: actorUserId(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listProviderActivationReadiness        = (req, res) => ok500(res, () => svc.listProviderActivationReadiness({ filters: req.query }).then(d => res.json(d)));
export const createDeploymentReadinessRecord        = (req, res) => ok500(res, () => svc.createDeploymentReadinessRecord({ payload: req.body, actorUserId: actorUserId(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listDeploymentReadinessRecords         = (req, res) => ok500(res, () => svc.listDeploymentReadinessRecords({ filters: req.query }).then(d => res.json(d)));
export const createDemoLiveReadinessRecord          = (req, res) => ok500(res, () => svc.createDemoLiveReadinessRecord({ payload: req.body, actorUserId: actorUserId(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listDemoLiveReadinessRecords           = (req, res) => ok500(res, () => svc.listDemoLiveReadinessRecords({ filters: req.query }).then(d => res.json(d)));

export const createSafeSalesClaim                   = (req, res) => ok500(res, () => svc.createSafeSalesClaim({ payload: req.body, actorUserId: actorUserId(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listSafeSalesClaims                    = (req, res) => ok500(res, () => svc.listSafeSalesClaims({ filters: req.query }).then(d => res.json(d)));
export const createUnsafeSalesClaim                 = (req, res) => ok500(res, () => svc.createUnsafeSalesClaim({ payload: req.body, actorUserId: actorUserId(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listUnsafeSalesClaims                  = (req, res) => ok500(res, () => svc.listUnsafeSalesClaims({ filters: req.query }).then(d => res.json(d)));
export const getSafeFinalSalesClaims                = (req, res) => ok500(res, async () => res.json(svc.getSafeFinalSalesClaims()));
export const getUnsafeFinalSalesClaims              = (req, res) => ok500(res, async () => res.json(svc.getUnsafeFinalSalesClaims()));
export const getFinalHonestLimitations              = (req, res) => ok500(res, async () => res.json(svc.getFinalHonestLimitations()));

export const createFoundationLockRecord             = (req, res) => ok500(res, () => svc.createFoundationLockRecord({ payload: req.body, actorUserId: actorUserId(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listFoundationLockRecords              = (req, res) => ok500(res, () => svc.listFoundationLockRecords({ filters: req.query }).then(d => res.json(d)));
export const createPhaseCompletionRecord            = (req, res) => ok500(res, () => svc.createPhaseCompletionRecord({ payload: req.body, actorUserId: actorUserId(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listPhaseCompletionRecords             = (req, res) => ok500(res, () => svc.listPhaseCompletionRecords({ filters: req.query }).then(d => res.json(d)));
export const createModuleReadinessMatrixRecord      = (req, res) => ok500(res, () => svc.createModuleReadinessMatrixRecord({ payload: req.body, actorUserId: actorUserId(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listModuleReadinessMatrix              = (req, res) => ok500(res, () => svc.listModuleReadinessMatrix({ filters: req.query }).then(d => res.json(d)));

export const createDocumentationReadiness           = (req, res) => ok500(res, () => svc.createDocumentationReadiness({ payload: req.body, actorUserId: actorUserId(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listDocumentationReadiness             = (req, res) => ok500(res, () => svc.listDocumentationReadiness({ filters: req.query }).then(d => res.json(d)));
export const createVerificationReadiness            = (req, res) => ok500(res, () => svc.createVerificationReadiness({ payload: req.body, actorUserId: actorUserId(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listVerificationReadiness              = (req, res) => ok500(res, () => svc.listVerificationReadiness({ filters: req.query }).then(d => res.json(d)));
export const createBuildReadiness                   = (req, res) => ok500(res, () => svc.createBuildReadiness({ payload: req.body, actorUserId: actorUserId(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listBuildReadiness                     = (req, res) => ok500(res, () => svc.listBuildReadiness({ filters: req.query }).then(d => res.json(d)));
export const createRouteReadiness                   = (req, res) => ok500(res, () => svc.createRouteReadiness({ payload: req.body, actorUserId: actorUserId(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listRouteReadiness                     = (req, res) => ok500(res, () => svc.listRouteReadiness({ filters: req.query }).then(d => res.json(d)));
export const createUIReadiness                      = (req, res) => ok500(res, () => svc.createUIReadiness({ payload: req.body, actorUserId: actorUserId(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listUIReadiness                        = (req, res) => ok500(res, () => svc.listUIReadiness({ filters: req.query }).then(d => res.json(d)));
export const createGovernanceReadiness              = (req, res) => ok500(res, () => svc.createGovernanceReadiness({ payload: req.body, actorUserId: actorUserId(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listGovernanceReadiness                = (req, res) => ok500(res, () => svc.listGovernanceReadiness({ filters: req.query }).then(d => res.json(d)));
export const createSecurityReadiness                = (req, res) => ok500(res, () => svc.createSecurityReadiness({ payload: req.body, actorUserId: actorUserId(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listSecurityReadiness                  = (req, res) => ok500(res, () => svc.listSecurityReadiness({ filters: req.query }).then(d => res.json(d)));
export const createBillingReadiness                 = (req, res) => ok500(res, () => svc.createBillingReadiness({ payload: req.body, actorUserId: actorUserId(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listBillingReadiness                   = (req, res) => ok500(res, () => svc.listBillingReadiness({ filters: req.query }).then(d => res.json(d)));
export const createIntegrationReadiness             = (req, res) => ok500(res, () => svc.createIntegrationReadiness({ payload: req.body, actorUserId: actorUserId(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const listIntegrationReadiness               = (req, res) => ok500(res, () => svc.listIntegrationReadiness({ filters: req.query }).then(d => res.json(d)));

export const createFinalLaunchSnapshot              = (req, res) => ok500(res, () => svc.createFinalLaunchSnapshot({ actorUserId: actorUserId(req), idempotencyKey: ikey(req) }).then(d => res.json(d)));
export const getLatestFinalLaunchSnapshot           = (req, res) => ok500(res, () => svc.getLatestFinalLaunchSnapshot().then(d => res.json(d)));
export const getFinalLaunchPhaseRoadmap             = (req, res) => ok500(res, async () => res.json(svc.getFinalLaunchPhaseRoadmap()));
export const getFinalLaunchSummary                  = (req, res) => ok500(res, async () => res.json(svc.getFinalLaunchSummary()));
