/**
 * SmokeCraft Pairing Persistence Service
 */

import { isDbAvailable } from '../../../db/connection.js'
import { getPersistenceMode as profileMode } from '../smokecraftPairingProfileStore.js'

export function getPairingPersistenceStatus() {
  const dbUp = isDbAvailable()
  return {
    areaId: 'pairing_profiles', displayName: 'Pairing Profiles',
    currentPersistenceMode: profileMode(),
    databaseReady: true, databaseVerified: false,
    productionReady: false, usesMemoryFallback: !dbUp,
    tableSchema: 'smokecraft_pairing_profiles + smokecraft_pairing_recommendations + smokecraft_pairing_audit (migration 029)',
    warnings: dbUp
      ? ['DATABASE_URL detected — ensure migration 029 has been applied']
      : ['memory_fallback active — pairing profiles will not survive server restart'],
  }
}

export function getPairingRecommendationsPersistenceStatus() {
  const dbUp = isDbAvailable()
  return {
    areaId: 'pairing_recommendations', displayName: 'Pairing Recommendations',
    currentPersistenceMode: dbUp ? 'database_config_detected' : 'database_contract_ready',
    databaseReady: true, databaseVerified: false,
    productionReady: false, usesMemoryFallback: !dbUp,
    tableSchema: 'smokecraft_pairing_recommendations (migration 029)',
  }
}

export function getPairingAuditPersistenceStatus() {
  const dbUp = isDbAvailable()
  return {
    areaId: 'pairing_audit', displayName: 'Pairing Audit',
    currentPersistenceMode: dbUp ? 'database_config_detected' : 'database_contract_ready',
    databaseReady: true, databaseVerified: false,
    productionReady: false, usesMemoryFallback: !dbUp,
    tableSchema: 'smokecraft_pairing_audit (migration 029)',
  }
}
