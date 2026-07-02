/**
 * Venue Commerce Routes — mounted at /api/venues
 * Covers: menu, inventory availability, cart, orders, handoff, E.A.T. sync, session progress.
 */
import { Router } from 'express'
import * as ctrl from '../controllers/venueCommerceController.js'

const router = Router()

// ── Menu / Inventory ──────────────────────────────────────────
// GET  /api/venues/:venueId/menu               — full menu (all categories)
// GET  /api/venues/:venueId/menu?category=cigar — filtered
router.get('/:venueId/menu', ctrl.getVenueMenu)

// Convenience aliases
router.get('/:venueId/inventory',      (req, res) => { req.query.category = req.query.category || undefined; ctrl.getVenueMenu(req, res) })
router.get('/:venueId/bar-inventory',  (req, res) => { req.query.category = 'liquor'; ctrl.getVenueMenu(req, res) })
router.get('/:venueId/cigar-inventory',(req, res) => { req.query.category = 'cigar'; ctrl.getVenueMenu(req, res) })
router.get('/:venueId/food-menu',      (req, res) => { req.query.category = 'food'; ctrl.getVenueMenu(req, res) })

// POST /api/venues/:venueId/inventory/check-availability
router.post('/:venueId/inventory/check-availability', ctrl.checkAvailability)

// POST /api/venues/:venueId/inventory/reserve
router.post('/:venueId/inventory/reserve', ctrl.reserveInventory)

// POST /api/venues/:venueId/inventory/release
router.post('/:venueId/inventory/release', ctrl.releaseInventory)

// POST /api/venues/:venueId/inventory/commit-sale
router.post('/:venueId/inventory/commit-sale', ctrl.commitSale)

// ── Cart ──────────────────────────────────────────────────────
// POST /api/venues/cart/create
router.post('/cart/create', ctrl.createCart)

// GET  /api/venues/cart/:cartId
router.get('/cart/:cartId', ctrl.getCart)

// POST /api/venues/cart/:cartId/add-item
router.post('/cart/:cartId/add-item', ctrl.addItemToCart)

// DELETE /api/venues/cart/:cartId/items/:cartItemId
router.delete('/cart/:cartId/items/:cartItemId', ctrl.removeItemFromCart)

// POST /api/venues/cart/:cartId/checkout
router.post('/cart/:cartId/checkout', ctrl.checkoutCart)

// ── Orders / Payment ──────────────────────────────────────────
// POST /api/venues/orders/:orderId/payment-confirmed
router.post('/orders/:orderId/payment-confirmed', ctrl.confirmPayment)

// POST /api/venues/orders/:orderId/payment-failed
router.post('/orders/:orderId/payment-failed', ctrl.failPayment)

// POST /api/venues/orders/route-to-stations
router.post('/orders/route-to-stations', ctrl.routeOrderToStations)

// ── POS360 Transaction Attachment ─────────────────────────────
// POST /api/venues/pos360/attach-transaction
router.post('/pos360/attach-transaction', ctrl.attachPOS360Transaction)

// ── Handoff ───────────────────────────────────────────────────
// POST /api/venues/handoff/start
router.post('/handoff/start', ctrl.startHandoff)

// POST /api/venues/handoff/:handoffId/return
router.post('/handoff/:handoffId/return', ctrl.returnFromHandoff)

// ── E.A.T. Sync ───────────────────────────────────────────────
// POST /api/venues/eat/sync
router.post('/eat/sync', ctrl.syncToEAT)

// ── Guest Session Progress ────────────────────────────────────
// POST /api/venues/session/save
router.post('/session/save', ctrl.saveGuestProgress)

// GET  /api/venues/session/:guestSessionId/resume
router.get('/session/:guestSessionId/resume', ctrl.resumeGuestSession)

// ── Audit Log ─────────────────────────────────────────────────
// GET  /api/venues/:venueId/audit
router.get('/:venueId/audit', ctrl.getAuditLog)

export default router
