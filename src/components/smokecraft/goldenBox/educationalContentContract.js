/**
 * Package 2 — reusable educational-content contract (mandate: "Do not
 * hardcode the educational content into scattered JSX arrays. Create a
 * reusable content contract that can later connect to database-backed
 * educational content.").
 *
 * Every educational item passed to <EducationalDetailPanel> must match
 * this shape. Today's callers build it from
 * golden_box_component_catalog rows (via the blend-component picker) or
 * from static per-category copy where no catalog row exists yet — both
 * paths produce the same shape, so the panel and any future
 * database-backed source are interchangeable without a UI change.
 */
export function makeEducationalContent({
  id, title, category, definition, whyItMatters, qualityImpact, flavorImpact,
  constructionImpact, performanceImpact, decisionGuidance, compatibilityNotes,
  mentorGuidance, relatedSession, relatedQuiz, relatedXpOpportunity,
  mediaAssetKey, sourceStatus = 'curated_platform_content',
}) {
  return {
    id, title, category, definition,
    whyItMatters, qualityImpact, flavorImpact, constructionImpact, performanceImpact,
    decisionGuidance, compatibilityNotes, mentorGuidance,
    relatedSession: relatedSession || null,
    relatedQuiz: relatedQuiz || null,
    relatedXpOpportunity: relatedXpOpportunity || null,
    mediaAssetKey: mediaAssetKey || null,
    sourceStatus, // 'curated_platform_content' | 'database_backed' | 'not_yet_available'
  }
}

/**
 * Converts a real golden_box_component_catalog row (Package 3, from
 * GET /api/smokecraft/golden-box-content/components) into the shared
 * shape. Column names are the real, database-backed field names — no
 * client-side fabrication of educational text.
 */
export function fromCatalogRow(row) {
  return makeEducationalContent({
    id: row.id,
    title: row.display_name,
    category: row.category || row.component_type,
    definition: row.description || row.why_it_matters || 'No description recorded yet for this component.',
    whyItMatters: row.why_it_matters,
    qualityImpact: row.quality_impact,
    flavorImpact: row.flavor_impact,
    constructionImpact: row.construction_impact,
    performanceImpact: row.performance_impact,
    decisionGuidance: row.decision_guidance,
    compatibilityNotes: row.compatibility_notes,
    mentorGuidance: row.mentor_guidance,
    relatedSession: row.related_session_id,
    mediaAssetKey: row.media_asset_key,
    sourceStatus: row.source_status || 'database_backed',
  })
}

/**
 * Honest not-yet-configured content for a category with zero catalog
 * rows — never a fabricated definition. Used by BlendBuilder when
 * golden_box_component_catalog has no entries for a given
 * component_type (a real, disclosed Package 1 state — no starter
 * content was seeded).
 */
export function notYetConfigured(category) {
  return makeEducationalContent({
    id: `${category}:not-configured`,
    title: category,
    category,
    definition: 'Educational content for this category has not been curated yet.',
    whyItMatters: 'This component category is part of the Golden Box blend but its educational reference content is not yet configured.',
    sourceStatus: 'not_yet_available',
  })
}
