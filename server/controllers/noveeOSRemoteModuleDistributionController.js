// Phase E.6 — NOVEE OS Remote Module Distribution Controller
import * as svc from '../services/noveeOS/noveeOSRemoteModuleDistributionService.js'
import {
  validateDeploymentPackagePayload, validateProvisioningRequestPayload,
  validateInviteSessionPayload, validateLicenseKeyPayload,
  validateModuleActivationPayload, validateDeploymentVersionPayload,
  validateRollbackRecordPayload,
  assertNoFakeRemoteDeliveryClaims, assertNoFakeClientProvisioningClaims,
  assertNoFakeInviteCompletionClaims, assertNoFakeLicenseValidationClaims,
  assertNoFakeTenantActivationClaims, assertNoFakeRollbackExecutionClaims,
  assertNoRawDistributionSecrets,
} from '../services/noveeOS/noveeOSRemoteModuleDistributionContracts.js'

const ok500 = (res, fn) => fn().catch(e => res.status(500).json({ ok: false, error: e.message }))
const actorId = req => req.user?.id || req.headers['x-actor-id'] || 'system'
const ikey = req => req.headers['x-idempotency-key'] || req.body?.idempotencyKey
const tenantId = req => req.query.tenant_id || req.body?.tenant_id || req.user?.tenant_id || null

const wrap = (res, data) => res.json({
  success: true,
  data,
  safeClaim: 'remote_module_distribution_center_exists',
  productionReady: false,
  securityReady: false,
  deploymentReady: false,
  pilotReady: false,
  remoteDistributionReady: false,
  blockers: [],
  timestamp: new Date().toISOString(),
})

export async function getRemoteModuleDistributionSummary(req, res) { ok500(res, async () => { wrap(res, await svc.getRemoteModuleDistributionSummary()) }) }

export async function listModuleDeploymentPackages(req, res) { ok500(res, async () => { wrap(res, await svc.listModuleDeploymentPackages(tenantId(req))) }) }
export async function getModuleDeploymentPackage(req, res) { ok500(res, async () => { wrap(res, await svc.getModuleDeploymentPackage(req.params.packageId)) }) }
export async function createModuleDeploymentPackagePreview(req, res) {
  ok500(res, async () => { validateDeploymentPackagePayload(req.body); wrap(res, await svc.createModuleDeploymentPackagePreview(req.body, actorId(req))) })
}
export async function updateModuleDeploymentPackageStatusPreview(req, res) {
  ok500(res, async () => { assertNoFakeRemoteDeliveryClaims(req.body); wrap(res, await svc.updateModuleDeploymentPackageStatusPreview(req.params.packageId, req.body, actorId(req))) })
}

export async function listClientProvisioningRequests(req, res) { ok500(res, async () => { wrap(res, await svc.listClientProvisioningRequests(tenantId(req))) }) }
export async function getClientProvisioningRequest(req, res) { ok500(res, async () => { wrap(res, await svc.getClientProvisioningRequest(req.params.provisioningRequestId)) }) }
export async function createClientProvisioningRequestPreview(req, res) {
  ok500(res, async () => { validateProvisioningRequestPayload(req.body); wrap(res, await svc.createClientProvisioningRequestPreview(req.body, actorId(req), ikey(req))) })
}
export async function updateClientProvisioningRequestStatusPreview(req, res) {
  ok500(res, async () => { assertNoFakeClientProvisioningClaims(req.body); wrap(res, await svc.updateClientProvisioningRequestStatusPreview(req.params.provisioningRequestId, req.body, actorId(req))) })
}

export async function listInviteSessions(req, res) { ok500(res, async () => { wrap(res, await svc.listInviteSessions(tenantId(req))) }) }
export async function getInviteSession(req, res) { ok500(res, async () => { wrap(res, await svc.getInviteSession(req.params.inviteSessionId)) }) }
export async function createInviteSessionPreview(req, res) {
  ok500(res, async () => { validateInviteSessionPayload(req.body); wrap(res, await svc.createInviteSessionPreview(req.body, actorId(req), ikey(req))) })
}
export async function updateInviteSessionStatusPreview(req, res) {
  ok500(res, async () => { assertNoFakeInviteCompletionClaims(req.body); wrap(res, await svc.updateInviteSessionStatusPreview(req.params.inviteSessionId, req.body, actorId(req))) })
}

