const dbAvailable = () => !!process.env.DATABASE_URL
const hasVendorCreds = () => !!process.env.VENDOR_API_KEY

export const CONNECTOR_TYPES = ['api','email','csv_export','pdf_export','manual_portal','phone_required','preview_only']
export const VENDOR_CONNECTION_STATUSES = [
  'connected','disconnected','credentials_required','vendor_approval_required',
  'unsupported_vendor','manual_only','api_required','preview_only','database_required',
]

export function getVendorConnectorStatus(venueId, vendorId) {
  return {
    venueId, vendorId,
    connectionStatus: hasVendorCreds() ? 'disconnected' : 'credentials_required',
    connectorType: 'preview_only',
    credentialStatus: hasVendorCreds() ? 'present' : 'missing',
    catalogSyncStatus: 'preview_only',
    orderSubmissionStatus: 'not_submitted',
    receivingSyncStatus: 'preview_only',
    vendor_api_required: !hasVendorCreds(),
    reorder_not_submitted: true,
    purchase_order_not_submitted: true,
    databaseRequired: !dbAvailable(),
    degradedMode: !dbAvailable(),
    canSubmitLive: false,
    autoApprovalDisabled: true,
  }
}

export function getDistributorConnectorStatus(venueId, distributorId) {
  return {
    venueId, distributorId,
    connectionStatus: 'credentials_required',
    connectorType: 'preview_only',
    distributor_connection_required: !process.env.DISTRIBUTOR_API_KEY,
    reorder_not_submitted: true,
    purchase_order_not_submitted: true,
    databaseRequired: !dbAvailable(),
    valueExposed: false,
  }
}

export function getManufacturerConnectorStatus(venueId, manufacturerId) {
  return {
    venueId, manufacturerId,
    connectionStatus: 'credentials_required',
    connectorType: 'preview_only',
    manufacturer_connection_required: !process.env.MANUFACTURER_API_KEY,
    reorder_not_submitted: true,
    purchase_order_not_submitted: true,
    databaseRequired: !dbAvailable(),
    valueExposed: false,
  }
}

export function validateVendorCredentials(vendorId) {
  return {
    vendorId,
    valid: hasVendorCreds(),
    status: hasVendorCreds() ? 'present' : 'vendor_credentials_required',
    vendor_credentials_required: !hasVendorCreds(),
    valueExposed: false,
  }
}

export function listSupportedVendorConnectorTypes() {
  return {
    connectorTypes: CONNECTOR_TYPES,
    activeConnectors: [],
    liveConnectorCount: 0,
    vendor_api_required: true,
    message: 'no_vendor_api_configured · manual and email channels available as fallback',
  }
}

export function getVendorConnectorCapabilities(connectorType) {
  return {
    connectorType,
    catalogSync: connectorType === 'api' ? 'api_required' : 'manual',
    orderSubmission: connectorType === 'email' ? 'email_submission_pending_setup' : (connectorType === 'api' ? 'api_submission_pending_setup' : 'preview_only'),
    receivingSync: 'preview_only',
    live: false,
    previewOnly: true,
  }
}

export function syncVendorCatalogPreview(vendorId, connectorType) {
  return {
    vendorId, connectorType,
    status: 'preview_only',
    catalogSynced: false,
    itemsSynced: 0,
    vendor_api_required: !hasVendorCreds(),
    external_sync_not_live: true,
    message: 'vendor_catalog_sync_preview_only · no live vendor api',
  }
}

export function checkVendorProductAvailabilityPreview(vendorId, productIds) {
  return {
    vendorId,
    status: 'preview_only',
    availabilityChecked: false,
    productCount: productIds?.length ?? 0,
    vendor_api_required: !hasVendorCreds(),
    message: 'vendor_product_availability_preview_only',
  }
}

export function submitPurchaseOrderPreview(purchaseOrderId, vendorId) {
  return {
    purchaseOrderId, vendorId,
    status: 'not_submitted',
    purchase_order_not_submitted: true,
    reorder_not_submitted: true,
    vendor_api_required: !hasVendorCreds(),
    canSubmitLive: false,
    autoApprovalDisabled: true,
    approvalRequired: true,
    message: 'purchase_order_submission_preview_only',
  }
}

export function submitPurchaseOrderViaEmailPreview(purchaseOrderId, vendorId) {
  const emailReady = !!(process.env.SMTP_HOST || process.env.SENDGRID_API_KEY)
  return {
    purchaseOrderId, vendorId,
    status: emailReady ? 'email_submission_pending_setup' : 'email_channel_required',
    purchase_order_not_submitted: true,
    emailChannelReady: emailReady,
    message: emailReady ? 'email_channel_configured · submission_preview_only' : 'email_channel_required',
  }
}

export function exportPurchaseOrderCSVPreview(purchaseOrderId) {
  return {
    purchaseOrderId,
    status: 'preview_only',
    format: 'csv',
    exported: false,
    manual_export_required: true,
    message: 'csv_export_preview · manual submission required',
  }
}

export function exportPurchaseOrderPDFPreview(purchaseOrderId) {
  return {
    purchaseOrderId,
    status: 'preview_only',
    format: 'pdf',
    exported: false,
    manual_export_required: true,
    message: 'pdf_export_preview · manual submission required',
  }
}

export function buildVendorAPIRequiredResponse(context = '') {
  return {
    status: 'vendor_api_required',
    context,
    vendor_api_required: true,
    vendor_credentials_required: !hasVendorCreds(),
    reorder_not_submitted: true,
    purchase_order_not_submitted: true,
    databaseRequired: !dbAvailable(),
  }
}

export function buildDistributorRequiredResponse(context = '') {
  return {
    status: 'distributor_connection_required',
    context,
    distributor_connection_required: true,
    reorder_not_submitted: true,
  }
}

export function buildManufacturerRequiredResponse(context = '') {
  return {
    status: 'manufacturer_connection_required',
    context,
    manufacturer_connection_required: true,
    reorder_not_submitted: true,
  }
}

export function buildPurchaseOrderNotSubmittedResponse(context = '') {
  return {
    status: 'not_submitted',
    context,
    purchase_order_not_submitted: true,
    reorder_not_submitted: true,
    autoApprovalDisabled: true,
    approvalRequired: true,
    vendor_api_required: !hasVendorCreds(),
    databaseRequired: !dbAvailable(),
    canSubmitLive: false,
  }
}
