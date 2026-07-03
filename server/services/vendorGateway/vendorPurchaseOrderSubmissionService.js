const dbAvailable = () => !!process.env.DATABASE_URL
const hasVendorCreds = () => !!process.env.VENDOR_API_KEY
const hasEmailChannel = () => !!(process.env.SMTP_HOST || process.env.SENDGRID_API_KEY)

export function getSubmissionReadiness(vendorId) {
  return {
    vendorId,
    canSubmitLive: false,
    submissionStatus: 'not_submitted',
    vendor_api_required: !hasVendorCreds(),
    emailFallbackAvailable: hasEmailChannel(),
    databaseRequired: !dbAvailable(),
    reorder_not_submitted: true,
    purchase_order_not_submitted: true,
    autoApprovalDisabled: true,
    approvalRequired: true,
  }
}

export function submitViaAPIPreview(purchaseOrderId, vendorId) {
  return {
    purchaseOrderId, vendorId,
    status: 'not_submitted',
    vendor_api_required: !hasVendorCreds(),
    submissionMethod: 'api_submission_pending_setup',
    purchase_order_not_submitted: true,
    message: 'vendor_api_submission_preview_only',
  }
}

export function submitViaEmailPreview(purchaseOrderId, vendorId) {
  const emailReady = hasEmailChannel()
  return {
    purchaseOrderId, vendorId,
    status: emailReady ? 'email_submission_pending_setup' : 'email_channel_required',
    emailChannelReady: emailReady,
    submissionMethod: 'email',
    purchase_order_not_submitted: true,
    message: emailReady ? 'email_channel_configured · submission_preview_only' : 'email_channel_required',
  }
}

export function exportOrderCSVPreview(purchaseOrderId) {
  return {
    purchaseOrderId,
    status: 'preview_only',
    format: 'csv',
    exported: false,
    manual_export_required: true,
    message: 'csv_export_preview · manual submission required',
  }
}

export function exportOrderPDFPreview(purchaseOrderId) {
  return {
    purchaseOrderId,
    status: 'preview_only',
    format: 'pdf',
    exported: false,
    manual_export_required: true,
    message: 'pdf_export_preview · manual submission required',
  }
}
