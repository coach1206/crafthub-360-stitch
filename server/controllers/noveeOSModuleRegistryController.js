import * as svc from '../services/noveeOS/noveeOSModuleRegistryService.js';

const ok500 = (res, fn) => fn().catch(e => res.status(500).json({ ok: false, error: e.message }));
const vid   = req => req.headers['x-venue-id'] || req.query.venue_id || req.body?.venue_id;
const actor = req => req.user?.id || req.headers['x-actor-id'] || 'system';
const ikey  = req => req.headers['x-idempotency-key'] || req.body?.idempotencyKey;

export const getDefaultCoreModuleRegistry   = (req, res) => ok500(res, async () => res.json(svc.getDefaultCoreModuleRegistry()));
export const registerModule                 = (req, res) => ok500(res, async () => res.json(await svc.registerModule({ payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) })));
export const listModules                    = (req, res) => ok500(res, async () => res.json(await svc.listModules({ filters: req.query })));
export const getModule                      = (req, res) => ok500(res, async () => res.json(await svc.getModule({ moduleKey: req.params.moduleKey })));
export const updateModuleStatus             = (req, res) => ok500(res, async () => res.json(await svc.updateModuleStatus({ moduleKey: req.params.moduleKey, status: req.body.status, actorUserId: actor(req), reason: req.body.reason, idempotencyKey: ikey(req) })));

export const createModuleVersion            = (req, res) => ok500(res, async () => res.json(await svc.createModuleVersion({ moduleKey: req.params.moduleKey, payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) })));
export const listModuleVersions             = (req, res) => ok500(res, async () => res.json(await svc.listModuleVersions({ moduleKey: req.params.moduleKey })));

export const registerModuleBackendRoute     = (req, res) => ok500(res, async () => res.json(await svc.registerModuleBackendRoute({ moduleKey: req.params.moduleKey, payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) })));
export const listModuleBackendRoutes        = (req, res) => ok500(res, async () => res.json(await svc.listModuleBackendRoutes({ moduleKey: req.params.moduleKey })));

export const registerModuleFrontendRoute    = (req, res) => ok500(res, async () => res.json(await svc.registerModuleFrontendRoute({ moduleKey: req.params.moduleKey, payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) })));
export const listModuleFrontendRoutes       = (req, res) => ok500(res, async () => res.json(await svc.listModuleFrontendRoutes({ moduleKey: req.params.moduleKey })));

export const createModuleDependency         = (req, res) => ok500(res, async () => res.json(await svc.createModuleDependency({ moduleKey: req.params.moduleKey, payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) })));
export const listModuleDependencies         = (req, res) => ok500(res, async () => res.json(await svc.listModuleDependencies({ moduleKey: req.params.moduleKey })));

export const createModulePermission         = (req, res) => ok500(res, async () => res.json(await svc.createModulePermission({ moduleKey: req.params.moduleKey, payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) })));
export const listModulePermissions          = (req, res) => ok500(res, async () => res.json(await svc.listModulePermissions({ moduleKey: req.params.moduleKey })));

export const createModuleFeatureFlag        = (req, res) => ok500(res, async () => res.json(await svc.createModuleFeatureFlag({ moduleKey: req.params.moduleKey, payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) })));
export const listModuleFeatureFlags         = (req, res) => ok500(res, async () => res.json(await svc.listModuleFeatureFlags({ moduleKey: req.params.moduleKey })));

export const createModuleInstallationPlaceholder = (req, res) => ok500(res, async () => res.json(await svc.createModuleInstallationPlaceholder({ moduleKey: req.params.moduleKey, payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) })));
export const listModuleInstallations        = (req, res) => ok500(res, async () => res.json(await svc.listModuleInstallations({ filters: req.query })));
export const updateModuleInstallStatus      = (req, res) => ok500(res, async () => res.json(await svc.updateModuleInstallStatus({ moduleKey: req.params.moduleKey, installStatus: req.body.installStatus, actorUserId: actor(req), reason: req.body.reason, idempotencyKey: ikey(req) })));

export const createModuleActivationState    = (req, res) => ok500(res, async () => res.json(await svc.createModuleActivationState({ moduleKey: req.params.moduleKey, payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) })));
export const listModuleActivationStates     = (req, res) => ok500(res, async () => res.json(await svc.listModuleActivationStates({ filters: req.query })));
export const updateModuleActivationStatus   = (req, res) => ok500(res, async () => res.json(await svc.updateModuleActivationStatus({ moduleKey: req.params.moduleKey, activationStatus: req.body.activationStatus, actorUserId: actor(req), reason: req.body.reason, idempotencyKey: ikey(req) })));

