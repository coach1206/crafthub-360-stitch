import { Router } from 'express'
import { canAccessEAT } from '../middleware/roleMiddleware.js'
import * as ctrl from '../controllers/eatController.js'

const router = Router()

// E.A.T. Command — manager-level minimum. Never guest-facing.
router.post( '/analytics',                  canAccessEAT, ctrl.saveAnalytics)
router.get(  '/session/:sessionId/payload', canAccessEAT, ctrl.getSessionPayload)
router.get(  '/dashboard',                  canAccessEAT, ctrl.getDashboard)

export default router
