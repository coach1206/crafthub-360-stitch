/**
 * SmokeCraft Integration Controller
 * Handles /api/modules/smokecraft/integrations/* routes.
 * Never exposes secret values. Always reports honest connection state.
 */

import { getIntegrationSystemStatus, getProductionReadinessStatus } from '../services/smokecraft/smokecraftProductionReadinessService.js'
import { getEnvironmentValidationReport } from '../services/smokecraft/smokecraftEnvironmentValidationService.js'
import { getDatabaseReadinessStatus } from '../services/smokecraft/smokecraftDatabaseReadinessService.js'
import { getConnectorRegistry, getConnectorRegistryReport } from '../services/smokecraft/smokecraftProviderConnectorRegistry.js'
import { getIntegrationHealthSummary } from '../services/smokecraft/smokecraftIntegrationHealthService.js'
import {
  getSyncQueueStatus,
  queuePOS360SyncEvent,
  queueEatSyncEvent,
  queuePairingProviderEvent,
  queueVenueMenuSync,
} from '../services/smokecraft/smokecraftProductionSyncQueueService.js'
import { scheduleRetry, attemptRetry } from '../services/smokecraft/smokecraftSyncRetryService.js'
import { getConnectorAuditLog, getConnectorAuditReport } from '../services/smokecraft/smokecraftConnectorAuditService.js'
import { assertNoFrontendSecretExposure } from '../services/smokecraft/smokecraftSecretSafetyService.js'
import { createConnectorAuditEntry, CONNECTOR_AUDIT_EVENTS } from '../services/smokecraft/smokecraftConnectorAuditService.js'

function actorFromReq(req) {
  return {
    actorId:   req.body?.actorId ?? req.query?.actorId ?? null,
    actorRole: req.body?.actorRole ?? req.query?.actorRole ?? null,
  }
}

export function getIntegrationStatus(req, res) {
  const actor = actorFromReq(req)
  createConnectorAuditEntry({ ...actor, eventType: CONNECTOR_AUDIT_EVENTS.STATUS_VIEWED, allowed: true })
  const status = getIntegrationSystemStatus()
  const secretCheck = assertNoFrontendSecretExposure()
  res.json({ ...status, secretSafety: secretCheck })
}

export function getEnvironmentStatus(req, res) {
  const actor = actorFromReq(req)
  createConnectorAuditEntry({ ...actor, eventType: CONNECTOR_AUDIT_EVENTS.ENVIRONMENT_CHECKED, allowed: true })
  const report = getEnvironmentValidationReport()
  // Strip any potential value leaks — only names and presence
  const safeReport = {
    ...report,
    vars: Object.fromEntries(
      Object.entries(report.vars ?? {}).map(([k, v]) => [k, { ...v, value: '[REDACTED]' }])
    ),
  }
  res.json(safeReport)
}

export function getDatabaseStatus(req, res) {
  const actor = actorFromReq(req)
  createConnectorAuditEntry({ ...actor, eventType: CONNECTOR_AUDIT_EVENTS.DATABASE_CHECKED, allowed: true })
  res.json(getDatabaseReadinessStatus())
}

export function getConnectorsStatus(req, res) {
  const actor = actorFromReq(req)
  createConnectorAuditEntry({ ...actor, eventType: CONNECTOR_AUDIT_EVENTS.CONNECTOR_HEALTH_CHECKED, allowed: true })
  const registry = getConnectorRegistry()
  // Strip requiredEnvVars values (names are ok, but no secrets)
  res.json({ connectors: registry, report: getConnectorRegistryReport() })
}

export function getHealthStatus(req, res) {
  const actor = actorFromReq(req)
  res.json(getIntegrationHealthSummary(actor.actorId, actor.actorRole))
}

export function getProductionReadiness(req, res) {
  const actor = actorFromReq(req)
  res.json(getProductionReadinessStatus(actor.actorId, actor.actorRole))
}

export function getSyncEvents(req, res) {
  const status = getSyncQueueStatus()
  res.json(status)
}

export function queueSyncEvent(req, res) {
  const { targetSystem, sourceEventType, payload } = req.body ?? {}
  if (!targetSystem) return res.status(400).json({ error: 'targetSystem required' })

  let event
  switch (targetSystem) {
    case 'pos360':           event = queuePOS360SyncEvent(payload); break
    case 'eat_system':       event = queueEatSyncEvent(payload); break
    case 'pairing_provider': event = queuePairingProviderEvent(payload); break
    case 'venue_menu_provider': event = queueVenueMenuSync(payload?.venueId); break
    default: return res.status(400).json({ error: 'unknown targetSystem' })
  }

  res.json(event)
}

export function retrySyncEvent(req, res) {
  const { syncEventId } = req.params
  const result = attemptRetry(syncEventId)
  res.json(result)
}

export function getAuditLog(req, res) {
  const { connectorType } = req.query
  const log    = getConnectorAuditLog(connectorType ? { connectorType } : {})
  const report = getConnectorAuditReport()
  res.json({ auditLog: log, report })
}
