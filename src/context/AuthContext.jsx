/**
 * Auth Context — Phase 8.5
 * The verified backend identity layer for NOVEE OS.
 *
 * On mount, calls GET /api/auth/me to restore any active JWT session
 * (the HttpOnly cookie is sent automatically).
 *
 * Provides: loginStaff, loginAdmin, loginFounder, logout, refreshMe
 * Tracks:   user, role, isAuthenticated, isLoading, authError
 *
 * SecurityContext reads from this context to get the verified role.
 * Frontend localStorage is NOT the source of truth for role authority.
 */

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import * as authApi from '../services/authApiService.js'
import { ROLE_MAP } from '../config/roleMap.js'

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
      const result = await authApi.getMe()
      if (result?.data?.authenticated) {
        setAuthUser(result.data)
        setAuthError(null)
      } else {
        setAuthUser(null)
      }
    } catch {
      setAuthUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // ── Staff PIN login ────────────────────────────────────────
  const loginStaff = useCallback(async (pin) => {
    setAuthError(null)
    const result = await authApi.staffPinLogin(pin)
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
  const loginAdmin = useCallback(async (email, pin) => {
    setAuthError(null)
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

  // ── Logout ────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await authApi.logout()
    setAuthUser(null)
    setAuthError(null)
    // Clear localStorage prototype session too
    try { localStorage.removeItem('novee_admin_session') } catch {}
  }, [])

  const value = {
    authUser,
    isAuthenticated,
    isLoading,
    authError,
    role:        authUser?.role        || null,
    permissions: ROLE_MAP[authUser?.role] || [],
    loginStaff,
    loginAdmin,
    loginFounder,
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
