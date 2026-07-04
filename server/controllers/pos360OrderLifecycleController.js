/**
 * POS360 Order Lifecycle — Controller (Phase B.5)
 */

import * as svc from '../services/pos360/pos360OrderLifecycleService.js'

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

function tid(req) {
  return req.tenantId ?? req.body?.tenantId ?? req.query?.tenantId ?? 'unknown'
}

function actor(req) {
  return { actorId: req.user?.id, actorRole: req.user?.role }
}

// ── Orders ────────────────────────────────────────────────────────────────────
export const createOrder      = ok500(req => svc.createOrder(vid(req), tid(req), req.body, actor(req)))
export const getOrder         = ok500(req => svc.getOrder(req.params.orderId))
export const listOrders       = ok500(req => svc.listOrders(vid(req), req.query))
export const updateOrder      = ok500(req => svc.updateOrder(req.params.orderId, req.body, actor(req)))
export const cancelOrder      = ok500(req => svc.cancelOrder(req.params.orderId, req.body, actor(req)))
export const voidOrder        = ok500(req => svc.voidOrder(req.params.orderId, req.body, actor(req)))
export const closeOrderHook   = ok500(req => svc.closeOrderHook(req.params.orderId, actor(req)))
export const reopenOrder      = ok500(req => svc.reopenOrder(req.params.orderId, actor(req)))
export const changeOrderStatus= ok500(req => svc.changeOrderStatus(req.params.orderId, req.body.status, actor(req), req.body.reason))

// ── Order items ───────────────────────────────────────────────────────────────
export const addItemToOrder    = ok500(req => svc.addItemToOrder(req.params.orderId, req.body, actor(req)))
export const removeItemFromOrder=ok500(req => svc.removeItemFromOrder(req.params.orderId, req.params.itemId, actor(req)))
export const updateItemQty     = ok500(req => svc.updateItemQuantity(req.params.itemId, req.body.quantity, actor(req)))
export const updateItemNotes   = ok500(req => svc.updateItemNotes(req.params.itemId, req.body.notes, actor(req)))
export const addModifier       = ok500(req => svc.addModifierToItem(req.params.orderId, req.params.itemId, req.body, actor(req)))
export const removeModifier    = ok500(req => svc.removeModifierFromItem(req.params.modifierId, actor(req)))
export const addAddon          = ok500(req => svc.addAddonToItem(req.params.orderId, req.params.itemId, req.body, actor(req)))
export const removeAddon       = ok500(req => svc.removeAddonFromItem(req.params.addonId, actor(req)))
export const voidItem          = ok500(req => svc.voidItem(req.params.itemId, req.body, actor(req)))
export const cancelItem        = ok500(req => svc.cancelItem(req.params.itemId, req.body, actor(req)))
export const refireItem        = ok500(req => svc.refireItem(req.params.itemId, actor(req)))

// ── Courses ───────────────────────────────────────────────────────────────────
export const createCourse      = ok500(req => svc.createCourse(req.params.orderId, req.body, actor(req)))
export const updateCourse      = ok500(req => svc.updateCourse(req.params.courseId, req.body, actor(req)))
export const assignItemToCourse= ok500(req => svc.assignItemToCourse(req.params.itemId, req.params.courseId, actor(req)))
export const holdCourse        = ok500(req => svc.holdCourse(req.params.courseId, actor(req)))
export const fireCourse        = ok500(req => svc.fireCourse(req.params.courseId, actor(req)))
export const fireAllCourses    = ok500(req => svc.fireAllCourses(req.params.orderId, actor(req)))
export const sequenceCourses   = ok500(req => svc.sequenceCourses(req.params.orderId, req.body.sequence, actor(req)))
export const getCourseStatus   = ok500(req => svc.getCourseStatus(req.params.courseId))

// ── Tabs ──────────────────────────────────────────────────────────────────────
export const createTab         = ok500(req => svc.createTab(vid(req), tid(req), req.body, actor(req)))
export const getTab            = ok500(req => svc.getTab(req.params.tabId))
export const listTabs          = ok500(req => svc.listTabs(vid(req), req.query))
export const linkOrderToTab    = ok500(req => svc.linkOrderToTab(req.params.tabId, req.params.orderId, actor(req)))
export const transferTab       = ok500(req => svc.transferTab(req.params.tabId, req.body.targetTabId, actor(req)))
export const mergeTabs         = ok500(req => svc.mergeTabs(req.params.sourceTabId, req.body.targetTabId, actor(req)))
export const splitTab          = ok500(req => svc.splitTab(req.params.tabId, req.body.orderIds, actor(req)))
export const markTabPaymentPending=ok500(req => svc.markTabPaymentPending(req.params.tabId, actor(req)))
export const closeTabHook      = ok500(req => svc.closeTabHook(req.params.tabId, actor(req)))

