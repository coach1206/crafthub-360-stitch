/**
 * NCIE Decision Engine
 * Guides guests through product and experience decisions using internal decision rules.
 * Every response includes whyThisFits, lessonInfluences, mentorExplanation,
 * confidenceScore, alternativeChoices, and learnMoreBeforeChoosing.
 */

import { getApplicableRules } from '../../data/ncie/decisionRules.js'
import { getDefaultMentor } from '../../data/ncie/mentorProfiles.js'

export function runDecision(moduleId, guestContext = {}) {
  if (!moduleId) return { ok: false, error: 'module_id_required' }

  const rules = getApplicableRules(moduleId, guestContext)

  if (rules.length === 0) {
    return buildNoMatchDecision(moduleId, guestContext)
  }

  const topRule     = rules[0]
  const alternatives = rules.slice(1, 4)
  const mentor      = getDefaultMentor(moduleId)

  return {
    ok:                    true,
    moduleId,
    decisionMode:          'decision_available',
    matchedRuleId:         topRule.ruleId,
    recommendedProfiles:   topRule.outcome.recommendedProfiles ?? [],
    avoidProfiles:         topRule.outcome.avoidProfiles ?? [],
    whyThisFits:           buildWhyThisFits(topRule, guestContext),
    lessonInfluences:      buildLessonInfluences(topRule),
    mentorExplanation:     buildMentorExplanation(topRule, mentor),
    confidenceScore:       calculateConfidence(topRule, guestContext),
    alternativeChoices:    alternatives.map(r => ({
      ruleId:              r.ruleId,
      recommendedProfiles: r.outcome.recommendedProfiles ?? [],
      rationale:           r.outcome.rationale,
    })),
    learnMoreBeforeChoosing: buildLearnMore(topRule),
    aiStatus:              'ai_personalization_preview',
    message:               'Decision generated from NCIE internal rules. AI personalization requires verified OpenAI key.',
  }
}

function buildNoMatchDecision(moduleId, guestContext) {
  return {
    ok:                    true,
    moduleId,
    decisionMode:          'decision_preview',
    matchedRuleId:         null,
    recommendedProfiles:   [],
    avoidProfiles:         [],
    whyThisFits:           'No matching decision rule found for the provided guest context. Explore the knowledge library to refine your preferences.',
    lessonInfluences:      ['intro', 'foundations'],
    mentorExplanation:     'Start with our foundational lessons to discover what best fits your taste and experience level.',
    confidenceScore:       0,
    alternativeChoices:    [],
    learnMoreBeforeChoosing: ['Complete at least one foundational lesson before requesting a product decision.'],
    aiStatus:              'ai_personalization_preview',
    message:               'No matching rule. Guest context may need more detail.',
  }
}

function buildWhyThisFits(rule, guestContext) {
  const parts = [rule.outcome.rationale]
  if (guestContext.experienceLevel) parts.push(`Matched to your experience level: ${guestContext.experienceLevel}.`)
  if (guestContext.strengthPreference) parts.push(`Matched to your strength preference: ${guestContext.strengthPreference}.`)
  if (guestContext.pairingPreference) parts.push(`Matched to your pairing preference: ${guestContext.pairingPreference}.`)
  return parts.join(' ')
}

function buildLessonInfluences(rule) {
  const lessons = []
  if (rule.outcome.lessonSuggestion) lessons.push(rule.outcome.lessonSuggestion)
  return lessons
}

function buildMentorExplanation(rule, mentor) {
  if (!mentor) return rule.outcome.rationale
  return `${mentor.displayName} says: "${rule.outcome.rationale}" — ${mentor.signaturePhrase}`
}

function calculateConfidence(rule, guestContext) {
  const conditionKeys  = Object.keys(rule.conditions)
  const contextKeys    = Object.keys(guestContext)
  const matchedKeys    = conditionKeys.filter(k => contextKeys.includes(k))
  if (conditionKeys.length === 0) return 50
  return Math.round((matchedKeys.length / conditionKeys.length) * 100)
}

function buildLearnMore(rule) {
  const suggestions = []
  if (rule.outcome.lessonSuggestion) {
    suggestions.push(`Complete the "${rule.outcome.lessonSuggestion}" lesson to deepen your understanding before choosing.`)
  }
  if (rule.outcome.mentorRecommended) {
    suggestions.push(`Consult the ${rule.outcome.mentorRecommended} mentor to explore your options in more detail.`)
  }
  return suggestions
}

export function getDecisionReadiness(moduleId, guestContext = {}) {
  const rules = getApplicableRules(moduleId, guestContext)
  return {
    ok:            true,
    moduleId,
    rulesAvailable: rules.length,
    decisionMode:  rules.length > 0 ? 'decision_available' : 'decision_preview',
    contextProvided: Object.keys(guestContext),
    message:       'Decision readiness checked. Provide more guest context for higher confidence decisions.',
  }
}
