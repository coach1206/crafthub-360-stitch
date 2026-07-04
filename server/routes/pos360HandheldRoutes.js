/**
 * POS360 Handheld Device Suite Routes — Phase B.3
 * Mounted at /api/pos360/handheld
 *
 * All routes: venueTenantGuard
 * Write routes: canAccessPOS3 (staff+)
 * No open unauthenticated write routes.
 */
import { Router } from 'express'
import { venueTenantGuard } from '../middleware/venueTenantGuard.js'
import { canAccessPOS3 } from '../middleware/roleMiddleware.js'
import * as ctrl from '../controllers/pos360HandheldController.js'

const router = Router()

// ── Device Registry ───────────────────────────────────────────────────────────
router.post(  '/venues/:venueId/devices',                          venueTenantGuard, canAccessPOS3, ctrl.registerDevice)
router.get(   '/venues/:venueId/devices',                          venueTenantGuard, ctrl.listDevices)
router.get(   '/venues/:venueId/devices/:deviceId',                venueTenantGuard, ctrl.getDevice)
router.patch( '/venues/:venueId/devices/:deviceId',                venueTenantGuard, canAccessPOS3, ctrl.updateDevice)
router.delete('/venues/:venueId/devices/:deviceId',                venueTenantGuard, canAccessPOS3, ctrl.disableDevice)

// ── Device Sessions ───────────────────────────────────────────────────────────
router.post(  '/venues/:venueId/devices/:deviceId/sessions',                        venueTenantGuard, canAccessPOS3, ctrl.startSession)
router.post(  '/venues/:venueId/devices/:deviceId/sessions/:sessionId/end',         venueTenantGuard, canAccessPOS3, ctrl.endSession)

// ── Device Diagnostics ────────────────────────────────────────────────────────
router.post(  '/venues/:venueId/devices/:deviceId/diagnostics',                     venueTenantGuard, canAccessPOS3, ctrl.saveDiagnostics)
router.get(   '/venues/:venueId/devices/:deviceId/diagnostics',                     venueTenantGuard, ctrl.getDiagnostics)

// ── Device Sync ───────────────────────────────────────────────────────────────
router.post(  '/venues/:venueId/devices/:deviceId/sync',                            venueTenantGuard, canAccessPOS3, ctrl.recordSync)
router.get(   '/venues/:venueId/devices/:deviceId/sync',                            venueTenantGuard, ctrl.getSyncStatus)

// ── Handheld Home ─────────────────────────────────────────────────────────────
router.get(   '/venues/:venueId/home',                             venueTenantGuard, ctrl.getHomeState)
router.get(   '/venues/:venueId/launcher',                         venueTenantGuard, ctrl.getLauncher)

// ── Notifications ─────────────────────────────────────────────────────────────
router.get(   '/venues/:venueId/notifications',                    venueTenantGuard, ctrl.getNotifications)
router.post(  '/venues/:venueId/notifications',                    venueTenantGuard, canAccessPOS3, ctrl.createNotification)
router.post(  '/venues/:venueId/notifications/:notificationId/read', venueTenantGuard, canAccessPOS3, ctrl.markNotificationRead)

// ── Tables (handheld view — delegates to floor management) ───────────────────
router.get(   '/venues/:venueId/tables',                           venueTenantGuard, ctrl.getHandheldTables)
router.post(  '/venues/:venueId/tables/sync',                      venueTenantGuard, canAccessPOS3, ctrl.syncTableState)

// ── Orders ────────────────────────────────────────────────────────────────────
router.post(  '/venues/:venueId/orders',                           venueTenantGuard, canAccessPOS3, ctrl.createOrder)
router.post(  '/venues/:venueId/orders/:orderId/items',            venueTenantGuard, canAccessPOS3, ctrl.addOrderItem)
router.post(  '/venues/:venueId/orders/:orderId/send-to-station',  venueTenantGuard, canAccessPOS3, ctrl.sendToStation)

