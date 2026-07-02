/**
 * NCIE Passport Mastery Rules
 * Defines XP awards, level thresholds, and mastery progression for Craft Passport.
 * IMPORTANT: These rules must not break SmokeCraft Passport lock rules.
 * SmokeCraft Passport stamps remain locked by visit count, session count, and
 * explicit unlock gates defined in src/constants/session.js. These rules add
 * XP metadata but do NOT override, replace, or bypass those lock rules.
 */

export const XP_AWARD_TYPES = {
  LESSON_COMPLETED:     'xp_lesson_completed',
  MENTOR_SESSION:       'xp_mentor_session',
  DECISION_MADE:        'xp_decision_made',
  PAIRING_EXPLORED:     'xp_pairing_explored',
  PASSPORT_STAMP:       'xp_passport_stamp',
  FIRST_VISIT:          'xp_first_visit',
  REPEAT_VISIT:         'xp_repeat_visit',
  CERTIFICATION_EARNED: 'xp_certification_earned',
  CROSS_CRAFT:          'xp_cross_craft',
  DAILY_LOGIN:          'xp_daily_login',
}

export const XP_AWARD_VALUES = {
  xp_lesson_completed:    25,
  xp_mentor_session:      15,
  xp_decision_made:       10,
  xp_pairing_explored:    20,
  xp_passport_stamp:      50,
  xp_first_visit:         100,
  xp_repeat_visit:        25,
  xp_certification_earned: 500,
  xp_cross_craft:         30,
  xp_daily_login:         5,
}

export const CRAFT_XP_THRESHOLDS = {
  smokecraft: [
    { level: 'apprentice',   minXP: 0,    maxXP: 249  },
    { level: 'journeyman',   minXP: 250,  maxXP: 749  },
    { level: 'artisan',      minXP: 750,  maxXP: 1999 },
    { level: 'master',       minXP: 2000, maxXP: 4999 },
    { level: 'grand_master', minXP: 5000, maxXP: null },
  ],
}

export const GLOBAL_XP_THRESHOLDS = [
  { level: 'craft_initiate',    minXP: 0,     maxXP: 499    },
  { level: 'craft_explorer',    minXP: 500,   maxXP: 1499   },
  { level: 'craft_enthusiast',  minXP: 1500,  maxXP: 3999   },
  { level: 'craft_devotee',     minXP: 4000,  maxXP: 9999   },
  { level: 'craft_ambassador',  minXP: 10000, maxXP: null   },
]

export const MASTERY_PERCENT_RULES = {
  smokecraft: {
    totalTopics:         20,
    topicWeight:         0.60,
    visitWeight:         0.25,
    certificationWeight: 0.15,
  },
}

export const DEFAULT_MASTERY_RULES = {
  totalTopics:         10,
  topicWeight:         0.60,
  visitWeight:         0.25,
  certificationWeight: 0.15,
}

export function getXPThresholds(moduleId) {
  return CRAFT_XP_THRESHOLDS[moduleId] ?? [
    { level: 'apprentice', minXP: 0, maxXP: 249 },
    { level: 'journeyman', minXP: 250, maxXP: 749 },
    { level: 'artisan', minXP: 750, maxXP: 1999 },
    { level: 'master', minXP: 2000, maxXP: null },
  ]
}

export function getLevelFromXP(moduleId, craftXP) {
  const thresholds = getXPThresholds(moduleId)
  const sorted = [...thresholds].sort((a, b) => b.minXP - a.minXP)
  return sorted.find(t => craftXP >= t.minXP) ?? thresholds[0]
}

export function getGlobalLevelFromXP(globalXP) {
  const sorted = [...GLOBAL_XP_THRESHOLDS].sort((a, b) => b.minXP - a.minXP)
  return sorted.find(t => globalXP >= t.minXP) ?? GLOBAL_XP_THRESHOLDS[0]
}

export function getXPAward(awardType) {
  return XP_AWARD_VALUES[awardType] ?? 0
}

export function calculateMasteryPercent(moduleId, { completedTopics = 0, visitCount = 0, certificationLevel = null } = {}) {
  const rules = MASTERY_PERCENT_RULES[moduleId] ?? DEFAULT_MASTERY_RULES
  const topicPct  = Math.min(1, completedTopics / rules.totalTopics)
  const visitPct  = Math.min(1, visitCount / 8)
  const certPct   = certificationLevel ? 1 : 0

  const mastery = Math.round(
    (topicPct * rules.topicWeight +
     visitPct * rules.visitWeight +
     certPct  * rules.certificationWeight) * 100
  )

  return Math.min(100, mastery)
}
