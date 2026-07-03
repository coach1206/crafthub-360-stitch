/**
 * SmokeCraft Persistence Registry
 * Tracks persistence mode and readiness for every SmokeCraft data area.
 */

import { isDbAvailable } from '../../../db/connection.js'

export const PERSISTENCE_AREAS = [
  'orders', 'staff_queue', 'order_audit', 'venue_menu',
  'pairing_profiles', 'flavor_memory', 'pairing_recommendations', 'pairing_audit',
  'rewards', 'loyalty', 'passport_rewards', 'reward_audit',
  'venue_admin', 'analytics_snapshots', 'integration_sync_events', 'production_sync_queue',
  'connector_audit', 'enterprise_governance_audit', 'final_qa_records', 'handoff_records',
]

export const CRITICAL_AREAS = [
  'orders', 'staff_queue', 'pairing_profiles', 'flavor_memory',
  'rewards', 'loyalty', 'passport_rewards', 'venue_admin',
  'integration_sync_events', 'production_sync_queue', 'order_audit',
]

const AREA_META = {
  orders:                    { displayName: 'Orders',                    table: 'smokecraft_orders' },
  staff_queue:               { displayName: 'Staff Queue',               table: 'smokecraft_staff_queue' },
  order_audit:               { displayName: 'Order Audit',               table: 'smokecraft_order_audit' },
  venue_menu:                { displayName: 'Venue Menu',                table: 'smokecraft_venue_menu' },
  pairing_profiles:          { displayName: 'Pairing Profiles',          table: 'smokecraft_pairing_profiles' },
  flavor_memory:             { displayName: 'Flavor Memory',             table: 'smokecraft_flavor_memory' },
  pairing_recommendations:   { displayName: 'Pairing Recommendations',   table: 'smokecraft_pairing_recommendations' },
  pairing_audit:             { displayName: 'Pairing Audit',             table: 'smokecraft_pairing_audit' },
  rewards:                   { displayName: 'Rewards',                   table: 'smokecraft_rewards' },
  loyalty:                   { displayName: 'Loyalty Records',           table: 'smokecraft_loyalty_records' },
  passport_rewards:          { displayName: 'Passport Rewards',          table: 'smokecraft_passport_rewards' },
  reward_audit:              { displayName: 'Reward Audit',              table: 'smokecraft_reward_audit' },
  venue_admin:               { displayName: 'Venue Admin',               table: 'smokecraft_venue_admin' },
  analytics_snapshots:       { displayName: 'Analytics Snapshots',       table: 'smokecraft_analytics_snapshots' },
  integration_sync_events:   { displayName: 'Integration Sync Events',   table: 'smokecraft_sync_events' },
  production_sync_queue:     { displayName: 'Production Sync Queue',     table: 'smokecraft_sync_events' },
  connector_audit:           { displayName: 'Connector Audit',           table: 'smokecraft_connector_audit' },
  enterprise_governance_audit: { displayName: 'Enterprise Governance Audit', table: 'smokecraft_governance_audit' },
  final_qa_records:          { displayName: 'Final QA Records',          table: null },
  handoff_records:           { displayName: 'Handoff Records',           table: null },
}

// Runtime verification results — populated by verifySmokeCraftDatabaseActivation.js
// when DATABASE_URL is available and migration 029 has been applied.
const _verifiedAreas = new Map()  // areaId -> { databaseVerified, productionReady, verifiedAt }

export function setAreaVerified(areaId, result) {
  _verifiedAreas.set(areaId, {
    databaseVerified: result.databaseVerified ?? false,
    productionReady:  result.productionReady ?? false,
    verifiedAt:       new Date().toISOString(),
  })
}

export function clearVerificationResults() {
  _verifiedAreas.clear()
}

function buildAreaRecord(areaId) {
  const meta     = AREA_META[areaId] ?? { displayName: areaId, table: null }
  const dbUp     = isDbAvailable()
  const hasTable = meta.table !== null
  const verified = _verifiedAreas.get(areaId)

  const dbVerified = verified?.databaseVerified ?? false
  const prodReady  = verified?.productionReady ?? false
  const mode = dbVerified
    ? 'database_verified'
    : dbUp ? 'database_config_detected'
    : hasTable ? 'database_contract_ready' : 'not_applicable'

  return {
    areaId,
    displayName:            meta.displayName,
    currentPersistenceMode: mode,
    databaseReady:          hasTable,
    databaseVerified:       dbVerified,
    productionReady:        prodReady,
    usesMemoryFallback:     !dbUp,
    requiresMigration:      hasTable && !dbVerified,
    migrationStatus:        dbVerified ? 'migration_applied_verified'
      : dbUp ? 'migration_required_if_not_applied' : 'migration_pending',
    recordCountAvailable:   false,
    lastCheckedAt:          verified?.verifiedAt ?? new Date().toISOString(),
    warnings: dbVerified ? [] : dbUp
      ? ['DATABASE_URL present — run verify:smokecraft-database-activation to verify tables']
      : ['No DATABASE_URL — all data stored in memory only; data lost on server restart'],
  }
}

export function getAreaStatus(areaId) {
  if (!PERSISTENCE_AREAS.includes(areaId)) return null
  return buildAreaRecord(areaId)
}

export function getAllAreasStatus() {
  return PERSISTENCE_AREAS.map(buildAreaRecord)
}

export function getRegistrySummary() {
  const dbUp    = isDbAvailable()
  const areas   = getAllAreasStatus()
  const dbVerif = areas.filter(a => a.databaseVerified).length
  const dbMode  = areas.filter(a => a.currentPersistenceMode === 'database_config_detected').length
  const mem     = areas.filter(a => a.usesMemoryFallback).length
  const critMem = CRITICAL_AREAS.filter(id => !(_verifiedAreas.get(id)?.databaseVerified))

  return {
    registryId:             'smokecraft-persistence-registry-v1',
    totalAreas:             PERSISTENCE_AREAS.length,
    areasDatabaseVerified:  dbVerif,
    areasMemoryFallback:    mem,
    areasDatabaseConfig:    dbMode,
    databaseConfigured:     dbUp,
    databaseVerified:       dbVerif > 0,
    overallProductionReady: dbVerif > 0 && critMem.length === 0,
    criticalAreasNotVerified: critMem,
    lastCheckedAt:          new Date().toISOString(),
    warning: dbVerif > 0
      ? (critMem.length === 0 ? 'All critical areas verified.' : `${critMem.length} critical area(s) not yet verified.`)
      : dbUp
        ? 'DATABASE_URL detected but no areas verified yet. Run verify:smokecraft-database-activation.'
        : 'No DATABASE_URL configured. All SmokeCraft data is memory-only and will not survive restarts.',
  }
}
