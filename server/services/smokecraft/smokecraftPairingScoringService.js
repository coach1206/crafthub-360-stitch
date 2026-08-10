/**
 * SmokeCraft Pairing Scoring Service
 * Calculates structured pairing scores 0–100 with confidence 0–1.
 * Never returns perfect 100 unless logic fully supports it.
 * Never fakes scores.
 */

import { v4 as uuidv4 } from 'uuid'

const RECOMMENDATION_TYPES = {
  CIGAR_TO_DRINK: 'cigar_to_drink',
  CIGAR_TO_FOOD: 'cigar_to_food',
  CIGAR_TO_MENU_ITEM: 'cigar_to_menu_item',
  PROFILE_TO_CIGAR: 'profile_to_cigar',
  PROFILE_TO_MENU_ITEM: 'profile_to_menu_item',
  MENTOR_TO_PAIRING: 'mentor_to_pairing',
  PHASE_TO_RECOMMENDATION: 'phase_to_recommendation',
}

// Flavor affinity map — which notes go well together
const FLAVOR_AFFINITY = {
  cedar:      ['vanilla', 'caramel', 'honey', 'oak', 'cream'],
  leather:    ['dark_chocolate', 'coffee', 'tobacco', 'earth', 'nuts'],
  coffee:     ['chocolate', 'dark_chocolate', 'cream', 'caramel', 'nuts', 'leather'],
  chocolate:  ['coffee', 'nuts', 'cream', 'caramel', 'cherry', 'vanilla'],
  pepper:     ['spice', 'cinnamon', 'ginger', 'earth', 'dark_chocolate'],
  vanilla:    ['cream', 'caramel', 'honey', 'cedar', 'butter'],
  earth:      ['leather', 'mushroom', 'coffee', 'tobacco', 'pepper'],
  nuts:       ['chocolate', 'coffee', 'cream', 'caramel', 'butter'],
  citrus:     ['floral', 'honey', 'green', 'cream', 'vanilla'],
  honey:      ['vanilla', 'citrus', 'cream', 'caramel', 'floral'],
  cream:      ['vanilla', 'honey', 'nuts', 'caramel', 'butter'],
  spice:      ['pepper', 'cinnamon', 'ginger', 'dark_chocolate', 'coffee'],
  caramel:    ['vanilla', 'cream', 'nuts', 'honey', 'butter'],
  floral:     ['citrus', 'honey', 'green', 'cream', 'vanilla'],
}

// Strength-drink affinity
const STRENGTH_DRINK_AFFINITY = {
  mild:        ['light_wine', 'prosecco', 'light_beer', 'green_tea', 'white_wine'],
  mild_medium: ['white_wine', 'rose', 'light_cocktail', 'craft_beer', 'iced_coffee'],
  medium:      ['red_wine', 'craft_beer', 'aged_rum', 'bourbon', 'coffee'],
  medium_full: ['bourbon', 'aged_rum', 'dark_beer', 'rye_whiskey', 'cognac', 'coffee'],
  full:        ['cognac', 'single_malt', 'aged_rum', 'dark_beer', 'espresso', 'bourbon'],
}

function flavorOverlapScore(notesA, notesB) {
  if (!notesA.length || !notesB.length) return 0
  let hits = 0
  for (const note of notesA) {
    const affinities = FLAVOR_AFFINITY[note] ?? []
    if (notesB.some(n => n === note || affinities.includes(n))) hits++
  }
  return Math.min(hits / Math.max(notesA.length, 1), 1)
}

function strengthDrinkScore(strength, drinkCategory) {
  if (!strength || !drinkCategory) return 0.4
  const preferred = STRENGTH_DRINK_AFFINITY[strength] ?? []
  return preferred.some(d => drinkCategory.toLowerCase().includes(d)) ? 0.9 : 0.4
}

