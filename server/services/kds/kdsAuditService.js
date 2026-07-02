/**
 * KDS Audit Service
 * Logs dispatch and handoff events. Memory fallback when database unavailable.
 */

const auditLogStore = []

export function buildKdsAuditEvent(payload) {
  return {
    id:         `aud_kds_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    actorId:    payload.actorId ?? null,
    actorRole:  payload.actorRole ?? 'system',
    orderId:    payload.orderId ?? null,
    entityType: payload.entityType ?? 'kds_dispatch',
    entityId:   payload.entityId ?? payload.orderId ?? 'unknown',
    action:     payload.action,
    status:     'audit_logged',
    details:    payload.details ?? {},
    createdAt:  new Date().toISOString(),
  }
}

export async function logKdsAuditEvent(event, db = null) {
  if (db) {
    try {
      await db.query(
        `INSERT INTO kds_routing_audit_logs
           (actor_id, actor_role, order_id, entity_type, entity_id, action, status, details)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [event.actorId, event.actorRole, event.orderId, event.entityType, event.entityId, event.action, event.status, event.details]
      )
      return { ok: true, event, storageMode: 'postgres', status: 'audit_logged' }
    } catch { /* fall through */ }
  }
  auditLogStore.push(event)
  return { ok: true, event, storageMode: 'memory_fallback', status: 'audit_preview', persistenceStatus: 'not_persisted' }
}

export async function logDispatchEvent(orderId, dispatchContext = {}, db = null) {
  const event = buildKdsAuditEvent({
    orderId,
    entityType: 'kds_dispatch',
    entityId:   orderId,
    actorId:    dispatchContext.actorId ?? null,
    actorRole:  dispatchContext.actorRole ?? 'system',
    action:     'dispatch_preview',
    details:    { dispatchMode: 'dispatch_preview', ...dispatchContext },
  })
  return logKdsAuditEvent(event, db)
}

export async function logHandoffEvent(orderId, handoffContext = {}, db = null) {
  const event = buildKdsAuditEvent({
    orderId,
    entityType: 'kds_handoff',
    entityId:   orderId,
    actorId:    handoffContext.actorId ?? null,
    actorRole:  handoffContext.actorRole ?? 'system',
    action:     `handoff:${handoffContext.handoffType ?? 'unknown'}`,
    details:    { handoffStatus: 'handoff_pending', ...handoffContext },
  })
  return logKdsAuditEvent(event, db)
}

export async function getKdsAuditTrail(entityType, entityId, db = null) {
  if (db) {
    try {
      const { rows } = await db.query(
        'SELECT * FROM kds_routing_audit_logs WHERE entity_type = $1 AND entity_id = $2 ORDER BY created_at DESC',
        [entityType, entityId]
      )
      return { ok: true, entityType, entityId, events: rows, storageMode: 'postgres' }
    } catch { /* fall through */ }
  }
  const events = auditLogStore.filter(e => e.entityType === entityType && e.entityId === entityId)
  return { ok: true, entityType, entityId, events, storageMode: 'memory_fallback', persistenceStatus: 'not_persisted' }
}
