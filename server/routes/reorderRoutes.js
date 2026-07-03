import { Router } from 'express'
import {
  handleRegisterVendor, handleGetVendor, handleListVendors,
  handleGetPreferredVendors, handleVendorConnectionReadiness,
  handleGetRecommendations, handleUrgentAlert, handleDetectTriggers,
  handleCreatePO, handleGetPO, handleListPOs, handleAddPOItem, handlePOReadiness,
  handleApprovePO, handleRejectPO, handleApprovalReadiness,
  handleCreateSignal, handleGetSignals, handleSignalReadiness,
  handleCreateReceiving, handleMarkReceived, handleReceivingReadiness,
} from '../controllers/reorderController.js'

const router = Router()

// Vendor registry
router.post('/venue/:venueId/vendors',                           handleRegisterVendor)
router.get('/venue/:venueId/vendors',                            handleListVendors)
router.get('/vendors/:vendorId',                                 handleGetVendor)
router.get('/venue/:venueId/vendors/product/:productId/preferred', handleGetPreferredVendors)
router.get('/venue/:venueId/vendors/readiness',                  handleVendorConnectionReadiness)

// Recommendations
router.get('/venue/:venueId/recommendations',                    handleGetRecommendations)
router.get('/venue/:venueId/recommendations/urgent',             handleUrgentAlert)
router.post('/venue/:venueId/recommendations/detect',            handleDetectTriggers)

// Purchase orders
router.post('/venue/:venueId/purchase-orders',                   handleCreatePO)
router.get('/venue/:venueId/purchase-orders',                    handleListPOs)
router.get('/purchase-orders/:purchaseOrderId',                  handleGetPO)
router.post('/purchase-orders/:purchaseOrderId/items',           handleAddPOItem)
router.get('/venue/:venueId/purchase-orders/readiness',          handlePOReadiness)

// Approval
router.post('/purchase-orders/:purchaseOrderId/approve',         handleApprovePO)
router.post('/purchase-orders/:purchaseOrderId/reject',          handleRejectPO)
router.get('/venue/:venueId/approval/readiness',                 handleApprovalReadiness)

// Demand signals
router.post('/venue/:venueId/signals',                           handleCreateSignal)
router.get('/venue/:venueId/signals',                            handleGetSignals)
router.get('/venue/:venueId/signals/readiness',                  handleSignalReadiness)

// Receiving
router.post('/venue/:venueId/receiving',                         handleCreateReceiving)
router.post('/receiving/:receivingId/confirm',                   handleMarkReceived)
router.get('/venue/:venueId/receiving/readiness',                handleReceivingReadiness)

export default router
