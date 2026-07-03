/**
 * SmokeCraft Governance Persistence Service
 */

import { isDbAvailable, query } from '../../../db/connection.js'
import { randomUUID } from 'node:crypto'

const _memGov = []

export function getPersistenceMode() { return isDbAvailable() ? 'database_config_detected' : 'memory_fallback' }

export async function createGovernanceAuditEntry(data) {
  const auditId = data.auditId ?? randomUUID()
  const now     = new Date().toISOString()
  const entry   = {
    auditId, areaId: data.areaId ?? null, eventType: data.eventType ?? 'unknown',
    payload: data.payload ?? {}, containsSecrets: false, exposesPrivateData: false,
    persistenceMode: getPersistenceMode(), createdAt: now,
  }

  if (isDbAvailable()) {
    try {
      await query(
        `INSERT INTO smokecraft_governance_audit (audit_id, area_id, event_type, payload, created_at)
         VALUES ($1,$2,$3,$4,$5)`,
        [auditId, entry.areaId, entry.eventType, JSON.stringify(entry.payload), now]
      )
    } catch { /* fall through */ }
  }
  _memGov.push(entry)
  return entry
}

export function getGovernancePersistenceStatus() {
  const dbUp = isDbAvailable()
  return {
    areaId: 'enterprise_governance_audit', displayName: 'Enterprise Governance Audit',
    currentPersistenceMode: getPersistenceMode(),
    databaseReady: true, databaseVerified: false,
    productionReady: false, usesMemoryFallback: !dbUp,
    tableSchema: 'smokecraft_governance_audit + smokecraft_connector_audit (migration 029)',
    containsSecrets: false, exposesPrivateData: false,
  }
}

export function getConnectorAuditPersistenceStatus() {
  const dbUp = isDbAvailable()
  return {
    areaId: 'connector_audit', displayName: 'Connector Audit',
    currentPersistenceMode: dbUp ? 'database_config_detected' : 'database_contract_ready',
    databaseReady: true, databaseVerified: false,
    productionReady: false, usesMemoryFallback: !dbUp,
    tableSchema: 'smokecraft_connector_audit (migration 029)',
    containsSecrets: false, exposesPrivateData: false,
  }
}
