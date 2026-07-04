// Mounted at /api/pos360/production-readiness
import { Router } from 'express';
import { canAccessPOS3 } from '../middleware/roleMiddleware.js';
import * as c from '../controllers/pos360ProductionReadinessController.js';

const router = Router();

router.get('/registry', c.getProductionReadinessRegistry);
router.get('/registry/:moduleKey', c.getProductionReadinessModule);
router.get('/summary', c.getProductionReadinessSummary);
router.get('/routes/backend', c.getProductionReadinessRoutes);
router.get('/routes/frontend', c.getProductionReadinessFrontendRoutes);
router.get('/claims/safe', c.getSafeVenueClaims);
router.get('/claims/unsafe', c.getUnsafeClaims);
router.get('/what-is-in-place', c.getWhatIsInPlace);
router.get('/what-is-not-in-place', c.getWhatIsNotInPlace);
router.get('/honest-limitations', c.getHonestLimitations);
router.get('/launch-disclosure', c.getLaunchReadinessDisclosure);
router.get('/phase-c-recommendations', c.getPhaseCRecommendations);
router.get('/tracker', c.getFinalPhaseTracker);

router.get('/audit/route-registry', canAccessPOS3, c.runRouteRegistryAudit);
router.get('/audit/frontend-routes', canAccessPOS3, c.runFrontendRouteAudit);
router.get('/audit/api-mounts', canAccessPOS3, c.runApiMountAudit);
router.get('/audit/can-access-pos3', canAccessPOS3, c.runCanAccessPOS3Audit);
router.get('/audit/no-fake-claims', canAccessPOS3, c.runNoFakeClaimsAudit);
router.get('/audit/secret-storage', canAccessPOS3, c.runSecretStorageAudit);
router.get('/audit/pii-financial', canAccessPOS3, c.runPiiFinancialAudit);
router.get('/audit/idempotency', canAccessPOS3, c.runIdempotencyAudit);
router.get('/audit/venue-scope', canAccessPOS3, c.runVenueScopeAudit);
router.get('/audit/manager-approval', canAccessPOS3, c.runManagerApprovalAudit);
router.get('/audit/offline-queue', canAccessPOS3, c.runOfflineQueueAudit);
router.get('/audit/feature-flags', canAccessPOS3, c.runFeatureFlagAudit);
router.get('/audit/locales', canAccessPOS3, c.runLocaleAudit);
router.get('/audit/local-preview-truth', canAccessPOS3, c.runLocalPreviewTruthAudit);
router.get('/audit/demo-mode-controls', canAccessPOS3, c.runDemoModeControlAudit);
router.get('/audit/launch-disclosure', canAccessPOS3, c.runLaunchDisclosureAudit);
router.get('/audit/final', canAccessPOS3, c.runFinalProductionReadinessAudit);

router.post('/lock-snapshot', canAccessPOS3, c.createProductionLockSnapshot);
router.get('/lock-snapshot', canAccessPOS3, c.getProductionLockSnapshot);

export default router;
