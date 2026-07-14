/**
 * NOVEE OS — Entry Service
 * Authoritative server-side module access control and demo session management.
 * Extends existing auditService, demoSessionService, and ROLE_LEVELS.
 */

import { log as auditLog } from './auditService.js'
import * as demoSvc        from './demoSessionService.js'
import { ROLE_LEVELS }     from '../config/roleMap.js'
import crypto              from 'crypto'

// ── Module Registry (backend source of truth) ─────────────────
export const MODULE_REGISTRY = Object.freeze({
  novee: {
    id:             'novee',
    name:           'NOVEE OS',
    route:          '/home',
    enabled:        true,
    version:        '2.0.0',
    allowedRoles:   ['staff', 'manager', 'admin', 'founder_level_0'],
    demoAvailable:  true,
    maintenance:    false,
  },
  crafthub: {
    id:             'crafthub',
    name:           'CraftHub 360',
    route:          '/crafthub',
    enabled:        true,
    version:        '1.0.0',
    allowedRoles:   ['guest', 'passport_member', 'human_mentor', 'staff', 'manager', 'admin', 'founder_level_0'],
    demoAvailable:  true,
    maintenance:    false,
  },
  smokecraft: {
    id:             'smokecraft',
    name:           'SmokeCraft 360',
    route:          '/smokecraft',
    enabled:        true,
    version:        '1.0.0',
    allowedRoles:   ['guest', 'passport_member', 'human_mentor', 'staff', 'manager', 'admin', 'founder_level_0'],
    demoAvailable:  true,
    maintenance:    false,
  },
})

const VALID_MODULES = new Set(Object.keys(MODULE_REGISTRY))

// ── In-memory demo session store (authoritative when DB unavailable) ──
const _demoSessions = new Map()          // sessionId → { expiresAt, active, userId }
const DEMO_TTL_MS   = 4 * 60 * 60 * 1000 // 4 hours

// ── Access Authorization ──────────────────────────────────────

/**
 * Determine if a user may access a module.
 * @param {object|null} user          req.user or null (unauthenticated)
 * @param {string}      moduleId      'novee' | 'crafthub' | 'smokecraft'
 * @param {boolean}     [demoActive]  true when a server-side demo session is active
 * @returns {{ allowed: boolean, code: string|null, message: string }}
 */
export function canAccessModule(user, moduleId, demoActive = false) {
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
  if (mod.allowedRoles.includes(role)) {
    return { allowed: true, code: null, message: 'Access granted.' }
  }

  // Guest/unauthenticated trying a staff+ module
  if (!user || user.role === 'guest' || user.mode === 'prototype') {
    return { allowed: false, code: 'UNAUTHORIZED', message: 'Please log in to access this module.' }
  }

  return { allowed: false, code: 'UNAUTHORIZED', message: 'Your account does not have access to this module.' }
}

// ── Module status for status response ────────────────────────

export function buildModuleStatus(user, demoActive) {
  const result = {}
  for (const [id, mod] of Object.entries(MODULE_REGISTRY)) {
    const { allowed } = canAccessModule(user, id, demoActive)
    result[id] = {
      available:  mod.enabled && !mod.maintenance,
      authorized: allowed,
      route:      mod.route,
    }
  }
  return result
}

// ── Demo Session Management ───────────────────────────────────

function demoSessionId() {
  return `demo_entry_${crypto.randomBytes(8).toString('hex')}`
}

/**
 * Start a guest demo session.
 * Returns { demoSessionId, expiresAt, mode }.
 */
export async function startDemoSession(userId = 'guest') {
  const id        = demoSessionId()
  const expiresAt = new Date(Date.now() + DEMO_TTL_MS).toISOString()

  _demoSessions.set(id, { expiresAt, active: true, userId, startedAt: new Date().toISOString() })

  // Also record in existing demo_sessions table if DB available
  try {
    await demoSvc.startDemo({
      demoType:      'guest_preview',
      audienceType:  'public_guest',
      venueName:     '',
      presenterName: '',
      createdBy:     userId,
    })
  } catch { /* DB unavailable — in-memory fallback is authoritative */ }

  await auditLog('system', userId, 'novee.demo.started', 'demo_session', id, { mode: 'guest_preview' })

  return { demoSessionId: id, expiresAt, mode: 'demo' }
}

/**
 * Validate a demo session by ID.
 * Returns { valid: boolean, expiresAt, userId }.
 */
export function validateDemoSession(sessionId) {
  if (!sessionId) return { valid: false }
  const session = _demoSessions.get(sessionId)
  if (!session || !session.active) return { valid: false }
  if (new Date(session.expiresAt) < new Date()) {
    session.active = false
    return { valid: false }
  }
  return { valid: true, expiresAt: session.expiresAt, userId: session.userId }
}

/**
 * End a demo session by ID.
 */
export async function endDemoSession(sessionId) {
  const session = _demoSessions.get(sessionId)
  if (!session) return false
  session.active = false
  await auditLog('system', session.userId, 'novee.demo.ended', 'demo_session', sessionId, {})
  return true
}

/** Check whether demo mode is currently active for this session ID. */
export function isDemoActive(sessionId) {
  return validateDemoSession(sessionId).valid
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
  const action = result === 'granted'
    ? `novee.module.entry.granted`
    : `novee.module.entry.denied`

  await auditLog(
    role || 'guest', userId || 'guest',
    action, 'module', moduleId,
    { result, code: code || null, ip, userAgent: ua }
  ).catch(() => {})
}
