import { Router } from 'express'
import { requireStaff } from '../middleware/roleMiddleware.js'
import * as ctrl from '../controllers/pos3Controller.js'

const router = Router()

// POS 3 data is staff-only in production
router.post( '/activity',                   ctrl.saveActivity)
router.get(  '/session/:sessionId/payload', ctrl.getSessionPayload)

export default router
