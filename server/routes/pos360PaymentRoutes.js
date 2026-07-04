/**
 * POS360 Payments — Routes (Phase B.7)
 * Mounted at /api/pos360/payments
 */

import { Router } from 'express'
import { venueTenantGuard } from '../middleware/venueTenantGuard.js'
import { canAccessPOS3 } from '../middleware/roleMiddleware.js'
import * as ctrl from '../controllers/pos360PaymentController.js'

const router = Router()
router.use(venueTenantGuard)

// ── Intents ────────────────────────────────────────────────────────────────────
router.post('/intents',                                  canAccessPOS3, ctrl.createPaymentIntent)
router.get('/intents/:intentId',                         ctrl.getPaymentIntent)
router.post('/intents/:intentId/cancel',                 canAccessPOS3, ctrl.cancelPaymentIntent)
router.post('/intents/:intentId/fail',                   canAccessPOS3, ctrl.markIntentFailed)
router.post('/intents/:intentId/provider-required',      ctrl.markIntentProviderRequired)

// ── Payments ───────────────────────────────────────────────────────────────────
router.post('/',                                         canAccessPOS3, ctrl.createPayment)
router.get('/',                                          ctrl.listPayments)
router.get('/:paymentId',                                ctrl.getPayment)
router.post('/:paymentId/status',                        canAccessPOS3, ctrl.updatePaymentStatus)
router.post('/:paymentId/apply-to-order',                canAccessPOS3, ctrl.applyPaymentToOrder)

// ── Splits ─────────────────────────────────────────────────────────────────────
router.post('/splits',                                   canAccessPOS3, ctrl.createSplitPayment)
router.post('/splits/:splitId/tender',                   canAccessPOS3, ctrl.addTenderToSplit)
router.get('/splits/:splitId/balance',                   ctrl.getSplitBalance)
router.post('/splits/:splitId/complete',                 canAccessPOS3, ctrl.completeSplitHook)

// ── Tips ───────────────────────────────────────────────────────────────────────
router.post('/tips',                                     canAccessPOS3, ctrl.setTip)
router.patch('/tips/:tipId',                             canAccessPOS3, ctrl.updateTip)
router.delete('/tips/:tipId',                            canAccessPOS3, ctrl.removeTip)
router.get('/tips/presets',                              ctrl.calculateTipPresets)
router.get('/tips/summary',                              ctrl.getTipSummary)

// ── Signatures ─────────────────────────────────────────────────────────────────
router.post('/signatures',                               canAccessPOS3, ctrl.captureSignaturePlaceholder)
router.get('/signatures/:paymentId/status',              ctrl.getSignatureStatus)
router.post('/signatures/queue-offline',                 ctrl.queueOfflineSignature)
router.post('/signatures/:paymentId/skip',               ctrl.markSignatureSkipped)

// ── Receipts ───────────────────────────────────────────────────────────────────
router.post('/receipts/preview',                         ctrl.generateReceiptPreview)
router.post('/receipts/:receiptId/email',                canAccessPOS3, ctrl.sendEmailReceiptHook)
router.post('/receipts/:receiptId/sms',                  canAccessPOS3, ctrl.sendSMSReceiptHook)
router.post('/receipts/:receiptId/print',                ctrl.printReceiptHook)

// ── Refunds ────────────────────────────────────────────────────────────────────
router.get('/:paymentId/refund-eligibility',             ctrl.checkRefundEligibility)
router.post('/refunds',                                  canAccessPOS3, ctrl.createRefundHook)
router.post('/refunds/:refundId/approve',                canAccessPOS3, ctrl.approveRefund)
router.post('/refunds/:refundId/deny',                   canAccessPOS3, ctrl.denyRefund)
router.get('/refunds/:refundId/status',                  ctrl.getRefundStatus)

// ── Voids ──────────────────────────────────────────────────────────────────────
router.post('/voids',                                    canAccessPOS3, ctrl.voidPaymentHook)
router.post('/voids/:voidId/approve',                    canAccessPOS3, ctrl.approveVoid)

// ── Settlement ─────────────────────────────────────────────────────────────────
router.post('/settlement/batches',                       canAccessPOS3, ctrl.createSettlementBatch)
router.get('/settlement/batches',                        ctrl.listSettlementBatches)
router.get('/settlement/batches/end-of-day',             ctrl.getEndOfDayCloseoutHook)
router.get('/settlement/batches/:batchId',               ctrl.getSettlementBatch)
router.post('/settlement/batches/:batchId/close',        canAccessPOS3, ctrl.closeSettlementBatchHook)
router.get('/settlement/batches/:batchId/summary',       ctrl.getSettlementSummary)

// ── Cash Drawer ────────────────────────────────────────────────────────────────
router.post('/cash/payment',                             canAccessPOS3, ctrl.recordCashPayment)
router.post('/cash/paid-in',                             canAccessPOS3, ctrl.recordPaidIn)
router.post('/cash/paid-out',                            canAccessPOS3, ctrl.recordPaidOut)
router.post('/cash/drop',                                canAccessPOS3, ctrl.recordCashDrop)
router.post('/cash/over-short',                          canAccessPOS3, ctrl.recordCashOverShort)
router.get('/cash/drawer-summary',                       ctrl.getCashDrawerSummary)

// ── Providers ──────────────────────────────────────────────────────────────────
router.get('/providers',                                 ctrl.listPaymentProviders)
router.get('/providers/:providerKey/status',             ctrl.getProviderStatus)
router.post('/providers/events',                         ctrl.recordProviderEvent)
router.post('/providers/disconnected',                   ctrl.providerDisconnectedHook)

// ── Offline ────────────────────────────────────────────────────────────────────
router.post('/offline/queue',                            ctrl.queueOfflinePaymentPlaceholder)
router.get('/offline/validate',                          ctrl.validatePaymentReplay)
router.post('/offline/conflict',                         ctrl.detectPaymentConflict)
router.get('/offline/queue-summary',                     ctrl.getOfflinePaymentQueueSummary)

// ── E.A.T. Alerts ──────────────────────────────────────────────────────────────
router.post('/eat-alerts',                               canAccessPOS3, ctrl.createEATPaymentAlert)
router.get('/eat-alerts',                                ctrl.listEATPaymentAlerts)
router.get('/eat-alerts/risk-summary',                   ctrl.getPaymentRiskSummary)
router.get('/eat-alerts/revenue-summary',                ctrl.getRevenueSummaryHook)
router.post('/eat-alerts/:alertId/acknowledge',          canAccessPOS3, ctrl.acknowledgeEATPaymentAlert)

// ── Language ───────────────────────────────────────────────────────────────────
router.get('/languages',                                 ctrl.getSupportedPaymentLanguages)
router.post('/language-preference',                      ctrl.setPaymentLanguagePreference)
router.post('/translation/missing',                      ctrl.recordMissingTranslationKey)

export default router
