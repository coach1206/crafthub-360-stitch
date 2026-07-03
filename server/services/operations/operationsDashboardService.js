/**
 * LOCC — Operations Dashboard Service
 * Aggregates live status across all subsystems for owner/manager visibility.
 */

import { v4 as uuidv4 } from 'uuid'
import { validateViewerAccess } from './roleSafetyGateway.js'

const dbAvailable = () => !!process.env.DATABASE_URL
const now = () => new Date().toISOString()

export const SYSTEM_HEALTH_STATUSES = [
  'operational','degraded','preview_only','credential_required',
  'database_required','vendor_setup_required','pos_mapping_required',
  'migration_pending','blocked','failed',
]

function subsystemStatus(available, reason = null) {
  return {
    status:      available ? 'operational' : 'degraded',
    degraded:    !available,
    reason:      available ? null : reason,
  }
}

export function buildSystemHealthMap() {
  const hasDb = dbAvailable()
  return {
    database:            subsystemStatus(hasDb, 'database_required'),
    inventory:           subsystemStatus(hasDb, 'in_memory_only'),
    inventorySync:       subsystemStatus(false, 'external_sync_not_live'),
    reorderRecommendations: subsystemStatus(hasDb, 'database_required'),
    purchaseOrders:      subsystemStatus(hasDb, 'reorder_not_submitted'),
    vendorConnectors:    subsystemStatus(false, 'vendor_setup_required'),
    distributorGateway:  subsystemStatus(false, 'distributor_connection_required'),
    manufacturerGateway: subsystemStatus(false, 'manufacturer_connection_required'),
    approvalQueue:       subsystemStatus(hasDb, 'in_memory_only'),
    receivingRecords:    subsystemStatus(hasDb, 'receiving_preview_only'),
    syncEventQueue:      subsystemStatus(hasDb, 'database_required'),
    externalPOSSync:     subsystemStatus(false, 'external_pos_required'),
    realTimePush:        subsystemStatus(false, 'real_time_push_pending'),
    payments:            subsystemStatus(!!process.env.STRIPE_SECRET_KEY, 'credential_required'),
    pos360:              subsystemStatus(hasDb, 'in_memory_only'),
    kds:                 subsystemStatus(hasDb, 'in_memory_only'),
    ncie:                subsystemStatus(true, null),
    eat:                 subsystemStatus(true, null),
    checkout:            subsystemStatus(hasDb, 'in_memory_only'),
    staffOrders:         subsystemStatus(hasDb, 'in_memory_only'),
  }
}

export function buildOperationalSummary(venueId) {
  const health   = buildSystemHealthMap()
  const degraded = Object.entries(health).filter(([, v]) => v.degraded).map(([k]) => k)
  const operational = Object.entries(health).filter(([, v]) => !v.degraded).map(([k]) => k)
  return {
    ok:              degraded.length === 0,
    venueId,
    operationalCount: operational.length,
    degradedCount:   degraded.length,
    degradedSystems: degraded,
    operationalSystems: operational,
    persistenceMode: dbAvailable() ? 'real_database' : 'in_memory_only',
    degradedMode:    !dbAvailable(),
    databaseRequired: !dbAvailable(),
    externalSyncNotLive:         true,
    vendorSyncNotLive:           true,
    externalPOSRequired:         true,
    distributorConnectionRequired: true,
    manufacturerConnectionRequired: true,
    reorderNotSubmitted:         true,
    realTimePushPending:         true,
    timestamp:       now(),
  }
}

export function getLOCCReadiness(venueId) {
  const summary = buildOperationalSummary(venueId)
  return {
    ok:             true,
    venueId,
    loccActive:     true,
    persistenceMode: summary.persistenceMode,
    degradedMode:   summary.degradedMode,
    systemHealth:   buildSystemHealthMap(),
    blockers:       summary.degradedSystems,
    status:         summary.degradedCount > 0 ? 'partially_degraded' : 'fully_operational',
    timestamp:      now(),
  }
}

export function buildOperationsDashboardReport(venueId, actorContext = {}) {
  const roleCheck = validateViewerAccess(actorContext.role ?? 'guest')
  if (!roleCheck.allowed) {
    return { ok: false, error: roleCheck.error, status: 'role_insufficient' }
  }
  const summary = buildOperationalSummary(venueId)
  const health  = buildSystemHealthMap()
  return {
    ok:               true,
    venueId,
    actorRole:        actorContext.role,
    summary,
    systemHealth:     health,
    blockers: [
      !dbAvailable()                      && 'DATABASE_URL not set — in_memory_only mode',
      !process.env.STRIPE_SECRET_KEY      && 'STRIPE_SECRET_KEY not set — payments preview-only',
      'external_pos_required — no POS sync active',
      'vendor_setup_required — no vendor API connected',
      'reorder_not_submitted — no purchase orders submitted',
    ].filter(Boolean),
    warnings: [
      'real_time_push_pending — WebSocket/webhook sync not implemented',
      'distributor_connection_required — distributor API not connected',
      'manufacturer_connection_required — manufacturer API not connected',
    ],
    persistenceMode:  summary.persistenceMode,
    degradedMode:     summary.degradedMode,
    timestamp:        now(),
  }
}
