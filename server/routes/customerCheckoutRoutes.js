import { Router } from 'express'
import {
  handleCreateCart, handleGetCart, handleGetVenueCarts,
  handleAddCartItem, handleUpdateCartItem, handleRemoveCartItem, handleClearCart,
  handleStartCheckout, handleBuildCheckoutPreview, handleSelfOrderPreview,
  handleSubmitPreview, handleStaffAssistedPreview, handleStaffHandoff,
  handleGetCheckoutSession, handleCancelCheckoutSession,
  handleGetReceiptPreview,
  handleGetCustomerOrderStatus, handleGetCustomerOrderTimeline,
  handleGetCheckoutReadiness, handleGetSelfOrderReadiness,
  handleGetStaffAssistedReadiness, handleGetPartnerReadiness,
  handleGetAuditTrail,
} from '../controllers/customerCheckoutController.js'

const router = Router()

// ── Cart ──────────────────────────────────────────────────────────────────
router.post('/carts',                                          handleCreateCart)
router.get('/carts/:cartId',                                   handleGetCart)
router.get('/venues/:venueId/carts',                           handleGetVenueCarts)
router.post('/carts/:cartId/items',                            handleAddCartItem)
router.patch('/carts/:cartId/items/:cartItemId',               handleUpdateCartItem)
router.delete('/carts/:cartId/items/:cartItemId',              handleRemoveCartItem)
router.post('/carts/:cartId/clear',                            handleClearCart)

// ── Checkout flows ─────────────────────────────────────────────────────────
router.post('/carts/:cartId/start',                            handleStartCheckout)
router.post('/carts/:cartId/preview',                          handleBuildCheckoutPreview)
router.post('/carts/:cartId/self-order-preview',               handleSelfOrderPreview)
router.post('/carts/:cartId/submit-preview',                   handleSubmitPreview)
router.post('/carts/:cartId/staff-assisted-preview',           handleStaffAssistedPreview)
router.post('/carts/:cartId/staff-handoff',                    handleStaffHandoff)

// ── Sessions ───────────────────────────────────────────────────────────────
router.get('/sessions/:checkoutSessionId',                     handleGetCheckoutSession)
router.post('/sessions/:checkoutSessionId/cancel',             handleCancelCheckoutSession)

// ── Receipt ────────────────────────────────────────────────────────────────
router.get('/carts/:cartId/receipt-preview',                   handleGetReceiptPreview)

// ── Order status ───────────────────────────────────────────────────────────
router.get('/orders/:orderId/status',                          handleGetCustomerOrderStatus)
router.get('/orders/:orderId/timeline',                        handleGetCustomerOrderTimeline)

// ── Readiness ──────────────────────────────────────────────────────────────
router.post('/readiness',                                      handleGetCheckoutReadiness)
router.get('/venues/:venueId/self-order-readiness',            handleGetSelfOrderReadiness)
router.get('/venues/:venueId/staff-assisted-readiness',        handleGetStaffAssistedReadiness)
router.get('/venues/:venueId/partners/:partnerId/readiness',   handleGetPartnerReadiness)

// ── Audit ──────────────────────────────────────────────────────────────────
router.get('/audit/:entityType/:entityId',                     handleGetAuditTrail)

export default router
