/**
 * Order Audit Service
 * Logs order lifecycle events. Fallback to memory when database unavailable.
 */

const auditLogStore = []

export function buildOrderAuditEvent(payload) {
  return {
    id:         `aud_ord_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    actorId:    payload.actorId ?? null,
    actorRole:  payload.actorRole ?? 'system',
    orderId:    payload.orderId ?? null,
    entityType: payload.entityType ?? 'order',
    entityId:   payload.entityId ?? payload.orderId ?? 'unknown',
    action:     payload.action,
    status:     'audit_logged',
    details:    payload.details ?? {},
    createdAt:  new Date().toISOString(),
  }
}

export async function logOrderAuditEvent(event, db = null) {
  if (db) {
    try {
      await db.query(
        `INSERT INTO order_lifecycle_audit_logs
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

export async function logOrderTransitionEvent(orderId, fromStatus, toStatus, actorContext = {}, db = null) {
  const event = buildOrderAuditEvent({
    orderId,
    entityType: 'order',
    entityId:   orderId,
    actorId:    actorContext.actorId ?? null,
    actorRole:  actorContext.actorRole ?? 'system',
    action:     `transition:${fromStatus}→${toStatus}`,
    details:    { fromStatus, toStatus, reason: actorContext.reason ?? null },
  })
  return logOrderAuditEvent(event, db)
}

export async function getOrderAuditTrail(orderId, db = null) {
  if (db) {
    try {
      const { rows } = await db.query(
        'SELECT * FROM order_lifecycle_audit_logs WHERE order_id = $1 ORDER BY created_at DESC',
        [orderId]
      )
      return { ok: true, orderId, events: rows, storageMode: 'postgres' }
    } catch { /* fall through */ }
  }
  const events = auditLogStore.filter(e => e.orderId === orderId)
  return { ok: true, orderId, events, storageMode: 'memory_fallback', persistenceStatus: 'not_persisted' }
}
