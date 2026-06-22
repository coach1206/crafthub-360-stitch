// Builds the per-session "Unique Blend Signature" from whatever Seed & Soil,
// Format and tasting data the guest has actually recorded, and scores how
// rare that combination is. Pure functions — no React, no storage I/O.

const RARE_REGIONS = new Set(['sanandres', 'esteli'])
const RARE_FOOD = new Set(['Dark Chocolate', 'Cheese Board'])

export function createBlendSignature({ region, soil, format, mentorId, finalRating }) {
  return {
    cigarName:    format?.name || null,
    brand:        'CraftHub Reserve',
    country:      region?.country || null,
    region:       region?.name || null,
    wrapper:      region?.wrapper || null,
    binder:       region?.binder || null,
    filler:       region?.filler || null,
    origin:       region?.country || null,
    aging:        region?.aging || null,
    vitola:       format?.name || null,
    ringGauge:    format?.ringGauge || null,
    length:       format?.length || null,
    burnTime:     format?.burnTime || null,
    strength:     region?.strength || null,
    body:         format?.strengthBody || null,
    flavorNotes:  format?.tip || null,
    drinkPairing: soil?.pairing || null,
    foodPairing:  soil?.food || null,
    soilSetting:  soil?.atmosphere || null,
    musicVibe:    soil?.music || null,
    mentorPair:   mentorId || null,
    userMood:     soil?.mood || null,
    occasion:     soil?.theme || null,
    finalRating:  finalRating ?? null,
  }
}

const FIELD_COUNT = 21

export function calculateUniquenessScore(signature) {
  if (!signature) return { score: 0, category: 'Incomplete', filledFields: 0, totalFields: FIELD_COUNT }

  const fields = ['cigarName', 'country', 'region', 'wrapper', 'binder', 'filler', 'origin', 'aging',
    'vitola', 'ringGauge', 'length', 'burnTime', 'strength', 'body', 'flavorNotes',
    'drinkPairing', 'foodPairing', 'soilSetting', 'musicVibe', 'mentorPair', 'userMood']
  const filledFields = fields.filter(f => Boolean(signature[f])).length

  let score = Math.round((filledFields / fields.length) * 100)

  const regionId = signature.region ? signature.region.toLowerCase().replace(/[^a-z]/g, '') : ''
  if (RARE_REGIONS.has(regionId) || (signature.region && signature.region.includes('Andrés'))) score += 20
  if (signature.foodPairing && RARE_FOOD.has(signature.foodPairing)) score += 15
  if (signature.drinkPairing && signature.foodPairing && signature.musicVibe) score += 10

  const category = score >= 110 ? 'Legendary Blend' : score >= 85 ? 'Rare Blend' : score >= 60 ? 'Distinct Blend' : score >= 30 ? 'Emerging Blend' : 'Incomplete'

  return { score, category, filledFields, totalFields: fields.length }
}
