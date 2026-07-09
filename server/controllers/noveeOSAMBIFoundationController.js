import * as svc from '../services/noveeOS/noveeOSAMBIFoundationService.js'

const ok500 = (res, fn) => fn().catch(e => res.status(500).json({ ok: false, error: e.message }))
const actorId = req => req.user?.id || req.headers['x-actor-id'] || 'system'
const ikey = req => req.headers['x-idempotency-key'] || req.body?.idempotencyKey
const tenantId = req => req.query.tenant_id || req.body?.tenant_id || req.user?.tenant_id || null

const wrap = (res, data) => res.json({
  success: true,
  data,
  safeClaim: 'ambi_foundation_exists',
  foundationReady: false,
  hardwareReady: false,
  liveTelemetryEnabled: false,
  liveDeviceControlEnabled: false,
  blockers: [],
  timestamp: new Date().toISOString(),
})

export const getSummary = (req, res) =>
  ok500(res, async () => wrap(res, await svc.getAMBIFoundationSummary({ tenantId: tenantId(req) })))

export const listDevices = (req, res) =>
  ok500(res, async () => wrap(res, await svc.listAMBIDevices({ tenantId: tenantId(req) })))

export const getDevice = (req, res) =>
  ok500(res, async () => wrap(res, await svc.getAMBIDevice(req.params.ambiDeviceId)))

export const createDevicePreview = (req, res) =>
  ok500(res, async () => wrap(res, await svc.createAMBIDevicePreview(req.body, { actorId: actorId(req), ikey: ikey(req) })))

export const updateDeviceStatusPreview = (req, res) =>
  ok500(res, async () => wrap(res, await svc.updateAMBIDeviceStatusPreview(req.params.ambiDeviceId, req.body, { actorId: actorId(req) })))

export const listPairings = (req, res) =>
  ok500(res, async () => wrap(res, await svc.listAMBIDevicePairings({ tenantId: tenantId(req) })))

export const getPairing = (req, res) =>
  ok500(res, async () => wrap(res, await svc.getAMBIDevicePairing(req.params.pairingId)))

export const createPairingPreview = (req, res) =>
  ok500(res, async () => wrap(res, await svc.createAMBIDevicePairingPreview(req.body, { actorId: actorId(req), ikey: ikey(req) })))

export const updatePairingStatusPreview = (req, res) =>
  ok500(res, async () => wrap(res, await svc.updateAMBIDevicePairingStatusPreview(req.params.pairingId, req.body, { actorId: actorId(req) })))

export const listFirmware = (req, res) =>
  ok500(res, async () => wrap(res, await svc.listAMBIFirmwareReadiness({ tenantId: tenantId(req) })))

export const getFirmware = (req, res) =>
  ok500(res, async () => wrap(res, await svc.getAMBIFirmwareReadiness(req.params.firmwareId)))

export const createFirmwarePreview = (req, res) =>
  ok500(res, async () => wrap(res, await svc.createAMBIFirmwareReadinessPreview(req.body, { actorId: actorId(req), ikey: ikey(req) })))

export const updateFirmwareStatusPreview = (req, res) =>
  ok500(res, async () => wrap(res, await svc.updateAMBIFirmwareReadinessStatusPreview(req.params.firmwareId, req.body, { actorId: actorId(req) })))

export const listProviders = (req, res) =>
  ok500(res, async () => wrap(res, await svc.listAMBIHardwareProviders({ tenantId: tenantId(req) })))

export const getProvider = (req, res) =>
  ok500(res, async () => wrap(res, await svc.getAMBIHardwareProvider(req.params.providerId)))

export const createProviderPreview = (req, res) =>
  ok500(res, async () => wrap(res, await svc.createAMBIHardwareProviderPreview(req.body, { actorId: actorId(req), ikey: ikey(req) })))

