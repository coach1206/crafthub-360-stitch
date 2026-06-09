/**
 * Audit Service — T009: 15-category expansion
 * Records all significant backend events with category-specific helpers.
 * Falls back to in-memory log when the database is unavailable.
 *
 * Categories (15):
 *   auth, session, pos, eat, passport, mentor, developer,
 *   admin, founder, security, access, data, system, role, device
 */

import { isDbAvailable, query } from '../db/connection.js'

const memoryLog = []      // prototype fallback — max 500 entries
const MAX_MEM   = 500

// ── Core logger ───────────────────────────────────────────────

/**
 * Log a raw audit event.
 *
 * @param {string} actorType   'system' | 'guest' | 'staff' | 'admin' | 'founder'
 * @param {string} actorId     identifier of the actor (user_id, staff_id, 'system')
 * @param {string} action      dot-separated verb, e.g. 'auth.login.success'
 * @param {string} targetType  'session' | 'passport' | 'stamp' | 'user' | etc.
 * @param {string} targetId    identifier of the target
 * @param {object} metadata    any additional context (no credentials/PINs/tokens)
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
    target_id:   String(targetId),
    metadata:    JSON.stringify(metadata),
    created_at:  new Date().toISOString(),
  }

  if (isDbAvailable()) {
    try {
      await query(
        `INSERT INTO audit_logs
           (actor_type, actor_id, action, target_type, target_id, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [actorType, actorId, action, targetType, String(targetId), entry.metadata]
      )
      return
    } catch (err) {
      console.warn('[auditService] DB write failed, using memory:', err.message)
    }
  }

  memoryLog.push(entry)
  if (memoryLog.length > MAX_MEM) memoryLog.shift()
}

// ── Query helpers ─────────────────────────────────────────────

/** Retrieve audit events related to an actor or target (latest 50). */
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

/** Retrieve recent audit events filtered by action prefix (latest N). */
export async function getRecentByCategory(category, limit = 50) {
  if (isDbAvailable()) {
    try {
      const result = await query(
        `SELECT * FROM audit_logs
          WHERE action LIKE $1
          ORDER BY created_at DESC
          LIMIT $2`,
        [`${category}.%`, limit]
      )
      return result.rows
    } catch (err) {
      console.warn('[auditService] DB read failed:', err.message)
    }
  }
  return memoryLog
    .filter(e => e.action.startsWith(`${category}.`))
    .reverse()
    .slice(0, limit)
}

/** Retrieve all recent audit events (latest N). */
export async function getRecent(limit = 100) {
  if (isDbAvailable()) {
    try {
      const result = await query(
        `SELECT * FROM audit_logs
          ORDER BY created_at DESC
          LIMIT $1`,
        [limit]
      )
      return result.rows
    } catch (err) {
      console.warn('[auditService] DB read failed:', err.message)
    }
  }
  return [...memoryLog].reverse().slice(0, limit)
}

/** Returns in-memory events (for contexts where DB is unavailable). */
export function getMemoryLog() {
  return [...memoryLog].reverse()
}

// ── Category 1: Authentication ────────────────────────────────

export const logAuth = {
  loginSuccess:  (actorId, role, meta = {}) =>
    log(role === 'guest' ? 'guest' : 'staff', actorId, 'auth.login.success', 'user', actorId, { role, ...meta }),

  loginFailed:   (identifier, reason, meta = {}) =>
    log('system', identifier, 'auth.login.failed', 'user', identifier, { reason, ...meta }),

  loginLocked:   (identifier, meta = {}) =>
    log('system', identifier, 'auth.login.locked', 'user', identifier, meta),

  logout:        (actorId, role, meta = {}) =>
    log(role || 'guest', actorId, 'auth.logout', 'user', actorId, meta),

  tokenRefreshed:(actorId, meta = {}) =>
    log('system', actorId, 'auth.token.refreshed', 'user', actorId, meta),

  sessionExpired:(actorId, meta = {}) =>
    log('system', actorId, 'auth.session.expired', 'user', actorId, meta),
}

// ── Category 2: Session ───────────────────────────────────────

export const logSession = {
  created:   (sessionId, guestId, meta = {}) =>
    log('guest', guestId, 'session.created', 'session', sessionId, meta),

  completed: (sessionId, guestId, meta = {}) =>
    log('guest', guestId, 'session.completed', 'session', sessionId, meta),

  abandoned: (sessionId, guestId, meta = {}) =>
    log('guest', guestId, 'session.abandoned', 'session', sessionId, meta),

  moduleEntered: (sessionId, module, meta = {}) =>
    log('guest', sessionId, 'session.module.entered', 'module', module, meta),
}

// ── Category 3: POS 3 ─────────────────────────────────────────

