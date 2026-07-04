/**
 * POS360 Payments — Controller (Phase B.7)
 */

import * as svc from '../services/pos360/pos360PaymentService.js'

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
function vid(req) { return req.tenantVenueId ?? req.params.venueId ?? req.body?.venueId ?? req.query?.venueId }
function actor(req) { return { actorId: req.user?.id, actorRole: req.user?.role } }
function tid(req) { return req.tenantId ?? req.body?.tenantId ?? req.query?.tenantId }

// ── Intents ────────────────────────────────────────────────────────────────────
export const createPaymentIntent       = ok500(r => svc.createPaymentIntent({ tenantId: tid(r), venueId: vid(r), ...r.body, ...actor(r) }))
export const getPaymentIntent          = ok500(r => svc.getPaymentIntent({ tenantId: tid(r), venueId: vid(r), intentId: r.params.intentId }))
export const cancelPaymentIntent       = ok500(r => svc.cancelPaymentIntent({ tenantId: tid(r), venueId: vid(r), intentId: r.params.intentId, ...actor(r) }))
export const markIntentFailed          = ok500(r => svc.markIntentFailed({ tenantId: tid(r), venueId: vid(r), intentId: r.params.intentId, ...r.body, ...actor(r) }))
export const markIntentProviderRequired = ok500(r => svc.markIntentProviderRequired({ tenantId: tid(r), venueId: vid(r), intentId: r.params.intentId }))

// ── Payments ───────────────────────────────────────────────────────────────────
export const createPayment             = ok500(r => svc.createPayment({ tenantId: tid(r), venueId: vid(r), ...r.body, ...actor(r) }))
export const getPayment                = ok500(r => svc.getPayment({ tenantId: tid(r), venueId: vid(r), paymentId: r.params.paymentId }))
export const listPayments              = ok500(r => svc.listPayments({ tenantId: tid(r), venueId: vid(r), orderId: r.query.orderId, checkId: r.query.checkId, status: r.query.status }))
export const updatePaymentStatus       = ok500(r => svc.updatePaymentStatus({ tenantId: tid(r), venueId: vid(r), paymentId: r.params.paymentId, ...r.body, ...actor(r) }))
export const applyPaymentToOrder       = ok500(r => svc.applyPaymentToOrder({ tenantId: tid(r), venueId: vid(r), paymentId: r.params.paymentId, orderId: r.body.orderId, ...actor(r) }))

// ── Splits ─────────────────────────────────────────────────────────────────────
export const createSplitPayment        = ok500(r => svc.createSplitPayment({ tenantId: tid(r), venueId: vid(r), ...r.body, ...actor(r) }))
export const addTenderToSplit          = ok500(r => svc.addTenderToSplit({ tenantId: tid(r), venueId: vid(r), splitId: r.params.splitId, ...r.body, ...actor(r) }))
export const getSplitBalance           = ok500(r => svc.getSplitBalance({ tenantId: tid(r), venueId: vid(r), splitId: r.params.splitId }))
export const completeSplitHook         = ok500(r => svc.completeSplitHook({ tenantId: tid(r), venueId: vid(r), splitId: r.params.splitId, ...actor(r) }))

// ── Tips ───────────────────────────────────────────────────────────────────────
export const setTip                    = ok500(r => svc.setTip({ tenantId: tid(r), venueId: vid(r), ...r.body }))
export const updateTip                 = ok500(r => svc.updateTip({ tenantId: tid(r), venueId: vid(r), tipId: r.params.tipId, ...r.body, ...actor(r) }))
export const removeTip                 = ok500(r => svc.removeTip({ tenantId: tid(r), venueId: vid(r), tipId: r.params.tipId, ...actor(r) }))
export const calculateTipPresets       = ok500(r => svc.calculateTipPresets({ amount: r.query.amount, presets: r.query.presets }))
export const getTipSummary             = ok500(r => svc.getTipSummary({ tenantId: tid(r), venueId: vid(r), orderId: r.query.orderId }))

