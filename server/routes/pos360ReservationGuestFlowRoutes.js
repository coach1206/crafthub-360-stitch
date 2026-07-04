/**
 * pos360ReservationGuestFlowRoutes.js — Phase B.9
 * Mounted at /api/pos360/reservations
 */

import { Router } from 'express'
import { venueTenantGuard } from '../middleware/venueTenantGuard.js'
import { canAccessPOS3 } from '../middleware/roleMiddleware.js'
import * as ctrl from '../controllers/pos360ReservationGuestFlowController.js'

const router = Router()
router.use(venueTenantGuard)

// ── Reservations ──────────────────────────────────────────────────────────────
router.post('/',                                               canAccessPOS3, ctrl.createReservation)
router.get('/',                                                              ctrl.listReservations)
router.get('/:reservationId',                                                ctrl.getReservation)
router.patch('/:reservationId/status',                         canAccessPOS3, ctrl.updateReservationStatus)
router.post('/:reservationId/assign-table',                    canAccessPOS3, ctrl.assignReservationTable)
router.post('/:reservationId/cancel',                          canAccessPOS3, ctrl.cancelReservation)
router.post('/:reservationId/no-show',                         canAccessPOS3, ctrl.markReservationNoShow)

// ── Waitlist ──────────────────────────────────────────────────────────────────
router.post('/waitlist',                                       canAccessPOS3, ctrl.createWaitlistEntry)
router.get('/waitlist',                                                       ctrl.listWaitlist)
router.patch('/waitlist/:waitlistEntryId/status',              canAccessPOS3, ctrl.updateWaitlistStatus)
router.post('/waitlist/:waitlistEntryId/approve-priority',     canAccessPOS3, ctrl.approveWaitlistPriorityOverride)

// ── Sections ──────────────────────────────────────────────────────────────────
router.post('/sections',                                       canAccessPOS3, ctrl.createFloorSection)
router.get('/sections',                                                       ctrl.listFloorSections)

// ── Tables ────────────────────────────────────────────────────────────────────
router.post('/tables',                                         canAccessPOS3, ctrl.createTable)
router.get('/tables',                                                         ctrl.listTables)
router.patch('/tables/:tableId/status',                        canAccessPOS3, ctrl.updateTableStatus)
router.post('/tables/:tableId/assign-server',                  canAccessPOS3, ctrl.assignTableToServer)
router.post('/tables/merge',                                   canAccessPOS3, ctrl.mergeTables)
router.post('/tables/:tableId/release',                        canAccessPOS3, ctrl.releaseTable)

// ── Private Events ────────────────────────────────────────────────────────────
router.post('/private-events',                                 canAccessPOS3, ctrl.createPrivateEventInquiry)
router.get('/private-events',                                                 ctrl.listPrivateEvents)
router.patch('/private-events/:privateEventId/status',         canAccessPOS3, ctrl.updatePrivateEventStatus)
router.post('/private-events/:privateEventId/approve',         canAccessPOS3, ctrl.approvePrivateEvent)
router.patch('/private-events/:privateEventId/deposit-status', canAccessPOS3, ctrl.updatePrivateEventDepositStatus)

// ── Guest Flow ────────────────────────────────────────────────────────────────
router.post('/guest-flow/events',                              canAccessPOS3, ctrl.createGuestFlowEvent)
router.get('/guest-flow/events',                                              ctrl.listGuestFlowEvents)
router.get('/guest-flow/insights',                                            ctrl.getGuestFlowInsights)

// ── Offline Queue ─────────────────────────────────────────────────────────────
router.post('/offline-queue',                                  canAccessPOS3, ctrl.queueOfflineReservationAction)
router.get('/offline-queue',                                                  ctrl.listOfflineReservationQueue)
router.post('/offline-queue/:offlineActionId/synced',          canAccessPOS3, ctrl.markOfflineActionSynced)

export default router
