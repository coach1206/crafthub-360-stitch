/**
 * SmokeCraft Venue Admin Routes
 * All routes under /api/modules/smokecraft/admin
 */

import { Router } from 'express'
import {
  getAdminStatus,
  getVenueOverview,
  getStaffQueue,
  getAnalytics,
  getIntegrations,
  getRewardsSummary,
  getPairingsSummary,
  getOrdersSummary,
  getAuditLog,
  executeControl,
  getAssignedOrders,
} from '../controllers/smokecraftVenueAdminController.js'

const router = Router()

// Status (no auth required for health check)
router.get('/status', getAdminStatus)

// Staff assigned orders (before :venueId to avoid param conflict)
router.get('/staff/:staffId/assigned-orders', getAssignedOrders)

// Venue-scoped views
router.get('/venue/:venueId/overview',    getVenueOverview)
router.get('/venue/:venueId/staff-queue', getStaffQueue)
router.get('/venue/:venueId/analytics',  getAnalytics)
router.get('/venue/:venueId/integrations', getIntegrations)
router.get('/venue/:venueId/rewards',    getRewardsSummary)
router.get('/venue/:venueId/pairings',   getPairingsSummary)
router.get('/venue/:venueId/orders',     getOrdersSummary)
router.get('/venue/:venueId/audit',      getAuditLog)
router.post('/venue/:venueId/control',   executeControl)

export default router
