/**
 * Leaderboard Service — local prototype leaderboard for NOVEE OS.
 * Score is derived from session activity; no remote API is used.
 */

const LOCAL_LB_KEY = 'novee_leaderboard'

// Demo roster that pre-populates the board
const DEMO_PLAYERS = [
  { displayName: 'The Maestro',    score: 980, rank: 'Aficionado' },
  { displayName: 'Don Fuentes',    score: 870, rank: 'Connoisseur' },
  { displayName: 'La Capa',        score: 790, rank: 'Connoisseur' },
  { displayName: 'El Habano',      score: 720, rank: 'Enthusiast' },
  { displayName: 'The Curator',    score: 650, rank: 'Enthusiast' },
  { displayName: 'Lounge Scholar', score: 510, rank: 'Enthusiast' },
  { displayName: 'The Initiate',   score: 380, rank: 'Novice' },
]

/**
 * Pure function — calculates a leaderboard score from any session object.
 * Does NOT read localStorage; accepts the session as a parameter.
 */
export function calculateScore(session) {
  let score = 0
  score += (session.xp || 0)
  score += (session.completedSteps?.length || 0) * 20
  const stamps = (session.passport?.earnedStamps || []).length
              || (session.smokecraftStamps || []).length
  score += stamps * 50
  if (session.goldenBox?.progress > 0 || session.goldenBoxProgress) score += 100
  if (session.profileComplete)   score += 50
  if (session.selectedMentor)    score += 30
  if (session.selectedLevel && session.selectedLevel !== 'Novice') score += 25
  if (session.smokeCraft?.pairingSelections?.length > 0) score += 40
  return Math.round(score)
}

/** Returns the rank label for a given score. */
export function getRankLabel(score) {
  if (score >= 750) return 'Aficionado'
  if (score >= 500) return 'Connoisseur'
  if (score >= 250) return 'Enthusiast'
  return 'Novice'
}

/**
 * Returns `{ score, rank }` for a session.
 * Pure function; no localStorage access.
 */
export function updateRank(session) {
  const score = calculateScore(session)
  return { score, rank: getRankLabel(score) }
}

/**
 * Persists a score to the local leaderboard.
 * Creates or updates the entry for displayName.
 * Returns the full sorted leaderboard.
 */
export function submitScore(displayName, score) {
  try {
    const raw   = localStorage.getItem(LOCAL_LB_KEY)
    const board = raw ? JSON.parse(raw) : []
    const idx   = board.findIndex(e => e.displayName === displayName)
    if (idx >= 0) {
      board[idx] = { ...board[idx], score: Math.max(board[idx].score, score), updatedAt: Date.now() }
    } else {
      board.push({ displayName, score, rank: getRankLabel(score), submittedAt: Date.now() })
    }
    localStorage.setItem(LOCAL_LB_KEY, JSON.stringify(board))
    return getLocalLeaderboard()
  } catch {
    return DEMO_PLAYERS.map((p, i) => ({ ...p, position: i + 1 }))
  }
}

/**
 * Returns the full sorted leaderboard merging demo players + local entries.
 * Each entry includes `position`.
 */
export function getLocalLeaderboard() {
  try {
    const raw   = localStorage.getItem(LOCAL_LB_KEY)
    const local = raw ? JSON.parse(raw) : []
    const all   = [...DEMO_PLAYERS]
    for (const entry of local) {
      const exists = all.findIndex(p => p.displayName === entry.displayName)
      if (exists >= 0) {
        all[exists] = { ...all[exists], score: Math.max(all[exists].score, entry.score) }
      } else {
        all.push(entry)
      }
    }
    return all
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map((e, i) => ({ ...e, rank: getRankLabel(e.score), position: i + 1 }))
  } catch {
    return DEMO_PLAYERS.map((p, i) => ({ ...p, position: i + 1 }))
  }
}

/** Wipes the local (non-demo) leaderboard entries. Useful for demo resets. */
export function resetLeaderboardForDemo() {
  try { localStorage.removeItem(LOCAL_LB_KEY) } catch { /* ignore */ }
}
