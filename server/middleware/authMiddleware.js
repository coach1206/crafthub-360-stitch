/**
 * Auth Middleware — Phase 10 (Auth v2)
 *
 * Identity resolution order (first match wins):
 *   1. JWT from HttpOnly cookie `novee_auth`
 *   2. JWT from Authorization: Bearer <token>
 *   3. Dev headers (development ONLY — all dev headers are HARD-BLOCKED in production)
 *   4. Prototype guest fallback (development ONLY)
 *   5. Production: 401 if nothing above matched
 *
 * PRODUCTION SECURITY GUARANTEES:
 * - Dev headers (x-novee-user-role, x-novee-user-id, x-novee-user-email)
 *   are UNCONDITIONALLY rejected in production regardless of any env var.
 * - Prototype guest fallback is UNCONDITIONALLY disabled in production.
 * - ALLOW_DEV_FOUNDER is ignored in production (enforced in authConfig.js).
 * - Frontend localStorage NEVER grants backend access.
 */

import { verifyJwtToken, isSessionRevoked } from '../services/authService.js'
import { authConfig }                        from '../config/authConfig.js'
import { ROLE_LEVELS }                       from '../config/roleMap.js'
import { recordSecurityEvent }               from '../services/securityEventService.js'

const VALID_ROLES = new Set(Object.keys(ROLE_LEVELS))
const IS_PROD     = process.env.NODE_ENV === 'production'

// Dev header names — blocked unconditionally in production
const DEV_HEADER_ROLE  = 'x-novee-user-role'
const DEV_HEADER_ID    = 'x-novee-user-id'
const DEV_HEADER_EMAIL = 'x-novee-user-email'

/**
 * Attaches req.user from a verified JWT or (in dev) dev headers.
 * Always call this before any role/permission check.
 */
export async function requireAuth(req, res, next) {
  // ── PRODUCTION: hard-block dev headers unconditionally ──────
  if (IS_PROD) {
    const hasDevHeaders =
      req.headers[DEV_HEADER_ROLE] ||
      req.headers[DEV_HEADER_ID]   ||
      req.headers[DEV_HEADER_EMAIL]

    if (hasDevHeaders) {
      // Log the intrusion attempt
      await recordSecurityEvent(
        'unknown', 'guest',
        'security.dev_header_blocked_in_production', req.path,
        {
          blocked:     true,
          environment: 'production',
          ip:          req.ip || req.headers['x-forwarded-for'] || 'unknown',
          headers: {
            role:  req.headers[DEV_HEADER_ROLE]  || null,
            id:    req.headers[DEV_HEADER_ID]    || null,
            email: req.headers[DEV_HEADER_EMAIL] || null,
          },
        }
      ).catch(() => {})

      return res.status(403).json({
        success: false,
        message: 'Development authentication headers are not permitted in production.',
      })
    }
  }

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
          staffId:     payload.staffId     || null,
          profileId:   payload.profileId   || null,
          jti:         payload.jti,
          mode:        'jwt',
        }
        return next()
      }
    }
  }

  // ── 3 + 4. Dev mode only — NEVER runs in production ─────────
  if (!IS_PROD) {
    const devRole  = (req.headers[DEV_HEADER_ROLE]  || '').toLowerCase().trim()
    const devId    =  req.headers[DEV_HEADER_ID]    || 'dev-user'
    const devEmail =  req.headers[DEV_HEADER_EMAIL] || null

    if (devRole && VALID_ROLES.has(devRole)) {
      req.user = {
        id:    devId,
        role:  devRole,
        email: devEmail,
        mode:  'dev-header',
      }
      return next()
    }

    // Prototype guest fallback — development only
    req.user = { id: 'proto-guest', role: 'guest', mode: 'prototype' }
    return next()
  }

  // ── 5. Production: no valid JWT found ───────────────────────
  return res.status(401).json({ success: false, message: 'Authentication required' })
}

/**
 * Optional auth — attaches req.user if a valid JWT is present,
 * but does not reject if there is no token.
 * Use on routes that serve both authenticated and guest users.
 */
export async function optionalAuth(req, res, next) {
  // Block dev headers in production first
  if (IS_PROD) {
    if (req.headers[DEV_HEADER_ROLE] || req.headers[DEV_HEADER_ID] || req.headers[DEV_HEADER_EMAIL]) {
      return res.status(403).json({
        success: false,
        message: 'Development authentication headers are not permitted in production.',
      })
    }
  }

  const cookieToken  = req.cookies?.[authConfig.AUTH_COOKIE_NAME]
  const bearerHeader = req.headers.authorization
  const bearerToken  = bearerHeader?.startsWith('Bearer ') ? bearerHeader.slice(7) : null
  const token        = cookieToken || bearerToken

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
          staffId:     payload.staffId     || null,
          profileId:   payload.profileId   || null,
          jti:         payload.jti,
          mode:        'jwt',
        }
      }
    }
  }

  if (!req.user && !IS_PROD) {
    const devRole = (req.headers[DEV_HEADER_ROLE] || '').toLowerCase().trim()
    if (devRole && VALID_ROLES.has(devRole)) {
      req.user = {
        id:    req.headers[DEV_HEADER_ID]    || 'dev-user',
        role:  devRole,
        email: req.headers[DEV_HEADER_EMAIL] || null,
        mode:  'dev-header',
      }
    } else {
      req.user = { id: 'proto-guest', role: 'guest', mode: 'prototype' }
    }
  }

  next()
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
