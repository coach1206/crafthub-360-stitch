/**
 * pos360EventPackageMonetizationController.js — Phase B.10 Prompt W
 */

import * as svc from '../services/pos360/pos360EventPackageMonetizationService.js'

const ok500 = (res, fn) => fn().catch(e => res.status(500).json({ ok: false, error: e.message }))

const vid = req => req.headers['x-venue-id'] || req.body?.venueId || req.query?.venueId
const actor = req => req.headers['x-actor-id'] || req.body?.actorUserId || req.user?.id
const tid = req => req.headers['x-tenant-id'] || req.body?.tenantId || null

// ── Package categories ────────────────────────────────────────────────────────
export const createPackageCategory = (req, res) => ok500(res, () =>
  svc.createPackageCategory({ venueId: vid(req), payload: { ...req.body, tenantId: tid(req) }, actorUserId: actor(req), idempotencyKey: req.body.idempotencyKey })
    .then(r => res.json(r))
)

export const listPackageCategories = (req, res) => ok500(res, () =>
  svc.listPackageCategories({ venueId: vid(req), filters: req.query })
    .then(r => res.json(r))
)

export const updatePackageCategory = (req, res) => ok500(res, () =>
  svc.updatePackageCategory({ venueId: vid(req), categoryId: req.params.categoryId, payload: req.body, actorUserId: actor(req), idempotencyKey: req.body.idempotencyKey })
    .then(r => res.json(r))
)

// ── Packages ──────────────────────────────────────────────────────────────────
export const createEventPackage = (req, res) => ok500(res, () =>
  svc.createEventPackage({ venueId: vid(req), payload: { ...req.body, tenantId: tid(req) }, actorUserId: actor(req), idempotencyKey: req.body.idempotencyKey })
    .then(r => res.json(r))
)

export const listEventPackages = (req, res) => ok500(res, () =>
  svc.listEventPackages({ venueId: vid(req), filters: req.query })
    .then(r => res.json(r))
)

export const getEventPackage = (req, res) => ok500(res, () =>
  svc.getEventPackage({ venueId: vid(req), packageId: req.params.packageId })
    .then(r => res.json(r))
)

export const updateEventPackage = (req, res) => ok500(res, () =>
  svc.updateEventPackage({ venueId: vid(req), packageId: req.params.packageId, payload: req.body, actorUserId: actor(req), idempotencyKey: req.body.idempotencyKey })
    .then(r => res.json(r))
)

export const archiveEventPackage = (req, res) => ok500(res, () =>
  svc.archiveEventPackage({ venueId: vid(req), packageId: req.params.packageId, actorUserId: actor(req), reason: req.body.reason, idempotencyKey: req.body.idempotencyKey })
    .then(r => res.json(r))
)

// ── Package items ─────────────────────────────────────────────────────────────
export const addPackageItem = (req, res) => ok500(res, () =>
  svc.addPackageItem({ venueId: vid(req), packageId: req.params.packageId, payload: { ...req.body, tenantId: tid(req) }, actorUserId: actor(req), idempotencyKey: req.body.idempotencyKey })
    .then(r => res.json(r))
)

export const listPackageItems = (req, res) => ok500(res, () =>
  svc.listPackageItems({ venueId: vid(req), packageId: req.params.packageId })
    .then(r => res.json(r))
)

export const updatePackageItem = (req, res) => ok500(res, () =>
  svc.updatePackageItem({ venueId: vid(req), packageItemId: req.params.packageItemId, payload: req.body, actorUserId: actor(req), idempotencyKey: req.body.idempotencyKey })
    .then(r => res.json(r))
)

// ── Pricing ───────────────────────────────────────────────────────────────────
export const createPricingRule = (req, res) => ok500(res, () =>
  svc.createPricingRule({ venueId: vid(req), packageId: req.params.packageId, payload: { ...req.body, tenantId: tid(req) }, actorUserId: actor(req), idempotencyKey: req.body.idempotencyKey })
    .then(r => res.json(r))
)

export const listPricingRules = (req, res) => ok500(res, () =>
  svc.listPricingRules({ venueId: vid(req), packageId: req.params.packageId })
    .then(r => res.json(r))
)

export const calculatePackageQuote = (req, res) => ok500(res, () =>
  svc.calculatePackageQuote({ venueId: vid(req), packageId: req.params.packageId, quotePayload: req.body })
    .then(r => res.json(r))
)

// ── Package selections ────────────────────────────────────────────────────────
export const selectPackageForPrivateEvent = (req, res) => ok500(res, () =>
  svc.selectPackageForPrivateEvent({ venueId: vid(req), privateEventId: req.params.privateEventId, packageId: req.params.packageId, payload: { ...req.body, tenantId: tid(req) }, actorUserId: actor(req), idempotencyKey: req.body.idempotencyKey })
    .then(r => res.json(r))
)

export const listPrivateEventPackageSelections = (req, res) => ok500(res, () =>
  svc.listPrivateEventPackageSelections({ venueId: vid(req), privateEventId: req.params.privateEventId })
    .then(r => res.json(r))
)

