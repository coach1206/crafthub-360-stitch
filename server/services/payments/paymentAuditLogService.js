/**
 * Payment Audit Log Service
 * Logs all payment actions. Falls back to memory when database unavailable.
 * Never fakes persistence.
 */

import { isDbAvailable, query } from '../../db/connection.js'

const auditLogsMemory = []

async function writeAuditLog(payload) {
  const entry = {
    ...payload,
    status: payload.status ?? 'audit_logged',
    id: `pay-audit-${Date.now()}`,
    created_at: new Date().toISOString(),
  }

  if (isDbAvailable()) {
    try {
      await query(
        `INSERT INTO payment_audit_logs
           (actor_id, actor_role, owner_type, owner_id, action_type,
            target_type, target_id, payment_provider, request_json, response_json, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          payload.actorId ?? 'system', payload.actorRole ?? 'system',
          payload.ownerType ?? null, payload.ownerId ?? null,
          payload.actionType, payload.targetType ?? null, payload.targetId ?? null,
          payload.paymentProvider ?? 'stripe',
          JSON.stringify(payload.request ?? {}), JSON.stringify(payload.response ?? {}),
          entry.status,
        ]
      )
      return { ok: true, status: 'audit_logged', storageMode: 'postgres' }
    } catch { /* fallback */ }
  }

  auditLogsMemory.push(entry)
  return {
    ok: true,
    id: entry.id,
    status: 'audit_logged',
    storageMode: 'memory_fallback',
    persistenceStatus: 'not_persisted',
    message: 'Audit log stored in memory only. Not persisted — database unavailable.',
  }
}

export async function logPaymentAction(payload) {
  return writeAuditLog({ ...payload, actionType: payload.actionType ?? 'payment_action' })
}

export async function logOnboardingAttempt(payload) {
  return writeAuditLog({ ...payload, actionType: 'onboarding_attempt' })
}

export async function logPaymentIntentAttempt(payload) {
  return writeAuditLog({ ...payload, actionType: 'payment_intent_attempt' })
}

export async function logSettlementAttempt(payload) {
  return writeAuditLog({ ...payload, actionType: 'settlement_attempt' })
}

export async function logRefundAttempt(payload) {
  return writeAuditLog({ ...payload, actionType: 'refund_attempt' })
}

export async function logWebhookEvent(payload) {
  return writeAuditLog({ ...payload, actionType: 'webhook_event' })
}

export async function getPaymentAuditLogs(filters = {}) {
  if (isDbAvailable()) {
    try {
      const { rows } = await query(
        'SELECT * FROM payment_audit_logs ORDER BY created_at DESC LIMIT 100'
      )
      return { ok: true, logs: rows, storageMode: 'postgres' }
    } catch { /* fallback */ }
  }

  let logs = [...auditLogsMemory]
  if (filters.ownerType) logs = logs.filter(l => l.ownerType === filters.ownerType)
  if (filters.ownerId) logs = logs.filter(l => l.ownerId === filters.ownerId)

  return {
    ok: true,
    logs,
    storageMode: 'memory_fallback',
    persistenceStatus: 'not_persisted',
    message: 'Audit logs from memory only.',
  }
}
