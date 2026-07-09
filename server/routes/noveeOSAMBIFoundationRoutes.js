import { Router } from 'express'
import { canAccessPOS3 } from '../middleware/roleMiddleware.js'
import * as ctrl from '../controllers/noveeOSAMBIFoundationController.js'

const router = Router()

router.get('/summary', ctrl.getSummary)

router.get('/devices', ctrl.listDevices)
router.get('/devices/:ambiDeviceId', ctrl.getDevice)
router.post('/devices/preview', canAccessPOS3, ctrl.createDevicePreview)
router.patch('/devices/:ambiDeviceId/status-preview', canAccessPOS3, ctrl.updateDeviceStatusPreview)

router.get('/pairings', ctrl.listPairings)
router.get('/pairings/:pairingId', ctrl.getPairing)
router.post('/pairings/preview', canAccessPOS3, ctrl.createPairingPreview)
router.patch('/pairings/:pairingId/status-preview', canAccessPOS3, ctrl.updatePairingStatusPreview)

router.get('/firmware', ctrl.listFirmware)
router.get('/firmware/:firmwareId', ctrl.getFirmware)
router.post('/firmware/preview', canAccessPOS3, ctrl.createFirmwarePreview)
router.patch('/firmware/:firmwareId/status-preview', canAccessPOS3, ctrl.updateFirmwareStatusPreview)

router.get('/hardware-providers', ctrl.listProviders)
router.get('/hardware-providers/:providerId', ctrl.getProvider)
router.post('/hardware-providers/preview', canAccessPOS3, ctrl.createProviderPreview)
router.patch('/hardware-providers/:providerId/status-preview', canAccessPOS3, ctrl.updateProviderStatusPreview)

router.get('/aura-states', ctrl.listAuraStates)
router.get('/aura-states/:auraStateId', ctrl.getAuraState)
router.post('/aura-states/preview', canAccessPOS3, ctrl.createAuraStatePreview)
router.patch('/aura-states/:auraStateId/status-preview', canAccessPOS3, ctrl.updateAuraStateStatusPreview)

router.get('/environment-signals', ctrl.listSignals)
router.get('/environment-signals/:signalId', ctrl.getSignal)
router.post('/environment-signals/preview', canAccessPOS3, ctrl.createSignalPreview)
router.patch('/environment-signals/:signalId/status-preview', canAccessPOS3, ctrl.updateSignalStatusPreview)

router.get('/privacy-consent', ctrl.listConsent)
router.get('/privacy-consent/:consentId', ctrl.getConsent)
router.post('/privacy-consent/preview', canAccessPOS3, ctrl.createConsentPreview)
router.patch('/privacy-consent/:consentId/status-preview', canAccessPOS3, ctrl.updateConsentStatusPreview)

router.get('/presence-access-events', ctrl.listPresenceEvents)
router.get('/presence-access-events/:eventId', ctrl.getPresenceEvent)
router.post('/presence-access-events/preview', canAccessPOS3, ctrl.createPresenceEventPreview)

router.get('/readiness-score', ctrl.getReadinessScore)
router.get('/blockers', ctrl.getBlockers)
router.get('/safe-claims', ctrl.getSafeClaims)
router.get('/audit-log', ctrl.getAuditLog)
router.get('/feature-flags', ctrl.getFeatureFlags)
router.get('/validate-readiness', ctrl.validateReadiness)

export default router
