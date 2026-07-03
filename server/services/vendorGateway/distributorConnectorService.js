const dbAvailable = () => !!process.env.DATABASE_URL
const hasDistributorCreds = () => !!process.env.DISTRIBUTOR_API_KEY

export function getDistributorConnectorStatus(venueId, distributorId) {
  return {
    venueId, distributorId,
    connectionStatus: hasDistributorCreds() ? 'disconnected' : 'credentials_required',
    connectorType: 'preview_only',
    distributor_connection_required: !hasDistributorCreds(),
    reorder_not_submitted: true,
    purchase_order_not_submitted: true,
    databaseRequired: !dbAvailable(),
    degradedMode: !dbAvailable(),
    valueExposed: false,
  }
}

export function getDistributorCatalogPreview(distributorId) {
  return {
    distributorId,
    status: 'preview_only',
    catalogItems: [],
    distributor_connection_required: !hasDistributorCreds(),
    message: 'distributor_catalog_preview · no live distributor api',
  }
}

export function submitOrderToDistributorPreview(distributorId, order) {
  return {
    distributorId,
    status: 'not_submitted',
    purchase_order_not_submitted: true,
    distributor_connection_required: !hasDistributorCreds(),
    databaseRequired: !dbAvailable(),
    orderRef: order?.purchaseOrderId ?? null,
    message: 'distributor_submission_preview_only · approval_required',
  }
}

export function buildDistributorConnectionRequiredResponse() {
  return {
    status: 'distributor_connection_required',
    distributor_connection_required: true,
    reorder_not_submitted: true,
    credentialKey: 'DISTRIBUTOR_API_KEY',
    valueExposed: false,
  }
}
