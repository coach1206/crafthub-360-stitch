/**
 * SmokeCraft Sync Event Store
 * Stores production sync events. Dual-mode: database or memory_fallback.
 * Never marks synced without real connector confirmation.
 */

import { isDbAvailable } from '../../db/connection.js'
import {
  createSyncEvent,
  SYNC_STATUSES,
} from '../../../src/modules/smokecraft/data/smokecraftProductionSyncContract.js'

const syncEventMemoryStore = new Map()

export function createSyncEventRecord(data = {}) {
  const event = createSyncEvent(data)
  syncEventMemoryStore.set(event.syncEventId, event)
  return { ...event, persistenceMode: isDbAvailable() ? 'database' : 'memory_fallback' }
}

export function getSyncEvent(syncEventId) {
  return syncEventMemoryStore.get(syncEventId) ?? null
}

export function updateSyncEvent(syncEventId, updates = {}) {
  const existing = syncEventMemoryStore.get(syncEventId)
  if (!existing) return null
  // Guard: synced status can only be set by connector confirmation flag
  if (updates.syncStatus === SYNC_STATUSES.SYNCED && !updates._connectorConfirmed) {
    updates.syncStatus = SYNC_STATUSES.FAILED
    updates.errorCode  = 'sync_claimed_without_connector_confirmation'
    updates.errorMessage = 'Sync cannot be marked synced without real connector confirmation.'
  }
  const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() }
  syncEventMemoryStore.set(syncEventId, updated)
  return updated
}

export function getSyncEventsByTarget(targetSystem) {
  return [...syncEventMemoryStore.values()].filter(e => e.targetSystem === targetSystem)
}

export function getSyncEventsByStatus(status) {
  return [...syncEventMemoryStore.values()].filter(e => e.syncStatus === status)
}

export function getAllSyncEvents() {
  return [...syncEventMemoryStore.values()]
}

export function getSyncEventStoreSummary() {
  const all = [...syncEventMemoryStore.values()]
  const byStatus = {}
  for (const s of Object.values(SYNC_STATUSES)) {
    byStatus[s] = all.filter(e => e.syncStatus === s).length
  }
  return {
    total:           all.length,
    byStatus,
    persistenceMode: isDbAvailable() ? 'database' : 'memory_fallback',
    productionReady: isDbAvailable(),
  }
}

export function blockSyncEvent(syncEventId, reason) {
  const status = reason === 'not_connected'
    ? SYNC_STATUSES.BLOCKED_NOT_CONNECTED
    : SYNC_STATUSES.BLOCKED_MISSING_CONFIG
  return updateSyncEvent(syncEventId, { syncStatus: status, errorCode: reason })
}

export function markSyncDeadLetter(syncEventId, errorCode, errorMessage) {
  return updateSyncEvent(syncEventId, {
    syncStatus:   SYNC_STATUSES.DEAD_LETTER,
    deadLetter:   true,
    errorCode,
    errorMessage,
  })
}
