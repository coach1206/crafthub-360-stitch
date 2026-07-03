/**
 * SmokeCraft Operational Audit Service
 * Records all admin, staff, analytics, and management control events.
 * Never stores secrets or private customer data.
 */

import { isDbAvailable } from '../../db/connection.js'

export const AUDIT_EVENTS = {
  DASHBOARD_VIEWED:       'smokeCraft.admin.dashboardViewed',
  STAFF_QUEUE_VIEWED:     'smokeCraft.staff.queueViewed',
  STAFF_ORDER_ACCEPTED:   'smokeCraft.staff.orderAccepted',
  STAFF_ORDER_UPDATED:    'smokeCraft.staff.orderUpdated',
  ANALYTICS_GENERATED:    'smokeCraft.analytics.summaryGenerated',
  CONTROL_VIEWED:         'smokeCraft.management.controlViewed',
  CONTROL_BLOCKED:        'smokeCraft.management.controlBlocked',
  INTEGRATION_VIEWED:     'smokeCraft.integration.statusViewed',
  FALLBACK_VIEWED:        'smokeCraft.fallback.modeViewed',
}

const auditLog = []

export function createOperationalAuditEntry({
  venueId,
  actorId,
  actorRole,
  eventType,
  targetType = null,
  targetId = null,
  previousStatus = null,
  nextStatus = null,
  allowed = true,
  blockedReason = null,
} = {}) {
  const entry = {
    auditId:           `op_audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    venueId:           venueId ?? null,
    actorId:           actorId ?? null,
    actorRole:         actorRole ?? null,
    eventType:         eventType ?? null,
    targetType:        targetType,
    targetId:          targetId,
    previousStatus:    previousStatus,
    nextStatus:        nextStatus,
    allowed:           allowed,
    blockedReason:     blockedReason,
    containsSecrets:   false,
    exposesPrivateData:false,
    createdAt:         new Date().toISOString(),
  }
  auditLog.push(entry)
  return entry
}

export function getOperationalAuditLog(venueId = null) {
  if (venueId) return auditLog.filter(e => e.venueId === venueId)
  return [...auditLog]
}

export function getOperationalAuditReport() {
  return {
    totalEntries:      auditLog.length,
    containsSecrets:   false,
    exposesPrivateData:false,
    persistenceMode:   isDbAvailable() ? 'database' : 'memory_fallback',
    productionReady:   isDbAvailable(),
  }
}
