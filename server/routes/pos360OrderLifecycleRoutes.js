/**
 * POS360 Order Lifecycle — Routes (Phase B.5)
 * Mounted at /api/pos360/orders
 */

import { Router } from 'express'
import { venueTenantGuard } from '../middleware/venueTenantGuard.js'
import { canAccessPOS3 } from '../middleware/roleMiddleware.js'
import * as ctrl from '../controllers/pos360OrderLifecycleController.js'

const router = Router()

router.use(venueTenantGuard)

// ── Orders ────────────────────────────────────────────────────────────────────
router.get('/',                                ctrl.listOrders)
router.post('/',                    canAccessPOS3, ctrl.createOrder)
router.get('/:orderId',                        ctrl.getOrder)
router.patch('/:orderId',           canAccessPOS3, ctrl.updateOrder)
router.patch('/:orderId/status',    canAccessPOS3, ctrl.changeOrderStatus)
router.post('/:orderId/cancel',     canAccessPOS3, ctrl.cancelOrder)
router.post('/:orderId/void',       canAccessPOS3, ctrl.voidOrder)
router.post('/:orderId/close',      canAccessPOS3, ctrl.closeOrderHook)
router.post('/:orderId/reopen',     canAccessPOS3, ctrl.reopenOrder)

// ── Order items ───────────────────────────────────────────────────────────────
router.post('/:orderId/items',      canAccessPOS3, ctrl.addItemToOrder)
router.delete('/:orderId/items/:itemId', canAccessPOS3, ctrl.removeItemFromOrder)
router.patch('/items/:itemId/quantity',  canAccessPOS3, ctrl.updateItemQty)
router.patch('/items/:itemId/notes',     canAccessPOS3, ctrl.updateItemNotes)
router.post('/:orderId/items/:itemId/modifiers', canAccessPOS3, ctrl.addModifier)
router.delete('/items/modifiers/:modifierId',    canAccessPOS3, ctrl.removeModifier)
router.post('/:orderId/items/:itemId/addons',    canAccessPOS3, ctrl.addAddon)
router.delete('/items/addons/:addonId',          canAccessPOS3, ctrl.removeAddon)
router.post('/items/:itemId/void',   canAccessPOS3, ctrl.voidItem)
router.post('/items/:itemId/cancel', canAccessPOS3, ctrl.cancelItem)
router.post('/items/:itemId/refire', canAccessPOS3, ctrl.refireItem)

// ── Courses ───────────────────────────────────────────────────────────────────
router.post('/:orderId/courses',               canAccessPOS3, ctrl.createCourse)
router.patch('/courses/:courseId',             canAccessPOS3, ctrl.updateCourse)
router.post('/courses/:courseId/items/:itemId',canAccessPOS3, ctrl.assignItemToCourse)
router.post('/courses/:courseId/hold',         canAccessPOS3, ctrl.holdCourse)
router.post('/courses/:courseId/fire',         canAccessPOS3, ctrl.fireCourse)
router.post('/:orderId/courses/fire-all',      canAccessPOS3, ctrl.fireAllCourses)
router.post('/:orderId/courses/sequence',      canAccessPOS3, ctrl.sequenceCourses)
router.get('/courses/:courseId/status',        ctrl.getCourseStatus)

// ── Tabs ──────────────────────────────────────────────────────────────────────
router.get('/tabs',                            ctrl.listTabs)
router.post('/tabs',                canAccessPOS3, ctrl.createTab)
router.get('/tabs/:tabId',                     ctrl.getTab)
router.post('/tabs/:tabId/orders/:orderId',    canAccessPOS3, ctrl.linkOrderToTab)
router.post('/tabs/:tabId/transfer',           canAccessPOS3, ctrl.transferTab)
router.post('/tabs/:sourceTabId/merge',        canAccessPOS3, ctrl.mergeTabs)
router.post('/tabs/:tabId/split',              canAccessPOS3, ctrl.splitTab)
router.post('/tabs/:tabId/payment-pending',    canAccessPOS3, ctrl.markTabPaymentPending)
router.post('/tabs/:tabId/close',              canAccessPOS3, ctrl.closeTabHook)

// ── Tables ────────────────────────────────────────────────────────────────────
router.post('/:orderId/table',      canAccessPOS3, ctrl.linkOrderToTable)
router.post('/:orderId/table/move', canAccessPOS3, ctrl.moveOrderToTable)
router.get('/tables/:tableId/orders',          ctrl.getTableOrders)

// ── Guests ────────────────────────────────────────────────────────────────────
router.post('/:orderId/guest',      canAccessPOS3, ctrl.linkGuestToOrder)
router.post('/tabs/:tabId/guest',   canAccessPOS3, ctrl.linkGuestToTab)
router.get('/guests/:guestId/orders',          ctrl.getGuestOrders)
router.get('/guests/:guestId/tabs',            ctrl.getGuestOpenTabs)

// ── SmokeCraft ────────────────────────────────────────────────────────────────
router.post('/:orderId/smokecraft', canAccessPOS3, ctrl.linkSmokecraft)
router.get('/:orderId/smokecraft',             ctrl.getSmokecraftCtx)
router.post('/:orderId/smokecraft/recommendation', canAccessPOS3, ctrl.addSmokecraftRec)

// ── Loyalty ───────────────────────────────────────────────────────────────────
router.post('/:orderId/loyalty',    canAccessPOS3, ctrl.linkLoyalty)
router.get('/:orderId/loyalty',                ctrl.getLoyaltyCtx)
router.post('/:orderId/loyalty/apply-pricing', canAccessPOS3, ctrl.applyLoyaltyHook)

// ── Routing ───────────────────────────────────────────────────────────────────
router.get('/:orderId/routing',                ctrl.resolveRouting)
router.post('/:orderId/route-to-production', canAccessPOS3, ctrl.routeToProduction)
router.post('/items/:itemId/route',          canAccessPOS3, ctrl.routeItemToStation)
router.post('/:orderId/production-ticket',   canAccessPOS3, ctrl.createProdTicket)
router.get('/:orderId/routing/status',       ctrl.getRoutingStatus)
router.post('/:orderId/routing/retry',       canAccessPOS3, ctrl.retryRouting)

// ── Hold / Fire ───────────────────────────────────────────────────────────────
router.post('/items/:itemId/hold',  canAccessPOS3, ctrl.holdItem)
router.post('/items/:itemId/fire',  canAccessPOS3, ctrl.fireItem)
router.post('/:orderId/hold',       canAccessPOS3, ctrl.holdOrder)
router.post('/:orderId/fire',       canAccessPOS3, ctrl.fireOrder)
router.post('/:orderId/schedule-fire', canAccessPOS3, ctrl.scheduleFireTime)
router.post('/:orderId/cancel-hold',   canAccessPOS3, ctrl.cancelHold)
router.get('/:orderId/hold-fire-history', ctrl.getHoldFireHistory)

// ── Handheld ──────────────────────────────────────────────────────────────────
router.get('/handheld/state',                  ctrl.getHandheldState)
router.patch('/handheld/:orderId',  canAccessPOS3, ctrl.saveHandheldOrder)
router.post('/handheld/:orderId/submit', canAccessPOS3, ctrl.submitHandheld)

// ── Audit ─────────────────────────────────────────────────────────────────────
router.get('/:orderId/audit',                  ctrl.getAuditTimeline)

export default router
