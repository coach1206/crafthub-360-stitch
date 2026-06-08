/**
 * POS 3 Integration Routes — Phase 9
 *
 * Permission tiers (enforced here at route level):
 *   Staff   (lv1): active orders, menu, tables, recommendations, activity
 *   Manager (lv2): inventory, provider status, locations, staff list, E.A.T. feed
 *   Admin   (lv3): test-connection, provider config list
 *   Founder (lv4): license/revenue/billing panels
 *   Guest   (lv0): BLOCKED from all POS 3 routes
 */

import { Router } from 'express'
import {
  getProviders,
  getProviderStatus,
  testConnection,
  getLocations,
  getMenu,
  getInventory,
  getActiveOrders,
  getOrderById,
  getTables,
  getStaff,
  postRecommendation,
  receiveWebhook,
  getEATFeed,
  getFounderLicensePanel,
  getSyncStatus,
  runSyncNow,
} from '../controllers/pos3IntegrationController.js'
import { requireAuth }                 from '../middleware/authMiddleware.js'
import {
  requireStaff,
  requireManager,
  requireAdmin,
  requireFounderLevel0,
  blockDevFounderSpoofing,
} from '../middleware/roleMiddleware.js'

const router = Router()

// ── Admin+ routes ─────────────────────────────────────────────
// All authenticated admins can list providers and test connections
router.get('/',
  requireAuth, requireAdmin,
  getProviders
)

router.post('/:providerKey/test-connection',
  requireAuth, requireAdmin,
  testConnection
)

// ── Manager+ routes ───────────────────────────────────────────
router.get('/:providerKey/status',
  requireAuth, requireManager,
  getProviderStatus
)

router.get('/:providerKey/locations',
  requireAuth, requireManager,
  getLocations
)

router.get('/:providerKey/inventory',
  requireAuth, requireManager,
  getInventory
)

router.get('/:providerKey/staff',
  requireAuth, requireManager,
  getStaff
)

// ── Staff+ routes ─────────────────────────────────────────────
router.get('/:providerKey/menu',
  requireAuth, requireStaff,
  getMenu
)

router.get('/:providerKey/orders/active',
  requireAuth, requireStaff,
  getActiveOrders
)

router.get('/:providerKey/orders/:orderId',
  requireAuth, requireStaff,
  getOrderById
)

router.get('/:providerKey/tables',
  requireAuth, requireStaff,
  getTables
)

router.post('/:providerKey/recommendation',
  requireAuth, requireStaff,
  postRecommendation
)

// ── Webhook — no auth (external callers), but always verified internally ──
router.post('/:providerKey/webhook',
  receiveWebhook
)

export { router as pos3SyncRouter }
// handled via syncRouter exported below (mounted at /api/pos3/sync)

export default router

// ── E.A.T. and Founder routes are mounted separately from server/index.js ──
// see eatRoutes and founderRoutes — exported as named helpers below

import { Router as ExpressRouter } from 'express'

export const eatFeedRouter = (() => {
  const r = ExpressRouter()
  r.get('/', requireAuth, requireManager, getEATFeed)
  return r
})()

export const syncRouter = (() => {
  const r = ExpressRouter()
  r.get('/status', requireAuth, requireManager, getSyncStatus)
  r.post('/run',   requireAuth, requireAdmin,   runSyncNow)
  return r
})()

export const founderPosRouter = (() => {
  const r = ExpressRouter()
  r.get('/license', requireAuth, blockDevFounderSpoofing, requireFounderLevel0, getFounderLicensePanel)
  return r
})()
