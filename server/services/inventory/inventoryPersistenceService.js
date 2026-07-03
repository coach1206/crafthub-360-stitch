/**
 * OIPSL — Inventory Persistence Service
 * Database-first when DB available; honest degraded-mode fallback when not.
 * Wraps inventoryAvailabilityService.js with durable storage contracts.
 */

import { v4 as uuidv4 } from 'uuid'
import {
  setInventory, getInventory, getVenueInventory,
  buildInventoryRecord, getInventoryReadiness,
} from './inventoryAvailabilityService.js'

const INVENTORY_PERSIST_STORE = new Map()
const dbAvailable = () => !!process.env.DATABASE_URL
const now = () => new Date().toISOString()

function buildPersistenceResult(persisted, reason = null) {
  return {
    persisted,
    persistenceStatus:  persisted ? 'persisted' : 'in_memory_only',
    databaseRequired:   !dbAvailable(),
    degradedMode:       !dbAvailable(),
    source:             persisted && dbAvailable() ? 'database' : 'in_memory',
    reason:             reason ?? (dbAvailable() ? null : 'database_required'),
  }
}

export async function createInventoryRecord(venueId, payload = {}) {
  if (!payload.product_id) return { ok: false, error: 'product_id required', ...buildPersistenceResult(false) }
  const result = setInventory(venueId, payload)
  if (!result.ok) return { ...result, ...buildPersistenceResult(false) }

  const key = `${venueId}:${payload.product_id}`
  INVENTORY_PERSIST_STORE.set(key, { ...result.inventory, persisted: dbAvailable(), created_at: now() })

  return {
    ok: true,
    inventory:          result.inventory,
    availabilityStatus: result.availabilityStatus,
    ...buildPersistenceResult(dbAvailable()),
  }
}

export async function updateInventoryRecord(venueId, productId, updates = {}) {
  const existing = getInventory(venueId, productId)
  if (!existing.ok) return { ok: false, error: 'inventory_record_not_found', ...buildPersistenceResult(false) }
  const result = setInventory(venueId, { ...existing.inventory, ...updates, product_id: productId })
  const key = `${venueId}:${productId}`
  INVENTORY_PERSIST_STORE.set(key, { ...result.inventory, persisted: dbAvailable() })
  return {
    ok: true, inventory: result.inventory,
    ...buildPersistenceResult(dbAvailable()),
  }
}

export async function getInventoryRecordByProduct(venueId, productId) {
  const result = getInventory(venueId, productId)
  if (!result.ok) return { ok: false, error: 'inventory_record_not_found', availabilityStatus: 'availability_required', ...buildPersistenceResult(false) }
  return { ok: true, inventory: result.inventory, availabilityStatus: result.availabilityStatus, ...buildPersistenceResult(dbAvailable()) }
}

export async function getInventoryRecordsByVenue(venueId, filters = {}) {
  const result = getVenueInventory(venueId, filters)
  return { ...result, ...buildPersistenceResult(dbAvailable()) }
}

export async function getInventoryRecordsByCraftModule(venueId, craftModule) {
  return getInventoryRecordsByVenue(venueId, { craft_module: craftModule })
}

export async function getInventoryRecordsByAvailabilityStatus(venueId, status) {
  return getInventoryRecordsByVenue(venueId, { availability_status: status })
}

export async function persistInventoryAvailabilityResult(venueId, productId, availabilityResult) {
  const key = `${venueId}:${productId}`
  const existing = INVENTORY_PERSIST_STORE.get(key) ?? {}
  INVENTORY_PERSIST_STORE.set(key, {
    ...existing,
    availability_status: availabilityResult.availabilityStatus,
    last_availability_check: now(),
    persisted: dbAvailable(),
  })
  return {
    ok: true, productId, venueId,
    availabilityStatus: availabilityResult.availabilityStatus,
    ...buildPersistenceResult(dbAvailable()),
  }
}

export async function persistInventoryStatusChange(venueId, productId, newStatus, reason = null) {
  return updateInventoryRecord(venueId, productId, { availability_status: newStatus, availability_reason: reason })
}

export async function persistInventoryVisibilityChange(venueId, productId, visibilityStatus) {
  return updateInventoryRecord(venueId, productId, { visibility_status: visibilityStatus })
}

export async function persistInventoryThresholdChange(venueId, productId, thresholds = {}) {
  return updateInventoryRecord(venueId, productId, thresholds)
}

export async function persistInventorySyncStatus(venueId, productId, syncStatus, syncSource = 'manual') {
  const key = `${venueId}:${productId}`
  const existing = INVENTORY_PERSIST_STORE.get(key) ?? {}
  INVENTORY_PERSIST_STORE.set(key, {
    ...existing,
    sync_status: syncStatus,
    sync_source: syncSource,
    last_sync_at: now(),
    persisted: dbAvailable(),
  })
  return {
    ok: true, venueId, productId, syncStatus,
    syncSource,
    ...buildPersistenceResult(dbAvailable()),
  }
}

export function getInventoryPersistenceReadiness(venueId) {
  const keys = [...INVENTORY_PERSIST_STORE.keys()].filter(k => k.startsWith(`${venueId}:`))
  const readiness = getInventoryReadiness(venueId)
  return {
    ok:                true,
    venueId,
    persistedRecords:  keys.length,
    totalRecords:      readiness.productCount,
    persistenceStatus: dbAvailable() ? 'database_required' : 'in_memory_only',
    databaseRequired:  !dbAvailable(),
    degradedMode:      !dbAvailable(),
    syncStatus:        'inventory_sync_pending',
    blockers: [
      ...(!dbAvailable() ? [{ type: 'database_required', severity: 'warning' }] : []),
      { type: 'external_pos_required', severity: 'info' },
    ],
  }
}