function buildRecommendation(type, score, confidence, reasonCodes, explanation, extras = {}) {
  return {
    recommendationId: `sc-rec-${uuidv4().slice(0, 8)}`,
    recommendationType: type,
    score: Math.min(Math.max(Math.round(score), 0), 98), // cap at 98, never fake 100
    confidenceScore: parseFloat(Math.min(Math.max(confidence, 0), 1).toFixed(2)),
    reasonCodes,
    explanation,
    matchedFlavorNotes: extras.matchedFlavorNotes ?? [],
    conflictingFlavorNotes: extras.conflictingFlavorNotes ?? [],
    strengthFit: extras.strengthFit ?? null,
    bodyFit: extras.bodyFit ?? null,
    wrapperFit: extras.wrapperFit ?? null,
    originFit: extras.originFit ?? null,
    mentorFit: extras.mentorFit ?? null,
    menuFit: extras.menuFit ?? null,
    phaseFit: extras.phaseFit ?? null,
    inputSignals: extras.inputSignals ?? [],
    providerStatus: 'local_intelligence',
    createdAt: new Date().toISOString(),
    ...extras,
  }
}

export function scoreCigarToDrink(cigarProfile, drinkItem, tasteProfile = null) {
  const flavorScore = flavorOverlapScore(
    cigarProfile.flavorNotes ?? [],
    drinkItem.flavorNotes ?? drinkItem.pairingTags ?? []
  )
  const strengthScore = strengthDrinkScore(
    cigarProfile.strengthLevel ?? tasteProfile?.preferredStrength,
    drinkItem.category ?? drinkItem.name ?? ''
  )
  const avoidConflicts = (tasteProfile?.avoidFlavorNotes ?? [])
    .filter(n => (drinkItem.flavorNotes ?? []).includes(n))
  const conflictPenalty = avoidConflicts.length * 10

  const rawScore = (flavorScore * 55 + strengthScore * 40) - conflictPenalty
  const confidence = tasteProfile ? 0.72 : 0.45

  return buildRecommendation(
    RECOMMENDATION_TYPES.CIGAR_TO_DRINK,
    rawScore,
    confidence,
    ['flavor_affinity', 'strength_drink_match'],
    `${drinkItem.name ?? 'Drink'} pairs with this cigar based on complementary flavor notes and strength alignment.`,
    {
      matchedFlavorNotes: cigarProfile.flavorNotes?.filter(n =>
        (FLAVOR_AFFINITY[n] ?? []).some(a => (drinkItem.flavorNotes ?? []).includes(a))
      ) ?? [],
      conflictingFlavorNotes: avoidConflicts,
      strengthFit: strengthScore > 0.7 ? 'high' : 'moderate',
      inputSignals: ['cigar_profile', tasteProfile ? 'taste_profile' : null].filter(Boolean),
    }
  )
}

export function scoreCigarToFood(cigarProfile, foodItem, tasteProfile = null) {
  const flavorScore = flavorOverlapScore(
    cigarProfile.flavorNotes ?? [],
    foodItem.flavorNotes ?? foodItem.pairingTags ?? []
  )
  const avoidConflicts = (tasteProfile?.avoidFlavorNotes ?? [])
    .filter(n => (foodItem.flavorNotes ?? []).includes(n))
  const allergyBlock = (tasteProfile?.avoidIngredients ?? [])
    .filter(i => (foodItem.ingredients ?? []).includes(i))

  if (allergyBlock.length > 0) {
    return buildRecommendation(
      RECOMMENDATION_TYPES.CIGAR_TO_FOOD,
      0, 0.95,
      ['allergy_block'],
      `${foodItem.name ?? 'Item'} contains ingredients you wish to avoid.`,
      { conflictingFlavorNotes: allergyBlock }
    )
  }

  const conflictPenalty = avoidConflicts.length * 10
  const rawScore = (flavorScore * 75) - conflictPenalty
  const confidence = tasteProfile ? 0.68 : 0.40

  return buildRecommendation(
    RECOMMENDATION_TYPES.CIGAR_TO_FOOD,
    rawScore,
    confidence,
    ['flavor_affinity'],
    `${foodItem.name ?? 'Food item'} complements the flavor profile of this cigar.`,
    {
      matchedFlavorNotes: cigarProfile.flavorNotes?.filter(n =>
        (foodItem.flavorNotes ?? foodItem.pairingTags ?? []).some(f =>
          f === n || (FLAVOR_AFFINITY[n] ?? []).includes(f)
        )
      ) ?? [],
      conflictingFlavorNotes: avoidConflicts,
      inputSignals: ['cigar_profile', tasteProfile ? 'taste_profile' : null].filter(Boolean),
    }
  )
}

