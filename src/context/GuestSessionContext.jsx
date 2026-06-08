import { createContext, useContext, useState, useCallback } from 'react'
import { getRankFromXP } from '../constants/session.js'
import {
  awardPassportStamp,
  recordGoldenBoxProgress,
  unlockPassportCeremony,
} from '../utils/passportProgress.js'

const STORAGE_KEY    = 'novee_guest_session'
const SCHEMA_VERSION = 2   // bump when defaultState shape changes

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // Schema version guard — stale or malformed data resets to default
    if (!parsed || typeof parsed !== 'object' || parsed.__version !== SCHEMA_VERSION) return null
    return parsed
  } catch {
    return null
  }
}

function saveToStorage(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, __version: SCHEMA_VERSION }))
  } catch { /* storage unavailable — silently continue */ }
}

const defaultState = {
  profile: {
    firstName: '', lastName: '', nickname: '', email: '', phone: '',
    city: '', state: '', zip: '', photo: null, ageConfirmed: false,
  },
  completedSteps:        [],
  xp:                    0,
  rank:                  'Novice',
  badges:                [],
  smokecraftStamps:      [],
  mentors:               [],
  favorites:             [],
  pendingOrders:         [],
  currentSmokecraftStep: null,
  sessionId:             null,
  latestStampId:         null,   // which stamp last triggered a ceremony visit
  goldenBoxProgress:     null,   // { tier, claimed, badge, updatedAt }
}

const GuestSessionContext = createContext(null)

export function GuestSessionProvider({ children }) {
  const [session, setSession] = useState(() => {
    const saved = loadFromStorage()
    return saved || { ...defaultState, sessionId: Date.now().toString() }
  })

  const update = useCallback((updater) => {
    setSession(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }
      saveToStorage(next)
      return next
    })
  }, [])

  // ── Profile ──────────────────────────────────────────────────────────────
  const updateProfile = useCallback((fields) => {
    update(prev => ({ ...prev, profile: { ...prev.profile, ...fields } }))
  }, [update])

  // ── SmokeCraft steps ──────────────────────────────────────────────────────
  const completeStep = useCallback((stepId) => {
    update(prev => ({
      ...prev,
      completedSteps: prev.completedSteps.includes(stepId)
        ? prev.completedSteps
        : [...prev.completedSteps, stepId],
      currentSmokecraftStep: stepId,
    }))
  }, [update])

  // ── XP ───────────────────────────────────────────────────────────────────
  const addXP = useCallback((amount) => {
    update(prev => {
      const newXP = prev.xp + amount
      return { ...prev, xp: newXP, rank: getRankFromXP(newXP).name }
    })
  }, [update])

  // ── Badges ───────────────────────────────────────────────────────────────
  const addBadge = useCallback((badge) => {
    update(prev => ({
      ...prev,
      badges: prev.badges.find(b => b.id === badge.id)
        ? prev.badges
        : [...prev.badges, { ...badge, earnedAt: Date.now() }],
    }))
  }, [update])

  // ── Passport stamps ───────────────────────────────────────────────────────
  /**
   * Primary stamp award method — validates against STAMP_CATALOG, prevents duplicates,
   * sets latestStampId for ceremony pages.
   */
  const awardStamp = useCallback((stampId, source = 'unknown') => {
    update(prev => awardPassportStamp(prev, stampId, source))
  }, [update])

  /**
   * Legacy alias — kept for backward compat. Delegates to awardStamp logic.
   * New code should use awardStamp(stampId, source) instead.
   */
  const addSmokecraftStamp = useCallback((stamp) => {
    update(prev => awardPassportStamp(prev, stamp.id, stamp.source || 'legacy'))
  }, [update])

  // ── Ceremony ──────────────────────────────────────────────────────────────
  /** Sets latestStampId so the ceremony page knows which stamp triggered it. */
  const unlockCeremony = useCallback((stampId) => {
    update(prev => unlockPassportCeremony(prev, stampId))
  }, [update])

  // ── Golden Box ────────────────────────────────────────────────────────────
  /** Records Golden Box claim progress into session state. */
  const updateGoldenBoxProgress = useCallback((payload) => {
    update(prev => recordGoldenBoxProgress(prev, payload))
  }, [update])

  // ── Social / ordering ─────────────────────────────────────────────────────
  const setMentors = useCallback((mentors) => {
    update(prev => ({ ...prev, mentors }))
  }, [update])

  const addFavorite = useCallback((item) => {
    update(prev => ({
      ...prev,
      favorites: prev.favorites.find(f => f.id === item.id)
        ? prev.favorites
        : [...prev.favorites, item],
    }))
  }, [update])

  const addPendingOrder = useCallback((order) => {
    update(prev => ({
      ...prev,
      pendingOrders: [...prev.pendingOrders, { ...order, addedAt: Date.now() }],
    }))
  }, [update])

  // ── Session reset ─────────────────────────────────────────────────────────
  const resetGuestSession = useCallback(() => {
    const fresh = { ...defaultState, sessionId: Date.now().toString() }
    saveToStorage(fresh)
    setSession(fresh)
  }, [])

  /** @deprecated Use resetGuestSession. */
  const resetSession = resetGuestSession

  return (
    <GuestSessionContext.Provider value={{
      session,
      updateProfile,
      completeStep,
      addXP,
      addBadge,
      awardStamp,
      addSmokecraftStamp,      // legacy alias
      unlockCeremony,
      updateGoldenBoxProgress,
      setMentors,
      addFavorite,
      addPendingOrder,
      resetGuestSession,
      resetSession,            // legacy alias
    }}>
      {children}
    </GuestSessionContext.Provider>
  )
}

export function useGuestSession() {
  const ctx = useContext(GuestSessionContext)
  if (!ctx) throw new Error('useGuestSession must be used within GuestSessionProvider')
  return ctx
}
