/**
 * POS360 Approval Flow Engine — Phase 4.13, Part 1.
 *
 * Approval flow is local/demo until backend authorization persistence is
 * connected. All requests live in localStorage under `pos3:approvalRequests`
 * via the shared opsStorage helpers — there is no server-side enforcement,
 * so a determined client could bypass these checks. This module exists to
 * make the *UI* path honest and consistent, not to provide real security.
 */

import { opsGet, opsSet } from '../shared/opsStorage.js'
import { emit, SYSTEMS, STATUS } from '../shared/opsEventBus.js'
import { recordAuditEvent } from './auditLogService.js'

export const APPROVAL_HONESTY_NOTICE =
  'Approval flow is local/demo until backend authorization persistence is connected.'

const STORAGE_KEY = 'pos3:approvalRequests'

export const APPROVAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  DENIED: 'denied',
  CANCELED: 'canceled',
}

export const ACTION_TYPES = {
  VOID_ITEM: 'void_item',
  COMP_ITEM: 'comp_item',
  REFUND: 'refund',
  DISCOUNT: 'discount',
  TABLE_MERGE: 'table_merge',
  CHECK_TRANSFER: 'check_transfer',
  SPLIT_CHECK: 'split_check',
  CASH_DRAWER_ADJUSTMENT: 'cash_drawer_adjustment',
  INVENTORY_ADJUSTMENT: 'inventory_adjustment',
  SHIFT_CLOSE: 'shift_close',
  FLOOR_LAYOUT_EDIT: 'floor_layout_edit',
}

// Which role is required to approve each action type. A role of null means
// "no approval required" (action proceeds directly).
const APPROVAL_REQUIRED_ROLE = {
  [ACTION_TYPES.VOID_ITEM]: 'manager',
  [ACTION_TYPES.COMP_ITEM]: 'manager',
  [ACTION_TYPES.REFUND]: 'manager',
  [ACTION_TYPES.DISCOUNT]: 'manager',
  [ACTION_TYPES.TABLE_MERGE]: 'manager',
  [ACTION_TYPES.CHECK_TRANSFER]: 'manager',
  [ACTION_TYPES.SPLIT_CHECK]: null,
  [ACTION_TYPES.CASH_DRAWER_ADJUSTMENT]: 'manager',
  [ACTION_TYPES.INVENTORY_ADJUSTMENT]: 'manager',
  [ACTION_TYPES.SHIFT_CLOSE]: 'manager',
  [ACTION_TYPES.FLOOR_LAYOUT_EDIT]: 'manager',
}

// Roles that, regardless of action, may approve anything (full access tier).
const ALWAYS_CAN_APPROVE = new Set(['owner', 'venue_admin', 'manager'])