export const updatePackageSelectionStatus = (req, res) => ok500(res, () =>
  svc.updatePackageSelectionStatus({ venueId: vid(req), packageSelectionId: req.params.packageSelectionId, status: req.body.status, actorUserId: actor(req), reason: req.body.reason, idempotencyKey: req.body.idempotencyKey })
    .then(r => res.json(r))
)

export const approvePackageSelection = (req, res) => ok500(res, () =>
  svc.approvePackageSelection({ venueId: vid(req), packageSelectionId: req.params.packageSelectionId, managerUserId: actor(req), reason: req.body.reason, idempotencyKey: req.body.idempotencyKey })
    .then(r => res.json(r))
)

// ── Deposits ──────────────────────────────────────────────────────────────────
export const createDepositPolicy = (req, res) => ok500(res, () =>
  svc.createDepositPolicy({ venueId: vid(req), payload: { ...req.body, tenantId: tid(req) }, actorUserId: actor(req), idempotencyKey: req.body.idempotencyKey })
    .then(r => res.json(r))
)

export const listDepositPolicies = (req, res) => ok500(res, () =>
  svc.listDepositPolicies({ venueId: vid(req), filters: req.query })
    .then(r => res.json(r))
)

export const createDepositRecord = (req, res) => ok500(res, () =>
  svc.createDepositRecord({ venueId: vid(req), privateEventId: req.params.privateEventId, payload: { ...req.body, tenantId: tid(req) }, actorUserId: actor(req), idempotencyKey: req.body.idempotencyKey })
    .then(r => res.json(r))
)

export const updateDepositStatus = (req, res) => ok500(res, () =>
  svc.updateDepositStatus({ venueId: vid(req), depositRecordId: req.params.depositRecordId, depositStatus: req.body.depositStatus, actorUserId: actor(req), reason: req.body.reason, idempotencyKey: req.body.idempotencyKey })
    .then(r => res.json(r))
)

export const approveDepositWaiver = (req, res) => ok500(res, () =>
  svc.approveDepositWaiver({ venueId: vid(req), depositRecordId: req.params.depositRecordId, managerUserId: actor(req), reason: req.body.reason, idempotencyKey: req.body.idempotencyKey })
    .then(r => res.json(r))
)

export const approveDepositRefund = (req, res) => ok500(res, () =>
  svc.approveDepositRefund({ venueId: vid(req), depositRecordId: req.params.depositRecordId, managerUserId: actor(req), reason: req.body.reason, idempotencyKey: req.body.idempotencyKey })
    .then(r => res.json(r))
)

// ── Minimum spend ─────────────────────────────────────────────────────────────
export const createMinimumSpendRule = (req, res) => ok500(res, () =>
  svc.createMinimumSpendRule({ venueId: vid(req), privateEventId: req.params.privateEventId, payload: { ...req.body, tenantId: tid(req) }, actorUserId: actor(req), idempotencyKey: req.body.idempotencyKey })
    .then(r => res.json(r))
)

export const getMinimumSpendProgress = (req, res) => ok500(res, () =>
  svc.getMinimumSpendProgress({ venueId: vid(req), privateEventId: req.params.privateEventId })
    .then(r => res.json(r))
)

export const updateMinimumSpendManualCredit = (req, res) => ok500(res, () =>
  svc.updateMinimumSpendManualCredit({ venueId: vid(req), privateEventId: req.params.privateEventId, payload: req.body, actorUserId: actor(req), idempotencyKey: req.body.idempotencyKey })
    .then(r => res.json(r))
)

export const approveMinimumSpendOverride = (req, res) => ok500(res, () =>
  svc.approveMinimumSpendOverride({ venueId: vid(req), privateEventId: req.params.privateEventId, managerUserId: actor(req), reason: req.body.reason, idempotencyKey: req.body.idempotencyKey })
    .then(r => res.json(r))
)

// ── Contracts ─────────────────────────────────────────────────────────────────
export const createContractTemplate = (req, res) => ok500(res, () =>
  svc.createContractTemplate({ venueId: vid(req), payload: { ...req.body, tenantId: tid(req) }, actorUserId: actor(req), idempotencyKey: req.body.idempotencyKey })
    .then(r => res.json(r))
)

export const listContractTemplates = (req, res) => ok500(res, () =>
  svc.listContractTemplates({ venueId: vid(req), filters: req.query })
    .then(r => res.json(r))
)

export const createContractSnapshot = (req, res) => ok500(res, () =>
  svc.createContractSnapshot({ venueId: vid(req), privateEventId: req.params.privateEventId, payload: { ...req.body, tenantId: tid(req) }, actorUserId: actor(req), idempotencyKey: req.body.idempotencyKey })
    .then(r => res.json(r))
)

export const updateContractStatus = (req, res) => ok500(res, () =>
  svc.updateContractStatus({ venueId: vid(req), contractSnapshotId: req.params.contractSnapshotId, contractStatus: req.body.contractStatus, actorUserId: actor(req), reason: req.body.reason, idempotencyKey: req.body.idempotencyKey })
    .then(r => res.json(r))
)

