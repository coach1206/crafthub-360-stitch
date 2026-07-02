/**
 * SmokeCraft Commerce Routes — mounted at /api/smokecraft
 * Covers: session progress, cart alias routes, handoff alias routes.
 * The canonical commerce logic lives in venueCommerceService and is mounted
 * at /api/venues; these routes are convenience aliases under /api/smokecraft.
 */
import { Router } from 'express'
import * as ctrl from '../controllers/venueCommerceController.js'

const router = Router()

// ── Session Progress ──────────────────────────────────────────
// POST /api/smokecraft/progress/save
router.post('/progress/save', ctrl.saveGuestProgress)

// POST /api/smokecraft/resume/save  (alias)
router.post('/resume/save', ctrl.saveGuestProgress)

// GET  /api/smokecraft/resume/:guestSessionId
router.get('/resume/:guestSessionId', ctrl.resumeGuestSession)

// ── Cart (alias) ──────────────────────────────────────────────
// POST /api/smokecraft/menu/cart/create
router.post('/menu/cart/create', ctrl.createCart)

// POST /api/smokecraft/menu/cart/:cartId/add-item
router.post('/menu/cart/:cartId/add-item', ctrl.addItemToCart)

// DELETE /api/smokecraft/menu/cart/:cartId/items/:cartItemId
router.delete('/menu/cart/:cartId/items/:cartItemId', ctrl.removeItemFromCart)

// POST /api/smokecraft/menu/cart/:cartId/update-quantity  (remove + re-add pattern)
router.post('/menu/cart/:cartId/update-quantity', async (req, res) => {
  // Convenience: caller sends { cartItemId, quantity }; we expose remove for simplicity.
  // For a full update, the client should remove + re-add. This returns guidance.
  res.status(501).json({
    ok: false,
    error: 'Use remove-item + add-item to update quantity.',
    hint: 'DELETE /api/smokecraft/menu/cart/:cartId/items/:cartItemId then POST add-item with new quantity.',
  })
})

// POST /api/smokecraft/menu/cart/:cartId/checkout
router.post('/menu/cart/:cartId/checkout', ctrl.checkoutCart)

// POST /api/smokecraft/menu/cart/:cartId/payment-confirmed  (alias)
router.post('/menu/cart/:cartId/payment-confirmed', (req, res, next) => {
  req.params.orderId = req.body.orderId
  if (!req.params.orderId) return res.status(400).json({ ok: false, error: 'orderId required in body' })
  ctrl.confirmPayment(req, res)
})

// ── Handoff (alias) ───────────────────────────────────────────
// POST /api/smokecraft/handoff/start
router.post('/handoff/start', ctrl.startHandoff)

// POST /api/smokecraft/handoff/:handoffId/return
router.post('/handoff/:handoffId/return', ctrl.returnFromHandoff)

export default router
