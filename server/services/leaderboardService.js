/**
 * Leaderboard Service (backend) — manages local leaderboard submissions.
 * Dual-mode: PostgreSQL when available, in-memory prototype otherwise.
 */

import { isDbAvailable, query } from '../db/connection.js'
import { log } from './auditService.js'

const entries = new Map()    // prototype fallback

function now() { return new Date().toISOString() }

function rankFromScore(score) {
  if (score >= 750) return 'Aficionado'
  if (score >= 500) return 'Connoisseur'
  if (score >= 250) return 'Enthusiast'
  return 'Novice'
}

/**
 * Upserts a leaderboard score for a session.
 */
export async function submitScore(sessionId, displayName, score) {
  if (!sessionId) throw new Error('sessionId required')
  const rank = rankFromScore(score || 0)

  if (isDbAvailable()) {
    try {
      const result = await query(
        `INSERT INTO leaderboard_entries (session_id, display_name, score, rank, submitted)
         VALUES ($1,$2,$3,$4,TRUE)
         ON CONFLICT (session_id) DO UPDATE SET
           display_name = EXCLUDED.display_name,
           score        = GREATEST(leaderboard_entries.score, EXCLUDED.score),
           rank         = EXCLUDED.rank,
           submitted    = TRUE,
           updated_at   = NOW()
         RETURNING *`,
        [sessionId, displayName || 'Lounge Guest', score || 0, rank]
      )
      await log('guest', sessionId, 'leaderboard.score.submitted', 'session', sessionId, { score, rank })
      return result.rows[0]
    } catch (err) {
      console.warn('[leaderboardService] DB submit failed:', err.message)
    }
  }

  const existing  = entries.get(sessionId)
  const newScore  = Math.max(score || 0, existing?.score || 0)
  const record    = { id: entries.size + 1, session_id: sessionId, display_name: displayName || 'Lounge Guest', score: newScore, rank: rankFromScore(newScore), submitted: true, created_at: now(), updated_at: now() }
  entries.set(sessionId, record)
  return record
}

/**
 * Returns the full sorted leaderboard, top 20.
 */
export async function getLeaderboard(limit = 20) {
  if (isDbAvailable()) {
    try {
      const result = await query(
        `SELECT * FROM leaderboard_entries
          WHERE submitted = TRUE
          ORDER BY score DESC
          LIMIT $1`,
        [limit]
      )
      return result.rows.map((r, i) => ({ ...r, position: i + 1 }))
    } catch (err) {
      console.warn('[leaderboardService] DB read failed:', err.message)
    }
  }

  const DEMO = [
    { session_id: 'demo-1', display_name: 'The Maestro',    score: 980, rank: 'Aficionado' },
    { session_id: 'demo-2', display_name: 'Don Fuentes',    score: 870, rank: 'Connoisseur' },
    { session_id: 'demo-3', display_name: 'La Capa',        score: 790, rank: 'Connoisseur' },
    { session_id: 'demo-4', display_name: 'El Habano',      score: 720, rank: 'Enthusiast' },
    { session_id: 'demo-5', display_name: 'The Curator',    score: 650, rank: 'Enthusiast' },
    { session_id: 'demo-6', display_name: 'Lounge Scholar', score: 510, rank: 'Enthusiast' },
    { session_id: 'demo-7', display_name: 'The Initiate',   score: 380, rank: 'Novice' },
  ]
  const local  = [...entries.values()]
  const all    = [...DEMO, ...local]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
  return all.map((e, i) => ({ ...e, position: i + 1 }))
}

/**
 * Returns the leaderboard score for a specific session.
 */
export async function getSessionScore(sessionId) {
  if (isDbAvailable()) {
    try {
      const result = await query(
        'SELECT * FROM leaderboard_entries WHERE session_id = $1',
        [sessionId]
      )
      return result.rows[0] || null
    } catch (err) {
      console.warn('[leaderboardService] Session score read failed:', err.message)
    }
  }
  return entries.get(sessionId) || null
}
