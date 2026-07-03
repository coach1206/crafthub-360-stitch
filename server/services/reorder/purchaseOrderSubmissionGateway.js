const dbAvailable = () => !!process.env.DATABASE_URL
const hasVendorCreds = () => !!process.env.VENDOR_API_KEY
const hasEmailChannel = () => !!(process.env.SMTP_HOST || process.env.SENDGRID_API_KEY)

const ALLOWED_SUBMISSION_ROLES = new Set(['owner', 'admin', 'manager'])
const BLOCKED_SUBMISSION_ROLES = new Set(['guest','customer','server','bartender','kitchen_staff','humidor_staff','cashier','host','busser'])

export const SUBMISSION_STATUSES = [
  'submitted','not_submitted','submission_blocked','pending_approval','approval_required',
  'vendor_api_required','distributor_connection_required','manufacturer_connection_required',
  'email_channel_required','manual_export_required','database_required','preview_only',
]

export function validatePurchaseOrderForSubmission(po) {
  const errors = []
  if (!po) { errors.push('purchase_order_not_found'); return { valid: false, errors } }
  if (!po.purchaseOrderId) errors.push('purchase_order_id_required')
  if (!po.venueId) errors.push('venue_id_required')
  if (!po.vendorId) errors.push('vendor_id_required')
  return { valid: errors.length === 0, errors, status: errors.length === 0 ? 'valid' : 'validation_failed' }
}

export function validatePurchaseOrderApprovalGate(po) {
  if (!po) return { approved: false, status: 'purchase_order_not_found' }
  if (po.approvalStatus !== 'approved') {
    return { approved: false, status: 'approval_required', approvalStatus: po.approvalStatus ?? 'pending_approval', autoApprovalDisabled: true }
  }
  return { approved: true, status: 'approved' }
}

export function validatePurchaseOrderActorRole(actorRole) {
  if (BLOCKED_SUBMISSION_ROLES.has(actorRole)) {
    return { allowed: false, status: 'submission_blocked', actorRole, requiredRoles: [...ALLOWED_SUBMISSION_ROLES], reason: 'role_insufficient' }
  }
  if (!ALLOWED_SUBMISSION_ROLES.has(actorRole)) {
    return { allowed: false, status: 'submission_blocked', actorRole, reason: 'unknown_role' }
  }
  return { allowed: true, actorRole, status: 'role_allowed' }
}

export function getPurchaseOrderSubmissionMethod() {
  if (hasVendorCreds()) return { method: 'api_submission_pending_setup', live: false }
  if (hasEmailChannel()) return { method: 'email', live: false, status: 'email_submission_pending_setup' }
  return { method: 'manual_export_required', live: false, status: 'manual_export_required' }
}

export function getPurchaseOrderSubmissionReadiness(venueId) {
  return {
    venueId,
    canSubmitLive: false,
    databaseRequired: !dbAvailable(),
    vendor_api_required: !hasVendorCreds(),
    emailFallbackAvailable: hasEmailChannel(),
    manualExportAvailable: true,
    submissionStatus: 'not_submitted',
    reorder_not_submitted: true,
    purchase_order_not_submitted: true,
    autoApprovalDisabled: true,
    approvalRequired: true,
    allowedSubmissionRoles: [...ALLOWED_SUBMISSION_ROLES],
    blockedSubmissionRoles: [...BLOCKED_SUBMISSION_ROLES],
  }
}

export function submitPurchaseOrderThroughGateway(po, actorContext) {
  const roleCheck = validatePurchaseOrderActorRole(actorContext?.role)
  if (!roleCheck.allowed) return buildPurchaseOrderNotSubmittedResponse('role_insufficient')
  const approvalCheck = validatePurchaseOrderApprovalGate(po)
  if (!approvalCheck.approved) return buildPurchaseOrderNotSubmittedResponse('approval_required')
  if (!dbAvailable()) return buildPurchaseOrderNotSubmittedResponse('database_required')
  return submitPurchaseOrderPreviewOnly(po?.purchaseOrderId)
}

export function submitPurchaseOrderPreviewOnly(purchaseOrderId) {
  return {
    purchaseOrderId,
    status: 'not_submitted',
    purchase_order_not_submitted: true,
    reorder_not_submitted: true,
    canSubmitLive: false,
    vendor_api_required: !hasVendorCreds(),
    submissionMethod: getPurchaseOrderSubmissionMethod().method,
    message: 'purchase_order_submission_preview_only · no live vendor connection',
  }
}

export function markPurchaseOrderSubmissionAttempt(purchaseOrderId, actorContext) {
  return {
    purchaseOrderId,
    attemptRecorded: dbAvailable(),
    databaseRequired: !dbAvailable(),
    actorRole: actorContext?.role,
    status: 'submission_attempt_recorded_preview',
  }
}

export function markPurchaseOrderSubmissionBlocked(purchaseOrderId, reason) {
  return {
    purchaseOrderId,
    status: 'submission_blocked',
    reason,
    purchase_order_not_submitted: true,
    blockedAt: new Date().toISOString(),
  }
}

export function markPurchaseOrderSubmittedIfLive(purchaseOrderId) {
  return {
    purchaseOrderId,
    status: 'not_submitted',
    purchase_order_not_submitted: true,
    message: 'no live submission method configured',
    canSubmitLive: false,
  }
}

export function buildPurchaseOrderSubmissionReadiness(venueId) {
  return getPurchaseOrderSubmissionReadiness(venueId)
}

export function buildPurchaseOrderNotSubmittedResponse(reason = '') {
  return {
    status: 'not_submitted',
    reason,
    purchase_order_not_submitted: true,
    reorder_not_submitted: true,
    autoApprovalDisabled: true,
    approvalRequired: true,
    vendor_api_required: !hasVendorCreds(),
    databaseRequired: !dbAvailable(),
    canSubmitLive: false,
  }
}

export function buildLOCCPurchaseOrderSubmissionSummary(venueId) {
  return {
    venueId,
    submissionReadiness: getPurchaseOrderSubmissionReadiness(venueId),
    canSubmitLive: false,
    purchase_order_not_submitted: true,
    reorder_not_submitted: true,
    autoApprovalDisabled: true,
  }
}
