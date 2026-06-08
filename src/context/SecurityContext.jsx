/**
 * Security Context — provides role-based access control state to the React tree.
 *
 * In prototype mode, the "current admin session" is stored in localStorage
 * under `novee_admin_session`. Default role is `guest`.
 *
 * In production, this would be backed by a real JWT or session cookie.
 * Never use this alone to gate server-side operations.
 */

import { createContext, useContext, useState, useCallback } from 'react'
import { ROLE_MAP, ROLE_LEVELS, ROLE_LABELS, roleHasPermission, meetsMinRole } from '../config/roleMap.js'

const ADMIN_SESSION_KEY = 'novee_admin_session'

function readStoredSession() {
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || !ROLE_MAP[parsed.role]) return null
    return parsed
  } catch { return null }
}

const SecurityContext = createContext(null)

export function SecurityProvider({ children }) {
  const [user, setUser] = useState(() =>
    readStoredSession() || { role: 'guest', userId: null, email: null, displayName: 'Guest' }
  )

  /** Returns true if the current user holds the given permission key. */
  const hasPermission = useCallback((permKey) =>
    roleHasPermission(user.role, permKey),
  [user.role])

  /** Returns true if the current user meets or exceeds a minimum role level. */
  const atLeast = useCallback((minRole) =>
    meetsMinRole(user.role, minRole),
  [user.role])

  const isGuest     = () => user.role === 'guest'
  const isStaff     = () => meetsMinRole(user.role, 'staff')
  const isManager   = () => meetsMinRole(user.role, 'manager')
  const isAdmin     = () => meetsMinRole(user.role, 'admin')
  const isFounder   = () => user.role === 'founder_level_0'

  /** Updates the stored session role (prototype/dev only — never the production gate). */
  const setRole = useCallback((role, meta = {}) => {
    if (!ROLE_MAP[role]) {
      console.warn('[SecurityContext] Unknown role:', role)
      return
    }
    const session = {
      ...user,
      role,
      userId:      meta.userId      || user.userId,
      email:       meta.email       || user.email,
      displayName: meta.displayName || ROLE_LABELS[role] || role,
      grantedAt:   Date.now(),
    }
    try { localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session)) } catch {}
    setUser(session)
  }, [user])

  /** Clears the admin session and reverts to guest. */
  const clearAdminSession = useCallback(() => {
    try { localStorage.removeItem(ADMIN_SESSION_KEY) } catch {}
    setUser({ role: 'guest', userId: null, email: null, displayName: 'Guest' })
  }, [])

  const value = {
    user,
    role:        user.role,
    roleLabel:   ROLE_LABELS[user.role] || user.role,
    permissions: ROLE_MAP[user.role] || [],
    hasPermission,
    atLeast,
    isGuest,
    isStaff,
    isManager,
    isAdmin,
    isFounder,
    setRole,
    clearAdminSession,
  }

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  )
}

export function useSecurity() {
  const ctx = useContext(SecurityContext)
  if (!ctx) throw new Error('useSecurity must be used inside <SecurityProvider>')
  return ctx
}
