/**
 * Client-side loyalty point rules — mirrors server/data/loyaltyPointRules.js
 */

export const LOYALTY_POINT_RULES = {
  session_start:             5,
  session_complete:         25,
  passport_stamp:           50,
  correct_answer:            2,
  perfect_round:            10,
  flavor_match_perfect:     15,
  house_cigar_purchase:     30,
  featured_cigar_purchase:  20,
  liquor_purchase:          10,
  cocktail_purchase:        10,
  wine_purchase:             8,
  beer_purchase:             5,
  food_purchase:             8,
  pairing_bundle_purchase:  40,
  recommended_pairing:      15,
  full_pairing_bundle:      60,
}

export const PURCHASE_POINT_RULES = {
  house_cigar:         100,
  featured_cigar:       75,
  humidor_match:        60,
  cigar:                75,
  liquor:               50,
  cocktail:             50,
  wine:                 50,
  beer:                 30,
  drink:                30,
  food:                 40,
  dinner:               40,
  dessert:              40,
  pairing_bundle:      125,
  full_pairing_bundle: 175,
}

export const RECOMMENDED_PAIRING_BONUS = 10
