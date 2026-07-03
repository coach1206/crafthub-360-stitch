import { Router } from 'express'
import {
  getFinalLockdownAudit,
  getProtectedFiles,
  getProductionReadiness,
  getDegradedModeHonesty,
  getSecuritySafety,
  getModuleReadiness,
  getMarketplaceReadiness,
  getWhiteLabelReadiness,
  getVerificationRegistry,
  getLaunchChecklist,
  getPostPhaseModulePlan,
} from '../controllers/finalLockdownController.js'

const router = Router()

router.get('/audit',                getFinalLockdownAudit)
router.get('/protected-files',      getProtectedFiles)
router.get('/production-readiness', getProductionReadiness)
router.get('/degraded-mode-honesty',getDegradedModeHonesty)
router.get('/security-safety',      getSecuritySafety)
router.get('/module-readiness',     getModuleReadiness)
router.get('/marketplace-readiness',getMarketplaceReadiness)
router.get('/white-label-readiness',getWhiteLabelReadiness)
router.get('/verification-registry',getVerificationRegistry)
router.get('/launch-checklist',     getLaunchChecklist)
router.get('/post-phase-module-plan',getPostPhaseModulePlan)

export default router
