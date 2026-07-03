/**
 * SmokeCraft Loyalty Service
 * Accumulates XP and loyalty points from journey events.
 * Assigns tiers and tracks progression.
 */

import { createReward, getRewardsByUser } from './smokecraftRewardStore.js'
import { runPolicyChecks } from './smokecraftRewardPolicyService.js'
import { createRewardAuditEntry, REWARD_AUDIT_EVENTS } from './smokecraftRewardAuditService.js'
import {
  REWARD_TYPES, REWARD_STATUSES, BLOCKED_REASONS, createRewardRecord,
} from '../../../src/modules/smokecraft/data/smokecraftRewardContract.js'
import { getTierForXP, getXPForEvent, XP_EVENTS, LOYALTY_POINTS_EVENTS } from '../../../src/modules/smokecraft/data/smokecraftLoyaltyContract.js'

export async function awardXP({ userId, venueId, sessionId, visitId, eventType, sourceEventId, posVerified = false }) {
  const xpDef = getXPForEvent(eventType)
  if (!xpDef) return { awarded: false, reason: 'unknown_event_type' }

  // If POS required and not verified, block
  if (xpDef.posRequired && !posVerified) {
    const record = await createReward({
      userId, venueId, sessionId, visitId,
      rewardType: REWARD_TYPES.XP,
      rewardStatus: REWARD_STATUSES.PREVIEW_ONLY,
      sourceEventType: eventType,
      sourceEventId,
      xpAwarded: 0,
      posVerified: false,
      blockedReason: BLOCKED_REASONS.POS_NOT_VERIFIED,
      policyChecks: ['no_pos_verified_reward_without_pos_confirmation'],
    })
    createRewardAuditEntry({
      rewardId: record.rewardId, userId, venueId,
      eventType: REWARD_AUDIT_EVENTS.BLOCKED,
      sourceEventType: eventType,
      previousStatus: null, nextStatus: REWARD_STATUSES.PREVIEW_ONLY,
      policyChecks: ['no_pos_verified_reward_without_pos_confirmation'],
      blockedReason: BLOCKED_REASONS.POS_NOT_VERIFIED,
      xpAwarded: 0, posVerified: false,
    })
    return { awarded: false, reason: BLOCKED_REASONS.POS_NOT_VERIFIED, record }
  }

  const existingRewards = await getRewardsByUser(userId)
  const policyResult = runPolicyChecks({
    rewardType: REWARD_TYPES.XP,
    sourceEventId,
    sourceEventType: eventType,
  }, existingRewards)

  if (!policyResult.passed) {
    const record = await createReward({
      userId, venueId, sessionId, visitId,
      rewardType: REWARD_TYPES.XP,
      rewardStatus: REWARD_STATUSES.BLOCKED,
      sourceEventType: eventType,
      sourceEventId,
      xpAwarded: 0,
      blockedReason: policyResult.blockedReason,
      policyChecks: policyResult.checks,
    })
    createRewardAuditEntry({
      rewardId: record.rewardId, userId, venueId,
      eventType: REWARD_AUDIT_EVENTS.POLICY_BLOCKED,
      sourceEventType: eventType,
      previousStatus: null, nextStatus: REWARD_STATUSES.BLOCKED,
      policyChecks: policyResult.checks,
      blockedReason: policyResult.blockedReason,
      xpAwarded: 0,
    })
    return { awarded: false, reason: policyResult.blockedReason, record }
  }

  const record = await createReward({
    userId, venueId, sessionId, visitId,
    rewardType: REWARD_TYPES.XP,
    rewardStatus: REWARD_STATUSES.AWARDED,
    sourceEventType: eventType,
    sourceEventId,
    xpAwarded: xpDef.xp,
    rewardValue: xpDef.xp,
    rewardCurrency: 'xp',
    posVerified,
    policyChecks: policyResult.checks,
  })
  createRewardAuditEntry({
    rewardId: record.rewardId, userId, venueId,
    eventType: REWARD_AUDIT_EVENTS.AWARDED,
    sourceEventType: eventType,
    previousStatus: null, nextStatus: REWARD_STATUSES.AWARDED,
    policyChecks: policyResult.checks,
    xpAwarded: xpDef.xp,
    posVerified,
  })
  return { awarded: true, xpAwarded: xpDef.xp, record }
}

