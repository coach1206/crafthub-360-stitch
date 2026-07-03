/**
 * DMRC — Reorder Approval Service
 * Only manager, owner, and admin roles may approve or reject purchase orders.
 * No auto-purchasing. Approval is a prerequisite for submission.
 */

import { updatePurchaseOrderStatus, getPurchaseOrderDraft } from './purchaseOrderDraftService.js'
import { updateRecommendationStatus } from './reorderRecommendationEngine.js'

const APPROVAL_ROLES = new Set(['manager', 'owner', 'admin'])
const dbAvailable = () => !!process.env.DATABASE_URL

export function validateApprovalRole(actorRole) {
  const allowed = APPROVAL_ROLES.has(actorRole)
  return {
    allowed,
    actorRole,
    requiredRoles:  [...APPROVAL_ROLES],
    approvalStatus: allowed ? 'approval_role_valid' : 'approval_role_insufficient',
    error:          allowed ? null : `Role '${actorRole}' cannot approve purchase orders. Required: manager, owner, or admin.`,
  }
}

export function approvePurchaseOrder(purchaseOrderId, actorContext = {}) {
  const roleCheck = validateApprovalRole(actorContext.role ?? 'unknown')
  if (!roleCheck.allowed) {
    return {
      ok: false,
      error:          roleCheck.error,
      approvalStatus: 'approval_role_insufficient',
      submissionStatus: 'reorder_not_submitted',
    }
  }

  const poResult = getPurchaseOrderDraft(purchaseOrderId)
  if (!poResult.ok) return { ok: false, error: poResult.error }

  const approvalStatus = actorContext.role === 'owner' ? 'approved_by_owner' : 'approved_by_manager'
  const result = updatePurchaseOrderStatus(purchaseOrderId, {
    approval_status:  approvalStatus,
    approved_by:      actorContext.actor_id ?? null,
    approved_by_role: actorContext.role,
  })

  return {
    ok: true,
    purchaseOrder:    result.purchaseOrder,
    approvalStatus:   approvalStatus,
    submissionStatus: 'reorder_not_submitted',
    note:             'Purchase order approved. Submission to vendor still requires explicit action.',
    persistenceStatus: dbAvailable() ? 'database_required' : 'not_persisted',
  }
}

export function rejectPurchaseOrder(purchaseOrderId, actorContext = {}, rejectionReason = '') {
  const roleCheck = validateApprovalRole(actorContext.role ?? 'unknown')
  if (!roleCheck.allowed) {
    return {
      ok: false,
      error:          roleCheck.error,
      approvalStatus: 'approval_role_insufficient',
    }
  }

  const rejectedStatus = actorContext.role === 'owner' ? 'rejected_by_owner' : 'rejected_by_manager'
  const result = updatePurchaseOrderStatus(purchaseOrderId, {
    approval_status:  rejectedStatus,
    approved_by:      actorContext.actor_id ?? null,
    approved_by_role: actorContext.role,
  })

  if (!result.ok) return result

  return {
    ok: true,
    purchaseOrder:    result.purchaseOrder,
    approvalStatus:   rejectedStatus,
    submissionStatus: 'reorder_not_submitted',
    rejectionReason:  rejectionReason || null,
    persistenceStatus: dbAvailable() ? 'database_required' : 'not_persisted',
  }
}

export function getApprovalReadiness(venueId) {
  return {
    ok:             true,
    venueId,
    approvalStatus: 'pending_manager_approval',
    requiredRoles:  [...APPROVAL_ROLES],
    submissionStatus: 'reorder_not_submitted',
    persistenceStatus: dbAvailable() ? 'database_required' : 'not_persisted',
    note: 'Reorder approval requires manager, owner, or admin role. No automatic purchasing.',
  }
}
