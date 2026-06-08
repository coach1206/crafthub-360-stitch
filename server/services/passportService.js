/**
 * Passport Service (backend) — manages passport records and stamp awards.
 * Dual-mode: PostgreSQL when available, in-memory prototype otherwise.
 */

import { isDbAvailable, query } from '../db/connection.js'
import { log } from './auditService.js'

const passports = new Map()
const stamps    = new Map()    // key: passportId, value: stamp[]

function now() { return new Date().toISOString() }

// ── Passport records ──────────────────────────────────────────

/**
 * Gets the passport for a session, creating one if it doesn't exist.
 */
export async function getOrCreatePassport(sessionId, passportId = null) {
  const pid = passportId || `PP-${Date.now().toString(36).toUpperCase()}`

  if (isDbAvailable()) {
    try {
      // Try to find existing by sessionId
      let result = await query(
        'SELECT * FROM passport_records WHERE session_id = $1 LIMIT 1',
        [sessionId]
      )
      if (result.rows.length > 0) return result.rows[0]

      // Create new
      result = await query(
        `INSERT INTO passport_records (passport_id, session_id)
         VALUES ($1, $2)
         ON CONFLICT (passport_id) DO UPDATE SET updated_at = NOW()
         RETURNING *`,
        [pid, sessionId]
      )
      await log('system', sessionId, 'passport.created', 'passport', pid)
      return result.rows[0]
    } catch (err) {
      console.warn('[passportService] DB error:', err.message)
    }
  }

  const existing = [...passports.values()].find(p => p.session_id === sessionId)
  if (existing) return existing
  const record = { id: passports.size + 1, passport_id: pid, session_id: sessionId, ceremony_seen: false, connection_count: 0, created_at: now() }
  passports.set(pid, record)
  return record
}

/**
 * Awards a stamp to a passport. Prevents duplicates.
 */
export async function awardStamp(stampData) {
  const { passportId, sessionId } = stampData
  if (!passportId || !sessionId) throw new Error('passportId and sessionId required')

  if (isDbAvailable()) {
    try {
      const result = await query(
        `INSERT INTO passport_stamps
           (stamp_id, passport_id, session_id, title, craft, session_number,
            event_name, earned_at, visual_theme, points, source_module)
         VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),$8,$9,$10)
         ON CONFLICT (stamp_id, passport_id) DO NOTHING
         RETURNING *`,
        [
          stampData.stampId       || `stamp_${Date.now().toString(36)}`,
          passportId,
          sessionId,
          stampData.title         || 'Passport Stamp',
          stampData.craft         || 'SmokeCraft 360',
          stampData.sessionNumber || 1,
          stampData.eventName     || 'The Grand Lounge',
          stampData.visualTheme   || 'gold',
          stampData.points        || 100,
          stampData.sourceModule  || 'smokecraft-session-1',
        ]
      )
      if (result.rows[0]) {
        await log('guest', sessionId, 'stamp.awarded', 'passport', passportId, { stampId: stampData.stampId })
      }
      return result.rows[0] || null
    } catch (err) {
      console.warn('[passportService] Stamp DB error:', err.message)
    }
  }

  const bucket = stamps.get(passportId) || []
  if (bucket.find(s => s.stamp_id === stampData.stampId)) return null
  const stamp = { id: Date.now(), stamp_id: stampData.stampId, passport_id: passportId, session_id: sessionId, earned_at: now(), ...stampData }
  stamps.set(passportId, [...bucket, stamp])
  return stamp
}

/**
 * Returns all stamps for a passport.
 */
export async function getStamps(passportId) {
  if (isDbAvailable()) {
    try {
      const result = await query(
        'SELECT * FROM passport_stamps WHERE passport_id = $1 ORDER BY earned_at ASC',
        [passportId]
      )
      return result.rows
    } catch (err) {
      console.warn('[passportService] Stamp read error:', err.message)
    }
  }
  return stamps.get(passportId) || []
}

/**
 * Marks the passport ceremony as seen.
 */
export async function markCeremonySeen(passportId) {
  if (isDbAvailable()) {
    try {
      await query(
        `UPDATE passport_records SET ceremony_seen = TRUE, updated_at = NOW()
         WHERE passport_id = $1`,
        [passportId]
      )
      return
    } catch (err) {
      console.warn('[passportService] Ceremony seen DB error:', err.message)
    }
  }
  const record = passports.get(passportId)
  if (record) passports.set(passportId, { ...record, ceremony_seen: true })
}
