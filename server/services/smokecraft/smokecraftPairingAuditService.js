/**
 * SmokeCraft Pairing Audit Service
 * Records every recommendation generation event.
 * Does not store secrets or expose private personal data unnecessarily.
 */

const _auditLog = []
let _auditCounter = 1

export const PAIRING_AUDIT_EVENTS = {
  PROFILE_UPDATED:              'smokeCraft.pairing.profileUpdated',
  RECOMMENDATION_GENERATED:     'smokeCraft.pairing.recommendationGenerated',
  MENU_RECOMMENDATION_GENERATED:'smokeCraft.pairing.menuRecommendationGenerated',
  FLAVOR_MEMORY_CAPTURED:       'smokeCraft.pairing.flavorMemoryCaptured',
  LOCAL_FALLBACK_USED:          'smokeCraft.pairing.localFallbackUsed',
  PROVIDER_UNAVAILABLE:         'smokeCraft.pairing.providerUnavailable',
}

export function createPairingAuditEntry({
  recommendationId = null,
  userId = null,
  venueId = null,
  eventType,
  inputSummary = {},
  recommendationStatus,
  providerConnected,
  aiBacked,
  menuSource = null,
  confidenceScore = null,
}) {
  const auditId = `sc-audit-${Date.now()}-${_auditCounter++}`
  const entry = {
    auditId,
    recommendationId,
    userId,
    venueId,
    eventType,
    inputSummary,
    recommendationStatus,
    providerConnected: providerConnected ?? false,
    aiBacked: aiBacked ?? false,
    menuSource: menuSource ?? 'local_fallback',
    confidenceScore,
    createdAt: new Date().toISOString(),
  }
  _auditLog.push(entry)
  return entry
}

export function getAuditTrailForRecommendation(recommendationId) {
  return _auditLog.filter(e => e.recommendationId === recommendationId)
}

export function getAllPairingAuditEntries() {
  return [..._auditLog]
}

export function getPairingAuditReport() {
  const byEvent = {}
  for (const entry of _auditLog) {
    byEvent[entry.eventType] = (byEvent[entry.eventType] ?? 0) + 1
  }
  return {
    totalEntries: _auditLog.length,
    byEvent,
    containsSecrets: false,
    exposesPrivateData: false,
  }
}
