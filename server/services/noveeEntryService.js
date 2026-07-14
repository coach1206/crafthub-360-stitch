/**
 * NOVEE OS — Entry Service
 * Authoritative server-side module access control, tenant resolution,
 * and durable demo session management.
 *
 * Production guarantees:
 *   - No hardcoded tenant placeholders
 *   - Demo sessions are DB-backed; in-memory fallback for dev/test only
 *   - In production with no DB → DEMO_STORAGE_UNAVAILABLE (no silent fallback)
 *   - Raw session IDs never written to logs (truncated reference only)
 *   - canAccessModule is the single authorization gate
 */

import { log as auditLog }           from './auditService.js'
import { query, isDbAvailable }      from '../db/connection.js'
import { ROLE_LEVELS }               from '../config/roleMap.js'
import crypto                        from 'crypto'

const IS_PROD     = process.env.NODE_ENV === 'production'
const DEMO_TTL_MS = 4 * 60 * 60 * 1000   // 4 hours

// ── Module Registry (backend source of truth) ─────────────────
export const MODULE_REGISTRY = Object.freeze({
  novee: {
    id:            'novee',
    name:          'NOVEE OS',
    route:         '/home',
    enabled:       true,
    version:       '2.0.0',
    allowedRoles:  ['staff', 'manager', 'admin', 'founder_level_0'],
    demoAvailable: true,
    maintenance:   false,
  },
  crafthub: {
    id:            'crafthub',
    name:          'CraftHub 360',
    route:         '/crafthub',
    enabled:       true,
    version:       '1.0.0',
    allowedRoles:  ['guest', 'passport_member', 'human_mentor', 'staff', 'manager', 'admin', 'founder_level_0'],
    demoAvailable: true,
    maintenance:   false,
  },
  smokecraft: {
    id:            'smokecraft',
    name:          'SmokeCraft 360',
    route:         '/smokecraft',
    enabled:       true,
    version:       '1.0.0',
    allowedRoles:  ['guest', 'passport_member', 'human_mentor', 'staff', 'manager', 'admin', 'founder_level_0'],
    demoAvailable: true,
    maintenance:   false,
  },
})

const VALID_MODULES = new Set(Object.keys(MODULE_REGISTRY))

// ── Tenant Resolution ─────────────────────────────────────────
const PLACEHOLDER_IDS = new Set(['novee-grand-lounge', 'kiosk-001', ''])

/**
 * Resolve the real tenant for this request.
 * Returns { id, name } or null — never a placeholder value.
 *
 * Resolution order:
 *   1. Authenticated user tenant claim (future JWT field)
 *   2. Request tenant context (venueTenantGuard / guestContext)
 *   3. Configured deployment env var VENUE_ID (only if not a placeholder)
 *   4. null — no tenant resolvable
 */
export function resolveTenant(req, user) {
  // 1. Future-proof: user JWT tenant claim
  if (user?.tenantId && !PLACEHOLDER_IDS.has(user.tenantId)) {
    return { id: user.tenantId, name: user.tenantName || null }
  }

  // 2. Request-scoped tenant from middleware
  if (req?.tenantVenueId && !PLACEHOLDER_IDS.has(req.tenantVenueId)) {
    return { id: req.tenantVenueId, name: null }
  }
  if (req?.guestContext?.venueId && !PLACEHOLDER_IDS.has(req.guestContext.venueId)) {
    return { id: req.guestContext.venueId, name: null }
  }

  // 3. Configured deployment tenant (env binding — not a placeholder)
  const envId = process.env.VENUE_ID
  if (envId && envId !== 'undefined' && !PLACEHOLDER_IDS.has(envId)) {
    return { id: envId, name: process.env.VENUE_NAME || null }
  }

  // 4. No real tenant resolvable
  return null
}

// ── Access Authorization ──────────────────────────────────────

