/**
 * SmokeCraft Persistence Health Service
 */

import { isDbAvailable } from '../../../db/connection.js'
import { CRITICAL_AREAS, getAllAreasStatus, getRegistrySummary } from './smokecraftPersistenceRegistry.js'

// Business-critical: gameplay, loyalty, rewards, pairing persistence.
// These must pass live DB verification before productionReady can be true.
const BUSINESS_CRITICAL_AREAS = [
  'orders', 'staff_queue', 'pairing_profiles', 'flavor_memory',
  'rewards', 'loyalty', 'passport_rewards', 'venue_admin',
]

// Infrastructure-critical: sync pipeline, audit, connector tracking.
const INFRASTRUCTURE_CRITICAL_AREAS = [
  'integration_sync_events', 'production_sync_queue', 'order_audit',
]

export function getPersistenceHealthReport() {
  const dbUp    = isDbAvailable()
  const areas   = getAllAreasStatus()
  const summary = getRegistrySummary()

  const dbVerif = areas.filter(a => a.databaseVerified).length
  const memFall = areas.filter(a => a.usesMemoryFallback).length

  const businessCriticalFailed  = BUSINESS_CRITICAL_AREAS.filter(
    id => !areas.find(a => a.areaId === id)?.databaseVerified
  )
  const infraCriticalFailed     = INFRASTRUCTURE_CRITICAL_AREAS.filter(
    id => !areas.find(a => a.areaId === id)?.databaseVerified
  )
  const allCriticalFailed       = CRITICAL_AREAS.filter(
    id => !areas.find(a => a.areaId === id)?.databaseVerified
  )

  const businessCriticalPassed  = businessCriticalFailed.length === 0
  const infraCriticalPassed     = infraCriticalFailed.length === 0
  const allCriticalPassed       = allCriticalFailed.length === 0

  const criticalWarnings = []
  if (!dbUp) {
    criticalWarnings.push('No DATABASE_URL — all critical operational data is memory-only.')
    criticalWarnings.push('Business-critical areas at risk: ' + BUSINESS_CRITICAL_AREAS.join(', '))
  } else if (!businessCriticalPassed) {
    criticalWarnings.push('DATABASE_URL detected but business-critical areas not verified.')
    criticalWarnings.push('Run verify:smokecraft-database-activation to verify tables.')
    criticalWarnings.push('Unverified business-critical: ' + businessCriticalFailed.join(', '))
  } else if (!allCriticalPassed) {
    criticalWarnings.push('Business-critical areas verified. Infrastructure-critical areas pending.')
    criticalWarnings.push('Unverified infrastructure: ' + infraCriticalFailed.join(', '))
  }

  return {
    healthId:               'smokecraft-persistence-health-v1',
    databaseConfigured:     dbUp,
    databaseVerified:       dbVerif > 0,
    overallPersistenceMode: dbUp ? (dbVerif > 0 ? 'database_verified' : 'database_config_detected') : 'memory_fallback',
    productionReady:        false,  // Always false — requires live DB verification via activation script

    areasTotal:             areas.length,
    areasDatabaseVerified:  dbVerif,
    areasMemoryFallback:    memFall,

    businessCriticalAreas:        BUSINESS_CRITICAL_AREAS,
    businessCriticalPassed,
    businessCriticalFailed,

    infrastructureCriticalAreas:  INFRASTRUCTURE_CRITICAL_AREAS,
    infrastructureCriticalPassed: infraCriticalPassed,
    infrastructureCriticalFailed: infraCriticalFailed,

    allCriticalAreas:       CRITICAL_AREAS,
    allCriticalPassed,
    allCriticalFailed,

    phaseBSafeToStart:      allCriticalPassed && dbVerif > 0,

    criticalWarnings,
    nextRequiredActions: dbUp ? [
      'Run npm run verify:smokecraft-database-activation to perform live table verification',
      'Ensure migration 029 is applied (npm run db:migrate)',
      'All business-critical areas must pass INSERT+SELECT+DELETE tests',
      'All infrastructure-critical areas must pass INSERT+SELECT+DELETE tests',
    ] : [
      'Configure DATABASE_URL in production environment (Railway: Variables tab)',
      'Apply all pending migrations via npm run db:migrate',
      'Run npm run verify:smokecraft-database-activation',
    ],
    checkedAt: new Date().toISOString(),
  }
}

export function isCriticalAreaMemoryFallback() {
  return !isDbAvailable()
}

export function getBusinessCriticalAreas() {
  return BUSINESS_CRITICAL_AREAS
}

export function getInfrastructureCriticalAreas() {
  return INFRASTRUCTURE_CRITICAL_AREAS
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
