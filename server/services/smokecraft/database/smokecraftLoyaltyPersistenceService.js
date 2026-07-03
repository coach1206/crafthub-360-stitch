/**
 * SmokeCraft Loyalty Persistence Service
 */

import { isDbAvailable, query } from '../../../db/connection.js'
import { randomUUID } from 'node:crypto'

const _memLoyalty = new Map()

export function getPersistenceMode() { return isDbAvailable() ? 'database_config_detected' : 'memory_fallback' }

export async function createLoyaltyRecord(data) {
  const loyaltyId = data.loyaltyId ?? `sc-loyalty-${randomUUID()}`
  const now       = new Date().toISOString()
  const record    = {
    loyaltyId, userId: data.userId ?? null, venueId: data.venueId ?? null,
    data: data.data ?? {}, persistenceMode: getPersistenceMode(), createdAt: now, updatedAt: now,
  }

  if (isDbAvailable()) {
    try {
      await query(
        `INSERT INTO smokecraft_loyalty_records (loyalty_id, user_id, venue_id, data, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (loyalty_id) DO UPDATE SET data=$4, updated_at=$6`,
        [loyaltyId, record.userId, record.venueId, JSON.stringify(record.data), now, now]
      )
    } catch { /* fall through */ }
  }
  _memLoyalty.set(loyaltyId, record)
  return record
}

export async function getLoyaltyRecord(loyaltyId) {
  if (isDbAvailable()) {
    try {
      const res = await query(
        `SELECT * FROM smokecraft_loyalty_records WHERE loyalty_id=$1`, [loyaltyId]
      )
      if (res.rows.length) return res.rows[0]
    } catch { /* fall through */ }
  }
  return _memLoyalty.get(loyaltyId) ?? null
}

export function getLoyaltyPersistenceStatus() {
  return {
    areaId: 'loyalty', displayName: 'Loyalty Records',
    currentPersistenceMode: getPersistenceMode(),
    databaseReady: true, databaseVerified: false,
    productionReady: false, usesMemoryFallback: !isDbAvailable(),
    tableSchema: 'smokecraft_loyalty_records (migration 029)',
    warnings: isDbAvailable()
      ? ['DATABASE_URL detected — ensure migration 029 has been applied']
      : ['memory_fallback active — loyalty records will not survive server restart'],
  }
}