/**
 * Determine if a user may access a module.
 * @param {object|null} user        req.user or null
 * @param {object|null} tenant      result of resolveTenant()
 * @param {string}      moduleId    'novee' | 'crafthub' | 'smokecraft'
 * @param {boolean}     demoActive  true when a valid server-side demo session exists
 * @returns {{ allowed: boolean, code: string|null, message: string }}
 */
export function canAccessModule(user, tenant, moduleId, demoActive = false) {
  if (!VALID_MODULES.has(moduleId)) {
    return { allowed: false, code: 'INVALID_MODULE', message: 'Unknown module.' }
  }

  const mod = MODULE_REGISTRY[moduleId]

  if (!mod.enabled) {
    return { allowed: false, code: 'MODULE_DISABLED', message: `${mod.name} is currently unavailable.` }
  }

  if (mod.maintenance) {
    return { allowed: false, code: 'MAINTENANCE', message: `${mod.name} is undergoing maintenance.` }
  }

  // Demo mode: allow any demo-available module without credentials
  if (demoActive && mod.demoAvailable) {
    return { allowed: true, code: null, message: 'Demo access granted.' }
  }

  const role = user?.role || 'guest'

  if (!mod.allowedRoles.includes(role)) {
    const isAuthenticated = !!(user && role !== 'guest' && user.mode !== 'prototype')
    if (!isAuthenticated) {
      return { allowed: false, code: 'UNAUTHORIZED', message: 'Please log in to access this module.' }
    }
    return { allowed: false, code: 'UNAUTHORIZED', message: 'Your account does not have access to this module.' }
  }

  return { allowed: true, code: null, message: 'Access granted.' }
}

// ── Module status map for status response ─────────────────────

export function buildModuleStatus(user, tenant, demoActive) {
  const result = {}
  for (const [id, mod] of Object.entries(MODULE_REGISTRY)) {
    const { allowed } = canAccessModule(user, tenant, id, demoActive)
    result[id] = {
      available:  mod.enabled && !mod.maintenance,
      authorized: allowed,
      route:      mod.route,
    }
  }
  return result
}

// ── Demo Session — in-memory fallback (dev/test only) ─────────
const _memSessions = new Map()

function memStore(sessionId, data) { _memSessions.set(sessionId, data) }
function memGet(sessionId)         { return _memSessions.get(sessionId) || null }
function memEnd(sessionId) {
  const s = _memSessions.get(sessionId)
  if (s) { s.status = 'ended'; s.ended_at = new Date().toISOString() }
}

// Truncate session ID for safe logging (first 8 chars only)
function safeId(sessionId) {
  return typeof sessionId === 'string' ? sessionId.substring(0, 8) + '…' : '[null]'
}

/**
 * Start a durable demo session.
 * In production: requires DB. Returns DEMO_STORAGE_UNAVAILABLE if DB is down.
 * In dev/test: falls back to in-memory.
 */
export async function startDemoSession(userId = 'guest', tenantId = null) {
  const sessionId = crypto.randomBytes(24).toString('hex')    // 48 hex, cryptographically random
  const expiresAt = new Date(Date.now() + DEMO_TTL_MS).toISOString()
  const now       = new Date().toISOString()

  if (isDbAvailable()) {
    try {
      await query(
        `INSERT INTO novee_entry_demo_sessions
           (session_id, user_id, tenant_id, mode, status, expires_at, created_at, metadata)
         VALUES ($1, $2, $3, 'demo', 'active', $4, NOW(), $5)`,
        [sessionId, userId || 'guest', tenantId || null, expiresAt, JSON.stringify({ source: 'lounge_entry' })]
      )
      await auditLog('system', userId, 'novee.demo.started', 'demo_session', safeId(sessionId), { mode: 'guest_preview', tenantId })
      return { demoSessionId: sessionId, expiresAt, mode: 'demo' }
    } catch (err) {
      console.error('[noveeEntryService] DB insert failed:', err.message)
      if (IS_PROD) return { error: 'DEMO_STORAGE_UNAVAILABLE' }
      // Dev: fall through to in-memory
    }
  } else if (IS_PROD) {
    // Production with no DB is a hard failure
    return { error: 'DEMO_STORAGE_UNAVAILABLE' }
  }

  // Dev/test in-memory fallback
  memStore(sessionId, { sessionId, userId: userId || 'guest', tenantId: tenantId || null, status: 'active', expiresAt, createdAt: now, endedAt: null, mode: 'demo' })
  await auditLog('system', userId, 'novee.demo.started', 'demo_session', safeId(sessionId), { mode: 'guest_preview', storage: 'memory' }).catch(() => {})
  return { demoSessionId: sessionId, expiresAt, mode: 'demo' }
}

