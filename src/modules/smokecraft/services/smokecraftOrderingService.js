/**
 * SmokeCraft Ordering Service (module layer)
 * Handles customer self-order and staff-assisted order flows.
 * No POS sync unless the POS360 adapter confirms connection.
 */

import {
  createSmokeCraftOrder,
  validateOrderPayload,
  buildPosUnavailableResponse,
  ORDER_MODES,
  ORDER_STATUSES,
  SYNC_STATUSES,
} from '../data/smokecraftOrderingContract.js'

let _orderStore = []

/**
 * Creates a new customer self-order request.
 */
export function createCustomerSelfOrder(payload) {
  const validation = validateOrderPayload(payload)
  if (!validation.valid) {
    return { error: 'invalid_payload', missing: validation.missing }
  }
  const order = createSmokeCraftOrder({
    ...payload,
    orderMode: ORDER_MODES.CUSTOMER_SELF_ORDER,
    orderStatus: ORDER_STATUSES.REQUESTED,
  })
  _orderStore.push(order)
  return { ...order, ...buildPosUnavailableResponse(order.orderId) }
}

/**
 * Creates a staff-assisted order request.
 */
export function createStaffAssistedOrder(payload) {
  const validation = validateOrderPayload(payload)
  if (!validation.valid) {
    return { error: 'invalid_payload', missing: validation.missing }
  }
  const order = createSmokeCraftOrder({
    ...payload,
    orderMode: ORDER_MODES.STAFF_ASSISTED_ORDER,
    orderStatus: ORDER_STATUSES.SENT_TO_STAFF,
  })
  _orderStore.push(order)
  return {
    ...order,
    syncStatus: SYNC_STATUSES.NOT_CONNECTED,
    message: 'Order sent to staff queue. POS360 sync requires active connection.',
  }
}

/**
 * Updates an order status.
 */
export function updateOrderStatus(orderId, status) {
  const order = _orderStore.find(o => o.orderId === orderId)
  if (!order) return { error: 'order_not_found', orderId }
  order.orderStatus = status
  order.updatedAt = new Date().toISOString()
  return { ...order, synced: false, syncStatus: SYNC_STATUSES.NOT_CONNECTED }
}

/**
 * Returns all pending order requests.
 */
export function getPendingOrders() {
  return _orderStore.filter(o =>
    [ORDER_STATUSES.REQUESTED, ORDER_STATUSES.SENT_TO_STAFF].includes(o.orderStatus)
  )
}

export function buildOrderingServiceReport() {
  return {
    moduleId: 'smokecraft-experience',
    customerSelfOrderSupported: true,
    staffAssistedOrderSupported: true,
    pos360Connected: false,
    totalOrders: _orderStore.length,
    pendingOrders: getPendingOrders().length,
    syncStatus: SYNC_STATUSES.NOT_CONNECTED,
    preview_only: true,
    message: 'Ordering service is active in demo mode. POS360 sync requires Module Build 3 connection.',
  }
}
