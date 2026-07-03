/**
 * SmokeCraft Ordering Routes — Module Build 3
 * Mounted at: /api/modules/smokecraft/orders
 */

import { Router } from 'express'
import {
  getOrderingStatus,
  getVenueMenuHandler,
  createOrderHandler,
  requestStaffHandler,
  getOrderHandler,
  updateOrderStatusHandler,
  acceptOrderHandler,
  sendToPOSHandler,
  getStaffQueueHandler,
  getManagerSummaryHandler,
  getOrderAuditHandler,
} from '../controllers/smokecraftOrderingController.js'

const router = Router()

// System status
router.get('/status',                        getOrderingStatus)

// Venue menu
router.get('/menu/:venueId',                 getVenueMenuHandler)

// Order creation
router.post('/create',                       createOrderHandler)
router.post('/request-staff',                requestStaffHandler)

// Staff queue (must come before /:orderId to avoid route conflict)
router.get('/staff/queue',                   getStaffQueueHandler)
router.get('/manager/summary',               getManagerSummaryHandler)

// Order operations by ID
router.get('/:orderId',                      getOrderHandler)
router.patch('/:orderId/status',             updateOrderStatusHandler)
router.post('/:orderId/accept',              acceptOrderHandler)
router.post('/:orderId/send-to-pos',         sendToPOSHandler)
router.get('/:orderId/audit',                getOrderAuditHandler)

export default router
