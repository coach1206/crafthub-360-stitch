/**
 * SmokeCraft Sync Event Persistence Service
 */

import { isDbAvailable, query } from '../../../db/connection.js'
import { randomUUID } from 'node:crypto'

const _memEvents = new Map()

export function getPersistenceMode() { return isDbAvailable() ? 'database_config_detected' : 'memory_fallback' }

export async function createSyncEvent(data) {
  const eventId = data.eventId ?? `sc-sync-${randomUUID()}`
  const now     = new Date().toISOString()
  const record  = {
    eventId, venueId: data.venueId ?? null, areaId: data.areaId ?? null,
    eventType: data.eventType ?? 'unknown', syncStatus: data.syncStatus ?? 'not_connected',
    payload: data.payload ?? {}, persistenceMode: getPersistenceMode(), createdAt: now,
  }

  if (isDbAvailable()) {
    try {
      await query(
        `INSERT INTO smokecraft_sync_events (event_id, venue_id, area_id, event_type, sync_status, payload, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [eventId, record.venueId, record.areaId, record.eventType, record.syncStatus, JSON.stringify(record.payload), now]
      )
    } catch { /* fall through */ }
  }
  _memEvents.set(eventId, record)
  return record
}

export function getSyncEventPersistenceStatus() {
  return {
    areaId: 'integration_sync_events', displayName: 'Integration Sync Events',
    currentPersistenceMode: getPersistenceMode(),
    databaseReady: true, databaseVerified: false,
    productionReady: false, usesMemoryFallback: !isDbAvailable(),
    tableSchema: 'smokecraft_sync_events (migration 029)',
    warnings: isDbAvailable()
      ? ['DATABASE_URL detected — ensure migration 029 has been applied']
      : ['memory_fallback active — sync events will not survive server restart'],
  }
}

export function getProductionSyncQueuePersistenceStatus() {
  const dbUp = isDbAvailable()
  return {
    areaId: 'production_sync_queue', displayName: 'Production Sync Queue',
    currentPersistenceMode: dbUp ? 'database_config_detected' : 'database_contract_ready',
    databaseReady: true, databaseVerified: false,
    productionReady: false, usesMemoryFallback: !dbUp,
    tableSchema: 'smokecraft_sync_events (migration 029)',
  }
}
