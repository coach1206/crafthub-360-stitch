import { Router } from 'express'
import { canAccessPOS3 } from '../middleware/roleMiddleware.js'
import * as ctrl from '../controllers/noveeOSOnboardingTrainingController.js'

const router = Router()

router.get('/summary', ctrl.getSummary)

router.get('/programs', ctrl.listPrograms)
router.get('/programs/:programId', ctrl.getProgram)
router.post('/programs/preview', canAccessPOS3, ctrl.createProgramPreview)
router.patch('/programs/:programId/status-preview', canAccessPOS3, ctrl.updateProgramStatusPreview)

router.get('/manuals', ctrl.listManuals)
router.get('/manuals/:manualId', ctrl.getManual)
router.post('/manuals/preview', canAccessPOS3, ctrl.createManualPreview)
router.patch('/manuals/:manualId/status-preview', canAccessPOS3, ctrl.updateManualStatusPreview)

router.get('/lessons', ctrl.listLessons)
router.get('/lessons/:lessonId', ctrl.getLesson)
router.post('/lessons/preview', canAccessPOS3, ctrl.createLessonPreview)
router.patch('/lessons/:lessonId/status-preview', canAccessPOS3, ctrl.updateLessonStatusPreview)

router.get('/checklist', ctrl.listChecklist)
router.get('/checklist/:checklistItemId', ctrl.getChecklistItem)
router.patch('/checklist/:checklistItemId/preview', canAccessPOS3, ctrl.updateChecklistItemPreview)

router.get('/progress', ctrl.listProgress)
router.get('/progress/:progressId', ctrl.getProgress)
router.patch('/progress/:progressId/preview', canAccessPOS3, ctrl.updateProgressPreview)

router.get('/evidence', ctrl.listEvidence)
router.post('/evidence/preview', canAccessPOS3, ctrl.createEvidencePreview)

router.get('/acceptance', ctrl.listAcceptance)
router.post('/acceptance/preview', canAccessPOS3, ctrl.createAcceptancePreview)

router.get('/readiness-score', ctrl.getReadinessScore)
router.get('/blockers', ctrl.getBlockers)
router.get('/remote-distribution-gate', ctrl.getRemoteDistributionGate)
router.get('/safe-claims', ctrl.getSafeClaims)
router.get('/audit-log', ctrl.getAuditLog)
router.get('/feature-flags', ctrl.getFeatureFlags)
router.get('/validate-readiness', ctrl.validateReadiness)

export default router
