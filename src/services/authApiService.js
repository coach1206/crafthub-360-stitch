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
 * Staff PIN login — no email required.
 * Returns { data: { userId, role, displayName, permissions } } or null.
 */
export const staffPinLogin = (pin) =>
  apiPost(`${BASE}/staff-pin-login`, { pin })

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
 * Logout — revokes session cookie.
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
 */
export const refreshSession = () =>
  apiPost(`${BASE}/refresh`, {})

/**
 * Revoke a specific session by token ID (admin/founder only).
 */
export const revokeSession = (sessionTokenId) =>
  apiPost(`${BASE}/revoke-session`, { sessionTokenId })