export const updateProviderStatusPreview = (req, res) =>
  ok500(res, async () => wrap(res, await svc.updateAMBIHardwareProviderStatusPreview(req.params.providerId, req.body, { actorId: actorId(req) })))

export const listAuraStates = (req, res) =>
  ok500(res, async () => wrap(res, await svc.listAMBIAuraStates({ tenantId: tenantId(req) })))

export const getAuraState = (req, res) =>
  ok500(res, async () => wrap(res, await svc.getAMBIAuraState(req.params.auraStateId)))

export const createAuraStatePreview = (req, res) =>
  ok500(res, async () => wrap(res, await svc.createAMBIAuraStatePreview(req.body, { actorId: actorId(req), ikey: ikey(req) })))

export const updateAuraStateStatusPreview = (req, res) =>
  ok500(res, async () => wrap(res, await svc.updateAMBIAuraStateStatusPreview(req.params.auraStateId, req.body, { actorId: actorId(req) })))

export const listSignals = (req, res) =>
  ok500(res, async () => wrap(res, await svc.listAMBIEnvironmentSignals({ tenantId: tenantId(req) })))

export const getSignal = (req, res) =>
  ok500(res, async () => wrap(res, await svc.getAMBIEnvironmentSignal(req.params.signalId)))

export const createSignalPreview = (req, res) =>
  ok500(res, async () => wrap(res, await svc.createAMBIEnvironmentSignalPreview(req.body, { actorId: actorId(req), ikey: ikey(req) })))

export const updateSignalStatusPreview = (req, res) =>
  ok500(res, async () => wrap(res, await svc.updateAMBIEnvironmentSignalStatusPreview(req.params.signalId, req.body, { actorId: actorId(req) })))

export const listConsent = (req, res) =>
  ok500(res, async () => wrap(res, await svc.listAMBIPrivacyConsent({ tenantId: tenantId(req) })))

export const getConsent = (req, res) =>
  ok500(res, async () => wrap(res, await svc.getAMBIPrivacyConsent(req.params.consentId)))

export const createConsentPreview = (req, res) =>
  ok500(res, async () => wrap(res, await svc.createAMBIPrivacyConsentPreview(req.body, { actorId: actorId(req), ikey: ikey(req) })))

export const updateConsentStatusPreview = (req, res) =>
  ok500(res, async () => wrap(res, await svc.updateAMBIPrivacyConsentStatusPreview(req.params.consentId, req.body, { actorId: actorId(req) })))

export const listPresenceEvents = (req, res) =>
  ok500(res, async () => wrap(res, await svc.listAMBIPresenceAccessEvents({ tenantId: tenantId(req) })))

export const getPresenceEvent = (req, res) =>
  ok500(res, async () => wrap(res, await svc.getAMBIPresenceAccessEvent(req.params.eventId)))

export const createPresenceEventPreview = (req, res) =>
  ok500(res, async () => wrap(res, await svc.createAMBIPresenceAccessEventPreview(req.body, { actorId: actorId(req), ikey: ikey(req) })))

export const getReadinessScore = (req, res) =>
  ok500(res, async () => wrap(res, await svc.getAMBIReadinessScore({ tenantId: tenantId(req) })))

export const getBlockers = (req, res) =>
  ok500(res, async () => wrap(res, await svc.getAMBIBlockers({ tenantId: tenantId(req) })))

export const getSafeClaims = (req, res) =>
  ok500(res, async () => wrap(res, await svc.getSafeAMBIClaims()))

export const getAuditLog = (req, res) =>
  ok500(res, async () => wrap(res, await svc.getAMBIAuditLog({ tenantId: tenantId(req), limit: parseInt(req.query.limit) || 50 })))

export const getFeatureFlags = (req, res) =>
  ok500(res, async () => wrap(res, await svc.getAMBIFeatureFlagSnapshot()))

export const validateReadiness = (req, res) =>
  ok500(res, async () => wrap(res, await svc.validateAMBIFoundationReadiness({ tenantId: tenantId(req) })))
