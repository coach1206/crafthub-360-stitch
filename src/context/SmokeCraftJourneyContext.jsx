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

function generateJourneyId() {
  return `journey-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

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

  // AI Summary (S21) — deterministic, rule-based session summary (see AISummary.jsx).
  // Not real AI unless a real AI layer is later connected via the documented
  // integration seam; labeled "Session Summary" throughout, never "AI-generated".
  aiSummary: null, // { sourceDataVersion, result: {...sections}, completedAt, generatedAt }

  // Personalized Pairing Recommendations (S22) — reuses PairingLab's rule-based
  // pairing engine (src/utils/pairingEngine.js), not a separate/AI system.
  pairingRecommendations: null, // { engineInput, primary, alternates: [], savedRecommendation, completedAt, generatedAt }

  // Rewards and XP (S25) — shares /smokecraft/rewards with Achievements (S26).
  // XP itself is NOT duplicated here — session.xp (GuestSessionContext) is the
  // one authoritative XP ledger; this field stores only the claim/view state
  // that is specific to the Rewards screen.
  rewards: null, // { activeMode, claimedTiers: [], viewedAt, completedAt, updatedAt }

  // Achievements (S26) — shares /smokecraft/rewards with Rewards and XP (S25).
  achievements: null, // { earned: { [id]: { earnedAt } }, claimed: [], completedAt, updatedAt }

  // ── Entry-layer (Package M) — E3 Venue Selection + E5 Resume/Start New ────
  // These fields are Entry-layer state, outside the numbered 27-session spine.
  // They are explicitly NOT reset by "Start New Journey" (venue preference and
  // entry-layer navigation history persist across journeys).
  selectedVenue: null, // { id, name, city, state, tier, selectedAt } | { skipped: true, selectedAt }
  venueSelectionCompleted: false,
  lastEntryScreen: null, // most recent Entry-layer route visited, for context only

  // Journey identity/lifecycle — activeJourneyId/journeyCreatedAt are stamped
  // once (idempotently) on first load; journeyUpdatedAt is bumped on every
  // canonical write (see updateJourney below) so Resume can show a real
  // "last saved" timestamp without a dedicated per-field ledger.
  activeJourneyId: null,
  journeyCreatedAt: null,
  journeyUpdatedAt: null,

  // Cached "current allowed session" snapshot, refreshed by ResumeJourney on
  // mount — used only as a validated candidate resume target; the live
  // SmokeCraftProgressContext computation always remains the source of truth.
  resumeRoute: null,
  resumeScreenId: null,

  // Light, honest archive of past fully-completed journeys (session-complete
  // reached), written only from real fields already present at reset time —
  // never a fabricated/backfilled record. See ResumeJourney.jsx.
  previousCompletedJourneys: [], // [{ journeyId, cigarName, completedAt }]

  // ── S1 Welcome to Today's Experience (Package N) ───────────────────────
  welcomeExperience: null, // { viewedAt, ... } — general container, extendable without new top-level fields
  welcomeViewedAt: null,
  learningObjectivesViewed: false,
  s1CompletedAt: null,
  currentScreenId: null,

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

  // Idempotent journey-identity stamp (Package M) — every guest gets a real
  // activeJourneyId/journeyCreatedAt the first time their record is ever
  // loaded, so Resume can always show real journey identity, not a fabricated
  // placeholder. Never overwrites an existing id.
  if (!state.activeJourneyId) {
    state = { ...state, activeJourneyId: generateJourneyId(), journeyCreatedAt: state.journeyCreatedAt || Date.now() }
  }

  // Consolidate any remaining shadow-key data into the canonical record (idempotent).
  let migrated = migrateLegacyKeys(state)

  // Authoritative journey graph correction: Mentor Selection used to route
  // directly to /smokecraft/format, so guests who completed Mentor before
  // this fix may have a stale resumeRoute pointing there. Format's own
  // guard (sessionNumber=5) already protects against actually landing mid-
  // journey, but self-heal the resume target proactively so returning
  // guests land on the real next step (Seed & Soil) instead of a locked
  // screen. Idempotent — only rewrites when the stale condition is met.
  if (migrated.resumeRoute === '/smokecraft/format' && !migrated.format) {
    migrated = { ...migrated, resumeRoute: '/smokecraft/seed-soil' }
  }

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
      // journeyUpdatedAt is bumped on every real canonical write, giving
      // Resume a genuine "last saved" timestamp without needing a dedicated
      // per-field ledger. `patch` can still override it explicitly (used by
      // startNewJourney, which sets its own fresh timestamps atomically).
      const next = { ...prev, journeyUpdatedAt: Date.now(), ...patch }
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

  const setAiSummary = useCallback((data) => {
    updateJourney({ aiSummary: data })
  }, [updateJourney])

  const setPairingRecommendations = useCallback((data) => {
    updateJourney({ pairingRecommendations: data })
  }, [updateJourney])

  const setRewards = useCallback((data) => {
    updateJourney({ rewards: data })
  }, [updateJourney])

  const setAchievements = useCallback((data) => {
    updateJourney({ achievements: data })
  }, [updateJourney])

  // ── Entry-layer setters (Package M) ─────────────────────────────────────

  const setSelectedVenue = useCallback((data) => {
    updateJourney({ selectedVenue: data, venueSelectionCompleted: true })
  }, [updateJourney])

  const setLastEntryScreen = useCallback((route) => {
    updateJourney({ lastEntryScreen: route })
  }, [updateJourney])

  const setResumeCache = useCallback((route, screenId) => {
    updateJourney({ resumeRoute: route, resumeScreenId: screenId })
  }, [updateJourney])

  /** Single action covering all S1 Welcome fields — pass any subset of
   * { welcomeExperience, welcomeViewedAt, learningObjectivesViewed,
   *   s1CompletedAt, currentScreenId }. */
  const setWelcomeState = useCallback((patch) => {
    updateJourney(patch)
  }, [updateJourney])

  /**
   * Resets only active-journey content fields (this journey's cigar,
   * tasting/tab data, scorecard, AI summary, pairing recommendation, and
   * passport-stamp state) and mints a fresh activeJourneyId. Explicitly
   * preserves identity, venue preference, Rewards/Achievements state
   * (tied to cumulative XP, not this one journey), and the archive of past
   * completed journeys — per the "Start New Journey" persistence rules.
   * Does NOT touch GuestSessionContext (xp/rank/badges/completedSteps) —
   * the caller (ResumeJourney.jsx) is responsible for resetting
   * completedSteps there so the new journey's session gating starts fresh
   * without touching the cumulative XP/badge ledger.
   */
  const startNewJourney = useCallback((archiveEntry) => {
    setJourney(prev => {
      const previousCompletedJourneys = archiveEntry
        ? [...(prev.previousCompletedJourneys || []), archiveEntry]
        : (prev.previousCompletedJourneys || [])
      const next = {
        ...prev,
        // Preserved as-is: identity, selectedVenue, venueSelectionCompleted,
        // lastEntryScreen, rewards, achievements, stateVersion, spineVersion.
        previousCompletedJourneys,
        activeJourneyId: generateJourneyId(),
        journeyCreatedAt: Date.now(),
        journeyUpdatedAt: Date.now(),
        resumeRoute: null,
        resumeScreenId: null,
        // Reset: this journey's content.
        welcomeExperience: null,
        welcomeViewedAt: null,
        learningObjectivesViewed: false,
        s1CompletedAt: null,
        currentScreenId: null,
        mentor: null,
        meetYourCigar: null,
        mentorCommentary: null,
        format: null,
        seedSoil: null,
        terroir: null,
        knowledgeDrop: null,
        pairing: null,
        selectedCigar: null,
        requestPurchase: null,
        cutToastLight: null,
        firstThird: null,
        secondThird: null,
        flavorMemory: null,
        finalThird: null,
        scorecard: null,
        finalReview: null,
        passportStamp: null,
        connections: null,
        sessionCompletion: null,
        aiSummary: null,
        pairingRecommendations: null,
        goldenBox: null,
      }
      saveToStorage(next)
      return next
    })
  }, [])

  const setPassportStamp = useCallback((data) => {
    updateJourney({ passportStamp: data })
  }, [updateJourney])

  const setConnections = useCallback((data) => {
    updateJourney({ connections: data })
  }, [updateJourney])

  const setSessionCompletion = useCallback((data) => {
    updateJourney({ sessionCompletion: data })
  }, [updateJourney])

  // Controlled extension point for Package C's server-journey state layer
  // (useSmokeCraftServerJourney). Stored under journey.managementSync —
  // additive, does not touch any existing field.
  const setManagementSyncState = useCallback((data) => {
    updateJourney({ managementSync: data })
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
    setAiSummary,
    setPairingRecommendations,
    setRewards,
    setAchievements,
    setSelectedVenue,
    setLastEntryScreen,
    setResumeCache,
    setWelcomeState,
    startNewJourney,
    setPassportStamp,
    setConnections,
    setSessionCompletion,
    setManagementSyncState,
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
