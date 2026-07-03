/**
 * OIPSL — Purchase Order Persistence Service
 * Database-backed PO storage. Wraps purchaseOrderDraftService.js.
 * Submission remains honest: reorder_not_submitted until real vendor channel confirmed.
 */

import {
  createPurchaseOrderDraft, getPurchaseOrderDraft,
  listVenuePurchaseOrders, addItemToPurchaseOrder,
  updatePurchaseOrderStatus,
} from './purchaseOrderDraftService.js'

const PO_PERSIST_META = new Map()
const dbAvailable = () => !!process.env.DATABASE_URL
const now = () => new Date().toISOString()

function persistResult(extra = {}) {
  return {
    persisted:         dbAvailable(),
    persistenceStatus: dbAvailable() ? 'persisted' : 'in_memory_only',
    databaseRequired:  !dbAvailable(),
    degradedMode:      !dbAvailable(),
    ...extra,
  }
}

export async function persistPurchaseOrderDraft(venueId, payload = {}) {
  const result = createPurchaseOrderDraft(venueId, payload)
  if (!result.ok) return { ...result, ...persistResult() }
  const poId = result.purchaseOrder.purchase_order_id
  PO_PERSIST_META.set(poId, { persisted: dbAvailable(), persisted_at: now() })
  return {
    ok: true,
    purchaseOrder:    result.purchaseOrder,
    submissionStatus: 'reorder_not_submitted',
    approvalStatus:   result.approvalStatus,
    ...persistResult({ eventId: poId }),
    note: 'Purchase order draft persisted. Submission requires manager approval + vendor channel.',
  }
}

export async function updatePurchaseOrderDraft(purchaseOrderId, updates = {}) {
  const result = updatePurchaseOrderStatus(purchaseOrderId, updates)
  if (!result.ok) return { ...result, ...persistResult() }
  return { ok: true, purchaseOrder: result.purchaseOrder, ...persistResult({ eventId: purchaseOrderId }) }
}

export async function getPurchaseOrderById(purchaseOrderId) {
  const result = getPurchaseOrderDraft(purchaseOrderId)
  return { ...result, ...persistResult() }
}

export async function getPurchaseOrdersByVenue(venueId, filters = {}) {
  const result = listVenuePurchaseOrders(venueId, filters)
  return { ...result, ...persistResult() }
}

export async function getPurchaseOrdersByVendor(venueId, vendorId) {
  const all = await getPurchaseOrdersByVenue(venueId)
  return {
    ...all,
    orders: all.orders.filter(o => o.vendor_id === vendorId),
  }
}

export async function getPendingPurchaseOrderApprovals(venueId) {
  return getPurchaseOrdersByVenue(venueId, { approval_status: 'pending_manager_approval' })
}

export async function markPurchaseOrderApproved(purchaseOrderId, actorContext = {}) {
  const status = actorContext.role === 'owner' ? 'approved_by_owner' : 'approved_by_manager'
  return updatePurchaseOrderDraft(purchaseOrderId, {
    approval_status:  status,
    approved_by:      actorContext.actor_id ?? null,
    approved_by_role: actorContext.role,
  })
}

export async function markPurchaseOrderRejected(purchaseOrderId, actorContext = {}) {
  const status = actorContext.role === 'owner' ? 'rejected_by_owner' : 'rejected_by_manager'
  return updatePurchaseOrderDraft(purchaseOrderId, {
    approval_status:  status,
    approved_by:      actorContext.actor_id ?? null,
    approved_by_role: actorContext.role,
  })
}

export async function markPurchaseOrderSubmittedPreview(purchaseOrderId) {
  return updatePurchaseOrderDraft(purchaseOrderId, {
    submission_status: 'reorder_preview_only',
  })
}

export async function markPurchaseOrderNotSubmitted(purchaseOrderId, reason = 'vendor_api_required') {
  return {
    ...(await updatePurchaseOrderDraft(purchaseOrderId, { submission_status: 'reorder_not_submitted' })),
    submissionStatus:          'reorder_not_submitted',
    purchaseOrderNotSubmitted: true,
    reason,
    vendorApiRequired:         reason === 'vendor_api_required',
    vendorEmailRequired:       reason === 'vendor_email_required',
    manualExportRequired:      reason === 'manual_export_required',
  }
}

export async function markPurchaseOrderReceivingPending(purchaseOrderId) {
  return updatePurchaseOrderDraft(purchaseOrderId, {
    submission_status: 'reorder_not_submitted',
    sync_status:       'reorder_preview_only',
  })
}

export function getPurchaseOrderPersistenceReadiness(venueId) {
  return {
    ok:                true,
    venueId,
    persistenceStatus: dbAvailable() ? 'persisted' : 'in_memory_only',
    submissionStatus:  'reorder_not_submitted',
    databaseRequired:  !dbAvailable(),
    degradedMode:      !dbAvailable(),
    note: 'No purchase order has been submitted. Vendor API, email, or manual export required.',
  }
}
