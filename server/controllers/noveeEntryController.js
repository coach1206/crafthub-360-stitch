/**
 * NOVEE OS — Entry Controller
 * Handles GET /api/novee/entry/status, POST /api/novee/entry/open,
 * POST /api/novee/demo/start, POST /api/novee/demo/end,
 * GET  /api/novee/demo/status
 */

import {
  buildModuleStatus,
  canAccessModule,
  startDemoSession,
  endDemoSession,
  isDemoActive,
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
    const demoId = req.cookies?.novee_demo_session || req.headers?.['x-novee-demo-session'] || null
    const demo   = demoId ? validateDemoSession(demoId) : { valid: false }

    const authenticated = !!(user && user.role !== 'guest' && user.mode !== 'prototype')
    const demoActive    = demo.valid

    // Safe user payload — no tokens, no credentials
    const userPayload = authenticated
      ? {
          id:          user.id,
          displayName: user.displayName || null,
          roles:       [user.role],
        }
      : null

    // Tenant: use env binding or safe placeholder
    const tenantPayload = {
      id:   process.env.VENUE_ID  || 'novee-grand-lounge',
      name: process.env.VENUE_NAME || 'NOVEE Grand Lounge',
    }

    // Session: provide tokenId (jti) only — never the raw JWT
    const sessionPayload = authenticated
      ? {
          id:        user.jti  || null,
          expiresAt: null,     // JWT exp not exposed to browser
        }
      : demoActive
        ? { id: demoId, expiresAt: demo.expiresAt }
        : null

    await auditEntryViewed(req, user?.id, user?.role)

    return res.json({
      authenticated,
      user:    userPayload,
      tenant:  tenantPayload,
      modules: buildModuleStatus(user, demoActive),
      demoMode: {
        available: true,
        active:    demoActive,
      },
      session: sessionPayload,
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
    const demoId = req.cookies?.novee_demo_session || req.headers?.['x-novee-demo-session'] || null
    const demo   = demoId ? validateDemoSession(demoId) : { valid: false }
    const demoActive = demo.valid

    // Input validation
    if (!moduleId || typeof moduleId !== 'string') {
      return res.status(400).json({
        success: false,
        code: 'INVALID_MODULE',
        message: 'A valid module name is required.',
      })
    }

    if (!VALID_MODULES.has(moduleId)) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_MODULE',
        message: 'Unknown module.',
      })
    }

    const { allowed, code, message } = canAccessModule(user, moduleId, demoActive)
    const ip = clientIp(req)
    const ua = userAgent(req)

    await auditModuleEntry(
      user?.id  || 'guest',
      user?.role || 'guest',
      moduleId,
      allowed ? 'granted' : 'denied',
      code,
      ip,
      ua
    )

    if (!allowed) {
      return res.status(403).json({ success: false, code, message })
    }

    const mod = MODULE_REGISTRY[moduleId]
    return res.json({
      success:   true,
      module:    moduleId,
      route:     mod.route,
      sessionId: user?.jti || demoId || null,
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Module entry check failed.' })
  }
}

// ── POST /api/novee/demo/start ────────────────────────────────
export async function startDemo(req, res) {
  try {
    const userId = req.user?.id || 'guest'
    const result = await startDemoSession(userId)

    // Set httpOnly demo session cookie (expires with demo session)
    const cookieOpts = {
      httpOnly: true,
      sameSite: 'lax',
      secure:   process.env.NODE_ENV === 'production',
      maxAge:   4 * 60 * 60 * 1000, // 4 hours
      path:     '/',
    }
    res.cookie('novee_demo_session', result.demoSessionId, cookieOpts)

    return res.json({
      success:       true,
      demoSessionId: result.demoSessionId,
      expiresAt:     result.expiresAt,
      mode:          'demo',
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
    const demoId = req.cookies?.novee_demo_session || req.headers?.['x-novee-demo-session'] || null
    const result = demoId ? validateDemoSession(demoId) : { valid: false }
    return res.json({
      active:    result.valid,
      expiresAt: result.valid ? result.expiresAt : null,
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve demo status.' })
  }
}
