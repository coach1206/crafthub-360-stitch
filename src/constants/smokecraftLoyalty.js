/**
 * SmokeCraft Scoring + Loyalty Points Engine — rule constants.
 *
 * Four independent scoring categories. Never merge them:
 *   journeyXP      — progression, badges, rank, Passport unlocks
 *   skillScore     — knowledge, tasting accuracy, pairing intelligence
 *   challengeScore — competitions, leaderboards, event winners
 *   loyaltyPoints  — purchases, visits, Passport stamps, venue engagement
 */

// ── Action type identifiers ────────────────────────────────────────────────────
export const LOYALTY_ACTIONS = {
  // Purchase actions
  HOUSE_CIGAR_PURCHASE:       'house-cigar-purchase',
  FEATURED_CIGAR_PURCHASE:    'featured-cigar-purchase',
  RECOMMENDED_HUMIDOR_MATCH:  'recommended-humidor-match',
  LIQUOR_PAIRING_PURCHASE:    'liquor-pairing-purchase',
  FOOD_PAIRING_PURCHASE:      'food-pairing-purchase',
  CIGAR_LIQUOR_PAIRING:       'cigar-liquor-pairing',
  CIGAR_FOOD_PAIRING:         'cigar-food-pairing',
  CIGAR_LIQUOR_FOOD_PAIRING:  'cigar-liquor-food-pairing',
  // Journey actions
  PASSPORT_STAMP:             'passport-stamp',
  VISIT_COMPLETED:            'visit-completed',
  RETURN_VISIT:               'return-visit',
  EVENT_PARTICIPATION:        'event-participation',
  CHALLENGE_ENTRY:            'challenge-entry',
  REFERRAL_CHECKIN:           'referral-checkin',
  PASSPORT_CONNECTIONS:       'passport-connections',
  VIP_CANDIDATE:              'vip-candidate',
}

// ── Loyalty point values per action ──────────────────────────────────────────
export const LOYALTY_POINT_RULES = {
  [LOYALTY_ACTIONS.HOUSE_CIGAR_PURCHASE]:      100,
  [LOYALTY_ACTIONS.FEATURED_CIGAR_PURCHASE]:    75,
  [LOYALTY_ACTIONS.RECOMMENDED_HUMIDOR_MATCH]:  60,
  [LOYALTY_ACTIONS.LIQUOR_PAIRING_PURCHASE]:    50,
  [LOYALTY_ACTIONS.FOOD_PAIRING_PURCHASE]:      40,
  [LOYALTY_ACTIONS.CIGAR_LIQUOR_PAIRING]:      125,
  [LOYALTY_ACTIONS.CIGAR_FOOD_PAIRING]:        110,
  [LOYALTY_ACTIONS.CIGAR_LIQUOR_FOOD_PAIRING]: 175,
  [LOYALTY_ACTIONS.PASSPORT_STAMP]:            150,
  [LOYALTY_ACTIONS.VISIT_COMPLETED]:            50,
  [LOYALTY_ACTIONS.RETURN_VISIT]:               75,
  [LOYALTY_ACTIONS.EVENT_PARTICIPATION]:       100,
  [LOYALTY_ACTIONS.CHALLENGE_ENTRY]:            75,
  [LOYALTY_ACTIONS.REFERRAL_CHECKIN]:          150,
  [LOYALTY_ACTIONS.PASSPORT_CONNECTIONS]:      200,
  [LOYALTY_ACTIONS.VIP_CANDIDATE]:             250,
}

// Subset of purchase-type actions (for dedup tracking and pairing detection)
export const PURCHASE_POINT_RULES = {
  [LOYALTY_ACTIONS.HOUSE_CIGAR_PURCHASE]:      LOYALTY_POINT_RULES[LOYALTY_ACTIONS.HOUSE_CIGAR_PURCHASE],
  [LOYALTY_ACTIONS.FEATURED_CIGAR_PURCHASE]:   LOYALTY_POINT_RULES[LOYALTY_ACTIONS.FEATURED_CIGAR_PURCHASE],
  [LOYALTY_ACTIONS.RECOMMENDED_HUMIDOR_MATCH]: LOYALTY_POINT_RULES[LOYALTY_ACTIONS.RECOMMENDED_HUMIDOR_MATCH],
  [LOYALTY_ACTIONS.LIQUOR_PAIRING_PURCHASE]:   LOYALTY_POINT_RULES[LOYALTY_ACTIONS.LIQUOR_PAIRING_PURCHASE],
  [LOYALTY_ACTIONS.FOOD_PAIRING_PURCHASE]:     LOYALTY_POINT_RULES[LOYALTY_ACTIONS.FOOD_PAIRING_PURCHASE],
  [LOYALTY_ACTIONS.CIGAR_LIQUOR_PAIRING]:      LOYALTY_POINT_RULES[LOYALTY_ACTIONS.CIGAR_LIQUOR_PAIRING],
  [LOYALTY_ACTIONS.CIGAR_FOOD_PAIRING]:        LOYALTY_POINT_RULES[LOYALTY_ACTIONS.CIGAR_FOOD_PAIRING],
  [LOYALTY_ACTIONS.CIGAR_LIQUOR_FOOD_PAIRING]: LOYALTY_POINT_RULES[LOYALTY_ACTIONS.CIGAR_LIQUOR_FOOD_PAIRING],
}

