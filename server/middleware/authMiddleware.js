/**
 * Auth Middleware — placeholder for future role-based authentication.
 * Currently runs in "prototype mode" — all requests are passed through.
 *
 * Future implementation:
 *   - Validate JWT / session token
 *   - Attach req.user with role
 *   - Reject unauthorised requests
 */

/**
 * Prototype pass-through auth.
 * In production, replace with real token validation.
 */
export function requireAuth(req, res, next) {
  // Prototype mode — always pass through
  if (process.env.NODE_ENV !== 'production') {
    req.user = { id: 'prototype-user', role: 'staff', mode: 'prototype' }
    return next()
  }
  // Future: validate bearer token
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) {
    return res.status(401).json({ success: false, message: 'Authorisation required' })
  }
  // TODO: validate token, populate req.user
  next()
}

/**
 * Attaches prototype identity to all requests (always passes).
 * Use this on public guest-facing routes.
 */
export function attachGuestContext(req, _res, next) {
  req.guestContext = {
    venueId:  process.env.VENUE_ID  || 'novee-grand-lounge',
    deviceId: process.env.DEVICE_ID || 'kiosk-001',
    mode:     process.env.NODE_ENV  || 'development',
  }
  next()
}
