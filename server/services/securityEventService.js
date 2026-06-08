/**
 * Security Event Service — records access grants, denials, role changes,
 * founder actions, and emergency events.
 * Dual-mode: PostgreSQL when available, in-memory fallback.
 */

import { isDbAvailable, query } from '../db/connection.js'

const memoryEvents = []
const MAX_MEM = 200

async function write(actorId, actorRole, eventType, routePath = '', metadata = {}) {
  const entry = {
    actor_id:   actorId   || 'unknown',
    actor_role: actorRole || 'guest',
    event_type: eventType,
    route_path: routePath,
    metadata:   JSON.stringify(metadata),
    created_at: new Date().toISOString(),
  }

  if (isDbAvailable()) {
    try {
      await query(
        `INSERT INTO security_events (actor_id, actor_role, event_type, route_path, metadata)
         VALUES ($1,$2,$3,$4,$5)`,
        [entry.actor_id, entry.actor_role, entry.event_type, entry.route_path, entry.metadata]
      )
      return
    } catch (err) {
      console.warn('[securityEventService] DB write failed:', err.message)
    }
  }

  memoryEvents.push(entry)
  if (memoryEvents.length > MAX_MEM) memoryEvents.shift()
}

/** Generic security event. */
export const recordSecurityEvent = (actorId, actorRole, eventType, routePath, meta) =>
  write(actorId, actorRole, eventType, routePath, meta)

/** Access was granted to a protected route. */
export const recordAccessGranted = (actorId, actorRole, routePath) =>
  write(actorId, actorRole, 'access.granted', routePath, { granted: true })

/** Access was denied — role/permission insufficient. */
export const recordAccessDenied = (actorId, actorRole, routePath, requiredRole) =>
  write(actorId, actorRole, 'access.denied', routePath, { requiredRole, denied: true })

/** A user's role was changed. */
export const recordRoleChange = (actorId, actorRole, targetUserId, fromRole, toRole) =>
  write(actorId, actorRole, 'role.changed', '/api/admin/users', { targetUserId, fromRole, toRole })

/** A founder-level action was taken. */
export const recordFounderAction = (actorId, action, controlKey, metadata = {}) =>
  write(actorId, 'founder_level_0', `founder.${action}`, '/api/founder', { controlKey, ...metadata })

/** Emergency system lock was triggered. */
export const recordEmergencyLock = (actorId, reason) =>
  write(actorId, 'founder_level_0', 'emergency.lock.triggered', '/api/founder/emergency-lock', { reason })

/** Returns recent security events (latest 100), optionally filtered by actorId. */
export async function getSecurityEvents(actorId = null, limit = 100) {
  if (isDbAvailable()) {
    try {
      const sql = actorId
        ? 'SELECT * FROM security_events WHERE actor_id=$1 ORDER BY created_at DESC LIMIT $2'
        : 'SELECT * FROM security_events ORDER BY created_at DESC LIMIT $1'
      const params = actorId ? [actorId, limit] : [limit]
      const result = await query(sql, params)
      return result.rows
    } catch (err) {
      console.warn('[securityEventService] DB read failed:', err.message)
    }
  }
  const all = actorId ? memoryEvents.filter(e => e.actor_id === actorId) : memoryEvents
  return [...all].reverse().slice(0, limit)
}
