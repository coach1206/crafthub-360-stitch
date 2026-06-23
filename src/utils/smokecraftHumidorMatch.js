import { checkAvailability } from '../services/pos3/inventoryAvailabilityService.js'

// Phase 6 — Cigar Recommendation / Humidor Match. Builds the required
// recommendation triad (Best Match / Step-Up Pick / Venue Featured Pick)
// from real session data (profile, format, Seed & Soil, mentors) cross-
// referenced against the same POS3 inventory catalog already used by the
// rest of the app (src/data/pos3/inventoryCatalog.js, via
// inventoryAvailabilityService). No order is placed, no stock is changed,
// and no POS ticket is created here — only a read-only availability check.

const STRENGTH_TIERS = ['Mild', 'Mild-Medium', 'Medium', 'Medium-Full', 'Full']

function strengthTierIndex(strength) {
  const i = STRENGTH_TIERS.indexOf(strength)
  return i === -1 ? 2 : i
}

// Cigar attribute data (brand/country/wrapper/strength/flavor/pairing) is
// editorial cigar-catalog content, the same kind of descriptive text already
// used for cigar formats (Format.jsx) and seed regions (SeedSoil.jsx). The
// sku/name/quantityOnHand fields are the real POS3 inventory record — those
// are never invented here, only read via checkAvailability().
const CIGAR_CATALOG = [
  {
    id: 'padron-1964-maduro',
    sku: 'SKU-CIG-PAD64MAD',
    name: 'Padrón 1964 Anniversary Maduro',
    brand: 'Padrón',
    country: 'Nicaragua',
    wrapper: 'Nicaraguan Maduro',
    strength: 'Full',
    flavorNotes: ['Cocoa & Coffee', 'Earthy', 'Spicy'],
    burnTime: '75–105 minutes',
    formatCategories: ['long-session', 'vip-slow-burn'],
    seedSoilCountries: ['Nicaragua', 'Mexico'],
    pairingSuggestion: 'Pairs well with an aged rum or dark-roast espresso.',
    isVenueFeatured: true,
    // Padrón 1964 Anniversary is also offered in a Torpedo vitola — used for
    // the product shot since the name itself carries no shape keyword.
    shapePhoto: '/assets/smokecraft/cigars/torpedo-figurado.jpg',
  },
  {
    id: 'opusx-robusto',
    sku: 'SKU-CIG-OPUSXROB',
    name: 'Arturo Fuente OpusX Robusto',
    brand: 'Arturo Fuente',
    country: 'Dominican Republic',
    wrapper: 'Dominican Sun Grown',
    strength: 'Full',
    flavorNotes: ['Spicy', 'Woody', 'Nutty'],
    burnTime: '45–60 minutes',
    formatCategories: ['standard-smoke'],
    seedSoilCountries: ['Dominican Republic'],
    pairingSuggestion: 'Pairs well with a peated single malt scotch.',
    isVenueFeatured: false,
    shapePhoto: '/assets/smokecraft/cigars/robusto.jpg',
  },
  {
    id: 'churchill-reserve',
    sku: 'SKU-CIG-CHURCHRES',
    name: 'Hand-Rolled Churchill Reserve',
    brand: 'House Reserve',
    country: 'Dominican Republic',
    wrapper: 'Habano Rosado',
    strength: 'Medium-Full',
    flavorNotes: ['Woody', 'Creamy', 'Sweet'],
    burnTime: '75–105 minutes',
    formatCategories: ['long-session'],
    seedSoilCountries: ['Dominican Republic'],
    pairingSuggestion: 'Pairs well with a barrel-aged Old Fashioned.',
    isVenueFeatured: false,
    shapePhoto: '/assets/smokecraft/cigars/churchill.jpg',
  },
  {
    id: 'oliva-v-melanio-toro',
    sku: 'SKU-CIG-OLIVAVMEL',
    name: 'Oliva Serie V Melanio Toro',
    brand: 'Oliva',
    country: 'Nicaragua',
    wrapper: 'Ecuadorian Habano',
    strength: 'Medium-Full',
    flavorNotes: ['Earthy', 'Cocoa & Coffee', 'Sweet'],
    burnTime: '60–75 minutes',
    formatCategories: ['standard-smoke'],
    seedSoilCountries: ['Nicaragua'],
    pairingSuggestion: 'Pairs well with a reserve Cabernet Sauvignon pour.',
    isVenueFeatured: false,
    shapePhoto: '/assets/smokecraft/cigars/toro.jpg',
  },
]

function scoreCigar(cigar, ctx) {
  const { profile, format, seedSoilCountry, mentorCountries } = ctx
  let score = 0
  const reasons = []

  if (profile?.strengthPreference) {
    const diff = Math.abs(strengthTierIndex(profile.strengthPreference) - strengthTierIndex(cigar.strength))
    if (diff === 0) { score += 30; reasons.push(`matches your ${profile.strengthPreference} strength preference`) }
    else if (diff === 1) { score += 15; reasons.push(`close to your ${profile.strengthPreference} strength preference`) }
  }

  if (format?.category && cigar.formatCategories.includes(format.category)) {
    score += 20
    reasons.push(`fits your selected ${format.name || format.id} format`)
  }

  if (seedSoilCountry && cigar.seedSoilCountries.includes(seedSoilCountry)) {
    score += 20
    reasons.push(`shares the ${seedSoilCountry} origin from your Seed & Soil pairing`)
  }

  const flavorOverlap = Array.isArray(profile?.flavorPreferences)
    ? profile.flavorPreferences.filter(f => cigar.flavorNotes.includes(f))
    : []
  if (flavorOverlap.length > 0) {
    score += Math.min(20, flavorOverlap.length * 10)
    reasons.push(`flavor overlap: ${flavorOverlap.join(', ')}`)
  }

  if (mentorCountries.includes(cigar.country)) {
    score += 10
    reasons.push(`matches a mentor you selected from ${cigar.country}`)
  }

  return { score: Math.min(100, score), reasons }
}