export async function awardLoyaltyPoints({ userId, venueId, sessionId, visitId, eventType, sourceEventId, posVerified = false, amount = null }) {
  const def = Object.values(LOYALTY_POINTS_EVENTS).find(e => e.event === eventType)
  if (!def) return { awarded: false, reason: 'unknown_event_type' }

  if (def.posRequired && !posVerified) {
    const record = await createReward({
      userId, venueId, sessionId, visitId,
      rewardType: REWARD_TYPES.LOYALTY_POINTS,
      rewardStatus: REWARD_STATUSES.PREVIEW_ONLY,
      sourceEventType: eventType, sourceEventId,
      loyaltyPointsAwarded: 0, posVerified: false,
      blockedReason: BLOCKED_REASONS.POS_NOT_VERIFIED,
      policyChecks: ['no_pos_verified_reward_without_pos_confirmation'],
    })
    createRewardAuditEntry({
      rewardId: record.rewardId, userId, venueId,
      eventType: REWARD_AUDIT_EVENTS.BLOCKED,
      sourceEventType: eventType,
      previousStatus: null, nextStatus: REWARD_STATUSES.PREVIEW_ONLY,
      blockedReason: BLOCKED_REASONS.POS_NOT_VERIFIED,
      loyaltyPointsAwarded: 0, posVerified: false,
    })
    return { awarded: false, reason: BLOCKED_REASONS.POS_NOT_VERIFIED, record }
  }

  const points = def.points ?? (def.multiplier && amount ? Math.floor(amount * def.multiplier) : 0)
  const record = await createReward({
    userId, venueId, sessionId, visitId,
    rewardType: REWARD_TYPES.LOYALTY_POINTS,
    rewardStatus: REWARD_STATUSES.AWARDED,
    sourceEventType: eventType, sourceEventId,
    loyaltyPointsAwarded: points,
    rewardValue: points,
    rewardCurrency: 'loyalty_points',
    posVerified,
  })
  createRewardAuditEntry({
    rewardId: record.rewardId, userId, venueId,
    eventType: REWARD_AUDIT_EVENTS.LOYALTY_AWARDED,
    sourceEventType: eventType,
    previousStatus: null, nextStatus: REWARD_STATUSES.AWARDED,
    loyaltyPointsAwarded: points, posVerified,
  })
  return { awarded: true, loyaltyPointsAwarded: points, record }
}

export async function getLoyaltySummary(userId) {
  const rewards = await getRewardsByUser(userId)
  const totalXP = rewards.filter(r => r.rewardStatus === REWARD_STATUSES.AWARDED && r.rewardCurrency === 'xp')
    .reduce((sum, r) => sum + (r.xpAwarded ?? 0), 0)
  const totalPoints = rewards.filter(r => r.rewardStatus === REWARD_STATUSES.AWARDED && r.rewardCurrency === 'loyalty_points')
    .reduce((sum, r) => sum + (r.loyaltyPointsAwarded ?? 0), 0)
  const tier = getTierForXP(totalXP)
  const stamps = rewards.filter(r => r.rewardType === REWARD_TYPES.PASSPORT_STAMP && r.passportStampAwarded)
  const badges = rewards.filter(r => r.rewardType?.endsWith('_badge') && r.rewardStatus === REWARD_STATUSES.AWARDED)

  return {
    userId,
    totalXP,
    totalLoyaltyPoints: totalPoints,
    tier,
    stampsEarned: stamps.length,
    badgesEarned: badges.length,
    rewardCount: rewards.length,
    persistenceMode: rewards[0]?.persistenceMode ?? 'memory_fallback',
    productionReady: rewards[0]?.productionReady ?? false,
  }
}
