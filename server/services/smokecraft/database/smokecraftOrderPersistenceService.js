/**
 * SmokeCraft Order Persistence Service
 * Wraps smokecraftOrderStore with persistence registry reporting.
 */

import { isDbAvailable } from '../../../db/connection.js'
import { getPersistenceMode, isProductionReady } from '../smokecraftOrderStore.js'

export function getOrderPersistenceStatus() {
  return {
    areaId:              'orders',
    displayName:         'Orders',
    currentPersistenceMode: getPersistenceMode(),
    databaseReady:       true,
    databaseVerified:    false,
    productionReady:     isProductionReady(),
    usesMemoryFallback:  !isDbAvailable(),
    tableSchema:         'smokecraft_orders (migration 029)',
    warnings: isDbAvailable()
      ? ['DATABASE_URL detected — ensure migration 029 has been applied']
      : ['memory_fallback active — orders will not survive server restart'],
  }
}
