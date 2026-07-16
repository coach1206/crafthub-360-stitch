/**
 * pairingEngine.js
 *
 * Rule-based (non-AI) pairing recommendation engine. Extracted from
 * PairingLab.jsx's `buildRecommendation` so the same logic can be reused by
 * both the Suggested Pairings session (S11, PairingLab.jsx) and the
 * Personalized Pairing Recommendations results screen (S22,
 * PairingRecommendations.jsx) without re-deriving it or changing PairingLab's
 * existing behavior. PairingLab imports its original 7 pairing types from
 * this module unchanged; S22's required 10-category list adds Wine, Tea,
 * Water, and Mocktail data alongside the existing categories.
 *
 * This is explicitly rule-based/algorithmic, not AI — do not label its
 * output as AI-generated anywhere it is displayed.
 */

export const STRENGTH_SCORE = { Mild: 1, Medium: 2, 'Medium-Full': 3, Full: 4 }

export const TYPE_STRENGTH = {
  Whiskey: 4, Rum: 3, Coffee: 2, Espresso: 3, Chocolate: 2, Nuts: 1, Nonalcoholic: 1,
  Wine: 2, Tea: 1, Water: 1, Mocktail: 1,
}

export const HARMONY = {
  Whiskey:      { notes: ['Smoky', 'Rich', 'Bold'],       clashes: ['Sweet', 'Creamy'] },
  Rum:          { notes: ['Sweet', 'Rich', 'Smooth'],     clashes: ['Smoky'] },
  Coffee:       { notes: ['Bold', 'Balanced', 'Rich'],    clashes: ['Sweet', 'Creamy'] },
  Espresso:     { notes: ['Bold', 'Rich', 'Smoky'],       clashes: ['Creamy', 'Sweet'] },
  Chocolate:    { notes: ['Sweet', 'Creamy', 'Smooth'],   clashes: ['Smoky'] },
  Nuts:         { notes: ['Balanced', 'Smooth', 'Rich'],  clashes: [] },
  Nonalcoholic: { notes: ['Smooth', 'Balanced', 'Sweet'], clashes: [] },
  Wine:         { notes: ['Smooth', 'Balanced', 'Rich'],  clashes: ['Bold'] },
  Tea:          { notes: ['Smooth', 'Balanced', 'Sweet'], clashes: ['Bold', 'Smoky'] },
  Water:        { notes: ['Balanced', 'Smooth'],          clashes: [] },
  Mocktail:     { notes: ['Sweet', 'Smooth', 'Balanced'], clashes: ['Smoky'] },
}

export const GOAL_DESC = {
  Complement:         "Chosen flavors align with and reinforce the cigar's natural profile.",
  Contrast:            'The pairing provides a sharp counterpoint to sharpen perception.',
  Soften:              'The pairing rounds and mellows any harsh edges in the smoke.',
  Brighten:            'The pairing lifts and opens up lighter aromatic notes.',
  'Deepen Finish':     'Extends and enriches the finish after each draw.',
  'Explore New Notes': 'Unlocks unexpected flavor dimensions through contrast.',
}

export const ADJUSTMENT_MAP = {
  Mild:         'Keep draws short — mild cigars benefit from slow, deliberate puffs to preserve the light body.',
  Medium:       'Moderate pace — let the smoke sit briefly before exhaling for full expression.',
  'Medium-Full':'Allow 30–60 seconds between draws to prevent heat buildup.',
  Full:         'Extended rest between draws. Full-bodied cigars reward patience and cool smoke.',
}

/** The 10 categories required for Personalized Pairing Recommendations (S22). */
export const PAIRING_CATEGORIES = [
  'Whiskey', 'Rum', 'Coffee', 'Espresso', 'Wine', 'Chocolate', 'Tea', 'Water', 'Mocktail', 'Nonalcoholic',
]

const SERVING_STYLE = {
  Whiskey: 'Neat, in a rocks glass, at room temperature.',
  Rum:     'Neat or on a single large ice cube.',
  Coffee:  'Fresh-brewed, served black or lightly sweetened.',
  Espresso:'Short pull, served hot alongside the first third.',
  Wine:    'Room-temperature red, poured just before lighting.',
  Chocolate: 'A few squares of dark chocolate, room temperature.',
  Tea:     'Hot-brewed, unsweetened, and served alongside.',
  Water:   'Still, room-temperature, as a neutral palate reset.',
  Mocktail:'Chilled, served over ice in a lowball glass.',
  Nonalcoholic: 'Chilled, served alongside without alcohol.',
  Nuts:    'A small dish, served at room temperature.',
}

/**
 * Core recommendation builder — identical logic to PairingLab's original
 * `buildRecommendation`. `s` = { cigarShape, wrapper, origin, strength,
 * pairingTypes, flavorNotes, pairingGoal }. Returns null when no pairing type
 * is selected/considered.
 */
export function buildRecommendation(s) {
  const { cigarShape, wrapper, origin, strength, pairingTypes, flavorNotes, pairingGoal } = s
  if (!pairingTypes || pairingTypes.length === 0) return null

  const primary = pairingTypes[0]
  const harmony = HARMONY[primary] || { notes: [], clashes: [] }
  const flavorHits = (flavorNotes || []).filter(n => harmony.notes.includes(n))
  const clashHits  = (flavorNotes || []).filter(n => harmony.clashes.includes(n))

  const strScore = STRENGTH_SCORE[strength] || 2
  const typScore = TYPE_STRENGTH[primary] || 2
  const matchDiff = Math.abs(strScore - typScore)
  const baseScore = 100 - matchDiff * 12
  const flavorBonus = flavorHits.length * 6
  const clashPenalty = clashHits.length * 10
  const rawScore = Math.max(30, Math.min(100, baseScore + flavorBonus - clashPenalty))
  const compatScore = Math.round(rawScore)

  const whyLines = [
    flavorHits.length > 0
      ? `${flavorHits.join(' and ')} notes create direct harmony with ${primary}'s profile.`
      : `${primary} provides a clean complement to the selected strength.`,
    strength && pairingGoal
      ? `Goal: ${pairingGoal} — ${GOAL_DESC[pairingGoal] || ''}`
      : null,
    origin
      ? `${origin} leaf character ${strScore >= 3 ? 'holds up well' : 'shines cleanly'} against this pairing.`
      : null,
  ].filter(Boolean)

  const clashNote = clashHits.length > 0
    ? `Watch for tension between ${clashHits.join(' and ')} notes and ${primary}'s base character.`
    : null

  return {
    primary,
    pairingTypes,
    compatScore,
    recommendation: pairingTypes.join(' + '),
    whyItWorks: whyLines.join(' '),
    possibleClashes: clashNote,
    suggestedAdjustment: ADJUSTMENT_MAP[strength] || 'Take deliberate, unhurried draws.',
    selectedFlavorNotes: flavorNotes || [],
    flavorHarmony: flavorHits,
    servingStyle: SERVING_STYLE[primary] || 'Serve at a temperature that complements a slow-paced smoke.',
  }
}

/**
 * Ranks every category in PAIRING_CATEGORIES against the same cigar/flavor
 * context and returns them sorted by compatibility score, descending. Used
 * by the Personalized Pairing Recommendations screen to surface a Primary
 * Recommendation plus Alternate Recommendations from one consistent engine
 * pass, without re-deriving the scoring rules.
 */
export function rankAllCategories(context) {
  return PAIRING_CATEGORIES
    .map(category => buildRecommendation({ ...context, pairingTypes: [category] }))
    .filter(Boolean)
    .sort((a, b) => b.compatScore - a.compatScore)
}
