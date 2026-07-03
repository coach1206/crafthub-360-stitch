import { Router } from 'express'
import { handleExternalPOSReadiness, handleListPOSProviders, handlePOSStatus, handleGetPOSMappings, handleCreatePOSMapping, handleInventoryPullPreview, handleAvailabilityPushPreview, handleMenuSyncPreview, handleWebhookPreview } from '../controllers/externalPOSController.js'

const router = Router()
router.get('/readiness', handleExternalPOSReadiness)
router.get('/providers', handleListPOSProviders)
router.get('/status', handlePOSStatus)
router.get('/mappings', handleGetPOSMappings)
router.post('/mappings', handleCreatePOSMapping)
router.post('/inventory/pull-preview', handleInventoryPullPreview)
router.post('/availability/push-preview', handleAvailabilityPushPreview)
router.post('/menu/sync-preview', handleMenuSyncPreview)
router.post('/webhook/preview', handleWebhookPreview)
export default router
