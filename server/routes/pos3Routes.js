import { Router } from 'express'
import { canAccessPOS3 } from '../middleware/roleMiddleware.js'
import * as ctrl from '../controllers/pos3Controller.js'

const router = Router()

router.post( '/activity',                   canAccessPOS3, ctrl.saveActivity)
router.get(  '/session/:sessionId/payload', canAccessPOS3, ctrl.getSessionPayload)

export default router
