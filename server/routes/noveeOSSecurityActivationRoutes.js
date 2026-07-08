/**
 * NOVEE OS — Security Activation Routes (Phase D.6 / Phase E.3)
 * contains_secrets: false
 * Mounted at: /api/phase-d/security-activation
 */

import { Router } from 'express'
import { canAccessPOS3 } from '../middleware/roleMiddleware.js'
import * as ctrl from '../controllers/noveeOSSecurityActivationController.js'

const router = Router()

router.get('/summary',                            ctrl.getSummary)
router.get('/providers',                          ctrl.listProviders)
router.get('/providers/:providerId',              ctrl.getProvider)
router.post('/providers/preview',                 canAccessPOS3, ctrl.createProvider)
router.patch('/providers/:providerId/status-preview', canAccessPOS3, ctrl.updateProviderStatus)
router.get('/gates',                              ctrl.listGates)
router.get('/gates/:gateId',                      ctrl.getGate)
router.patch('/gates/:gateId/preview',            canAccessPOS3, ctrl.updateGate)
router.get('/risks',                              ctrl.listRisks)
router.post('/risks/preview',                     canAccessPOS3, ctrl.createRisk)
router.patch('/risks/:riskId/status-preview',     canAccessPOS3, ctrl.updateRiskStatus)
router.get('/evidence',                           ctrl.listEvidence)
router.post('/evidence/preview',                  canAccessPOS3, ctrl.createEvidence)
router.get('/readiness-score',                    ctrl.getReadinessScore)
router.get('/blockers',                           ctrl.getBlockers)
router.get('/remote-distribution-gate',           ctrl.getRemoteDistGate)
router.get('/safe-claims',                        ctrl.getSafeClaims)
router.get('/audit-log',                          ctrl.getAuditLog)
router.get('/feature-flags',                      ctrl.getFeatureFlags)
router.get('/validate-readiness',                 ctrl.validateReadiness)

export default router
