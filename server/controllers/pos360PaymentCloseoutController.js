/**
 * pos360PaymentCloseoutController.js — Phase B.11 Prompt X
 */

import * as svc from '../services/pos360/pos360PaymentCloseoutService.js'

const ok500 = (res, fn) => fn().catch(e => res.status(500).json({ ok: false, error: e.message }))
const vid = req => req.headers['x-venue-id'] || req.body?.venueId || req.query?.venueId
const actor = req => req.headers['x-actor-id'] || req.body?.actorId || req.query?.actorId
const tid = req => req.headers['x-tenant-id'] || req.body?.tenantId || req.query?.tenantId

// ── Provider profiles ─────────────────────────────────────────────────────────
export const createProviderProfile = (req, res) => ok500(res, async () => {
  const r = await svc.createProviderProfile({ venueId: vid(req), actorId: actor(req), tenantId: tid(req), ...req.body })
  res.json(r)
})
export const listProviderProfiles = (req, res) => ok500(res, async () => {
  const r = await svc.listProviderProfiles({ venueId: vid(req) })
  res.json(r)
})
export const updateProviderProfile = (req, res) => ok500(res, async () => {
  const r = await svc.updateProviderProfile({ venueId: vid(req), actorId: actor(req), tenantId: tid(req), providerProfileId: req.params.providerProfileId, updates: req.body })
  res.json(r)
})

// ── Terminal profiles ─────────────────────────────────────────────────────────
export const createTerminalProfile = (req, res) => ok500(res, async () => {
  const r = await svc.createTerminalProfile({ venueId: vid(req), actorId: actor(req), tenantId: tid(req), ...req.body })
  res.json(r)
})
export const listTerminalProfiles = (req, res) => ok500(res, async () => {
  const r = await svc.listTerminalProfiles({ venueId: vid(req) })
  res.json(r)
})
export const updateTerminalStatus = (req, res) => ok500(res, async () => {
  const r = await svc.updateTerminalStatus({ venueId: vid(req), actorId: actor(req), tenantId: tid(req), terminalProfileId: req.params.terminalProfileId, ...req.body })
  res.json(r)
})

// ── Payment intents ───────────────────────────────────────────────────────────
export const createPaymentIntent = (req, res) => ok500(res, async () => {
  const r = await svc.createPaymentIntent({ venueId: vid(req), actorId: actor(req), tenantId: tid(req), ...req.body })
  res.json(r)
})
export const listPaymentIntents = (req, res) => ok500(res, async () => {
  const r = await svc.listPaymentIntents({ venueId: vid(req), ...req.query })
  res.json(r)
})
export const updatePaymentIntentStatus = (req, res) => ok500(res, async () => {
  const r = await svc.updatePaymentIntentStatus({ venueId: vid(req), actorId: actor(req), tenantId: tid(req), paymentIntentId: req.params.paymentIntentId, ...req.body })
  res.json(r)
})

// ── Payment records ───────────────────────────────────────────────────────────
export const createPaymentRecord = (req, res) => ok500(res, async () => {
  const r = await svc.createPaymentRecord({ venueId: vid(req), actorId: actor(req), tenantId: tid(req), ...req.body })
  res.json(r)
})
export const listPaymentRecords = (req, res) => ok500(res, async () => {
  const r = await svc.listPaymentRecords({ venueId: vid(req), ...req.query })
  res.json(r)
})
export const updatePaymentStatus = (req, res) => ok500(res, async () => {
  const r = await svc.updatePaymentStatus({ venueId: vid(req), actorId: actor(req), tenantId: tid(req), paymentRecordId: req.params.paymentRecordId, ...req.body })
  res.json(r)
})

// ── Split tender ──────────────────────────────────────────────────────────────
export const createSplitTenderGroup = (req, res) => ok500(res, async () => {
  const r = await svc.createSplitTenderGroup({ venueId: vid(req), actorId: actor(req), tenantId: tid(req), ...req.body })
  res.json(r)
})
export const addPaymentTender = (req, res) => ok500(res, async () => {
  const r = await svc.addPaymentTender({ venueId: vid(req), actorId: actor(req), tenantId: tid(req), splitTenderGroupId: req.params.splitTenderGroupId, ...req.body })
  res.json(r)
})

