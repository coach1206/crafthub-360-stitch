import { Router } from 'express'
import { requireStaff } from '../middleware/roleMiddleware.js'
import * as ctrl from '../controllers/eatController.js'

const router = Router()

// E.A.T. Command data is management-only — never guest-facing
router.post( '/analytics',                  ctrl.saveAnalytics)
router.get(  '/session/:sessionId/payload', ctrl.getSessionPayload)
router.get(  '/dashboard',                  ctrl.getDashboard)

export default router
