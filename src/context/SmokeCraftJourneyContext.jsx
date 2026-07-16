/**
 * SmokeCraftJourneyContext — canonical journey data layer.
 *
 * Stores every guest selection made across the SmokeCraft 360 journey.
 * Persisted in localStorage under sc_journey_v1.
 * Does not duplicate XP/badge logic (handled by GuestSessionContext).
 * Does not replace GuestSessionContext — it extends it with journey-specific data.
 *
 * Safe reads: malformed JSON is caught and reset to defaults.
 * Migration: stateVersion lets future code migrate old keys safely.
 */

import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const LS_KEY = 'sc_journey_v1'
const STATE_VERSION = 3

// Package J — locked 27-session spine migration marker. No completedSteps
// id was renamed except cut-toast-light/lighting-tutorial's split (see
// LightingTutorial.jsx), so no data transform is required here: every other
// existing id in a guest's completedSteps array (novee_guest_session, a
// separate store from this one) remains valid verbatim against the new
// spine numbering, since guard unlocking is id-based, not number-based.
// This flag only records that the spine migration has been observed for
// this journey record — idempotent, safe to run on every load.
const SPINE_VERSION = 1

// Legacy shadow keys consolidated into this canonical record as of STATE_VERSION 3.
// Kept here (rather than in each page) so migration logic has one authoritative list.
const LEGACY_LOCAL_KEYS = {
  identity: 'sc_identity_v1',
  goldenBox: 'sc_golden_box_v1',
  connections: 'sc_connections_v1',
  scorecard: 'sc_scorecard_v1',
  passportStamp: 'sc_passport_stamp_v1',
}
const LEGACY_SESSION_KEYS = {
  flavorMemory: 'smokecraftFlavorMemory',
  finalThird: 'smokecraftFinalThird',
}

const DEFAULT_STATE = {
  stateVersion: STATE_VERSION,
  spineVersion: SPINE_VERSION,

  // Identity (canonical — legacy sc_identity_v1 migrated in, then removed)
  identity: null, // { fullName, preferredName, email, birthDate, country, experienceLevel, focusArea }

  // Golden Box acknowledgement (canonical — legacy sc_golden_box_v1 migrated in, then removed)
  goldenBox: null, // { acknowledged }

  // Mentor selection
  mentor: null, // { id, name, origin, country }

  // Meet Your Cigar (Brand/Blend/Wrapper/Binder/Filler/Factory/Master Blender)
  meetYourCigar: null, // { viewedSections: string[], completedAt }

  // Mentor Commentary
  mentorCommentary: null, // { viewedSections: string[], completedAt }

  // Format selection
  format: null, // { id, label, desc }

  // Seed & Soil
  seedSoil: null, // { seedType, soilType, origin }

  // Terroir (Country / Region / Soil / Climate / Growing Conditions / Why It Matters)
  terroir: null, // { viewedSections: string[], selectedCountry }

  // Knowledge Drop (Tobacco / Fermentation / Aging / Factory Story)
  knowledgeDrop: null, // { viewedTopics: string[], quizScore }

  // Pairing Lab
  pairing: null, // { selections: string[], primary: string, recommendation: string }

  // Humidor Match — selected cigar
  selectedCigar: null, // { name, origin, wrapper, strength, body, format, tastingProfile, description }

  // Request Purchase
  requestPurchase: null, // { orderPath, additionalOptions: [], specialNotes, orderSummary }

  // Cut Toast Light
  cutToastLight: null, // { cut, toast, light }

  // Tasting thirds
  firstThird: null,   // { observations: [], notes }
  secondThird: null,  // { observations: [], notes }
  flavorMemory: null, // { selectedFlavors: [], intensity, body, strength, notes }
  finalThird: null,   // { observations: [], notes, wouldSmokeAgain }

  // Scorecard
  scorecard: null, // { categories: {}, personalNotes, overall }

  // Final Review
  finalReview: null, // { reviewNotes, editRequested }

  // Passport Stamp
  passportStamp: null, // { stamped: bool, stampedAt }

  // Connections (canonical — legacy sc_connections_v1 migrated in, then removed)
  connections: null, // { selected: string[] }

  // Session completion
  sessionCompletion: null, // { completedAt, xpTotal, rank }
}

