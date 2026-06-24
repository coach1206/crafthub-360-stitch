/**
 * Auth Context — Phase 10 (Auth v2)
 * The verified backend identity layer for NOVEE OS.
 *
 * On mount, calls GET /api/auth/me to restore any active JWT session
 * (the HttpOnly cookie is sent automatically).
 *
 * Provides:
 *   loginStaff, loginAdmin, loginFounder, loginMentor, loginDev,
 *   promoteMember, logout, refreshMe
 *
 * Tracks: user, role, isAuthenticated, isLoading, authError
 *
 * SecurityContext reads from this context to get the verified role.
 * Frontend localStorage is NOT the source of truth for role authority.
 */

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import * as authApi from '../services/authApiService.js'
import { getEffectivePermissions } from '../config/roleMap.js'
import { verifyFounderOverride } from '../config/founderOverride.js'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [authUser,  setAuthUser]  = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authError, setAuthError] = useState(null)

  const isAuthenticated = !!(authUser?.authenticated)

  // ── On mount: restore session from HttpOnly cookie ────────
  useEffect(() => {
    refreshMe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refreshMe = useCallback(async () => {
    setIsLoading(true)
    try {
      // apiClient never throws. A 401/403 here just means "no active
      // session" — that's the normal state for guest/public/demo traffic,
      // not an error, and it must never block the public app shell from
      // rendering. authError stays untouched for it; it's reserved for
      // explicit login-form failures (wrong PIN, etc).
      const result = await authApi.getMe()
      if (result?.data?.authenticated) {
        setAuthUser(result.data)
        setAuthError(null)
      } else {
        setAuthUser(null)
      }
    } catch {
      // Defensive only — authApi.getMe() already swallows all failures.
      setAuthUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ── Staff PIN login ────────────────────────────────────────
  const loginStaff = useCallback(async (pin, staffId = null) => {
    setAuthError(null)
    const result = await authApi.staffPinLogin(pin, staffId)
    if (result?.data) {
      const user = { ...result.data, authenticated: true }
      setAuthUser(user)
      return { success: true, user }
    }
    const error = result?.message || 'Invalid PIN. Please try again.'
    setAuthError(error)
    return { success: false, error }
  }, [])

  // ── Admin / Manager login ─────────────────────────────────
  // Tries the founder env override first (see config/founderOverride.js) —
  // this exists so founder access still works on static-only deployments
  // where the real Express backend (and its three-factor founder-login
  // route) is not deployed. It only ever fires when both
  // VITE_FOUNDER_ADMIN_EMAIL and VITE_FOUNDER_ADMIN_PIN are configured
  // and match exactly; otherwise it falls through to the real backend.
  const loginAdmin = useCallback(async (email, pin) => {
    setAuthError(null)

    if (verifyFounderOverride(email, pin)) {
      const user = {
        userId:      'founder-env-override',
        role:        'founder_level_0',
        email:       String(email).trim(),
        displayName: 'Founder Level 0',
        authenticated: true,
        mode:        'env-override',
      }
      setAuthUser(user)
      return { success: true, user }
    }

    const result = await authApi.adminLogin(email, pin)
    if (result?.data) {
      const user = { ...result.data, authenticated: true }
      setAuthUser(user)
      return { success: true, user }
    }
    const error = result?.message || 'Invalid credentials.'
    setAuthError(error)
    return { success: false, error }
  }, [])

  // ── Founder login (email + PIN + founder challenge) ───────
  const loginFounder = useCallback(async (email, pin, founderChallenge) => {
    setAuthError(null)
    const result = await authApi.founderLogin(email, pin, founderChallenge)
    if (result?.data) {
      const user = { ...result.data, authenticated: true }
      setAuthUser(user)
      return { success: true, user }
    }
    const error = result?.message || 'Invalid credentials.'
    setAuthError(error)
    return { success: false, error }
  }, [])

  // ── Human Mentor login ────────────────────────────────────
  const loginMentor = useCallback(async (email, pin) => {
    setAuthError(null)
    const result = await authApi.mentorLogin(email, pin)
    if (result?.data) {
      const user = { ...result.data, authenticated: true }
      setAuthUser(user)
      return { success: true, user }
    }
    const error = result?.message || 'Invalid credentials.'
    setAuthError(error)
    return { success: false, error }
  }, [])

  // ── Developer login ───────────────────────────────────────
  const loginDev = useCallback(async (email, pin) => {
    setAuthError(null)
    const result = await authApi.devLogin(email, pin)
    if (result?.data) {
      const user = { ...result.data, authenticated: true }
      setAuthUser(user)
      return { success: true, user }
    }
    const error = result?.message || 'Invalid credentials or no active developer grant.'
    setAuthError(error)
    return { success: false, error }
  }, [])

  // ── Promote guest → Passport Member ──────────────────────
  const promoteMember = useCallback(async (data) => {
    setAuthError(null)
    const result = await authApi.promoteGuestToMember(data)
    if (result?.data) {
      const user = { ...result.data, authenticated: true }
      setAuthUser(user)
      return { success: true, user }
    }
    const error = result?.message || 'Could not create Passport Member account.'
    setAuthError(error)
    return { success: false, error }
  }, [])

  // ── Logout ────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await authApi.logout()
    setAuthUser(null)
    setAuthError(null)
    try { localStorage.removeItem('novee_admin_session') } catch {}
  }, [])

  const value = {
    authUser,
    isAuthenticated,
    isLoading,
    authError,
    role:        authUser?.role        || null,
    email:       authUser?.email       || null,
    displayName: authUser?.displayName || null,
    staffId:     authUser?.staffId     || null,
    profileId:   authUser?.profileId   || null,
    permissions: getEffectivePermissions(authUser?.role || 'guest'),
    loginStaff,
    loginAdmin,
    loginFounder,
    loginMentor,
    loginDev,
    promoteMember,
    logout,
    refreshMe,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/** Returns AuthContext value. Throws if used outside <AuthProvider>. */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (ctx === undefined) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
