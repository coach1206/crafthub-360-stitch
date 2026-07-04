// Mounted at /api/novee-os/modules
// platformAdminGuardRequired = true
// All write routes guarded with canAccessPOS3 (closest platform admin guard available in Phase C.1)

import { Router } from 'express';
import { canAccessPOS3 } from '../middleware/roleMiddleware.js';
import * as c from '../controllers/noveeOSModuleRegistryController.js';

const router = Router();

// ─── READ-ONLY PUBLIC ─────────────────────────────────────────────────────────
router.get('/default-registry',               c.getDefaultCoreModuleRegistry);
router.get('/registry',                        c.listModules);
router.get('/registry/:moduleKey',             c.getModule);
router.get('/claims/safe',                     c.getSafeModuleClaims);
router.get('/claims/unsafe',                   c.getUnsafeModuleClaims);
router.get('/claims/honest-limitations',       c.getModuleHonestLimitations);
router.get('/roadmap',                         c.getModulePhaseRoadmap);
router.get('/snapshots/latest',                c.getLatestPlatformControlSnapshot);
router.get('/installations',                   c.listModuleInstallations);
router.get('/activation',                      c.listModuleActivationStates);
router.get('/tenant-availability',             c.listTenantAvailability);
router.get('/venue-availability',              c.listVenueAvailability);
router.get('/demo-live-mode',                  c.listDemoLiveModeRecords);
router.get('/readiness',                       c.listModuleReadinessRecords);
router.get('/health-checks',                   c.listModuleHealthChecks);

router.get('/registry/:moduleKey/versions',       c.listModuleVersions);
router.get('/registry/:moduleKey/backend-routes', c.listModuleBackendRoutes);
router.get('/registry/:moduleKey/frontend-routes', c.listModuleFrontendRoutes);
router.get('/registry/:moduleKey/dependencies',   c.listModuleDependencies);
router.get('/registry/:moduleKey/permissions',    c.listModulePermissions);
router.get('/registry/:moduleKey/feature-flags',  c.listModuleFeatureFlags);
router.get('/registry/:moduleKey/plan-requirements',    c.listPlanRequirements);
router.get('/registry/:moduleKey/license-requirements', c.listLicenseRequirements);
router.get('/registry/:moduleKey/rollbacks',      c.listModuleRollbackRecords);

// ─── GUARDED WRITES ───────────────────────────────────────────────────────────
router.post('/registry',                              canAccessPOS3, c.registerModule);
router.patch('/registry/:moduleKey/status',           canAccessPOS3, c.updateModuleStatus);

router.post('/registry/:moduleKey/versions',          canAccessPOS3, c.createModuleVersion);
router.post('/registry/:moduleKey/backend-routes',    canAccessPOS3, c.registerModuleBackendRoute);
router.post('/registry/:moduleKey/frontend-routes',   canAccessPOS3, c.registerModuleFrontendRoute);
router.post('/registry/:moduleKey/dependencies',      canAccessPOS3, c.createModuleDependency);
router.post('/registry/:moduleKey/permissions',       canAccessPOS3, c.createModulePermission);
router.post('/registry/:moduleKey/feature-flags',     canAccessPOS3, c.createModuleFeatureFlag);

router.post('/registry/:moduleKey/installations',     canAccessPOS3, c.createModuleInstallationPlaceholder);
router.patch('/registry/:moduleKey/install-status',   canAccessPOS3, c.updateModuleInstallStatus);

router.post('/registry/:moduleKey/activation',        canAccessPOS3, c.createModuleActivationState);
router.patch('/registry/:moduleKey/activation-status', canAccessPOS3, c.updateModuleActivationStatus);

router.post('/registry/:moduleKey/tenant-availability', canAccessPOS3, c.createTenantAvailability);
router.post('/registry/:moduleKey/venue-availability',  canAccessPOS3, c.createVenueAvailability);

router.post('/registry/:moduleKey/plan-requirements',    canAccessPOS3, c.createPlanRequirement);
router.post('/registry/:moduleKey/license-requirements', canAccessPOS3, c.createLicenseRequirement);

router.post('/registry/:moduleKey/demo-live-mode',    canAccessPOS3, c.createDemoLiveModeRecord);
router.patch('/registry/:moduleKey/demo-live-mode',   canAccessPOS3, c.updateDemoLiveMode);

router.post('/registry/:moduleKey/readiness',         canAccessPOS3, c.createModuleReadinessRecord);
router.post('/registry/:moduleKey/health-checks',     canAccessPOS3, c.createModuleHealthCheck);

router.post('/registry/:moduleKey/rollbacks',         canAccessPOS3, c.createModuleRollbackRecord);
router.patch('/registry/:moduleKey/rollback-status',  canAccessPOS3, c.updateModuleRollbackStatus);

router.post('/snapshots',                             canAccessPOS3, c.createPlatformControlSnapshot);

export default router;
