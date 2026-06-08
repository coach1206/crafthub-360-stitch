/**
 * Session Service — manages guest sessions and profiles.
 * Dual-mode: PostgreSQL when available, in-memory prototype otherwise.
 */

import { isDbAvailable, query } from '../db/connection.js'
import { log } from './auditService.js'

// ── In-memory prototype store ─────────────────────────────────
const sessions = new Map()
const profiles  = new Map()

// ── Helpers ───────────────────────────────────────────────────
function now() { return new Date().toISOString() }

function sanitizeSession(data) {
  return {
    session_id:              data.session_id              || data.sessionId,
    selected_craft:          data.selected_craft          || data.selectedCraft           || null,
    selected_mentor:         data.selected_mentor         || data.selectedMentor          || null,
    selected_mentor_country: data.selected_mentor_country || data.selectedMentorCountry   || null,
    selected_level:          data.selected_level          || data.selectedLevel           || null,
    current_session:         data.current_session         || data.smokeCraft?.currentSession || null,
    completed_sessions:      data.completed_sessions      || data.smokeCraft?.completedSessions || [],
    last_visited_route:      data.last_visited_route      || data.system?.lastVisitedRoute || null,
    schema_version:          data.schema_version          || data.__version               || 4,
    kiosk_mode:              data.kiosk_mode              ?? data.system?.kioskMode       ?? false,
    source_module:           data.source_module           || data.system?.sourceModule    || null,
  }
}

function sanitizeProfile(data) {
  const p = data.profile || data.guestProfile || data
  return {
    first_name:               p.first_name    || p.firstName              || null,
    last_name:                p.last_name     || p.lastName               || null,
    nickname:                 p.nickname                                  || null,
    age_range:                p.age_range     || p.ageRange               || null,
    phone:                    p.phone                                     || null,
    email:                    p.email                                     || null,
    city:                     p.city                                      || null,
    state:                    p.state                                     || null,
    zip:                      p.zip                                       || null,
    profile_image_url:        p.profile_image_url || p.photo              || null,
    image_moderation_status: 'pending',
  }
}

// ── Public API ────────────────────────────────────────────────

/**
 * Creates or upserts a session record.
 */
export async function createSession(data) {
  const s = sanitizeSession(data)
  if (!s.session_id) throw new Error('session_id is required')

  if (isDbAvailable()) {
    try {
      const result = await query(
        `INSERT INTO guest_sessions
           (session_id, selected_craft, selected_mentor, selected_mentor_country,
            selected_level, current_session, completed_sessions,
            last_visited_route, schema_version, kiosk_mode, source_module)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (session_id) DO UPDATE SET
           selected_craft           = EXCLUDED.selected_craft,
           selected_mentor          = EXCLUDED.selected_mentor,
           selected_mentor_country  = EXCLUDED.selected_mentor_country,
           selected_level           = EXCLUDED.selected_level,
           current_session          = EXCLUDED.current_session,
           completed_sessions       = EXCLUDED.completed_sessions,
           last_visited_route       = EXCLUDED.last_visited_route,
           source_module            = EXCLUDED.source_module,
           updated_at               = NOW()
         RETURNING *`,
        [
          s.session_id, s.selected_craft, s.selected_mentor,
          s.selected_mentor_country, s.selected_level,
          JSON.stringify(s.current_session),
          JSON.stringify(s.completed_sessions),
          s.last_visited_route, s.schema_version, s.kiosk_mode, s.source_module,
        ]
      )
      await log('system', s.session_id, 'session.upserted', 'session', s.session_id)
      return result.rows[0]
    } catch (err) {
      console.warn('[sessionService] DB upsert failed:', err.message)
    }
  }

  // Prototype fallback
  const record = { id: sessions.size + 1, created_at: now(), updated_at: now(), ...s }
  sessions.set(s.session_id, record)
  return record
}

/**
 * Retrieves a session by sessionId.
 */
