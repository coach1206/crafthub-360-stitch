// Holistic Fix 5A: a real, server-authoritative multi-guest leaderboard
// now exists (GET /api/smokecraft/player-state/leaderboard, derived
// from smokecraft_player_state — no mock/fabricated entries). This
// service still reads the real guest session for the current player's
// own standing (unchanged), and now also fetches the real community
// leaderboard instead of returning a hardcoded empty array.
//
// Holistic Fix 5A-3H: getCurrentPlayerSnapshot's XP/rank was previously
// read only from the client-side GuestSessionContext mirror — a real
// found gap (the Leaderboard screen's own "You" row and rank strip
// never actually reflected the authoritative server total, only a local
// cache that could drift from it after a correction/reversal or a
// cross-device sync). getLeaderboardSnapshot now also fetches the real
// player-state record and prefers its xpTotal/rankLabel when available,
// falling back to the local snapshot only if the fetch fails (offline).

import { getRankFromXP } from '../../constants/session.js'
import { calculateWinnerEligibility, getWinnerProgress } from './smokeWinnerService.js'
import { fetchPlayerState } from './playerStateApiClient.js'

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
 * Async — fetches the real server leaderboard AND the real authoritative
 * player-state for the current guest/account (never trusts the local
 * GuestSessionContext mirror for the numbers actually displayed). Callers
 * must handle loading/error states themselves (this never fabricates
 * entries on failure; it returns an honest 'error' or 'offline'
 * communityStatus).
 */
export async function getLeaderboardSnapshot(session, { venueId, offset = 0, limit = 20 } = {}) {
  let currentPlayer = getCurrentPlayerSnapshot(session)
  const stateResult = await fetchPlayerState()
  if (stateResult.ok) {
    const rank = getRankFromXP(stateResult.state.xpTotal)
    currentPlayer = {
      ...currentPlayer,
      xp: stateResult.state.xpTotal,
      rank: rank.name,
      rankColor: rank.color,
      badgeCount: stateResult.state.awards.filter(a => a.type === 'badge').length,
      isServerAuthoritative: true,
    }
  }

  const qs = new URLSearchParams({ limit: String(limit), offset: String(offset) })
  if (venueId) qs.set('venueId', venueId)
  try {
    const res = await fetch(`/api/smokecraft/player-state/leaderboard?${qs.toString()}`, { credentials: 'include' })
    if (!res.ok) return { currentPlayer, communityEntries: [], communityStatus: 'error', communityMessage: 'Leaderboard is temporarily unavailable.', limit, offset }
    const data = await res.json()
    if (!data.success) return { currentPlayer, communityEntries: [], communityStatus: 'error', communityMessage: 'Leaderboard is temporarily unavailable.', limit, offset }
    if (data.entries.length === 0) {
      return { currentPlayer, communityEntries: [], communityStatus: 'empty', communityMessage: 'No ranked guests yet — be the first to earn XP.', limit, offset }
    }
    return {
      currentPlayer,
      communityEntries: data.entries,
      communityStatus: 'ready',
      communityMessage: `${data.entries.length} ranked guest${data.entries.length === 1 ? '' : 's'} shown.`,
      limit,
      offset,
    }
  } catch {
    return { currentPlayer, communityEntries: [], communityStatus: 'offline', communityMessage: "You're offline — shared rankings can't be loaded right now.", limit, offset }
  }
}
