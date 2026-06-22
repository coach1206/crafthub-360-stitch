// Pairing scoring for SmokeCraft 360's Seed & Soil combo builder.
// Pure functions only — no React, no storage I/O. Inputs are the seed region
// object (see src/pages/smokecraft/SeedSoil.jsx REGIONS) and the soil choices
// the guest made (drink, food, mood, atmosphere, social, music, theme).

const STRENGTH_RANK = { Mild: 1, 'Mild-Medium': 1.5, Medium: 2, 'Medium-Full': 2.5, Full: 3 }

// Drink pairings that complement each strength tier. A drink outside its tier
// is not automatically bad — only the explicit CLASH list below is penalized.
const DRINK_STRENGTH_FIT = {
  Whiskey: 3, Rum: 2.5, Coffee: 2, 'Red Wine': 2.5,
}

const FOOD_STRENGTH_FIT = {
  'Dark Chocolate': 3, 'Cheese Board': 2, Dessert: 1.5, None: 0,
}

// Known clashes: pairing a delicate cigar with an overpowering drink/food, or
// vice versa, masks the leaf's character and is flagged as a bad pairing.
const CLASHES = [
  { strengthMax: 2, drink: 'Whiskey', reason: 'A bold whiskey overwhelms a lighter-bodied leaf.' },
  { strengthMax: 2, food: 'Dark Chocolate', reason: 'Rich dark chocolate can mute a milder cigar\'s nuance.' },
  { strengthMin: 2.5, food: 'None', reason: 'A full-bodied cigar with no food pairing wastes its richest notes.' },
]

export function calculatePairingScore({ region, soil }) {
  const breakdown = []
  let score = 0
  if (!region || !soil) {
    return { score: 0, grade: '—', breakdown, warning: null }
  }

  const strength = STRENGTH_RANK[region.strength] ?? 2

  // Wrapper/body match: does the chosen mood/setting align with the region's strength?
  if (soil.mood) {
    const matches = (strength >= 2.5 && (soil.mood === 'Reflective' || soil.mood === 'Adventurous')) ||
      (strength < 2.5 && (soil.mood === 'Relaxed' || soil.mood === 'Celebratory'))
    if (matches) {
      score += 25
      breakdown.push({ points: 25, label: 'Correct wrapper/body match', reason: `${region.strength} strength suits a ${soil.mood.toLowerCase()} mood.` })
    }
  }

  // Ring gauge / burn-time proxy: atmosphere + social setting consistency.
  if (soil.atmosphere && soil.social) {
    const eventFit = (soil.atmosphere === 'Private Room' || soil.atmosphere === 'Poolside') && (soil.social === 'Group' || soil.social === 'Celebration')
    if (eventFit) {
      score += 25
      breakdown.push({ points: 25, label: 'Correct ring gauge/burn-time match', reason: `${soil.atmosphere} + ${soil.social} favors a longer-format session.` })
    }
  }

  let warning = null

  if (soil.pairing) {
    const drinkFit = DRINK_STRENGTH_FIT[soil.pairing] ?? 2
    const clash = CLASHES.find(c => c.drink === soil.pairing && strength <= c.strengthMax)
    if (clash) {
      score -= 50
      breakdown.push({ points: -50, label: 'Pairing clash risk', reason: clash.reason })
      warning = { field: 'pairing', message: 'This pairing may overpower the cigar. You can keep it, but it may reduce your Pairing Score.' }
    } else if (Math.abs(drinkFit - strength) <= 0.5) {
      const bonus = region.strength === 'Full' && soil.pairing === 'Whiskey' ? 0
        : (strength >= 2.5 && soil.pairing === 'Rum') ? 75
        : 25
      score += bonus
      breakdown.push({ points: bonus, label: bonus >= 75 ? 'Rare regional + drink combo' : 'Strong drink pairing', reason: `${region.name} pairs naturally with ${soil.pairing}.` })
    }
  }

  if (soil.food) {
    const clash = CLASHES.find(c => c.food === soil.food && (
      (c.strengthMax !== undefined && strength <= c.strengthMax) ||
      (c.strengthMin !== undefined && strength >= c.strengthMin)
    ))
    if (clash) {
      score -= 25
      breakdown.push({ points: -25, label: 'Food pairing mismatch', reason: clash.reason })
      if (!warning) warning = { field: 'food', message: 'This food pairing may clash with the cigar\'s body. You can keep it, but it may reduce your Pairing Score.' }
    } else if (strength >= 2.5 && soil.food === 'Dark Chocolate') {
      score += 125
      breakdown.push({ points: 125, label: 'Strong Maduro + Espresso-class pairing', reason: 'Full-bodied leaf and dark chocolate intensify each other.' })
    } else if (soil.food !== 'None') {
      score += 25
      breakdown.push({ points: 25, label: 'Solid food pairing', reason: `${soil.food} complements the ${region.strength.toLowerCase()} profile.` })
    }
  }

  const grade = score >= 150 ? 'Exceptional' : score >= 75 ? 'Strong' : score >= 25 ? 'Good' : score >= 0 ? 'Fair' : 'Risky'

  return { score, grade, breakdown, warning }
}

export function applyGenericNotesPenalty(breakdown, score) {
  return {
    score: score - 25,
    breakdown: [...breakdown, { points: -25, label: 'Generic tasting notes', reason: 'No specific flavor detail was recorded.' }],
  }
}

export function applyKeptWarningPenalty(breakdown, score) {
  return {
    score: score - 50,
    breakdown: [...breakdown, { points: -50, label: 'Pairing clash warning ignored', reason: 'Guest chose to keep a flagged pairing.' }],
  }
}
