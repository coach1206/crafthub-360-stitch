import { Router } from 'express'
import { requireAuth } from '../middleware/authMiddleware.js'
import { canAccessEAT } from '../middleware/roleMiddleware.js'
import * as ctrl from '../controllers/eatController.js'

const router = Router()

// E.A.T. Command — manager-level minimum. Never guest-facing.
// requireAuth must precede canAccessEAT to populate req.user from the JWT cookie.
router.post( '/analytics',                  requireAuth, canAccessEAT, ctrl.saveAnalytics)
router.get(  '/session/:sessionId/payload', requireAuth, canAccessEAT, ctrl.getSessionPayload)
router.get(  '/dashboard',                  requireAuth, canAccessEAT, ctrl.getDashboard)

export default router
