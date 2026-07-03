import { getExternalPOSConnectionStatus, listSupportedPOSProviders, pullInventoryFromPOSPreview, pushAvailabilityToPOSPreview, syncMenuAvailabilityPreview, processExternalPOSWebhookPreview, buildExternalPOSSyncNotLiveResponse } from '../services/externalPos/externalPOSConnectorGateway.js'
import { getMappingsByVenue, detectUnmappedInventoryProducts, createPOSProductMapping } from '../services/externalPos/externalPOSProductMappingService.js'

export function handleExternalPOSReadiness(req, res) {
  const venueId = req.params.venueId ?? req.query.venueId ?? 'preview'
  res.json(getExternalPOSConnectionStatus(venueId))
}

export function handleListPOSProviders(req, res) {
  res.json(listSupportedPOSProviders())
}

export function handlePOSStatus(req, res) {
  const venueId = req.query.venueId ?? 'preview'
  res.json(buildExternalPOSSyncNotLiveResponse(venueId))
}

export function handleGetPOSMappings(req, res) {
  const venueId = req.query.venueId ?? 'preview'
  res.json({ venueId, mappings: getMappingsByVenue(venueId), unmapped: detectUnmappedInventoryProducts(venueId) })
}

export function handleCreatePOSMapping(req, res) {
  const mapping = createPOSProductMapping({ ...req.body, venueId: req.body.venueId ?? 'preview' })
  res.json(mapping)
}

export function handleInventoryPullPreview(req, res) {
  const { venueId = 'preview', posProviderId = 'unknown' } = req.body
  res.json(pullInventoryFromPOSPreview(venueId, posProviderId))
}

export function handleAvailabilityPushPreview(req, res) {
  const { venueId = 'preview', posProviderId = 'unknown' } = req.body
  res.json(pushAvailabilityToPOSPreview(venueId, posProviderId))
}

export function handleMenuSyncPreview(req, res) {
  const { venueId = 'preview', posProviderId = 'unknown' } = req.body
  res.json(syncMenuAvailabilityPreview(venueId, posProviderId))
}

export function handleWebhookPreview(req, res) {
  res.json(processExternalPOSWebhookPreview(req.body))
}
