import { Router } from 'express'
import { requireAuth }  from '../middleware/authMiddleware.js'
import { requireAdmin } from '../middleware/roleMiddleware.js'
import * as ctrl from '../controllers/travelController.js'

const router = Router()

router.get(  '/trips',              ctrl.getTrips)             // GET  /api/travel/trips
router.get(  '/trips/:tripId',      ctrl.getTripById)           // GET  /api/travel/trips/:tripId
router.post( '/concierge',          ctrl.submitConcierge)       // POST /api/travel/concierge
router.get(  '/stamps/:userId',     ctrl.getUserStamps)         // GET  /api/travel/stamps/:userId
router.post( '/stamps',             ctrl.claimStamp)            // POST /api/travel/stamps
router.get(  '/admin/requests',     ctrl.getConciergeRequests)  // GET  /api/travel/admin/requests

// ── Admin: data reset routes ───────────────────────────────────────────────────
router.delete('/admin/concierge',   requireAuth, requireAdmin, ctrl.resetConcierge)  // DELETE /api/travel/admin/concierge
router.delete('/admin/stamps',      requireAuth, requireAdmin, ctrl.resetStamps)     // DELETE /api/travel/admin/stamps

export default router
