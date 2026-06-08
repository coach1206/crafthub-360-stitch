import { Router } from 'express'
import { canViewAuditLogs } from '../middleware/roleMiddleware.js'
import * as ctrl from '../controllers/auditController.js'

const router = Router()

router.get( '/session/:sessionId', canViewAuditLogs, ctrl.getSessionAudit)

export default router
