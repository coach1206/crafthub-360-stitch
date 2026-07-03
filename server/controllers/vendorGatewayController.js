import { getVendorConnectorStatus, listSupportedVendorConnectorTypes, buildVendorAPIRequiredResponse, syncVendorCatalogPreview, checkVendorProductAvailabilityPreview, submitPurchaseOrderPreview, submitPurchaseOrderViaEmailPreview, exportPurchaseOrderCSVPreview, exportPurchaseOrderPDFPreview } from '../services/vendorGateway/vendorConnectorGateway.js'

export function handleVendorGatewayReadiness(req, res) {
  const venueId = req.query.venueId ?? 'preview'
  res.json(getVendorConnectorStatus(venueId, 'all'))
}

export function handleListVendorConnectors(req, res) {
  res.json(listSupportedVendorConnectorTypes())
}

export function handleVendorGatewayStatus(req, res) {
  const venueId = req.query.venueId ?? 'preview'
  res.json(buildVendorAPIRequiredResponse(venueId))
}

export function handleVendorCatalogPreview(req, res) {
  const vendorId = req.query.vendorId ?? 'preview'
  res.json(syncVendorCatalogPreview(vendorId, 'preview_only'))
}

export function handleCatalogSyncPreview(req, res) {
  const { vendorId = 'preview', connectorType = 'preview_only' } = req.body
  res.json(syncVendorCatalogPreview(vendorId, connectorType))
}

export function handleProductAvailabilityCheckPreview(req, res) {
  const { vendorId = 'preview', productIds = [] } = req.body
  res.json(checkVendorProductAvailabilityPreview(vendorId, productIds))
}

export function handlePurchaseOrderSubmitPreview(req, res) {
  const { purchaseOrderId, vendorId = 'preview' } = req.body
  res.json(submitPurchaseOrderPreview(purchaseOrderId, vendorId))
}

export function handlePurchaseOrderExportCSVPreview(req, res) {
  const { purchaseOrderId } = req.body
  res.json(exportPurchaseOrderCSVPreview(purchaseOrderId))
}

export function handlePurchaseOrderExportPDFPreview(req, res) {
  const { purchaseOrderId } = req.body
  res.json(exportPurchaseOrderPDFPreview(purchaseOrderId))
}
