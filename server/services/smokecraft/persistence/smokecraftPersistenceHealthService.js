/**
 * SmokeCraft Persistence Health Service
 */

import { isDbAvailable } from '../../../db/connection.js'
import { CRITICAL_AREAS, getAllAreasStatus } from './smokecraftPersistenceRegistry.js'

export function getPersistenceHealthReport() {
  const dbUp    = isDbAvailable()
  const areas   = getAllAreasStatus()
  const dbVerif = areas.filter(a => a.databaseVerified).length
  const memFall = areas.filter(a => a.usesMemoryFallback).length
  const blocked = areas.filter(a => a.currentPersistenceMode === 'blocked').length
  const critMem = CRITICAL_AREAS.filter(() => !dbUp)

  const criticalWarnings = []
  if (!dbUp) {
    criticalWarnings.push('No DATABASE_URL — all critical operational data is memory-only.')
  } else {
    criticalWarnings.push('DATABASE_URL detected but database persistence is not verified. Apply migration 029.')
  }

  return {
    healthId:               'smokecraft-persistence-health-v1',
    databaseConfigured:     dbUp,
    databaseVerified:       false,
    overallPersistenceMode: dbUp ? 'database_config_detected' : 'memory_fallback',
    productionReady:        false,
    areasTotal:             areas.length,
    areasDatabaseVerified:  dbVerif,
    areasMemoryFallback:    memFall,
    areasBlocked:           blocked,
    criticalAreasMemoryFallback: critMem,
    criticalWarnings,
    nextRequiredActions: dbUp ? [
      'Apply migration 029 (server/db/migrations/029_smokecraft_persistence_hardening.sql)',
      'Run npm run db:migrate to apply all pending migrations',
      'Verify each SmokeCraft table was created with SELECT COUNT(*) from each table',
      'Update databaseVerified flags in persistence registry after verification',
    ] : [
      'Configure DATABASE_URL in production environment',
      'Apply all pending migrations via npm run db:migrate',
      'Verify SmokeCraft table creation',
    ],
    checkedAt: new Date().toISOString(),
  }
}

export function isCriticalAreaMemoryFallback() {
  return !isDbAvailable()
}

export function getProductionReadiness() {
  return {
    productionReady:  false,
    blockedReasons:   [
      'database_persistence_not_verified',
      ...(!isDbAvailable() ? ['database_url_not_configured'] : ['migration_029_not_confirmed_applied']),
    ],
  }
}
