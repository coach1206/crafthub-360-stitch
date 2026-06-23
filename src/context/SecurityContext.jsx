/**
 * Security Context — Phase 8.5 (production-gated Phase 4)
 * Provides role-based access control state to the React tree.
 *
 * Identity resolution (first match wins):
 *   1. Real JWT session from AuthContext (backend-verified)
 *   2. localStorage prototype session (DEV ONLY — never read or written in production)
 *   3. Guest default
 *
 * IMPORTANT: This context is for UI rendering decisions only.
 * Backend middleware enforces actual security — never rely on this alone.
 */

import { createContext, useContext, useState, useCallback } from 'react'
import { ROLE_MAP, ROLE_LEVELS, ROLE_LABELS, roleHasPermission, meetsMinRole } from '../config/roleMap.js'
import { AuthContext } from './AuthContext.jsx'

const ADMIN_SESSION_KEY = 'novee_admin_session'

function readStoredSession() {
  // The localStorage prototype role is a dev-only convenience (DevRoleSwitcher).
  // It must never be consulted in production builds — Vite/Rollup statically
  // eliminates this branch in prod, so the key is never even read.
  if (!import.meta.env.DEV) return null
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
  // Try to consume AuthContext (real JWT session) if it's available above in the tree.
  const authCtx = useContext(AuthContext)

  // Prototype localStorage role (dev / no real auth)
  const [localUser, setLocalUser] = useState(() =>
    readStoredSession() || { role: 'guest', userId: null, email: null, displayName: 'Guest' }
  )

  // ── Effective identity ────────────────────────────────────
  // Real JWT-authenticated user takes precedence over localStorage.
  const user = (authCtx?.isAuthenticated && authCtx?.authUser)
    ? {
        role:        authCtx.authUser.role,
        userId:      authCtx.authUser.userId,
        email:       authCtx.authUser.email,
        displayName: authCtx.authUser.displayName || authCtx.authUser.role,
        mode:        'jwt',
      }
    : localUser

  // ── Permission helpers ────────────────────────────────────
  const hasPermission = useCallback((permKey) =>
    roleHasPermission(user.role, permKey),
  [user.role])

  const atLeast = useCallback((minRole) =>
    meetsMinRole(user.role, minRole),
  [user.role])

  const isGuest   = () => user.role === 'guest'
  const isStaff   = () => meetsMinRole(user.role, 'staff')
  const isManager = () => meetsMinRole(user.role, 'manager')
  const isAdmin   = () => meetsMinRole(user.role, 'admin')
  const isFounder = () => user.role === 'founder_level_0'

  // ── Prototype role setter (localStorage, dev only) ────────
  // Used by DevRoleSwitcher when no real JWT session exists.
  // Disabled outright in production — this is a UI-prototyping aid only,
  // never a path to grant a real role in a shipped build.
  const setRole = useCallback((role, meta = {}) => {
    if (!import.meta.env.DEV) {
      console.warn('[SecurityContext] setRole is disabled in production. Use real login.')
      return
    }
    if (!ROLE_MAP[role]) { console.warn('[SecurityContext] Unknown role:', role); return }
    // If a real auth session exists, don't override it via localStorage
    if (authCtx?.isAuthenticated) {
      console.warn('[SecurityContext] Cannot override real JWT session via setRole. Log out first.')
      return
    }
    const session = {
      ...localUser,
      role,
      userId:      meta.userId      || localUser.userId,
      email:       meta.email       || localUser.email,
      displayName: meta.displayName || ROLE_LABELS[role] || role,
      grantedAt:   Date.now(),
    }
    try { localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session)) } catch {}
    setLocalUser(session)
  }, [localUser, authCtx])

  const clearAdminSession = useCallback(() => {
    try { localStorage.removeItem(ADMIN_SESSION_KEY) } catch {}
    setLocalUser({ role: 'guest', userId: null, email: null, displayName: 'Guest' })
  }, [])

  const value = {
    user,
    role:              user.role,
    roleLabel:         ROLE_LABELS[user.role] || user.role,
    permissions:       ROLE_MAP[user.role] || [],
    isRealSession:     authCtx?.isAuthenticated ?? false,
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