function readLegacyLocal(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function readLegacySession(key) {
  try {
    const raw = sessionStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/**
 * Migrates any remaining legacy shadow localStorage/sessionStorage keys into the
 * canonical journey record, then removes those keys so they stop being written to.
 *
 * Rules:
 *  - Canonical data always wins: a legacy value is only copied in when the
 *    canonical field is still empty (null/undefined). Existing canonical data
 *    is never overwritten by older shadow data.
 *  - Idempotent: once a legacy key is merged it is deleted, so re-running this
 *    function is a no-op for that key on every subsequent load.
 *  - Legacy keys are removed once merged (or once confirmed already superseded
 *    by existing canonical data), so pages can stop writing to them entirely.
 */
function migrateLegacyKeys(state) {
  let next = state
  let changed = false

  const mergeLocal = (field, key, transform) => {
    if (!next[field]) {
      const legacy = readLegacyLocal(key)
      if (legacy) {
        next = { ...next, [field]: transform ? transform(legacy) : legacy }
        changed = true
      }
    }
    try {
      if (localStorage.getItem(key) !== null) localStorage.removeItem(key)
    } catch {}
  }

  const mergeSession = (field, key) => {
    if (!next[field]) {
      const legacy = readLegacySession(key)
      if (legacy) {
        next = { ...next, [field]: legacy }
        changed = true
      }
    }
    try {
      if (sessionStorage.getItem(key) !== null) sessionStorage.removeItem(key)
    } catch {}
  }

  mergeLocal('identity', LEGACY_LOCAL_KEYS.identity)
  mergeLocal('goldenBox', LEGACY_LOCAL_KEYS.goldenBox)
  mergeLocal('connections', LEGACY_LOCAL_KEYS.connections, (legacy) =>
    Array.isArray(legacy) ? { selected: legacy } : legacy
  )
  mergeLocal('scorecard', LEGACY_LOCAL_KEYS.scorecard)
  mergeLocal('passportStamp', LEGACY_LOCAL_KEYS.passportStamp)
  mergeSession('flavorMemory', LEGACY_SESSION_KEYS.flavorMemory)
  mergeSession('finalThird', LEGACY_SESSION_KEYS.finalThird)

  return changed ? next : state
}

function loadFromStorage() {
  let state
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) {
      state = { ...DEFAULT_STATE }
    } else {
      const parsed = JSON.parse(raw)
      // Version migration: if stateVersion missing, invalid, or old, fall back to defaults
      if (!parsed || typeof parsed !== 'object' || !parsed.stateVersion || parsed.stateVersion < 1) {
        state = { ...DEFAULT_STATE }
      } else {
        // spineVersion is stamped/refreshed on every load — idempotent, and
        // safe to run repeatedly since it never transforms existing field
        // data, only records that this record has passed through the
        // Package J spine migration check.
        state = { ...DEFAULT_STATE, ...parsed, stateVersion: STATE_VERSION, spineVersion: SPINE_VERSION }
      }
    }
  } catch {
    state = { ...DEFAULT_STATE }
  }

  // Consolidate any remaining shadow-key data into the canonical record (idempotent).
  const migrated = migrateLegacyKeys(state)
  if (migrated !== state) {
    saveToStorage(migrated)
  }
  return migrated
}

function saveToStorage(state) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state))
  } catch {}
}

const SmokeCraftJourneyContext = createContext(null)

