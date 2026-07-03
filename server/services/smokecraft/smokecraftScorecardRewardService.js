/**
 * SmokeCraft Scorecard Reward Service
 * Awards rewards from scorecard completion.
 * Missing scorecard blocks required rewards — never awarded without it.
 */

import { awardXP, awardLoyaltyPoints } from './smokecraftLoyaltyService.js'
import { createRewardAuditEntry, REWARD_AUDIT_EVENTS } from './smokecraftRewardAuditService.js'
import { XP_EVENTS, LOYALTY_POINTS_EVENTS } from '../../../src/modules/smokecraft/data/smokecraftLoyaltyContract.js'
import { REWARD_STATUSES, BLOCKED_REASONS } from '../../../src/modules/smokecraft/data/smokecraftRewardContract.js'

export async function evaluateScorecardRewards(payload) {
  const {
    userId, venueId, sessionId, visitId,
    scorecardId,
    scorecardPresent = false,
    flavorMemoryPresent = false,
    pairingParticipated = false,
    orderingParticipated = false,
    mentorConsistent = false,
    reflectionQuality = null,
    flavorAccuracy = null,
  } = payload

  if (!scorecardPresent) {
    createRewardAuditEntry({
      userId, venueId,
      eventType: REWARD_AUDIT_EVENTS.BLOCKED,
      sourceEventType: 'scorecard_reward',
      policyChecks: ['no_reward_for_missing_scorecard_when_required'],
      blockedReason: BLOCKED_REASONS.SCORECARD_MISSING,
      xpAwarded: 0,
    })
    return {
      awarded: false,
      rewardStatus: REWARD_STATUSES.BLOCKED,
      blockedReason: BLOCKED_REASONS.SCORECARD_MISSING,
      message: 'Scorecard required for this reward. No scorecard found.',
    }
  }

  const results = []

  // Base scorecard XP
  const baseXP = await awardXP({
    userId, venueId, sessionId, visitId,
    eventType: XP_EVENTS.SCORECARD_SUBMITTED.event,
    sourceEventId: scorecardId ?? `${sessionId}-scorecard`,
  })
  results.push({ event: 'scorecard_base', ...baseXP })

  // Pairing participation bonus
  if (pairingParticipated) {
    const pairingPoints = await awardLoyaltyPoints({
      userId, venueId, sessionId, visitId,
      eventType: LOYALTY_POINTS_EVENTS.SCORECARD_QUALITY.event,
      sourceEventId: `${scorecardId}-pairing-bonus`,
    })
    results.push({ event: 'pairing_participation', ...pairingPoints })
  }

  // Visit completion loyalty points
  const visitPoints = await awardLoyaltyPoints({
    userId, venueId, sessionId, visitId,
    eventType: LOYALTY_POINTS_EVENTS.VISIT_COMPLETE.event,
    sourceEventId: `${visitId}-visit-complete`,
  })
  results.push({ event: 'visit_complete', ...visitPoints })

  const totalXP = results.filter(r => r.awarded && r.xpAwarded).reduce((s, r) => s + r.xpAwarded, 0)
  const totalPoints = results.filter(r => r.awarded && r.loyaltyPointsAwarded).reduce((s, r) => s + r.loyaltyPointsAwarded, 0)

  createRewardAuditEntry({
    userId, venueId,
    eventType: REWARD_AUDIT_EVENTS.AWARDED,
    sourceEventType: 'scorecard_reward',
    policyChecks: ['no_reward_for_missing_scorecard_when_required'],
    xpAwarded: totalXP,
    loyaltyPointsAwarded: totalPoints,
  })

  return {
    awarded: true,
    scorecardRewards: results,
    totalXPFromScorecard: totalXP,
    totalLoyaltyPointsFromScorecard: totalPoints,
  }
}