// ── Payments ──────────────────────────────────────────────────────────────────
router.get(   '/venues/:venueId/payment-options',                  venueTenantGuard, ctrl.getPaymentOptions)
router.post(  '/venues/:venueId/payment-intent',                   venueTenantGuard, canAccessPOS3, ctrl.createPaymentIntent)
router.post(  '/venues/:venueId/orders/:orderId/tip',              venueTenantGuard, canAccessPOS3, ctrl.captureTip)
router.post(  '/venues/:venueId/orders/:orderId/signature',        venueTenantGuard, canAccessPOS3, ctrl.captureSignature)
router.post(  '/venues/:venueId/orders/:orderId/receipt',          venueTenantGuard, canAccessPOS3, ctrl.sendReceipt)

// ── SmokeCraft ────────────────────────────────────────────────────────────────
router.get(   '/venues/:venueId/guests/:guestId/smokecraft',       venueTenantGuard, ctrl.getSmokecraftContext)
router.get(   '/venues/:venueId/guests/:guestId/smokecraft/pairings', venueTenantGuard, ctrl.getSmokecraftPairings)
router.post(  '/venues/:venueId/orders/:orderId/smokecraft',       venueTenantGuard, canAccessPOS3, ctrl.attachSmokecraftSession)

// ── E.A.T. ────────────────────────────────────────────────────────────────────
router.get(   '/venues/:venueId/recommendations',                  venueTenantGuard, ctrl.getRecommendations)
router.get(   '/venues/:venueId/manager-alerts',                   venueTenantGuard, ctrl.getManagerAlerts)

// ── Guests / Loyalty ──────────────────────────────────────────────────────────
router.get(   '/venues/:venueId/guests/search',                    venueTenantGuard, ctrl.searchGuests)
router.get(   '/venues/:venueId/guests/:guestId',                  venueTenantGuard, ctrl.getGuestProfile)
router.post(  '/venues/:venueId/guests/attach',                    venueTenantGuard, canAccessPOS3, ctrl.attachGuest)
router.get(   '/venues/:venueId/guests/:guestId/loyalty',          venueTenantGuard, ctrl.getLoyaltyProfile)
router.get(   '/venues/:venueId/guests/:guestId/rewards',          venueTenantGuard, ctrl.getRewardEligibility)

// ── Offline Queue ─────────────────────────────────────────────────────────────
router.post(  '/venues/:venueId/offline-queue',                    venueTenantGuard, canAccessPOS3, ctrl.queueOfflineAction)
router.get(   '/venues/:venueId/devices/:deviceId/offline-queue',  venueTenantGuard, ctrl.listOfflineQueue)
router.post(  '/venues/:venueId/devices/:deviceId/offline-queue/replay', venueTenantGuard, canAccessPOS3, ctrl.replayOfflineQueue)
router.post(  '/venues/:venueId/devices/:deviceId/sync/completed', venueTenantGuard, canAccessPOS3, ctrl.setSyncCompleted)
router.post(  '/venues/:venueId/devices/:deviceId/sync/failed',    venueTenantGuard, canAccessPOS3, ctrl.setSyncFailed)

// ── Manager Approvals ─────────────────────────────────────────────────────────
router.post(  '/venues/:venueId/manager-approvals',                venueTenantGuard, canAccessPOS3, ctrl.requestApproval)
router.get(   '/venues/:venueId/manager-approvals',                venueTenantGuard, ctrl.listApprovals)
router.post(  '/venues/:venueId/manager-approvals/:approvalId/resolve', venueTenantGuard, canAccessPOS3, ctrl.resolveApproval)

// ── Emergency Mode ────────────────────────────────────────────────────────────
router.post(  '/venues/:venueId/emergency',                        venueTenantGuard, canAccessPOS3, ctrl.activateEmergency)
router.post(  '/venues/:venueId/emergency/:emergencyId/deactivate', venueTenantGuard, canAccessPOS3, ctrl.deactivateEmergency)
router.post(  '/venues/:venueId/emergency/log',                    venueTenantGuard, canAccessPOS3, ctrl.logEmergency)

// ── Reports Preview ───────────────────────────────────────────────────────────
router.get(   '/venues/:venueId/reports/preview',                  venueTenantGuard, ctrl.getReportsPreview)

export default router
