/**
 * NCIE Decision Rules
 * Rules used by the Decision Engine to generate guided product and experience recommendations.
 * Rules match guest inputs (strength preference, experience level, flavor notes) to outcomes.
 */

export const DECISION_RULE_STATUS = {
  ACTIVE:   'active',
  PREVIEW:  'decision_preview',
  DISABLED: 'disabled',
}

export const SMOKECRAFT_DECISION_RULES = [
  {
    ruleId:          'sc_new_smoker_mild',
    moduleId:        'smokecraft',
    displayName:     'New Smoker — Mild Introduction',
    status:          'active',
    priority:        100,
    conditions: {
      experienceLevel: ['beginner'],
      strengthPreference: ['mild', 'mild_medium'],
    },
    outcome: {
      recommendedProfiles: ['connecticut_shade', 'claro_wrapper', 'mild_nicaraguan'],
      avoidProfiles:       ['full_body', 'maduro', 'ligero_heavy'],
      rationale:           'First-time smokers benefit from mild, creamy, approachable profiles to build palate.',
      lessonSuggestion:    'anatomy',
      mentorRecommended:   'tobacconist',
    },
  },
  {
    ruleId:          'sc_experienced_full',
    moduleId:        'smokecraft',
    displayName:     'Experienced Smoker — Full Body',
    status:          'active',
    priority:        90,
    conditions: {
      experienceLevel: ['intermediate', 'advanced', 'master'],
      strengthPreference: ['full', 'extra_full'],
    },
    outcome: {
      recommendedProfiles: ['maduro', 'oscuro', 'ligero_heavy', 'habano'],
      avoidProfiles:       ['connecticut_shade', 'mild_claro'],
      rationale:           'Experienced smokers with full-body preference benefit from complex, rich, powerful profiles.',
      lessonSuggestion:    'ligero_seco_volado',
      mentorRecommended:   'master_blender',
    },
  },
  {
    ruleId:          'sc_pairing_whiskey',
    moduleId:        'smokecraft',
    displayName:     'Whiskey Pairing Focus',
    status:          'active',
    priority:        80,
    conditions: {
      pairingPreference: ['whiskey', 'bourbon', 'scotch'],
    },
    outcome: {
      recommendedProfiles: ['medium_full_body', 'oak_notes', 'leather_earth'],
      avoidProfiles:       ['very_mild', 'sweet_wrapper'],
      rationale:           'Whiskey pairing works best with cigars that complement the oak, vanilla, and caramel notes in aged spirits.',
      lessonSuggestion:    'whiskey_pairing',
      mentorRecommended:   'lounge_owner',
    },
  },
  {
    ruleId:          'sc_wrapper_focused',
    moduleId:        'smokecraft',
    displayName:     'Wrapper-Focused Enthusiast',
    status:          'active',
    priority:        70,
    conditions: {
      knowledgeInterest: ['wrappers', 'construction', 'origins'],
    },
    outcome: {
      recommendedProfiles: ['ecuadorian_habano', 'cameroon', 'broadleaf_maduro', 'sumatra'],
      avoidProfiles:       [],
      rationale:           'Wrapper enthusiasts benefit from exploring diverse wrapper origins and their influence on flavor and draw.',
      lessonSuggestion:    'connecticut_wrapper',
      mentorRecommended:   'wrapper_specialist',
    },
  },
]

export const GENERIC_DECISION_RULES = (moduleId) => ([
  {
    ruleId:          `${moduleId}_beginner_default`,
    moduleId,
    displayName:     'Beginner Default',
    status:          'decision_preview',
    priority:        50,
    conditions: {
      experienceLevel: ['beginner'],
    },
    outcome: {
      recommendedProfiles: ['entry_level'],
      rationale:           'Default beginner recommendation. Specific rules pending for this vertical.',
      lessonSuggestion:    'intro',
      mentorRecommended:   `${moduleId}_master`,
    },
  },
])

const RULES_MAP = {
  smokecraft: SMOKECRAFT_DECISION_RULES,
}

export function getDecisionRulesForCraft(moduleId) {
  return RULES_MAP[moduleId] ?? GENERIC_DECISION_RULES(moduleId)
}

export function getApplicableRules(moduleId, guestContext = {}) {
  const rules = getDecisionRulesForCraft(moduleId)
  return rules.filter(rule => {
    if (rule.status === 'disabled') return false
    const conds = rule.conditions
    if (conds.experienceLevel && guestContext.experienceLevel) {
      if (!conds.experienceLevel.includes(guestContext.experienceLevel)) return false
    }
    if (conds.strengthPreference && guestContext.strengthPreference) {
      if (!conds.strengthPreference.includes(guestContext.strengthPreference)) return false
    }
    if (conds.pairingPreference && guestContext.pairingPreference) {
      if (!conds.pairingPreference.includes(guestContext.pairingPreference)) return false
    }
    if (conds.knowledgeInterest && guestContext.knowledgeInterest) {
      const interests = Array.isArray(guestContext.knowledgeInterest) ? guestContext.knowledgeInterest : [guestContext.knowledgeInterest]
      if (!interests.some(i => conds.knowledgeInterest.includes(i))) return false
    }
    return true
  }).sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
}
