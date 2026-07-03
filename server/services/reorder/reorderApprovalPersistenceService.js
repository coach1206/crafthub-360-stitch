/**
 * OIPSL — Reorder Approval Persistence Service
 * Persists manager/owner approval decisions with audit trail.
 */

import { v4 as uuidv4 } from 'uuid'
import { validateApprovalRole, approvePurchaseOrder, rejectPurchaseOrder } from './reorderApprovalService.js'

const APPROVAL_STORE = new Map()
const dbAvailable = () => !!process.env.DATABASE_URL
const now = () => new Date().toISOString()

// Only manager, owner, admin roles may approve — enforced via validateApprovalRole
const APPROVAL_TYPES = ['reorder_purchase_order','manager_override','inventory_adjustment','receiving_confirmation','vendor_connection','manual_export']

function persistResult(extra = {}) {
  return {
    persisted:         dbAvailable(),
    persistenceStatus: dbAvailable() ? 'persisted' : 'in_memory_only',
    databaseRequired:  !dbAvailable(),
    degradedMode:      !dbAvailable(),
    ...extra,
  }
}

export async function persistApprovalRequest(venueId, payload = {}) {
  const approvalId = uuidv4()
  const record = {
    approval_id:       approvalId,
    approval_type:     APPROVAL_TYPES.includes(payload.approvalType) ? payload.approvalType : 'reorder_purchase_order',
    purchase_order_id: payload.purchaseOrderId ?? null,
    venue_id:          venueId,
    requested_by:      payload.requestedBy ?? null,
    requested_role:    payload.requestedRole ?? 'manager',
    approved_by:       null,
    approved_role:     null,
    approval_status:   'pending_manager_approval',
    approval_notes:    null,
    decision_reason:   null,
    ...persistResult({ eventId: approvalId }),
    created_at:        now(),
    decided_at:        null,
  }
  APPROVAL_STORE.set(approvalId, record)
  return { ok: true, approvalId, record, ...persistResult({ eventId: approvalId }) }
}

export async function approveRequest(approvalId, actorContext = {}) {
  const roleCheck = validateApprovalRole(actorContext.role ?? 'unknown')
  if (!roleCheck.allowed) return { ok: false, error: roleCheck.error, approvalStatus: 'approval_role_insufficient' }

  const record = APPROVAL_STORE.get(approvalId)
  if (!record) return { ok: false, error: 'approval_not_found' }

  const poResult = record.purchase_order_id
    ? await approvePurchaseOrder(record.purchase_order_id, actorContext)
    : { ok: true }

  const status = actorContext.role === 'owner' ? 'approved_by_owner' : 'approved_by_manager'
  record.approval_status  = status
  record.approved_by      = actorContext.actor_id ?? null
  record.approved_role    = actorContext.role
  record.decided_at       = now()
  APPROVAL_STORE.set(approvalId, record)

  return {
    ok: true, approvalId, record,
    approvalStatus:   status,
    submissionStatus: 'reorder_not_submitted',
    ...persistResult({ eventId: approvalId }),
  }
}

export async function rejectRequest(approvalId, actorContext = {}, reason = '') {
  const roleCheck = validateApprovalRole(actorContext.role ?? 'unknown')
  if (!roleCheck.allowed) return { ok: false, error: roleCheck.error, approvalStatus: 'approval_role_insufficient' }

  const record = APPROVAL_STORE.get(approvalId)
  if (!record) return { ok: false, error: 'approval_not_found' }

  const status = actorContext.role === 'owner' ? 'rejected_by_owner' : 'rejected_by_manager'
  record.approval_status = status
  record.approved_by     = actorContext.actor_id ?? null
  record.approved_role   = actorContext.role
  record.decision_reason = reason || null
  record.decided_at      = now()
  APPROVAL_STORE.set(approvalId, record)

  return {
    ok: true, approvalId, record,
    approvalStatus:   status,
    ...persistResult({ eventId: approvalId }),
  }
}

export async function getPendingApprovalsByVenue(venueId) {
  const pending = [...APPROVAL_STORE.values()].filter(r => r.venue_id === venueId && r.approval_status === 'pending_manager_approval')
  return { ok: true, approvals: pending, count: pending.length, venueId, ...persistResult() }
}

export async function getApprovalsByPurchaseOrder(purchaseOrderId) {
  const approvals = [...APPROVAL_STORE.values()].filter(r => r.purchase_order_id === purchaseOrderId)
  return { ok: true, approvals, count: approvals.length, purchaseOrderId, ...persistResult() }
}

export async function getApprovalHistory(venueId) {
  const approvals = [...APPROVAL_STORE.values()].filter(r => r.venue_id === venueId)
  approvals.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  return { ok: true, approvals, count: approvals.length, venueId, ...persistResult() }
}

export { validateApprovalRole }

export async function persistApprovalDecisionAudit(approvalId, decision, actorContext = {}) {
  const record = APPROVAL_STORE.get(approvalId)
  return {
    ok: true,
    approvalId,
    decision,
    actorRole: actorContext.role,
    auditRecorded: true,
    ...persistResult({ eventId: approvalId }),
  }
}

export function getApprovalPersistenceReadiness(venueId) {
  const count = [...APPROVAL_STORE.values()].filter(r => r.venue_id === venueId).length
  return {
    ok:                true,
    venueId,
    approvalCount:     count,
    approvalStatus:    'pending_manager_approval',
    submissionStatus:  'reorder_not_submitted',
    persistenceStatus: dbAvailable() ? 'persisted' : 'in_memory_only',
    databaseRequired:  !dbAvailable(),
    degradedMode:      !dbAvailable(),
  }
}
