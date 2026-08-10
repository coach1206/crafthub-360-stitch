/**
 * SmokeCraft Loyalty Contract
 * Defines loyalty tiers, XP thresholds, and progression rules.
 * All POS-verified rewards require POS360 confirmation.
 * Passport Stamp and Connections rules are governed by existing journey lock rules.
 */

export const LOYALTY_TIERS = {
  EMBER:    { tier: 'ember',   minXP: 0,    maxXP: 499,  label: 'Ember',    color: 'gray' },
  SPARK:    { tier: 'spark',   minXP: 500,  maxXP: 1499, label: 'Spark',    color: 'amber' },
  FLAME:    { tier: 'flame',   minXP: 1500, maxXP: 2999, label: 'Flame',    color: 'orange' },
  TORCH:    { tier: 'torch',   minXP: 3000, maxXP: 5999, label: 'Torch',    color: 'red' },
  INFERNO:  { tier: 'inferno', minXP: 6000, maxXP: null, label: 'Inferno',  color: 'gold' },
}

export const XP_EVENTS = {
  VISIT_STARTED:              { event: 'visit_started',              xp: 25,  posRequired: false },
  SESSION_COMPLETED:          { event: 'session_completed',          xp: 50,  posRequired: false },
  SCORECARD_SUBMITTED:        { event: 'scorecard_submitted',        xp: 75,  posRequired: false },
  FLAVOR_MEMORY_CAPTURED:     { event: 'flavor_memory_captured',     xp: 40,  posRequired: false },
  PAIRING_RECOMMENDATION:     { event: 'pairing_recommendation',     xp: 20,  posRequired: false },
  PAIRING_ACCEPTED_IN_ORDER:  { event: 'pairing_accepted_in_order',  xp: 30,  posRequired: false },
  CUSTOMER_SELF_ORDER:        { event: 'customer_self_order',        xp: 15,  posRequired: false },
  STAFF_ASSISTED_ORDER:       { event: 'staff_assisted_order',       xp: 20,  posRequired: false },
  ORDER_COMPLETED:            { event: 'order_completed',            xp: 50,  posRequired: true  }, // POS required
  MENTOR_GUIDED_PAIRING:      { event: 'mentor_guided_pairing',      xp: 25,  posRequired: false },
  PASSPORT_STAMP_EARNED:      { event: 'passport_stamp_earned',      xp: 200, posRequired: false },
  EXPERIENCE_COMPLETED:       { event: 'experience_completed',       xp: 500, posRequired: false },
  VISIT_BADGE_EARNED:         { event: 'visit_badge_earned',         xp: 100, posRequired: false },
}

export const LOYALTY_POINTS_EVENTS = {
  VERIFIED_ORDER_SPEND:       { event: 'verified_order_spend',       multiplier: 1,   posRequired: true  },
  STAFF_ASSISTED_ENGAGEMENT:  { event: 'staff_assisted_engagement',  points: 10,      posRequired: false },
  PAIRING_ENGAGEMENT:         { event: 'pairing_engagement',         points: 5,       posRequired: false },
  MENU_ITEM_SELECTED:         { event: 'menu_item_selected',         points: 8,       posRequired: false },
  SCORECARD_QUALITY:          { event: 'scorecard_quality',          points: 15,      posRequired: false },
  VISIT_COMPLETE:             { event: 'visit_complete',             points: 50,      posRequired: false },
}

export function getTierForXP(totalXP) {
  for (const [key, tier] of Object.entries(LOYALTY_TIERS)) {
    if (totalXP >= tier.minXP && (tier.maxXP === null || totalXP <= tier.maxXP)) {
      return tier
    }
  }
  return LOYALTY_TIERS.EMBER
}

export function getXPForEvent(eventType) {
  const def = Object.values(XP_EVENTS).find(e => e.event === eventType)
  return def ?? null
}

export const LOYALTY_CONTRACT_VERSION = '0.1.0'
