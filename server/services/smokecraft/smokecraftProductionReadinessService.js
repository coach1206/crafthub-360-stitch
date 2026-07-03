/**
 * SmokeCraft Production Readiness Service
 * Evaluates overall production readiness from all subsystems.
 * Returns honest evaluation — false when any critical subsystem is not ready.
 */

import { getDatabaseReadinessStatus } from './smokecraftDatabaseReadinessService.js'
import { getEnvironmentValidationReport } from './smokecraftEnvironmentValidationService.js'
import { getConnectorRegistryReport } from './smokecraftProviderConnectorRegistry.js'
import { getSyncQueueStatus } from './smokecraftProductionSyncQueueService.js'
import { getSecretSafetyStatus } from './smokecraftSecretSafetyService.js'
import { getIntegrationHealthSummary } from './smokecraftIntegrationHealthService.js'
import { createIntegrationStatus } from '../../../src/modules/smokecraft/data/smokecraftIntegrationContract.js'
import { createConnectorAuditEntry, CONNECTOR_AUDIT_EVENTS } from './smokecraftConnectorAuditService.js'

export function getProductionReadinessStatus(actorId = null, actorRole = null) {
  const db       = getDatabaseReadinessStatus()
  const env      = getEnvironmentValidationReport()
  const registry = getConnectorRegistryReport()
  const sync     = getSyncQueueStatus()
  const secrets  = getSecretSafetyStatus()
  const health   = getIntegrationHealthSummary()

  // Production readiness is false unless all critical subsystems are verified
  const productionReady = false // Cannot be true in this build without live connectors

  const blockers = []
  if (!db.productionReady) blockers.push('database_not_ready')
  if (env.criticalMissing > 0) blockers.push('critical_env_vars_missing')
  if (registry.connectedCount === 0) blockers.push('no_connectors_connected')
  if (!secrets.safe) blockers.push('secret_safety_issue')

  const status = createIntegrationStatus({
    productionReady,
    overallHealth: health.overallHealth,
    database: { persistenceMode: db.persistenceMode, productionReady: db.productionReady },
    pos360:   health.pos360,
    eat:      health.eat,
    pairingProvider:    health.pairingProvider,
    venueMenuProvider:  health.venueMenuProvider,
    passportConnections:health.passportConnections,
    billing:   health.billing,
    marketplace:health.marketplace,
    license:    health.license,
    syncQueue:  { enabled: sync.syncQueueEnabled, status: sync.byStatus?.queued > 0 ? 'active' : 'idle' },
    secretSafety: { safe: secrets.safe, containsSecrets: false },
  })

  if (actorId) {
    createConnectorAuditEntry({
      actorId, actorRole,
      eventType: CONNECTOR_AUDIT_EVENTS.PRODUCTION_READINESS_CHECKED,
      allowed: true,
    })
  }

  return {
    ...status,
    blockers,
    environmentValidation: { criticalMissing: env.criticalMissing, optionalMissing: env.optionalMissing },
    connectorRegistry:     registry,
    syncQueue:             sync,
    secretSafety:          secrets,
    note: 'Production readiness is false. Connect database, verify connectors, and confirm secret safety before claiming production-ready.',
  }
}

export function getIntegrationSystemStatus() {
  return {
    module:           'SmokeCraft Integrations',
    moduleBuild:      7,
    status:           'active',
    productionReady:  false,
    persistenceMode:  'memory_fallback',
    posSyncStatus:    'not_connected',
    eatSyncStatus:    'not_connected',
    managementSyncStatus: 'preview_only',
    pairingStatus:    'local_intelligence',
    venueMenuStatus:  'local_fallback',
    billingStatus:    'preview_only',
    marketplaceStatus:'not_live_marketplace',
    licenseStatus:    'license_not_enforced',
    environmentValidationActive:    true,
    databaseReadinessCheckActive:   true,
    connectorRegistryActive:        true,
    syncQueueActive:                true,
    retryServiceActive:             true,
    secretSafetyActive:             true,
    integrationHealthActive:        true,
  }
}
