/**
 * SmokeCraft E.A.T. Sync Bridge Service
 * Bridges SmokeCraft order and management events to E.A.T. Command Hub.
 * Returns honest not_connected status when E.A.T. is unavailable.
 * Never invents E.A.T. success.
 */

const _lastSyncResults = new Map()
const _syncEventLog = []

export const EAT_SYNC_EVENTS = {
  ORDER_CREATED:       'smokeCraft.order.created',
  STAFF_REQUESTED:     'smokeCraft.order.staffRequested',
  ACCEPTED_BY_STAFF:   'smokeCraft.order.acceptedByStaff',
  STATUS_UPDATED:      'smokeCraft.order.statusUpdated',
  POS_SEND_ATTEMPTED:  'smokeCraft.order.posSendAttempted',
  ORDER_COMPLETED:     'smokeCraft.order.completed',
  ORDER_CANCELLED:     'smokeCraft.order.cancelled',
  MENU_LOADED:         'smokeCraft.menu.loaded',
  MENU_FALLBACK_USED:  'smokeCraft.menu.fallbackUsed',
}

export function getEatSyncStatus() {
  return {
    connected: false,
    syncStatus: 'not_connected',
    managementSyncStatus: 'preview_only',
    message: 'E.A.T. is not connected in this environment. Management sync remains preview-only.',
    preview_only: true,
  }
}

export function canSyncToEAT() {
  return false
}

/**
 * Emits an E.A.T. management sync event.
 * Queued locally when E.A.T. is not connected.
 */
export async function syncSmokeCraftOrderToEAT(order, eventType) {
  const entry = {
    eventId: `sc-eat-${Date.now()}`,
    eventType: eventType ?? EAT_SYNC_EVENTS.STATUS_UPDATED,
    orderId: order.orderId,
    venueId: order.venueId,
    orderStatus: order.orderStatus,
    eatSyncStatus: 'not_connected',
    managementSyncStatus: 'preview_only',
    message: 'E.A.T. is not connected. Event queued locally only.',
    queuedAt: new Date().toISOString(),
    preview_only: true,
  }
  _syncEventLog.push(entry)
  _lastSyncResults.set(order.orderId, entry)
  return entry
}

/**
 * Emits a menu activity event to E.A.T.
 */
export async function syncSmokeCraftMenuActivityToEAT(payload) {
  const entry = {
    eventId: `sc-eat-menu-${Date.now()}`,
    eventType: payload.fallback ? EAT_SYNC_EVENTS.MENU_FALLBACK_USED : EAT_SYNC_EVENTS.MENU_LOADED,
    venueId: payload.venueId,
    eatSyncStatus: 'not_connected',
    managementSyncStatus: 'preview_only',
    queuedAt: new Date().toISOString(),
    preview_only: true,
  }
  _syncEventLog.push(entry)
  return entry
}

/**
 * Emits a staff activity event to E.A.T.
 */
export async function syncSmokeCraftStaffActivityToEAT(payload) {
  const entry = {
    eventId: `sc-eat-staff-${Date.now()}`,
    eventType: payload.eventType ?? EAT_SYNC_EVENTS.STATUS_UPDATED,
    serverId: payload.serverId,
    eatSyncStatus: 'not_connected',
    managementSyncStatus: 'preview_only',
    queuedAt: new Date().toISOString(),
    preview_only: true,
  }
  _syncEventLog.push(entry)
  return entry
}

export function getLastEatSyncResult(orderId) {
  return _lastSyncResults.get(orderId) ?? {
    orderId,
    eatSyncStatus: 'no_attempt',
    message: 'No E.A.T. sync attempt found for this order.',
  }
}

export function getEatSyncEventLog() {
  return [..._syncEventLog]
}

export function buildEatSyncBridgeReport() {
  return {
    eatConnected: false,
    canSyncToEAT: false,
    syncStatus: 'not_connected',
    managementSyncStatus: 'preview_only',
    queuedEvents: _syncEventLog.length,
    preview_only: true,
  }
}