// ── Passport session point rules ──────────────────────────────────────────────
// requiresCompleted: sessions that must already be in completedSteps for lock check.
export const PASSPORT_POINT_RULES = {
  'passport-stamp': {
    loyaltyPoints:     150,
    requiresCompleted: ['final-review'],
    stampDelta:        1,
  },
  'connections': {
    loyaltyPoints:     200,
    requiresCompleted: ['passport-stamp'],
    stampDelta:        0,
  },
  'management-sync': {
    loyaltyPoints:       250,
    requiresCompleted:   ['connections'],
    vipThresholdRequired: true,
    stampDelta:          0,
  },
}

// ── House promo bonus rules ───────────────────────────────────────────────────
export const PROMO_BONUS_RULES = {
  HOUSE_CIGAR_ON_TIME:       100,   // house cigar purchased during recommended visit
  HOUSE_CIGAR_CORRECT_MATCH:  25,   // also the correct humidor match (+challenge bonus)
  LIQUOR_PAIRING_MATCH:       50,   // recommended liquor pairing purchased
  LIQUOR_PAIRING_EXPERT:      25,   // matches expert flavor profile (+skill bonus)
  FOOD_PAIRING_MATCH:         40,   // recommended food pairing purchased
  FOOD_PAIRING_EXPERT:        20,   // matches expert flavor profile (+skill bonus)
  FULL_HOUSE_PAIRING:        175,   // house cigar + recommended liquor + food
  FULL_HOUSE_PAIRING_MASTERY: 50,   // full pairing mastery bonus
}

// ── VIP candidate logic ───────────────────────────────────────────────────────
export const VIP_THRESHOLD_RULES = {
  minCriteriaMet: 3,
  criteria: [
    {
      key:   'passportCompleted',
      label: 'SmokeCraft Passport completed',
      check: s => Boolean(s.completedSteps?.includes('passport-stamp')),
    },
    {
      key:   'loyaltyPoints1000',
      label: '1000+ loyalty points',
      check: s => (s.loyaltyPoints ?? 0) >= 1000,
    },
    {
      key:   'journeyXP900',
      label: '900+ journey XP',
      check: s => (s.xp ?? 0) >= 900,
    },
    {
      key:   'skillScore500',
      label: '500+ skill score',
      check: s => (s.skillScore ?? 0) >= 500,
    },
    {
      key:   'passportStamps2',
      label: '2+ Passport stamps',
      check: s => (s.passportStampCount ?? 0) >= 2,
    },
    {
      key:   'venueVisits3',
      label: '3+ venue visits',
      check: s => (s.completedVisits?.length ?? 0) >= 3,
    },
    {
      key:   'pairingPurchases2',
      label: '2+ pairing purchases',
      check: s => (s.pairingPurchases ?? 0) >= 2,
    },
    {
      key:   'referral1',
      label: '1+ referral',
      check: s => (s.referralCount ?? 0) >= 1,
    },
    {
      key:   'eventParticipation1',
      label: '1+ event participation',
      check: s => (s.eventParticipationCount ?? 0) >= 1,
    },
  ],
}

// ── Leaderboard weighting ─────────────────────────────────────────────────────
// Overall score = weighted sum — prevents spending from dominating skill.
export const LEADERBOARD_WEIGHTS = {
  overall: {
    challengeScore: 0.40,
    skillScore:     0.30,
    journeyXP:      0.20,
    loyaltyPoints:  0.10,
  },
}

// ── Answer / round scoring config ─────────────────────────────────────────────
export const SCORING_CONFIG = {
  baseCorrectScore: 100,
  confidenceMultipliers: { low: 0.8, medium: 1.0, high: 1.25 },
  difficultyMultipliers: { easy: 0.75, medium: 1.0, hard: 1.5 },

  // Wrong answers never touch journeyXP.
  // Overconfident wrong answers apply a small challengeScore penalty only.
  wrongAnswerChallengePenalty: -25,

  // Flavor note scoring
  exactFlavorMatchScore: 20,
  partialFlavorMatchScore: 10,
  perfectFlavorBonus: 50,

  // Pairing scoring
  exactPairingScore: 75,
  partialPairingScore: 35,
  perfectPairingBonus: 50,

  // Time bonus (for challenge rounds): up to 50 pts for fast completion
  maxTimeBonusPoints: 50,
}

// ── Pairing action set (for purchase classification) ─────────────────────────
export const PAIRING_PURCHASE_ACTIONS = new Set([
  LOYALTY_ACTIONS.LIQUOR_PAIRING_PURCHASE,
  LOYALTY_ACTIONS.FOOD_PAIRING_PURCHASE,
  LOYALTY_ACTIONS.CIGAR_LIQUOR_PAIRING,
  LOYALTY_ACTIONS.CIGAR_FOOD_PAIRING,
  LOYALTY_ACTIONS.CIGAR_LIQUOR_FOOD_PAIRING,
])

// ── Demo / local-preview display strings ─────────────────────────────────────
export const SCORING_MODE_LABELS = {
  demo:         'Demo preview only — scoring and loyalty points not saved.',
  localPreview: 'Local Preview Mode: scoring and loyalty points are stored on this device only.',
  live:         'SmokeCraft scoring active.',
}
