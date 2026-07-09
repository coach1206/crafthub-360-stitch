import { Router } from 'express'
import {
  getHealth,
  getAssets,
  createConnection,
  recordWorkflowEvent,
  getConnections,
  getWorkflowEvents,
  writeAuditEvent,
  getAuditLog,
} from '../controllers/dayone360SmokeCraftConnectionController.js'

const router = Router()

router.get('/health',          getHealth)
router.get('/assets',          getAssets)
router.post('/connection',     createConnection)
router.post('/workflow-event', recordWorkflowEvent)
router.get('/connections',     getConnections)
router.get('/workflow-events', getWorkflowEvents)
router.post('/audit/event',    writeAuditEvent)
router.get('/audit-log',       getAuditLog)

export default router
