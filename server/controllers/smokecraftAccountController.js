/**
 * SmokeCraft account controller — Holistic Fix 4B.
 * Uses the exact cookie/session mechanics already proven in
 * authController.js's promoteGuestToMember (setAuthCookie,
 * createAuthSession, revokeAuthSession) — no new session mechanism.
 */
import * as accountService from '../services/smokecraft/accountService.js'
import * as authService from '../services/authService.js'

const isProd = process.env.NODE_ENV === 'production'

function validEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function handleCreateAccount(req, res) {
  const { email, displayName } = req.body || {}
  if (!validEmail(email)) return res.status(400).json({ success: false, error: 'valid_email_required' })
  try {
    const result = await accountService.createAccount({ email: email.toLowerCase().trim(), displayName })
    if (!result.ok) return res.status(409).json({ success: false, error: result.error })

    const { token, tokenId } = authService.createJwtForUser({
      userId: result.userId, role: 'passport_member', email: result.email, displayName: result.displayName, profileId: result.profileId,
    })
    await authService.createAuthSession({ userId: result.userId, role: 'passport_member' }, tokenId, req)
    authService.setAuthCookie(res, token, 'passport_member')

    res.status(201).json({
      success: true,
      userId: result.userId,
      profileId: result.profileId,
      email: result.email,
      displayName: result.displayName,
      // Dev-only: no real email provider is connected in this environment
      // (see accountService.js header). Never present in production.
      devDeliveryPin: isProd ? undefined : result.pin,
    })
  } catch (err) {
    res.status(err.code === 'database_unavailable' ? 503 : 500).json({ success: false, error: err.code === 'database_unavailable' ? 'database_unavailable' : 'internal_error' })
  }
}

export async function handleRequestLoginPin(req, res) {
  const { email } = req.body || {}
  if (!validEmail(email)) return res.status(400).json({ success: false, error: 'valid_email_required' })
  const result = await accountService.requestLoginPin(email.toLowerCase().trim())
  // Deliberately generic in production (do not leak account existence);
  // dev mode returns the PIN directly since no email provider exists.
  if (!result.ok) return res.json({ success: true, message: 'If an account exists for this email, a login PIN was issued.' })
  res.json({ success: true, message: 'If an account exists for this email, a login PIN was issued.', devDeliveryPin: isProd ? undefined : result.pin })
}

export async function handleLogin(req, res) {
  const { email, pin } = req.body || {}
  if (!validEmail(email) || !pin) return res.status(400).json({ success: false, error: 'email_and_pin_required' })
  const result = await accountService.verifyLoginPin(email.toLowerCase().trim(), pin, req)
  if (!result.ok) {
    const status = result.error === 'account_locked' ? 423 : 401
    return res.status(status).json({ success: false, error: result.error })
  }
  authService.setAuthCookie(res, result.token, 'passport_member')
  res.json({ success: true, userId: result.userId, profileId: result.profileId, email: result.email, displayName: result.displayName })
}

export async function handleLogout(req, res) {
  if (req.user?.jti) await authService.revokeAuthSession(req.user.jti)
  authService.clearAuthCookie(res)
  res.json({ success: true })
}

export async function handleMe(req, res) {
  if (!req.user || req.user.mode === 'prototype' || req.user.role !== 'passport_member') {
    return res.status(401).json({ success: false, error: 'not_signed_in' })
  }
  res.json({ success: true, userId: req.user.id, email: req.user.email, displayName: req.user.displayName, profileId: req.user.profileId })
}
