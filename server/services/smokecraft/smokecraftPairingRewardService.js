/**
 * SmokeCraft Pairing Reward Service
 * Connects rewards to Module Build 4 pairing intelligence events.
 * Local intelligence recommendations earn engagement XP.
 * Provider-backed bonus requires providerConnected: true.
 * Allergy-blocked recommendations do not generate positive rewards.
 */

import { awardXP, awardLoyaltyPoints } from './smokecraftLoyaltyService.js'
import { createRewardAuditEntry, REWARD_AUDIT_EVENTS } from './smokecraftRewardAuditService.js'
import { XP_EVENTS, LOYALTY_POINTS_EVENTS } from '../../../src/modules/smokecraft/data/smokecraftLoyaltyContract.js'
import { REWARD_STATUSES, BLOCKED_REASONS } from '../../../src/modules/smokecraft/data/smokecraftRewardContract.js'

export async function evaluatePairingRewards(payload) {
  const {
    userId, venueId, sessionId, visitId,
    recommendationId = null,
    eventType,
    providerConnected = false,
    allergyBlock = false,
    flavorMemoryPresent = false,
    menuItemSelected = false,
    mentorGuided = false,
    profileUpdated = false,
  } = payload

  // Allergy-blocked recommendations never generate positive rewards
  if (allergyBlock) {
    createRewardAuditEntry({
      userId, venueId,
      eventType: REWARD_AUDIT_EVENTS.BLOCKED,
      sourceEventType: eventType ?? 'pairing_reward',
      policyChecks: ['no_positive_reward_for_allergy_block'],
      blockedReason: BLOCKED_REASONS.ALLERGY_BLOCK,
    })
    return {
      awarded: false,
      blockedReason: BLOCKED_REASONS.ALLERGY_BLOCK,
      rewardStatus: REWARD_STATUSES.BLOCKED,
    }
  }

  const results = []

  // Engagement XP for recommendation generated (local or provider)
  if (eventType === 'recommendation_generated' || eventType === 'pairing_recommendation') {
    const recXP = await awardXP({
      userId, venueId, sessionId, visitId,
      eventType: XP_EVENTS.PAIRING_RECOMMENDATION.event,
      sourceEventId: recommendationId ? `rec-${recommendationId}` : `${sessionId}-pairing`,
    })
    results.push({ event: 'pairing_recommendation_xp', ...recXP })
  }

  // Flavor Memory captured
  if (flavorMemoryPresent && eventType === 'flavor_memory_captured') {
    const fmXP = await awardXP({
      userId, venueId, sessionId, visitId,
      eventType: XP_EVENTS.FLAVOR_MEMORY_CAPTURED.event,
      sourceEventId: `${sessionId}-fm-pairing`,
    })
    results.push({ event: 'flavor_memory_reward', ...fmXP })
  }

  // Menu item selected from pairing
  if (menuItemSelected) {
    const menuPoints = await awardLoyaltyPoints({
      userId, venueId, sessionId, visitId,
      eventType: LOYALTY_POINTS_EVENTS.MENU_ITEM_SELECTED.event,
      sourceEventId: recommendationId ? `menu-${recommendationId}` : `${sessionId}-menu-select`,
    })
    results.push({ event: 'menu_pairing_selected', ...menuPoints })

    // Pairing accepted in order XP
    const acceptedXP = await awardXP({
      userId, venueId, sessionId, visitId,
      eventType: XP_EVENTS.PAIRING_ACCEPTED_IN_ORDER.event,
      sourceEventId: recommendationId ? `order-rec-${recommendationId}` : `${sessionId}-pairing-order`,
    })
    results.push({ event: 'pairing_accepted_in_order', ...acceptedXP })
  }

  // Mentor-guided pairing bonus
  if (mentorGuided) {
    const mentorXP = await awardXP({
      userId, venueId, sessionId, visitId,
      eventType: XP_EVENTS.MENTOR_GUIDED_PAIRING.event,
      sourceEventId: `${sessionId}-mentor-pairing`,
    })
    results.push({ event: 'mentor_guided_pairing', ...mentorXP })
  }

  // Pairing engagement points
  if (results.length > 0) {
    const engPoints = await awardLoyaltyPoints({
      userId, venueId, sessionId, visitId,
      eventType: LOYALTY_POINTS_EVENTS.PAIRING_ENGAGEMENT.event,
      sourceEventId: `${sessionId}-pairing-eng`,
    })
    results.push({ event: 'pairing_engagement_points', ...engPoints })
  }

  // Live provider bonus — requires providerConnected
  if (providerConnected) {
    // Future: award provider-backed bonus here
    results.push({ event: 'provider_bonus_eligible', providerConnected: true, note: 'Provider bonus reserved for future use.' })
  }

  createRewardAuditEntry({
    userId, venueId,
    eventType: REWARD_AUDIT_EVENTS.EVALUATED,
    sourceEventType: eventType ?? 'pairing_reward',
    policyChecks: ['no_live_provider_bonus_without_provider_connection'],
    xpAwarded: results.filter(r => r.awarded && r.xpAwarded).reduce((s, r) => s + r.xpAwarded, 0),
  })

  return {
    pairingRewards: results,
    recommendationId,
    providerConnected,
    totalXPFromPairing: results.filter(r => r.awarded && r.xpAwarded).reduce((s, r) => s + r.xpAwarded, 0),
    totalPointsFromPairing: results.filter(r => r.awarded && r.loyaltyPointsAwarded).reduce((s, r) => s + r.loyaltyPointsAwarded, 0),
  }
}
