/**
 * Developer Routes — /api/developer/*
 * Read-only diagnostics for Developer role accounts.
 * Requires: developer role + active dev grant (verified at login) OR Founder L0.
 */

import { Router }             from 'express'
import { requireAuth }        from '../middleware/authMiddleware.js'
import { requireDeveloper }   from '../middleware/roleMiddleware.js'
import * as dev               from '../controllers/developerController.js'

const router = Router()

// All developer routes require auth + developer role
router.use(requireAuth, requireDeveloper)

router.get('/health',         dev.getApiHealth)
router.get('/metrics',        dev.getSystemMetrics)
router.get('/errors',         dev.getErrorLog)
router.get('/audit-summary',  dev.getAuditSummary)
router.get('/feature-flags',  dev.getFeatureFlags)
router.get('/grant',          dev.getMyGrant)

export default router
