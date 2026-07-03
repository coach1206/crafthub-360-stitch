const dbAvailable = () => !!process.env.DATABASE_URL

export function getLOCCExternalOpsSummary(venueId) {
  return {
    venueId,
    externalSyncNotLive: true,
    external_sync_not_live: true,
    real_time_push_pending: true,
    canSubmitLive: false,
    reorder_not_submitted: true,
    purchase_order_not_submitted: true,
    externalPOSReady: false,
    vendorGatewayReady: false,
    distributorReady: false,
    manufacturerReady: false,
    syncConsumerReady: false,
    availabilityPushReady: false,
    autoApprovalDisabled: true,
    databaseRequired: !dbAvailable(),
  }
}

export function getLOCCExternalPOSSummary(venueId) {
  return {
    venueId,
    external_pos_required: !process.env.EXTERNAL_POS_API_KEY,
    external_sync_not_live: true,
    posProductMappingRequired: true,
    pos_product_mapping_required: true,
    posSyncStatus: 'sync_not_live',
    real_time_push_pending: true,
  }
}

export function getLOCCVendorGatewaySummary(venueId) {
  return {
    venueId,
    vendor_api_required: !process.env.VENDOR_API_KEY,
    distributor_connection_required: !process.env.DISTRIBUTOR_API_KEY,
    manufacturer_connection_required: !process.env.MANUFACTURER_API_KEY,
    reorder_not_submitted: true,
    purchase_order_not_submitted: true,
    catalogSyncStatus: 'preview_only',
  }
}

export function getLOCCPurchaseOrderSubmissionSummary(venueId) {
  return {
    venueId,
    canSubmitLive: false,
    purchase_order_not_submitted: true,
    reorder_not_submitted: true,
    autoApprovalDisabled: true,
    approvalRequired: true,
    vendor_api_required: !process.env.VENDOR_API_KEY,
    databaseRequired: !dbAvailable(),
  }
}

export function getLOCCSyncConsumerSummary(venueId) {
  return {
    venueId,
    status: 'consumer_preview_only',
    real_time_push_pending: true,
    external_sync_not_live: true,
    liveConsumerReady: false,
    sync_event_consumer_foundation_ready: true,
  }
}

export function getLOCCAvailabilityPushSummary(venueId) {
  return {
    venueId,
    status: 'real_time_push_pending',
    real_time_push_pending: true,
    websocket_required: true,
    sse_required: true,
    liveReady: false,
  }
}

export function buildLOCCExternalOpsPanelData(venueId) {
  return {
    venueId,
    externalOps: getLOCCExternalOpsSummary(venueId),
    externalPOS: getLOCCExternalPOSSummary(venueId),
    vendorGateway: getLOCCVendorGatewaySummary(venueId),
    purchaseOrderSubmission: getLOCCPurchaseOrderSubmissionSummary(venueId),
    syncConsumer: getLOCCSyncConsumerSummary(venueId),
    availabilityPush: getLOCCAvailabilityPushSummary(venueId),
  }
}
