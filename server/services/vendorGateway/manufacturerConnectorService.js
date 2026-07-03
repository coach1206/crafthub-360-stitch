const dbAvailable = () => !!process.env.DATABASE_URL
const hasManufacturerCreds = () => !!process.env.MANUFACTURER_API_KEY

export function getManufacturerConnectorStatus(venueId, manufacturerId) {
  return {
    venueId, manufacturerId,
    connectionStatus: hasManufacturerCreds() ? 'disconnected' : 'credentials_required',
    connectorType: 'preview_only',
    manufacturer_connection_required: !hasManufacturerCreds(),
    reorder_not_submitted: true,
    purchase_order_not_submitted: true,
    databaseRequired: !dbAvailable(),
    valueExposed: false,
  }
}

export function getManufacturerCatalogPreview(manufacturerId) {
  return {
    manufacturerId,
    status: 'preview_only',
    catalogItems: [],
    manufacturer_connection_required: !hasManufacturerCreds(),
    message: 'manufacturer_catalog_preview · no live manufacturer api',
  }
}

export function submitOrderToManufacturerPreview(manufacturerId, order) {
  return {
    manufacturerId,
    status: 'not_submitted',
    purchase_order_not_submitted: true,
    manufacturer_connection_required: !hasManufacturerCreds(),
    orderRef: order?.purchaseOrderId ?? null,
    message: 'manufacturer_submission_preview_only · approval_required',
  }
}

export function buildManufacturerConnectionRequiredResponse() {
  return {
    status: 'manufacturer_connection_required',
    manufacturer_connection_required: true,
    reorder_not_submitted: true,
    credentialKey: 'MANUFACTURER_API_KEY',
    valueExposed: false,
  }
}
