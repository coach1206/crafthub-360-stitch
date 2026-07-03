const hasPOSCreds = () => !!process.env.EXTERNAL_POS_API_KEY

export function getPOS360ExternalOpsStatus(venueId) {
  return {
    venueId,
    external_pos_required: !hasPOSCreds(),
    external_sync_not_live: true,
    real_time_push_pending: true,
    pos_product_mapping_required: true,
    pos_availability_push_preview: true,
    pos_inventory_pull_preview: true,
  }
}

export function getPOS360ExternalPOSStatus(venueId) {
  return {
    venueId,
    connectionStatus: hasPOSCreds() ? 'disconnected' : 'external_pos_required',
    external_pos_required: !hasPOSCreds(),
    external_sync_not_live: true,
  }
}

export function getPOS360ProductMappingStatus(venueId) {
  return {
    venueId,
    status: 'pos_product_mapping_required',
    pos_product_mapping_required: true,
    mappedCount: 0,
    unmappedCount: 0,
    external_pos_required: !hasPOSCreds(),
  }
}

export function getPOS360InventorySyncStatus(venueId) {
  return {
    venueId,
    status: 'pos_inventory_pull_preview',
    pos_inventory_pull_preview: true,
    external_sync_not_live: true,
    external_pos_required: !hasPOSCreds(),
  }
}

export function getPOS360MenuSyncStatus(venueId) {
  return {
    venueId,
    status: 'preview_only',
    external_sync_not_live: true,
    external_pos_required: !hasPOSCreds(),
  }
}

export function getPOS360AvailabilityPushStatus(venueId) {
  return {
    venueId,
    status: 'pos_availability_push_preview',
    pos_availability_push_preview: true,
    real_time_push_pending: true,
    external_sync_not_live: true,
  }
}

export function buildPOS360ExternalOpsReport(venueId) {
  return {
    venueId,
    externalOpsStatus: getPOS360ExternalOpsStatus(venueId),
    externalPOS: getPOS360ExternalPOSStatus(venueId),
    productMapping: getPOS360ProductMappingStatus(venueId),
    inventorySync: getPOS360InventorySyncStatus(venueId),
    menuSync: getPOS360MenuSyncStatus(venueId),
    availabilityPush: getPOS360AvailabilityPushStatus(venueId),
    externalSyncNotLive: true,
    real_time_push_pending: true,
  }
}
