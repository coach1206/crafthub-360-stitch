/**
 * Partner Audit Log Service
 * Logs partner onboarding and settings changes without faking persistence.
 */

import { isDbAvailable, query } from '../../db/connection.js'

const auditMemory = []

async function writeLog(payload) {
  const entry = {
    ...payload,
    id: `p-audit-${Date.now()}`,
    status: 'audit_logged',
    created_at: new Date().toISOString(),
  }

  if (isDbAvailable()) {
    try {
      await query(
        `INSERT INTO partner_vendor_audit_logs
           (partner_id, venue_id, actor_id, actor_role, action_type, target_type, target_id, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'audit_logged')`,
        [payload.partnerId ?? null, payload.venueId ?? null,
         payload.actorId ?? 'system', payload.actorRole ?? 'system',
         payload.actionType, payload.targetType ?? null, payload.targetId ?? null]
      )
      return { ok: true, id: entry.id, status: 'audit_logged', storageMode: 'postgres' }
    } catch { /* fallback */ }
  }

  auditMemory.push(entry)
  return {
    ok: true,
    id: entry.id,
    status: 'audit_logged',
    storageMode: 'memory_fallback',
    persistenceStatus: 'not_persisted',
    message: 'Audit log stored in memory only. Not persisted — database unavailable.',
  }
}

export async function logPartnerAction(payload) {
  return writeLog({ ...payload, actionType: payload.actionType ?? 'partner_action' })
}

export async function logPartnerProfileChange(payload) {
  return writeLog({ ...payload, actionType: 'partner_profile_change', targetType: 'partner_profile' })
}

export async function logVenueApprovalAction(payload) {
  return writeLog({ ...payload, actionType: 'venue_approval_action', targetType: 'venue_relationship' })
}

export async function logProductChange(payload) {
  return writeLog({ ...payload, actionType: 'product_change', targetType: 'partner_product' })
}

export async function logAvailabilityChange(payload) {
  return writeLog({ ...payload, actionType: 'availability_change', targetType: 'product_availability' })
}

export async function logFulfillmentChange(payload) {
  return writeLog({ ...payload, actionType: 'fulfillment_change', targetType: 'fulfillment_rules' })
}

export async function logCommissionAgreementChange(payload) {
  return writeLog({ ...payload, actionType: 'commission_agreement_change', targetType: 'commission_agreement' })
}

export async function getPartnerAuditLogs(partnerId) {
  const logs = auditMemory.filter(e => e.partnerId === partnerId)
  return { ok: true, partnerId, logs, storageMode: 'memory_fallback' }
}

export async function getVenuePartnerAuditLogs(venueId) {
  const logs = auditMemory.filter(e => e.venueId === venueId)
  return { ok: true, venueId, logs, storageMode: 'memory_fallback' }
}
