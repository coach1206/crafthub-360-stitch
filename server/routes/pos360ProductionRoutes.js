/**
 * POS360 Production Display System — Routes (Phase B.4)
 * Mounted at /api/pos360/production
 */

import { Router } from 'express'
import { venueTenantGuard } from '../middleware/venueTenantGuard.js'
import { canAccessPOS3 } from '../middleware/roleMiddleware.js'
import * as ctrl from '../controllers/pos360ProductionController.js'

const router = Router()

router.use(venueTenantGuard)

// ── Stations ────────────────────────────────────────────────────────────────
router.get('/stations',                              ctrl.listStations)
router.post('/stations',                    canAccessPOS3, ctrl.createStation)
router.get('/stations/:stationId',                   ctrl.getStation)
router.patch('/stations/:stationId',        canAccessPOS3, ctrl.updateStation)
router.post('/stations/:stationId/activate',canAccessPOS3, ctrl.activateStation)
router.post('/stations/:stationId/deactivate',canAccessPOS3,ctrl.deactivateStation)
router.post('/stations/:stationId/devices', canAccessPOS3, ctrl.assignDevice)
router.delete('/stations/:stationId/devices',canAccessPOS3,ctrl.removeDevice)
router.get('/stations/:stationId/status',            ctrl.getStationStatus)

// ── Tickets ──────────────────────────────────────────────────────────────────
router.get('/tickets',                               ctrl.listTickets)
router.post('/tickets',                     canAccessPOS3, ctrl.createTicket)
router.get('/tickets/:ticketId',                     ctrl.getTicket)
router.patch('/tickets/:ticketId/status',   canAccessPOS3, ctrl.updateTicketStatus)
router.post('/tickets/:ticketId/bump',      canAccessPOS3, ctrl.bumpTicket)
router.post('/tickets/:ticketId/complete',  canAccessPOS3, ctrl.completeTicket)
router.post('/tickets/:ticketId/cancel',    canAccessPOS3, ctrl.cancelTicket)
router.post('/tickets/:ticketId/escalate',  canAccessPOS3, ctrl.escalateTicket)
router.post('/tickets/:ticketId/reopen',    canAccessPOS3, ctrl.reopenTicket)

// ── Items ─────────────────────────────────────────────────────────────────────
router.post('/tickets/:ticketId/items',     canAccessPOS3, ctrl.addTicketItem)
router.patch('/items/:itemId/status',       canAccessPOS3, ctrl.updateItemStatus)
router.post('/items/:itemId/start',         canAccessPOS3, ctrl.startItem)
router.post('/items/:itemId/complete',      canAccessPOS3, ctrl.completeItem)
router.post('/items/:itemId/refire',        canAccessPOS3, ctrl.refireItem)
router.post('/items/:itemId/cancel',        canAccessPOS3, ctrl.cancelItem)
router.post('/items/:itemId/void',          canAccessPOS3, ctrl.voidItem)

// ── Hold / Fire ───────────────────────────────────────────────────────────────
router.post('/items/:itemId/hold',          canAccessPOS3, ctrl.holdItem)
router.post('/items/:itemId/fire',          canAccessPOS3, ctrl.fireItem)
router.post('/tickets/:ticketId/fire',      canAccessPOS3, ctrl.fireOrder)
router.post('/tickets/:ticketId/schedule-fire', canAccessPOS3, ctrl.scheduleFireTime)
router.post('/tickets/:ticketId/cancel-hold',canAccessPOS3, ctrl.cancelHold)
router.get('/tickets/:ticketId/hold-fire-events', ctrl.getHoldFireEvents)

// ── Routing ───────────────────────────────────────────────────────────────────
router.get('/routing-rules',                         ctrl.listRoutingRules)
router.post('/routing-rules',               canAccessPOS3, ctrl.createRoutingRule)
router.get('/items/:itemId/routing',                 ctrl.resolveItemRouting)
router.get('/tickets/:ticketId/routing',             ctrl.resolveOrderRouting)
router.post('/items/:itemId/routing-override',canAccessPOS3,ctrl.applyRoutingOverride)

// ── Display State ─────────────────────────────────────────────────────────────
router.get('/display/station/:stationId',            ctrl.getStationDisplay)
router.get('/display/expo',                          ctrl.getExpoDisplay)
router.get('/display/all-stations',                  ctrl.getAllStationsDisplay)
router.get('/display/delayed',                       ctrl.getDelayedTickets)
router.get('/display/rush',                          ctrl.getRushTickets)
router.get('/display/completed',                     ctrl.getCompletedTickets)
router.post('/display/station/:stationId/prefs', canAccessPOS3, ctrl.saveDisplayPrefs)
router.post('/display/sync',                canAccessPOS3, ctrl.syncDisplay)
router.post('/display/station/:stationId/heartbeat', ctrl.recordHeartbeat)
router.post('/display/station/:stationId/offline', canAccessPOS3, ctrl.recordOffline)
router.post('/display/station/:stationId/online',  canAccessPOS3, ctrl.recordOnline)

// ── SmokeCraft / E.A.T. ───────────────────────────────────────────────────────
router.get('/smokecraft',                            ctrl.getSmokecraftContext)
router.post('/tickets/:ticketId/smokecraft-note', canAccessPOS3, ctrl.attachSmokecraftNote)
router.get('/eat-recommendations',                   ctrl.getRecommendations)

// ── Intelligence ──────────────────────────────────────────────────────────────
router.get('/stations/:stationId/bottleneck',        ctrl.getBottleneckHooks)
router.get('/delay-warnings',                        ctrl.getDelayWarnings)
router.get('/stations/:stationId/prep-times',        ctrl.getPrepTimeHooks)
router.get('/stations/:stationId/performance',       ctrl.getStationPerf)

// ── Analytics ─────────────────────────────────────────────────────────────────
router.post('/analytics',                   canAccessPOS3, ctrl.recordAnalytics)
router.get('/analytics/summary',                     ctrl.getAnalyticsSummary)

export default router
