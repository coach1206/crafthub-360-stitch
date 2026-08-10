/**
 * SmokeCraft Venue Commerce Routes — mounted at /api/smokecraft/venue-commerce
 */
import { Router } from 'express'
import * as ctrl from '../controllers/smokecraftVenueCommerceController.js'

const router = Router()

// GET  /api/smokecraft/venue-commerce/venues
router.get('/venues', ctrl.listVenues)

// GET  /api/smokecraft/venue-commerce/profile/:venueId
router.get('/profile/:venueId', ctrl.getVenueProfile)

// GET  /api/smokecraft/venue-commerce/menu/:venueId
router.get('/menu/:venueId', ctrl.getVenueMenu)

// POST /api/smokecraft/venue-commerce/orders
router.post('/orders', ctrl.createOrder)

// POST /api/smokecraft/venue-commerce/staff-request
router.post('/staff-request', ctrl.createStaffRequest)

// POST /api/smokecraft/venue-commerce/partner-click
router.post('/partner-click', ctrl.trackPartnerClick)

// POST /api/smokecraft/venue-commerce/money-bridge-event
router.post('/money-bridge-event', ctrl.trackMoneyBridgeEvent)

// GET  /api/smokecraft/venue-commerce/revenue-report/:venueId
router.get('/revenue-report/:venueId', ctrl.getRevenueReport)

export default router
