/**
 * SmokeCraft Order Reward Service
 * Connects rewards to Module Build 3 ordering events.
 * POS-verified spend rewards remain preview_only unless POS360 confirms.
 * Does not fake spend verification.
 */

import { awardXP, awardLoyaltyPoints } from './smokecraftLoyaltyService.js'
import { createRewardAuditEntry, REWARD_AUDIT_EVENTS } from './smokecraftRewardAuditService.js'
import { XP_EVENTS, LOYALTY_POINTS_EVENTS } from '../../../src/modules/smokecraft/data/smokecraftLoyaltyContract.js'
import { REWARD_STATUSES, BLOCKED_REASONS } from '../../../src/modules/smokecraft/data/smokecraftRewardContract.js'

export async function evaluateOrderRewards(payload) {
  const {
    userId, venueId, sessionId, visitId,
    orderId,
    orderMode,
    orderStatus,
    pairingRecommendations = [],
    posVerified = false,
    amount = null,
  } = payload

  const results = []

  // Engagement XP for customer self-order request
  if (orderMode === 'customer_self_order' && ['requested', 'accepted_by_staff', 'completed'].includes(orderStatus)) {
    const engXP = await awardXP({
      userId, venueId, sessionId, visitId,
      eventType: XP_EVENTS.CUSTOMER_SELF_ORDER.event,
      sourceEventId: `${orderId}-self-order`,
    })
    results.push({ event: 'customer_self_order_engagement', ...engXP })
  }

  // Engagement XP for staff-assisted order
  if (orderMode === 'staff_assisted_order') {
    const staffXP = await awardXP({
      userId, venueId, sessionId, visitId,
      eventType: XP_EVENTS.STAFF_ASSISTED_ORDER.event,
      sourceEventId: `${orderId}-staff-order`,
    })
    results.push({ event: 'staff_assisted_engagement', ...staffXP })

    const staffPoints = await awardLoyaltyPoints({
      userId, venueId, sessionId, visitId,
      eventType: LOYALTY_POINTS_EVENTS.STAFF_ASSISTED_ENGAGEMENT.event,
      sourceEventId: `${orderId}-staff-points`,
    })
    results.push({ event: 'staff_assisted_points', ...staffPoints })
  }

  // Pairing recommendation bonus
  for (const rec of pairingRecommendations) {
    if (rec.recommendationId) {
      const pairingPoints = await awardLoyaltyPoints({
        userId, venueId, sessionId, visitId,
        eventType: LOYALTY_POINTS_EVENTS.MENU_ITEM_SELECTED.event,
        sourceEventId: `${orderId}-pairing-${rec.recommendationId}`,
      })
      results.push({ event: 'pairing_accepted_in_order', recommendationId: rec.recommendationId, ...pairingPoints })
    }
  }

  // Verified order completion — requires POS360
  if (orderStatus === 'completed') {
    if (posVerified) {
      const completionXP = await awardXP({
        userId, venueId, sessionId, visitId,
        eventType: XP_EVENTS.ORDER_COMPLETED.event,
        sourceEventId: `${orderId}-completed`,
        posVerified: true,
      })
      results.push({ event: 'order_completed_verified', ...completionXP })

      if (amount) {
        const spendPoints = await awardLoyaltyPoints({
          userId, venueId, sessionId, visitId,
          eventType: LOYALTY_POINTS_EVENTS.VERIFIED_ORDER_SPEND.event,
          sourceEventId: `${orderId}-spend`,
          posVerified: true,
          amount,
        })
        results.push({ event: 'verified_spend_points', ...spendPoints })
      }
    } else {
      results.push({
        event: 'order_completed_unverified',
        awarded: false,
        reason: BLOCKED_REASONS.POS_NOT_VERIFIED,
        rewardStatus: REWARD_STATUSES.PREVIEW_ONLY,
        posVerified: false,
        message: 'Spend-based rewards are preview_only. POS360 not connected.',
      })
    }
  }

  createRewardAuditEntry({
    userId, venueId,
    eventType: REWARD_AUDIT_EVENTS.EVALUATED,
    sourceEventType: 'order_reward',
    policyChecks: ['no_pos_verified_reward_without_pos_confirmation'],
    xpAwarded: results.filter(r => r.awarded && r.xpAwarded).reduce((s, r) => s + r.xpAwarded, 0),
    loyaltyPointsAwarded: results.filter(r => r.awarded && r.loyaltyPointsAwarded).reduce((s, r) => s + r.loyaltyPointsAwarded, 0),
    posVerified,
  })

  return {
    orderId,
    orderRewards: results,
    posVerified,
    totalXPFromOrder: results.filter(r => r.awarded && r.xpAwarded).reduce((s, r) => s + r.xpAwarded, 0),
    totalLoyaltyPointsFromOrder: results.filter(r => r.awarded && r.loyaltyPointsAwarded).reduce((s, r) => s + r.loyaltyPointsAwarded, 0),
  }
}
