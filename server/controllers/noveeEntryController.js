/**
 * NOVEE OS — Entry Controller
 * GET  /api/novee/entry/status
 * POST /api/novee/entry/open
 * POST /api/novee/demo/start
 * POST /api/novee/demo/end
 * GET  /api/novee/demo/status
 *
 * No hardcoded tenant values. No placeholder data.
 * All authorization is server-side.
 */

import {
  buildModuleStatus,
  canAccessModule,
  resolveTenant,
  startDemoSession,
  endDemoSession,
  validateDemoSession,
  auditEntryViewed,
  auditModuleEntry,
  MODULE_REGISTRY,
} from '../services/noveeEntryService.js'

const VALID_MODULES = new Set(Object.keys(MODULE_REGISTRY))

function clientIp(req) {
  return req?.ip || req?.headers?.['x-forwarded-for'] || 'unknown'
}
function userAgent(req) {
  return req?.headers?.['user-agent'] || 'unknown'
}

// ── GET /api/novee/entry/status ───────────────────────────────
export async function getEntryStatus(req, res) {
  try {
    const user   = req.user || null
    const tenant = resolveTenant(req, user)

    const demoId = req.cookies?.novee_demo_session
      || req.headers?.['x-novee-demo-session']
      || null
    const demo   = demoId ? await validateDemoSession(demoId) : { valid: false }
    const demoActive = demo.valid

    const authenticated = !!(user && user.role !== 'guest' && user.mode !== 'prototype')

    // Safe user payload — no tokens, no credentials, no internal IDs beyond userId
    const userPayload = authenticated
      ? { id: user.id, displayName: user.displayName || null, roles: [user.role] }
      : null

    // Session info — jti reference only, never the raw JWT
    const sessionPayload = authenticated
      ? { id: user.jti || null, expiresAt: null }
      : demoActive
        ? { id: null, expiresAt: demo.expiresAt }   // demoSessionId not re-sent to browser
        : null

    await auditEntryViewed(req, user?.id, user?.role)

    return res.json({
      authenticated,
      user:    userPayload,
      tenant,                        // null when not resolvable — never a placeholder
      modules: buildModuleStatus(user, tenant, demoActive),
      demoMode: { available: true, active: demoActive },
      session:  sessionPayload,
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Unable to retrieve entry status.' })
  }
}

// ── POST /api/novee/entry/open ────────────────────────────────
export async function openModule(req, res) {
  try {
    const { module: moduleId } = req.body || {}
    const user   = req.user || null
    const tenant = resolveTenant(req, user)

    const demoId = req.cookies?.novee_demo_session
      || req.headers?.['x-novee-demo-session']
      || null
    const demo   = demoId ? await validateDemoSession(demoId) : { valid: false }
    const demoActive = demo.valid

    if (!moduleId || typeof moduleId !== 'string') {
      return res.status(400).json({ success: false, code: 'INVALID_MODULE', message: 'A valid module name is required.' })
    }
    if (!VALID_MODULES.has(moduleId)) {
      return res.status(400).json({ success: false, code: 'INVALID_MODULE', message: 'Unknown module.' })
    }

    const { allowed, code, message } = canAccessModule(user, tenant, moduleId, demoActive)
    const ip = clientIp(req)
    const ua = userAgent(req)

    await auditModuleEntry(user?.id || 'guest', user?.role || 'guest', moduleId, allowed ? 'granted' : 'denied', code, ip, ua)

    if (!allowed) {
      return res.status(403).json({ success: false, code, message })
    }

    const mod = MODULE_REGISTRY[moduleId]
    return res.json({
      success:   true,
      module:    moduleId,
      route:     mod.route,
      sessionId: user?.jti || null,   // never return demoSessionId in body
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Module entry check failed.' })
  }
}

// ── POST /api/novee/demo/start ────────────────────────────────
export async function startDemo(req, res) {
  try {
    const user     = req.user || null
    const tenant   = resolveTenant(req, user)
    const userId   = user?.id || 'guest'
    const tenantId = tenant?.id || null

    const result = await startDemoSession(userId, tenantId)

    if (result.error === 'DEMO_STORAGE_UNAVAILABLE') {
      return res.status(503).json({
        success: false,
        code:    'DEMO_STORAGE_UNAVAILABLE',
        message: 'Demo sessions require persistent storage. Please try again later.',
      })
    }

    const IS_PROD = process.env.NODE_ENV === 'production'
    res.cookie('novee_demo_session', result.demoSessionId, {
      httpOnly: true,
      sameSite: 'lax',
      secure:   IS_PROD,
      maxAge:   4 * 60 * 60 * 1000,
      path:     '/',
    })

    return res.json({
      success:   true,
      expiresAt: result.expiresAt,
      mode:      'demo',
      // demoSessionId intentionally omitted from response body
      // It is only in the httpOnly cookie
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to start demo session.' })
  }
}

// ── POST /api/novee/demo/end ──────────────────────────────────
export async function endDemo(req, res) {
  try {
    const demoId = req.cookies?.novee_demo_session
      || req.body?.demoSessionId
      || req.headers?.['x-novee-demo-session']

    if (demoId) {
      await endDemoSession(demoId)
      res.clearCookie('novee_demo_session', { path: '/' })
    }
    return res.json({ success: true })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to end demo session.' })
  }
}

// ── GET /api/novee/demo/status ────────────────────────────────
export async function getDemoStatus(req, res) {
  try {
    const demoId = req.cookies?.novee_demo_session
      || req.headers?.['x-novee-demo-session']
      || null
    const result = demoId ? await validateDemoSession(demoId) : { valid: false }
    return res.json({
      active:    result.valid,
      expiresAt: result.valid ? result.expiresAt : null,
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve demo status.' })
  }
}
