/**
 * NCIE Tile Adapter
 * Creates reusable tile metadata for Learn More triggers.
 * Pulls lesson mapping from NCIE taxonomy/config.
 * Does not hardcode lessons directly into UI components.
 */

import { getEducationalTile, getTilesByCraft, getTilesByCategory } from '../../data/ncie/educationalTileRegistry.js'
import { getTaxonomyForCraft, getTopicsForDomain } from '../../data/ncie/knowledgeTaxonomy.js'

export function getTileMetadata(tileId, craftType = 'smokecraft') {
  const tile = getEducationalTile(tileId, craftType)
  if (!tile) {
    return {
      ok:         false,
      tileId,
      craftType,
      error:      'tile_not_found',
      tileStatus: 'tile_not_registered',
    }
  }
  return {
    ok:          true,
    tileId:      tile.tileId,
    craftType:   tile.craftType,
    displayName: tile.displayName,
    category:    tile.category,
    lessonIds:   tile.lessonIds ?? [],
    mentorIds:   tile.mentorIds ?? [],
    decisionType: tile.decisionType ?? null,
    recommendationType: tile.recommendationType ?? null,
    analyticsTags: tile.analyticsTags ?? [],
    commerceTags:  tile.commerceTags ?? [],
    tileStatus:  'educational_tile_ready',
    quizEnabled: tile.quizEnabled ?? false,
    learnMoreAvailable: tile.lessonIds?.length > 0,
  }
}

export function getLearnMoreTrigger(tileId, craftType = 'smokecraft') {
  const metadata = getTileMetadata(tileId, craftType)
  if (!metadata.ok) return metadata

  const lessons  = buildLessonList(metadata.lessonIds, craftType)

  return {
    ok:              true,
    tileId,
    craftType,
    triggerType:     'learn_more',
    displayName:     metadata.displayName,
    category:        metadata.category,
    lessons,
    mentorIds:       metadata.mentorIds,
    decisionType:    metadata.decisionType,
    tileStatus:      'educational_tile_ready',
    lessonStatus:    lessons.length > 0 ? 'verified_outline_available' : 'lesson_preview',
    message:         'Learn More trigger built from verified NCIE outline. AI personalization is optional.',
  }
}

function buildLessonList(lessonIds, craftType) {
  const taxonomy = getTaxonomyForCraft(craftType)
  const result   = []
  for (const lessonId of lessonIds) {
    for (const domain of (taxonomy.domains ?? [])) {
      const topic = (domain.topics ?? []).find(t => t.topicId === lessonId)
      if (topic) {
        result.push({
          lessonId:    topic.topicId,
          displayName: topic.displayName,
          domainId:    domain.domainId,
          domainName:  domain.displayName,
          level:       topic.level,
          status:      'lesson_available',
        })
        break
      }
    }
    if (!result.find(r => r.lessonId === lessonId)) {
      result.push({ lessonId, displayName: lessonId.replace(/_/g, ' '), status: 'lesson_preview' })
    }
  }
  return result
}

export function getAllTilesForCraft(craftType) {
  const tiles = getTilesByCraft(craftType)
  return {
    ok:        true,
    craftType,
    tiles:     tiles.map(t => getTileMetadata(t.tileId, craftType)),
    tileCount: tiles.length,
    tileStatus: 'educational_tile_ready',
  }
}

export function getTilesByScreenCategory(craftType, lessonCategory) {
  const tiles = getTilesByCategory(craftType, lessonCategory)
  return tiles.map(t => getTileMetadata(t.tileId, craftType))
}

export const LEARN_MORE_TILE_IDS = {
  smokecraft: {
    SOIL:        'sc_soil',
    REGION:      'sc_region',
    WRAPPER:     'sc_wrapper',
    LEAF_IMPACT: 'sc_leaf_impact',
    FLAVOR:      'sc_flavor',
    AROMA:       'sc_aroma',
    PAIRING:     'sc_pairing',
    HUMIDOR:     'sc_humidor',
    CUT:         'sc_cut',
    FIRST_THIRD:  'sc_first_third',
    SECOND_THIRD: 'sc_second_third',
    FINAL_THIRD:  'sc_final_third',
    SCORECARD:   'sc_scorecard',
    PASSPORT:    'sc_passport',
  },
}
