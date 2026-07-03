/**
 * SmokeCraft Integration Health Service
 * Summarizes health across all connectors, database, sync, and secret safety.
 * Overall production readiness is false if any required connector is missing.
 */

import { HEALTH_STATUSES } from '../../../src/modules/smokecraft/data/smokecraftConnectorContract.js'
import { getDatabaseReadinessStatus } from './smokecraftDatabaseReadinessService.js'
import { getConnectorRegistry } from './smokecraftProviderConnectorRegistry.js'
import { getSyncQueueStatus } from './smokecraftProductionSyncQueueService.js'
import { getSecretSafetyStatus } from './smokecraftSecretSafetyService.js'
import { createConnectorAuditEntry, CONNECTOR_AUDIT_EVENTS } from './smokecraftConnectorAuditService.js'

export function getIntegrationHealthSummary(actorId = null, actorRole = null) {
  const db            = getDatabaseReadinessStatus()
  const registry      = getConnectorRegistry()
  const syncStatus    = getSyncQueueStatus()
  const secretSafety  = getSecretSafetyStatus()

  const pos360        = registry['pos360']
  const eat           = registry['eat_system']
  const pairing       = registry['pairing_provider']
  const venueMenu     = registry['venue_menu_provider']
  const passport      = registry['passport_connections']
  const loyalty       = registry['loyalty_provider']
  const billing       = registry['billing_provider']
  const analytics     = registry['analytics_provider']
  const marketplace   = registry['marketplace_provider']
  const license       = registry['license_provider']

  const anyConnected  = Object.values(registry).some(c => c.connected)
  const dbReady       = db.productionReady

  const overallHealth = !dbReady
    ? HEALTH_STATUSES.DEGRADED
    : !anyConnected
      ? HEALTH_STATUSES.NOT_CONNECTED
      : HEALTH_STATUSES.DEGRADED

  const productionReady = false // Cannot be true without real connector confirmation

  if (actorId) {
    createConnectorAuditEntry({
      actorId,
      actorRole,
      eventType: CONNECTOR_AUDIT_EVENTS.CONNECTOR_HEALTH_CHECKED,
      allowed: true,
    })
  }

  return {
    overallHealth,
    productionReady,
    database:    { ...db, healthStatus: db.productionReady ? HEALTH_STATUSES.HEALTHY : HEALTH_STATUSES.DEGRADED },
    pos360:      { healthStatus: pos360.healthStatus, connectionStatus: pos360.connectionStatus, connected: false },
    eat:         { healthStatus: eat.healthStatus,    connectionStatus: eat.connectionStatus,    connected: false, syncStatus: 'not_connected', managementSyncStatus: 'preview_only' },
    pairingProvider:{ healthStatus: pairing.healthStatus, connectionStatus: pairing.connectionStatus, connected: false, aiBacked: false, recommendationStatus: 'local_intelligence' },
    venueMenuProvider:{ healthStatus: venueMenu.healthStatus, connectionStatus: venueMenu.connectionStatus, connected: false, venueMenuBacked: false, menuSource: 'local_fallback' },
    passportConnections:{ healthStatus: passport.healthStatus, connectionStatus: passport.connectionStatus, connected: false },
    loyaltyProvider:{ healthStatus: loyalty.healthStatus, connectionStatus: loyalty.connectionStatus, connected: false },
    billing:     { billingStatus: 'preview_only', connected: false },
    marketplace:  { marketplaceStatus: 'not_live_marketplace', connected: false },
    license:      { licenseStatus: 'license_not_enforced', connected: false },
    syncQueue:    syncStatus,
    secretSafety,
    evaluatedAt:  new Date().toISOString(),
  }
}

export function getProductionReadinessOverview() {
  const health = getIntegrationHealthSummary()
  return {
    productionReady: false,
    overallHealth:   health.overallHealth,
    blockers: [
      !health.database.productionReady && 'Database not production-ready',
      !health.pos360.connected && 'POS360 not connected',
      !health.eat.connected && 'E.A.T. not connected',
    ].filter(Boolean),
    note: 'Production readiness requires: database connected, critical connectors verified, secret safety confirmed.',
  }
}
