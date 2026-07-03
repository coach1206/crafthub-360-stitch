/**
 * SmokeCraft Mentor Recommendation Service
 * Applies mentor style influence to pairing scoring and explanation tone.
 * Mentor influence does NOT override customer dislikes or allergy/avoidance signals.
 */

export const MENTOR_STYLES = {
  classic_traditionalist: {
    label: 'Classic Traditionalist',
    recommendedStrengthBias: ['medium', 'medium_full'],
    recommendedFlavorBias: ['cedar', 'leather', 'tobacco', 'earth', 'nuts'],
    recommendedPairingStyle: 'classic',
    educationTone: 'formal',
    riskTolerance: 'low',
    classicVsAdventurous: 'classic',
    drinkBias: ['cognac', 'single_malt', 'aged_rum', 'red_wine'],
  },
  flavor_explorer: {
    label: 'Flavor Explorer',
    recommendedStrengthBias: ['mild_medium', 'medium'],
    recommendedFlavorBias: ['citrus', 'floral', 'honey', 'cream', 'vanilla'],
    recommendedPairingStyle: 'exploratory',
    educationTone: 'curious',
    riskTolerance: 'high',
    classicVsAdventurous: 'adventurous',
    drinkBias: ['craft_beer', 'white_wine', 'light_cocktail', 'green_tea'],
  },
  luxury_curator: {
    label: 'Luxury Curator',
    recommendedStrengthBias: ['medium_full', 'full'],
    recommendedFlavorBias: ['dark_chocolate', 'coffee', 'caramel', 'leather', 'cedar'],
    recommendedPairingStyle: 'premium',
    educationTone: 'refined',
    riskTolerance: 'moderate',
    classicVsAdventurous: 'classic',
    drinkBias: ['cognac', 'single_malt', 'aged_rum', 'champagne'],
  },
  beginner_guide: {
    label: 'Beginner Guide',
    recommendedStrengthBias: ['mild', 'mild_medium'],
    recommendedFlavorBias: ['vanilla', 'cream', 'honey', 'caramel', 'nuts'],
    recommendedPairingStyle: 'approachable',
    educationTone: 'welcoming',
    riskTolerance: 'low',
    classicVsAdventurous: 'classic',
    drinkBias: ['light_beer', 'white_wine', 'iced_coffee', 'light_cocktail'],
  },
  bold_strength_coach: {
    label: 'Bold Strength Coach',
    recommendedStrengthBias: ['full', 'medium_full'],
    recommendedFlavorBias: ['pepper', 'spice', 'earth', 'leather', 'coffee'],
    recommendedPairingStyle: 'bold',
    educationTone: 'direct',
    riskTolerance: 'high',
    classicVsAdventurous: 'adventurous',
    drinkBias: ['bourbon', 'rye_whiskey', 'dark_beer', 'espresso'],
  },
  pairing_sommelier: {
    label: 'Pairing Sommelier',
    recommendedStrengthBias: ['medium', 'medium_full'],
    recommendedFlavorBias: ['cherry', 'dark_chocolate', 'coffee', 'leather', 'cedar'],
    recommendedPairingStyle: 'sommelier',
    educationTone: 'educational',
    riskTolerance: 'moderate',
    classicVsAdventurous: 'balanced',
    drinkBias: ['red_wine', 'cognac', 'aged_rum', 'craft_beer'],
  },
}

/**
 * Returns a mentor profile by ID.
 * Falls back to a neutral profile if mentorId is unknown.
 */
export function getMentorProfile(mentorId) {
  const style = MENTOR_STYLES[mentorId]
  if (!style) {
    return {
      mentorId,
      mentorName: mentorId ?? 'Unknown Mentor',
      mentorStyle: 'unknown',
      recommendedStrengthBias: [],
      recommendedFlavorBias: [],
      recommendedPairingStyle: 'neutral',
      educationTone: 'neutral',
      riskTolerance: 'moderate',
      classicVsAdventurous: 'balanced',
      drinkBias: [],
      found: false,
    }
  }
  return { mentorId, mentorName: style.label, ...style, found: true }
}

/**
 * Applies mentor influence to a recommendation.
 * Never overrides avoidFlavorNotes or allergyNotes from the customer profile.
 */
export function applyMentorInfluence(recommendation, mentorId, tasteProfile) {
  const mentor = getMentorProfile(mentorId)
  if (!mentor.found) return { ...recommendation, mentorFit: 'unknown' }

  const avoidNotes = tasteProfile?.avoidFlavorNotes ?? []
  const allergyItems = tasteProfile?.avoidIngredients ?? []

  // Check if mentor biased flavors conflict with avoidances — never override
  const mentorFlavorConflicts = mentor.recommendedFlavorBias.filter(f => avoidNotes.includes(f))
  const effectiveBias = mentor.recommendedFlavorBias.filter(f => !avoidNotes.includes(f))

  const matchedBias = effectiveBias.filter(f =>
    recommendation.matchedFlavorNotes?.includes(f) ||
    recommendation.reasonCodes?.includes(f)
  )

  const mentorFitScore = matchedBias.length / Math.max(effectiveBias.length, 1)
  const mentorFit = mentorFitScore > 0.5 ? 'high' : mentorFitScore > 0.2 ? 'moderate' : 'low'

  const mentorExplanationSuffix = buildMentorExplanation(mentor, matchedBias, mentorFitScore)

  return {
    ...recommendation,
    mentorFit,
    mentorInfluence: {
      mentorId,
      mentorStyle: mentor.mentorStyle,
      educationTone: mentor.educationTone,
      matchedBias,
      conflictsIgnored: mentorFlavorConflicts,
      appliedBias: effectiveBias,
    },
    explanation: recommendation.explanation + ' ' + mentorExplanationSuffix,
    // Mentor never overrides allergy blocks
    allergyOverride: false,
  }
}

function buildMentorExplanation(mentor, matchedBias, fitScore) {
  if (fitScore > 0.5) {
    return `Your ${mentor.label} mentor strongly supports this pairing — it aligns with ${mentor.recommendedPairingStyle} style preferences.`
  }
  if (fitScore > 0.2) {
    return `Your ${mentor.label} mentor finds this pairing acceptable within a ${mentor.educationTone} exploration approach.`
  }
  return `Your ${mentor.label} mentor would typically suggest a different direction, but your personal preferences take priority.`
}

export function getMentorRecommendationReport(mentorId) {
  const mentor = getMentorProfile(mentorId)
  return {
    mentorId,
    mentorFound: mentor.found,
    mentorStyle: mentor.mentorStyle,
    drinkBias: mentor.drinkBias,
    flavorBias: mentor.recommendedFlavorBias,
    pairingStyle: mentor.recommendedPairingStyle,
    educationTone: mentor.educationTone,
  }
}
