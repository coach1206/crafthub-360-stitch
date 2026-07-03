/**
 * SmokeCraft Order Store
 * Honest dual-mode persistence: database when DATABASE_URL is configured,
 * in-memory fallback otherwise. Never claims production-ready in fallback mode.
 */

import { isDbAvailable, query } from '../../db/connection.js'

const _memoryStore = new Map()
let _idCounter = 1

const dbAvailable = () => isDbAvailable()

function newOrderId() {
  return `sc-order-${Date.now()}-${_idCounter++}`
}

export function getPersistenceMode() {
  return dbAvailable() ? 'database' : 'memory_fallback'
}

export function isProductionReady() {
  return dbAvailable()
}

/**
 * Creates and stores a new order record.
 */
export async function createOrder(data) {
  const orderId = data.orderId ?? newOrderId()
  const now = new Date().toISOString()
  const record = {
    orderId,
    venueId: data.venueId ?? null,
    userId: data.userId ?? null,
    sessionId: data.sessionId ?? null,
    visitId: data.visitId ?? null,
    tableId: data.tableId ?? null,
    serverId: data.serverId ?? null,
    orderMode: data.orderMode,
    orderStatus: data.orderStatus ?? 'draft',
    items: data.items ?? [],
    pairingRecommendations: data.pairingRecommendations ?? [],
    customerNotes: data.customerNotes ?? '',
    staffNotes: data.staffNotes ?? '',
    sourceModule: 'smokecraft-experience',
    targetSystem: data.targetSystem ?? null,
    syncStatus: 'not_connected',
    posSyncStatus: 'not_connected',
    eatSyncStatus: 'not_connected',
    persistenceMode: getPersistenceMode(),
    productionReady: isProductionReady(),
    createdAt: now,
    updatedAt: now,
    auditTrail: [],
  }

  if (dbAvailable()) {
    try {
      await query(
        `INSERT INTO smokecraft_orders (order_id, venue_id, user_id, session_id, visit_id,
          table_id, server_id, order_mode, order_status, items, pairing_recommendations,
          customer_notes, staff_notes, source_module, target_system, sync_status,
          pos_sync_status, eat_sync_status, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`,
        [record.orderId, record.venueId, record.userId, record.sessionId, record.visitId,
         record.tableId, record.serverId, record.orderMode, record.orderStatus,
         JSON.stringify(record.items), JSON.stringify(record.pairingRecommendations),
         record.customerNotes, record.staffNotes, record.sourceModule, record.targetSystem,
         record.syncStatus, record.posSyncStatus, record.eatSyncStatus,
         record.createdAt, record.updatedAt]
      )
    } catch {
      // DB write failed — fall through to memory store
    }
  }

  _memoryStore.set(orderId, record)
  return record
}

/**
 * Returns an order by ID.
 */
export async function getOrder(orderId) {
  return _memoryStore.get(orderId) ?? null
}

/**
 * Updates order fields and bumps updatedAt.
 */
export async function updateOrder(orderId, patch) {
  const existing = _memoryStore.get(orderId)
  if (!existing) return null
  const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() }
  _memoryStore.set(orderId, updated)
  return updated
}

/**
 * Returns all orders matching a filter predicate.
 */
export function queryOrders(predicate) {
  return [..._memoryStore.values()].filter(predicate)
}

export function buildOrderStoreReport() {
  return {
    persistenceMode: getPersistenceMode(),
    productionReady: isProductionReady(),
    totalOrders: _memoryStore.size,
    databaseAvailable: dbAvailable(),
  }
}
