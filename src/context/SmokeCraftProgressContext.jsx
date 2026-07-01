/**
 * SmokeCraftProgressContext
 *
 * Thin gamification context that derives the current SmokeCraft visit/session
 * progress from GuestSessionContext (the authoritative progress store) and
 * exposes it alongside demo-mode and local-preview-mode signals.
 *
 * Storage:
 *   - Primary: GuestSessionContext → sessionStorageService → localStorage
 *   - Mirror:  localStorage key "smokecraft_progress" (written on every
 *              progress change for admin/analytics consumers)
 *
 * Demo mode:   read from sessionStorage `novee_demo_mode === '1'`
 *              → message "Demo preview only, progression not saved."
 *              → all session locks bypassed
 *
 * Local preview mode: any non-demo session (progress is device-local only)
 *              → message "Local Preview Mode: progression is stored on this device only."
 */

import { createContext, useContext, useMemo, useEffect } from 'react'
import { useGuestSession } from './GuestSessionContext.jsx'
import { useDemoMode } from './DemoModeContext.jsx'
import {
  VISIT_STRUCTURE,
  TOTAL_VISITS,
  TOTAL_SESSIONS,
  getCurrentAllowedSession,
  isSessionUnlocked,
  isVisitUnlocked,
  isPassportStampUnlocked,
  isPassportConnectionsUnlocked,
  isManagementSyncVisible,
} from '../constants/smokecraftJourney.js'

const SmokeCraftProgressContext = createContext(null)

export function SmokeCraftProgressProvider({ children }) {
  const { session } = useGuestSession()
  const { isDemoMode } = useDemoMode()

  const completedSteps = session?.completedSteps || []

  // In demo mode, treat all sessions as unlocked (for preview purposes)
  const effectiveCompleted = isDemoMode
    ? VISIT_STRUCTURE.flatMap(v => v.sessions.map(s => s.id))
    : completedSteps

  const isLocalPreviewMode = !isDemoMode

  const currentAllowed = useMemo(
    () => getCurrentAllowedSession(effectiveCompleted),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [effectiveCompleted.join(','), isDemoMode]
  )

  const completedSessions = useMemo(
    () => {
      const nums = []
      for (const v of VISIT_STRUCTURE) {
        for (const s of v.sessions) {
          if (s.id === 'entry' || effectiveCompleted.includes(s.id)) nums.push(s.session)
        }
      }
      return nums
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [effectiveCompleted.join(',')]
  )

  const completedVisits = useMemo(
    () => {
      const nums = []
      for (const v of VISIT_STRUCTURE) {
        if (v.sessions.every(s => s.id === 'entry' || effectiveCompleted.includes(s.id))) {
          nums.push(v.visit)
        }
      }
      return nums
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [effectiveCompleted.join(',')]
  )

  const earnedBadges = useMemo(
    () => {
      const badges = []
      for (const v of VISIT_STRUCTURE) {
        const allDone = v.sessions.every(s => s.id === 'entry' || effectiveCompleted.includes(s.id))
        if (allDone && v.badges) badges.push(...v.badges)
      }
      return badges
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [effectiveCompleted.join(',')]
  )

  const value = useMemo(() => ({
    // Current cursor
    currentVisit:    currentAllowed.visitNumber,
    currentSession:  currentAllowed.session,
    currentLabel:    currentAllowed.label,
    currentVisitTitle: currentAllowed.visitTitle,
    // Completed sets
    completedSessions,
    completedVisits,
    earnedBadges,
    // Totals
    totalVisits:   TOTAL_VISITS,
    totalSessions: TOTAL_SESSIONS,
    // Helpers (pre-bound to current progress)
    isSessionUnlocked: (n) => isDemoMode || isSessionUnlocked(n, effectiveCompleted),
    isVisitUnlocked:   (n) => isDemoMode || isVisitUnlocked(n, effectiveCompleted),
    // Specific gates
    passportStampUnlocked:       isDemoMode || isPassportStampUnlocked(effectiveCompleted),
    passportConnectionsUnlocked: isDemoMode || isPassportConnectionsUnlocked(effectiveCompleted),
    managementSyncVisible:       isDemoMode || isManagementSyncVisible(effectiveCompleted),
    // Mode flags
    isDemoMode,
    isLocalPreviewMode,
    // Human-readable mode label
    modeLabel: isDemoMode
      ? 'Demo preview only, progression not saved.'
      : 'Local Preview Mode: progression is stored on this device only.',
  }), [
    currentAllowed,
    completedSessions,
    completedVisits,
    earnedBadges,
    isDemoMode,
    isLocalPreviewMode,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    effectiveCompleted.join(','),
  ])

  // Mirror progress to localStorage for admin/analytics consumers
  useEffect(() => {
    try {
      localStorage.setItem('smokecraft_progress', JSON.stringify({
        currentVisit:      value.currentVisit,
        currentSession:    value.currentSession,
        completedSessions: value.completedSessions,
        completedVisits:   value.completedVisits,
        earnedBadges:      value.earnedBadges,
        isDemoMode:        value.isDemoMode,
        updatedAt:         Date.now(),
      }))
    } catch (_) {
      // Storage quota exceeded or private mode — fail silently
    }
  }, [value])

  return (
    <SmokeCraftProgressContext.Provider value={value}>
      {children}
    </SmokeCraftProgressContext.Provider>
  )
}

export function useSmokeCraftProgress() {
  const ctx = useContext(SmokeCraftProgressContext)
  if (!ctx) throw new Error('useSmokeCraftProgress must be inside <SmokeCraftProgressProvider>')
  return ctx
}
