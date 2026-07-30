/**
 * Venue Humidor 1B-1 — customer browsing/detail routes.
 * Mounted at /api/smokecraft/venue-humidor/customer in server/index.js.
 * Reuses the same SmokeCraft guest-identity middleware Golden Box
 * already uses (server-issued JWT + HttpOnly cookie) — never a second,
 * competing guest-identity scheme. No membership/staff check here —
 * this surface is customer-facing; every read is still server-scoped
 * to a real, active venue (never trusts a client-supplied venueId
 * alone) and every write requires the real guest/account identity.
 */
import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { optionalAuth } from '../middleware/authMiddleware.js'
import {
  attachSmokeCraftIdentity, ensureSmokeCraftGuestIdentity,
} from '../middleware/smokecraftGuestIdentity.js'
import * as ctrl from '../controllers/venueHumidorCustomerController.js'
import * as checkoutCtrl from '../controllers/venueHumidorCheckoutController.js'

const router = Router()

const IS_PROD = process.env.NODE_ENV === 'production'
const readLimiter = rateLimit({ windowMs: 60 * 1000, max: 120, skip: () => !IS_PROD })
const writeLimiter = rateLimit({ windowMs: 60 * 1000, max: 60, skip: () => !IS_PROD })

router.use(optionalAuth, attachSmokeCraftIdentity, ensureSmokeCraftGuestIdentity)

router.get('/venues/:venueId', readLimiter, ctrl.handleValidateVenue)
router.get('/venues/:venueId/catalog', readLimiter, ctrl.handleBrowseCatalog)
router.get('/venues/:venueId/catalog/:productId', readLimiter, ctrl.handleGetCigarDetail)

router.post('/venues/:venueId/products/:productId/stick-hold', writeLimiter, ctrl.handleCreateStickHold)
router.post('/venues/:venueId/products/:productId/box-hold', writeLimiter, ctrl.handleCreateBoxHold)
router.post('/venues/:venueId/products/:productId/reservation', writeLimiter, ctrl.handleCreateReservation)

router.post('/venues/:venueId/products/:productId/favorite', writeLimiter, ctrl.handleAddFavorite)
router.post('/venues/:venueId/products/:productId/unfavorite', writeLimiter, ctrl.handleRemoveFavorite)
router.get('/favorites', readLimiter, ctrl.handleListFavorites)

// Honest unavailable boundary: no POS/venue-tab/table-service
// integration exists for Venue Humidor yet — real 501, never a faked
// success.
router.post('/venues/:venueId/products/:productId/venue-tab', writeLimiter, ctrl.handleUnsupportedAction)
router.post('/venues/:venueId/products/:productId/table-delivery', writeLimiter, ctrl.handleUnsupportedAction)

// ── Venue Humidor 1B-2A: checkout, order creation, hold conversion ──
router.post('/venues/:venueId/checkout/quote', writeLimiter, checkoutCtrl.handleGetCheckoutQuote)
router.post('/venues/:venueId/checkout/orders', writeLimiter, checkoutCtrl.handleCreateOrder)
router.get('/venues/:venueId/orders/:orderId', readLimiter, checkoutCtrl.handleGetOrder)
router.post('/venues/:venueId/orders/:orderId/cancel', writeLimiter, checkoutCtrl.handleCustomerCancelOrder)

export default router
