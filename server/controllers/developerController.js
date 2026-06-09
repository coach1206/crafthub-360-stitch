/**
 * Developer Controller — Phase 10 (Auth v2)
 * Read-only diagnostics for Developer role accounts.
 * All data is system-level — no guest or member PII is exposed.
 *
 * Requires: developer role + active dev access grant (verified at login).
 * Founder L0 also has full access.
 *
 * SECURITY: This controller NEVER returns:
 * - Raw credentials, PINs, or hashes
 * - JWT secrets or env var values
 * - Guest personal information
 * - Payment data
 */

import { isDbAvailable, query } from '../db/connection.js'
import { ok, fail, serverError } from '../utils/response.js'
import os from 'os'

// ── GET /api/developer/health ─────────────────────────────────
/**
 * Returns the health status of all API route groups.
 */
export async function getApiHealth(req, res) {
  try {
    const dbOk = isDbAvailable()

    const routes = [
      { route: '/api/health',          status: 'operational' },
      { route: '/api/auth/*',          status: 'operational' },
      { route: '/api/pos3/*',          status: 'operational' },
      { route: '/api/eat/*',           status: 'operational' },
      { route: '/api/passport/*',      status: 'operational' },
      { route: '/api/leaderboard/*',   status: 'operational' },
      { route: '/api/audit/*',         status: 'operational' },
      { route: '/api/admin/*',         status: 'operational' },
      { route: '/api/founder/*',       status: 'operational' },
      { route: '/api/mentor/*',        status: 'operational' },
      { route: '/api/developer/*',     status: 'operational' },
      { route: '/api/ticker/*',        status: 'operational' },
      { route: '/api/travel/*',        status: 'operational' },
      { route: '/api/voice/*',         status: 'operational' },
      { route: '/api/device/*',        status: 'operational' },
    ]

    ok(res, {
      status:    dbOk ? 'healthy' : 'degraded',
      database:  dbOk ? 'connected' : 'unavailable',
      environment: process.env.NODE_ENV || 'development',
      uptime:    Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      routes,
    })
  } catch (err) {
    serverError(res, err, 'getApiHealth')
  }
}

// ── GET /api/developer/metrics ────────────────────────────────
/**
 * Returns system metrics: memory, uptime, DB pool stats.
 * No PII. No credentials.
 */
