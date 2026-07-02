/**
 * Order Lifecycle Routes
 * Mounted at /api/orders
 */

import { Router } from 'express'
import {
  handleCreateOrderDraft, handleSubmitOrder, handleAcceptOrder,
  handleRejectOrder, handleRouteOrder, handleMarkOrderPreparing,
  handleMarkOrderReady, handleCompleteOrder, handleCancelOrder,
  handleLinkPayment, handleLinkTax, handleLinkPartnerFulfillment,
  handleLinkPOSRouting, handleLinkKDSRouting, handleLinkRefund,
  handleGetOrder, handleGetVenueOrders, handleGetPartnerOrders,
  handleGetOrderReadiness, handleGetOrderAudit,
} from '../controllers/orderLifecycleController.js'

const router = Router()

// Order lifecycle transitions
router.post('/draft',                             handleCreateOrderDraft)
router.post('/:orderId/submit',                   handleSubmitOrder)
router.post('/:orderId/accept',                   handleAcceptOrder)
router.post('/:orderId/reject',                   handleRejectOrder)
router.post('/:orderId/route',                    handleRouteOrder)
router.post('/:orderId/preparing',                handleMarkOrderPreparing)
router.post('/:orderId/ready',                    handleMarkOrderReady)
router.post('/:orderId/complete',                 handleCompleteOrder)
router.post('/:orderId/cancel',                   handleCancelOrder)

// Link integrations
router.post('/:orderId/link-payment',             handleLinkPayment)
router.post('/:orderId/link-tax',                 handleLinkTax)
router.post('/:orderId/link-partner-fulfillment', handleLinkPartnerFulfillment)
router.post('/:orderId/link-pos-routing',         handleLinkPOSRouting)
router.post('/:orderId/link-kds-routing',         handleLinkKDSRouting)
router.post('/:orderId/link-refund',              handleLinkRefund)

// Read
router.get('/venues/:venueId',   handleGetVenueOrders)
router.get('/partners/:partnerId', handleGetPartnerOrders)
router.post('/readiness',         handleGetOrderReadiness)
router.get('/:orderId',           handleGetOrder)
router.get('/:orderId/audit',     handleGetOrderAudit)

export default router
