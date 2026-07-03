/**
 * LOCC — Operations Audit Service
 * Provides audit trail visibility for management and compliance.
 */

import { v4 as uuidv4 } from 'uuid'
import { assertManagerRole, assertViewerAccess } from './roleSafetyGateway.js'

const dbAvailable = () => !!process.env.DATABASE_URL
const now = () => new Date().toISOString()

export const LOCC_AUDIT_EVENT_TYPES = [
  'locc_dashboard_viewed','sync_event_retried','sync_event_blocked',
  'po_approved','po_rejected','po_escalated','receiving_confirmed',
  'owner_signed_off','credential_requirements_viewed','production_blockers_viewed',
  'reorder_queue_viewed','failed_sync_viewed','approval_queue_viewed',
  'vendor_status_viewed','system_health_viewed','audit_exported',
]

export function getAuditReadiness(venueId) {
  return {
    ok:               true,
    venueId,
    auditServiceActive: true,
    persistenceMode:  dbAvailable() ? 'real_database' : 'in_memory_only',
    degradedMode:     !dbAvailable(),
    databaseRequired: !dbAvailable(),
    eventTypesSupported: LOCC_AUDIT_EVENT_TYPES.length,
  }
}

export async function getLOCCAuditEvents(venueId, actorContext = {}) {
  const blocked = assertManagerRole(actorContext.role, 'view_audit_events')
  if (blocked) return blocked
  try {
    const { getAuditEventsByVenue } = await import('../inventory/inventoryAuditPersistenceService.js')
    const result = await getAuditEventsByVenue(venueId)
    return {
      ok:              true,
      venueId,
      events:          result.events ?? [],
      count:           result.count  ?? 0,
      persistenceMode: dbAvailable() ? 'real_database' : 'in_memory_only',
      degradedMode:    !dbAvailable(),
      timestamp:       now(),
    }
  } catch {
    return { ok: false, status: 'audit_service_unavailable', events: [], degradedMode: true }
  }
}

export async function getReorderAuditEvents(venueId, actorContext = {}) {
  const blocked = assertManagerRole(actorContext.role, 'view_reorder_audit')
  if (blocked) return blocked
  try {
    const { getAuditEventsByVenue } = await import('../inventory/inventoryAuditPersistenceService.js')
    const result = await getAuditEventsByVenue(venueId, { system: 'dmrc' })
    return {
      ok:           true,
      venueId,
      events:       result.events ?? [],
      count:        result.count  ?? 0,
      degradedMode: !dbAvailable(),
      timestamp:    now(),
    }
  } catch {
    return { ok: false, status: 'audit_service_unavailable', events: [], degradedMode: true }
  }
}

export async function exportAuditTrail(venueId, format = 'json', actorContext = {}) {
  const blocked = assertManagerRole(actorContext.role, 'export_audit_trail')
  if (blocked) return blocked
  try {
    const { getAuditEventsByVenue } = await import('../inventory/inventoryAuditPersistenceService.js')
    const result = await getAuditEventsByVenue(venueId)
    return {
      ok:          true,
      venueId,
      format,
      eventCount:  result.count ?? 0,
      events:      result.events ?? [],
      exportedBy:  actorContext.actorId,
      exportedRole: actorContext.role,
      exportedAt:  now(),
      persistenceMode: dbAvailable() ? 'real_database' : 'in_memory_only',
    }
  } catch {
    return { ok: false, status: 'export_failed', degradedMode: true }
  }
}

export async function getInventoryAuditByProduct(venueId, productId, actorContext = {}) {
  const blocked = assertManagerRole(actorContext.role, 'view_product_audit')
  if (blocked) return blocked
  try {
    const { getAuditEventsByProduct } = await import('../inventory/inventoryAuditPersistenceService.js')
    const result = await getAuditEventsByProduct(venueId, productId)
    return {
      ok: true, venueId, productId,
      events: result.events ?? [], count: result.count ?? 0,
      degradedMode: !dbAvailable(), timestamp: now(),
    }
  } catch {
    return { ok: false, status: 'audit_service_unavailable', events: [] }
  }
}

export function buildAuditSummary(venueId) {
  return {
    ok:               true,
    venueId,
    auditActive:      true,
    persistenceMode:  dbAvailable() ? 'real_database' : 'in_memory_only',
    degradedMode:     !dbAvailable(),
    auditEvents:      LOCC_AUDIT_EVENT_TYPES,
    exportAvailable:  true,
    note:             dbAvailable()
                        ? 'Audit events persisted to database'
                        : 'Audit events in memory only — set DATABASE_URL for durable audit trail',
  }
}
