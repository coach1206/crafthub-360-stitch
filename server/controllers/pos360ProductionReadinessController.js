import * as svc from '../services/pos360/pos360ProductionReadinessService.js';

const ok500 = (res, fn) => fn().catch(e => res.status(500).json({ ok: false, error: e.message }));
const vid = req => req.headers['x-venue-id'] || req.query.venue_id || req.body?.venue_id;
const actor = req => req.user?.id || req.headers['x-actor-id'] || 'system';

export const getProductionReadinessRegistry = (req, res) =>
  ok500(res, async () => res.json(await svc.getProductionReadinessRegistry()));

export const getProductionReadinessModule = (req, res) =>
  ok500(res, async () => res.json(await svc.getProductionReadinessModule(req.params.moduleKey)));

export const getProductionReadinessSummary = (req, res) =>
  ok500(res, async () => res.json(await svc.getProductionReadinessSummary()));

export const getProductionReadinessRoutes = (req, res) =>
  ok500(res, async () => res.json(await svc.getProductionReadinessRoutes()));

export const getProductionReadinessFrontendRoutes = (req, res) =>
  ok500(res, async () => res.json(await svc.getProductionReadinessFrontendRoutes()));

export const runRouteRegistryAudit = (req, res) =>
  ok500(res, async () => res.json(await svc.runRouteRegistryAudit()));

export const runFrontendRouteAudit = (req, res) =>
  ok500(res, async () => res.json(await svc.runFrontendRouteAudit()));

export const runApiMountAudit = (req, res) =>
  ok500(res, async () => res.json(await svc.runApiMountAudit()));

export const runCanAccessPOS3Audit = (req, res) =>
  ok500(res, async () => res.json(await svc.runCanAccessPOS3Audit()));

export const runNoFakeClaimsAudit = (req, res) =>
  ok500(res, async () => res.json(await svc.runNoFakeClaimsAudit()));

export const runSecretStorageAudit = (req, res) =>
  ok500(res, async () => res.json(await svc.runSecretStorageAudit()));

export const runPiiFinancialAudit = (req, res) =>
  ok500(res, async () => res.json(await svc.runPiiFinancialAudit()));

export const runIdempotencyAudit = (req, res) =>
  ok500(res, async () => res.json(await svc.runIdempotencyAudit()));

export const runVenueScopeAudit = (req, res) =>
  ok500(res, async () => res.json(await svc.runVenueScopeAudit()));

export const runManagerApprovalAudit = (req, res) =>
  ok500(res, async () => res.json(await svc.runManagerApprovalAudit()));

export const runOfflineQueueAudit = (req, res) =>
  ok500(res, async () => res.json(await svc.runOfflineQueueAudit()));

export const runFeatureFlagAudit = (req, res) =>
  ok500(res, async () => res.json(await svc.runFeatureFlagAudit()));

export const runLocaleAudit = (req, res) =>
  ok500(res, async () => res.json(await svc.runLocaleAudit()));

export const runLocalPreviewTruthAudit = (req, res) =>
  ok500(res, async () => res.json(await svc.runLocalPreviewTruthAudit()));

export const runDemoModeControlAudit = (req, res) =>
  ok500(res, async () => res.json(await svc.runDemoModeControlAudit()));

export const runLaunchDisclosureAudit = (req, res) =>
  ok500(res, async () => res.json(await svc.runLaunchDisclosureAudit()));

export const runFinalProductionReadinessAudit = (req, res) =>
  ok500(res, async () => res.json(await svc.runFinalProductionReadinessAudit()));

export const getSafeVenueClaims = (req, res) =>
  ok500(res, async () => res.json(svc.getSafeVenueClaims()));

export const getUnsafeClaims = (req, res) =>
  ok500(res, async () => res.json(svc.getUnsafeClaims()));

export const getWhatIsInPlace = (req, res) =>
  ok500(res, async () => res.json(svc.getWhatIsInPlace()));

export const getWhatIsNotInPlace = (req, res) =>
  ok500(res, async () => res.json(svc.getWhatIsNotInPlace()));

export const getHonestLimitations = (req, res) =>
  ok500(res, async () => res.json(svc.getHonestLimitations()));

export const getLaunchReadinessDisclosure = (req, res) =>
  ok500(res, async () => res.json(svc.getLaunchReadinessDisclosure()));

export const getPhaseCRecommendations = (req, res) =>
  ok500(res, async () => res.json(svc.getPhaseCRecommendations()));

export const createProductionLockSnapshot = (req, res) =>
  ok500(res, async () => res.json(await svc.createProductionLockSnapshot(vid(req), actor(req))));

export const getProductionLockSnapshot = (req, res) =>
  ok500(res, async () => res.json(await svc.getProductionLockSnapshot(vid(req))));

export const getFinalPhaseTracker = (req, res) =>
  ok500(res, async () => res.json(await svc.getFinalPhaseTracker()));
