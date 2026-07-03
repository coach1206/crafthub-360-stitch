/**
 * LOCC — Pending Approvals Queue Service
 * Surfaces pending purchase order approvals and reorder approval requests.
 */

import { v4 as uuidv4 } from 'uuid'
import { assertManagerRole, assertOwnerRole } from './roleSafetyGateway.js'

const dbAvailable = () => !!process.env.DATABASE_URL
const now = () => new Date().toISOString()

export function getPendingApprovalsReadiness(venueId) {
  return {
    ok:               true,
    venueId,
    persistenceMode:  dbAvailable() ? 'real_database' : 'in_memory_only',
    degradedMode:     !dbAvailable(),
    databaseRequired: !dbAvailable(),
    approvalGateActive: true,
    autoApprovalDisabled: true,
    note: 'All reorder approvals require explicit manager, owner, or admin decision. No auto-approval.',
  }
}

export async function getPendingApprovalQueue(venueId, actorContext = {}) {
  const blocked = assertManagerRole(actorContext.role, 'view_pending_approvals')
  if (blocked) return blocked
  try {
    const { getPendingApprovalsByVenue } = await import('../reorder/reorderApprovalPersistenceService.js')
    const result = await getPendingApprovalsByVenue(venueId)
    return {
      ok:              true,
      venueId,
      approvals:       result.approvals ?? [],
      count:           result.count ?? 0,
      persistenceMode: dbAvailable() ? 'real_database' : 'in_memory_only',
      degradedMode:    !dbAvailable(),
      autoApprovalDisabled: true,
      timestamp:       now(),
    }
  } catch {
    return { ok: false, status: 'approval_service_unavailable', approvals: [], degradedMode: true }
  }
}

export async function getPendingPurchaseOrderApprovals(venueId, actorContext = {}) {
  const blocked = assertManagerRole(actorContext.role, 'view_po_approvals')
  if (blocked) return blocked
  try {
    const { getPendingPurchaseOrderApprovals: getApprovals } = await import('../reorder/purchaseOrderPersistenceService.js')
    const result = await getApprovals(venueId)
    return {
      ok:              true,
      venueId,
      purchaseOrders:  result.purchaseOrders ?? [],
      count:           result.count ?? 0,
      reorderNotSubmitted: true,
      vendorApiRequired:   true,
      note:            'Pending POs await manager/owner approval. No auto-submission.',
      degradedMode:    !dbAvailable(),
      timestamp:       now(),
    }
  } catch {
    return { ok: false, status: 'po_service_unavailable', purchaseOrders: [], degradedMode: true }
  }
}

export async function approvePendingPurchaseOrder(purchaseOrderId, actorContext = {}) {
  const blocked = assertManagerRole(actorContext.role, 'approve_purchase_order')
  if (blocked) return blocked
  try {
    const { markPurchaseOrderApproved } = await import('../reorder/purchaseOrderPersistenceService.js')
    const result = await markPurchaseOrderApproved(purchaseOrderId, actorContext)
    return {
      ...result,
      reorderNotSubmitted: true,
      vendorApiRequired:   true,
      note: 'PO approved. Submission requires live vendor API connection (not yet active).',
    }
  } catch {
    return { ok: false, status: 'approval_failed', purchaseOrderId, degradedMode: true }
  }
}

export async function rejectPendingPurchaseOrder(purchaseOrderId, reason, actorContext = {}) {
  const blocked = assertManagerRole(actorContext.role, 'reject_purchase_order')
  if (blocked) return blocked
  try {
    const { markPurchaseOrderRejected } = await import('../reorder/purchaseOrderPersistenceService.js')
    return await markPurchaseOrderRejected(purchaseOrderId, actorContext)
  } catch {
    return { ok: false, status: 'rejection_failed', purchaseOrderId, degradedMode: true }
  }
}

export async function escalateApprovalToOwner(approvalId, actorContext = {}) {
  const blocked = assertManagerRole(actorContext.role, 'escalate_approval')
  if (blocked) return blocked
  return {
    ok: true, approvalId,
    status: 'escalated_to_owner',
    escalatedBy: actorContext.actorId,
    escalatedRole: actorContext.role,
    requiredRole: 'owner',
    note: 'Approval escalated to owner for decision.',
    timestamp: now(),
  }
}

export function buildApprovalQueueSummary(venueId) {
  return {
    ok:                   true,
    venueId,
    approvalQueueActive:  true,
    autoApprovalDisabled: true,
    approvalRolesAllowed: ['manager', 'owner', 'admin'],
    approvalRolesBlocked: ['guest','customer','server','bartender','kitchen_staff','humidor_staff'],
    reorderNotSubmitted:  true,
    vendorApiRequired:    true,
    persistenceMode:      dbAvailable() ? 'real_database' : 'in_memory_only',
    degradedMode:         !dbAvailable(),
  }
}
