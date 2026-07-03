/**
 * SmokeCraft Persistence Contract
 */

export const PERSISTENCE_MODES = {
  MEMORY_FALLBACK:          'memory_fallback',
  DATABASE_CONTRACT_READY:  'database_contract_ready',
  DATABASE_CONFIG_DETECTED: 'database_config_detected',
  DATABASE_VERIFIED:        'database_verified',
  NOT_APPLICABLE:           'not_applicable',
  BLOCKED:                  'blocked',
}

export const CRITICAL_AREAS = [
  'orders', 'staff_queue', 'pairing_profiles', 'flavor_memory',
  'rewards', 'loyalty', 'passport_rewards', 'venue_admin',
  'integration_sync_events', 'production_sync_queue', 'order_audit',
]

export function createPersistenceAreaRecord(overrides = {}) {
  return {
    areaId:                 null,
    displayName:            null,
    currentPersistenceMode: PERSISTENCE_MODES.MEMORY_FALLBACK,
    databaseReady:          false,
    databaseVerified:       false,
    productionReady:        false,
    usesMemoryFallback:     true,
    requiresMigration:      false,
    migrationStatus:        'migration_pending',
    recordCountAvailable:   false,
    lastCheckedAt:          null,
    warnings:               [],
    ...overrides,
  }
}

export function createPersistenceHealthRecord(overrides = {}) {
  return {
    healthId:               null,
    databaseConfigured:     false,
    databaseVerified:       false,
    overallPersistenceMode: PERSISTENCE_MODES.MEMORY_FALLBACK,
    productionReady:        false,
    areasTotal:             0,
    areasDatabaseVerified:  0,
    areasMemoryFallback:    0,
    areasBlocked:           0,
    criticalAreasMemoryFallback: [],
    criticalWarnings:       [],
    nextRequiredActions:    [],
    checkedAt:              null,
    ...overrides,
  }
}
