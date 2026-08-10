/**
 * SmokeCraft Ordering Contract
 * Defines the canonical order shape for both customer self-order
 * and staff-assisted order modes.
 *
 * Honest status: POS360 sync requires an active adapter connection.
 * If POS360 is unavailable, syncStatus returns "not_connected".
 */

export const ORDER_MODES = {
  CUSTOMER_SELF_ORDER: 'customer_self_order',
  STAFF_ASSISTED_ORDER: 'staff_assisted_order',
}

export const ORDER_STATUSES = {
  DRAFT: 'draft',
  REQUESTED: 'requested',
  SENT_TO_STAFF: 'sent_to_staff',
  ACCEPTED_BY_STAFF: 'accepted_by_staff',
  SENT_TO_POS: 'sent_to_pos',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  UNAVAILABLE: 'unavailable',
  DEMO_ONLY: 'demo_only',
}

export const SYNC_STATUSES = {
  NOT_CONNECTED: 'not_connected',
  PENDING: 'pending',
  SYNCED: 'synced',
  FAILED: 'failed',
  DEMO_ONLY: 'demo_only',
}

/**
 * Creates an empty SmokeCraft order payload with honest defaults.
 */
export function createSmokeCraftOrder(overrides = {}) {
  return {
    orderId: null,
    venueId: null,
    userId: null,
    sessionId: null,
    visitId: null,
    tableId: null,
    serverId: null,
    orderMode: ORDER_MODES.CUSTOMER_SELF_ORDER,
    orderStatus: ORDER_STATUSES.DRAFT,
    items: [],
    pairingRecommendations: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sourceModule: 'smokecraft-experience',
    targetSystem: null,
    syncStatus: SYNC_STATUSES.NOT_CONNECTED,
    demoMode: true,
    ...overrides,
  }
}

/**
 * Returns an honest POS-unavailable response when POS360 is not connected.
 */
export function buildPosUnavailableResponse(orderId) {
  return {
    orderId,
    syncStatus: SYNC_STATUSES.NOT_CONNECTED,
    orderStatus: ORDER_STATUSES.REQUESTED,
    message: 'Order request captured. POS360 connection is not active in this environment.',
    pos_connected: false,
    preview_only: true,
  }
}

/**
 * Validates that an order payload has required fields.
 */
export function validateOrderPayload(payload) {
  const missing = []
  if (!payload.venueId) missing.push('venueId')
  if (!payload.userId) missing.push('userId')
  if (!payload.orderMode) missing.push('orderMode')
  if (!payload.items || payload.items.length === 0) missing.push('items')
  return {
    valid: missing.length === 0,
    missing,
  }
}

export const ORDER_CONTRACT_VERSION = '0.1.0'