export const createTenantAvailability       = (req, res) => ok500(res, async () => res.json(await svc.createTenantAvailability({ moduleKey: req.params.moduleKey, payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) })));
export const listTenantAvailability         = (req, res) => ok500(res, async () => res.json(await svc.listTenantAvailability({ filters: req.query })));

export const createVenueAvailability        = (req, res) => ok500(res, async () => res.json(await svc.createVenueAvailability({ moduleKey: req.params.moduleKey, payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) })));
export const listVenueAvailability          = (req, res) => ok500(res, async () => res.json(await svc.listVenueAvailability({ filters: req.query })));

export const createPlanRequirement          = (req, res) => ok500(res, async () => res.json(await svc.createPlanRequirement({ moduleKey: req.params.moduleKey, payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) })));
export const listPlanRequirements           = (req, res) => ok500(res, async () => res.json(await svc.listPlanRequirements({ moduleKey: req.params.moduleKey })));

export const createLicenseRequirement       = (req, res) => ok500(res, async () => res.json(await svc.createLicenseRequirement({ moduleKey: req.params.moduleKey, payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) })));
export const listLicenseRequirements        = (req, res) => ok500(res, async () => res.json(await svc.listLicenseRequirements({ moduleKey: req.params.moduleKey })));

export const createDemoLiveModeRecord       = (req, res) => ok500(res, async () => res.json(await svc.createDemoLiveModeRecord({ moduleKey: req.params.moduleKey, payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) })));
export const listDemoLiveModeRecords        = (req, res) => ok500(res, async () => res.json(await svc.listDemoLiveModeRecords({ filters: req.query })));
export const updateDemoLiveMode             = (req, res) => ok500(res, async () => res.json(await svc.updateDemoLiveMode({ moduleKey: req.params.moduleKey, mode: req.body.mode, actorUserId: actor(req), reason: req.body.reason, idempotencyKey: ikey(req) })));

export const createModuleReadinessRecord    = (req, res) => ok500(res, async () => res.json(await svc.createModuleReadinessRecord({ moduleKey: req.params.moduleKey, payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) })));
export const listModuleReadinessRecords     = (req, res) => ok500(res, async () => res.json(await svc.listModuleReadinessRecords({ filters: req.query })));

export const createModuleHealthCheck        = (req, res) => ok500(res, async () => res.json(await svc.createModuleHealthCheck({ moduleKey: req.params.moduleKey, payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) })));
export const listModuleHealthChecks         = (req, res) => ok500(res, async () => res.json(await svc.listModuleHealthChecks({ filters: req.query })));

export const createModuleRollbackRecord     = (req, res) => ok500(res, async () => res.json(await svc.createModuleRollbackRecord({ moduleKey: req.params.moduleKey, payload: req.body, actorUserId: actor(req), idempotencyKey: ikey(req) })));
export const listModuleRollbackRecords      = (req, res) => ok500(res, async () => res.json(await svc.listModuleRollbackRecords({ moduleKey: req.params.moduleKey })));
export const updateModuleRollbackStatus     = (req, res) => ok500(res, async () => res.json(await svc.updateModuleRollbackStatus({ moduleKey: req.params.moduleKey, rollbackStatus: req.body.rollbackStatus, actorUserId: actor(req), reason: req.body.reason, idempotencyKey: ikey(req) })));

export const createPlatformControlSnapshot  = (req, res) => ok500(res, async () => res.json(await svc.createPlatformControlSnapshot({ actorUserId: actor(req), idempotencyKey: ikey(req) })));
export const getLatestPlatformControlSnapshot = (req, res) => ok500(res, async () => res.json(await svc.getLatestPlatformControlSnapshot()));

export const getSafeModuleClaims            = (req, res) => ok500(res, async () => res.json(svc.getSafeModuleClaims()));
export const getUnsafeModuleClaims          = (req, res) => ok500(res, async () => res.json(svc.getUnsafeModuleClaims()));
export const getModuleHonestLimitations     = (req, res) => ok500(res, async () => res.json(svc.getModuleHonestLimitations()));
export const getModulePhaseRoadmap          = (req, res) => ok500(res, async () => res.json(svc.getModulePhaseRoadmap()));
