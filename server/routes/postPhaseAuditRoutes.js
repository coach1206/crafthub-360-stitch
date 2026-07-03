import { Router } from 'express'
import {
  handlePostPhaseAuditReview,
  handleSealedCoreStatus,
  handleFPLMRLIntegrity,
  handleProductionBlockers,
  handleStripeReadiness,
  handleDatabaseReadiness,
  handleSessionSecretReadiness,
  handleEnvChecklist,
  handleModuleBuildReadiness,
  handleModuleBuild1Requirements,
  handlePlatformClarification,
} from '../controllers/postPhaseAuditController.js'

const router = Router()

router.get('/audit-review',              handlePostPhaseAuditReview)
router.get('/sealed-core-status',        handleSealedCoreStatus)
router.get('/fplmrl-integrity',          handleFPLMRLIntegrity)
router.get('/production-blockers',       handleProductionBlockers)
router.get('/stripe-readiness',          handleStripeReadiness)
router.get('/database-readiness',        handleDatabaseReadiness)
router.get('/session-secret-readiness',  handleSessionSecretReadiness)
router.get('/env-checklist',             handleEnvChecklist)
router.get('/module-build-readiness',    handleModuleBuildReadiness)
router.get('/module-build-1-requirements', handleModuleBuild1Requirements)
router.get('/platform-clarification',    handlePlatformClarification)

export default router
