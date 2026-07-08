// Phase E.6 — NOVEE OS Remote Module Distribution Routes
// Base: /api/novee-os/remote-distribution

import express from 'express'
import { canAccessPOS3 } from '../middleware/roleMiddleware.js'
import * as ctrl from '../controllers/noveeOSRemoteModuleDistributionController.js'

const router = express.Router()

router.get('/summary', ctrl.getRemoteModuleDistributionSummary)

// Deployment Packages
router.get('/packages', ctrl.listModuleDeploymentPackages)
router.get('/packages/:packageId', ctrl.getModuleDeploymentPackage)
router.post('/packages/preview', canAccessPOS3, ctrl.createModuleDeploymentPackagePreview)
router.patch('/packages/:packageId/status-preview', canAccessPOS3, ctrl.updateModuleDeploymentPackageStatusPreview)

// Client Provisioning Requests
router.get('/provisioning-requests', ctrl.listClientProvisioningRequests)
router.get('/provisioning-requests/:provisioningRequestId', ctrl.getClientProvisioningRequest)
router.post('/provisioning-requests/preview', canAccessPOS3, ctrl.createClientProvisioningRequestPreview)
router.patch('/provisioning-requests/:provisioningRequestId/status-preview', canAccessPOS3, ctrl.updateClientProvisioningRequestStatusPreview)

// Invite Sessions
router.get('/invite-sessions', ctrl.listInviteSessions)
router.get('/invite-sessions/:inviteSessionId', ctrl.getInviteSession)
router.post('/invite-sessions/preview', canAccessPOS3, ctrl.createInviteSessionPreview)
router.patch('/invite-sessions/:inviteSessionId/status-preview', canAccessPOS3, ctrl.updateInviteSessionStatusPreview)

// License Keys
router.get('/license-keys', ctrl.listLicenseKeys)
router.get('/license-keys/:licenseKeyId', ctrl.getLicenseKey)
router.post('/license-keys/preview', canAccessPOS3, ctrl.createLicenseKeyPreview)
router.patch('/license-keys/:licenseKeyId/status-preview', canAccessPOS3, ctrl.updateLicenseKeyStatusPreview)

// Module Activations
router.get('/module-activations', ctrl.listModuleActivations)
router.get('/module-activations/:moduleActivationId', ctrl.getModuleActivation)
router.post('/module-activations/preview', canAccessPOS3, ctrl.createModuleActivationPreview)
router.patch('/module-activations/:moduleActivationId/status-preview', canAccessPOS3, ctrl.updateModuleActivationStatusPreview)

// Deployment Versions
router.get('/deployment-versions', ctrl.listDeploymentVersions)
router.get('/deployment-versions/:deploymentVersionId', ctrl.getDeploymentVersion)
router.post('/deployment-versions/preview', canAccessPOS3, ctrl.createDeploymentVersionPreview)
router.patch('/deployment-versions/:deploymentVersionId/status-preview', canAccessPOS3, ctrl.updateDeploymentVersionStatusPreview)

// Rollback Records
router.get('/rollback-records', ctrl.listRollbackRecords)
router.get('/rollback-records/:rollbackRecordId', ctrl.getRollbackRecord)
router.post('/rollback-records/preview', canAccessPOS3, ctrl.createRollbackRecordPreview)
router.patch('/rollback-records/:rollbackRecordId/status-preview', canAccessPOS3, ctrl.updateRollbackRecordStatusPreview)

// Analytics / Gate Dependencies
router.get('/security-gate-dependency', ctrl.getSecurityGateDependency)
router.get('/deployment-gate-dependency', ctrl.getDeploymentGateDependency)
router.get('/pilot-gate-dependency', ctrl.getPilotGateDependency)
router.get('/readiness-score', ctrl.getRemoteDistributionReadinessScore)
router.get('/blockers', ctrl.getRemoteDistributionBlockers)
router.get('/safe-claims', ctrl.getSafeRemoteDistributionClaims)
router.get('/audit-log', ctrl.getRemoteDistributionAuditLog)
router.post('/audit-log', canAccessPOS3, ctrl.writeRemoteDistributionAuditEvent)
router.get('/feature-flags', ctrl.getRemoteDistributionFeatureFlagSnapshot)
router.get('/validate-readiness', ctrl.validateRemoteModuleDistributionReadiness)

export default router