export async function listLicenseKeys(req, res) { ok500(res, async () => { wrap(res, await svc.listLicenseKeys(tenantId(req))) }) }
export async function getLicenseKey(req, res) { ok500(res, async () => { wrap(res, await svc.getLicenseKey(req.params.licenseKeyId)) }) }
export async function createLicenseKeyPreview(req, res) {
  ok500(res, async () => { validateLicenseKeyPayload(req.body); wrap(res, await svc.createLicenseKeyPreview(req.body, actorId(req), ikey(req))) })
}
export async function updateLicenseKeyStatusPreview(req, res) {
  ok500(res, async () => { assertNoFakeLicenseValidationClaims(req.body); wrap(res, await svc.updateLicenseKeyStatusPreview(req.params.licenseKeyId, req.body, actorId(req))) })
}

export async function listModuleActivations(req, res) { ok500(res, async () => { wrap(res, await svc.listModuleActivations(tenantId(req))) }) }
export async function getModuleActivation(req, res) { ok500(res, async () => { wrap(res, await svc.getModuleActivation(req.params.moduleActivationId)) }) }
export async function createModuleActivationPreview(req, res) {
  ok500(res, async () => { validateModuleActivationPayload(req.body); wrap(res, await svc.createModuleActivationPreview(req.body, actorId(req), ikey(req))) })
}
export async function updateModuleActivationStatusPreview(req, res) {
  ok500(res, async () => { assertNoFakeTenantActivationClaims(req.body); wrap(res, await svc.updateModuleActivationStatusPreview(req.params.moduleActivationId, req.body, actorId(req))) })
}

export async function listDeploymentVersions(req, res) { ok500(res, async () => { wrap(res, await svc.listDeploymentVersions(tenantId(req))) }) }
export async function getDeploymentVersion(req, res) { ok500(res, async () => { wrap(res, await svc.getDeploymentVersion(req.params.deploymentVersionId)) }) }
export async function createDeploymentVersionPreview(req, res) {
  ok500(res, async () => { validateDeploymentVersionPayload(req.body); wrap(res, await svc.createDeploymentVersionPreview(req.body, actorId(req), ikey(req))) })
}
export async function updateDeploymentVersionStatusPreview(req, res) {
  ok500(res, async () => { wrap(res, await svc.updateDeploymentVersionStatusPreview(req.params.deploymentVersionId, req.body, actorId(req))) })
}

export async function listRollbackRecords(req, res) { ok500(res, async () => { wrap(res, await svc.listRollbackRecords(tenantId(req))) }) }
export async function getRollbackRecord(req, res) { ok500(res, async () => { wrap(res, await svc.getRollbackRecord(req.params.rollbackRecordId)) }) }
export async function createRollbackRecordPreview(req, res) {
  ok500(res, async () => { validateRollbackRecordPayload(req.body); wrap(res, await svc.createRollbackRecordPreview(req.body, actorId(req), ikey(req))) })
}
export async function updateRollbackRecordStatusPreview(req, res) {
  ok500(res, async () => { assertNoFakeRollbackExecutionClaims(req.body); wrap(res, await svc.updateRollbackRecordStatusPreview(req.params.rollbackRecordId, req.body, actorId(req))) })
}

export async function getSecurityGateDependency(req, res) { ok500(res, async () => { wrap(res, await svc.getSecurityGateDependency()) }) }
export async function getDeploymentGateDependency(req, res) { ok500(res, async () => { wrap(res, await svc.getDeploymentGateDependency()) }) }
export async function getPilotGateDependency(req, res) { ok500(res, async () => { wrap(res, await svc.getPilotGateDependency()) }) }
export async function getRemoteDistributionReadinessScore(req, res) { ok500(res, async () => { wrap(res, await svc.getRemoteDistributionReadinessScore()) }) }
export async function getRemoteDistributionBlockers(req, res) { ok500(res, async () => { wrap(res, await svc.getRemoteDistributionBlockers()) }) }
export async function getSafeRemoteDistributionClaims(req, res) { ok500(res, async () => { wrap(res, await svc.getSafeRemoteDistributionClaims()) }) }
export async function writeRemoteDistributionAuditEvent(req, res) { ok500(res, async () => { assertNoRawDistributionSecrets(req.body); wrap(res, await svc.writeRemoteDistributionAuditEvent(req.body, actorId(req), ikey(req))) }) }
export async function getRemoteDistributionAuditLog(req, res) { ok500(res, async () => { wrap(res, await svc.getRemoteDistributionAuditLog(tenantId(req))) }) }
export async function getRemoteDistributionFeatureFlagSnapshot(req, res) { ok500(res, async () => { wrap(res, await svc.getRemoteDistributionFeatureFlagSnapshot()) }) }
export async function validateRemoteModuleDistributionReadiness(req, res) { ok500(res, async () => { wrap(res, await svc.validateRemoteModuleDistributionReadiness()) }) }
