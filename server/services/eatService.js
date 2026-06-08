/**
 * E.A.T. Command Service (backend) — records guest engagement analytics.
 * Management-only. Never exposed to guest-facing routes.
 * Dual-mode: PostgreSQL when available, in-memory prototype otherwise.
 */

import { isDbAvailable, query } from '../db/connection.js'
import { log } from './auditService.js'

const analytics = new Map()    // prototype: session_id → record[]

function now() { return new Date().toISOString() }

/**
 * Saves an E.A.T. analytics record for a session.
 */
export async function saveAnalytics(data) {
  const sessionId = data.sessionId || data.session_id
  if (!sessionId) throw new Error('sessionId required')

  const commandPayload = {
    guestProgress:       data.guestProgress       || {},
    activeCraft:         data.activeCraft          || null,
    passportActivity:    data.passportActivity     || {},
    leaderboardScore:    data.leaderboardScore     || 0,
    pairingInterests:    data.pairingInterests     || [],
    goldenBoxProgress:   data.goldenBoxProgress    || 0,
    upsellSignals:       data.upsellSignals        || [],
    sessionValueEstimate: data.sessionValueEstimate || 0,
    timestamp:           Date.now(),
  }

  if (isDbAvailable()) {
    try {
      const result = await query(
        `INSERT INTO eat_analytics
           (session_id, engagement_score, guest_mood_signal, session_value,
            staff_assist_triggered, environment_notes, asset_signals,
            transaction_signals, command_payload)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         RETURNING *`,
        [
          sessionId,
          data.engagementScore        || 0,
          data.guestMoodSignal        || null,
          data.sessionValueEstimate   || data.sessionValue || 0,
          data.staffAssistTriggered   ?? false,
          JSON.stringify(data.environmentNotes    || []),
          JSON.stringify(data.assetSignals        || []),
          JSON.stringify(data.transactionSignals  || []),
          JSON.stringify(commandPayload),
        ]
      )
      await log('system', sessionId, 'eat.analytics.saved', 'session', sessionId, { score: data.engagementScore })
      return result.rows[0]
    } catch (err) {
      console.warn('[eatService] DB save failed:', err.message)
    }
  }

  const record = {
    id:             Date.now(),
    session_id:     sessionId,
    created_at:     now(),
    command_payload: commandPayload,
    ...data,
  }
  const bucket = analytics.get(sessionId) || []
  analytics.set(sessionId, [...bucket, record])
  return record
}

/**
 * Returns the most recent E.A.T. payload for a session.
 * Management-only — should be called by internal APIs only.
 */
export async function getSessionPayload(sessionId) {
  if (isDbAvailable()) {
    try {
      const result = await query(
        `SELECT * FROM eat_analytics
          WHERE session_id = $1
          ORDER BY created_at DESC
          LIMIT 1`,
        [sessionId]
      )
      return result.rows[0] || null
    } catch (err) {
      console.warn('[eatService] DB read failed:', err.message)
    }
  }
  const bucket = analytics.get(sessionId) || []
  return bucket[bucket.length - 1] || null
}

/**
 * Returns summarised analytics for the management dashboard.
 */
export async function getDashboardSummary(limit = 10) {
  if (isDbAvailable()) {
    try {
      const result = await query(
        `SELECT session_id, engagement_score, session_value, staff_assist_triggered,
                created_at
           FROM eat_analytics
           ORDER BY created_at DESC
           LIMIT $1`,
        [limit]
      )
      return result.rows
    } catch (err) {
      console.warn('[eatService] Dashboard read failed:', err.message)
    }
  }
  const all = []
  for (const bucket of analytics.values()) {
    if (bucket.length > 0) all.push(bucket[bucket.length - 1])
  }
  return all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, limit)
}
