/**
 * Staff Approval Engine
 * Role-based action policy and manager approval flow.
 * Manager approval required for comp, void, refund, major discount, forced status override.
 */

import { v4 as uuidv4 } from 'uuid'

const APPROVAL_STORE = new Map()
const dbAvailable = () => !!process.env.DATABASE_URL
const now = () => new Date().toISOString()

const MANAGER_REQUIRED_ACTIONS = new Set([
  'request_comp', 'request_void', 'request_refund', 'request_discount',
  'force_close_table', 'override_order_status', 'override_payment_status',
])

const ROLE_PERMISSIONS = {
  manager:    new Set(['create_order','add_item','remove_item','update_quantity','assign_table','assign_section','transfer_table','request_comp','request_void','request_discount','request_refund','send_to_manual_pos360','request_staff_handoff','force_close_table','override_order_status']),
  server:     new Set(['create_order','add_item','remove_item','update_quantity','assign_table','assign_section','send_to_manual_pos360','request_staff_handoff']),
  bartender:  new Set(['create_order','add_item','remove_item','update_quantity','send_to_manual_pos360']),
  host:       new Set(['assign_table','assign_section','transfer_table']),
  cashier:    new Set(['create_order','add_item','remove_item','update_quantity','send_to_manual_pos360']),
}

export async function getStaffActionPolicy(venueId, staffRole, actionType) {
  let venuePolicy = null
  try {
    const { getVenueStaffPolicy } = await import('../venue/venueStaffPolicyEngine.js')
    venuePolicy = await getVenueStaffPolicy(venueId, staffRole)
  } catch { /* use defaults */ }

  const rolePerm = ROLE_PERMISSIONS[staffRole] ?? ROLE_PERMISSIONS.server
  const allowed = rolePerm.has(actionType)
  const requiresApproval = MANAGER_REQUIRED_ACTIONS.has(actionType) && staffRole !== 'manager'

  return {
    ok: true, venueId, staffRole, actionType,
    allowed,
    requiresManagerApproval: requiresApproval,
    policySource: venuePolicy ? 'venue_policy' : 'default_policy',
    policyStatus: 'staff_order_preview',
  }
}

export async function validateStaffAction(venueId, staffContext, actionType, payload = {}) {
  const policy = await getStaffActionPolicy(venueId, staffContext.role ?? 'server', actionType)
  if (!policy.allowed) return { ok: false, error: 'action_not_permitted', staffRole: staffContext.role, actionType }
  if (policy.requiresManagerApproval) return { ok: false, error: 'manager_approval_required', requiresManagerApproval: true, actionType }
  return { ok: true, actionType, staffRole: staffContext.role, actionStatus: 'staff_order_preview' }
}

export function requiresManagerApproval(actionType, payload = {}) {
  if (MANAGER_REQUIRED_ACTIONS.has(actionType)) return true
  if (payload.discountPercent > 15) return true
  if (payload.discountAmount > 2000) return true
  return false
}

export function createManagerApprovalRequest(payload = {}) {
  if (!payload.venue_id || !payload.approval_type) return { ok: false, error: 'venue_id and approval_type required' }
  const approvalRequestId = uuidv4()
  const request = {
    approval_request_id:    approvalRequestId,
    venue_id:               payload.venue_id,
    staff_order_session_id: payload.staff_order_session_id ?? null,
    order_id:               payload.order_id ?? null,
    requested_by_staff_id:  payload.requested_by_staff_id ?? null,
    approved_by_manager_id: null,
    approval_type:          payload.approval_type,
    approval_status:        'manager_approval_required',
    reason:                 payload.reason ?? null,
    metadata:               payload.metadata ?? {},
    created_at:             now(),
    updated_at:             now(),
  }
  APPROVAL_STORE.set(approvalRequestId, request)
  return {
    ok: true, approvalRequest: request,
    approvalStatus:    'manager_approval_required',
    persistenceStatus: dbAvailable() ? 'database_required' : 'not_persisted',
  }
}

export function getManagerApprovalRequests(venueId, filters = {}) {
  const requests = []
  for (const r of APPROVAL_STORE.values()) {
    if (r.venue_id !== venueId) continue
    if (filters.approval_status && r.approval_status !== filters.approval_status) continue
    requests.push(r)
  }
  return { ok: true, requests, count: requests.length, venueId }
}

export function approveManagerRequest(approvalRequestId, managerContext = {}) {
  const request = APPROVAL_STORE.get(approvalRequestId)
  if (!request) return { ok: false, approvalStatus: 'approval_not_found' }
  request.approval_status        = 'manager_approved_preview'
  request.approved_by_manager_id = managerContext.manager_id ?? null
  request.updated_at             = now()
  return { ok: true, approvalRequest: request, approvalStatus: 'manager_approved_preview', persistenceStatus: 'not_persisted' }
}

export function rejectManagerRequest(approvalRequestId, managerContext = {}) {
  const request = APPROVAL_STORE.get(approvalRequestId)
  if (!request) return { ok: false, approvalStatus: 'approval_not_found' }
  request.approval_status        = 'manager_rejected_preview'
  request.approved_by_manager_id = managerContext.manager_id ?? null
  request.updated_at             = now()
  return { ok: true, approvalRequest: request, approvalStatus: 'manager_rejected_preview', persistenceStatus: 'not_persisted' }
}

export function getApprovalReadiness(venueId) {
  return {
    ok:               true,
    venueId,
    approvalStatus:   'manager_approval_required',
    managerRequired:  true,
    approvalNote:     'Manager approval is required for comp, void, refund, and major discount actions.',
    persistenceStatus: dbAvailable() ? 'database_required' : 'not_persisted',
  }
}
