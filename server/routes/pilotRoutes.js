/**
 * Pilot Routes — Phase 13
 * /api/pilot — admin+ for partner management, manager+ for package view
 */

import { Router }                            from 'express'
import { requireAuth }                       from '../middleware/authMiddleware.js'
import { requireManager, requireAdmin }      from '../middleware/roleMiddleware.js'
import * as ctrl                             from '../controllers/pilotController.js'

const router = Router()

router.get(  '/package',                  requireAuth, requireManager, ctrl.getPilotPackage)
router.get(  '/partners',                 requireAuth, requireAdmin,   ctrl.listPartners)
router.post( '/partners',                 requireAuth, requireAdmin,   ctrl.createPartner)
router.get(  '/partners/:partnerId',      requireAuth, requireAdmin,   ctrl.getPartner)
router.put(  '/partners/:partnerId',      requireAuth, requireAdmin,   ctrl.updatePartner)
router.post( '/partners/:partnerId/requirement', requireAuth, requireAdmin, ctrl.setRequirement)

export default router