// ── Tables ────────────────────────────────────────────────────────────────────
export const linkOrderToTable  = ok500(req => svc.linkOrderToTable(req.params.orderId, req.body.tableId, actor(req)))
export const moveOrderToTable  = ok500(req => svc.moveOrderToTable(req.params.orderId, req.body.tableId, actor(req)))
export const getTableOrders    = ok500(req => svc.getTableOrders(vid(req), req.params.tableId, req.query))

// ── Guests ────────────────────────────────────────────────────────────────────
export const linkGuestToOrder  = ok500(req => svc.linkGuestToOrder(req.params.orderId, req.body.guestId, req.body.tabId, actor(req)))
export const linkGuestToTab    = ok500(req => svc.linkOrderToTab(req.params.tabId, req.body.orderId, actor(req)))
export const getGuestOrders    = ok500(req => svc.getGuestOrders(vid(req), req.params.guestId))
export const getGuestOpenTabs  = ok500(req => svc.getGuestOpenTabs(vid(req), req.params.guestId))

// ── SmokeCraft ────────────────────────────────────────────────────────────────
export const linkSmokecraft    = ok500(req => svc.linkSmokecraftToOrder(req.params.orderId, req.body, actor(req)))
export const getSmokecraftCtx  = ok500(req => svc.getOrderSmokecraftContext(req.params.orderId))
export const addSmokecraftRec  = ok500(req => svc.addSmokecraftRecommendationHook(req.params.orderId, req.body, actor(req)))

// ── Loyalty ───────────────────────────────────────────────────────────────────
export const linkLoyalty       = ok500(req => svc.linkLoyaltyToOrder(req.params.orderId, req.body, actor(req)))
export const getLoyaltyCtx     = ok500(req => svc.getOrderLoyaltyContext(req.params.orderId))
export const applyLoyaltyHook  = ok500(req => svc.applyLoyaltyPricingHook(req.params.orderId, req.body, actor(req)))

// ── Routing ───────────────────────────────────────────────────────────────────
export const resolveRouting    = ok500(req => svc.resolveOrderRouting(req.params.orderId))
export const routeToProduction = ok500(req => svc.routeOrderToProduction(req.params.orderId, actor(req)))
export const routeItemToStation= ok500(req => svc.routeItemToProduction(req.params.itemId, actor(req)))
export const createProdTicket  = ok500(req => svc.createProductionTicketFromOrder(req.params.orderId, req.body.stationType, actor(req)))
export const getRoutingStatus  = ok500(req => svc.getRoutingStatus(req.params.orderId))
export const retryRouting      = ok500(req => svc.retryFailedRouting(req.params.orderId, actor(req)))

// ── Hold / Fire ───────────────────────────────────────────────────────────────
export const holdItem          = ok500(req => svc.holdItem(req.params.itemId, req.body, actor(req)))
export const fireItem          = ok500(req => svc.fireItem(req.params.itemId, actor(req)))
export const holdOrder         = ok500(req => svc.holdOrder(req.params.orderId, req.body, actor(req)))
export const fireOrder         = ok500(req => svc.fireOrder(req.params.orderId, actor(req)))
export const scheduleFireTime  = ok500(req => svc.scheduleFireTime(req.params.orderId, req.body.fireAt, actor(req)))
export const cancelHold        = ok500(req => svc.cancelHold(req.params.orderId, actor(req)))
export const getHoldFireHistory= ok500(req => svc.getHoldFireHistory(req.params.orderId))

// ── Handheld ──────────────────────────────────────────────────────────────────
export const getHandheldState  = ok500(req => svc.getHandheldOrderState(vid(req), actor(req).actorId))
export const saveHandheldOrder = ok500(req => svc.saveHandheldOrder(req.params.orderId, req.body, actor(req)))
export const submitHandheld    = ok500(req => svc.submitHandheldOrderToProduction(req.params.orderId, actor(req)))

// ── Audit ─────────────────────────────────────────────────────────────────────
export const getAuditTimeline  = ok500(req => svc.getOrderAuditTimeline(req.params.orderId))
