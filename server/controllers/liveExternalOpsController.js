import { getLiveExternalOperationsReadiness, buildExternalOperationsBlockerReport, getExternalPOSCredentialStatus, getVendorCredentialStatus, getDistributorCredentialStatus, getManufacturerCredentialStatus, getPurchaseOrderSubmissionReadiness } from '../services/externalOps/liveExternalOperationsReadinessService.js'
import { getAvailabilityPushReadiness } from '../services/realtime/availabilityPushReadinessService.js'

export function handleLiveExternalOpsReadiness(req, res) {
  res.json(getLiveExternalOperationsReadiness())
}

export function handleLiveExternalOpsBlockers(req, res) {
  res.json(buildExternalOperationsBlockerReport())
}

export function handleCredentialStatus(req, res) {
  res.json({
    externalPOS: getExternalPOSCredentialStatus(),
    vendor: getVendorCredentialStatus(),
    distributor: getDistributorCredentialStatus(),
    manufacturer: getManufacturerCredentialStatus(),
    valuesExposed: false,
  })
}

export function handleSubmissionReadiness(req, res) {
  const venueId = req.query.venueId ?? 'preview'
  res.json(getPurchaseOrderSubmissionReadiness(venueId))
}

export function handlePushReadiness(req, res) {
  res.json(getAvailabilityPushReadiness())
}
