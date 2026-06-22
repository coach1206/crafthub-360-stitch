// Reads the real guest session only — never fabricates other players.
// A true multi-user leaderboard requires a backend or shared event store;
// until that exists, this reports the current guest's standing honestly
// and an explicit empty state for the community board.

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

export function getLeaderboardSnapshot(session) {
  return {
    currentPlayer: getCurrentPlayerSnapshot(session),
    communityEntries: [],
    communityStatus: 'empty',
    communityMessage: 'A shared venue leaderboard requires a backend or shared event store. Only your own session is shown until that exists.',
  }
}
