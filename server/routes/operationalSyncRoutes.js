import { Router } from 'express'
import { handleSyncConsumerReadiness, handleGetQueuedEvents, handleProcessEventPreview, handleProcessBatchPreview } from '../controllers/operationalSyncController.js'

const router = Router()
router.get('/readiness', handleSyncConsumerReadiness)
router.get('/events/queued', handleGetQueuedEvents)
router.post('/events/process-preview', handleProcessEventPreview)
router.post('/events/process-batch-preview', handleProcessBatchPreview)
export default router