// ── Cancellation policies ─────────────────────────────────────────────────────
export const createCancellationPolicy = (req, res) => ok500(res, () =>
  svc.createCancellationPolicy({ venueId: vid(req), payload: { ...req.body, tenantId: tid(req) }, actorUserId: actor(req), idempotencyKey: req.body.idempotencyKey })
    .then(r => res.json(r))
)

export const listCancellationPolicies = (req, res) => ok500(res, () =>
  svc.listCancellationPolicies({ venueId: vid(req), filters: req.query })
    .then(r => res.json(r))
)

// ── Approvals ─────────────────────────────────────────────────────────────────
export const createApprovalRequest = (req, res) => ok500(res, () =>
  svc.createApprovalRequest({ venueId: vid(req), payload: { ...req.body, tenantId: tid(req) }, actorUserId: actor(req), idempotencyKey: req.body.idempotencyKey })
    .then(r => res.json(r))
)

export const listApprovalRequests = (req, res) => ok500(res, () =>
  svc.listApprovalRequests({ venueId: vid(req), filters: req.query })
    .then(r => res.json(r))
)

export const decideApprovalRequest = (req, res) => ok500(res, () =>
  svc.decideApprovalRequest({ venueId: vid(req), approvalRequestId: req.params.approvalRequestId, managerUserId: actor(req), decision: req.body.decision, reason: req.body.reason, idempotencyKey: req.body.idempotencyKey })
    .then(r => res.json(r))
)

// ── Inventory forecasting ─────────────────────────────────────────────────────
export const createInventoryForecast = (req, res) => ok500(res, () =>
  svc.createInventoryForecast({ venueId: vid(req), privateEventId: req.params.privateEventId, payload: { ...req.body, tenantId: tid(req) }, actorUserId: actor(req), idempotencyKey: req.body.idempotencyKey })
    .then(r => res.json(r))
)

export const listInventoryForecasts = (req, res) => ok500(res, () =>
  svc.listInventoryForecasts({ venueId: vid(req), privateEventId: req.params.privateEventId })
    .then(r => res.json(r))
)

export const markForecastReviewed = (req, res) => ok500(res, () =>
  svc.markForecastReviewed({ venueId: vid(req), forecastId: req.params.forecastId, actorUserId: actor(req), idempotencyKey: req.body.idempotencyKey })
    .then(r => res.json(r))
)

// ── POS order links ───────────────────────────────────────────────────────────
export const createPOSOrderLink = (req, res) => ok500(res, () =>
  svc.createPOSOrderLink({ venueId: vid(req), privateEventId: req.params.privateEventId, payload: { ...req.body, tenantId: tid(req) }, actorUserId: actor(req), idempotencyKey: req.body.idempotencyKey })
    .then(r => res.json(r))
)

export const listPOSOrderLinks = (req, res) => ok500(res, () =>
  svc.listPOSOrderLinks({ venueId: vid(req), privateEventId: req.params.privateEventId })
    .then(r => res.json(r))
)

export const removePOSOrderLink = (req, res) => ok500(res, () =>
  svc.removePOSOrderLink({ venueId: vid(req), orderLinkId: req.params.orderLinkId, actorUserId: actor(req), reason: req.body.reason, idempotencyKey: req.body.idempotencyKey })
    .then(r => res.json(r))
)

// ── Monetization insights ─────────────────────────────────────────────────────
export const createMonetizationInsightPlaceholder = (req, res) => ok500(res, () =>
  svc.createMonetizationInsightPlaceholder({ venueId: vid(req), payload: { ...req.body, tenantId: tid(req) }, actorUserId: actor(req), idempotencyKey: req.body.idempotencyKey })
    .then(r => res.json(r))
)

export const listMonetizationInsights = (req, res) => ok500(res, () =>
  svc.listMonetizationInsights({ venueId: vid(req), filters: req.query })
    .then(r => res.json(r))
)

export const getPrivateEventMonetizationSummary = (req, res) => ok500(res, () =>
  svc.getPrivateEventMonetizationSummary({ venueId: vid(req), privateEventId: req.params.privateEventId })
    .then(r => res.json(r))
)

// ── Offline ───────────────────────────────────────────────────────────────────
export const queueOfflineEventPackageAction = (req, res) => ok500(res, () =>
  svc.queueOfflineEventPackageAction({ venueId: vid(req), payload: { ...req.body, tenantId: tid(req) }, actorUserId: actor(req), idempotencyKey: req.body.idempotencyKey })
    .then(r => res.json(r))
)

export const listOfflineEventPackageQueue = (req, res) => ok500(res, () =>
  svc.listOfflineEventPackageQueue({ venueId: vid(req), filters: req.query })
    .then(r => res.json(r))
)

export const markOfflineEventPackageActionSynced = (req, res) => ok500(res, () =>
  svc.markOfflineEventPackageActionSynced({ venueId: vid(req), offlineActionId: req.params.offlineActionId, actorUserId: actor(req), idempotencyKey: req.body.idempotencyKey })
    .then(r => res.json(r))
)