export async function getSession(sessionId) {
  if (isDbAvailable()) {
    try {
      const result = await query(
        'SELECT * FROM guest_sessions WHERE session_id = $1',
        [sessionId]
      )
      return result.rows[0] || null
    } catch (err) {
      console.warn('[sessionService] DB read failed:', err.message)
    }
  }
  return sessions.get(sessionId) || null
}

/**
 * Updates specific fields on a session.
 */
export async function updateSession(sessionId, updates) {
  if (!sessionId) throw new Error('sessionId required')
  const s = sanitizeSession({ session_id: sessionId, ...updates })

  if (isDbAvailable()) {
    try {
      const result = await query(
        `UPDATE guest_sessions SET
           selected_craft           = COALESCE($2, selected_craft),
           selected_mentor          = COALESCE($3, selected_mentor),
           selected_mentor_country  = COALESCE($4, selected_mentor_country),
           selected_level           = COALESCE($5, selected_level),
           last_visited_route       = COALESCE($6, last_visited_route),
           source_module            = COALESCE($7, source_module),
           updated_at               = NOW()
         WHERE session_id = $1
         RETURNING *`,
        [
          sessionId, s.selected_craft, s.selected_mentor,
          s.selected_mentor_country, s.selected_level,
          s.last_visited_route, s.source_module,
        ]
      )
      return result.rows[0] || null
    } catch (err) {
      console.warn('[sessionService] DB update failed:', err.message)
    }
  }

  const existing = sessions.get(sessionId) || {}
  const updated  = { ...existing, ...s, updated_at: now() }
  sessions.set(sessionId, updated)
  return updated
}

/**
 * Saves a guest profile (upsert by session_id).
 */
export async function saveGuestProfile(sessionId, profileData) {
  const p = sanitizeProfile(profileData)

  if (isDbAvailable()) {
    try {
      // Ensure session exists first
      await createSession({ session_id: sessionId })
      const result = await query(
        `INSERT INTO guest_profiles
           (session_id, first_name, last_name, nickname, age_range, phone, email,
            city, state, zip, profile_image_url, image_moderation_status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         ON CONFLICT (session_id) DO UPDATE SET
           first_name              = EXCLUDED.first_name,
           last_name               = EXCLUDED.last_name,
           nickname                = EXCLUDED.nickname,
           phone                   = EXCLUDED.phone,
           email                   = EXCLUDED.email,
           city                    = EXCLUDED.city,
           state                   = EXCLUDED.state,
           zip                     = EXCLUDED.zip,
           profile_image_url       = EXCLUDED.profile_image_url,
           updated_at              = NOW()
         RETURNING *`,
        [
          sessionId, p.first_name, p.last_name, p.nickname, p.age_range,
          p.phone, p.email, p.city, p.state, p.zip,
          p.profile_image_url, p.image_moderation_status,
        ]
      )
      await log('guest', sessionId, 'profile.saved', 'session', sessionId)
      return result.rows[0]
    } catch (err) {
      console.warn('[sessionService] Profile DB save failed:', err.message)
    }
  }

  const record = { session_id: sessionId, updated_at: now(), ...p }
  profiles.set(sessionId, record)
  return record
}

/**
 * Records a SmokeCraft session completion.
 */
export async function completeSmokeCraftSession(sessionId, craftData = {}) {
  if (isDbAvailable()) {
    try {
      const result = await query(
        `INSERT INTO craft_sessions
           (session_id, craft, session_number, score, flavor_preferences,
            pairing_selections, completed_at)
         VALUES ($1,$2,$3,$4,$5,$6,NOW())
         RETURNING *`,
        [
          sessionId,
          craftData.craft         || 'SmokeCraft 360',
          craftData.sessionNumber || 1,
          craftData.score         || 0,
          JSON.stringify(craftData.flavorPreferences  || []),
          JSON.stringify(craftData.pairingSelections  || []),
        ]
      )
      await log('guest', sessionId, 'smokecraft.session.completed', 'session', sessionId, craftData)
      return result.rows[0]
    } catch (err) {
      console.warn('[sessionService] Craft completion DB save failed:', err.message)
    }
  }

  const record = {
    id: Date.now(),
    session_id:   sessionId,
    completed_at: now(),
    ...craftData,
  }
  return record
}
