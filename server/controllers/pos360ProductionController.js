/**
 * POS360 Production Display System — Controller (Phase B.4)
 */

import * as svc from '../services/pos360/pos360ProductionDisplayService.js'

function ok500(fn) {
  return async (req, res) => {
    try {
      const result = await fn(req, res)
      if (!res.headersSent) res.json(result)
    } catch (err) {
      if (!res.headersSent) res.status(500).json({ ok: false, error: err.message })
    }
  }
}

function vid(req) {
  return req.tenantVenueId ?? req.params.venueId ?? req.body?.venueId ?? req.query?.venueId
}

function actor(req) {
  return { actorId: req.user?.id, actorRole: req.user?.role }
}

// Stations
export const createStation       = ok500(req => svc.createStation(vid(req), req.body, actor(req)))
export const updateStation       = ok500(req => svc.updateStation(req.params.stationId, req.body, actor(req)))
export const listStations        = ok500(req => svc.listStations(vid(req), req.query))
export const getStation          = ok500(req => svc.getStation(req.params.stationId))
export const activateStation     = ok500(req => svc.activateStation(req.params.stationId, actor(req)))
export const deactivateStation   = ok500(req => svc.deactivateStation(req.params.stationId, actor(req)))
export const assignDevice        = ok500(req => svc.assignDeviceToStation(req.params.stationId, req.body, actor(req)))
export const removeDevice        = ok500(req => svc.removeDeviceFromStation(req.params.stationId, req.body.deviceId, actor(req)))
export const getStationStatus    = ok500(req => svc.getStationStatus(req.params.stationId))

// Tickets
export const createTicket        = ok500(req => svc.createTicket(vid(req), req.body, actor(req)))
export const getTicket           = ok500(req => svc.getTicket(req.params.ticketId))
export const listTickets         = ok500(req => svc.listTickets(vid(req), req.query))
export const updateTicketStatus  = ok500(req => svc.updateTicketStatus(req.params.ticketId, req.body.status, actor(req)))
export const bumpTicket          = ok500(req => svc.bumpTicket(req.params.ticketId, actor(req)))
export const completeTicket      = ok500(req => svc.completeTicket(req.params.ticketId, actor(req)))
export const cancelTicket        = ok500(req => svc.cancelTicket(req.params.ticketId, req.body, actor(req)))
export const escalateTicket      = ok500(req => svc.escalateTicket(req.params.ticketId, req.body, actor(req)))
export const reopenTicket        = ok500(req => svc.reopenTicket(req.params.ticketId, actor(req)))

// Items
export const addTicketItem       = ok500(req => svc.addTicketItem(req.params.ticketId, req.body, actor(req)))
export const updateItemStatus    = ok500(req => svc.updateItemStatus(req.params.itemId, req.body.status, actor(req)))
export const startItem           = ok500(req => svc.startItem(req.params.itemId, actor(req)))
export const completeItem        = ok500(req => svc.completeItem(req.params.itemId, actor(req)))
export const refireItem          = ok500(req => svc.refireItem(req.params.itemId, actor(req)))
export const cancelItem          = ok500(req => svc.cancelItem(req.params.itemId, req.body, actor(req)))
export const voidItem            = ok500(req => svc.voidItem(req.params.itemId, actor(req)))

// Hold / Fire
export const holdItem            = ok500(req => svc.holdItem(req.params.itemId, req.body, actor(req)))
export const fireItem            = ok500(req => svc.fireItem(req.params.itemId, actor(req)))
export const fireOrder           = ok500(req => svc.fireOrder(req.params.ticketId, actor(req)))
export const scheduleFireTime    = ok500(req => svc.scheduleFireTime(req.params.ticketId, req.body.fireAt, actor(req)))
export const cancelHold          = ok500(req => svc.cancelHold(req.params.ticketId, actor(req)))
export const getHoldFireEvents   = ok500(req => svc.getHoldFireEvents(req.params.ticketId))

// Routing
export const createRoutingRule   = ok500(req => svc.createRoutingRule(vid(req), req.body, actor(req)))
export const listRoutingRules    = ok500(req => svc.listRoutingRules(vid(req), req.query))
export const resolveItemRouting  = ok500(req => svc.resolveRoutingForItem(req.params.itemId))
export const resolveOrderRouting = ok500(req => svc.resolveRoutingForOrder(req.params.ticketId))
export const applyRoutingOverride= ok500(req => svc.applyRoutingOverride(req.params.itemId, req.body, actor(req)))

// Display
export const getStationDisplay   = ok500(req => svc.getStationDisplayState(req.params.stationId, req.query))
export const getExpoDisplay      = ok500(req => svc.getExpoDisplayState(vid(req), req.query))
export const getAllStationsDisplay= ok500(req => svc.getAllStationsDisplayState(vid(req), req.query))
export const getDelayedTickets   = ok500(req => svc.getDelayedTickets(vid(req), req.query))
export const getRushTickets      = ok500(req => svc.getRushTickets(vid(req), req.query))
export const getCompletedTickets = ok500(req => svc.getCompletedTickets(vid(req), req.query))
export const saveDisplayPrefs    = ok500(req => svc.saveDisplayPreferences(vid(req), req.params.stationId, req.body, actor(req)))
export const syncDisplay         = ok500(req => svc.syncProductionDisplay(vid(req), actor(req)))
export const recordHeartbeat     = ok500(req => svc.recordDisplayHeartbeat(req.params.stationId, req.body))
export const recordOffline       = ok500(req => svc.recordDisplayOffline(req.params.stationId, actor(req)))
export const recordOnline        = ok500(req => svc.recordDisplayOnline(req.params.stationId, actor(req)))

// SmokeCraft / E.A.T.
export const getSmokecraftContext= ok500(req => svc.getProductionSmokecraftContext(vid(req)))
export const attachSmokecraftNote= ok500(req => svc.attachSmokecraftPairingNote(req.params.ticketId, req.body, actor(req)))
export const getRecommendations  = ok500(req => svc.getProductionRecommendations(vid(req)))

// Intelligence hooks
export const getBottleneckHooks  = ok500(req => svc.getStationBottleneckHooks(req.params.stationId))
export const getDelayWarnings    = ok500(req => svc.getDelayWarningHooks(vid(req)))
export const getPrepTimeHooks    = ok500(req => svc.getPrepTimeHooks(req.params.stationId))
export const getStationPerf      = ok500(req => svc.getStationPerformanceHooks(req.params.stationId, req.query))

// Analytics
export const recordAnalytics     = ok500(req => svc.recordAnalyticsEvent(vid(req), req.body, actor(req)))
export const getAnalyticsSummary = ok500(req => svc.getProductionAnalyticsSummary(vid(req), req.query))