// ── Tips ──────────────────────────────────────────────────────────────────────
export const createTipRecord = (req, res) => ok500(res, async () => {
  const r = await svc.createTipRecord({ venueId: vid(req), actorId: actor(req), tenantId: tid(req), ...req.body })
  res.json(r)
})
export const adjustTip = (req, res) => ok500(res, async () => {
  const r = await svc.adjustTip({ venueId: vid(req), actorId: actor(req), tenantId: tid(req), tipRecordId: req.params.tipRecordId, ...req.body })
  res.json(r)
})
export const listTipRecords = (req, res) => ok500(res, async () => {
  const r = await svc.listTipRecords({ venueId: vid(req), ...req.query })
  res.json(r)
})

// ── Signatures ────────────────────────────────────────────────────────────────
export const createSignatureRecord = (req, res) => ok500(res, async () => {
  const r = await svc.createSignatureRecord({ venueId: vid(req), actorId: actor(req), tenantId: tid(req), ...req.body })
  res.json(r)
})

// ── Receipts ──────────────────────────────────────────────────────────────────
export const createReceiptRecord = (req, res) => ok500(res, async () => {
  const r = await svc.createReceiptRecord({ venueId: vid(req), actorId: actor(req), tenantId: tid(req), ...req.body })
  res.json(r)
})
export const updateReceiptStatus = (req, res) => ok500(res, async () => {
  const r = await svc.updateReceiptStatus({ venueId: vid(req), actorId: actor(req), tenantId: tid(req), receiptRecordId: req.params.receiptRecordId, ...req.body })
  res.json(r)
})
export const logReceiptDeliveryAttempt = (req, res) => ok500(res, async () => {
  const r = await svc.logReceiptDeliveryAttempt({ venueId: vid(req), ...req.body })
  res.json(r)
})

// ── Refunds ───────────────────────────────────────────────────────────────────
export const createRefundRequest = (req, res) => ok500(res, async () => {
  const r = await svc.createRefundRequest({ venueId: vid(req), actorId: actor(req), tenantId: tid(req), ...req.body })
  res.json(r)
})
export const approveRefund = (req, res) => ok500(res, async () => {
  const r = await svc.approveRefund({ venueId: vid(req), actorId: actor(req), tenantId: tid(req), refundRequestId: req.params.refundRequestId })
  res.json(r)
})
export const listRefundRequests = (req, res) => ok500(res, async () => {
  const r = await svc.listRefundRequests({ venueId: vid(req), ...req.query })
  res.json(r)
})

// ── Voids ─────────────────────────────────────────────────────────────────────
export const createVoidRequest = (req, res) => ok500(res, async () => {
  const r = await svc.createVoidRequest({ venueId: vid(req), actorId: actor(req), tenantId: tid(req), ...req.body })
  res.json(r)
})
export const approveVoid = (req, res) => ok500(res, async () => {
  const r = await svc.approveVoid({ venueId: vid(req), actorId: actor(req), tenantId: tid(req), voidRequestId: req.params.voidRequestId })
  res.json(r)
})

// ── Cash drawer ───────────────────────────────────────────────────────────────
export const createCashDrawer = (req, res) => ok500(res, async () => {
  const r = await svc.createCashDrawer({ venueId: vid(req), actorId: actor(req), tenantId: tid(req), ...req.body })
  res.json(r)
})
export const listCashDrawers = (req, res) => ok500(res, async () => {
  const r = await svc.listCashDrawers({ venueId: vid(req) })
  res.json(r)
})
export const createCashDrawerEvent = (req, res) => ok500(res, async () => {
  const r = await svc.createCashDrawerEvent({ venueId: vid(req), actorId: actor(req), tenantId: tid(req), cashDrawerId: req.params.cashDrawerId, ...req.body })
  res.json(r)
})
export const listCashDrawerEvents = (req, res) => ok500(res, async () => {
  const r = await svc.listCashDrawerEvents({ venueId: vid(req), cashDrawerId: req.params.cashDrawerId })
  res.json(r)
})

