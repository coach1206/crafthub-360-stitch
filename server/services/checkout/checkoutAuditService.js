/**
 * Checkout Audit Service
 * Logs checkout lifecycle events in preview-safe mode.
 * Does not claim events are persisted unless database proof exists.
 */

import { v4 as uuidv4 } from 'uuid'

const AUDIT_BUFFER = []
const MAX_BUFFER = 500

function now() { return new Date().toISOString() }
const dbAvailable = () => !!process.env.DATABASE_URL

export function buildCheckoutAuditEvent(payload = {}) {
  return {
    log_id:              uuidv4(),
    actor_id:            payload.actor_id ?? null,
    actor_role:          payload.actor_role ?? 'system',
    cart_id:             payload.cart_id ?? null,
    checkout_session_id: payload.checkout_session_id ?? null,
    entity_type:         payload.entity_type ?? 'checkout',
    entity_id:           String(payload.entity_id ?? payload.cart_id ?? 'unknown'),
    action:              payload.action ?? 'checkout_event',
    status:              'audit_logged',
    details:             payload.details ?? {},
    created_at:          now(),
  }
}

export function logCheckoutAuditEvent(event) {
  const auditEvent = buildCheckoutAuditEvent(event)
  if (AUDIT_BUFFER.length >= MAX_BUFFER) AUDIT_BUFFER.shift()
  AUDIT_BUFFER.push(auditEvent)
  return {
    ok:               true,
    auditEvent,
    auditStatus:      'audit_logged',
    persistenceStatus: dbAvailable() ? 'database_required' : 'not_persisted',
    auditMode:        dbAvailable() ? 'database_pending' : 'audit_preview',
  }
}

export function getCheckoutAuditTrail(entityType, entityId) {
  const events = AUDIT_BUFFER.filter(e => e.entity_type === entityType && e.entity_id === String(entityId))
  return {
    ok:          true,
    entityType,
    entityId,
    events,
    count:       events.length,
    auditStatus: 'audit_logged',
    persistenceStatus: dbAvailable() ? 'database_required' : 'not_persisted',
  }
}

export function logCartEvent(cartId, eventContext = {}) {
  return logCheckoutAuditEvent({
    cart_id:     cartId,
    entity_type: 'cart',
    entity_id:   cartId,
    action:      eventContext.action ?? 'cart_event',
    actor_id:    eventContext.actor_id ?? null,
    actor_role:  eventContext.actor_role ?? 'customer',
    details:     eventContext.details ?? {},
  })
}

export function logCheckoutStatusEvent(checkoutSessionId, fromStatus, toStatus, actorContext = {}) {
  return logCheckoutAuditEvent({
    checkout_session_id: checkoutSessionId,
    entity_type:         'checkout_session',
    entity_id:           checkoutSessionId,
    action:              'status_change',
    actor_id:            actorContext.actor_id ?? null,
    actor_role:          actorContext.actor_role ?? 'system',
    details:             { from_status: fromStatus, to_status: toStatus, ...actorContext.details },
  })
}

export function logStaffHandoffEvent(cartId, handoffContext = {}) {
  return logCheckoutAuditEvent({
    cart_id:     cartId,
    entity_type: 'staff_handoff',
    entity_id:   cartId,
    action:      'staff_handoff_requested',
    actor_id:    handoffContext.actor_id ?? null,
    actor_role:  handoffContext.actor_role ?? 'customer',
    details:     { handoff_reason: handoffContext.reason ?? null, ...handoffContext.details },
  })
}
