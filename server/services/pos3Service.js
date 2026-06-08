/**
 * POS 3 Service (backend) — records guest activity signals and
 * prepares payloads for point-of-sale system integration.
 * Dual-mode: PostgreSQL when available, in-memory prototype otherwise.
 */

import { isDbAvailable, query } from '../db/connection.js'
import { log } from './auditService.js'

const activities = new Map()    // prototype: session_id → activity[]

function now() { return new Date().toISOString() }

/**
 * Saves a POS 3 activity record for a session.
 */
export async function saveActivity(data) {
  const sessionId = data.sessionId || data.session_id
  if (!sessionId) throw new Error('sessionId required')

  const providerMode = process.env.POS3_PROVIDER_MODE || 'prototype'

  if (isDbAvailable()) {
    try {
      const result = await query(
        `INSERT INTO pos3_activity
           (session_id, guest_nickname, selected_craft, selected_level,
            selected_mentor, flavor_preferences, pairing_selections,
            suggested_pairings, upsell_recommendations, inventory_signals,
            provider_mode)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         RETURNING *`,
        [
          sessionId,
          data.guestNickname        || 'Lounge Guest',
          data.selectedCraft        || 'SmokeCraft 360',
          data.selectedLevel        || 'Novice',
          data.selectedMentor       || null,
          JSON.stringify(data.flavorPreferences     || []),
          JSON.stringify(data.pairingSelections     || []),
          JSON.stringify(data.suggestedPairings     || []),
          JSON.stringify(data.upsellRecommendations || []),
          JSON.stringify(data.inventorySignals      || []),
          providerMode,
        ]
      )
      await log('guest', sessionId, 'pos3.activity.saved', 'session', sessionId)
      return result.rows[0]
    } catch (err) {
      console.warn('[pos3Service] DB save failed:', err.message)
    }
  }

  const record = { id: Date.now(), session_id: sessionId, created_at: now(), provider_mode: providerMode, ...data }
  const bucket = activities.get(sessionId) || []
  activities.set(sessionId, [...bucket, record])
  return record
}

/**
 * Returns the most recent POS 3 payload for a session.
 */
export async function getSessionPayload(sessionId) {
  if (isDbAvailable()) {
    try {
      const result = await query(
        `SELECT * FROM pos3_activity
          WHERE session_id = $1
          ORDER BY created_at DESC
          LIMIT 1`,
        [sessionId]
      )
      return result.rows[0] || null
    } catch (err) {
      console.warn('[pos3Service] DB read failed:', err.message)
    }
  }
  const bucket = activities.get(sessionId) || []
  return bucket[bucket.length - 1] || null
}