// ── Server closeout ───────────────────────────────────────────────────────────
export const createServerCloseout = (req, res) => ok500(res, async () => {
  const r = await svc.createServerCloseout({ venueId: vid(req), actorId: actor(req), tenantId: tid(req), ...req.body })
  res.json(r)
})
export const listServerCloseouts = (req, res) => ok500(res, async () => {
  const r = await svc.listServerCloseouts({ venueId: vid(req), ...req.query })
  res.json(r)
})
export const approveServerCloseout = (req, res) => ok500(res, async () => {
  const r = await svc.approveServerCloseout({ venueId: vid(req), actorId: actor(req), tenantId: tid(req), serverCloseoutId: req.params.serverCloseoutId })
  res.json(r)
})

// ── Shift closeout ────────────────────────────────────────────────────────────
export const createShiftCloseout = (req, res) => ok500(res, async () => {
  const r = await svc.createShiftCloseout({ venueId: vid(req), actorId: actor(req), tenantId: tid(req), ...req.body })
  res.json(r)
})
export const listShiftCloseouts = (req, res) => ok500(res, async () => {
  const r = await svc.listShiftCloseouts({ venueId: vid(req), ...req.query })
  res.json(r)
})
export const approveShiftCloseout = (req, res) => ok500(res, async () => {
  const r = await svc.approveShiftCloseout({ venueId: vid(req), actorId: actor(req), tenantId: tid(req), shiftCloseoutId: req.params.shiftCloseoutId })
  res.json(r)
})

// ── Daily closeout ────────────────────────────────────────────────────────────
export const createDailyCloseout = (req, res) => ok500(res, async () => {
  const r = await svc.createDailyCloseout({ venueId: vid(req), actorId: actor(req), tenantId: tid(req), ...req.body })
  res.json(r)
})
export const listDailyCloseouts = (req, res) => ok500(res, async () => {
  const r = await svc.listDailyCloseouts({ venueId: vid(req) })
  res.json(r)
})
export const approveDailyCloseout = (req, res) => ok500(res, async () => {
  const r = await svc.approveDailyCloseout({ venueId: vid(req), actorId: actor(req), tenantId: tid(req), dailyCloseoutId: req.params.dailyCloseoutId })
  res.json(r)
})

// ── Risk flags ────────────────────────────────────────────────────────────────
export const createRiskFlag = (req, res) => ok500(res, async () => {
  const r = await svc.createRiskFlag({ venueId: vid(req), actorId: actor(req), tenantId: tid(req), ...req.body })
  res.json(r)
})
export const listRiskFlags = (req, res) => ok500(res, async () => {
  const r = await svc.listRiskFlags({ venueId: vid(req), ...req.query })
  res.json(r)
})

// ── Revenue insights ──────────────────────────────────────────────────────────
export const createRevenueInsightPlaceholder = (req, res) => ok500(res, async () => {
  const r = await svc.createRevenueInsightPlaceholder({ venueId: vid(req), actorId: actor(req), tenantId: tid(req), ...req.body })
  res.json(r)
})
export const listRevenueInsights = (req, res) => ok500(res, async () => {
  const r = await svc.listRevenueInsights({ venueId: vid(req) })
  res.json(r)
})

// ── Offline queue ─────────────────────────────────────────────────────────────
export const queueOfflinePaymentAction = (req, res) => ok500(res, async () => {
  const r = await svc.queueOfflinePaymentAction({ venueId: vid(req), actorId: actor(req), tenantId: tid(req), ...req.body })
  res.json(r)
})
export const listOfflinePaymentQueue = (req, res) => ok500(res, async () => {
  const r = await svc.listOfflinePaymentQueue({ venueId: vid(req) })
  res.json(r)
})
export const markOfflinePaymentActionSynced = (req, res) => ok500(res, async () => {
  const r = await svc.markOfflinePaymentActionSynced({ venueId: vid(req), actorId: actor(req), tenantId: tid(req), offlineActionId: req.params.offlineActionId })
  res.json(r)
})
