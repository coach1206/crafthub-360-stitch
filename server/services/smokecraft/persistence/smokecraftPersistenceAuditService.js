/**
 * SmokeCraft Persistence Audit Service
 * containsSecrets: false, exposesPrivateData: false always.
 * DATABASE_URL is never logged.
 */

import { randomUUID } from 'node:crypto'
import { isDbAvailable, query } from '../../../db/connection.js'

export const PERSISTENCE_AUDIT_EVENTS = {
  HEALTH_CHECKED:          'smokeCraft.persistence.healthChecked',
  AREA_REVIEWED:           'smokeCraft.persistence.areaReviewed',
  DB_CONFIG_DETECTED:      'smokeCraft.persistence.databaseConfigDetected',
  MEMORY_FALLBACK_DETECTED: 'smokeCraft.persistence.memoryFallbackDetected',
  MIGRATION_PLAN_CREATED:  'smokeCraft.persistence.migrationPlanCreated',
  DATABASE_VERIFIED:       'smokeCraft.persistence.databaseVerified',
  PRODUCTION_BLOCKED:      'smokeCraft.persistence.productionBlocked',
}

const _memoryLog = []

function buildEntry(eventType, areaId, extra = {}) {
  return {
    auditId:               randomUUID(),
    areaId:                areaId ?? 'global',
    eventType,
    previousPersistenceMode: extra.previousMode ?? null,
    nextPersistenceMode:     extra.nextMode ?? null,
    databaseConfigured:    isDbAvailable(),
    databaseVerified:      false,
    productionReady:       false,
    containsSecrets:       false,
    exposesPrivateData:    false,
    createdAt:             new Date().toISOString(),
  }
}

export async function logPersistenceEvent(eventType, areaId = null, extra = {}) {
  const entry = buildEntry(eventType, areaId, extra)
  _memoryLog.push(entry)

  if (isDbAvailable()) {
    try {
      await query(
        `INSERT INTO smokecraft_persistence_audit
          (audit_id, area_id, event_type, previous_persistence_mode, next_persistence_mode,
           database_configured, database_verified, production_ready,
           contains_secrets, exposes_private_data, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          entry.auditId, entry.areaId, entry.eventType,
          entry.previousPersistenceMode, entry.nextPersistenceMode,
          entry.databaseConfigured, entry.databaseVerified, entry.productionReady,
          entry.containsSecrets, entry.exposesPrivateData, entry.createdAt,
        ]
      )
    } catch {
      // DB write failed — audit entry stays in memory
    }
  }

  return entry
}

export function getPersistenceAuditLog(limit = 50) {
  return {
    entries:         _memoryLog.slice(-limit).reverse(),
    totalEntries:    _memoryLog.length,
    containsSecrets: false,
    exposesPrivateData: false,
    persistenceMode: isDbAvailable() ? 'database_config_detected' : 'memory_fallback',
  }
}
