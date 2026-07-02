/**
 * POS360 Audit Log Service
 * Every POS operation is logged. In-memory when DB unavailable — honest about it.
 */
import { isDbAvailable, query } from '../db/connection.js'

const memoryAuditLog = []

function buildEntry(payload) {
  return {
    auditId: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    venueId: payload.venueId ?? null,
    actorId: payload.actorId ?? null,
    actorRole: payload.actorRole ?? null,
    actionType: payload.actionType,
    targetType: payload.targetType ?? null,
    targetId: payload.targetId ?? null,
    providerName: payload.providerName ?? null,
    requestJson: payload.request ?? null,
    responseJson: payload.response ?? null,
    status: 'audit_logged',
    createdAt: new Date().toISOString(),
  }
}

async function persistEntry(entry) {
  memoryAuditLog.push(entry)
  if (isDbAvailable()) {
    try {
      await query(
        `INSERT INTO pos360_audit_logs (venue_id, actor_id, actor_role, action_type, target_type, target_id, provider_name, request_json, response_json, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [entry.venueId, entry.actorId, entry.actorRole, entry.actionType, entry.targetType,
         entry.targetId, entry.providerName, JSON.stringify(entry.requestJson), JSON.stringify(entry.responseJson), 'audit_logged']
      )
      return { status: 'audit_logged', storageMode: 'postgres', persistenceStatus: 'persisted' }
    } catch { /* fall through */ }
  }
  return { status: 'audit_logged', storageMode: 'memory_fallback', persistenceStatus: 'not_persisted', message: 'Audit log stored in memory only. Not persisted — database unavailable.' }
}

export async function logPOSAction(payload) {
  return persistEntry(buildEntry({ ...payload, actionType: payload.actionType ?? 'pos_action' }))
}

export async function logProviderConnectionAttempt(payload) {
  return persistEntry(buildEntry({ ...payload, actionType: 'provider_connection_attempt' }))
}

export async function logOrderSyncAttempt(payload) {
  return persistEntry(buildEntry({ ...payload, actionType: 'order_sync_attempt' }))
}

export async function logInventorySyncAttempt(payload) {
  return persistEntry(buildEntry({ ...payload, actionType: 'inventory_sync_attempt' }))
}

export async function logWebhookEvent(payload) {
  return persistEntry(buildEntry({ ...payload, actionType: 'webhook_event' }))
}

export async function getAuditLogsForVenue(venueId) {
  if (isDbAvailable()) {
    try {
      const { rows } = await query(
        'SELECT * FROM pos360_audit_logs WHERE venue_id = $1 ORDER BY created_at DESC LIMIT 100',
        [venueId]
      )
      return { ok: true, venueId, logs: rows, storageMode: 'postgres' }
    } catch { /* fall through */ }
  }

  const logs = memoryAuditLog.filter(l => l.venueId === venueId)
  return {
    ok: true,
    venueId,
    logs,
    storageMode: 'memory_fallback',
    persistenceStatus: 'not_persisted',
    message: 'Audit logs from memory only. Not persisted — database unavailable.',
  }
}
