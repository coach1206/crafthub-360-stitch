import { Router } from 'express'
import { handleVendorGatewayReadiness, handleListVendorConnectors, handleVendorGatewayStatus, handleVendorCatalogPreview, handleCatalogSyncPreview, handleProductAvailabilityCheckPreview, handlePurchaseOrderSubmitPreview, handlePurchaseOrderExportCSVPreview, handlePurchaseOrderExportPDFPreview } from '../controllers/vendorGatewayController.js'

const router = Router()
router.get('/readiness', handleVendorGatewayReadiness)
router.get('/connectors', handleListVendorConnectors)
router.get('/status', handleVendorGatewayStatus)
router.get('/catalog-preview', handleVendorCatalogPreview)
router.post('/catalog/sync-preview', handleCatalogSyncPreview)
router.post('/product-availability/check-preview', handleProductAvailabilityCheckPreview)
router.post('/purchase-order/submit-preview', handlePurchaseOrderSubmitPreview)
router.post('/purchase-order/export-csv-preview', handlePurchaseOrderExportCSVPreview)
router.post('/purchase-order/export-pdf-preview', handlePurchaseOrderExportPDFPreview)
export default router
