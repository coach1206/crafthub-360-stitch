import { Router } from 'express'
import * as ctrl from '../controllers/travelController.js'

const router = Router()

router.get(  '/trips',              ctrl.getTrips)             // GET  /api/travel/trips
router.get(  '/trips/:tripId',      ctrl.getTripById)           // GET  /api/travel/trips/:tripId
router.post( '/concierge',          ctrl.submitConcierge)       // POST /api/travel/concierge
router.get(  '/stamps/:userId',     ctrl.getUserStamps)         // GET  /api/travel/stamps/:userId
router.post( '/stamps',             ctrl.claimStamp)            // POST /api/travel/stamps
router.get(  '/admin/requests',     ctrl.getConciergeRequests)  // GET  /api/travel/admin/requests

export default router
