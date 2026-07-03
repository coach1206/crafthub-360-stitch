/**
 * SmokeCraft Analytics Persistence Service
 */

import { isDbAvailable, query } from '../../../db/connection.js'
import { randomUUID } from 'node:crypto'

const _memSnapshots = new Map()

export function getPersistenceMode() { return isDbAvailable() ? 'database_config_detected' : 'memory_fallback' }

export async function createAnalyticsSnapshot(data) {
  const snapshotId = data.snapshotId ?? `sc-analytics-${randomUUID()}`
  const now        = new Date().toISOString()
  const record     = {
    snapshotId, venueId: data.venueId ?? null, period: data.period ?? null,
    data: data.data ?? {}, persistenceMode: getPersistenceMode(), createdAt: now,
  }

  if (isDbAvailable()) {
    try {
      await query(
        `INSERT INTO smokecraft_analytics_snapshots (snapshot_id, venue_id, period, data, created_at)
         VALUES ($1,$2,$3,$4,$5)`,
        [snapshotId, record.venueId, record.period, JSON.stringify(record.data), now]
      )
    } catch { /* fall through */ }
  }
  _memSnapshots.set(snapshotId, record)
  return record
}

export function getAnalyticsPersistenceStatus() {
  return {
    areaId: 'analytics_snapshots', displayName: 'Analytics Snapshots',
    currentPersistenceMode: getPersistenceMode(),
    databaseReady: true, databaseVerified: false,
    productionReady: false, usesMemoryFallback: !isDbAvailable(),
    tableSchema: 'smokecraft_analytics_snapshots (migration 029)',
  }
}
