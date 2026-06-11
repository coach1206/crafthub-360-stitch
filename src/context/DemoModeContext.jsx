/**
 * Demo Mode Context — NOVEE OS
 *
 * Provides safe preview access without any real login.
 * State lives in sessionStorage only — clears when the tab closes.
 *
 * DEMO MODE RULES (enforced in ProtectedRoute + server never touched):
 *   Allowed:  Home, Boot, SmokeCraft, Leaderboard, Passport,
 *             DayOne360 Travel, TicketTicker, CraftHub, WineCraft, BeerCraft, PourCraft
 *   Blocked:  Founder Command, Admin Command, E.A.T. Command,
 *             POS 3, Developer Diagnostics, payment/user/system settings
 *
 * Demo mode does NOT create real audit events, payments, inventory
 * changes, or user role changes — it only reads demo-safe data.
 */

import { createContext, useContext, useState, useCallback } from 'react'

const SESSION_KEY = 'novee_demo_mode'
const PUBLIC_SESSION_KEY = 'demoMode'

const DemoModeContext = createContext(null)

export const DEMO_BLOCKED_PATHS = new Set([
  '/founder',
  '/admin',
  '/eat',
  '/pos',
  '/ultra-command-center',
  '/novee-vault',
  '/remote-software-control',
  '/venue-mirror',
  '/dev-diagnostics',
  '/developer',
  '/staff-login',
  '/admin-login',
  '/founder-login',
  '/mentor-login',
  '/dev-login',
  '/kiosk-setup',
  '/venue-test',
  '/pilot-onboarding',
  '/founder-demo',
  '/investor-demo',
  '/device-status',
  '/install-help',
])

export function DemoModeProvider({ children }) {
  const [isDemoMode, setIsDemoMode] = useState(() =>
    sessionStorage.getItem(SESSION_KEY) === '1' || sessionStorage.getItem(PUBLIC_SESSION_KEY) === 'true'
  )

  const enterDemoMode = useCallback(() => {
    sessionStorage.setItem(SESSION_KEY, '1')
    sessionStorage.setItem(PUBLIC_SESSION_KEY, 'true')
    // Ensure boot is marked so BootGuard doesn't redirect back to /boot
    sessionStorage.setItem('novee_booted', '1')
    setIsDemoMode(true)
  }, [])

  const exitDemoMode = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY)
    sessionStorage.removeItem(PUBLIC_SESSION_KEY)
    setIsDemoMode(false)
  }, [])

  const isDemoBlocked = useCallback((pathname) => {
    if (!isDemoMode) return false
    // Exact match or prefix match for sub-routes
    for (const blocked of DEMO_BLOCKED_PATHS) {
      if (pathname === blocked || pathname.startsWith(blocked + '/')) return true
    }
    return false
  }, [isDemoMode])

  return (
    <DemoModeContext.Provider value={{ isDemoMode, enterDemoMode, exitDemoMode, isDemoBlocked }}>
      {children}
    </DemoModeContext.Provider>
  )
}

export function useDemoMode() {
  const ctx = useContext(DemoModeContext)
  if (!ctx) throw new Error('useDemoMode must be inside <DemoModeProvider>')
  return ctx
}