function inventoryStatusFor(sku) {
  const avail = checkAvailability(sku, 1)
  if (avail.status === 'out') return { inventoryStatus: 'Out of Stock', availabilityNote: 'Local demo inventory', available: false }
  if (avail.status === 'low') return { inventoryStatus: 'Low Stock', availabilityNote: 'Local demo inventory', available: true }
  return { inventoryStatus: 'In Stock', availabilityNote: 'Local demo inventory', available: true }
}

function mentorNoteFor(cigar, mentors) {
  const match = mentors.find(m => m.country === cigar.country)
  if (!match) return null
  return `${match.name} (${match.country}) notes this style aligns with their craft.`
}

function buildRecommendation(cigar, recommendationType, ctx, score, reasons, extra = {}) {
  const { available, inventoryStatus, availabilityNote } = inventoryStatusFor(cigar.sku)
  const { profile } = ctx
  return {
    recommendationType,
    cigarId: cigar.id,
    cigarName: cigar.name,
    brand: cigar.brand,
    country: cigar.country,
    cigarCountry: cigar.country,
    cigarType: cigar.id,
    wrapper: cigar.wrapper,
    strength: cigar.strength,
    flavorNotes: cigar.flavorNotes,
    burnTime: cigar.burnTime,
    shapePhoto: cigar.shapePhoto,
    price: null,
    priceStatus: 'Priced at pickup — ask staff for current pricing',
    pairingSuggestion: cigar.pairingSuggestion,
    inventoryStatus,
    availabilityNote,
    mentorNote: mentorNoteFor(cigar, ctx.mentors),
    matchReason: reasons.length ? reasons.join('; ') : 'No profile data yet — complete your profile, format, and Seed & Soil pairing for a stronger match.',
    matchScore: score,
    experienceFit: profile?.experienceLevel || null,
    budgetFit: profile?.budgetRange || null,
    occasionFit: profile?.occasion || null,
    seedSoilFit: ctx.seedSoilCountry ? cigar.seedSoilCountries.includes(ctx.seedSoilCountry) : null,
    posActionStatus: 'Saved to local session',
    available,
    ...extra,
  }
}

/**
 * Computes the Phase 6 recommendation triad from real session data only.
 * Any missing upstream data (no profile, no format, no Seed & Soil pairing,
 * no mentors) degrades the match score and reasoning honestly rather than
 * inventing data.
 */
export function computeHumidorRecommendations(session) {
  const profile = session?.profile || null
  const format = session?.smokeCraft?.selectedFormat || null
  // Seed & Soil only persists a region id (session.smokecraftSeedSoil.seedRegionId),
  // not the full region object — the same Phase 3 data-shape gap already
  // documented in the protocol audit for the Phase 12 stamp payload. This map
  // mirrors the real REGIONS country values from SeedSoil.jsx, not invented data.
  const SEED_REGION_COUNTRIES = { vuelta: 'Cuba', jalapa: 'Nicaragua', esteli: 'Nicaragua', sanandres: 'Mexico' }
  const seedSoilCountry = SEED_REGION_COUNTRIES[session?.smokecraftSeedSoil?.seedRegionId] || null
  const mentors = Array.isArray(session?.mentors) ? session.mentors : []
  const mentorCountries = mentors.map(m => m.country).filter(Boolean)

  const ctx = { profile, format, seedSoilCountry, mentors, mentorCountries }

  const scored = CIGAR_CATALOG.map(cigar => ({ cigar, ...scoreCigar(cigar, ctx) }))
    .sort((a, b) => b.score - a.score)

  const bestEntry = scored[0]
  const bestMatch = buildRecommendation(bestEntry.cigar, 'best-match', ctx, bestEntry.score, bestEntry.reasons)

  const bestTier = strengthTierIndex(bestEntry.cigar.strength)
  const stepUpCandidates = scored.filter(s => s.cigar.id !== bestEntry.cigar.id && strengthTierIndex(s.cigar.strength) > bestTier)
  const stepUpEntry = stepUpCandidates[0] || scored.find(s => s.cigar.id !== bestEntry.cigar.id) || bestEntry
  const stepUpReason = strengthTierIndex(stepUpEntry.cigar.strength) > bestTier
    ? `A step up in strength from your Best Match (${bestEntry.cigar.strength} → ${stepUpEntry.cigar.strength}) to help you grow your palate.`
    : `A different profile from your Best Match (${stepUpEntry.cigar.wrapper}) worth exploring next.`
  const stepUp = buildRecommendation(stepUpEntry.cigar, 'step-up-pick', ctx, stepUpEntry.score, stepUpEntry.reasons, { stepUpReason })

  const featuredEntry = scored.find(s => s.cigar.isVenueFeatured) || scored[scored.length - 1]
  const venueFeatureReason = featuredEntry.score >= 40
    ? 'Venue-promoted pick that also fits your profile.'
    : 'Venue-promoted pick — lower match to your current profile, shown honestly rather than hidden.'
  const venueFeatured = buildRecommendation(featuredEntry.cigar, 'venue-featured-pick', ctx, featuredEntry.score, featuredEntry.reasons, { venueFeatureReason })

  return {
    bestMatch,
    stepUp,
    venueFeatured,
    dataCompleteness: {
      hasProfile: Boolean(profile?.experienceLevel || profile?.strengthPreference),
      hasFormat: Boolean(format),
      hasSeedSoil: Boolean(seedSoilCountry),
      hasMentors: mentors.length > 0,
    },
    calculatedAt: Date.now(),
  }
}