function uid() {
  return `appr_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function read() { return opsGet(STORAGE_KEY, []) }
function write(list) { opsSet(STORAGE_KEY, list); return list }

/** Returns the role required to approve `actionType`, or null if no approval is needed. */
export function requiresApproval(actionType, requestedByRole) {
  const requiredRole = APPROVAL_REQUIRED_ROLE[actionType] ?? null
  if (!requiredRole) return null
  // A requester who already holds the required role (or higher) can act directly.
  if (ALWAYS_CAN_APPROVE.has(requestedByRole)) return null
  return requiredRole
}

/** Returns true if `approverRole` may approve a request that requires `requiredRole`, and the approver isn't the requester. */
export function canApproveAction(approverRole, requiredRole, { approverId, requestedBy } = {}) {
  if (approverId && requestedBy && approverId === requestedBy) return false
  if (!requiredRole) return true
  return ALWAYS_CAN_APPROVE.has(approverRole)
}

/**
 * Creates a pending approval request. If the requester's role already
 * satisfies the required role for this action, returns an already-approved
 * "self-approved" record instead (no approval bottleneck for managers).
 */
export function createApprovalRequest({
  actionType,
  requestedBy,
  requestedByRole,
  reason = '',
  targetType = null,
  targetId = null,
  amount = null,
} = {}) {
  const requiredRole = requiresApproval(actionType, requestedByRole)
  const list = read()

  const request = {
    id: uid(),
    actionType,
    requestedBy,
    requestedByRole,
    requiredRole,
    status: requiredRole ? APPROVAL_STATUS.PENDING : APPROVAL_STATUS.APPROVED,
    reason,
    targetType,
    targetId,
    amount,
    createdAt: Date.now(),
    approvedBy: requiredRole ? null : requestedBy,
    approvedAt: requiredRole ? null : Date.now(),
    deniedBy: null,
    deniedAt: null,
    notes: requiredRole ? '' : 'Auto-approved: requester role already meets requirement.',
  }

  list.push(request)
  write(list)

  recordAuditEvent({
    eventType: 'approval_requested',
    actorId: requestedBy,
    actorRole: requestedByRole,
    targetType,
    targetId,
    summary: `${requestedByRole || 'staff'} requested ${actionType}${reason ? ` — ${reason}` : ''}`,
    metadata: { actionType, requiredRole, amount, requestId: request.id },
  })

  emit({
    sourceSystem: SYSTEMS.POS3,
    targetSystem: SYSTEMS.POS3,
    eventType: 'POS_APPROVAL_REQUESTED',
    commandType: 'POS_APPROVAL_REQUESTED',
    staffId: requestedBy,
    status: request.status === APPROVAL_STATUS.APPROVED ? STATUS.COMPLETED : STATUS.PENDING,
    payload: { request },
  })

  return request
}

export function approveRequest(requestId, { approvedBy, approverRole, notes = '' } = {}) {
  const list = read()
  const idx = list.findIndex((r) => r.id === requestId)
  if (idx === -1) return null
  const req = list[idx]
  if (req.status !== APPROVAL_STATUS.PENDING) return req
  if (!canApproveAction(approverRole, req.requiredRole, { approverId: approvedBy, requestedBy: req.requestedBy })) {
    return req
  }

  const updated = { ...req, status: APPROVAL_STATUS.APPROVED, approvedBy, approvedAt: Date.now(), notes }
  list[idx] = updated
  write(list)

  recordAuditEvent({
    eventType: 'approval_approved',
    actorId: approvedBy,
    actorRole: approverRole,
    targetType: req.targetType,
    targetId: req.targetId,
    summary: `${approverRole || 'manager'} approved ${req.actionType} requested by ${req.requestedBy}`,
    metadata: { requestId, actionType: req.actionType },
  })

  emit({
    sourceSystem: SYSTEMS.POS3,
    targetSystem: SYSTEMS.POS3,
    eventType: 'POS_APPROVAL_RESOLVED',
    commandType: 'POS_APPROVAL_RESOLVED',
    staffId: approvedBy,
    status: STATUS.COMPLETED,
    payload: { request: updated },
  })

  return updated
}

export function denyRequest(requestId, { deniedBy, approverRole, notes = '' } = {}) {
  const list = read()
  const idx = list.findIndex((r) => r.id === requestId)
  if (idx === -1) return null
  const req = list[idx]
  if (req.status !== APPROVAL_STATUS.PENDING) return req

  const updated = { ...req, status: APPROVAL_STATUS.DENIED, deniedBy, deniedAt: Date.now(), notes }
  list[idx] = updated
  write(list)

  recordAuditEvent({
    eventType: 'approval_denied',
    actorId: deniedBy,
    actorRole: approverRole,
    targetType: req.targetType,
    targetId: req.targetId,
    summary: `${approverRole || 'manager'} denied ${req.actionType} requested by ${req.requestedBy}`,
    metadata: { requestId, actionType: req.actionType },
  })

  emit({
    sourceSystem: SYSTEMS.POS3,
    targetSystem: SYSTEMS.POS3,
    eventType: 'POS_APPROVAL_RESOLVED',
    commandType: 'POS_APPROVAL_RESOLVED',
    staffId: deniedBy,
    status: STATUS.FAILED,
    payload: { request: updated },
  })

  return updated
}

export function cancelApprovalRequest(requestId, { canceledBy } = {}) {
  const list = read()
  const idx = list.findIndex((r) => r.id === requestId)
  if (idx === -1) return null
  const req = list[idx]
  if (req.status !== APPROVAL_STATUS.PENDING) return req
  const updated = { ...req, status: APPROVAL_STATUS.CANCELED, notes: `Canceled by ${canceledBy || 'requester'}` }
  list[idx] = updated
  write(list)
  return updated
}

export function getPendingApprovals() {
  return read().filter((r) => r.status === APPROVAL_STATUS.PENDING)
}

export function getAllApprovalRequests() {
  return read()
}
