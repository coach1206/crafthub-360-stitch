/**
 * Server-side loyalty point rules — mirrors src/constants/smokecraftLoyalty.js
 * so the commerce service can award points without importing from src/.
 */

export const LOYALTY_POINT_RULES = {
  // Session actions
  session_start:             5,
  session_complete:         25,
  passport_stamp:           50,
  // Quiz/challenge
  correct_answer:            2,
  perfect_round:            10,
  flavor_match_perfect:     15,
  // Purchases — house/featured cigars
  house_cigar_purchase:     30,
  featured_cigar_purchase:  20,
  // Purchases — bar
  liquor_purchase:          10,
  cocktail_purchase:        10,
  wine_purchase:             8,
  beer_purchase:             5,
  // Purchases — food
  food_purchase:             8,
  // Pairings
  pairing_bundle_purchase:  40,
  recommended_pairing:      15,
  full_pairing_bundle:      60,
}

export const PURCHASE_POINT_RULES = {
  house_cigar:         LOYALTY_POINT_RULES.house_cigar_purchase,
  featured_cigar:      LOYALTY_POINT_RULES.featured_cigar_purchase,
  humidor_match:       LOYALTY_POINT_RULES.featured_cigar_purchase,
  cigar:               LOYALTY_POINT_RULES.featured_cigar_purchase,
  liquor:              LOYALTY_POINT_RULES.liquor_purchase,
  cocktail:            LOYALTY_POINT_RULES.cocktail_purchase,
  wine:                LOYALTY_POINT_RULES.wine_purchase,
  beer:                LOYALTY_POINT_RULES.beer_purchase,
  drink:               LOYALTY_POINT_RULES.beer_purchase,
  food:                LOYALTY_POINT_RULES.food_purchase,
  dinner:              LOYALTY_POINT_RULES.food_purchase,
  dessert:             LOYALTY_POINT_RULES.food_purchase,
  pairing_bundle:      LOYALTY_POINT_RULES.pairing_bundle_purchase,
  full_pairing_bundle: LOYALTY_POINT_RULES.full_pairing_bundle,
}

export const RECOMMENDED_PAIRING_BONUS = LOYALTY_POINT_RULES.recommended_pairing
