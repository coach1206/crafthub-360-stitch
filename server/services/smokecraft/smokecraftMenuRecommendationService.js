/**
 * SmokeCraft Menu Recommendation Service
 * Generates menu item recommendations from pairing scores.
 * Respects availability, staffRequired, and customerOrderAllowed.
 * Honest about menu source — never claims venueMenuBacked: true unless confirmed.
 */

import { getVenueMenu } from './smokecraftVenueMenuStore.js'
import { scoreCigarToMenuItem, scoreProfileToMenuItem } from './smokecraftPairingScoringService.js'

export async function getMenuRecommendations({ venueId, cigarProfile, tasteProfile, limit = 8 }) {
  const menuResult = await getVenueMenu(venueId ?? 'default')
  const items = menuResult.items ?? []

  // Filter out unavailable items; mark staffRequired / customerOrderAllowed
  const recommendations = []
  for (const item of items) {
    if (item.available === false) continue

    const cigarScore = cigarProfile
      ? scoreCigarToMenuItem(cigarProfile, item, tasteProfile)
      : null

    const profileScore = tasteProfile
      ? scoreProfileToMenuItem(tasteProfile, item)
      : null

    const bestScore = cigarScore ?? profileScore
    if (!bestScore) continue

    // Skip allergy-blocked items
    if (bestScore.reasonCodes?.includes('allergy_block')) continue

    recommendations.push({
      ...bestScore,
      menuItemId: item.id ?? item.menuItemId,
      name: item.name,
      category: item.category,
      description: item.description,
      price: item.price ?? null,
      available: item.available !== false,
      staffRequired: item.staffRequired === true,
      customerOrderAllowed: item.customerOrderAllowed !== false,
      cigarPairingTags: item.cigarPairingTags ?? [],
      drinkPairingTags: item.drinkPairingTags ?? [],
      foodPairingTags: item.foodPairingTags ?? [],
      // Carry the recommendationId so orders can reference it
      pairingRecommendationId: bestScore.recommendationId,
      venueMenuBacked: menuResult.menuSource !== 'local_fallback',
      menuSource: menuResult.menuSource ?? 'local_fallback',
      syncStatus: menuResult.syncStatus ?? 'not_connected',
    })
  }

  // Sort by score descending
  recommendations.sort((a, b) => b.score - a.score)

  return {
    recommendations: recommendations.slice(0, limit),
    totalScored: recommendations.length,
    venueMenuBacked: menuResult.menuSource !== 'local_fallback',
    menuSource: menuResult.menuSource ?? 'local_fallback',
    syncStatus: menuResult.syncStatus ?? 'not_connected',
    productionReady: menuResult.productionReady ?? false,
    message: menuResult.menuSource === 'local_fallback'
      ? 'Venue menu is local_fallback. Connect POS360 or E.A.T. for live menu recommendations.'
      : 'Menu recommendations sourced from live venue menu.',
  }
}

/**
 * Filters menu items respecting availability and order permissions.
 * Used when adding a recommendation to an order payload.
 */
export function filterOrderableItems(recommendations) {
  return recommendations.filter(r => r.available && r.customerOrderAllowed !== false)
}

/**
 * Builds the pairingRecommendations array for inclusion in an order payload.
 * Each entry carries recommendationId so POS payload mapping can preserve it.
 */
export function buildOrderPairingPayload(recommendations) {
  return recommendations.map(r => ({
    recommendationId: r.pairingRecommendationId ?? r.recommendationId,
    menuItemId: r.menuItemId,
    name: r.name,
    score: r.score,
    confidenceScore: r.confidenceScore,
    explanation: r.explanation,
    staffRequired: r.staffRequired,
    customerOrderAllowed: r.customerOrderAllowed,
  }))
}
