/**
 * Demo Routes — Phase 13
 * /api/demo — manager+ for status/events, admin+ for reset
 */

import { Router }                            from 'express'
import { requireAuth }                       from '../middleware/authMiddleware.js'
import { requireManager, requireAdmin }      from '../middleware/roleMiddleware.js'
import * as ctrl                             from '../controllers/demoController.js'

const router = Router()

router.get(  '/status',  requireAuth, requireManager, ctrl.getStatus)
router.post( '/start',   requireAuth, requireManager, ctrl.startDemo)
router.post( '/end',     requireAuth, requireManager, ctrl.endDemo)
router.post( '/event',   requireAuth, requireManager, ctrl.recordEvent)
router.get(  '/summary', requireAuth, requireManager, ctrl.getDemoSummary)
router.post( '/reset',   requireAuth, requireAdmin,   ctrl.resetDemo)

export default router
