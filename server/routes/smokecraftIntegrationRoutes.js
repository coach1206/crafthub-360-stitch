/**
 * SmokeCraft Integration Routes
 * All routes under /api/modules/smokecraft/integrations
 */

import { Router } from 'express'
import {
  getIntegrationStatus,
  getEnvironmentStatus,
  getDatabaseStatus,
  getConnectorsStatus,
  getHealthStatus,
  getProductionReadiness,
  getSyncEvents,
  queueSyncEvent,
  retrySyncEvent,
  getAuditLog,
} from '../controllers/smokecraftIntegrationController.js'

const router = Router()

router.get('/status',              getIntegrationStatus)
router.get('/environment',         getEnvironmentStatus)
router.get('/database',            getDatabaseStatus)
router.get('/connectors',          getConnectorsStatus)
router.get('/health',              getHealthStatus)
router.get('/production-readiness',getProductionReadiness)
router.get('/sync/events',         getSyncEvents)
router.post('/sync/queue',         queueSyncEvent)
router.post('/sync/:syncEventId/retry', retrySyncEvent)
router.get('/audit',               getAuditLog)

export default router
