/**
 * SmokeCraft Management Sync — server-verifiable guest identity.
 *
 * Reuses the existing JWT infrastructure (authService.js, authConfig.js)
 * rather than inventing a new signing/verification mechanism. Guests get
 * a SEPARATE cookie from real-user auth (GUEST_COOKIE_NAME below), never
 * mixed with novee_auth, so a real user's session is never confused with
 * a guest session.
 *
 * A guest identifier is never trusted from the client (body/query/header) —
 * it only ever comes from a valid, server-verified cookie JWT.
 */
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { authConfig } from '../config/authConfig.js'

const GUEST_COOKIE_NAME = 'smokecraft_guest_session'
const GUEST_JWT_EXPIRES_IN = '90d'
const GUEST_JWT_EXPIRES_IN_MS = 90 * 24 * 60 * 60 * 1000

function issueGuestToken() {
  const guestReference = crypto.randomUUID()
  const jti = crypto.randomUUID()
  const token = jwt.sign(
    { sub: guestReference, role: 'guest', scope: 'smokecraft_guest', jti },
    authConfig.JWT_SECRET,
    { expiresIn: GUEST_JWT_EXPIRES_IN, issuer: 'crafthub-360', audience: 'smokecraft-guest' }
  )
  return { token, guestReference }
}

function verifyGuestToken(token) {
  try {
    const payload = jwt.verify(token, authConfig.JWT_SECRET, {
      issuer: 'crafthub-360',
      audience: 'smokecraft-guest',
    })
    if (payload.scope !== 'smokecraft_guest' || !payload.sub) return null
    return payload
  } catch {
    return null
  }
}

function setGuestCookie(res, token) {
  res.cookie(GUEST_COOKIE_NAME, token, {
    httpOnly: true,
    secure: authConfig.AUTH_COOKIE_SECURE,
    sameSite: authConfig.AUTH_COOKIE_SAMESITE,
    // Package 2: broadened from '/api/smokecraft/management-sync' to
    // '/api/smokecraft' so the same guest identity cookie is also sent
    // to Golden Box routes (/api/smokecraft/golden-box/...), which
    // reuse this exact identity system by design (Package 1). Still
    // scoped to SmokeCraft's API surface only, not the whole app.
    path: '/api/smokecraft',
    maxAge: GUEST_JWT_EXPIRES_IN_MS,
  })
}

/**
 * Resolves the caller's SmokeCraft Management Sync identity:
 *   - an authenticated user (req.user already set by requireAuth/optionalAuth), OR
 *   - a verified server-issued guest identity (existing cookie, re-verified —
 *     never re-issued here; issuance only happens via ensureSmokeCraftGuestIdentity)
 * Sets req.smokecraftIdentity = { type: 'user'|'guest', id, role }.
 * Does not reject the request — routes that require an identity use
 * requireSmokeCraftIdentity after this runs.
 */
export function attachSmokeCraftIdentity(req, res, next) {
  if (req.user && req.user.mode !== 'prototype' && req.user.role !== 'guest') {
    req.smokecraftIdentity = { type: 'user', id: req.user.id, role: req.user.role }
    return next()
  }

  const cookieToken = req.cookies?.[GUEST_COOKIE_NAME]
  if (cookieToken) {
    const payload = verifyGuestToken(cookieToken)
    if (payload) {
      req.smokecraftIdentity = { type: 'guest', id: payload.sub, role: 'guest' }
      return next()
    }
    req.smokecraftGuestTokenInvalid = true
  }

  req.smokecraftIdentity = null
  next()
}

/**
 * Issues a fresh guest identity + cookie if the caller has no valid
 * identity yet. Idempotent: a caller with an already-valid guest cookie
 * or an authenticated user identity is left untouched (re-issuing would
 * silently orphan their existing journeys under a new guest_reference).
 * Must run after attachSmokeCraftIdentity.
 */
export function ensureSmokeCraftGuestIdentity(req, res, next) {
  if (req.smokecraftIdentity) return next()

  const { token, guestReference } = issueGuestToken()
  setGuestCookie(res, token)
  req.smokecraftIdentity = { type: 'guest', id: guestReference, role: 'guest', freshlyIssued: true }
  next()
}

/**
 * Rejects the request (401) if no valid identity was resolved.
 * Use on every Management Sync endpoint that touches journey data.
 */
export function requireSmokeCraftIdentity(req, res, next) {
  if (!req.smokecraftIdentity) {
    return res.status(401).json({
      success: false,
      error: req.smokecraftGuestTokenInvalid ? 'guest_session_invalid' : 'identity_required',
      message: req.smokecraftGuestTokenInvalid
        ? 'Guest session token is invalid or expired.'
        : 'No verified identity — call the guest-session endpoint first or sign in.',
    })
  }
  next()
}

export const SMOKECRAFT_GUEST_COOKIE_NAME = GUEST_COOKIE_NAME
