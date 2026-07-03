const dbAvailable = () => !!process.env.DATABASE_URL
const hasPOSCreds = () => !!process.env.EXTERNAL_POS_API_KEY
const hasVendorCreds = () => !!process.env.VENDOR_API_KEY

export function getInventoryExternalOpsContext(venueId) {
  return {
    venueId,
    externalPosMappingStatus: 'pos_product_mapping_required',
    externalPosSyncStatus: 'external_sync_not_live',
    vendorConnectorStatus: hasVendorCreds() ? 'disconnected' : 'vendor_api_required',
    distributorConnectorStatus: 'distributor_connection_required',
    manufacturerConnectorStatus: 'manufacturer_connection_required',
    liveExternalOpsReadiness: 'not_live_ready',
    syncConsumerStatus: 'consumer_preview_only',
    availabilityPushStatus: 'real_time_push_pending',
    databaseRequired: !dbAvailable(),
  }
}

export function getInventoryPOSMappingStatus(venueId) {
  return {
    venueId,
    status: 'pos_product_mapping_required',
    pos_product_mapping_required: true,
    external_pos_required: !hasPOSCreds(),
    mappedProductCount: 0,
  }
}

export function getInventoryExternalSyncStatus(venueId) {
  return {
    venueId,
    external_sync_not_live: true,
    external_pos_required: !hasPOSCreds(),
    real_time_push_pending: true,
    syncActive: false,
  }
}

export function getInventoryVendorReadinessStatus(venueId) {
  return {
    venueId,
    vendorReady: hasVendorCreds(),
    vendor_api_required: !hasVendorCreds(),
    distributor_connection_required: !process.env.DISTRIBUTOR_API_KEY,
    manufacturer_connection_required: !process.env.MANUFACTURER_API_KEY,
    reorder_not_submitted: true,
  }
}

export function getInventoryAvailabilityPushStatus(venueId) {
  return {
    venueId,
    status: 'real_time_push_pending',
    real_time_push_pending: true,
    liveReady: false,
  }
}

export function buildInventoryExternalOpsContextReport(venueId) {
  return {
    venueId,
    context: getInventoryExternalOpsContext(venueId),
    posMappingStatus: getInventoryPOSMappingStatus(venueId),
    externalSyncStatus: getInventoryExternalSyncStatus(venueId),
    vendorReadiness: getInventoryVendorReadinessStatus(venueId),
    availabilityPush: getInventoryAvailabilityPushStatus(venueId),
    externalSyncNotLive: true,
    databaseRequired: !dbAvailable(),
  }
}