export const logPOS = {
  orderCreated:  (actorId, orderId, meta = {}) =>
    log('staff', actorId, 'pos.order.created', 'order', orderId, meta),

  orderUpdated:  (actorId, orderId, meta = {}) =>
    log('staff', actorId, 'pos.order.updated', 'order', orderId, meta),

  paymentProcessed: (actorId, orderId, meta = {}) =>
    log('staff', actorId, 'pos.payment.processed', 'order', orderId, meta),

  syncRun:       (provider, status, meta = {}) =>
    log('system', 'pos3-sync', 'pos.sync.run', 'provider', provider, { status, ...meta }),

  settingsChanged: (actorId, meta = {}) =>
    log('admin', actorId, 'pos.settings.changed', 'settings', 'pos3', meta),
}

// ── Category 4: E.A.T. ───────────────────────────────────────

export const logEAT = {
  orderPlaced:   (actorId, orderId, meta = {}) =>
    log('staff', actorId, 'eat.order.placed', 'order', orderId, meta),

  menuUpdated:   (actorId, meta = {}) =>
    log('staff', actorId, 'eat.menu.updated', 'menu', 'eat-menu', meta),

  settingsChanged: (actorId, meta = {}) =>
    log('admin', actorId, 'eat.settings.changed', 'settings', 'eat', meta),
}

// ── Category 5: Passport ──────────────────────────────────────

export const logPassport = {
  stampEarned:   (guestId, stampId, meta = {}) =>
    log('guest', guestId, 'passport.stamp.earned', 'stamp', stampId, meta),

  profileCreated:(userId, profileId, meta = {}) =>
    log('guest', userId, 'passport.profile.created', 'passport', profileId, meta),

  connectionMade:(userId, targetId, meta = {}) =>
    log('guest', userId, 'passport.connection.made', 'user', targetId, meta),

  memberPromoted:(adminId, userId, meta = {}) =>
    log('admin', adminId, 'passport.member.promoted', 'user', userId, meta),

  xpAwarded:     (userId, amount, meta = {}) =>
    log('system', userId, 'passport.xp.awarded', 'user', userId, { amount, ...meta }),
}

// ── Category 6: Human Mentor ─────────────────────────────────

export const logMentor = {
  sessionAssigned: (mentorId, sessionId, meta = {}) =>
    log('admin', mentorId, 'mentor.session.assigned', 'session', sessionId, meta),

  noteAdded:     (mentorId, sessionId, noteType, meta = {}) =>
    log('staff', mentorId, 'mentor.note.added', 'session', sessionId, { noteType, ...meta }),

  contentTriggered: (mentorId, contentId, meta = {}) =>
    log('staff', mentorId, 'mentor.content.triggered', 'content', contentId, meta),

  approved:      (adminId, mentorId, meta = {}) =>
    log('admin', adminId, 'mentor.approved', 'user', mentorId, meta),

  revoked:       (adminId, mentorId, reason, meta = {}) =>
    log('admin', adminId, 'mentor.revoked', 'user', mentorId, { reason, ...meta }),
}

// ── Category 7: Developer ─────────────────────────────────────

export const logDeveloper = {
  accessGranted: (founderId, devId, expiry, meta = {}) =>
    log('founder', founderId, 'developer.access.granted', 'user', devId, { expiry, ...meta }),

  accessRevoked: (founderId, devId, reason, meta = {}) =>
    log('founder', founderId, 'developer.access.revoked', 'user', devId, { reason, ...meta }),

  diagnosticsViewed: (devId, endpoint, meta = {}) =>
    log('staff', devId, 'developer.diagnostics.viewed', 'endpoint', endpoint, meta),

  metricsViewed: (devId, meta = {}) =>
    log('staff', devId, 'developer.metrics.viewed', 'system', 'metrics', meta),
}

// ── Category 8: Admin ─────────────────────────────────────────

export const logAdmin = {
  userViewed:    (adminId, targetId, meta = {}) =>
    log('admin', adminId, 'admin.user.viewed', 'user', targetId, meta),

  pinReset:      (adminId, targetId, meta = {}) =>
    log('admin', adminId, 'admin.pin.reset', 'user', targetId, meta),

  inboxReviewed: (adminId, meta = {}) =>
    log('admin', adminId, 'admin.inbox.reviewed', 'inbox', 'access-requests', meta),

  settingsChanged: (adminId, area, meta = {}) =>
    log('admin', adminId, 'admin.settings.changed', 'settings', area, meta),

  dataReset:     (adminId, area, meta = {}) =>
    log('admin', adminId, 'admin.data.reset', 'data', area, meta),
}

// ── Category 9: Founder ───────────────────────────────────────

