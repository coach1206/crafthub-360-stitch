/**
 * Passport Entry Utilities — pure helpers for QR/kiosk session identity.
 * No React, no hooks. All functions are safe against missing/null inputs.
 * Import from GuestSessionContext and entry-aware pages.
 */

import {
  DEFAULT_VENUE_ID,
  DEFAULT_DEVICE_ID,
  DEFAULT_ENTRY_SOURCE,
  VENUE_DISPLAY_NAMES,
  ENTRY_SOURCE_LABELS,
} from '../data/passportEntryConfig.js'

const SCHEMA_VERSION = 3

// ─── ID generation ───────────────────────────────────────────────────────────

function genGuestId() {
  const now = Date.now()
  return `g_${now.toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

// ─── Entry Session ────────────────────────────────────────────────────────────

/**
 * Creates a fresh entry session identity payload from a QR/kiosk context.
 * Does NOT wipe any existing stamps, XP, or completedSteps.
 * Merge into session state, don't replace.
 */
export function createPassportEntrySession(payload = {}) {
  const now = Date.now()
  return {
    guestId:         payload.guestId      || genGuestId(),
    venueId:         payload.venueId      || DEFAULT_VENUE_ID,
    deviceId:        payload.deviceId     || DEFAULT_DEVICE_ID,
    entrySource:     payload.entrySource  || DEFAULT_ENTRY_SOURCE,
    entryStartedAt:  payload.entryStartedAt || now,
    lastActiveAt:    now,
    profileComplete: false,
    resumeToken:     null,
  }
}

// ─── URL Param Parsing ────────────────────────────────────────────────────────

/**
 * Reads URLSearchParams safely. Returns { venueId, deviceId, entrySource }.
 * Never throws. All values may be null if params are absent.
 * Supports: ?venue=X&device=Y&source=Z
 */
export function parsePassportEntryParams(searchParams) {
  if (!searchParams || typeof searchParams.get !== 'function') {
    return { venueId: null, deviceId: null, entrySource: null }
  }
  return {
    venueId:     searchParams.get('venue')  || null,
    deviceId:    searchParams.get('device') || null,
    entrySource: searchParams.get('source') || null,
  }
}

export function getEntrySourceFromUrl(searchParams) {
  return parsePassportEntryParams(searchParams).entrySource || DEFAULT_ENTRY_SOURCE
}

export function getVenueIdFromUrl(searchParams) {
  return parsePassportEntryParams(searchParams).venueId || DEFAULT_VENUE_ID
}

export function getDeviceIdFromUrl(searchParams) {
  return parsePassportEntryParams(searchParams).deviceId || DEFAULT_DEVICE_ID
}

// ─── Profile ──────────────────────────────────────────────────────────────────

/**
 * Merges profile fields into session WITHOUT overwriting stamps, XP, or completedSteps.
 * Updates both session.guestProfile (full identity) and session.profile (display fields).
 * Returns the updated session object.
 */
export function mergeGuestProfile(session, profile) {
  if (!session || !profile || typeof profile !== 'object') return session ?? {}
  return {
    ...session,
    guestProfile: {
      ...(session.guestProfile ?? {}),
      ...profile,
      updatedAt: Date.now(),
    },
    profile: {
      ...(session.profile ?? {}),
      firstName:    profile.firstName    ?? session.profile?.firstName    ?? '',
      lastName:     profile.lastName     ?? session.profile?.lastName     ?? '',
      nickname:     profile.nickname     ?? session.profile?.nickname     ?? '',
      email:        profile.email        ?? session.profile?.email        ?? '',
      phone:        profile.phone        ?? session.profile?.phone        ?? '',
      city:         profile.city         ?? session.profile?.city         ?? '',
      state:        profile.state        ?? session.profile?.state        ?? '',
      zip:          profile.zip          ?? session.profile?.zip          ?? '',
      ageConfirmed: profile.ageConfirmed ?? session.profile?.ageConfirmed ?? false,
      photo:        profile.photo        ?? session.profile?.photo        ?? null,
    },
    // smokecraftStamps, xp, completedSteps, badges: untouched
  }
}

/**
 * Returns true when the required Passport identity fields are present.
 * Requires: firstName + ageConfirmed + (phone OR email).
 */
export function isGuestProfileComplete(session) {
  if (!session) return false
  const p = session.profile ?? {}
  return (
    typeof p.firstName === 'string' && p.firstName.trim().length > 0 &&
    p.ageConfirmed === true &&
    (
      (typeof p.phone === 'string' && p.phone.trim().length > 0) ||
      (typeof p.email === 'string' && p.email.trim().length > 0)
    )
  )
}

/**
 * Returns a human-readable display name for the guest.
 * Falls back gracefully through nickname → first+last → 'Grand Member'.
 */
export function getGuestDisplayName(session) {
  if (!session) return 'Grand Member'
  const p = session.profile ?? {}
  if (p.nickname && p.nickname.trim()) return p.nickname.trim()
  if (p.firstName && p.firstName.trim()) return `${p.firstName} ${p.lastName || ''}`.trim()
  return 'Grand Member'
}

// ─── Resume Tokens ────────────────────────────────────────────────────────────

/**
 * Creates a lightweight resume token (base64, no secrets, no PII).
 * Format: <sessionId>:<guestId>:<entryStartedAt>
 * Safe for localStorage storage.
 */
export function createResumeToken(session) {
  if (!session) return null
  try {
    const raw = [
      session.sessionId     || '',
      session.guestId       || '',
      session.entryStartedAt || '',
    ].join(':')
    return btoa(raw)
  } catch {
    return null
  }
}

/**
 * Validates a resume token. Returns { sessionId, guestId, entryStartedAt } or null.
 * Never throws.
 */
export function validateResumeToken(token) {
  if (!token || typeof token !== 'string') return null
  try {
    const raw   = atob(token)
    const parts = raw.split(':')
    if (parts.length < 2) return null
    const [sessionId, guestId, entryStartedAt] = parts
    if (!sessionId) return null
    return { sessionId, guestId: guestId || null, entryStartedAt: entryStartedAt || null }
  } catch {
    return null
  }
}

// ─── Display Helpers ──────────────────────────────────────────────────────────

/** Returns the venue's display name, falling back to the raw ID or a default. */
export function getVenueDisplayName(venueId) {
  if (!venueId) return 'Grand Lounge'
  return VENUE_DISPLAY_NAMES[venueId] || venueId
}

/** Returns a human label for the entry source. */
export function getEntrySourceLabel(entrySource) {
  if (!entrySource) return 'Direct'
  return ENTRY_SOURCE_LABELS[entrySource] || entrySource
}

// ─── Backend Sync Payload ─────────────────────────────────────────────────────

/**
 * Builds a complete, backend-ready sync payload from a session object.
 * All fields are safe to JSON.stringify. No functions, no circular refs.
 * Phase 5: POST this to the backend when ready.
 */
export function buildPassportSyncPayload(session) {
  if (!session || typeof session !== 'object') return null
  return {
    schemaVersion:    SCHEMA_VERSION,
    sessionId:        session.sessionId        ?? null,
    guestId:          session.guestId          ?? null,
    venueId:          session.venueId          ?? DEFAULT_VENUE_ID,
    deviceId:         session.deviceId         ?? DEFAULT_DEVICE_ID,
    entrySource:      session.entrySource      ?? DEFAULT_ENTRY_SOURCE,
    entryStartedAt:   session.entryStartedAt   ?? null,
    lastActiveAt:     session.lastActiveAt     ?? null,
    guestProfile:     session.guestProfile     ?? null,
    profileComplete:  session.profileComplete  ?? false,
    smokecraftStamps: (session.smokecraftStamps ?? []).map(s => ({
      id:       s.id,
      name:     s.name,
      source:   s.source   ?? 'unknown',
      earnedAt: s.earnedAt ?? null,
    })),
    completedSteps:   session.completedSteps   ?? [],
    xp:               session.xp               ?? 0,
    rank:             session.rank             ?? 'Novice',
    badges:           session.badges           ?? [],
    latestStampId:    session.latestStampId    ?? null,
    goldenBoxProgress: session.goldenBoxProgress ?? null,
    resumeToken:      session.resumeToken      ?? null,
  }
}
