/**
 * Founder Routes — /api/founder/*
 *
 * Triple-gated:
 *   1. requireAuth    — must have valid JWT or dev header
 *   2. blockDevFounderSpoofing — blocks founder_level_0 via dev headers
 *                                unless ALLOW_DEV_FOUNDER=true in dev
 *   3. requireFounderLevel0    — role must be exactly founder_level_0
 *
 * Only a real JWT-authenticated founder_level_0 identity passes all three.
 */

import { Router } from 'express'
import { requireAuth }                                          from '../middleware/authMiddleware.js'
import { blockDevFounderSpoofing, requireFounderLevel0 }       from '../middleware/roleMiddleware.js'
import * as fc from '../controllers/founderController.js'

const router = Router()

// Triple gate on every founder route
router.use(requireAuth, blockDevFounderSpoofing, requireFounderLevel0)

router.get('/status',               fc.getStatus)
router.get('/controls',             fc.getControls)
router.put('/controls/:controlKey', fc.updateControl)
router.post('/emergency-lock',      fc.triggerEmergencyLock)
router.post('/override',            fc.triggerOverride)
router.get('/audit',                fc.getAudit)

export default router
