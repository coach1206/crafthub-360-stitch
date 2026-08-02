/**
 * Owner-Facing Operational Status — /api/admin/ops-status
 * admin or founder_level_0 only (real RBAC check — see mandate §7).
 */
import { Router } from 'express'
import { requireAuth } from '../middleware/authMiddleware.js'
import { requireAdmin } from '../middleware/roleMiddleware.js'
import { getOpsStatus } from '../controllers/opsStatusController.js'

const router = Router()
router.get('/ops-status', requireAuth, requireAdmin, getOpsStatus)

export default router
