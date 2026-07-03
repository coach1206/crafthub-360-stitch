/**
 * Staff Order Audit Service
 * Logs staff order actions, table layout events, manager approvals, and POS360 handoffs.
 * Audit events are preview-buffered; not persisted without database proof.
 */

import { v4 as uuidv4 } from 'uuid'

const AUDIT_BUFFER = []
const MAX_BUFFER = 500
const dbAvailable = () => !!process.env.DATABASE_URL
const now = () => new Date().toISOString()

export function buildStaffOrderAuditEvent(payload = {}) {
  return {
    log_id:      uuidv4(),
    actor_id:    payload.actor_id ?? null,
    actor_role:  payload.actor_role ?? 'staff',
    venue_id:    payload.venue_id ?? null,
    entity_type: payload.entity_type ?? 'staff_order',
    entity_id:   payload.entity_id ?? null,
    action:      payload.action ?? 'unknown',
    status:      'audit_logged',
    details:     payload.details ?? {},
    created_at:  now(),
  }
}

export function logStaffOrderAuditEvent(payload = {}) {
  const event = buildStaffOrderAuditEvent(payload)
  if (AUDIT_BUFFER.length >= MAX_BUFFER) AUDIT_BUFFER.shift()
  AUDIT_BUFFER.push(event)
  return {
    ok: true, event,
    auditStatus:       'audit_logged',
    persistenceStatus: dbAvailable() ? 'database_required' : 'not_persisted',
  }
}

export function getStaffOrderAuditTrail(venueId, filters = {}) {
  const events = AUDIT_BUFFER.filter(e => {
    if (e.venue_id !== venueId) return false
    if (filters.entity_type && e.entity_type !== filters.entity_type) return false
    if (filters.entity_id && e.entity_id !== filters.entity_id) return false
    if (filters.actor_role && e.actor_role !== filters.actor_role) return false
    return true
  })
  return {
    ok: true, events, count: events.length, venueId,
    auditStatus:       'audit_logged',
    persistenceStatus: dbAvailable() ? 'database_required' : 'not_persisted',
  }
}

export function logStaffOrderAction(venueId, actorContext, actionType, entityId, details = {}) {
  return logStaffOrderAuditEvent({
    venue_id:    venueId,
    actor_id:    actorContext.staff_id ?? null,
    actor_role:  actorContext.role ?? 'staff',
    entity_type: 'staff_order',
    entity_id:   entityId,
    action:      actionType,
    details,
  })
}

export function logTableLayoutEvent(venueId, actorContext, action, tableId, details = {}) {
  return logStaffOrderAuditEvent({
    venue_id:    venueId,
    actor_id:    actorContext.actor_id ?? null,
    actor_role:  actorContext.actor_role ?? 'staff',
    entity_type: 'table_layout',
    entity_id:   tableId,
    action,
    details,
  })
}

export function logManagerApprovalEvent(venueId, actorContext, action, approvalRequestId, details = {}) {
  return logStaffOrderAuditEvent({
    venue_id:    venueId,
    actor_id:    actorContext.manager_id ?? null,
    actor_role:  'manager',
    entity_type: 'manager_approval',
    entity_id:   approvalRequestId,
    action,
    details,
  })
}

export function logManualPOS360HandoffEvent(venueId, actorContext, handoffId, details = {}) {
  return logStaffOrderAuditEvent({
    venue_id:    venueId,
    actor_id:    actorContext.staff_id ?? null,
    actor_role:  actorContext.role ?? 'staff',
    entity_type: 'manual_pos360_handoff',
    entity_id:   handoffId,
    action:      'manual_pos360_handoff',
    details,
  })
}
