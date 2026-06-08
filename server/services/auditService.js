/**
 * Audit Service — records all significant backend events.
 * Falls back to in-memory log when database is unavailable.
 */

import { isDbAvailable, query } from '../db/connection.js'

const memoryLog = []     // prototype fallback — max 500 entries
const MAX_MEM   = 500

/**
 * Log an audit event.
 *
 * @param {string} actorType   'system' | 'guest' | 'staff' | 'admin'
 * @param {string} actorId     identifier of the actor
 * @param {string} action      verb, e.g. 'session.created'
 * @param {string} targetType  'session' | 'passport' | 'stamp' | etc.
 * @param {string} targetId    identifier of the target
 * @param {object} metadata    any additional context
 */
export async function log(
  actorType  = 'system',
  actorId    = '',
  action     = 'unknown',
  targetType = '',
  targetId   = '',
  metadata   = {}
) {
  const entry = {
    actor_type:  actorType,
    actor_id:    actorId,
    action,
    target_type: targetType,
    target_id:   targetId,
    metadata:    JSON.stringify(metadata),
    created_at:  new Date().toISOString(),
  }

  if (isDbAvailable()) {
    try {
      await query(
        `INSERT INTO audit_logs
           (actor_type, actor_id, action, target_type, target_id, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [actorType, actorId, action, targetType, targetId, entry.metadata]
      )
      return
    } catch (err) {
      console.warn('[auditService] DB write failed, using memory:', err.message)
    }
  }

  // In-memory fallback
  memoryLog.push(entry)
  if (memoryLog.length > MAX_MEM) memoryLog.shift()
}

/**
 * Retrieve audit events for a session (latest 50).
 */
export async function getSessionAudit(sessionId) {
  if (isDbAvailable()) {
    try {
      const result = await query(
        `SELECT * FROM audit_logs
          WHERE actor_id = $1 OR target_id = $1
          ORDER BY created_at DESC
          LIMIT 50`,
        [sessionId]
      )
      return result.rows
    } catch (err) {
      console.warn('[auditService] DB read failed:', err.message)
    }
  }
  return memoryLog
    .filter(e => e.actor_id === sessionId || e.target_id === sessionId)
    .reverse()
    .slice(0, 50)
}