export const logFounder = {
  loginSuccess:  (founderId, meta = {}) =>
    log('founder', founderId, 'founder.login.success', 'user', founderId, meta),

  emergencyLock: (founderId, reason, meta = {}) =>
    log('founder', founderId, 'founder.emergency.lock', 'system', 'all', { reason, ...meta }),

  controlChanged: (founderId, controlKey, meta = {}) =>
    log('founder', founderId, 'founder.control.changed', 'control', controlKey, meta),

  devGrantIssued: (founderId, devId, meta = {}) =>
    log('founder', founderId, 'founder.dev-grant.issued', 'user', devId, meta),

  devGrantRevoked:(founderId, devId, reason, meta = {}) =>
    log('founder', founderId, 'founder.dev-grant.revoked', 'user', devId, { reason, ...meta }),

  auditExported: (founderId, meta = {}) =>
    log('founder', founderId, 'founder.audit.exported', 'system', 'audit-logs', meta),
}

// ── Category 10: Security ─────────────────────────────────────

export const logSecurity = {
  accessDenied:  (actorId, role, path, meta = {}) =>
    log('system', actorId, 'security.access.denied', 'route', path, { role, ...meta }),

  accessGranted: (actorId, role, path, meta = {}) =>
    log('system', actorId, 'security.access.granted', 'route', path, { role, ...meta }),

  suspiciousActivity: (actorId, reason, meta = {}) =>
    log('system', actorId, 'security.suspicious', 'user', actorId, { reason, ...meta }),

  devHeaderBlocked: (ip, header, meta = {}) =>
    log('system', ip, 'security.dev-header.blocked', 'request', 'blocked', { header, ...meta }),

  csrfViolation: (ip, path, meta = {}) =>
    log('system', ip, 'security.csrf.violation', 'route', path, meta),
}

// ── Category 11: Access Requests ─────────────────────────────

export const logAccess = {
  requested:     (requesterId, requestedRole, reason, meta = {}) =>
    log('guest', requesterId, 'access.requested', 'role', requestedRole, { reason, ...meta }),

  approved:      (adminId, requestId, requestedRole, meta = {}) =>
    log('admin', adminId, 'access.approved', 'request', requestId, { requestedRole, ...meta }),

  denied:        (adminId, requestId, reason, meta = {}) =>
    log('admin', adminId, 'access.denied', 'request', requestId, { reason, ...meta }),
}

// ── Category 12: Data ─────────────────────────────────────────

export const logData = {
  exported:      (actorId, dataType, meta = {}) =>
    log('admin', actorId, 'data.exported', 'export', dataType, meta),

  imported:      (actorId, dataType, meta = {}) =>
    log('admin', actorId, 'data.imported', 'import', dataType, meta),

  reset:         (actorId, dataType, meta = {}) =>
    log('admin', actorId, 'data.reset', 'data', dataType, meta),

  archived:      (actorId, dataType, meta = {}) =>
    log('admin', actorId, 'data.archived', 'data', dataType, meta),
}

// ── Category 13: System ───────────────────────────────────────

export const logSystem = {
  started:       (version, meta = {}) =>
    log('system', 'novee-os', 'system.started', 'server', 'api', { version, ...meta }),

  configChanged: (actorId, key, meta = {}) =>
    log('system', actorId, 'system.config.changed', 'config', key, meta),

  flagToggled:   (actorId, flag, value, meta = {}) =>
    log('system', actorId, 'system.flag.toggled', 'flag', flag, { value, ...meta }),

  migrationRun:  (migration, meta = {}) =>
    log('system', 'db', 'system.migration.run', 'migration', migration, meta),
}

// ── Category 14: Role Changes ─────────────────────────────────

export const logRole = {
  changed:       (adminId, targetId, fromRole, toRole, meta = {}) =>
    log('admin', adminId, 'role.changed', 'user', targetId, { fromRole, toRole, ...meta }),

  promoted:      (adminId, targetId, toRole, meta = {}) =>
    log('admin', adminId, 'role.promoted', 'user', targetId, { toRole, ...meta }),

  demoted:       (adminId, targetId, toRole, meta = {}) =>
    log('admin', adminId, 'role.demoted', 'user', targetId, { toRole, ...meta }),

  sidecarGranted:(adminId, targetId, sidecar, meta = {}) =>
    log('admin', adminId, 'role.sidecar.granted', 'user', targetId, { sidecar, ...meta }),

  sidecarRevoked:(adminId, targetId, sidecar, meta = {}) =>
    log('admin', adminId, 'role.sidecar.revoked', 'user', targetId, { sidecar, ...meta }),
}

// ── Category 15: Device ───────────────────────────────────────

export const logDevice = {
  registered:    (actorId, deviceId, meta = {}) =>
    log('admin', actorId, 'device.registered', 'device', deviceId, meta),

  heartbeat:     (deviceId, status, meta = {}) =>
    log('system', deviceId, 'device.heartbeat', 'device', deviceId, { status, ...meta }),

  offline:       (deviceId, meta = {}) =>
    log('system', deviceId, 'device.offline', 'device', deviceId, meta),

  kioskActivated:(actorId, deviceId, meta = {}) =>
    log('admin', actorId, 'device.kiosk.activated', 'device', deviceId, meta),
}
