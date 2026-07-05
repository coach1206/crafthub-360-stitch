// CraftHub Dashboard Controller — Phase C.5
// contains_secrets: false, stores_secrets: false — hardcoded; audit rows never hold secrets

import db from '../db/connection.js';
import * as svc from '../services/crafthub/craftHubDashboardService.js';

const ok500 = (res, fn) => fn().catch(e => res.status(500).json({ ok: false, error: e.message }));
const actorUserId = req => req.user?.id || req.headers['x-actor-id'] || 'system';
const ikey = req => req.headers['x-idempotency-key'] || req.body?.idempotencyKey;

export const getDashboard             = (req, res) => ok500(res, async () => res.json(await svc.getDefaultCraftHubDashboard(db)));
export const getDashboardStats        = (req, res) => ok500(res, async () => res.json(await svc.getDashboardStats(db, req.params.tenantId)));

export const getDashboardSessions     = (req, res) => ok500(res, async () => res.json(await svc.getDashboardSessions(db, req.params.tenantId)));
export const createDashboardSession   = (req, res) => ok500(res, async () => res.json(await svc.createDashboardSession(db, req.params.tenantId, req.body.userId, req.body.sessionToken, ikey(req))));

export const getModuleLauncher        = (req, res) => ok500(res, async () => res.json(await svc.getModuleLauncherRegistry(db, req.params.tenantId)));
export const installModule            = (req, res) => ok500(res, async () => res.json(await svc.requestModuleInstall(db, req.params.tenantId, actorUserId(req), req.body.moduleKey, ikey(req))));
export const activateModule           = (req, res) => ok500(res, async () => res.json(await svc.requestModuleActivation(db, req.params.tenantId, actorUserId(req), req.body.moduleKey, ikey(req))));

export const getNavShellConfig        = (req, res) => ok500(res, async () => res.json(await svc.getNavigationShellConfig(db, req.params.tenantId)));
export const updateNavShellConfig     = (req, res) => ok500(res, async () => res.json(await svc.updateNavigationShellConfig(db, req.params.tenantId, actorUserId(req), req.body, ikey(req))));

export const getPremiumHub            = (req, res) => ok500(res, async () => res.json(await svc.getPremiumExperienceHub(db, req.params.tenantId)));

export const getWidgets               = (req, res) => ok500(res, async () => res.json(await svc.getDashboardWidgets(db, req.params.tenantId, req.params.userId)));
export const addWidget                = (req, res) => ok500(res, async () => res.json(await svc.addDashboardWidget(db, req.params.tenantId, req.params.userId, actorUserId(req), req.body, ikey(req))));
export const removeWidget             = (req, res) => ok500(res, async () => res.json(await svc.removeWidget(db, req.params.tenantId, req.params.userId, actorUserId(req), req.params.widgetId, ikey(req))));

export const getRoadmap               = (req, res) => ok500(res, async () => res.json(await svc.getModuleRoadmap(db)));

export const getMarketplace           = (req, res) => ok500(res, async () => res.json(await svc.getMarketplaceCatalog(db)));
export const initiatePurchase         = (req, res) => ok500(res, async () => res.json(await svc.initiateMarketplacePurchase(db, req.params.tenantId, actorUserId(req), req.body.listingKey, ikey(req))));
export const getPurchases             = (req, res) => ok500(res, async () => res.json(await svc.getMarketplacePurchases(db, req.params.tenantId)));

export const getQuickActions          = (req, res) => ok500(res, async () => res.json(await svc.getQuickActions(db, req.params.tenantId)));
export const triggerQuickAction       = (req, res) => ok500(res, async () => res.json(await svc.triggerQuickAction(db, req.params.tenantId, actorUserId(req), req.body.actionKey, ikey(req))));

export const getActivityFeed          = (req, res) => ok500(res, async () => res.json(await svc.getActivityFeed(db, req.params.tenantId)));

export const getNotifications         = (req, res) => ok500(res, async () => res.json(await svc.getNotifications(db, req.params.tenantId, req.params.userId)));
export const dismissNotification      = (req, res) => ok500(res, async () => res.json(await svc.dismissNotification(db, req.params.tenantId, req.params.userId, actorUserId(req), req.params.notifId, ikey(req))));

export const getOnboarding            = (req, res) => ok500(res, async () => res.json(await svc.getOnboardingChecklist(db, req.params.tenantId, req.params.userId)));
export const completeOnboardingStep   = (req, res) => ok500(res, async () => res.json(await svc.completeOnboardingStep(db, req.params.tenantId, req.params.userId, actorUserId(req), req.body.stepKey, ikey(req))));

export const getAnnouncements         = (req, res) => ok500(res, async () => res.json(await svc.getAnnouncements(db)));

export const getHealthChecks          = (req, res) => ok500(res, async () => res.json(await svc.getModuleHealthChecks(db, req.params.tenantId)));

export const getFeatureFlagOverrides  = (req, res) => ok500(res, async () => res.json(await svc.getFeatureFlagOverrides(db, req.params.tenantId)));
export const setFeatureFlagOverride   = (req, res) => ok500(res, async () => res.json(await svc.setFeatureFlagOverride(db, req.params.tenantId, actorUserId(req), req.body.flagKey, req.body.flagValue, req.body.reason, ikey(req))));

export const getUserPreferences       = (req, res) => ok500(res, async () => res.json(await svc.getUserPreferences(db, req.params.userId)));
export const updateUserPreferences    = (req, res) => ok500(res, async () => res.json(await svc.updateUserPreferences(db, req.params.userId, actorUserId(req), req.body, ikey(req))));

export const getEntitlements          = (req, res) => ok500(res, async () => res.json(await svc.getModuleEntitlements(db, req.params.tenantId)));
export const grantEntitlement         = (req, res) => ok500(res, async () => res.json(await svc.grantModuleEntitlement(db, req.params.tenantId, actorUserId(req), req.body.moduleKey, req.body.source, ikey(req))));

export const getAuditLog              = (req, res) => ok500(res, async () => res.json(await svc.getAuditLog(db, req.params.tenantId)));

export const createApiKey             = (req, res) => ok500(res, async () => res.json(await svc.createApiKey(db, req.params.tenantId, actorUserId(req), req.body.keyName, req.body.scopes, ikey(req))));
export const getApiKeys               = (req, res) => ok500(res, async () => res.json(await svc.getApiKeys(db, req.params.tenantId)));
export const revokeApiKey             = (req, res) => ok500(res, async () => res.json(await svc.revokeApiKey(db, req.params.tenantId, actorUserId(req), req.params.keyId, ikey(req))));

export const getConnectors            = (req, res) => ok500(res, async () => res.json(await svc.getIntegrationConnectors(db, req.params.tenantId)));
export const connectIntegration       = (req, res) => ok500(res, async () => res.json(await svc.connectIntegration(db, req.params.tenantId, actorUserId(req), req.body.connectorKey, ikey(req))));
export const disconnectIntegration    = (req, res) => ok500(res, async () => res.json(await svc.disconnectIntegration(db, req.params.tenantId, actorUserId(req), req.body.connectorKey, ikey(req))));

export const getPlatformHealth        = (req, res) => ok500(res, async () => res.json(await svc.getPlatformHealthStatus(db)));

export const getSearchResults         = (req, res) => ok500(res, async () => res.json(await svc.getSearchResults(db, req.params.tenantId, req.query.q)));
