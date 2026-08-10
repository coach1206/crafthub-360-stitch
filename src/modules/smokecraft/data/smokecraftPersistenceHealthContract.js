/**
 * SmokeCraft Persistence Health Contract
 */

export const PERSISTENCE_HEALTH_STATUSES = {
  HEALTHY:           'healthy',
  DEGRADED:          'degraded',
  MEMORY_ONLY:       'memory_only',
  DB_CONFIG_PENDING: 'database_config_pending',
  PRODUCTION_READY:  'production_ready',
}

export function createPersistenceHealthStatus(overrides = {}) {
  return {
    healthId:               null,
    status:                 PERSISTENCE_HEALTH_STATUSES.MEMORY_ONLY,
    databaseConfigured:     false,
    databaseVerified:       false,
    overallPersistenceMode: 'memory_fallback',
    productionReady:        false,
    areasTotal:             0,
    areasDatabaseVerified:  0,
    areasMemoryFallback:    0,
    criticalWarnings:       [],
    nextRequiredActions:    [],
    ...overrides,
  }
}
