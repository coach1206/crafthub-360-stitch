/**
 * Auth API Service — frontend client for /api/auth/* endpoints.
 *
 * SECURITY RULES:
 * - Raw PINs are never stored (only passed directly to the API call)
 * - Founder challenge is never stored in localStorage
 * - Auth token is managed by HttpOnly cookie (not localStorage)
 * - This service only triggers the call; token handling is server-side
 */

import { apiPost, apiGet } from './apiClient.js'

const BASE = '/api/auth'

/**
 * Staff PIN login.
 * When staffId is provided → targeted lookup (prevents lockout amplification).
 * When staffId is absent   → legacy PIN-only scan.
 */
export const staffPinLogin = (pin, staffId = null) =>
  apiPost(`${BASE}/staff-pin-login`, staffId ? { pin, staffId } : { pin })

/**
 * Admin/Manager login — email + PIN.
 */
export const adminLogin = (email, pin) =>
  apiPost(`${BASE}/admin-login`, { email, pin })

/**
 * Founder login — email + PIN + founder challenge (all three required).
 * Challenge is NEVER stored or cached.
 */
export const founderLogin = (email, pin, founderChallenge) =>
  apiPost(`${BASE}/founder-login`, { email, pin, founderChallenge })

/**
 * Human Mentor login — email + PIN.
 * Mentor accounts are created by Admin only — no self-registration.
 */
export const mentorLogin = (email, pin) =>
  apiPost(`${BASE}/mentor-login`, { email, pin })

/**
 * Developer login — email + PIN.
 * Requires an active dev access grant issued by Founder L0.
 */
export const devLogin = (email, pin) =>
  apiPost(`${BASE}/dev-login`, { email, pin })

/**
 * Promote a guest session to a verified Passport Member account.
 * Body: { passportId, email?, phone?, displayName? }
 */
export const promoteGuestToMember = (data) =>
  apiPost(`${BASE}/promote-member`, data)

/**
 * Rotate the Passport Member refresh token (long-lived session).
 * Called automatically on the client when the 14-day JWT expires.
 */
export const passportRefresh = () =>
  apiPost(`${BASE}/passport-refresh`, {})

/**
 * Logout — revokes session cookie and refresh token.
 */
export const logout = () =>
  apiPost(`${BASE}/logout`, {})

/**
 * Get current authenticated user from backend (authoritative source).
 * Returns null if not authenticated.
 */
export const getMe = () =>
  apiGet(`${BASE}/me`)

/**
 * Refresh the current session (extends expiry).
 * Not for Passport Members — they use passportRefresh().
 */
export const refreshSession = () =>
  apiPost(`${BASE}/refresh`, {})

/**
 * Revoke a specific session by token ID (admin/founder only).
 */
export const revokeSession = (sessionTokenId) =>
  apiPost(`${BASE}/revoke-session`, { sessionTokenId })