// ── Signatures ─────────────────────────────────────────────────────────────────
export const captureSignaturePlaceholder = ok500(r => svc.captureSignaturePlaceholder({ tenantId: tid(r), venueId: vid(r), ...r.body }))
export const getSignatureStatus          = ok500(r => svc.getSignatureStatus({ tenantId: tid(r), venueId: vid(r), paymentId: r.params.paymentId }))
export const queueOfflineSignature       = ok500(r => svc.queueOfflineSignature({ tenantId: tid(r), venueId: vid(r), ...r.body }))
export const markSignatureSkipped        = ok500(r => svc.markSignatureSkipped({ tenantId: tid(r), venueId: vid(r), paymentId: r.params.paymentId, ...r.body }))

// ── Receipts ───────────────────────────────────────────────────────────────────
export const generateReceiptPreview    = ok500(r => svc.generateReceiptPreview({ tenantId: tid(r), venueId: vid(r), ...r.body }))
export const sendEmailReceiptHook      = ok500(r => svc.sendEmailReceiptHook({ tenantId: tid(r), venueId: vid(r), receiptId: r.params.receiptId, ...r.body, ...actor(r) }))
export const sendSMSReceiptHook        = ok500(r => svc.sendSMSReceiptHook({ tenantId: tid(r), venueId: vid(r), receiptId: r.params.receiptId, ...r.body, ...actor(r) }))
export const printReceiptHook          = ok500(r => svc.printReceiptHook({ tenantId: tid(r), venueId: vid(r), receiptId: r.params.receiptId, ...r.body }))

// ── Refunds / Voids ────────────────────────────────────────────────────────────
export const checkRefundEligibility    = ok500(r => svc.checkRefundEligibility({ tenantId: tid(r), venueId: vid(r), paymentId: r.params.paymentId }))
export const createRefundHook          = ok500(r => svc.createRefundHook({ tenantId: tid(r), venueId: vid(r), ...r.body, ...actor(r) }))
export const approveRefund             = ok500(r => svc.approveRefund({ tenantId: tid(r), venueId: vid(r), refundId: r.params.refundId, ...r.body, ...actor(r) }))
export const denyRefund                = ok500(r => svc.denyRefund({ tenantId: tid(r), venueId: vid(r), refundId: r.params.refundId, ...r.body, ...actor(r) }))
export const getRefundStatus           = ok500(r => svc.getRefundStatus({ tenantId: tid(r), venueId: vid(r), refundId: r.params.refundId }))
export const voidPaymentHook           = ok500(r => svc.voidPaymentHook({ tenantId: tid(r), venueId: vid(r), ...r.body, ...actor(r) }))
export const approveVoid               = ok500(r => svc.approveVoid({ tenantId: tid(r), venueId: vid(r), voidId: r.params.voidId, ...r.body }))

// ── Settlement ─────────────────────────────────────────────────────────────────
export const createSettlementBatch     = ok500(r => svc.createSettlementBatch({ tenantId: tid(r), venueId: vid(r), ...r.body, ...actor(r) }))
export const getSettlementBatch        = ok500(r => svc.getSettlementBatch({ tenantId: tid(r), venueId: vid(r), batchId: r.params.batchId }))
export const listSettlementBatches     = ok500(r => svc.listSettlementBatches({ tenantId: tid(r), venueId: vid(r), status: r.query.status }))
export const closeSettlementBatchHook  = ok500(r => svc.closeSettlementBatchHook({ tenantId: tid(r), venueId: vid(r), batchId: r.params.batchId, ...actor(r) }))
export const getSettlementSummary      = ok500(r => svc.getSettlementSummary({ tenantId: tid(r), venueId: vid(r), batchId: r.params.batchId }))
export const getEndOfDayCloseoutHook   = ok500(r => svc.getEndOfDayCloseoutHook({ tenantId: tid(r), venueId: vid(r) }))

