/**
 * pos360GuestEventContracts.js — Phase B.8 event contracts for Customer, Loyalty & Guest Intelligence
 */

export const GUEST_EVENTS = {
  // Customer lifecycle
  CUSTOMER_CREATED:             'guest.customer.created',
  CUSTOMER_UPDATED:             'guest.customer.updated',
  CUSTOMER_MERGED:              'guest.customer.merged',
  CUSTOMER_PRIVACY_EXPORT:      'guest.customer.privacy_export',
  CUSTOMER_PRIVACY_DELETE:      'guest.customer.privacy_delete',

  // Identity
  IDENTITY_ADDED:               'guest.identity.added',
  IDENTITY_VERIFIED:            'guest.identity.verified',
  IDENTITY_REMOVED:             'guest.identity.removed',

  // Guest profile
  GUEST_PROFILE_CREATED:        'guest.profile.created',
  GUEST_PROFILE_UPDATED:        'guest.profile.updated',
  GUEST_VISIT_RECORDED:         'guest.visit.recorded',
  GUEST_ALLERGY_NOTED:          'guest.allergy.noted',

  // Consent
  CONSENT_GRANTED:              'guest.consent.granted',
  CONSENT_REVOKED:              'guest.consent.revoked',

  // Notes
  NOTE_ADDED:                   'guest.note.added',

  // Preferences
  LANGUAGE_PREFERENCE_SET:      'guest.preference.language_set',
  COMMUNICATION_PREFERENCE_SET: 'guest.preference.communication_set',

  // Duplicate / merge
  DUPLICATE_FLAGGED:            'guest.duplicate.flagged',
  MERGE_REQUESTED:              'guest.merge.requested',
  MERGE_APPROVED:               'guest.merge.approved',
  MERGE_REJECTED:               'guest.merge.rejected',

  // Loyalty
  LOYALTY_ENROLLED:             'guest.loyalty.enrolled',
  LOYALTY_POINTS_EARNED:        'guest.loyalty.points_earned',
  LOYALTY_POINTS_REDEEMED:      'guest.loyalty.points_redeemed',
  LOYALTY_POINTS_EXPIRED:       'guest.loyalty.points_expired',
  LOYALTY_TIER_UPGRADED:        'guest.loyalty.tier_upgraded',
  LOYALTY_TIER_DOWNGRADED:      'guest.loyalty.tier_downgraded',
  LOYALTY_ADJUSTMENT_REQUESTED: 'guest.loyalty.adjustment_requested',
  LOYALTY_ADJUSTMENT_APPROVED:  'guest.loyalty.adjustment_approved',
  LOYALTY_ADJUSTMENT_REJECTED:  'guest.loyalty.adjustment_rejected',
  LOYALTY_FRAUD_FLAGGED:        'guest.loyalty.fraud_flagged',

  // Rewards
  REWARD_REDEEMED:              'guest.reward.redeemed',
  REWARD_REVERSAL_REQUESTED:    'guest.reward.reversal_requested',
  REWARD_REVERSAL_APPROVED:     'guest.reward.reversal_approved',
  REWARD_REVERSAL_REJECTED:     'guest.reward.reversal_rejected',

  // Service recovery
  SERVICE_RECOVERY_TRIGGERED:   'guest.service_recovery.triggered',
  SERVICE_RECOVERY_RESOLVED:    'guest.service_recovery.resolved',

  // E.A.T. hooks
  EAT_INSIGHT_RECORDED:         'guest.eat.insight_recorded',
  EAT_VIP_ALERT:                'guest.eat.vip_alert',
  EAT_CHURN_RISK_ALERT:         'guest.eat.churn_risk_alert',
  EAT_UPSELL_SIGNAL:            'guest.eat.upsell_signal',

  // SmokeCraft link
  SMOKECRAFT_LINKED:            'guest.smokecraft.linked',
  SMOKECRAFT_UNLINKED:          'guest.smokecraft.unlinked',

  // Offline
  GUEST_ACTION_QUEUED_OFFLINE:  'guest.offline.action_queued',
  GUEST_ACTION_REPLAYED:        'guest.offline.action_replayed',
}

export const IDENTITY_TYPES = {
  PHONE:            'phone',
  EMAIL:            'email',
  QR_CODE:          'qr',
  BARCODE:          'barcode',
  MEMBERSHIP:       'membership',
  ANONYMOUS_TOKEN:  'anonymous_token',
}

export const CONSENT_TYPES = {
  MARKETING_EMAIL:  'marketing_email',
  MARKETING_SMS:    'marketing_sms',
  DATA_PROFILING:   'data_profiling',
  BIRTHDAY_OFFERS:  'birthday_offers',
  REFERRAL_PROGRAM: 'referral_program',
  ANALYTICS:        'analytics',
}

export const LOYALTY_TRANSACTION_TYPES = {
  EARN:     'earn',
  REDEEM:   'redeem',
  ADJUST:   'adjust',
  EXPIRE:   'expire',
  REVERSE:  'reverse',
  BONUS:    'bonus',
}

export const REWARD_TYPES = {
  DISCOUNT:         'discount',
  FREE_ITEM:        'free_item',
  UPGRADE:          'upgrade',
  EXPERIENCE:       'experience',
  BIRTHDAY:         'birthday',
  REFERRAL:         'referral',
  SERVICE_RECOVERY: 'service_recovery',
}

export const EAT_INSIGHT_TYPES = {
  VALUE_SCORE:          'value_score',
  CHURN_RISK:           'churn_risk',
  VIP_ALERT:            'vip_alert',
  REWARD_RECOMMENDATION:'reward_recommendation',
  UPSELL:               'upsell',
  SERVICE_RECOVERY:     'service_recovery',
  SEGMENTATION:         'segmentation',
}

export const SUPPORTED_LANGUAGES = ['en-US', 'es-DO', 'es', 'ht', 'de', 'pt']

export const DEFAULT_LOYALTY_TIER_NAMES = ['Standard', 'Member', 'VIP', 'Elite', 'Founders', 'Custom']

export const MANAGER_REQUIRED_ACTIONS = [
  'points_adjustment',
  'reward_reversal',
  'customer_merge',
  'fraud_flag',
  'privacy_delete',
]
