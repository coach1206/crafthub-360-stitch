/**
 * POS360 Order Bridge Service
 * Routes SmokeCraft orders to POS providers or manual_pos360 fallback.
 * Idempotency-protected. Never claims order_sync_pending success without real provider confirmation.
 */
import crypto from 'node:crypto'
import { isDbAvailable, query } from '../db/connection.js'

// In-memory idempotency store
const idempotencyStore = new Map()
// In-memory order bridge log
const bridgeLogs = []

export function generateIdempotencyKey(venueId, orderPayload) {
  const str = JSON.stringify({ venueId, orderId: orderPayload.orderId, items: orderPayload.items })
  return crypto.createHash('sha256').update(str).digest('hex').slice(0, 40)
}

export async function preventDuplicateOrderPush(venueId, idempotencyKey) {
  const record = idempotencyStore.get(`${venueId}::${idempotencyKey}`)
  if (record) {
    return { duplicate: true, status: 'idempotency_conflict', previousResponse: record.response }
  }
  return { duplicate: false }
}

export async function logOrderBridgeAttempt(payload) {
  const entry = { ...payload, loggedAt: new Date().toISOString(), id: `bridge-${Date.now()}` }
  bridgeLogs.push(entry)

  if (isDbAvailable()) {
    try {
      await query(
        `INSERT INTO pos_order_sync_logs (venue_id, provider_name, smokecraft_order_id, idempotency_key, order_payload_json, sync_status)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [payload.venueId, payload.providerName, payload.orderId, payload.idempotencyKey,
         JSON.stringify(payload.orderPayload), payload.syncStatus ?? 'order_sync_pending']
      )
    } catch { /* preview fallback */ }
  }

  return { ok: true, status: 'audit_logged', storageMode: isDbAvailable() ? 'postgres' : 'memory_fallback' }
}

export function prepareSmokeCraftOrderForPOS(orderPayload) {
  const { orderId, venueId, items = [], staffId, tableLabel, orderMode } = orderPayload
  return {
    pos360OrderId: orderId ?? `order-${Date.now()}`,
    venueId,
    items: items.map(i => ({
      smokecraftItemId: i.id ?? i.item_id,
      name: i.name ?? i.item_name,
      quantity: i.quantity ?? 1,
      unitPrice: i.price ?? i.unit_price ?? 0,
      type: i.type ?? i.item_type,
      partnerItemId: i.partnerId ? `${i.partnerId}::${i.id}` : null,
    })),
    staffId,
    tableLabel,
    orderMode: orderMode ?? 'customer_self_order',
    preparedAt: new Date().toISOString(),
  }
}

export async function validatePOSReadiness(venueId, providerName, orderPayload) {
  const { getProviderReadiness } = await import('../config/posProviderConfig.js')
  const readiness = getProviderReadiness(providerName)

  if (providerName === 'manual_pos360') {
    return { ready: true, mode: 'manual_mode' }
  }

  if (readiness.readinessStatus !== 'ready') {
    return { ready: false, status: readiness.readinessStatus, message: `Provider ${providerName} not ready: ${readiness.readinessStatus}` }
  }

  // Check item mappings
  const { validateOrderMappings } = await import('./pos360ItemMappingService.js')
  const mappingCheck = await validateOrderMappings(venueId, providerName, orderPayload)
  if (!mappingCheck.valid) {
    return { ready: false, status: 'mapping_required', unmappedItems: mappingCheck.unmappedItems }
  }

  return { ready: true, mode: 'provider_mode' }
}

export async function routeOrderToProvider(venueId, providerName, orderPayload) {
  const idempotencyKey = generateIdempotencyKey(venueId, orderPayload)
  const dupCheck = await preventDuplicateOrderPush(venueId, idempotencyKey)
  if (dupCheck.duplicate) {
    return { ok: false, status: 'idempotency_conflict', idempotencyKey, message: 'Duplicate order push blocked.' }
  }

  const readinessCheck = await validatePOSReadiness(venueId, providerName, orderPayload)
  if (!readinessCheck.ready) {
    await logOrderBridgeAttempt({ venueId, providerName, orderId: orderPayload.orderId, idempotencyKey, orderPayload, syncStatus: readinessCheck.status })
    if (providerName !== 'manual_pos360') {
      return {
        ok: false,
        status: readinessCheck.status ?? 'provider_not_connected',
        manualModeAvailable: true,
        message: 'Order routing blocked. Use manual_pos360 fallback.',
        idempotencyKey,
      }
    }
  }

  if (providerName === 'manual_pos360' || readinessCheck.mode === 'manual_mode') {
    return routeOrderToManualPOS360(venueId, orderPayload)
  }

  // Real provider path (future implementation)
  const { createProviderOrder } = await import('./pos360IntegrationHub.js')
  const result = await createProviderOrder(venueId, providerName, orderPayload)

  idempotencyStore.set(`${venueId}::${idempotencyKey}`, { response: result, usedAt: new Date().toISOString() })
  await logOrderBridgeAttempt({ venueId, providerName, orderId: orderPayload.orderId, idempotencyKey, orderPayload, syncStatus: result.syncStatus ?? 'order_sync_pending' })

  return { ok: true, idempotencyKey, ...result }
}

export async function routeOrderToManualPOS360(venueId, orderPayload) {
  const idempotencyKey = generateIdempotencyKey(venueId, orderPayload)
  const prepared = prepareSmokeCraftOrderForPOS(orderPayload)

  const ticketId = `manual-${Date.now()}`
  const ticket = {
    ticketId,
    venueId,
    order: prepared,
    status: 'manual_mode',
    routingStation: 'server_pickup',
    customerVisibleStatus: 'pending',
    createdAt: new Date().toISOString(),
  }

  idempotencyStore.set(`${venueId}::${idempotencyKey}`, { response: ticket, usedAt: new Date().toISOString() })
  await logOrderBridgeAttempt({ venueId, providerName: 'manual_pos360', orderId: orderPayload.orderId, idempotencyKey, orderPayload, syncStatus: 'manual_mode' })

  return {
    ok: true,
    status: 'manual_mode',
    ticketId,
    ticket,
    idempotencyKey,
    message: 'Manual POS360 ticket created. No live POS provider required.',
  }
}

export async function getOrderBridgeStatus(venueId, orderId) {
  const logs = bridgeLogs.filter(l => l.venueId === venueId && l.orderId === orderId)
  return {
    ok: true,
    venueId,
    orderId,
    bridgeLogs: logs,
    storageMode: 'memory_fallback',
  }
}
