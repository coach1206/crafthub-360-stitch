// Holistic Fix 5A: a real, server-authoritative multi-guest leaderboard
// now exists (GET /api/smokecraft/player-state/leaderboard, derived
// from smokecraft_player_state — no mock/fabricated entries). This
// service still reads the real guest session for the current player's
// own standing (unchanged), and now also fetches the real community
// leaderboard instead of returning a hardcoded empty array.

import { getRankFromXP } from '../../constants/session.js'
import { calculateWinnerEligibility, getWinnerProgress } from './smokeWinnerService.js'

function sc(session) { return session?.smokeCraft || {} }

export function getCurrentPlayerSnapshot(session) {
  const xp = session?.xp || 0
  const rank = getRankFromXP(xp)
  const completedSteps = session?.completedSteps?.length || 0
  const winnerEligibility = calculateWinnerEligibility(session)
  const winnerProgress = getWinnerProgress(session)

  return {
    displayName: session?.profile?.nickname || session?.leaderboard?.displayName || 'You',
    xp,
    rank: rank.name,
    rankColor: rank.color,
    completedSteps,
    pairingScore: sc(session).pairingScore ?? null,
    uniquenessScore: sc(session).uniquenessScore ?? null,
    finalScore: (completedSteps * 50) + (sc(session).pairingScore || 0) + (sc(session).uniquenessScore || 0),
    earnedWinnerCategories: winnerEligibility.filter(c => c.earned).map(c => c.title),
    pendingWinnerCategories: winnerEligibility.filter(c => c.pending).map(c => c.title),
    lockedWinnerCategories: winnerEligibility.filter(c => c.locked).map(c => c.title),
    winnerProgress,
    challengeStatus: session?.completedSteps?.includes('session-complete') ? 'Session Complete' : 'In Progress',
  }
}

/**
 * Async — fetches the real server leaderboard. Callers must handle
 * loading/error states themselves (this never fabricates entries on
 * failure; it returns an honest 'error' or 'offline' communityStatus).
 */
export async function getLeaderboardSnapshot(session) {
  const currentPlayer = getCurrentPlayerSnapshot(session)
  try {
    const res = await fetch('/api/smokecraft/player-state/leaderboard?limit=20', { credentials: 'include' })
    if (!res.ok) return { currentPlayer, communityEntries: [], communityStatus: 'error', communityMessage: 'Leaderboard is temporarily unavailable.' }
    const data = await res.json()
    if (!data.success) return { currentPlayer, communityEntries: [], communityStatus: 'error', communityMessage: 'Leaderboard is temporarily unavailable.' }
    if (data.entries.length === 0) {
      return { currentPlayer, communityEntries: [], communityStatus: 'empty', communityMessage: 'No ranked guests yet — be the first to earn XP.' }
    }
    return {
      currentPlayer,
      communityEntries: data.entries,
      communityStatus: 'ready',
      communityMessage: `${data.entries.length} ranked guest${data.entries.length === 1 ? '' : 's'} shown.`,
    }
  } catch {
    return { currentPlayer, communityEntries: [], communityStatus: 'offline', communityMessage: "You're offline — shared rankings can't be loaded right now." }
  }
}
