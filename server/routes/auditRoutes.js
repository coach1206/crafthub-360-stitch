import { Router } from 'express'
import { requireStaff } from '../middleware/roleMiddleware.js'
import * as ctrl from '../controllers/auditController.js'

const router = Router()

// Audit log access is staff-only in production
router.get( '/session/:sessionId', ctrl.getSessionAudit)

export default router
