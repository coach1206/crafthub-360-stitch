import { Router } from 'express'
import {
  getHealth,
  createOrderIntent,
  createHandoffRequest,
  attachMenuItemReference,
  recordStaffAction,
  updateOrderSyncStatus,
  getOrderIntent,
  getGuestOrderIntents,
  getHandoffRequests,
  getOrderSyncStatus,
  getAuditLog,
  writeSyncAuditEvent,
} from '../controllers/pos360SmokeCraftOrderBridgeController.js'

const router = Router()

router.get('/health', getHealth)
router.post('/order-intent', createOrderIntent)
router.post('/handoff-request', createHandoffRequest)
router.post('/menu-item-reference', attachMenuItemReference)
router.post('/staff-action', recordStaffAction)
router.patch('/order-sync-status', updateOrderSyncStatus)
router.get('/order-intent/:orderIntentId', getOrderIntent)
router.get('/guest/:guestId/order-intents', getGuestOrderIntents)
router.get('/handoff-requests', getHandoffRequests)
router.get('/order-sync-status/:orderIntentId', getOrderSyncStatus)
router.get('/audit-log', getAuditLog)
router.post('/audit/event', writeSyncAuditEvent)

export default router
