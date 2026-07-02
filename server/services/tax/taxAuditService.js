/**
 * Tax Audit Service
 * Logs tax-related actions. Falls back to memory — does not fake persistence.
 */

import { isDbAvailable, query } from '../../db/connection.js'

const taxAuditMemory = []

export function buildTaxAuditEvent(payload) {
  return {
    id: `tax-audit-${Date.now()}`,
    actor_id: payload.actorId ?? 'system',
    actor_role: payload.actorRole ?? 'system',
    entity_type: payload.entityType ?? 'unknown',
    entity_id: payload.entityId ?? null,
    action: payload.action ?? 'tax_event',
    status: 'audit_logged',
    details: payload.details ?? {},
    created_at: new Date().toISOString(),
  }
}

export async function logTaxAuditEvent(event) {
  const entry = buildTaxAuditEvent(event)

  if (isDbAvailable()) {
    try {
      await query(
        `INSERT INTO tax_audit_logs
           (actor_id, actor_role, entity_type, entity_id, action, status, details)
         VALUES ($1,$2,$3,$4,$5,'audit_logged',$6)`,
        [entry.actor_id, entry.actor_role, entry.entity_type, entry.entity_id,
         entry.action, JSON.stringify(entry.details)]
      )
      return { ok: true, id: entry.id, status: 'audit_logged', storageMode: 'postgres' }
    } catch { /* fallback */ }
  }

  taxAuditMemory.push(entry)
  return {
    ok: true,
    id: entry.id,
    status: 'audit_preview',
    storageMode: 'memory_fallback',
    persistenceStatus: 'not_persisted',
    message: 'Tax audit log stored in memory only. Not persisted — database unavailable.',
  }
}

export async function getTaxAuditTrail(entityType, entityId) {
  const logs = taxAuditMemory.filter(e =>
    e.entity_type === entityType && (entityId ? e.entity_id === entityId : true)
  )
  return {
    ok: true,
    entityType,
    entityId,
    logs,
    count: logs.length,
    storageMode: 'memory_fallback',
  }
}
