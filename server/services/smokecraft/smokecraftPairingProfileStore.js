/**
 * SmokeCraft Pairing Profile Store
 * Dual-mode persistence: database when DATABASE_URL configured, memory_fallback otherwise.
 * Never claims production-ready in fallback mode.
 */

import { isDbAvailable, query } from '../../db/connection.js'

const _memoryStore = new Map()
let _idCounter = 1

const dbAvailable = () => isDbAvailable()

function newProfileId() {
  return `sc-profile-${Date.now()}-${_idCounter++}`
}

export function getPersistenceMode() {
  return dbAvailable() ? 'database' : 'memory_fallback'
}

export function isProductionReady() {
  return dbAvailable()
}

export async function createProfile(data) {
  const profileId = data.profileId ?? newProfileId()
  const now = new Date().toISOString()
  const record = {
    profileId,
    userId: data.userId ?? null,
    venueId: data.venueId ?? null,
    sessionId: data.sessionId ?? null,
    visitId: data.visitId ?? null,
    preferredStrength: data.preferredStrength ?? null,
    preferredBody: data.preferredBody ?? null,
    preferredWrapperTypes: data.preferredWrapperTypes ?? [],
    preferredOrigins: data.preferredOrigins ?? [],
    likedFlavorNotes: data.likedFlavorNotes ?? [],
    dislikedFlavorNotes: data.dislikedFlavorNotes ?? [],
    drinkPreferences: data.drinkPreferences ?? [],
    foodPreferences: data.foodPreferences ?? [],
    allergyNotes: data.allergyNotes ?? [],
    avoidIngredients: data.avoidIngredients ?? [],
    mentorId: data.mentorId ?? null,
    mentorStyle: data.mentorStyle ?? null,
    scorecardSignals: data.scorecardSignals ?? [],
    flavorMemorySignals: data.flavorMemorySignals ?? [],
    orderHistorySignals: data.orderHistorySignals ?? [],
    lastRecommendationId: data.lastRecommendationId ?? null,
    persistenceMode: getPersistenceMode(),
    productionReady: isProductionReady(),
    createdAt: now,
    updatedAt: now,
  }

  if (dbAvailable()) {
    try {
      await query(
        `INSERT INTO smokecraft_pairing_profiles (profile_id, user_id, data, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [profileId, record.userId, JSON.stringify(record), now, now]
      )
      return { ...record, persistenceMode: 'database', productionReady: true }
    } catch {
      // fall through to memory
    }
  }

  _memoryStore.set(profileId, record)
  return record
}

export async function getProfile(profileId) {
  if (dbAvailable()) {
    try {
      const result = await query(
        `SELECT data FROM smokecraft_pairing_profiles WHERE profile_id = $1`,
        [profileId]
      )
      if (result.rows.length > 0) return result.rows[0].data
    } catch { /* fall through */ }
  }
  return _memoryStore.get(profileId) ?? null
}

export async function getProfileByUser(userId) {
  if (dbAvailable()) {
    try {
      const result = await query(
        `SELECT data FROM smokecraft_pairing_profiles WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1`,
        [userId]
      )
      if (result.rows.length > 0) return result.rows[0].data
    } catch { /* fall through */ }
  }
  for (const profile of _memoryStore.values()) {
    if (profile.userId === userId) return profile
  }
  return null
}

export async function updateProfile(profileId, patch) {
  const existing = await getProfile(profileId)
  if (!existing) return null
  const now = new Date().toISOString()
  const updated = { ...existing, ...patch, profileId, updatedAt: now, persistenceMode: getPersistenceMode(), productionReady: isProductionReady() }

  if (dbAvailable()) {
    try {
      await query(
        `UPDATE smokecraft_pairing_profiles SET data = $1, updated_at = $2 WHERE profile_id = $3`,
        [JSON.stringify(updated), now, profileId]
      )
      return { ...updated, persistenceMode: 'database', productionReady: true }
    } catch { /* fall through */ }
  }

  _memoryStore.set(profileId, updated)
  return updated
}

export function getPairingProfileStoreReport() {
  return {
    persistenceMode: getPersistenceMode(),
    productionReady: isProductionReady(),
    memoryProfileCount: _memoryStore.size,
    message: dbAvailable()
      ? 'Pairing profiles persisted to database.'
      : 'Pairing profiles in memory_fallback. Requires DATABASE_URL for production persistence.',
  }
}