export function SmokeCraftJourneyProvider({ children }) {
  const [journey, setJourney] = useState(loadFromStorage)

  // Persist on every change
  useEffect(() => {
    saveToStorage(journey)
  }, [journey])

  const updateJourney = useCallback((patch) => {
    setJourney(prev => {
      const next = { ...prev, ...patch }
      return next
    })
  }, [])

  // ── Per-step setters ──────────────────────────────────────────────────────

  const setIdentity = useCallback((data) => {
    updateJourney({ identity: data })
  }, [updateJourney])

  const setGoldenBox = useCallback((data) => {
    updateJourney({ goldenBox: data })
  }, [updateJourney])

  const setMentor = useCallback((mentor) => {
    updateJourney({ mentor })
  }, [updateJourney])

  const setFormat = useCallback((format) => {
    updateJourney({ format })
  }, [updateJourney])

  const setSeedSoil = useCallback((data) => {
    updateJourney({ seedSoil: data })
  }, [updateJourney])

  const setMeetYourCigar = useCallback((data) => {
    updateJourney({ meetYourCigar: data })
  }, [updateJourney])

  const setMentorCommentary = useCallback((data) => {
    updateJourney({ mentorCommentary: data })
  }, [updateJourney])

  const setTerroir = useCallback((data) => {
    updateJourney({ terroir: data })
  }, [updateJourney])

  const setKnowledgeDrop = useCallback((data) => {
    updateJourney({ knowledgeDrop: data })
  }, [updateJourney])

  const setPairing = useCallback((data) => {
    updateJourney({ pairing: data })
  }, [updateJourney])

  const setSelectedCigar = useCallback((cigar) => {
    updateJourney({ selectedCigar: cigar })
  }, [updateJourney])

  const setRequestPurchase = useCallback((data) => {
    updateJourney({ requestPurchase: data })
  }, [updateJourney])

  const setCutToastLight = useCallback((data) => {
    updateJourney({ cutToastLight: data })
  }, [updateJourney])

  const setFirstThird = useCallback((data) => {
    updateJourney({ firstThird: data })
  }, [updateJourney])

  const setSecondThird = useCallback((data) => {
    updateJourney({ secondThird: data })
  }, [updateJourney])

  const setFlavorMemory = useCallback((data) => {
    updateJourney({ flavorMemory: data })
  }, [updateJourney])

  const setFinalThird = useCallback((data) => {
    updateJourney({ finalThird: data })
  }, [updateJourney])

  const setScorecard = useCallback((data) => {
    updateJourney({ scorecard: data })
  }, [updateJourney])

  const setFinalReview = useCallback((data) => {
    updateJourney({ finalReview: data })
  }, [updateJourney])

  const setPassportStamp = useCallback((data) => {
    updateJourney({ passportStamp: data })
  }, [updateJourney])

  const setConnections = useCallback((data) => {
    updateJourney({ connections: data })
  }, [updateJourney])

  const setSessionCompletion = useCallback((data) => {
    updateJourney({ sessionCompletion: data })
  }, [updateJourney])

  const resetJourney = useCallback(() => {
    const fresh = { ...DEFAULT_STATE }
    setJourney(fresh)
    saveToStorage(fresh)
  }, [])

  const value = {
    journey,
    setIdentity,
    setGoldenBox,
    setMentor,
    setFormat,
    setSeedSoil,
    setMeetYourCigar,
    setMentorCommentary,
    setTerroir,
    setKnowledgeDrop,
    setPairing,
    setSelectedCigar,
    setRequestPurchase,
    setCutToastLight,
    setFirstThird,
    setSecondThird,
    setFlavorMemory,
    setFinalThird,
    setScorecard,
    setFinalReview,
    setPassportStamp,
    setConnections,
    setSessionCompletion,
    resetJourney,
  }

  return (
    <SmokeCraftJourneyContext.Provider value={value}>
      {children}
    </SmokeCraftJourneyContext.Provider>
  )
}

export function useSmokeCraftJourney() {
  const ctx = useContext(SmokeCraftJourneyContext)
  if (!ctx) throw new Error('useSmokeCraftJourney must be inside <SmokeCraftJourneyProvider>')
  return ctx
}
