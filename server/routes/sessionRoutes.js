import { Router } from 'express'
import { attachGuestContext } from '../middleware/authMiddleware.js'
import * as ctrl from '../controllers/sessionController.js'

const router = Router()

router.use(attachGuestContext)

router.post(  '/',                              ctrl.createSession)
router.get(   '/:sessionId',                   ctrl.getSession)
router.put(   '/:sessionId',                   ctrl.updateSession)
router.post(  '/:sessionId/profile',           ctrl.saveGuestProfile)
router.post(  '/:sessionId/complete-smokecraft-session', ctrl.completeSmokeCraftSession)

export default router
