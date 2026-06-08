/**
 * Founder Routes — /api/founder/*
 * ALL routes require founder_level_0. No exceptions. No prototype bypass.
 */

import { Router } from 'express'
import { requireAuth }          from '../middleware/authMiddleware.js'
import { requireFounderLevel0 } from '../middleware/roleMiddleware.js'
import * as fc from '../controllers/founderController.js'

const router = Router()

// Apply auth + absolute founder gate to every route in this group
router.use(requireAuth, requireFounderLevel0)

router.get('/status',                fc.getStatus)
router.get('/controls',              fc.getControls)
router.put('/controls/:controlKey',  fc.updateControl)
router.post('/emergency-lock',       fc.triggerEmergencyLock)
router.post('/override',             fc.triggerOverride)
router.get('/audit',                 fc.getAudit)

export default router