/**
 * Validate a demo session. Returns { valid, expiresAt, userId, tenantId } or { valid: false }.
 */
export async function validateDemoSession(sessionId) {
  if (!sessionId) return { valid: false }

  if (isDbAvailable()) {
    try {
      const { rows } = await query(
        `SELECT session_id, user_id, tenant_id, status, expires_at, ended_at
           FROM novee_entry_demo_sessions WHERE session_id = $1`,
        [sessionId]
      )
      const row = rows[0]
      if (!row) return { valid: false }
      if (row.status !== 'active')                      return { valid: false }
      if (new Date(row.expires_at) < new Date()) {
        // Mark expired in DB (best-effort)
        query(`UPDATE novee_entry_demo_sessions SET status='expired' WHERE session_id=$1`, [sessionId]).catch(() => {})
        return { valid: false }
      }
      return { valid: true, expiresAt: row.expires_at, userId: row.user_id, tenantId: row.tenant_id || null }
    } catch (err) {
      console.error('[noveeEntryService] DB read failed:', err.message)
      if (IS_PROD) return { valid: false }
    }
  }

  // Dev/test in-memory
  const s = memGet(sessionId)
  if (!s || s.status !== 'active') return { valid: false }
  if (new Date(s.expiresAt) < new Date()) { s.status = 'expired'; return { valid: false } }
  return { valid: true, expiresAt: s.expiresAt, userId: s.userId, tenantId: s.tenantId || null }
}

/**
 * End a demo session.
 */
export async function endDemoSession(sessionId) {
  if (!sessionId) return false

  if (isDbAvailable()) {
    try {
      const { rowCount } = await query(
        `UPDATE novee_entry_demo_sessions
            SET status='ended', ended_at=NOW()
          WHERE session_id=$1 AND status='active'`,
        [sessionId]
      )
      await auditLog('system', 'guest', 'novee.demo.ended', 'demo_session', safeId(sessionId), {}).catch(() => {})
      return rowCount > 0
    } catch (err) {
      console.error('[noveeEntryService] DB end failed:', err.message)
      if (IS_PROD) return false
    }
  }

  memEnd(sessionId)
  await auditLog('system', 'guest', 'novee.demo.ended', 'demo_session', safeId(sessionId), {}).catch(() => {})
  return true
}

/** Synchronous check via in-memory store (for tests that need sync). */
export function isDemoActiveSync(sessionId) {
  const s = memGet(sessionId)
  if (!s || s.status !== 'active') return false
  if (new Date(s.expiresAt) < new Date()) { s.status = 'expired'; return false }
  return true
}

// ── Audit helpers ─────────────────────────────────────────────

export async function auditEntryViewed(req, userId, role) {
  await auditLog(
    role || 'guest', userId || 'guest',
    'novee.entry.viewed', 'root_lounge', 'landing',
    {
      ip:        req?.ip || req?.headers?.['x-forwarded-for'] || 'unknown',
      userAgent: req?.headers?.['user-agent'] || 'unknown',
    }
  ).catch(() => {})
}

export async function auditModuleEntry(userId, role, moduleId, result, code, ip, ua) {
  const action = result === 'granted' ? 'novee.module.entry.granted' : 'novee.module.entry.denied'
  await auditLog(
    role || 'guest', userId || 'guest',
    action, 'module', moduleId,
    { result, code: code || null, ip, userAgent: ua }
  ).catch(() => {})
}

// Exposed for tests only
export { _memSessions as _testMemSessions }
