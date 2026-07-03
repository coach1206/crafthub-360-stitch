const dbAvailable = () => !!process.env.DATABASE_URL
const hasVendorCreds = () => !!process.env.VENDOR_API_KEY
const hasEmailChannel = () => !!(process.env.SMTP_HOST || process.env.SENDGRID_API_KEY)

export const REORDER_SUBMISSION_STATUSES = [
  'submission_gateway_ready','submission_gateway_blocked','live_vendor_submission_unavailable',
  'manual_export_available','email_submission_pending_setup','api_submission_pending_setup',
]

export function getReorderExternalSubmissionContext(venueId) {
  return {
    venueId,
    submissionGatewayStatus: 'submission_gateway_blocked',
    live_vendor_submission_unavailable: true,
    vendor_api_required: !hasVendorCreds(),
    emailFallbackAvailable: hasEmailChannel(),
    manualExportAvailable: true,
    databaseRequired: !dbAvailable(),
    reorder_not_submitted: true,
    purchase_order_not_submitted: true,
    canSubmitLive: false,
    autoApprovalDisabled: true,
    approvalRequired: true,
  }
}

export function validateReorderSubmissionReadiness(venueId) {
  const blockers = []
  if (!dbAvailable()) blockers.push('database_required')
  if (!hasVendorCreds()) blockers.push('vendor_api_required')
  return {
    venueId,
    canSubmitLive: false,
    blockers,
    blockerCount: blockers.length,
    submissionGatewayStatus: blockers.length > 0 ? 'submission_gateway_blocked' : 'live_vendor_submission_unavailable',
    emailFallbackAvailable: hasEmailChannel(),
    manualExportAvailable: true,
    reorder_not_submitted: true,
  }
}

export function routePurchaseOrderToSubmissionGateway(purchaseOrderId, actorContext) {
  return {
    purchaseOrderId,
    routed: false,
    status: 'live_vendor_submission_unavailable',
    reorder_not_submitted: true,
    purchase_order_not_submitted: true,
    canSubmitLive: false,
    actorRole: actorContext?.role,
    message: 'routed_to_submission_gateway · live_vendor_submission_unavailable',
  }
}

export function buildReorderSubmissionBlockedResponse(reason = '') {
  return {
    status: 'submission_gateway_blocked',
    reason,
    reorder_not_submitted: true,
    purchase_order_not_submitted: true,
    live_vendor_submission_unavailable: true,
    canSubmitLive: false,
    autoApprovalDisabled: true,
    approvalRequired: true,
  }
}

export function buildReorderExternalSubmissionReport(venueId) {
  return {
    venueId,
    context: getReorderExternalSubmissionContext(venueId),
    readiness: validateReorderSubmissionReadiness(venueId),
    submissionStatus: 'live_vendor_submission_unavailable',
    manual_export_available: true,
    email_submission_pending_setup: true,
    api_submission_pending_setup: true,
    reorder_not_submitted: true,
    canSubmitLive: false,
  }
}
