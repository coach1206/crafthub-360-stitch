/**
 * POS360 Integration Routes — mounted at /api/pos360
 */
import { Router } from 'express'
import * as ctrl from '../controllers/pos360IntegrationController.js'
import { venueTenantGuard } from '../middleware/venueTenantGuard.js'

const router = Router()

// Public provider info
router.get('/providers', ctrl.getProviders)
router.get('/provider-health', ctrl.getProviderHealth)

// Webhook intake (no tenant guard — provider posts here directly)
router.post('/webhooks/:providerName', ctrl.receiveWebhook)

// All venue-scoped routes use tenant guard middleware
router.get('/venues/:venueId/connections', venueTenantGuard, ctrl.getVenueConnections)
router.post('/venues/:venueId/connections/:providerName/begin', venueTenantGuard, ctrl.beginConnection)
router.post('/venues/:venueId/connections/:providerName/complete', venueTenantGuard, ctrl.completeConnection)
router.delete('/venues/:venueId/connections/:providerName', venueTenantGuard, ctrl.disconnectProvider)

router.post('/venues/:venueId/:providerName/sync-menu', venueTenantGuard, ctrl.syncMenu)
router.post('/venues/:venueId/:providerName/sync-inventory', venueTenantGuard, ctrl.syncInventory)
router.post('/venues/:venueId/:providerName/create-order', venueTenantGuard, ctrl.createOrder)
router.get('/venues/:venueId/:providerName/orders/:providerOrderId', venueTenantGuard, ctrl.getOrderStatus)

router.post('/venues/:venueId/manual-order', venueTenantGuard, ctrl.createManualOrder)
router.get('/venues/:venueId/manual-mode', venueTenantGuard, ctrl.getManualMode)

router.get('/venues/:venueId/mappings/:providerName', venueTenantGuard, ctrl.getMappings)
router.post('/venues/:venueId/mappings/:providerName', venueTenantGuard, ctrl.createMapping)
router.patch('/venues/:venueId/mappings/:providerName/:mappingId', venueTenantGuard, ctrl.updateMapping)

router.get('/venues/:venueId/audit-logs', venueTenantGuard, ctrl.getAuditLogs)

export default router
