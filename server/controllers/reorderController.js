import {
  registerVendor, getVendor, listVenueVendors,
  getPreferredVendorsForProduct, getVendorConnectionReadiness,
} from '../services/reorder/vendorConnectionService.js'
import {
  buildReorderRecommendation, getVenueReorderRecommendations,
  buildUrgentReorderAlert, detectLowStockTriggers,
} from '../services/reorder/reorderRecommendationEngine.js'
import {
  createPurchaseOrderDraft, getPurchaseOrderDraft, listVenuePurchaseOrders,
  addItemToPurchaseOrder, getPurchaseOrderReadiness,
} from '../services/reorder/purchaseOrderDraftService.js'
import {
  approvePurchaseOrder, rejectPurchaseOrder, getApprovalReadiness,
  validateApprovalRole,
} from '../services/reorder/reorderApprovalService.js'
import {
  createDemandSignal, getVenueDemandSignals, getDemandSignalReadiness,
} from '../services/reorder/reorderDemandSignalService.js'
import {
  createReceivingPreview, markItemsReceived,
  buildInventoryAdjustmentFromReceiving, getReceivingReadiness,
} from '../services/reorder/inventoryReceivingService.js'

// --- Vendor ---
export async function handleRegisterVendor(req, res) {
  const { venueId } = req.params
  const result = registerVendor(venueId, req.body)
  res.status(result.ok ? 201 : 400).json(result)
}

export async function handleGetVendor(req, res) {
  const result = getVendor(req.params.vendorId)
  res.status(result.ok ? 200 : 404).json(result)
}

export async function handleListVendors(req, res) {
  res.json(listVenueVendors(req.params.venueId, req.query))
}

export async function handleGetPreferredVendors(req, res) {
  const { venueId, productId } = req.params
  res.json(getPreferredVendorsForProduct(venueId, productId))
}

export async function handleVendorConnectionReadiness(req, res) {
  res.json(getVendorConnectionReadiness(req.params.venueId))
}

// --- Recommendations ---
export async function handleGetRecommendations(req, res) {
  res.json(getVenueReorderRecommendations(req.params.venueId, req.query))
}

export async function handleUrgentAlert(req, res) {
  res.json(buildUrgentReorderAlert(req.params.venueId))
}

export async function handleDetectTriggers(req, res) {
  res.json(detectLowStockTriggers(req.params.venueId))
}

// --- Purchase Orders ---
export async function handleCreatePO(req, res) {
  const result = createPurchaseOrderDraft(req.params.venueId, req.body)
  res.status(result.ok ? 201 : 400).json(result)
}

export async function handleGetPO(req, res) {
  const result = getPurchaseOrderDraft(req.params.purchaseOrderId)
  res.status(result.ok ? 200 : 404).json(result)
}

export async function handleListPOs(req, res) {
  res.json(listVenuePurchaseOrders(req.params.venueId, req.query))
}

export async function handleAddPOItem(req, res) {
  const result = addItemToPurchaseOrder(req.params.purchaseOrderId, req.body)
  res.status(result.ok ? 200 : 400).json(result)
}

export async function handlePOReadiness(req, res) {
  res.json(getPurchaseOrderReadiness(req.params.venueId))
}

// --- Approval ---
export async function handleApprovePO(req, res) {
  const { purchaseOrderId } = req.params
  const actorContext = req.body
  const result = approvePurchaseOrder(purchaseOrderId, actorContext)
  res.status(result.ok ? 200 : 403).json(result)
}

export async function handleRejectPO(req, res) {
  const { purchaseOrderId } = req.params
  const { reason, ...actorContext } = req.body
  const result = rejectPurchaseOrder(purchaseOrderId, actorContext, reason)
  res.status(result.ok ? 200 : 403).json(result)
}

export async function handleApprovalReadiness(req, res) {
  res.json(getApprovalReadiness(req.params.venueId))
}

// --- Demand Signals ---
export async function handleCreateSignal(req, res) {
  const result = createDemandSignal(req.params.venueId, req.body)
  res.status(result.ok ? 201 : 400).json(result)
}

export async function handleGetSignals(req, res) {
  res.json(getVenueDemandSignals(req.params.venueId, req.query))
}

export async function handleSignalReadiness(req, res) {
  res.json(getDemandSignalReadiness(req.params.venueId))
}

// --- Receiving ---
export async function handleCreateReceiving(req, res) {
  const result = createReceivingPreview(req.params.venueId, req.body)
  res.status(result.ok ? 201 : 400).json(result)
}

export async function handleMarkReceived(req, res) {
  const { receivingId } = req.params
  const { items, ...actorContext } = req.body
  const result = markItemsReceived(receivingId, items ?? [], actorContext)
  res.status(result.ok ? 200 : 404).json(result)
}

export async function handleReceivingReadiness(req, res) {
  res.json(getReceivingReadiness(req.params.venueId))
}
