/**
 * SmokeCraft Visit Progression Reward Service
 * Evaluates rewards from visit/session progression.
 * Does not create shortcut progressions or alter existing journey rules.
 */

import { awardXP, awardLoyaltyPoints } from './smokecraftLoyaltyService.js'
import { evaluatePassportStampEligibility } from './smokecraftPassportRewardService.js'
import { createRewardAuditEntry, REWARD_AUDIT_EVENTS } from './smokecraftRewardAuditService.js'
import { XP_EVENTS } from '../../../src/modules/smokecraft/data/smokecraftLoyaltyContract.js'
import { BLOCKED_REASONS } from '../../../src/modules/smokecraft/data/smokecraftRewardContract.js'

export async function evaluateVisitProgressionRewards(payload) {
  const {
    userId, venueId, sessionId, visitId,
    visitNumber,
    sessionsCompletedInVisit = 0,
    totalSessionsCompleted = 0,
    scorecardPresent = false,
    flavorMemoryPresent = false,
    managementSyncPresent = false,
    connectionsUnlocked = false,
  } = payload

  const results = []

  // Session completion XP
  if (sessionsCompletedInVisit >= 1) {
    const sessionXP = await awardXP({
      userId, venueId, sessionId, visitId,
      eventType: XP_EVENTS.SESSION_COMPLETED.event,
      sourceEventId: `${sessionId}-session-complete`,
    })
    results.push({ event: 'session_completed', ...sessionXP })
  }

  // Flavor Memory XP
  if (flavorMemoryPresent) {
    const fmXP = await awardXP({
      userId, venueId, sessionId, visitId,
      eventType: XP_EVENTS.FLAVOR_MEMORY_CAPTURED.event,
      sourceEventId: `${sessionId}-flavor-memory`,
    })
    results.push({ event: 'flavor_memory_captured', ...fmXP })
  }

  // Scorecard XP
  if (scorecardPresent) {
    const scoreXP = await awardXP({
      userId, venueId, sessionId, visitId,
      eventType: XP_EVENTS.SCORECARD_SUBMITTED.event,
      sourceEventId: `${sessionId}-scorecard`,
    })
    results.push({ event: 'scorecard_submitted', ...scoreXP })
  }

  // Passport stamp eligibility check
  const passportEligibility = evaluatePassportStampEligibility({
    userId, visitId, sessionId, visitNumber,
    scorecardPresent, flavorMemoryPresent,
    sessionsCompletedInVisit, totalSessionsCompleted,
    singleSessionOnly: totalSessionsCompleted < 2,
  })

  // Visit badge XP if visit progresses
  if (sessionsCompletedInVisit >= 2) {
    const visitBadgeXP = await awardXP({
      userId, venueId, sessionId, visitId,
      eventType: XP_EVENTS.VISIT_BADGE_EARNED.event,
      sourceEventId: `${visitId}-visit-badge`,
    })
    results.push({ event: 'visit_badge_earned', ...visitBadgeXP })
  }

  createRewardAuditEntry({
    userId, venueId,
    eventType: REWARD_AUDIT_EVENTS.EVALUATED,
    sourceEventType: 'visit_progression',
    policyChecks: ['no_full_visit_completion_from_single_session'],
    xpAwarded: results.filter(r => r.awarded).reduce((s, r) => s + (r.xpAwarded ?? 0), 0),
  })

  return {
    userId, visitId, sessionId,
    progressionRewards: results,
    passportStampEligibility: passportEligibility,
    totalXPFromProgression: results.filter(r => r.awarded).reduce((s, r) => s + (r.xpAwarded ?? 0), 0),
  }
}
