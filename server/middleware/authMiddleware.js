/**
 * Auth Middleware — attaches identity to every request.
 *
 * Development mode (NODE_ENV !== 'production'):
 *   Accepts three safe dev headers:
 *     x-novee-user-id    — e.g. "admin-001"
 *     x-novee-user-role  — e.g. "admin" | "manager" | "founder_level_0"
 *     x-novee-user-email — e.g. "admin@novee.dev"
 *   Falls back to { role: 'guest' } if no headers supplied.
 *
 * Production mode:
 *   Validates a Bearer JWT from the Authorization header.
 *   Returns 401 if missing or invalid.
 *
 * SECURITY NOTE:
 *   Frontend localStorage can never elevate a user to founder_level_0.
 *   Only the backend identity context (header/token) determines the effective role.
 */

import { ROLE_LEVELS } from '../config/roleMap.js'

const VALID_ROLES = new Set(Object.keys(ROLE_LEVELS))

/**
 * Attaches req.user to every request.
 * Always call this before requireRole / requirePermission / requireFounderLevel0.
 */
export function requireAuth(req, res, next) {
  if (process.env.NODE_ENV !== 'production') {
    const devRole  = (req.headers['x-novee-user-role']  || '').toLowerCase().trim()
    const devId    =  req.headers['x-novee-user-id']    || 'dev-user'
    const devEmail =  req.headers['x-novee-user-email'] || null

    if (devRole && VALID_ROLES.has(devRole)) {
      req.user = {
        id:    devId,
        role:  devRole,
        email: devEmail || `${devRole.replace(/_/g, '-')}@novee.dev`,
        mode:  'dev-header',
      }
    } else {
      // Default prototype identity — guests only
      req.user = {
        id:    'proto-guest',
        role:  'guest',
        email: null,
        mode:  'prototype',
      }
    }
    return next()
  }

  // Production: require Bearer token
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required' })
  }
  const token = authHeader.slice(7)
  if (!token) {
    return res.status(401).json({ success: false, message: 'Invalid authentication token' })
  }

  // TODO Phase 9: validate JWT, populate req.user
  // For now, reject all production auth attempts until JWT is wired.
  return res.status(401).json({
    success: false,
    message: 'Authentication not yet configured — awaiting Phase 9 auth integration',
  })
}

/**
 * Attaches a guest-context object (venueId, deviceId) to the request.
 * Safe to use on all public guest-facing routes.
 */
export function attachGuestContext(req, _res, next) {
  req.guestContext = {
    venueId:  process.env.VENUE_ID  || 'novee-grand-lounge',
    deviceId: process.env.DEVICE_ID || 'kiosk-001',
    mode:     process.env.NODE_ENV  || 'development',
  }
  next()
}
