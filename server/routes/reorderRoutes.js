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
import {
  handlePersistPO, handlePersistApprove, handlePersistReject,
  handleConfirmReceiving, handleGetPOHistory, handleGetPersistedRecommendations,
  handleGetReorderAudit, handleGetReorderSyncEvents,
  handleGetReorderPersistenceStatus, handleGetDemandSignalsPersisted,
} from '../controllers/reorderPersistenceController.js'

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
router.get('/venue/:venueId/recommendations/persisted',          handleGetPersistedRecommendations)

// Purchase orders
router.post('/venue/:venueId/purchase-orders',                   handleCreatePO)
router.get('/venue/:venueId/purchase-orders',                    handleListPOs)
router.get('/purchase-orders/:purchaseOrderId',                  handleGetPO)
router.post('/purchase-orders/:purchaseOrderId/items',           handleAddPOItem)
router.get('/venue/:venueId/purchase-orders/readiness',          handlePOReadiness)
router.get('/purchase-orders/:purchaseOrderId/history',          handleGetPOHistory)

// Purchase order persistence
router.post('/purchase-order/draft/persist',                           handlePersistPO)
router.post('/purchase-orders/:purchaseOrderId/approve/persist',       handlePersistApprove)
router.post('/purchase-orders/:purchaseOrderId/reject/persist',        handlePersistReject)

// Approval
router.post('/purchase-orders/:purchaseOrderId/approve',         handleApprovePO)
router.post('/purchase-orders/:purchaseOrderId/reject',          handleRejectPO)
router.get('/venue/:venueId/approval/readiness',                 handleApprovalReadiness)

// Demand signals
router.post('/venue/:venueId/signals',                           handleCreateSignal)
router.get('/venue/:venueId/signals',                            handleGetSignals)
router.get('/venue/:venueId/signals/readiness',                  handleSignalReadiness)
router.get('/venue/:venueId/demand-signals',                     handleGetDemandSignalsPersisted)

// Receiving
router.post('/venue/:venueId/receiving',                         handleCreateReceiving)
router.post('/receiving/:receivingId/confirm',                   handleMarkReceived)
router.get('/venue/:venueId/receiving/readiness',                handleReceivingReadiness)
router.post('/receiving/:purchaseOrderId/confirm-persist',       handleConfirmReceiving)

// OIPSL persistence meta
router.get('/persistence/status',                                handleGetReorderPersistenceStatus)
router.get('/venue/:venueId/audit',                              handleGetReorderAudit)
router.get('/venue/:venueId/sync-events',                        handleGetReorderSyncEvents)

export default router
