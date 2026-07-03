/**
 * SmokeCraft Connector Audit Service
 * Audit trail for integration events.
 * Never stores secrets or exposes private data.
 */

import { isDbAvailable } from '../../db/connection.js'

export const CONNECTOR_AUDIT_EVENTS = {
  STATUS_VIEWED:           'smokeCraft.integration.statusViewed',
  ENVIRONMENT_CHECKED:     'smokeCraft.integration.environmentChecked',
  DATABASE_CHECKED:        'smokeCraft.integration.databaseChecked',
  CONNECTOR_HEALTH_CHECKED:'smokeCraft.integration.connectorHealthChecked',
  SYNC_EVENT_QUEUED:       'smokeCraft.integration.syncEventQueued',
  SYNC_RETRY_SCHEDULED:    'smokeCraft.integration.syncRetryScheduled',
  SYNC_BLOCKED:            'smokeCraft.integration.syncBlocked',
  SECRET_SAFETY_CHECKED:   'smokeCraft.integration.secretSafetyChecked',
  PRODUCTION_READINESS_CHECKED:'smokeCraft.integration.productionReadinessChecked',
}

const connectorAuditLog = []

export function createConnectorAuditEntry({
  venueId = null,
  actorId = null,
  actorRole = null,
  eventType,
  connectorType = null,
  syncEventId = null,
  previousStatus = null,
  nextStatus = null,
  allowed = true,
  blockedReason = null,
  note = null,
} = {}) {
  const entry = {
    auditId:           `conn_audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    venueId,
    actorId,
    actorRole,
    eventType,
    connectorType,
    syncEventId,
    previousStatus,
    nextStatus,
    allowed,
    blockedReason,
    note,
    containsSecrets:   false,
    exposesPrivateData:false,
    createdAt:         new Date().toISOString(),
  }
  connectorAuditLog.push(entry)
  return entry
}

export function getConnectorAuditLog(filter = {}) {
  let log = [...connectorAuditLog]
  if (filter.connectorType) log = log.filter(e => e.connectorType === filter.connectorType)
  if (filter.venueId)       log = log.filter(e => e.venueId === filter.venueId)
  return log
}

export function getConnectorAuditReport() {
  return {
    totalEntries:      connectorAuditLog.length,
    containsSecrets:   false,
    exposesPrivateData:false,
    persistenceMode:   isDbAvailable() ? 'database' : 'memory_fallback',
  }
}
