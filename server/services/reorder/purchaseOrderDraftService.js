/**
 * DMRC — Purchase Order Draft Service
 * Creates and manages purchase order drafts.
 * Orders are NOT submitted without manager/owner approval.
 * preview_only: true until approval + real vendor API confirmed.
 */

import { v4 as uuidv4 } from 'uuid'

const PO_STORE   = new Map()
const ITEM_STORE = new Map()
const dbAvailable = () => !!process.env.DATABASE_URL
const now = () => new Date().toISOString()

export const PO_APPROVAL_STATUSES = [
  'pending_manager_approval','pending_owner_approval','approved_by_manager',
  'approved_by_owner','rejected_by_manager','rejected_by_owner',
]
export const PO_SUBMISSION_STATUSES = [
  'reorder_not_submitted','reorder_preview_only','reorder_submitted',
  'reorder_acknowledged','reorder_failed',
]

export function createPurchaseOrderDraft(venueId, payload = {}) {
  const poId = uuidv4()
  const po = {
    purchase_order_id:        poId,
    venue_id:                 venueId,
    vendor_id:                payload.vendor_id ?? null,
    vendor_name:              payload.vendor_name ?? null,
    requested_by:             payload.requested_by ?? null,
    requested_by_role:        payload.requested_by_role ?? 'manager',
    approval_required:        true,
    approval_status:          'pending_manager_approval',
    approved_by:              null,
    approved_by_role:         null,
    estimated_total:          0,
    estimated_lead_time_days: payload.estimated_lead_time_days ?? 3,
    reorder_reason:           payload.reorder_reason ?? 'low_stock',
    reorder_source:           payload.reorder_source ?? 'system',
    sync_status:              'reorder_preview_only',
    submission_status:        'reorder_not_submitted',
    preview_only:             true,
    items:                    [],
    metadata:                 payload.metadata ?? {},
    created_at:               now(),
    updated_at:               now(),
  }
  PO_STORE.set(poId, po)
  return {
    ok: true, purchaseOrder: po,
    submissionStatus: po.submission_status,
    approvalStatus:   po.approval_status,
    persistenceStatus: dbAvailable() ? 'database_required' : 'not_persisted',
    note: 'Purchase order is preview only. Manager approval required before submission.',
  }
}

export function getPurchaseOrderDraft(purchaseOrderId) {
  const po = PO_STORE.get(purchaseOrderId)
  if (!po) return { ok: false, error: 'purchase_order_not_found' }
  const items = [...ITEM_STORE.values()].filter(i => i.purchase_order_id === purchaseOrderId)
  return {
    ok: true, purchaseOrder: { ...po, items },
    submissionStatus: po.submission_status,
    approvalStatus:   po.approval_status,
    persistenceStatus: dbAvailable() ? 'database_required' : 'not_persisted',
  }
}

export function listVenuePurchaseOrders(venueId, filters = {}) {
  const orders = []
  for (const po of PO_STORE.values()) {
    if (po.venue_id !== venueId) continue
    if (filters.approval_status && po.approval_status !== filters.approval_status) continue
    if (filters.submission_status && po.submission_status !== filters.submission_status) continue
    orders.push(po)
  }
  return {
    ok: true, orders, count: orders.length, venueId,
    persistenceStatus: dbAvailable() ? 'database_required' : 'not_persisted',
  }
}

export function addItemToPurchaseOrder(purchaseOrderId, itemPayload = {}) {
  const po = PO_STORE.get(purchaseOrderId)
  if (!po) return { ok: false, error: 'purchase_order_not_found' }
  if (!itemPayload.product_id) return { ok: false, error: 'product_id required' }

  const qty      = Math.max(1, itemPayload.recommended_quantity ?? 1)
  const unitCost = Math.max(0, itemPayload.estimated_unit_cost ?? 0)
  const lineTotal = qty * unitCost

  const item = {
    po_item_id:            uuidv4(),
    purchase_order_id:     purchaseOrderId,
    venue_id:              po.venue_id,
    product_id:            itemPayload.product_id,
    product_name:          itemPayload.product_name ?? itemPayload.product_id,
    sku:                   itemPayload.sku ?? null,
    vendor_sku:            itemPayload.vendor_sku ?? null,
    current_stock:         itemPayload.current_stock ?? 0,
    available_quantity:    itemPayload.available_quantity ?? 0,
    reorder_threshold:     itemPayload.reorder_threshold ?? 5,
    recommended_quantity:  qty,
    minimum_order_quantity: itemPayload.minimum_order_quantity ?? 1,
    case_pack_quantity:    itemPayload.case_pack_quantity ?? 1,
    estimated_unit_cost:   unitCost,
    estimated_line_total:  lineTotal,
    urgency:               itemPayload.urgency ?? 'normal',
    reason:                itemPayload.reason ?? null,
    metadata:              itemPayload.metadata ?? {},
    created_at:            now(),
  }
  ITEM_STORE.set(item.po_item_id, item)

  po.estimated_total += lineTotal
  po.updated_at = now()
  PO_STORE.set(purchaseOrderId, po)

  return {
    ok: true, item,
    purchaseOrderId,
    estimatedTotal:   po.estimated_total,
    persistenceStatus: dbAvailable() ? 'database_required' : 'not_persisted',
  }
}

export function updatePurchaseOrderStatus(purchaseOrderId, updates = {}) {
  const po = PO_STORE.get(purchaseOrderId)
  if (!po) return { ok: false, error: 'purchase_order_not_found' }
  if (updates.approval_status) po.approval_status = updates.approval_status
  if (updates.submission_status) po.submission_status = updates.submission_status
  if (updates.approved_by) po.approved_by = updates.approved_by
  if (updates.approved_by_role) po.approved_by_role = updates.approved_by_role
  po.updated_at = now()
  PO_STORE.set(purchaseOrderId, po)
  return {
    ok: true, purchaseOrder: po,
    submissionStatus:  po.submission_status,
    approvalStatus:    po.approval_status,
    persistenceStatus: dbAvailable() ? 'database_required' : 'not_persisted',
  }
}

export function getPurchaseOrderReadiness(venueId) {
  const orders = listVenuePurchaseOrders(venueId).orders
  const pending  = orders.filter(o => o.approval_status === 'pending_manager_approval').length
  const approved = orders.filter(o => o.approval_status.startsWith('approved')).length
  const submitted = orders.filter(o => o.submission_status === 'reorder_submitted').length
  return {
    ok:               true,
    venueId,
    totalOrders:      orders.length,
    pendingApproval:  pending,
    approvedOrders:   approved,
    submittedOrders:  submitted,
    submissionStatus: 'reorder_not_submitted',
    approvalStatus:   'pending_manager_approval',
    persistenceStatus: dbAvailable() ? 'database_required' : 'not_persisted',
    note: 'Purchase orders require manager approval before submission to vendors.',
  }
}