// ── Cash Drawer ────────────────────────────────────────────────────────────────
export const recordCashPayment         = ok500(r => svc.recordCashPayment({ tenantId: tid(r), venueId: vid(r), ...r.body, ...actor(r) }))
export const recordPaidIn              = ok500(r => svc.recordPaidIn({ tenantId: tid(r), venueId: vid(r), ...r.body, ...actor(r) }))
export const recordPaidOut             = ok500(r => svc.recordPaidOut({ tenantId: tid(r), venueId: vid(r), ...r.body, ...actor(r) }))
export const recordCashDrop            = ok500(r => svc.recordCashDrop({ tenantId: tid(r), venueId: vid(r), ...r.body, ...actor(r) }))
export const recordCashOverShort       = ok500(r => svc.recordCashOverShort({ tenantId: tid(r), venueId: vid(r), ...r.body, ...actor(r) }))
export const getCashDrawerSummary      = ok500(r => svc.getCashDrawerSummary({ tenantId: tid(r), venueId: vid(r), deviceId: r.query.deviceId, batchId: r.query.batchId }))

// ── Provider ───────────────────────────────────────────────────────────────────
export const listPaymentProviders      = ok500(r => svc.listPaymentProviders({ tenantId: tid(r), venueId: vid(r) }))
export const getProviderStatus         = ok500(r => svc.getProviderStatus({ tenantId: tid(r), venueId: vid(r), providerKey: r.params.providerKey }))
export const recordProviderEvent       = ok500(r => svc.recordProviderEvent({ tenantId: tid(r), venueId: vid(r), ...r.body }))
export const providerDisconnectedHook  = ok500(r => svc.providerDisconnectedHook({ tenantId: tid(r), venueId: vid(r), providerKey: r.body.providerKey }))

// ── Offline ────────────────────────────────────────────────────────────────────
export const queueOfflinePaymentPlaceholder = ok500(r => svc.queueOfflinePaymentPlaceholder({ tenantId: tid(r), venueId: vid(r), ...r.body, ...actor(r) }))
export const validatePaymentReplay     = ok500(r => svc.validatePaymentReplay({ tenantId: tid(r), venueId: vid(r), idempotencyKey: r.query.idempotencyKey }))
export const detectPaymentConflict     = ok500(r => svc.detectPaymentConflict({ tenantId: tid(r), venueId: vid(r), ...r.body }))
export const getOfflinePaymentQueueSummary = ok500(r => svc.getOfflinePaymentQueueSummary({ tenantId: tid(r), venueId: vid(r), deviceId: r.query.deviceId }))

// ── E.A.T. ─────────────────────────────────────────────────────────────────────
export const createEATPaymentAlert     = ok500(r => svc.createEATPaymentAlert({ tenantId: tid(r), venueId: vid(r), ...r.body }))
export const listEATPaymentAlerts      = ok500(r => svc.listEATPaymentAlerts({ tenantId: tid(r), venueId: vid(r), acknowledged: r.query.acknowledged, alertType: r.query.alertType }))
export const acknowledgeEATPaymentAlert = ok500(r => svc.acknowledgeEATPaymentAlert({ tenantId: tid(r), venueId: vid(r), alertId: r.params.alertId, ...actor(r) }))
export const getPaymentRiskSummary     = ok500(r => svc.getPaymentRiskSummary({ tenantId: tid(r), venueId: vid(r) }))
export const getRevenueSummaryHook     = ok500(r => svc.getRevenueSummaryHook({ tenantId: tid(r), venueId: vid(r) }))

// ── Language ───────────────────────────────────────────────────────────────────
export const getSupportedPaymentLanguages = ok500(() => svc.getSupportedPaymentLanguages_svc())
export const setPaymentLanguagePreference = ok500(r => svc.setPaymentLanguagePreference({ tenantId: tid(r), venueId: vid(r), ...r.body, ...actor(r) }))
export const recordMissingTranslationKey  = ok500(r => svc.recordMissingPaymentTranslationKey({ tenantId: tid(r), venueId: vid(r), ...r.body }))
