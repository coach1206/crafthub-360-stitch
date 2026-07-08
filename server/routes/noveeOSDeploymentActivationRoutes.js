/**
 * NOVEE OS — Deployment Activation Routes (Phase D.7 / Phase E.4)
 * contains_secrets: false
 * Mounted at: /api/phase-d/deployment-activation
 */

import { Router } from 'express'
import { canAccessPOS3 } from '../middleware/roleMiddleware.js'
import * as ctrl from '../controllers/noveeOSDeploymentActivationController.js'

const router = Router()

router.get('/summary',                                               ctrl.getSummary)
router.get('/environments',                                          ctrl.listEnvironments)
router.get('/environments/:environmentId',                           ctrl.getEnvironment)
router.post('/environments/preview',                                 canAccessPOS3, ctrl.createEnvironment)
router.patch('/environments/:environmentId/status-preview',          canAccessPOS3, ctrl.updateEnvironmentStatus)
router.get('/gates',                                                 ctrl.listGates)
router.get('/gates/:gateId',                                         ctrl.getGate)
router.patch('/gates/:gateId/preview',                               canAccessPOS3, ctrl.updateGate)
router.get('/packages',                                              ctrl.listPackages)
router.get('/packages/:packageId',                                   ctrl.getPackage)
router.post('/packages/preview',                                     canAccessPOS3, ctrl.createPackage)
router.patch('/packages/:packageId/status-preview',                  canAccessPOS3, ctrl.updatePackageStatus)
router.get('/rollback-plans',                                        ctrl.listRollbackPlans)
router.get('/rollback-plans/:rollbackPlanId',                        ctrl.getRollbackPlan)
router.post('/rollback-plans/preview',                               canAccessPOS3, ctrl.createRollbackPlan)
router.patch('/rollback-plans/:rollbackPlanId/status-preview',       canAccessPOS3, ctrl.updateRollbackPlan)
router.get('/evidence',                                              ctrl.listEvidence)
router.post('/evidence/preview',                                     canAccessPOS3, ctrl.createEvidence)
router.get('/readiness-score',                                       ctrl.getReadinessScore)
router.get('/blockers',                                              ctrl.getBlockers)
router.get('/security-gate-dependency',                              ctrl.getSecurityGateDep)
router.get('/remote-distribution-gate',                              ctrl.getRemoteDistGate)
router.get('/safe-claims',                                           ctrl.getSafeClaims)
router.get('/audit-log',                                             ctrl.getAuditLog)
router.get('/feature-flags',                                         ctrl.getFeatureFlags)
router.get('/validate-readiness',                                    ctrl.validateReadiness)

export default router
