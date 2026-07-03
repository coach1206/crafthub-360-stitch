/**
 * SmokeCraft Reward Persistence Service
 */

import { isDbAvailable } from '../../../db/connection.js'
import { getPersistenceMode as rewardMode, isProductionReady as rewardReady } from '../smokecraftRewardStore.js'

export function getRewardPersistenceStatus() {
  return {
    areaId: 'rewards', displayName: 'Rewards',
    currentPersistenceMode: rewardMode(),
    databaseReady: true, databaseVerified: false,
    productionReady: rewardReady(),
    usesMemoryFallback: !isDbAvailable(),
    tableSchema: 'smokecraft_rewards + smokecraft_reward_audit (migration 029)',
    warnings: isDbAvailable()
      ? ['DATABASE_URL detected — ensure migration 029 has been applied']
      : ['memory_fallback active — reward records will not survive server restart'],
  }
}

export function getRewardAuditPersistenceStatus() {
  const dbUp = isDbAvailable()
  return {
    areaId: 'reward_audit', displayName: 'Reward Audit',
    currentPersistenceMode: dbUp ? 'database_config_detected' : 'database_contract_ready',
    databaseReady: true, databaseVerified: false,
    productionReady: false, usesMemoryFallback: !dbUp,
    tableSchema: 'smokecraft_reward_audit (migration 029)',
  }
}
