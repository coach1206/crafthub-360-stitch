/**
 * pos360PaymentCloseoutRoutes.js — Phase B.11 Prompt X
 * Mounted at /api/pos360/payments-closeout
 * No fake payment routes. No fake Stripe/Square/Clover/Toast/Adyen routes.
 */

import { Router } from 'express'
import { canAccessPOS3 } from '../middleware/roleMiddleware.js'
import * as ctrl from '../controllers/pos360PaymentCloseoutController.js'

const router = Router()

// ── Provider profiles ─────────────────────────────────────────────────────────
router.post('/provider-profiles',                         canAccessPOS3, ctrl.createProviderProfile)
router.get('/provider-profiles',                          ctrl.listProviderProfiles)
router.patch('/provider-profiles/:providerProfileId',     canAccessPOS3, ctrl.updateProviderProfile)

// ── Terminal profiles ─────────────────────────────────────────────────────────
router.post('/terminal-profiles',                         canAccessPOS3, ctrl.createTerminalProfile)
router.get('/terminal-profiles',                          ctrl.listTerminalProfiles)
router.patch('/terminal-profiles/:terminalProfileId/status', canAccessPOS3, ctrl.updateTerminalStatus)

// ── Payment intents ───────────────────────────────────────────────────────────
router.post('/payment-intents',                           canAccessPOS3, ctrl.createPaymentIntent)
router.get('/payment-intents',                            ctrl.listPaymentIntents)
router.patch('/payment-intents/:paymentIntentId/status',  canAccessPOS3, ctrl.updatePaymentIntentStatus)

// ── Payment records ───────────────────────────────────────────────────────────
router.post('/payment-records',                           canAccessPOS3, ctrl.createPaymentRecord)
router.get('/payment-records',                            ctrl.listPaymentRecords)
router.patch('/payment-records/:paymentRecordId/status',  canAccessPOS3, ctrl.updatePaymentStatus)

// ── Split tender ──────────────────────────────────────────────────────────────
router.post('/split-tender-groups',                       canAccessPOS3, ctrl.createSplitTenderGroup)
router.post('/split-tender-groups/:splitTenderGroupId/tenders', canAccessPOS3, ctrl.addPaymentTender)

// ── Tips ──────────────────────────────────────────────────────────────────────
router.post('/tip-records',                               canAccessPOS3, ctrl.createTipRecord)
router.get('/tip-records',                                ctrl.listTipRecords)
router.post('/tip-records/:tipRecordId/adjust',           canAccessPOS3, ctrl.adjustTip)

// ── Signatures ────────────────────────────────────────────────────────────────
router.post('/signature-records',                         canAccessPOS3, ctrl.createSignatureRecord)

// ── Receipts ──────────────────────────────────────────────────────────────────
router.post('/receipt-records',                           canAccessPOS3, ctrl.createReceiptRecord)
router.patch('/receipt-records/:receiptRecordId/status',  canAccessPOS3, ctrl.updateReceiptStatus)
router.post('/receipt-records/:receiptRecordId/delivery-attempt', canAccessPOS3, ctrl.logReceiptDeliveryAttempt)

// ── Refunds ───────────────────────────────────────────────────────────────────
router.post('/refund-requests',                           canAccessPOS3, ctrl.createRefundRequest)
router.get('/refund-requests',                            ctrl.listRefundRequests)
router.post('/refund-requests/:refundRequestId/approve',  canAccessPOS3, ctrl.approveRefund)

// ── Voids ─────────────────────────────────────────────────────────────────────
router.post('/void-requests',                             canAccessPOS3, ctrl.createVoidRequest)
router.post('/void-requests/:voidRequestId/approve',      canAccessPOS3, ctrl.approveVoid)

// ── Cash drawers ──────────────────────────────────────────────────────────────
router.post('/cash-drawers',                              canAccessPOS3, ctrl.createCashDrawer)
router.get('/cash-drawers',                               ctrl.listCashDrawers)
router.post('/cash-drawers/:cashDrawerId/events',         canAccessPOS3, ctrl.createCashDrawerEvent)
router.get('/cash-drawers/:cashDrawerId/events',          ctrl.listCashDrawerEvents)

// ── Server closeout ───────────────────────────────────────────────────────────
router.post('/server-closeouts',                          canAccessPOS3, ctrl.createServerCloseout)
router.get('/server-closeouts',                           ctrl.listServerCloseouts)
router.post('/server-closeouts/:serverCloseoutId/approve', canAccessPOS3, ctrl.approveServerCloseout)

// ── Shift closeout ────────────────────────────────────────────────────────────
router.post('/shift-closeouts',                           canAccessPOS3, ctrl.createShiftCloseout)
router.get('/shift-closeouts',                            ctrl.listShiftCloseouts)
router.post('/shift-closeouts/:shiftCloseoutId/approve',  canAccessPOS3, ctrl.approveShiftCloseout)

// ── Daily closeout ────────────────────────────────────────────────────────────
router.post('/daily-closeouts',                           canAccessPOS3, ctrl.createDailyCloseout)
router.get('/daily-closeouts',                            ctrl.listDailyCloseouts)
router.post('/daily-closeouts/:dailyCloseoutId/approve',  canAccessPOS3, ctrl.approveDailyCloseout)

// ── Risk flags ────────────────────────────────────────────────────────────────
router.post('/risk-flags',                                canAccessPOS3, ctrl.createRiskFlag)
router.get('/risk-flags',                                 ctrl.listRiskFlags)

// ── Revenue insight hooks ─────────────────────────────────────────────────────
router.post('/revenue-insights',                          canAccessPOS3, ctrl.createRevenueInsightPlaceholder)
router.get('/revenue-insights',                           ctrl.listRevenueInsights)

// ── Offline queue ─────────────────────────────────────────────────────────────
router.post('/offline-queue',                             canAccessPOS3, ctrl.queueOfflinePaymentAction)
router.get('/offline-queue',                              ctrl.listOfflinePaymentQueue)
router.post('/offline-queue/:offlineActionId/synced',     canAccessPOS3, ctrl.markOfflinePaymentActionSynced)

export default router