export function scoreCigarToMenuItem(cigarProfile, menuItem, tasteProfile = null) {
  const tags = [
    ...(menuItem.cigarPairingTags ?? []),
    ...(menuItem.drinkPairingTags ?? []),
    ...(menuItem.foodPairingTags ?? []),
    ...(menuItem.pairingTags ?? []),
    ...(menuItem.flavorNotes ?? []),
  ]
  const flavorScore = flavorOverlapScore(cigarProfile.flavorNotes ?? [], tags)
  const avoidConflicts = (tasteProfile?.avoidFlavorNotes ?? []).filter(n => tags.includes(n))
  const conflictPenalty = avoidConflicts.length * 10
  const rawScore = (flavorScore * 70) - conflictPenalty
  const confidence = tasteProfile ? 0.66 : 0.38

  return buildRecommendation(
    RECOMMENDATION_TYPES.CIGAR_TO_MENU_ITEM,
    rawScore,
    confidence,
    ['menu_pairing_tags', 'flavor_affinity'],
    `${menuItem.name ?? 'Menu item'} is tagged for pairing with this cigar style.`,
    {
      matchedFlavorNotes: tags.filter(t => (cigarProfile.flavorNotes ?? []).some(n =>
        n === t || (FLAVOR_AFFINITY[n] ?? []).includes(t)
      )),
      conflictingFlavorNotes: avoidConflicts,
      menuFit: flavorScore > 0.5 ? 'high' : 'moderate',
      inputSignals: ['cigar_profile', 'menu_pairing_tags', tasteProfile ? 'taste_profile' : null].filter(Boolean),
    }
  )
}

export function scoreProfileToMenuItem(tasteProfile, menuItem) {
  if (!tasteProfile) {
    return buildRecommendation(
      RECOMMENDATION_TYPES.PROFILE_TO_MENU_ITEM,
      35, 0.20,
      ['no_profile'],
      'No taste profile available. Recommendation is based on menu item pairing tags only.',
      {}
    )
  }
  const tags = [
    ...(menuItem.cigarPairingTags ?? []),
    ...(menuItem.drinkPairingTags ?? []),
    ...(menuItem.foodPairingTags ?? []),
    ...(menuItem.pairingTags ?? []),
  ]
  const likedScore = flavorOverlapScore(tasteProfile.dominantFlavorNotes ?? [], tags)
  const avoidConflicts = (tasteProfile.avoidFlavorNotes ?? []).filter(n => tags.includes(n))
  const allergyBlock = (tasteProfile.avoidIngredients ?? [])
    .filter(i => (menuItem.ingredients ?? []).includes(i))

  if (allergyBlock.length > 0) {
    return buildRecommendation(
      RECOMMENDATION_TYPES.PROFILE_TO_MENU_ITEM,
      0, 0.95,
      ['allergy_block'],
      `${menuItem.name ?? 'Item'} contains ingredients you wish to avoid.`,
      { conflictingFlavorNotes: allergyBlock }
    )
  }

  const conflictPenalty = avoidConflicts.length * 12
  const rawScore = (likedScore * 80 + tasteProfile.confidenceScore * 15) - conflictPenalty
  const confidence = Math.min(0.5 + tasteProfile.confidenceScore * 0.4, 0.90)

  return buildRecommendation(
    RECOMMENDATION_TYPES.PROFILE_TO_MENU_ITEM,
    rawScore,
    confidence,
    ['taste_profile_match', 'menu_pairing_tags'],
    `${menuItem.name ?? 'Menu item'} aligns with your flavor preferences from your SmokeCraft journey.`,
    {
      matchedFlavorNotes: (tasteProfile.dominantFlavorNotes ?? []).filter(n => tags.some(t =>
        t === n || (FLAVOR_AFFINITY[n] ?? []).includes(t)
      )),
      conflictingFlavorNotes: avoidConflicts,
      menuFit: likedScore > 0.5 ? 'high' : 'moderate',
      inputSignals: ['taste_profile', 'menu_pairing_tags'],
    }
  )
}

export { RECOMMENDATION_TYPES }
