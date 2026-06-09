/**
 * Reset Audit Log — append-only audit trail for admin data resets.
 * Persisted to server/data/persisted/reset_audit.json.
 * Entries are NEVER purged by reset actions themselves.
 */
import { v4 as uuidv4 } from 'uuid'
import { loadJson, saveJson } from './persist.js'

const FILENAME = 'reset_audit.json'

/**
 * Append a new entry to the reset audit log.
 * This function is strictly append-only — it never removes existing entries.
 * @param {string} store  — e.g. 'ranking-xp', 'badges', 'travel-stamps'
 * @param {object} actor  — req.user object { id, role, email?, displayName? }
 */
export function appendResetAudit(store, actor = {}) {
  const log = loadJson(FILENAME, [])
  const entry = {
    id:         uuidv4(),
    timestamp:  new Date().toISOString(),
    store,
    actorId:    actor.id    || 'unknown',
    actorRole:  actor.role  || 'unknown',
    actorEmail: actor.email || null,
    actorName:  actor.displayName || null,
  }
  log.unshift(entry)
  saveJson(FILENAME, log)
  return entry
}

/**
 * Return the full audit log (newest first).
 * @param {number} limit  — max entries to return (default 50)
 */
export function getResetAuditLog(limit = 50) {
  const log = loadJson(FILENAME, [])
  return log.slice(0, limit)
}

/**
 * Return the total number of stored entries.
 */
export function getResetAuditTotal() {
  return loadJson(FILENAME, []).length
}

/**
 * Clear the entire reset audit log (founder-only meta-action).
 * Does NOT append an audit entry — this is intentional.
 */
export function clearResetAuditLog() {
  saveJson(FILENAME, [])
}
