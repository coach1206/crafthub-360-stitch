/**
 * NOVEE OS — Deployment Activation Controller (Phase D.7 / Phase E.4)
 * contains_secrets: false
 */

import * as svc from '../services/noveeOS/noveeOSDeploymentActivationService.js'

const ok500    = (res, fn) => fn().catch(e => res.status(500).json({ ok: false, error: e.message }))
const actorId  = req => req.user?.id || req.headers['x-actor-id'] || 'system'
const ikey     = req => req.headers['x-idempotency-key'] || req.body?.idempotencyKey
const tenantId = req => req.query.tenant_id || req.body?.tenant_id || req.user?.tenant_id || null

const wrap = (res, data) => res.json({
  success:                data.ok !== false,
  data:                   data.data || data,
  safeClaim:              'deployment_activation_center_exists',
  productionReady:        false,
  deploymentReady:        false,
  remoteDistributionReady: false,
  blockers:               data.blockers || [],
  timestamp:              new Date().toISOString(),
})

export const getSummary              = (req, res) => ok500(res, async () => wrap(res, await svc.getDeploymentActivationSummary(tenantId(req))))
export const listEnvironments        = (req, res) => ok500(res, async () => wrap(res, await svc.listDeploymentEnvironments(tenantId(req))))
export const getEnvironment          = (req, res) => ok500(res, async () => wrap(res, await svc.getDeploymentEnvironment(req.params.environmentId)))
export const createEnvironment       = (req, res) => ok500(res, async () => wrap(res, await svc.createDeploymentEnvironmentPreview(req.body, actorId(req), ikey(req))))
export const updateEnvironmentStatus = (req, res) => ok500(res, async () => wrap(res, await svc.updateDeploymentEnvironmentStatusPreview(req.params.environmentId, req.body, actorId(req))))
export const listGates               = (req, res) => ok500(res, async () => wrap(res, await svc.listDeploymentReadinessGates(tenantId(req))))
export const getGate                 = (req, res) => ok500(res, async () => wrap(res, await svc.getDeploymentReadinessGate(req.params.gateId)))
export const updateGate              = (req, res) => ok500(res, async () => wrap(res, await svc.updateDeploymentReadinessGatePreview(req.params.gateId, req.body, actorId(req))))
export const listPackages            = (req, res) => ok500(res, async () => wrap(res, await svc.listDeploymentPackages(tenantId(req))))
export const getPackage              = (req, res) => ok500(res, async () => wrap(res, await svc.getDeploymentPackage(req.params.packageId)))
export const createPackage           = (req, res) => ok500(res, async () => wrap(res, await svc.createDeploymentPackagePreview(req.body, actorId(req), ikey(req))))
export const updatePackageStatus     = (req, res) => ok500(res, async () => wrap(res, await svc.updateDeploymentPackageStatusPreview(req.params.packageId, req.body, actorId(req))))
export const listRollbackPlans       = (req, res) => ok500(res, async () => wrap(res, await svc.listRollbackPlans(tenantId(req))))
export const getRollbackPlan         = (req, res) => ok500(res, async () => wrap(res, await svc.getRollbackPlan(req.params.rollbackPlanId)))
export const createRollbackPlan      = (req, res) => ok500(res, async () => wrap(res, await svc.createRollbackPlanPreview(req.body, actorId(req), ikey(req))))
export const updateRollbackPlan      = (req, res) => ok500(res, async () => wrap(res, await svc.updateRollbackPlanStatusPreview(req.params.rollbackPlanId, req.body, actorId(req))))
export const listEvidence            = (req, res) => ok500(res, async () => wrap(res, await svc.listDeploymentEvidence(tenantId(req))))
export const createEvidence          = (req, res) => ok500(res, async () => wrap(res, await svc.createDeploymentEvidencePreview(req.body, actorId(req), ikey(req))))
export const getReadinessScore       = (req, res) => ok500(res, async () => wrap(res, await svc.getDeploymentReadinessScore(tenantId(req))))
export const getBlockers             = (req, res) => ok500(res, async () => wrap(res, await svc.getDeploymentBlockers(tenantId(req))))
export const getSecurityGateDep      = (req, res) => ok500(res, async () => wrap(res, await svc.getSecurityGateDependency()))
export const getRemoteDistGate       = (req, res) => ok500(res, async () => wrap(res, await svc.getRemoteDistributionDeploymentGate(tenantId(req))))
export const getSafeClaims           = (req, res) => ok500(res, async () => wrap(res, await svc.getSafeDeploymentClaims()))
export const getAuditLog             = (req, res) => ok500(res, async () => wrap(res, await svc.getDeploymentAuditLog(tenantId(req), parseInt(req.query.limit) || 50)))
export const getFeatureFlags         = (req, res) => ok500(res, async () => wrap(res, await svc.getDeploymentFeatureFlagSnapshot()))
export const validateReadiness       = (req, res) => ok500(res, async () => wrap(res, await svc.validateDeploymentActivationReadiness(tenantId(req))))
