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
const STATE_VERSION = 2

const DEFAULT_STATE = {
  stateVersion: STATE_VERSION,

  // Identity (mirrors sc_identity_v1 for cross-route reads)
  identity: null, // { fullName, preferredName, email, birthDate, country, experienceLevel, focusArea }

  // Mentor selection
  mentor: null, // { id, name, origin, country }

  // Format selection
  format: null, // { id, label, desc }

  // Seed & Soil
  seedSoil: null, // { seedType, soilType, origin }

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

  // Connections
  connections: null, // { shareConsent, followUpConsent }

  // Session completion
  sessionCompletion: null, // { completedAt, xpTotal, rank }
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return { ...DEFAULT_STATE }
    const parsed = JSON.parse(raw)
    // Version migration: if stateVersion missing or old, merge with defaults
    if (!parsed.stateVersion || parsed.stateVersion < 1) {
      return { ...DEFAULT_STATE }
    }
    return { ...DEFAULT_STATE, ...parsed, stateVersion: STATE_VERSION }
  } catch {
    return { ...DEFAULT_STATE }
  }
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

  const setMentor = useCallback((mentor) => {
    updateJourney({ mentor })
  }, [updateJourney])

  const setFormat = useCallback((format) => {
    updateJourney({ format })
  }, [updateJourney])

  const setSeedSoil = useCallback((data) => {
    updateJourney({ seedSoil: data })
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
    setMentor,
    setFormat,
    setSeedSoil,
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
