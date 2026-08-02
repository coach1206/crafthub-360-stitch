/**
 * Support Admin Tools — /api/support-admin/*
 * Lookups: manager or above. Case create/list: manager or above.
 * Corrective actions: admin or founder_level_0 only (real RBAC check).
 */
import { Router } from 'express'
import { requireAuth } from '../middleware/authMiddleware.js'
import { requireManager, requireAdmin } from '../middleware/roleMiddleware.js'
import * as sac from '../controllers/supportAdminController.js'

const router = Router()

router.post('/cases',                                requireAuth, requireManager, sac.createCase)
router.get('/cases',                                  requireAuth, requireManager, sac.listCases)
router.get('/cases/:caseId',                          requireAuth, requireManager, sac.getCase)
router.post('/cases/:caseId/corrective-action',       requireAuth, requireAdmin,   sac.applyCorrectiveAction)

router.get('/lookup/player/:identifier',              requireAuth, requireManager, sac.lookupPlayerState)
router.get('/lookup/order/:orderId',                  requireAuth, requireManager, sac.lookupOrder)
router.get('/lookup/inventory/:productId',             requireAuth, requireManager, sac.lookupInventoryEvents)

export default router
