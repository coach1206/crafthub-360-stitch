import { createContext, useContext, useState, useCallback } from 'react'
import { getRankFromXP } from '../constants/session.js'
import {
  awardPassportStamp,
  recordGoldenBoxProgress,
  unlockPassportCeremony,
} from '../utils/passportProgress.js'
import {
  mergeGuestProfile,
  createResumeToken,
  validateResumeToken,
} from '../utils/passportEntry.js'
import {
  DEFAULT_VENUE_ID,
  DEFAULT_DEVICE_ID,
  DEFAULT_ENTRY_SOURCE,
} from '../data/passportEntryConfig.js'

const STORAGE_KEY    = 'novee_guest_session'
const SCHEMA_VERSION = 3   // 2→3: added Phase 4 entry identity fields

function genGuestId() {
  const now = Date.now()
  return `g_${now.toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
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
  latestStampId:         null,
  goldenBoxProgress:     null,
  // Phase 4 — entry identity
  guestId:               null,
  venueId:               DEFAULT_VENUE_ID,
  deviceId:              DEFAULT_DEVICE_ID,
  entrySource:           DEFAULT_ENTRY_SOURCE,
  entryStartedAt:        null,
  lastActiveAt:          null,
  guestProfile:          null,
  profileComplete:       false,
  resumeToken:           null,
  // Preferences & routing
  audioEnabled:          true,
  hapticsEnabled:        true,
  lastVisitedRoute:      null,
  leaderboardScore:      0,
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

  // ── Profile (display) ─────────────────────────────────────────────────────
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

  // ── XP ────────────────────────────────────────────────────────────────────
  const addXP = useCallback((amount) => {
    update(prev => {
      const newXP = prev.xp + amount
      return { ...prev, xp: newXP, rank: getRankFromXP(newXP).name }
    })
  }, [update])

  // ── Badges ────────────────────────────────────────────────────────────────
  const addBadge = useCallback((badge) => {
    update(prev => ({
      ...prev,
      badges: prev.badges.find(b => b.id === badge.id)
        ? prev.badges
        : [...prev.badges, { ...badge, earnedAt: Date.now() }],
    }))
  }, [update])

  // ── Passport stamps ───────────────────────────────────────────────────────
  /** Primary stamp award — validates against catalog, prevents duplicates, sets latestStampId. */
  const awardStamp = useCallback((stampId, source = 'unknown') => {
    update(prev => awardPassportStamp(prev, stampId, source))
  }, [update])

  /** @deprecated Use awardStamp(stampId, source). Kept for backward compat. */
  const addSmokecraftStamp = useCallback((stamp) => {
    update(prev => awardPassportStamp(prev, stamp.id, stamp.source || 'legacy'))
  }, [update])

  // ── Ceremony ──────────────────────────────────────────────────────────────
  const unlockCeremony = useCallback((stampId) => {
    update(prev => unlockPassportCeremony(prev, stampId))
  }, [update])

  // ── Golden Box ────────────────────────────────────────────────────────────
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

  // ── Phase 4: Entry identity ───────────────────────────────────────────────

  /**
   * Called on QR scan / kiosk launch.
   * Sets venue, device, entry source, and initialises guestId if not present.
   * Never wipes stamps, XP, or completedSteps.
   */
  const startPassportEntry = useCallback((payload = {}) => {
    update(prev => {
      const now = Date.now()
      return {
        ...prev,
        guestId:        prev.guestId        || payload.guestId      || genGuestId(),
        venueId:        payload.venueId      || prev.venueId         || DEFAULT_VENUE_ID,
        deviceId:       payload.deviceId     || prev.deviceId        || DEFAULT_DEVICE_ID,
        entrySource:    payload.entrySource  || prev.entrySource     || DEFAULT_ENTRY_SOURCE,
        entryStartedAt: prev.entryStartedAt  || now,
        lastActiveAt:   now,
        // stamps, XP, completedSteps: untouched
      }
    })
  }, [update])

  /**
   * Updates guestProfile and mirrors core display fields to session.profile.
   * Does NOT set profileComplete — use completeGuestProfile for that.
   */
  const updateGuestProfile = useCallback((profile) => {
    update(prev => mergeGuestProfile(prev, profile))
  }, [update])

  /**
   * Marks profile complete, merges fields, generates a resumeToken.
   * Replaces the separate updateProfile call for final form submission.
   */
  const completeGuestProfile = useCallback((profile) => {
    update(prev => {
      const merged = mergeGuestProfile(prev, profile)
      const token  = createResumeToken(merged)
      return {
        ...merged,
        profileComplete: true,
        resumeToken:     token,
      }
    })
  }, [update])

  /** Stamps the session with the current time as lastActiveAt. */
  const refreshLastActive = useCallback(() => {
    update(prev => ({ ...prev, lastActiveAt: Date.now() }))
  }, [update])

  /**
   * Validates a resume token and, if valid, stores it and refreshes lastActiveAt.
   * Silent no-op if token is invalid.
   */
  const resumePassportSession = useCallback((token) => {
    const parsed = validateResumeToken(token)
    if (!parsed) return
    update(prev => ({
      ...prev,
      resumeToken:  token,
      lastActiveAt: Date.now(),
    }))
  }, [update])

  /** Enables or disables audio (used by voice service + mentor screens). */
  const setAudioEnabled = useCallback((val) => {
    update(prev => ({ ...prev, audioEnabled: !!val }))
  }, [update])

  /** Enables or disables haptic feedback (used by haptics utility). */
  const setHapticsEnabled = useCallback((val) => {
    update(prev => ({ ...prev, hapticsEnabled: !!val }))
  }, [update])

  /** Records the last meaningful route the guest visited, for back-button logic. */
  const trackRoute = useCallback((route) => {
    if (route && typeof route === 'string') {
      update(prev => ({ ...prev, lastVisitedRoute: route }))
    }
  }, [update])

  /**
   * Clears venue/device/entry identity only.
   * Stamps, XP, completedSteps, and session.profile are preserved.
   */
  const clearPassportIdentity = useCallback(() => {
    update(prev => ({
      ...prev,
      guestId:         null,
      venueId:         DEFAULT_VENUE_ID,
      deviceId:        DEFAULT_DEVICE_ID,
      entrySource:     DEFAULT_ENTRY_SOURCE,
      entryStartedAt:  null,
      lastActiveAt:    null,
      guestProfile:    null,
      profileComplete: false,
      resumeToken:     null,
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
      // Profile
      updateProfile,
      // SmokeCraft
      completeStep,
      addXP,
      addBadge,
      // Stamps
      awardStamp,
      addSmokecraftStamp,       // legacy alias
      unlockCeremony,
      updateGoldenBoxProgress,
      // Social
      setMentors,
      addFavorite,
      addPendingOrder,
      // Phase 4: Entry identity
      startPassportEntry,
      updateGuestProfile,
      completeGuestProfile,
      refreshLastActive,
      resumePassportSession,
      clearPassportIdentity,
      // Preferences & routing
      setAudioEnabled,
      setHapticsEnabled,
      trackRoute,
      // Reset
      resetGuestSession,
      resetSession,             // legacy alias
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
