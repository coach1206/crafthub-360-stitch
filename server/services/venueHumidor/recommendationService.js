/**
 * Venue Humidor 1B-2B-5 — inventory-aware cigar recommendations,
 * pairing, alternatives, and assisted-selling support.
 *
 * Reuses canonical sources only: venue_cigar_products (catalog),
 * inventoryService.getProductAvailability() (live availability — never
 * cached), venue_cigar_passport_acquisitions + venue_cigar_acquisition_notes
 * (completed-purchase customer signals), and the shared, already-
 * idempotent smokecraft_progression_events ledger for analytics (via
 * recordEvent(), same pattern as venueHumidorEventService.js). The
 * pairing-category vocabulary (HARMONY / STRENGTH_SCORE / TYPE_STRENGTH)
 * is imported unchanged from the existing pairing engine data module
 * (src/utils/pairingEngine.js) rather than re-invented — that module is
 * explicit that no real beverage-product data exists in this system, so
 * beverage pairing here works only at the category level (e.g.
 * "Whiskey"), never a fabricated specific drink.
 */
import { getDb } from '../../db/connection.js'
import { getProductAvailability } from './inventoryService.js'
import { recordEvent } from '../smokecraft/progressionEventService.js'
import { HARMONY, STRENGTH_SCORE, TYPE_STRENGTH, PAIRING_CATEGORIES } from '../../../src/utils/pairingEngine.js'

export class RecommendationError extends Error {
  constructor(code) { super(code); this.code = code }
}

export const CANONICAL_RECOMMENDATION_EVENT_TYPES = [
  'venue_humidor_recommendation_requested',
  'venue_humidor_recommendation_shown',
  'venue_humidor_recommendation_accepted',
  'venue_humidor_recommendation_declined',
  'venue_humidor_recommendation_alternative_shown',
  'venue_humidor_recommendation_out_of_stock_excluded',
]

// DB strength/body values -> 1..5 rank, comparable to preference input
// (which also uses this 1..5 scale from the client). Kept local to this
// service — the shared pairingEngine's STRENGTH_SCORE uses a distinct
// 4-point capitalized-label scale (Mild/Medium/Medium-Full/Full) for
// abstract pairing-category intensity, not real product strength.
const STRENGTH_RANK = { mild: 1, mild_medium: 2, medium: 3, medium_full: 4, full: 5 }
const BODY_RANK = { light: 1, light_medium: 2, medium: 3, medium_full: 4, full: 5 }

function normalizeNote(s) { return String(s || '').trim().toLowerCase() }

async function recordRecommendationEvent({ guestReference, venueId, eventType, payload, idempotencyKey }) {
  if (!CANONICAL_RECOMMENDATION_EVENT_TYPES.includes(eventType)) {
    throw new RecommendationError('non_canonical_recommendation_event_type')
  }
  const { event, deduplicated } = await recordEvent({
    guestReference, venueId, sourceScreen: 'venue_humidor_recommendations', sourceRoute: '/smokecraft/humidor/recommendations',
    eventType, payload: payload || {}, idempotencyKey,
  })
  return { auditId: event.id, serverTimestamp: event.created_at, deduplicated }
}

async function listVenueProducts(venueId) {
  const db = getDb()
  const { rows } = await db.query(
    `SELECT * FROM venue_cigar_products WHERE venue_id = $1 AND is_archived = false ORDER BY name ASC`,
    [venueId]
  )
  return rows
}

async function withAvailability(products) {
  const out = []
  for (const p of products) {
    const availability = await getProductAvailability(p.product_id).catch(() => ({ availableQuantity: 0 }))
    out.push({ ...p, availableQuantity: availability.availableQuantity || 0 })
  }
  return out
}

function isPurchaseEligible(p) {
  return p.is_customer_visible && !p.is_archived && p.status !== 'discontinued' && p.status !== 'sold_out' && p.availableQuantity > 0
}

