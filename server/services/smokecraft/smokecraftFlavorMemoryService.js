/**
 * SmokeCraft Flavor Memory Service
 * Captures and retrieves Flavor Memory entries from the SmokeCraft journey.
 * Flavor Memory is a required journey step — it must not be removed.
 * Flavor memory signals feed customer preference intelligence.
 */

import { isDbAvailable, query } from '../../db/connection.js'

const _memoryStore = new Map()
let _idCounter = 1

const dbAvailable = () => isDbAvailable()

function newMemoryId() {
  return `sc-fm-${Date.now()}-${_idCounter++}`
}

export async function captureFlavorMemory(data) {
  const memoryId = data.memoryId ?? newMemoryId()
  const now = new Date().toISOString()

  const record = {
    memoryId,
    sessionId: data.sessionId ?? null,
    visitId: data.visitId ?? null,
    userId: data.userId ?? null,
    phase: data.phase ?? 'flavor_memory',
    flavorNotes: data.flavorNotes ?? [],
    aromaNotes: data.aromaNotes ?? [],
    burnNotes: data.burnNotes ?? [],
    drawNotes: data.drawNotes ?? [],
    retrohaleNotes: data.retrohaleNotes ?? [],
    likedNotes: data.likedNotes ?? [],
    dislikedNotes: data.dislikedNotes ?? [],
    surpriseNotes: data.surpriseNotes ?? [],
    strengthPerception: data.strengthPerception ?? null,
    bodyPerception: data.bodyPerception ?? null,
    finishLength: data.finishLength ?? null,
    memoryTags: data.memoryTags ?? [],
    createdAt: now,
    persistenceMode: dbAvailable() ? 'database' : 'memory_fallback',
    productionReady: dbAvailable(),
  }

  if (dbAvailable()) {
    try {
      await query(
        `INSERT INTO smokecraft_flavor_memory (memory_id, session_id, user_id, data, created_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [memoryId, record.sessionId, record.userId, JSON.stringify(record), now]
      )
      return { ...record, persistenceMode: 'database', productionReady: true }
    } catch { /* fall through */ }
  }

  _memoryStore.set(memoryId, record)
  return record
}

export async function getFlavorMemory(memoryId) {
  if (dbAvailable()) {
    try {
      const result = await query(
        `SELECT data FROM smokecraft_flavor_memory WHERE memory_id = $1`,
        [memoryId]
      )
      if (result.rows.length > 0) return result.rows[0].data
    } catch { /* fall through */ }
  }
  return _memoryStore.get(memoryId) ?? null
}

export async function getFlavorMemoriesForUser(userId) {
  if (dbAvailable()) {
    try {
      const result = await query(
        `SELECT data FROM smokecraft_flavor_memory WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId]
      )
      return result.rows.map(r => r.data)
    } catch { /* fall through */ }
  }
  return [..._memoryStore.values()].filter(r => r.userId === userId)
}

export async function getFlavorMemoriesForSession(sessionId) {
  if (dbAvailable()) {
    try {
      const result = await query(
        `SELECT data FROM smokecraft_flavor_memory WHERE session_id = $1 ORDER BY created_at ASC`,
        [sessionId]
      )
      return result.rows.map(r => r.data)
    } catch { /* fall through */ }
  }
  return [..._memoryStore.values()].filter(r => r.sessionId === sessionId)
}

/**
 * Converts a flavor memory record into preference intelligence signals.
 * Used by preference intelligence service.
 */
export function flavorMemoryToPreferenceSignals(flavorMemory) {
  return {
    flavorNotes: flavorMemory.flavorNotes ?? [],
    likedNotes: flavorMemory.likedNotes ?? [],
    dislikedNotes: flavorMemory.dislikedNotes ?? [],
    strengthPerception: flavorMemory.strengthPerception ?? null,
    bodyPerception: flavorMemory.bodyPerception ?? null,
    memoryTags: flavorMemory.memoryTags ?? [],
    sessionId: flavorMemory.sessionId,
    visitId: flavorMemory.visitId,
  }
}

export function getFlavorMemoryServiceReport() {
  return {
    journeyStep: 'flavor_memory',
    required: true,
    removable: false,
    feedsPreferenceIntelligence: true,
    persistenceMode: dbAvailable() ? 'database' : 'memory_fallback',
    productionReady: dbAvailable(),
    memoryEntryCount: _memoryStore.size,
  }
}
