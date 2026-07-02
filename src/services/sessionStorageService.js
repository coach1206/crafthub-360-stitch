/**
 * Session Storage Service — canonical persistence layer for NOVEE OS guest sessions.
 * Handles CRUD, schema migration (v1→v4), and corruption recovery.
 * Safe to use outside React — reads/writes localStorage directly.
 */

import { syncSessionToBackend } from './syncService.js'

export const STORAGE_KEY    = 'novee_guest_session'
export const SCHEMA_VERSION = 4

// Debounce timer — batches rapid saves into one backend sync every 2s
let _syncTimer = null

// ── Helpers ───────────────────────────────────────────────────────────────────

function genSessionId() {
  return `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

/** Deep-merge two plain objects (no array merging — arrays are replaced). */
function deepMerge(base, override) {
  if (!override || typeof override !== 'object') return base
  const result = { ...base }
  for (const key of Object.keys(override)) {
    if (
      override[key] !== null &&
      typeof override[key] === 'object' &&
      !Array.isArray(override[key]) &&
      base[key] !== null &&
      typeof base[key] === 'object' &&
      !Array.isArray(base[key])
    ) {
      result[key] = deepMerge(base[key], override[key])
    } else {
      result[key] = override[key]
    }
  }
  return result
}

// ── Blank nested objects ───────────────────────────────────────────────────────

const BLANK_SMOKE_CRAFT = {
  currentSession:     null,
  completedSessions:  [],
  sessionScores:      [],
  flavorPreferences:  [],
  strengthTolerance:  null,
  aromaInterests:     [],
  vitolaPreferences:  [],
  pairingSelections:  [],
  soilSeedSelections: [],
  mentorNotes:        [],
  // Phase 13: 360 Passport Connections — honest, locally-tracked networking actions.
  // Each entry: { actionId, status, consented, timestamp }. Read by
  // smokeWinnerService's "Passport Connector" eligibility check.
  passportConnections: [],
  // 'not_started' | 'consent_required' | 'ready_to_share' | 'shared_locally' |
  // 'connection_pending' | 'backend_pending'
  networkingStatus:    'not_started',
  // User-controlled sharing consent for Phase 13 networking — all default to
  // false (opt-in only). No action can claim "shared" without consent.
  networkingConsent: {
    allowShareStamp:             false,
    allowShareName:               false,
    allowShareContact:            false,
    allowShareBusinessLinks:      false,
    allowShareSmokeCraftLevel:    false,
    allowShareFavoriteCigarStyle: false,
    allowShareEventStamp:         false,
    allowVenueFollowUp:           false,
  },
}

const BLANK_PASSPORT = {
  passportId:       null,
  earnedStamps:     [],
  latestStampId:    null,
  connectionCount:  0,
  eventName:        null,
  ceremonySeen:     false,
}

const BLANK_GOLDEN_BOX = {
  eligible:   false,
  progress:   0,
  entries:    [],
  lastReveal: null,
}

const BLANK_LEADERBOARD = {
  score:       0,
  rank:        'Novice',
  submitted:   false,
  displayName: null,
}

const BLANK_PREFERENCES = {
  audioEnabled:   true,
  hapticsEnabled: true,
  readInstead:    false,
  language:       'en',
}

const BLANK_SYSTEM = {
  lastVisitedRoute: null,
  schemaVersion:    SCHEMA_VERSION,
  kioskMode:        false,
  sourceModule:     null,
}

const BLANK_POS3 = {
  activeTicketId:        null,
  tableNumber:           null,
  staffId:               null,
  suggestedPairings:     [],
  upsellRecommendations: [],
  inventorySignals:      [],
}

const BLANK_EAT_COMMAND = {
  engagementScore:      0,
  guestMoodSignal:      null,
  sessionValue:         0,
  staffAssistTriggered: false,
  environmentNotes:     [],
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Creates a fresh default session with a new sessionId. */
export function createNewSession() {
  const now = Date.now()
  return {
    sessionId:   genSessionId(),
    createdAt:   now,
    updatedAt:   now,
    __version:   SCHEMA_VERSION,
    // Legacy flat fields (kept for backward compat with existing pages)
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
    latestStampId:         null,
    goldenBoxProgress:     null,
    // Scoring + loyalty (added alongside XP — never merged into xp)
    skillScore:            0,
    challengeScore:        0,
    loyaltyPoints:         0,
    lifetimeLoyaltyPoints: 0,
    redeemablePoints:      0,
    passportStampCount:    0,
    purchaseCount:         0,
    houseCigarPurchases:   0,
    pairingPurchases:      0,
    eventParticipationCount: 0,
    referralCount:         0,
    loyaltyLedger:         [],
    usedTransactionIds:    [],
    // Phase 4 identity
    guestId:               null,
    venueId:               'novee-grand-lounge',
    deviceId:              'kiosk-001',
    entrySource:           'qr-scan',
    entryStartedAt:        null,
    lastActiveAt:          null,
    guestProfile:          null,
    profileComplete:       false,
    resumeToken:           null,
    // Phase 4 Part 2 flat prefs (kept for backward compat)
    audioEnabled:          true,
    hapticsEnabled:        true,
    lastVisitedRoute:      null,
    leaderboardScore:      0,
    // Phase 6: selection tracking
    selectedCraft:          null,
    selectedMentor:         null,
    selectedMentorCountry:  null,
    selectedLevel:          null,
    // Phase 6: nested objects
    smokeCraft:   { ...BLANK_SMOKE_CRAFT },
    passport:     { ...BLANK_PASSPORT },
    goldenBox:    { ...BLANK_GOLDEN_BOX },
    leaderboard:  { ...BLANK_LEADERBOARD },
    preferences:  { ...BLANK_PREFERENCES },
    system:       { ...BLANK_SYSTEM },
    pos3:         { ...BLANK_POS3 },
    eatCommand:   { ...BLANK_EAT_COMMAND },
  }
}

/**
 * Loads the stored session from localStorage and migrates it if needed.
 * Returns null if nothing is stored or the data is unrecoverable.
 */
export function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return migrateSessionIfNeeded(parsed)
  } catch {
    return null
  }
}

/**
 * Saves the session to localStorage, stamping updatedAt and __version.
 * Silently no-ops if localStorage is unavailable.
 */
export function saveSession(session) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...session,
      updatedAt:  Date.now(),
      __version:  SCHEMA_VERSION,
    }))
    // Debounced backend sync — fires 2s after the last save in a burst
    clearTimeout(_syncTimer)
    _syncTimer = setTimeout(() => {
      syncSessionToBackend(session).catch(() => {})
    }, 2000)
  } catch { /* storage full or unavailable */ }
}

/**
 * Merges partialData into the stored session and saves it.
 * Returns the merged session.
 */
export function updateSession(partialData) {
  const current = loadSession() || createNewSession()
  const updated  = deepMerge(current, partialData)
  saveSession(updated)
  return updated
}

/** Removes the session from localStorage. */
export function clearSession() {
  try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
}

/** Returns true if session looks structurally valid. */
export function validateSessionSchema(session) {
  return !!(session && typeof session === 'object' && session.sessionId)
}

/**
 * Migrates a stored session from any prior schema version to the current one.
 * Always returns a session compatible with SCHEMA_VERSION=4.
 * Never throws — corrupted data produces a fresh session.
 */
export function migrateSessionIfNeeded(session) {
  if (!session || typeof session !== 'object') return null

  try {
    const version = session.__version || 0
    let s = { ...session }

    // v0–v2 → v3: ensure Phase 4 identity fields exist
    if (version < 3) {
      s = {
        ...createNewSession(),
        ...s,
        guestId:        s.guestId        || null,
        venueId:        s.venueId        || 'novee-grand-lounge',
        deviceId:       s.deviceId       || 'kiosk-001',
        entrySource:    s.entrySource    || 'qr-scan',
        audioEnabled:   s.audioEnabled   !== undefined ? s.audioEnabled   : true,
        hapticsEnabled: s.hapticsEnabled !== undefined ? s.hapticsEnabled : true,
      }
    }

    // v3 → v4: add Phase 6 nested objects and selection fields
    if (version < 4) {
      s = {
        ...s,
        selectedCraft:         s.selectedCraft        || null,
        selectedMentor:        s.selectedMentor       || null,
        selectedMentorCountry: s.selectedMentorCountry || null,
        selectedLevel:         s.selectedLevel        || null,
        smokeCraft: { ...BLANK_SMOKE_CRAFT,   ...(s.smokeCraft   || {}) },
        passport: {
          ...BLANK_PASSPORT,
          ...(s.passport || {}),
          earnedStamps:  s.passport?.earnedStamps  || s.smokecraftStamps?.map(st => ({
            stampId:      st.id,
            title:        st.id,
            craft:        'SmokeCraft 360',
            earnedAt:     st.earnedAt || Date.now(),
            points:       100,
            sourceModule: 'smokecraft',
          })) || [],
          latestStampId: s.passport?.latestStampId || s.latestStampId || null,
        },
        goldenBox: {
          ...BLANK_GOLDEN_BOX,
          ...(s.goldenBox || {}),
          progress: s.goldenBox?.progress ?? (s.goldenBoxProgress?.progress || 0),
        },
        leaderboard: {
          ...BLANK_LEADERBOARD,
          ...(s.leaderboard || {}),
          score:       s.leaderboard?.score       ?? s.leaderboardScore ?? 0,
          displayName: s.leaderboard?.displayName ?? s.profile?.nickname ?? null,
        },
        preferences: {
          ...BLANK_PREFERENCES,
          ...(s.preferences || {}),
          audioEnabled:   s.preferences?.audioEnabled   ?? s.audioEnabled   ?? true,
          hapticsEnabled: s.preferences?.hapticsEnabled ?? s.hapticsEnabled ?? true,
        },
        system: {
          ...BLANK_SYSTEM,
          ...(s.system || {}),
          lastVisitedRoute: s.system?.lastVisitedRoute ?? s.lastVisitedRoute ?? null,
          schemaVersion:    SCHEMA_VERSION,
        },
        pos3:       { ...BLANK_POS3,       ...(s.pos3       || {}) },
        eatCommand: { ...BLANK_EAT_COMMAND, ...(s.eatCommand || {}) },
        __version:  SCHEMA_VERSION,
      }
    }

    // Top-up: scoring + loyalty fields for sessions that predate this engine.
    // Additive only — never overwrites existing non-zero values.
    s = {
      skillScore:            s.skillScore            ?? 0,
      challengeScore:        s.challengeScore        ?? 0,
      loyaltyPoints:         s.loyaltyPoints         ?? 0,
      lifetimeLoyaltyPoints: s.lifetimeLoyaltyPoints ?? 0,
      redeemablePoints:      s.redeemablePoints      ?? 0,
      passportStampCount:    s.passportStampCount    ?? 0,
      purchaseCount:         s.purchaseCount         ?? 0,
      houseCigarPurchases:   s.houseCigarPurchases   ?? 0,
      pairingPurchases:      s.pairingPurchases      ?? 0,
      eventParticipationCount: s.eventParticipationCount ?? 0,
      referralCount:         s.referralCount         ?? 0,
      loyaltyLedger:         s.loyaltyLedger         ?? [],
      usedTransactionIds:    s.usedTransactionIds    ?? [],
      ...s,
    }

    // Top-up for sessions already at v4 that predate the Phase 13 networking
    // consent/status fields — additive only, never overwrites existing values.
    s = {
      ...s,
      smokeCraft: {
        ...s.smokeCraft,
        passportConnections: s.smokeCraft?.passportConnections ?? [],
        networkingStatus:    s.smokeCraft?.networkingStatus    ?? 'not_started',
        networkingConsent: {
          ...BLANK_SMOKE_CRAFT.networkingConsent,
          ...(s.smokeCraft?.networkingConsent || {}),
        },
      },
    }

    return s
  } catch {
    return null
  }
}
