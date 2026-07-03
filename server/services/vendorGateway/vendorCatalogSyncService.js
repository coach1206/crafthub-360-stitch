const hasVendorCreds = () => !!process.env.VENDOR_API_KEY

export function getCatalogSyncReadiness(vendorId) {
  return {
    vendorId,
    status: 'preview_only',
    catalogSyncLive: false,
    vendor_api_required: !hasVendorCreds(),
    external_sync_not_live: true,
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

export function buildCatalogSyncNotLiveResponse(vendorId) {
  return {
    vendorId,
    status: 'sync_not_live',
    external_sync_not_live: true,
    vendor_api_required: !hasVendorCreds(),
  }
}
