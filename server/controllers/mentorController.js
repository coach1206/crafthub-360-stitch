/**
 * Mentor Controller — Phase 10 (Auth v2)
 * Human Mentor endpoints: assigned sessions, guidance notes,
 * tasting notes, learner progress, content library.
 *
 * All routes require requireMentor() or requireFounderLevel0().
 */

import { isDbAvailable, query } from '../db/connection.js'
import { ok, fail, serverError } from '../utils/response.js'
import crypto from 'crypto'

// ── GET /api/mentor/sessions ──────────────────────────────────
/**
 * Returns all sessions assigned to the requesting mentor.
 * Founder L0 sees all sessions.
 */
export async function getMentorSessions(req, res) {
  try {
    if (!isDbAvailable()) {
      return ok(res, { sessions: [], mode: 'prototype' })
    }

    const isFounder = req.user?.role === 'founder_level_0'
    const mentorId  = req.user?.id

    const sql = isFounder
      ? `SELECT ms.*, su.display_name AS mentor_name, su.email AS mentor_email
         FROM mentor_sessions ms
         LEFT JOIN system_users su ON ms.mentor_user_id = su.user_id
         ORDER BY ms.created_at DESC
         LIMIT 100`
      : `SELECT ms.*, su.display_name AS mentor_name, su.email AS mentor_email
         FROM mentor_sessions ms
         LEFT JOIN system_users su ON ms.mentor_user_id = su.user_id
         WHERE ms.mentor_user_id = $1
         ORDER BY ms.created_at DESC
         LIMIT 50`

    const params = isFounder ? [] : [mentorId]
    const result = await query(sql, params)

    ok(res, { sessions: result.rows })
  } catch (err) {
    serverError(res, err, 'getMentorSessions')
  }
}

// ── GET /api/mentor/sessions/:sessionId ───────────────────────
export async function getMentorSession(req, res) {
  try {
    const { sessionId } = req.params
    if (!sessionId) return fail(res, 'sessionId required')

    if (!isDbAvailable()) {
      return ok(res, { session: null, notes: [], mode: 'prototype' })
    }

    const isFounder = req.user?.role === 'founder_level_0'
    const mentorId  = req.user?.id

    const sessionResult = await query(
      `SELECT ms.*, su.display_name AS mentor_name
       FROM mentor_sessions ms
       LEFT JOIN system_users su ON ms.mentor_user_id = su.user_id
       WHERE ms.session_id = $1 ${isFounder ? '' : 'AND ms.mentor_user_id = $2'}`,
      isFounder ? [sessionId] : [sessionId, mentorId]
    )

    const session = sessionResult.rows[0]
    if (!session) return fail(res, 'Session not found or not accessible', 404)

    const notesResult = await query(
      `SELECT * FROM mentor_tasting_notes WHERE session_id=$1 ORDER BY created_at ASC`,
      [sessionId]
    )

    ok(res, { session, notes: notesResult.rows })
  } catch (err) {
    serverError(res, err, 'getMentorSession')
  }
}

// ── POST /api/mentor/sessions/:sessionId/notes ────────────────
/**
 * Adds a guidance or tasting note to an assigned session.
 * Body: { noteType, content, metadata? }
 */
