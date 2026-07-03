/**
 * SmokeCraft Reward Contract
 * Canonical reward types, statuses, and shape definitions.
 * Honest status: all POS-verified rewards require POS360 confirmation.
 */

export const REWARD_TYPES = {
  XP:                         'xp',
  LOYALTY_POINTS:             'loyalty_points',
  PASSPORT_STAMP:             'passport_stamp',
  VISIT_BADGE:                'visit_badge',
  PAIRING_BADGE:              'pairing_badge',
  ORDER_BADGE:                'order_badge',
  SCORECARD_BADGE:            'scorecard_badge',
  VENUE_CREDIT_PREVIEW:       'venue_credit_preview',
  MEMBER_PERK_PREVIEW:        'member_perk_preview',
  STAFF_ASSISTED_BONUS:       'staff_assisted_bonus',
  EXPERIENCE_COMPLETION:      'experience_completion_reward',
}

export const REWARD_STATUSES = {
  PENDING:      'pending',
  ELIGIBLE:     'eligible',
  AWARDED:      'awarded',
  BLOCKED:      'blocked',
  REDEEMED:     'redeemed',
  EXPIRED:      'expired',
  REVOKED:      'revoked',
  PREVIEW_ONLY: 'preview_only',
  UNAVAILABLE:  'unavailable',
}

export const BLOCKED_REASONS = {
  INCOMPLETE_REQUIRED_STEPS:        'incomplete_required_steps',
  VISIT_NOT_COMPLETE:               'visit_not_complete',
  SESSION_NOT_COMPLETE:             'session_not_complete',
  SCORECARD_MISSING:                'scorecard_missing',
  FLAVOR_MEMORY_MISSING:            'flavor_memory_missing',
  MANAGEMENT_SYNC_REQUIRED:         'management_sync_required',
  VISIT_8_LOCKED:                   'visit_8_locked',
  CONNECTIONS_LOCKED:               'connections_locked',
  ONE_SESSION_SHORTCUT_BLOCKED:     'one_session_shortcut_blocked',
  DUPLICATE_REWARD:                 'duplicate_reward',
  POS_NOT_VERIFIED:                 'pos_not_verified',
  REDEMPTION_HANDLER_MISSING:       'redemption_handler_missing',
  POLICY_VIOLATION:                 'policy_violation',
  PROVIDER_NOT_CONNECTED:           'provider_not_connected',
  ALLERGY_BLOCK:                    'allergy_block',
  EARLY_PASSPORT_STAMP:             'early_passport_stamp',
  EARLY_CONNECTIONS_UNLOCK:         'early_connections_unlock',
}

export function createRewardRecord(overrides = {}) {
  const now = new Date().toISOString()
  return {
    rewardId: null,
    userId: null,
    venueId: null,
    sessionId: null,
    visitId: null,
    sourceEventId: null,
    sourceEventType: null,
    rewardType: null,
    rewardStatus: REWARD_STATUSES.PENDING,
    rewardValue: 0,
    rewardCurrency: 'xp',
    xpAwarded: 0,
    passportStampEligible: false,
    passportStampAwarded: false,
    loyaltyPointsAwarded: 0,
    redemptionStatus: 'not_redeemed',
    redemptionMethod: null,
    posVerified: false,
    eatSynced: false,
    policyVersion: '1.0.0',
    persistenceMode: 'memory_fallback',
    productionReady: false,
    blockedReason: null,
    policyChecks: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

export const REWARD_CONTRACT_VERSION = '0.1.0'
