/**
 * NCIE Recommendation Engine
 * Cross-craft and intra-craft recommendations.
 * Returns inventory_unavailable when no inventory data is present.
 */

import { getApplicableRecommendations } from '../../data/ncie/recommendationRules.js'
import { getCraftEntry } from '../../data/ncie/craftCatalog.js'

export function getRecommendations(moduleId, context = {}) {
  if (!moduleId) return { ok: false, error: 'module_id_required' }

  const craft = getCraftEntry(moduleId)
  if (!craft) return { ok: false, error: 'vertical_not_registered', moduleId }

  const rules = getApplicableRecommendations(moduleId, context)

  const productRecs   = rules.filter(r => r.type === 'product_recommendation')
  const crossCraftRecs = rules.filter(r => r.type === 'cross_craft_recommendation')
  const lessonRecs    = rules.filter(r => r.type === 'lesson_recommendation')

  return {
    ok:                   true,
    moduleId,
    recommendationMode:   'recommendation_available',
    inventoryStatus:      context.hasInventory ? 'inventory_available' : 'inventory_unavailable',
    productRecommendations:    productRecs.map(formatProductRec),
    crossCraftRecommendations: crossCraftRecs.map(formatCrossCraftRec),
    lessonRecommendations:     lessonRecs.map(formatLessonRec),
    totalRecommendations: rules.length,
    aiStatus:             'ai_personalization_preview',
    message:              rules.length === 0
      ? 'No matching recommendations for current context. Explore the knowledge library to refine preferences.'
      : 'Recommendations generated from NCIE rules. No live inventory was checked without a verified catalog connection.',
  }
}

function formatProductRec(rule) {
  return {
    ruleId:       rule.ruleId,
    type:         'product_recommendation',
    profiles:     rule.outcome.recommendedProfiles ?? [],
    rationale:    rule.outcome.rationale,
    inventoryStatus: 'inventory_unavailable',
    message:      'Product availability must be verified against live venue inventory before offering for purchase.',
  }
}

function formatCrossCraftRec(rule) {
  return {
    ruleId:          rule.ruleId,
    type:            'cross_craft_recommendation',
    targetModuleId:  rule.targetModuleId,
    message:         rule.outcome.crossCraftMessage,
    lessonCrossSuggest: rule.outcome.lessonCrossSuggest,
    crossCraftStatus: 'cross_craft_preview',
  }
}

function formatLessonRec(rule) {
  return {
    ruleId:        rule.ruleId,
    type:          'lesson_recommendation',
    nextLesson:    rule.outcome.nextLesson,
    rationale:     rule.outcome.rationale,
    lessonStatus:  rule.outcome.lessonRecommendStatus ?? 'lesson_available',
  }
}

export function getCrossCraftRecommendations(sourceModuleId, targetModuleId = null, context = {}) {
  const rules = getApplicableRecommendations(sourceModuleId, context)
    .filter(r => r.type === 'cross_craft_recommendation')
    .filter(r => !targetModuleId || r.targetModuleId === targetModuleId)

  return {
    ok:              true,
    sourceModuleId,
    targetModuleId,
    recommendations: rules.map(formatCrossCraftRec),
    crossCraftMode:  'cross_craft_preview',
    message:         'Cross-craft recommendations generated. No live cross-vertical purchase was initiated.',
  }
}

export function getInventoryStatus(moduleId, productId = null) {
  return {
    ok:              true,
    moduleId,
    productId,
    inventoryStatus: 'inventory_unavailable',
    message:         'Inventory status cannot be confirmed without a verified venue catalog connection. All product recommendations are preview-only.',
  }
}