export async function addMentorNote(req, res) {
  try {
    const { sessionId } = req.params
    const { noteType = 'general', content, metadata = {} } = req.body || {}

    if (!sessionId) return fail(res, 'sessionId required')
    if (!content || !String(content).trim()) return fail(res, 'content is required')

    const validTypes = ['general', 'flavor', 'pairing', 'guidance', 'recommendation']
    if (!validTypes.includes(noteType)) {
      return fail(res, `noteType must be one of: ${validTypes.join(', ')}`)
    }

    if (!isDbAvailable()) {
      return ok(res, {
        note: { note_id: crypto.randomUUID(), session_id: sessionId, note_type: noteType, content },
        mode: 'prototype',
      })
    }

    const isFounder = req.user?.role === 'founder_level_0'
    const mentorId  = req.user?.id

    // Verify the session belongs to this mentor
    const sessionResult = await query(
      `SELECT session_id FROM mentor_sessions
       WHERE session_id=$1 ${isFounder ? '' : 'AND mentor_user_id=$2'}`,
      isFounder ? [sessionId] : [sessionId, mentorId]
    )
    if (!sessionResult.rows.length) {
      return fail(res, 'Session not found or not accessible', 404)
    }

    const noteId = crypto.randomUUID()
    const result = await query(
      `INSERT INTO mentor_tasting_notes
         (note_id, session_id, mentor_user_id, note_type, content, metadata)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [noteId, sessionId, mentorId, noteType, content.trim(), JSON.stringify(metadata)]
    )

    ok(res, { note: result.rows[0] })
  } catch (err) {
    serverError(res, err, 'addMentorNote')
  }
}

// ── GET /api/mentor/sessions/:sessionId/progress ─────────────
export async function getLearnerProgress(req, res) {
  try {
    const { sessionId } = req.params
    if (!sessionId) return fail(res, 'sessionId required')

    if (!isDbAvailable()) {
      return ok(res, { progress: {}, mode: 'prototype' })
    }

    const isFounder = req.user?.role === 'founder_level_0'
    const mentorId  = req.user?.id

    const result = await query(
      `SELECT learner_progress, status, started_at, completed_at
       FROM mentor_sessions
       WHERE session_id=$1 ${isFounder ? '' : 'AND mentor_user_id=$2'}`,
      isFounder ? [sessionId] : [sessionId, mentorId]
    )
    if (!result.rows.length) return fail(res, 'Session not found', 404)

    ok(res, result.rows[0])
  } catch (err) {
    serverError(res, err, 'getLearnerProgress')
  }
}

// ── PATCH /api/mentor/sessions/:sessionId/progress ───────────
/**
 * Updates learner progress data for an assigned session.
 * Body: { progress: { ...fields } }
 */
export async function updateLearnerProgress(req, res) {
  try {
    const { sessionId } = req.params
    const { progress }  = req.body || {}

    if (!sessionId) return fail(res, 'sessionId required')
    if (!progress || typeof progress !== 'object') {
      return fail(res, 'progress object is required')
    }

    if (!isDbAvailable()) {
      return ok(res, { updated: true, mode: 'prototype' })
    }

    const isFounder = req.user?.role === 'founder_level_0'
    const mentorId  = req.user?.id

    const result = await query(
      `UPDATE mentor_sessions
       SET learner_progress = $1, updated_at = NOW()
       WHERE session_id=$2 ${isFounder ? '' : 'AND mentor_user_id=$3'}
       RETURNING session_id, learner_progress, updated_at`,
      isFounder
        ? [JSON.stringify(progress), sessionId]
        : [JSON.stringify(progress), sessionId, mentorId]
    )

    if (!result.rows.length) return fail(res, 'Session not found or not accessible', 404)
    ok(res, { session: result.rows[0] })
  } catch (err) {
    serverError(res, err, 'updateLearnerProgress')
  }
}

// ── GET /api/mentor/content ───────────────────────────────────
/**
 * Returns the approved mentor content library.
 * Prototype: returns static data.
 */
export async function getMentorContent(req, res) {
  try {
    // Prototype content — will be replaced by DB records in production
    const content = [
      {
        content_id:   'mc-001',
        category:     'SmokeCraft',
        title:        'Cigar Body & Wrapper Guide',
        type:         'reference',
        description:  'Comprehensive guide to cigar body profiles and wrapper leaf identification.',
        craft:        'SmokeCraft',
        approved:     true,
      },
      {
        content_id:   'mc-002',
        category:     'SmokeCraft',
        title:        'Pairing Fundamentals — Spirits & Smoke',
        type:         'pairing',
        description:  'Core principles for pairing cigars with spirits across categories.',
        craft:        'SmokeCraft',
        approved:     true,
      },
      {
        content_id:   'mc-003',
        category:     'PourCraft',
        title:        'Whiskey Flavor Wheel',
        type:         'reference',
        description:  'Interactive flavor wheel for whiskey tasting note guidance.',
        craft:        'PourCraft',
        approved:     true,
      },
      {
        content_id:   'mc-004',
        category:     'WineCraft',
        title:        'Varietal Profiles — Old World vs New World',
        type:         'reference',
        description:  'Comparison guide for major wine varietals across regions.',
        craft:        'WineCraft',
        approved:     true,
      },
    ]

    // Filter by mentor specialties if not founder
    const user = req.user
    if (user?.role !== 'founder_level_0' && user?.mentorSpecialties?.length) {
      const filtered = content.filter(c => user.mentorSpecialties.includes(c.craft))
      return ok(res, { content: filtered })
    }

    ok(res, { content })
  } catch (err) {
    serverError(res, err, 'getMentorContent')
  }
}

// ── GET /api/mentor/pairings ──────────────────────────────────
/**
 * Returns pairing recommendations for a guest session.
 * Query: ?passportId or ?guestSessionId
 */
export async function getPairingRecommendations(req, res) {
  try {
    const { passportId, guestSessionId } = req.query

    // Prototype: return static pairings
    const recommendations = [
      {
        item:        'Perdomo Reserve Champagne Blonde',
        type:        'cigar',
        craft:       'SmokeCraft',
        pairings: [
          { category: 'spirits',   name: 'Aged Rum',         notes: 'Vanilla and caramel complement the Connecticut wrapper.' },
          { category: 'spirits',   name: 'Reposado Tequila', notes: 'Earthy agave notes bridge the medium-light body.' },
          { category: 'beverages', name: 'Cold Brew Coffee',  notes: 'Chocolate undertones enhance the creamy draw.' },
        ],
      },
      {
        item:        'Arturo Fuente Hemingway Short Story',
        type:        'cigar',
        craft:       'SmokeCraft',
        pairings: [
          { category: 'spirits',   name: 'Cognac VSOP',       notes: 'Dried fruit complements the aged Cameroon wrapper.' },
          { category: 'spirits',   name: 'Single Malt Scotch', notes: 'Peaty notes balance the full-bodied profile.' },
          { category: 'beverages', name: 'Dark Roast Coffee',  notes: 'Intensifies the earthy tobacco backbone.' },
        ],
      },
    ]

    ok(res, { recommendations, passportId: passportId || null, guestSessionId: guestSessionId || null })
  } catch (err) {
    serverError(res, err, 'getPairingRecommendations')
  }
}

// ── GET /api/mentor/profile ───────────────────────────────────
/**
 * Returns the requesting mentor's profile and assignment summary.
 */
export async function getMentorProfile(req, res) {
  try {
    const mentorId = req.user?.id

    if (!isDbAvailable()) {
      return ok(res, {
        profile: {
          user_id:            mentorId,
          display_name:       req.user?.displayName || 'Mentor',
          email:              req.user?.email || null,
          mentor_specialties: [],
          role:               'human_mentor',
        },
        stats: { assigned: 0, active: 0, completed: 0 },
        mode:  'prototype',
      })
    }

    const profileResult = await query(
      `SELECT user_id, display_name, email, mentor_specialties, role
       FROM system_users WHERE user_id=$1 AND role='human_mentor'`,
      [mentorId]
    )
    const profile = profileResult.rows[0]
    if (!profile) return fail(res, 'Mentor profile not found', 404)

    const statsResult = await query(
      `SELECT
         COUNT(*) FILTER (WHERE status='assigned')  AS assigned,
         COUNT(*) FILTER (WHERE status='active')    AS active,
         COUNT(*) FILTER (WHERE status='completed') AS completed
       FROM mentor_sessions WHERE mentor_user_id=$1`,
      [mentorId]
    )
    const stats = statsResult.rows[0] || { assigned: 0, active: 0, completed: 0 }

    ok(res, { profile, stats })
  } catch (err) {
    serverError(res, err, 'getMentorProfile')
  }
}