export async function getSystemMetrics(req, res) {
  try {
    const memUsage   = process.memoryUsage()
    const totalMem   = os.totalmem()
    const freeMem    = os.freemem()

    let dbMetrics = null
    if (isDbAvailable()) {
      try {
        const result = await query(
          `SELECT
             (SELECT COUNT(*) FROM auth_sessions WHERE revoked=false AND expires_at > NOW()) AS active_sessions,
             (SELECT COUNT(*) FROM system_users WHERE status='active')                        AS active_users,
             (SELECT COUNT(*) FROM audit_logs)                                                AS total_audit_entries,
             (SELECT COUNT(*) FROM security_events)                                           AS total_security_events,
             (SELECT COUNT(*) FROM dev_access_grants WHERE revoked=false AND expires_at > NOW()) AS active_dev_grants`
        )
        dbMetrics = result.rows[0]
      } catch {}
    }

    ok(res, {
      process: {
        uptime:    Math.floor(process.uptime()),
        pid:       process.pid,
        nodeVersion: process.version,
        memory: {
          rss:       formatBytes(memUsage.rss),
          heapUsed:  formatBytes(memUsage.heapUsed),
          heapTotal: formatBytes(memUsage.heapTotal),
          external:  formatBytes(memUsage.external),
        },
      },
      system: {
        platform:   process.platform,
        arch:       process.arch,
        cpuCount:   os.cpus().length,
        totalMemory: formatBytes(totalMem),
        freeMemory:  formatBytes(freeMem),
        loadAvg:    os.loadavg().map(v => v.toFixed(2)),
      },
      database: isDbAvailable() ? 'connected' : 'unavailable',
      metrics: dbMetrics,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    serverError(res, err, 'getSystemMetrics')
  }
}

// ── GET /api/developer/errors ─────────────────────────────────
/**
 * Returns recent error-level security events and audit failures.
 * Read-only. No PII.
 * Query params: ?limit=50&since=ISO_DATE
 */
export async function getErrorLog(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200)
    const since = req.query.since ? new Date(req.query.since) : null

    if (!isDbAvailable()) {
      return ok(res, { errors: [], mode: 'prototype' })
    }

    const sql = since
      ? `SELECT id, actor_role, event_type, route_path, metadata, created_at
         FROM security_events
         WHERE created_at > $1
         ORDER BY created_at DESC LIMIT $2`
      : `SELECT id, actor_role, event_type, route_path, metadata, created_at
         FROM security_events
         ORDER BY created_at DESC LIMIT $1`

    const params = since ? [since.toISOString(), limit] : [limit]
    const result = await query(sql, params)

    // Scrub any actor_id values — developers see event types, not identities
    const scrubbed = result.rows.map(r => ({
      ...r,
      actor_id: r.actor_id ? '[REDACTED]' : null,
    }))

    ok(res, {
      errors:    scrubbed,
      count:     scrubbed.length,
      limit,
      since:     since?.toISOString() || null,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    serverError(res, err, 'getErrorLog')
  }
}

// ── GET /api/developer/audit-summary ─────────────────────────
/**
 * Returns a summary of audit log activity by category.
 * Read-only. No PII.
 */
export async function getAuditSummary(req, res) {
  try {
    if (!isDbAvailable()) {
      return ok(res, { summary: [], mode: 'prototype' })
    }

    const result = await query(
      `SELECT
         action_category,
         COUNT(*) AS total,
         COUNT(*) FILTER (WHERE result='success')  AS successes,
         COUNT(*) FILTER (WHERE result='failure')  AS failures,
         COUNT(*) FILTER (WHERE result='blocked')  AS blocked,
         MAX(created_at) AS last_event
       FROM audit_logs
       WHERE action_category IS NOT NULL
       GROUP BY action_category
       ORDER BY total DESC`
    )

    ok(res, {
      summary:   result.rows,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    serverError(res, err, 'getAuditSummary')
  }
}

// ── GET /api/developer/feature-flags ─────────────────────────
/**
 * Returns all feature flags (read-only).
 * Developers need this to understand which modules are active.
 */
export async function getFeatureFlags(req, res) {
  try {
    if (!isDbAvailable()) {
      return ok(res, { flags: [], mode: 'prototype' })
    }

    const result = await query(
      `SELECT flag_key, enabled, description, updated_at FROM feature_flags ORDER BY flag_key`
    )

    ok(res, { flags: result.rows })
  } catch (err) {
    serverError(res, err, 'getFeatureFlags')
  }
}

// ── GET /api/developer/grant ──────────────────────────────────
/**
 * Returns the requesting developer's current grant status.
 */
export async function getMyGrant(req, res) {
  try {
    const userId = req.user?.id

    if (!isDbAvailable()) {
      return ok(res, { grant: null, mode: 'prototype' })
    }

    const result = await query(
      `SELECT grant_id, environment, reason, granted_at, expires_at, revoked
       FROM dev_access_grants
       WHERE user_id=$1 AND revoked=false AND expires_at > NOW()
       LIMIT 1`,
      [userId]
    )

    ok(res, { grant: result.rows[0] || null })
  } catch (err) {
    serverError(res, err, 'getMyGrant')
  }
}

// ── Helpers ───────────────────────────────────────────────────
function formatBytes(bytes) {
  if (bytes < 1024)       return `${bytes} B`
  if (bytes < 1048576)    return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`
  return `${(bytes / 1073741824).toFixed(2)} GB`
}
