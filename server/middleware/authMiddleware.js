/**
 * Auth Middleware — Phase 8.5
 *
 * Identity resolution order (first match wins):
 *   1. JWT from HttpOnly cookie `novee_auth`
 *   2. JWT from Authorization: Bearer <token>
 *   3. Dev headers (development only, founder role blocked by blockDevFounderSpoofing)
 *   4. Prototype guest fallback (development only)
 *   5. Production: 401 if nothing above matched
 *
 * SECURITY:
 * - Frontend localStorage NEVER grants backend access.
 * - Founder access via dev headers is blocked unless ALLOW_DEV_FOUNDER=true.
 * - Production rejects all requests without a valid JWT.
 */

import { verifyJwtToken, isSessionRevoked } from '../services/authService.js'
import { authConfig }                        from '../config/authConfig.js'
import { ROLE_LEVELS }                       from '../config/roleMap.js'

const VALID_ROLES = new Set(Object.keys(ROLE_LEVELS))

/**
 * Attaches req.user from a verified JWT or dev headers.
 * Always call this before any role/permission check.
 */
export async function requireAuth(req, res, next) {
  // ── 1. Try JWT from HttpOnly cookie ────────────────────────
  const cookieToken  = req.cookies?.[authConfig.AUTH_COOKIE_NAME]
  // ── 2. Try Bearer token ─────────────────────────────────────
  const bearerHeader = req.headers.authorization
  const bearerToken  = bearerHeader?.startsWith('Bearer ') ? bearerHeader.slice(7) : null

  const token = cookieToken || bearerToken

  if (token) {
    const payload = verifyJwtToken(token)
    if (payload) {
      const revoked = await isSessionRevoked(payload.jti)
      if (!revoked) {
        req.user = {
          id:          payload.sub,
          role:        payload.role,
          email:       payload.email       || null,
          displayName: payload.displayName || null,
          jti:         payload.jti,
          mode:        'jwt',
        }
        return next()
      }
    }
  }

  // ── 3 + 4. Dev mode fallbacks (development only) ────────────
  if (process.env.NODE_ENV !== 'production') {
    const devRole  = (req.headers['x-novee-user-role']  || '').toLowerCase().trim()
    const devId    =  req.headers['x-novee-user-id']    || 'dev-user'
    const devEmail =  req.headers['x-novee-user-email'] || null

    if (devRole && VALID_ROLES.has(devRole)) {
      req.user = {
        id:    devId,
        role:  devRole,
        email: devEmail,
        mode:  'dev-header',
      }
      return next()
    }

    // Prototype guest fallback
    req.user = { id: 'proto-guest', role: 'guest', mode: 'prototype' }
    return next()
  }

  // ── 5. Production: reject ────────────────────────────────────
  return res.status(401).json({ success: false, message: 'Authentication required' })
}

/**
 * Attaches guestContext (venueId, deviceId) for public guest routes.
 */
export function attachGuestContext(req, _res, next) {
  req.guestContext = {
    venueId:  process.env.VENUE_ID  || 'novee-grand-lounge',
    deviceId: process.env.DEVICE_ID || 'kiosk-001',
    mode:     process.env.NODE_ENV  || 'development',
  }
  next()
}