async function getCustomerSignals(customerReference) {
  if (!customerReference) return { strengthLikes: [], bodyLikes: [], flavorLikes: [], countryLikes: [], hasHistory: false }
  const db = getDb()
  const { rows } = await db.query(
    `SELECT a.*, p.strength, p.body, p.flavor_notes, p.country, n.rating
     FROM venue_cigar_passport_acquisitions a
     JOIN venue_cigar_products p ON p.product_id = a.product_id
     LEFT JOIN venue_cigar_acquisition_notes n ON n.acquisition_id = a.acquisition_id
     WHERE a.customer_reference = $1 AND a.verified_fulfillment = true`,
    [customerReference]
  )
  const liked = rows.filter(r => r.rating == null || r.rating >= 4)
  return {
    hasHistory: rows.length > 0,
    strengthLikes: liked.map(r => r.strength).filter(Boolean),
    bodyLikes: liked.map(r => r.body).filter(Boolean),
    flavorLikes: liked.flatMap(r => r.flavor_notes || []).map(normalizeNote),
    countryLikes: liked.map(r => r.country).filter(Boolean),
  }
}

/** Transparent, explainable scoring — never presented as AI or scientific certainty. */
function scoreProduct(product, preferences, signals, beverageCategory) {
  let score = 50
  const reasons = []
  const cautions = []

  const prefStrength = preferences?.preferredStrength ? STRENGTH_RANK[preferences.preferredStrength] : null
  const prodStrength = STRENGTH_RANK[product.strength] || null
  if (prefStrength && prodStrength) {
    const diff = Math.abs(prefStrength - prodStrength)
    score += (2 - Math.min(diff, 2)) * 10
    if (diff === 0) reasons.push('Matches your preferred strength')
    else if (diff >= 2) cautions.push('Stronger or milder than your usual preference')
  }

  const prefBody = preferences?.preferredBody ? BODY_RANK[preferences.preferredBody] : null
  const prodBody = BODY_RANK[product.body] || null
  if (prefBody && prodBody) {
    const diff = Math.abs(prefBody - prodBody)
    score += (2 - Math.min(diff, 2)) * 6
    if (diff === 0) reasons.push('Matches your preferred body')
  }

  const flavorNotes = (product.flavor_notes || []).map(normalizeNote)
  const prefFlavors = (preferences?.flavorFamilies || []).map(normalizeNote)
  const flavorOverlap = flavorNotes.filter(f => prefFlavors.includes(f))
  if (flavorOverlap.length) { score += flavorOverlap.length * 5; reasons.push(`Matches your preferred flavor: ${flavorOverlap.join(', ')}`) }

  if (beverageCategory && HARMONY[beverageCategory]) {
    const wanted = HARMONY[beverageCategory].notes.map(normalizeNote)
    const clashes = HARMONY[beverageCategory].clashes.map(normalizeNote)
    const complements = flavorNotes.filter(f => wanted.includes(f))
    const conflicts = flavorNotes.filter(f => clashes.includes(f))
    if (complements.length) { score += complements.length * 8; reasons.push(`Complements a ${beverageCategory.toLowerCase()} pairing`) }
    if (conflicts.length) { score -= conflicts.length * 6; cautions.push(`May clash with a ${beverageCategory.toLowerCase()} pairing`) }
    const beverageIntensity = TYPE_STRENGTH[beverageCategory]
    if (beverageIntensity && prodStrength) {
      const abstractStrengthDiff = Math.abs(Math.round(prodStrength / 1.25) - beverageIntensity)
      if (abstractStrengthDiff === 0) { score += 6; reasons.push('Intensity matches the selected beverage') }
    }
  } else if (beverageCategory) {
    cautions.push('Beverage pairing data unavailable for this category')
  }

  if (preferences?.smokingDurationPref && product.smoke_time_minutes) {
    const diff = Math.abs(preferences.smokingDurationPref - product.smoke_time_minutes)
    if (diff <= 15) reasons.push(`Fits your ${preferences.smokingDurationPref}-minute smoking window`)
  }

  if (preferences?.budgetMinCents != null || preferences?.budgetMaxCents != null) {
    const min = preferences.budgetMinCents ?? 0
    const max = preferences.budgetMaxCents ?? Infinity
    if (product.price_cents >= min && product.price_cents <= max) { score += 8; reasons.push('Within your selected budget') }
    else cautions.push('Outside your selected budget range')
  }

  if (preferences?.preferredVitola && product.vitola === preferences.preferredVitola) { score += 5; reasons.push('Matches your preferred vitola') }
  if (preferences?.preferredCountry && product.country === preferences.preferredCountry) { score += 5; reasons.push('Matches your preferred origin') }

  if (signals.hasHistory) {
    if (signals.strengthLikes.includes(product.strength)) { score += 10; reasons.push('Similar to a cigar you rated highly') }
    if (signals.flavorLikes.some(f => flavorNotes.includes(f))) { score += 6; reasons.push('Shares flavor notes with a cigar you enjoyed') }
    if (signals.countryLikes.includes(product.country)) { score += 4 }
  } else {
    cautions.push('Based on your selected answers — no purchase history yet')
  }

  if (product.is_staff_pick) reasons.push('Staff pick at this venue')
  if (product.is_featured) reasons.push('Featured selection')
  if (product.is_limited_release) cautions.push('Limited release — inventory may be low')
  if (product.availableQuantity > 0 && product.availableQuantity <= 3) cautions.push('Limited inventory remaining')

  if (product.experience_level && preferences?.experienceLevel && product.experience_level !== preferences.experienceLevel) {
    cautions.push(`Suited for a ${product.experience_level} smoker`)
  }

  const confidence = signals.hasHistory && (prefStrength || flavorOverlap.length) ? 'high' : (prefStrength || flavorOverlap.length || beverageCategory) ? 'medium' : 'low'

  return { score: Math.max(0, Math.round(score)), reasons, cautions, confidence }
}

