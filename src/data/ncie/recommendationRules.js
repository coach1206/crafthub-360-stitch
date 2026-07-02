/**
 * NCIE Recommendation Rules
 * Cross-craft and intra-craft recommendation logic.
 * Returns inventory_unavailable when no inventory data is present.
 */

export const RECOMMENDATION_TYPES = {
  PRODUCT:      'product_recommendation',
  CROSS_CRAFT:  'cross_craft_recommendation',
  LESSON:       'lesson_recommendation',
  MENTOR:       'mentor_recommendation',
  EXPERIENCE:   'experience_recommendation',
}

export const RECOMMENDATION_STATUS = {
  AVAILABLE:            'recommendation_available',
  INVENTORY_UNAVAILABLE: 'inventory_unavailable',
  PREVIEW:              'recommendation_preview',
}

export const SMOKECRAFT_RECOMMENDATION_RULES = [
  {
    ruleId:          'sc_rec_cigar_coffee_pairing',
    moduleId:        'smokecraft',
    type:            'cross_craft_recommendation',
    displayName:     'SmokeCraft + CoffeeCraft Pairing',
    targetModuleId:  'coffeecraft',
    priority:        100,
    conditions: {
      currentVertical: 'smokecraft',
      activityContext: ['morning_smoke', 'brunch', 'casual_lounge'],
    },
    outcome: {
      crossCraftMessage:   'Pair your mild Connecticut with a naturally processed Ethiopian pour-over for a complementary experience.',
      targetVertical:      'coffeecraft',
      lessonCrossSuggest:  'coffee_pairing',
      crossCraftStatus:    'cross_craft_preview',
    },
  },
  {
    ruleId:          'sc_rec_cigar_whiskey_pairing',
    moduleId:        'smokecraft',
    type:            'cross_craft_recommendation',
    displayName:     'SmokeCraft + PourCraft Pairing',
    targetModuleId:  'pourcraft',
    priority:        95,
    conditions: {
      currentVertical: 'smokecraft',
      activityContext: ['evening_smoke', 'special_occasion', 'collectors_lounge'],
    },
    outcome: {
      crossCraftMessage:   'Complement your full-bodied Nicaraguan with a high-rye Kentucky bourbon for an exceptional pairing.',
      targetVertical:      'pourcraft',
      lessonCrossSuggest:  'whiskey_pairing',
      crossCraftStatus:    'cross_craft_preview',
    },
  },
  {
    ruleId:          'sc_rec_next_lesson',
    moduleId:        'smokecraft',
    type:            'lesson_recommendation',
    displayName:     'Next Knowledge Step',
    priority:        80,
    conditions: {
      completedTopics: ['anatomy'],
    },
    outcome: {
      nextLesson:          'filler_binder_wrapper',
      rationale:           'After mastering anatomy, the natural next step is understanding how filler, binder, and wrapper work together.',
      lessonRecommendStatus: 'lesson_available',
    },
  },
]

export const GENERIC_RECOMMENDATION_RULES = (moduleId) => ([
  {
    ruleId:          `${moduleId}_rec_default`,
    moduleId,
    type:            'lesson_recommendation',
    displayName:     'Start With Foundations',
    priority:        50,
    conditions:      {},
    outcome: {
      nextLesson:          'intro',
      rationale:           'Begin your journey with the foundational concepts of this craft.',
      lessonRecommendStatus: 'lesson_available',
    },
  },
])

const RULES_MAP = {
  smokecraft: SMOKECRAFT_RECOMMENDATION_RULES,
}

export function getRecommendationRules(moduleId) {
  return RULES_MAP[moduleId] ?? GENERIC_RECOMMENDATION_RULES(moduleId)
}

export function getApplicableRecommendations(moduleId, context = {}) {
  const rules = getRecommendationRules(moduleId)
  return rules.filter(rule => {
    const conds = rule.conditions
    if (!conds || Object.keys(conds).length === 0) return true
    if (conds.currentVertical && conds.currentVertical !== moduleId) return false
    if (conds.activityContext && context.activityContext) {
      const ctxArr = Array.isArray(context.activityContext) ? context.activityContext : [context.activityContext]
      if (!ctxArr.some(c => conds.activityContext.includes(c))) return false
    }
    if (conds.completedTopics && context.completedTopics) {
      if (!conds.completedTopics.every(t => context.completedTopics.includes(t))) return false
    }
    return true
  }).sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
}
