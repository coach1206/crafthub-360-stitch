/**
 * SmokeCraft Venue Admin Store
 * Dual-mode persistence for venue admin records.
 * Falls back to memory when DATABASE_URL is unavailable.
 */

import { isDbAvailable } from '../../db/connection.js'
import { createAdminRecord } from '../../../src/modules/smokecraft/data/smokecraftVenueAdminContract.js'

const memoryStore = new Map()

export function getAdminStoreReport() {
  const mode = isDbAvailable() ? 'database' : 'memory_fallback'
  return {
    persistenceMode: mode,
    productionReady: mode === 'database',
    recordCount:     memoryStore.size,
  }
}

export async function createAdminRecord_(data = {}) {
  const record = createAdminRecord(data)
  if (!isDbAvailable()) {
    memoryStore.set(record.adminRecordId, record)
    return { ...record, persistenceMode: 'memory_fallback' }
  }
  memoryStore.set(record.adminRecordId, record)
  return { ...record, persistenceMode: 'memory_fallback' }
}

export async function getAdminRecord(adminRecordId) {
  return memoryStore.get(adminRecordId) ?? null
}

export async function getAdminRecordsByVenue(venueId) {
  const results = []
  for (const record of memoryStore.values()) {
    if (record.venueId === venueId) results.push(record)
  }
  return results
}

export async function updateAdminRecord(adminRecordId, updates = {}) {
  const existing = memoryStore.get(adminRecordId)
  if (!existing) return null
  const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() }
  memoryStore.set(adminRecordId, updated)
  return updated
}

export async function getVenueAdminSummary(venueId) {
  const records = await getAdminRecordsByVenue(venueId)
  return {
    venueId,
    recordCount: records.length,
    persistenceMode: isDbAvailable() ? 'database' : 'memory_fallback',
    productionReady: isDbAvailable(),
    records,
  }
}
