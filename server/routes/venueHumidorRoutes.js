/**
 * Venue Humidor 1A — backend foundation routes.
 * Mounted at /api/smokecraft/venue-humidor in server/index.js.
 * Reuses the existing requireAuth/requireRole middleware and the
 * venues/venue_memberships tables (migration 010) for venue identity —
 * no new identity or authorization primitive invented.
 */
import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { requireAuth } from '../middleware/authMiddleware.js'
import { getDb } from '../db/connection.js'
import * as ctrl from '../controllers/venueHumidorController.js'

const router = Router()

const IS_PROD = process.env.NODE_ENV === 'production'
const readLimiter = rateLimit({ windowMs: 60 * 1000, max: 120, skip: () => !IS_PROD })
const writeLimiter = rateLimit({ windowMs: 60 * 1000, max: 60, skip: () => !IS_PROD })

// A client-supplied venueId is never trusted on its own: a platform
// admin bypasses the membership check; every other authenticated user
// must have a real, active venue_memberships row (staff/manager/admin/
// owner) for the EXACT venue in the route path.
async function requireVenueStaff(req, res, next) {
  try {
    if (req.user?.role === 'admin' || req.user?.role === 'founder_level_0') return next()
    const db = getDb()
    const { rows } = await db.query(
      `SELECT membership_type FROM venue_memberships WHERE user_id = $1 AND venue_id = $2 AND status = 'active'`,
      [req.user?.id, req.params.venueId]
    )
    const membership = rows[0]
    if (!membership || !['staff', 'manager', 'admin', 'owner'].includes(membership.membership_type)) {
      return res.status(403).json({ success: false, error: 'venue_staff_required' })
    }
    next()
  } catch (err) { res.status(500).json({ success: false, error: 'internal_error' }) }
}

// Defense-in-depth: even once requireVenueStaff confirms the caller
// belongs to :venueId, the RESOURCE itself (product/hold/reservation/
// order) must actually belong to that same venue — a staff member of
// venue A must never be able to act on venue B's product by pairing
// A's real venueId with B's real productId in the URL.
function requireResourceVenueMatch(table, idColumn, paramName) {
  return async (req, res, next) => {
    try {
      const db = getDb()
      const { rows } = await db.query(`SELECT venue_id FROM ${table} WHERE ${idColumn} = $1`, [req.params[paramName]])
      if (!rows[0] || rows[0].venue_id !== req.params.venueId) {
        return res.status(404).json({ success: false, error: 'not_found' })
      }
      next()
    } catch (err) { res.status(500).json({ success: false, error: 'internal_error' }) }
  }
}

const productVenueMatch = requireResourceVenueMatch('venue_cigar_products', 'product_id', 'productId')
const holdVenueMatch = requireResourceVenueMatch('venue_cigar_inventory_holds', 'hold_id', 'holdId')
const reservationVenueMatch = requireResourceVenueMatch('venue_cigar_reservations', 'reservation_id', 'reservationId')
const orderVenueMatch = requireResourceVenueMatch('venue_cigar_orders', 'order_id', 'orderId')

// ── Products ─────────────────────────────────────────────────────────
router.post('/venues/:venueId/products', writeLimiter, requireAuth, requireVenueStaff, ctrl.handleCreateProduct)
router.get('/venues/:venueId/products', readLimiter, requireAuth, requireVenueStaff, ctrl.handleListProducts)
router.get('/venues/:venueId/products/:productId', readLimiter, requireAuth, requireVenueStaff, productVenueMatch, ctrl.handleGetProduct)
router.get('/venues/:venueId/products/:productId/availability', readLimiter, requireAuth, requireVenueStaff, productVenueMatch, ctrl.handleGetAvailability)

// ── Inventory events ─────────────────────────────────────────────────
router.post('/venues/:venueId/products/:productId/inventory-events', writeLimiter, requireAuth, requireVenueStaff, productVenueMatch, ctrl.handleApplyInventoryEvent)

// ── Holds ────────────────────────────────────────────────────────────
router.post('/venues/:venueId/products/:productId/holds', writeLimiter, requireAuth, requireVenueStaff, productVenueMatch, ctrl.handleCreateHold)
router.post('/venues/:venueId/holds/:holdId/release', writeLimiter, requireAuth, requireVenueStaff, holdVenueMatch, ctrl.handleReleaseHold)
router.post('/venues/:venueId/holds/:holdId/expire', writeLimiter, requireAuth, requireVenueStaff, holdVenueMatch, ctrl.handleExpireHold)

// ── Reservations (staff-created) ─────────────────────────────────────
router.post('/venues/:venueId/products/:productId/reservations', writeLimiter, requireAuth, requireVenueStaff, productVenueMatch, ctrl.handleCreateReservation)
router.post('/venues/:venueId/reservations/:reservationId/cancel', writeLimiter, requireAuth, requireVenueStaff, reservationVenueMatch, ctrl.handleCancelReservation)
router.post('/venues/:venueId/reservations/:reservationId/fulfill', writeLimiter, requireAuth, requireVenueStaff, reservationVenueMatch, ctrl.handleFulfillReservation)

// ── Orders ───────────────────────────────────────────────────────────
router.post('/venues/:venueId/orders', writeLimiter, requireAuth, requireVenueStaff, ctrl.handleCreateOrder)
router.post('/venues/:venueId/orders/:orderId/items', writeLimiter, requireAuth, requireVenueStaff, orderVenueMatch, ctrl.handleAddOrderItem)
router.post('/venues/:venueId/orders/:orderId/complete', writeLimiter, requireAuth, requireVenueStaff, orderVenueMatch, ctrl.handleCompleteOrder)
router.post('/venues/:venueId/orders/:orderId/cancel', writeLimiter, requireAuth, requireVenueStaff, orderVenueMatch, ctrl.handleCancelOrder)

export default router
