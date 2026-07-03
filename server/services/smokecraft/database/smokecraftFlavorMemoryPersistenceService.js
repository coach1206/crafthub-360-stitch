/**
 * SmokeCraft Flavor Memory Persistence Service
 * Flavor Memory must remain between Second Third and Final Third.
 * This service only adds persistence reporting — it does not move or reorder Flavor Memory.
 */

import { isDbAvailable } from '../../../db/connection.js'
import { getPersistenceMode as flavorMode } from '../smokecraftFlavorMemoryService.js'

export function getFlavorMemoryPersistenceStatus() {
  const dbUp = isDbAvailable()
  return {
    areaId: 'flavor_memory', displayName: 'Flavor Memory',
    currentPersistenceMode: flavorMode(),
    databaseReady: true, databaseVerified: false,
    productionReady: false, usesMemoryFallback: !dbUp,
    tableSchema: 'smokecraft_flavor_memory (migration 029)',
    journeyPositionProtected: true,
    warnings: dbUp
      ? ['DATABASE_URL detected — ensure migration 029 has been applied']
      : ['memory_fallback active — Flavor Memory records will not survive server restart',
         'Journey position of Flavor Memory (between Second Third and Final Third) is protected and unchanged'],
  }
}
