import { Router } from 'express'
import { handleLiveExternalOpsReadiness, handleLiveExternalOpsBlockers, handleCredentialStatus, handleSubmissionReadiness, handlePushReadiness } from '../controllers/liveExternalOpsController.js'

const router = Router()
router.get('/readiness', handleLiveExternalOpsReadiness)
router.get('/blockers', handleLiveExternalOpsBlockers)
router.get('/credentials/status', handleCredentialStatus)
router.get('/submission-readiness', handleSubmissionReadiness)
router.get('/push-readiness', handlePushReadiness)
export default router
