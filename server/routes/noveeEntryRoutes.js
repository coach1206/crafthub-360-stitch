/**
 * NOVEE OS — Entry Routes
 * Mounted at /api/novee
 *
 * GET  /api/novee/entry/status   — safe status for any visitor
 * POST /api/novee/entry/open     — authorize module entry
 * POST /api/novee/demo/start     — start guest demo session
 * POST /api/novee/demo/end       — end demo session
 * GET  /api/novee/demo/status    — check demo session
 */

import { Router }       from 'express'
import { optionalAuth } from '../middleware/authMiddleware.js'
import * as ctrl        from '../controllers/noveeEntryController.js'

const router = Router()

// All routes use optionalAuth — unauthenticated guests receive safe responses
router.use(optionalAuth)

router.get ('/entry/status',  ctrl.getEntryStatus)
router.post('/entry/open',    ctrl.openModule)
router.post('/demo/start',    ctrl.startDemo)
router.post('/demo/end',      ctrl.endDemo)
router.get ('/demo/status',   ctrl.getDemoStatus)

export default router
