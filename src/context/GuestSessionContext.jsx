import { createContext, useContext, useState, useCallback } from 'react'
import { getRankFromXP } from '../constants/session.js'

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
  completedSteps:       [],
  xp:                   0,
  rank:                 'Novice',
  badges:               [],
  smokecraftStamps:     [],
  mentors:              [],
  favorites:            [],
  pendingOrders:        [],
  currentSmokecraftStep: null,
  sessionId:            null,
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

  const updateProfile = useCallback((fields) => {
    update(prev => ({ ...prev, profile: { ...prev.profile, ...fields } }))
  }, [update])

  const completeStep = useCallback((stepId) => {
    update(prev => ({
      ...prev,
      completedSteps: prev.completedSteps.includes(stepId)
        ? prev.completedSteps
        : [...prev.completedSteps, stepId],
      currentSmokecraftStep: stepId,
    }))
  }, [update])

  const addXP = useCallback((amount) => {
    update(prev => {
      const newXP = prev.xp + amount
      return { ...prev, xp: newXP, rank: getRankFromXP(newXP).name }
    })
  }, [update])

  const addBadge = useCallback((badge) => {
    update(prev => ({
      ...prev,
      badges: prev.badges.find(b => b.id === badge.id)
        ? prev.badges
        : [...prev.badges, { ...badge, earnedAt: Date.now() }],
    }))
  }, [update])

  const addSmokecraftStamp = useCallback((stamp) => {
    update(prev => ({
      ...prev,
      smokecraftStamps: prev.smokecraftStamps.find(s => s.id === stamp.id)
        ? prev.smokecraftStamps
        : [...prev.smokecraftStamps, { ...stamp, earnedAt: Date.now() }],
    }))
  }, [update])

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

  const resetSession = useCallback(() => {
    const fresh = { ...defaultState, sessionId: Date.now().toString() }
    saveToStorage(fresh)
    setSession(fresh)
  }, [])

  return (
    <GuestSessionContext.Provider value={{
      session,
      updateProfile,
      completeStep,
      addXP,
      addBadge,
      addSmokecraftStamp,
      setMentors,
      addFavorite,
      addPendingOrder,
      resetSession,
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
