import { Router } from 'express'
import { requireAuth } from '../middleware/authMiddleware.js'
import { canAccessEAT } from '../middleware/roleMiddleware.js'
import * as ctrl from '../controllers/eatController.js'
import { eatSources } from '../data/eatSources.js'
import { success } from '../utils/responseHelpers.js'
import { getActiveOrdersForVenue } from '../services/pos3OrderPersistenceService.js'
import { getQueueStats } from '../services/stationQueuePersistenceService.js'
import { ok, serverError } from '../utils/response.js'

const router = Router()

// ── Public — venue-facing specials display ────────────────────────────────────
router.get('/sources', (_req, res) => {
  success(res, { sources: eatSources })
})

router.get('/sources/:stationId', (req, res) => {
  const station = eatSources[req.params.stationId]
  if (!station) return res.status(404).json({ success: false, message: 'Station not found' })
  success(res, { station })
})

// ── Manager-gated — E.A.T. Command dashboard ─────────────────────────────────
// requireAuth must precede canAccessEAT to populate req.user from the JWT cookie.
router.post( '/analytics',                  requireAuth, canAccessEAT, ctrl.saveAnalytics)
router.get(  '/session/:sessionId/payload', requireAuth, canAccessEAT, ctrl.getSessionPayload)
router.get(  '/dashboard',                  requireAuth, canAccessEAT, ctrl.getDashboard)

// ── POS360 Live Feed for E.A.T. ───────────────────────────────
// GET /api/eat/pos3-live?venueId=
// Returns real-time POS3 order activity for E.A.T. dashboard.
router.get('/pos3-live', requireAuth, canAccessEAT, async (req, res) => {
  try {
    const venueId = req.query.venueId || 'novee-grand-lounge'

    const [ordersResult, queueResult] = await Promise.allSettled([
      getActiveOrdersForVenue(venueId),
      getQueueStats(venueId),
    ])

    const orders = ordersResult.status === 'fulfilled' && ordersResult.value.ok
      ? ordersResult.value.orders : []
    const queueStats = queueResult.status === 'fulfilled' && queueResult.value.ok
      ? queueResult.value.stats : {}

    // Summarize for E.A.T.
    const activeOrderCount = orders.length
    const pendingStaffConfirmation = orders.filter(o => o.status === 'pending_staff_confirmation').length
    const customerSelfOrders = orders.filter(o => o.source === 'customer_self_order').length
    const staffAssistedOrders = orders.filter(o => ['staff_assisted_order','waitress_handoff'].includes(o.source)).length

    const revenueEstimateCents = orders
      .filter(o => !['cancelled'].includes(o.status))
      .reduce((sum, o) => sum + (o.total_cents || 0), 0)

    const recentEvents = orders.slice(0, 10).map(o => ({
      order_id:    o.order_id,
      source:      o.source,
      status:      o.status,
      table_number:o.table_number,
      total_cents: o.total_cents,
      created_at:  o.created_at,
    }))

    return ok(res, {
      activeOrderCount,
      pendingStaffConfirmation,
      customerSelfOrders,
      staffAssistedOrders,
      stationQueueCounts: queueStats,
      revenueEstimateCents,
      recentOrderEvents: recentEvents,
      storageMode: ordersResult.value?.storageMode || 'unknown',
      localPreview: ordersResult.value?.localPreview || false,
    })
  } catch (err) {
    return serverError(res, err)
  }
})

export default router
