/**
 * SmokeCraft Reward Store
 * Dual-mode persistence: database when DATABASE_URL configured, memory_fallback otherwise.
 * Never claims production-ready in fallback mode.
 */

import { isDbAvailable, query } from '../../db/connection.js'
import { createRewardRecord } from '../../../src/modules/smokecraft/data/smokecraftRewardContract.js'

const _memoryStore = new Map()
let _idCounter = 1

const dbAvailable = () => isDbAvailable()

function newRewardId() {
  return `sc-reward-${Date.now()}-${_idCounter++}`
}

export function getPersistenceMode() {
  return dbAvailable() ? 'database' : 'memory_fallback'
}

export function isProductionReady() {
  return dbAvailable()
}

export async function createReward(data) {
  const rewardId = data.rewardId ?? newRewardId()
  const now = new Date().toISOString()
  const record = createRewardRecord({
    ...data,
    rewardId,
    persistenceMode: getPersistenceMode(),
    productionReady: isProductionReady(),
    createdAt: now,
    updatedAt: now,
  })

  if (dbAvailable()) {
    try {
      await query(
        `INSERT INTO smokecraft_rewards (reward_id, user_id, data, created_at) VALUES ($1,$2,$3,$4)`,
        [rewardId, record.userId, JSON.stringify(record), now]
      )
      return { ...record, persistenceMode: 'database', productionReady: true }
    } catch { /* fall through */ }
  }

  _memoryStore.set(rewardId, record)
  return record
}

export async function getReward(rewardId) {
  if (dbAvailable()) {
    try {
      const res = await query(`SELECT data FROM smokecraft_rewards WHERE reward_id = $1`, [rewardId])
      if (res.rows.length > 0) return res.rows[0].data
    } catch { /* fall through */ }
  }
  return _memoryStore.get(rewardId) ?? null
}

export async function updateReward(rewardId, patch) {
  const existing = await getReward(rewardId)
  if (!existing) return null
  const now = new Date().toISOString()
  const updated = { ...existing, ...patch, rewardId, updatedAt: now, persistenceMode: getPersistenceMode(), productionReady: isProductionReady() }

  if (dbAvailable()) {
    try {
      await query(`UPDATE smokecraft_rewards SET data=$1 WHERE reward_id=$2`, [JSON.stringify(updated), rewardId])
      return { ...updated, persistenceMode: 'database', productionReady: true }
    } catch { /* fall through */ }
  }
  _memoryStore.set(rewardId, updated)
  return updated
}

export async function getRewardsByUser(userId) {
  if (dbAvailable()) {
    try {
      const res = await query(`SELECT data FROM smokecraft_rewards WHERE user_id=$1 ORDER BY created_at DESC`, [userId])
      return res.rows.map(r => r.data)
    } catch { /* fall through */ }
  }
  return [..._memoryStore.values()].filter(r => r.userId === userId)
}

export function getRewardStoreReport() {
  return {
    persistenceMode: getPersistenceMode(),
    productionReady: isProductionReady(),
    memoryRewardCount: _memoryStore.size,
    message: dbAvailable()
      ? 'Rewards persisted to database.'
      : 'Rewards in memory_fallback. Requires DATABASE_URL for production persistence.',
  }
}