export async function getRecommendations({ venueId, customerReference, preferences = {}, beverageCategory, limit = 12 }) {
  if (!venueId) throw new RecommendationError('venue_required')
  const allProducts = await withAvailability(await listVenueProducts(venueId))
  const eligible = allProducts.filter(isPurchaseEligible)
  const outOfStock = allProducts.filter(p => p.is_customer_visible && !isPurchaseEligible(p))
  const signals = await getCustomerSignals(customerReference)

  const ranked = eligible
    .map(p => ({ product: p, ...scoreProduct(p, preferences, signals, beverageCategory) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  const excludedOutOfStock = outOfStock.slice(0, 6).map(p => ({
    product: p, reason: p.availableQuantity <= 0 ? 'out_of_stock' : p.status === 'discontinued' ? 'discontinued' : 'unavailable',
  }))

  return {
    results: ranked.map(r => ({
      productId: r.product.product_id, name: r.product.name, brand: r.product.brand,
      vitola: r.product.vitola, strength: r.product.strength, body: r.product.body,
      country: r.product.country, priceCents: r.product.price_cents, availableQuantity: r.product.availableQuantity,
      primaryImageUrl: r.product.primary_image_url, smokeTimeMinutes: r.product.smoke_time_minutes,
      isFeatured: r.product.is_featured, isStaffPick: r.product.is_staff_pick, isLimitedRelease: r.product.is_limited_release,
      score: r.score, reasons: r.reasons, cautions: r.cautions, confidence: r.confidence,
    })),
    outOfStock: excludedOutOfStock.map(e => ({
      productId: e.product.product_id, name: e.product.name, brand: e.product.brand, reason: e.reason,
    })),
    signalsUsed: { hasPurchaseHistory: signals.hasHistory, coldStart: !signals.hasHistory && Object.keys(preferences).length === 0 },
    beverageCategory: beverageCategory || null,
    beverageDataAvailable: beverageCategory ? Boolean(HARMONY[beverageCategory]) : null,
  }
}

export async function getAlternatives({ venueId, productId, limit = 5 }) {
  const db = getDb()
  const { rows } = await db.query(`SELECT * FROM venue_cigar_products WHERE product_id = $1 AND venue_id = $2`, [productId, venueId])
  let target = rows[0]
  if (!target) throw new RecommendationError('product_not_found')
  const targetAvailability = await getProductAvailability(productId).catch(() => ({ availableQuantity: 0 }))
  target = { ...target, availableQuantity: targetAvailability.availableQuantity || 0 }

  const allProducts = await withAvailability(await listVenueProducts(venueId))
  const eligible = allProducts.filter(p => isPurchaseEligible(p) && p.product_id !== productId)

  const targetStrength = STRENGTH_RANK[target.strength] || 0
  const targetBody = BODY_RANK[target.body] || 0
  const targetFlavors = (target.flavor_notes || []).map(normalizeNote)

  const scored = eligible.map(p => {
    const strengthDiff = Math.abs((STRENGTH_RANK[p.strength] || 0) - targetStrength)
    const bodyDiff = Math.abs((BODY_RANK[p.body] || 0) - targetBody)
    const flavorOverlap = (p.flavor_notes || []).map(normalizeNote).filter(f => targetFlavors.includes(f)).length
    const vitolaMatch = p.vitola === target.vitola ? 1 : 0
    const countryMatch = p.country === target.country ? 1 : 0
    const priceDiff = Math.abs(p.price_cents - target.price_cents)
    const similarity = (4 - Math.min(strengthDiff, 4)) * 3 + (4 - Math.min(bodyDiff, 4)) * 2 + flavorOverlap * 4 + vitolaMatch * 3 + countryMatch * 2 - priceDiff / 500
    return {
      product: p, similarity,
      strongerOrMilder: strengthDiff === 0 ? 'similar strength' : (STRENGTH_RANK[p.strength] > targetStrength ? 'stronger' : 'milder'),
      priceComparison: p.price_cents === target.price_cents ? 'similar price' : (p.price_cents > target.price_cents ? 'more expensive' : 'less expensive'),
      durationDiff: (p.smoke_time_minutes && target.smoke_time_minutes) ? p.smoke_time_minutes - target.smoke_time_minutes : null,
      isExactMatch: strengthDiff === 0 && bodyDiff === 0 && flavorOverlap === (target.flavor_notes || []).length && vitolaMatch === 1,
    }
  }).sort((a, b) => b.similarity - a.similarity).slice(0, limit)

  return {
    targetProductId: productId,
    targetUnavailableReason: target.is_archived ? 'archived' : (target.status === 'discontinued' ? 'discontinued' : (target.availableQuantity <= 0 ? 'out_of_stock' : null)),
    alternatives: scored.map(a => ({
      productId: a.product.product_id, name: a.product.name, brand: a.product.brand,
      priceCents: a.product.price_cents, availableQuantity: a.product.availableQuantity,
      strongerOrMilder: a.strongerOrMilder, priceComparison: a.priceComparison, durationDiffMinutes: a.durationDiff,
      isExactMatch: a.isExactMatch,
      explanation: `${a.isExactMatch ? 'A very close match' : 'A similar alternative'} — ${a.strongerOrMilder}, ${a.priceComparison}${a.durationDiff != null ? (a.durationDiff === 0 ? ', same smoking time' : `, ${Math.abs(a.durationDiff)} min ${a.durationDiff > 0 ? 'longer' : 'shorter'}`) : ''}.`,
    })),
  }
}

export async function savePreferences(customerReference, preferences, idempotencyKey) {
  if (!customerReference) throw new RecommendationError('customer_required')
  const db = getDb()
  const {
    preferredStrength, preferredBody, flavorFamilies, aromaFamilies, experienceLevel,
    smokingDurationPref, occasion, timeOfDay, beverageCategory, budgetMinCents, budgetMaxCents,
    preferredVitola, preferredCountry, likedProductIds, dislikedProductIds, newVsFamiliar,
  } = preferences || {}

  const { rows } = await db.query(
    `INSERT INTO venue_cigar_recommendation_preferences
       (customer_reference, preferred_strength, preferred_body, flavor_families, aroma_families,
        experience_level, smoking_duration_pref, occasion, time_of_day, beverage_category,
        budget_min_cents, budget_max_cents, preferred_vitola, preferred_country,
        liked_product_ids, disliked_product_ids, new_vs_familiar, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
     ON CONFLICT (customer_reference) DO UPDATE SET
       preferred_strength = EXCLUDED.preferred_strength, preferred_body = EXCLUDED.preferred_body,
       flavor_families = EXCLUDED.flavor_families, aroma_families = EXCLUDED.aroma_families,
       experience_level = EXCLUDED.experience_level, smoking_duration_pref = EXCLUDED.smoking_duration_pref,
       occasion = EXCLUDED.occasion, time_of_day = EXCLUDED.time_of_day, beverage_category = EXCLUDED.beverage_category,
       budget_min_cents = EXCLUDED.budget_min_cents, budget_max_cents = EXCLUDED.budget_max_cents,
       preferred_vitola = EXCLUDED.preferred_vitola, preferred_country = EXCLUDED.preferred_country,
       liked_product_ids = EXCLUDED.liked_product_ids, disliked_product_ids = EXCLUDED.disliked_product_ids,
       new_vs_familiar = EXCLUDED.new_vs_familiar, idempotency_key = EXCLUDED.idempotency_key, updated_at = now()
     RETURNING *`,
    [customerReference, preferredStrength || null, preferredBody || null, JSON.stringify(flavorFamilies || []),
     JSON.stringify(aromaFamilies || []), experienceLevel || null, smokingDurationPref || null, occasion || null,
     timeOfDay || null, beverageCategory || null, budgetMinCents ?? null, budgetMaxCents ?? null,
     preferredVitola || null, preferredCountry || null, JSON.stringify(likedProductIds || []),
     JSON.stringify(dislikedProductIds || []), newVsFamiliar || null, idempotencyKey || null]
  )
  return rows[0]
}

export async function getPreferences(customerReference) {
  const db = getDb()
  const { rows } = await db.query(`SELECT * FROM venue_cigar_recommendation_preferences WHERE customer_reference = $1`, [customerReference])
  return rows[0] || null
}

export async function recordAssistedSellingOutcome({ venueId, staffActorId, staffActorRole, customerReference, productId, outcome, notes, idempotencyKey }) {
  if (!idempotencyKey) throw new RecommendationError('idempotency_key_required')
  const db = getDb()
  const { rows } = await db.query(
    `INSERT INTO venue_cigar_assisted_selling_outcomes
       (venue_id, staff_actor_id, staff_actor_role, customer_reference, product_id, outcome, notes, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (idempotency_key) DO NOTHING
     RETURNING *`,
    [venueId, staffActorId, staffActorRole, customerReference || null, productId, outcome, notes || null, idempotencyKey]
  )
  if (rows[0]) return { outcome: rows[0], deduplicated: false }
  const { rows: existing } = await db.query(`SELECT * FROM venue_cigar_assisted_selling_outcomes WHERE idempotency_key = $1`, [idempotencyKey])
  return { outcome: existing[0], deduplicated: true }
}

export async function recordRecommendationAnalytics({ guestReference, venueId, eventType, payload, idempotencyKey }) {
  return recordRecommendationEvent({ guestReference, venueId, eventType, payload, idempotencyKey })
}

export { PAIRING_CATEGORIES }
