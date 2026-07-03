/**
 * SmokeCraft Order Audit Service
 * Records an immutable audit trail for all order status changes.
 * Audit entries never contain secrets or private user data.
 */

let _auditLog = []
let _auditIdCounter = 1

function newAuditId() {
  return `sc-audit-${Date.now()}-${_auditIdCounter++}`
}

export const AUDIT_EVENTS = {
  ORDER_CREATED:          'smokeCraft.order.created',
  STAFF_REQUESTED:        'smokeCraft.order.staffRequested',
  ACCEPTED_BY_STAFF:      'smokeCraft.order.acceptedByStaff',
  STATUS_UPDATED:         'smokeCraft.order.statusUpdated',
  POS_SEND_ATTEMPTED:     'smokeCraft.order.posSendAttempted',
  ORDER_COMPLETED:        'smokeCraft.order.completed',
  ORDER_CANCELLED:        'smokeCraft.order.cancelled',
  MENU_LOADED:            'smokeCraft.menu.loaded',
  MENU_FALLBACK_USED:     'smokeCraft.menu.fallbackUsed',
  EAT_SYNC_ATTEMPTED:     'smokeCraft.eatSync.attempted',
  EAT_SYNC_NOT_CONNECTED: 'smokeCraft.eatSync.notConnected',
}

/**
 * Creates an audit entry. Does not log secrets or private user data.
 */
export function createAuditEntry({
  orderId,
  eventType,
  actorRole,
  actorId,
  previousStatus,
  nextStatus,
  message,
  syncStatus = 'not_connected',
}) {
  const entry = {
    auditId: newAuditId(),
    orderId: orderId ?? null,
    eventType,
    actorRole: actorRole ?? 'system',
    actorId: actorId ?? null,
    previousStatus: previousStatus ?? null,
    nextStatus: nextStatus ?? null,
    message: message ?? '',
    createdAt: new Date().toISOString(),
    syncStatus,
  }
  _auditLog.push(entry)
  return entry
}

export function getAuditTrailForOrder(orderId) {
  return _auditLog.filter(e => e.orderId === orderId)
}

export function getAllAuditEntries() {
  return [..._auditLog]
}

export function buildAuditServiceReport() {
  return {
    totalEntries: _auditLog.length,
    persistenceMode: 'memory_fallback',
    productionReady: false,
  }
}
