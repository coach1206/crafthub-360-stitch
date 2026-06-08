/**
 * POS 3 Recommendation Service — Phase 9
 * Builds intelligent pairing, upsell, and inventory-aware recommendations
 * by combining guest session data, active order items, and real-time inventory.
 */

import { isDbAvailable, query } from '../db/connection.js'

const PAIRING_RULES = [
  // [cigar category, spirit tags, recommendation title, confidence base]
  { craft: 'Dominican',  flavors: ['vanilla','caramel'],      spirit: 'Bourbon',  title: 'Recommend a Dominican cigar with a bourbon pairing',   conf: 0.88 },
  { craft: 'Nicaraguan', flavors: ['warm-spice','pepper'],    spirit: 'Bourbon',  title: 'Complement Nicaraguan tobacco with a spiced bourbon',   conf: 0.85 },
  { craft: 'Cuban',      flavors: ['sherry','dried-fruit'],   spirit: 'Whiskey',  title: 'Pair a Cuban cigar with a sherry-aged Scotch',          conf: 0.91 },
  { craft: 'Honduran',   flavors: ['leather','toffee'],       spirit: 'Bourbon',  title: 'A leather-forward Honduran cigar calls for Double Oaked', conf: 0.82 },
  { craft: 'Islay',      flavors: ['peat','smoke'],           spirit: 'Whiskey',  title: 'Match smoky Islay Scotch with a full-body cigar',        conf: 0.87 },
]

/**
 * Builds a pairing recommendation from a guest session + active order.
 */
export function buildPairingRecommendation(session, order) {
  const mentorCountry = session?.mentor?.country || session?.craft?.origin || null
  const flavorPref    = session?.flavorProfile   || session?.flavors       || []
  const zone          = order?.tableZone         || 'Main Lounge'
  const isVip         = zone === 'VIP Alcove'

  // Find best rule match
  let bestRule = PAIRING_RULES[0]
  let bestScore = 0

  for (const rule of PAIRING_RULES) {
    let score = 0
    if (mentorCountry && rule.craft.toLowerCase().includes(mentorCountry.toLowerCase())) score += 0.3
    if (Array.isArray(flavorPref)) {
      const matches = flavorPref.filter(f => rule.flavors.some(rf => rf.includes(f.toLowerCase())))
      score += matches.length * 0.2
    }
    score += rule.conf * 0.5
    if (score > bestScore) { bestScore = score; bestRule = rule }
  }

  const confidence = Math.min(0.99, bestRule.conf + (isVip ? 0.05 : 0) + (mentorCountry ? 0.03 : 0))

  const recommendedItems = isVip
    ? [{ providerItemId: 'vp-001', name: 'Opus X + Pappy 15yr Pairing', price: 149, category: 'VIP Pairings' }]
    : [
        { providerItemId: 'ci-004', name: 'Romeo y Julieta Reserva Real', price: 34, category: 'Premium Cigars' },
        { providerItemId: 'bo-002', name: "Blanton's Single Barrel",      price: 26, category: 'Bourbon'        },
      ]

  return {
    recommendationType: 'pairing',
    title:              bestRule.title,
    description: buildDescription(session, order, bestRule),
    items:              recommendedItems,
    confidenceScore:    parseFloat(confidence.toFixed(3)),
    reasonCodes:        buildReasonCodes(session, order),
    zone,
    isVip,
  }
}

/**
 * Builds an upsell recommendation based on order value and inventory.
 */
export function buildUpsellRecommendation(session, order, inventory = []) {
  const total = order?.total || 0
  const isHighValue = total >= 150

  const lowStockFeatured = inventory
    .filter(i => i.reorderRecommended && i.category === 'VIP Pairings')
    .slice(0, 1)

  const upsellItem = lowStockFeatured.length > 0
    ? { providerItemId: lowStockFeatured[0].providerItemId, name: lowStockFeatured[0].name, urgency: 'last_few' }
    : { providerItemId: 'co-003', name: 'Smoke & Honey Mezcal', price: 28, note: 'Guest-favorite cocktail pairing' }

  return {
    recommendationType: 'upsell',
    title:              isHighValue ? 'Guest is high-value — offer a premium upgrade' : 'Suggest a signature cocktail to complement the order',
    description:        `Current order total: $${total.toFixed(2)}. ${upsellItem.urgency === 'last_few' ? 'Limited availability — last few remaining.' : 'Popular pairing for this order profile.'}`,
    items:              [upsellItem],
    confidenceScore:    isHighValue ? 0.84 : 0.72,
    reasonCodes:        ['order_value_signal', upsellItem.urgency ? 'inventory_scarcity' : 'popular_pairing'],
  }
}

/**
 * Builds an inventory-aware recommendation for staff.
 */
export function buildInventoryAwareRecommendation(session, inventory = []) {
  const lowStock = inventory.filter(i => i.reorderRecommended)
  const featured = inventory.filter(i => !i.reorderRecommended && ['VIP Pairings','Premium Cigars'].includes(i.category)).slice(0, 2)

  return {
    recommendationType: 'inventory_alert',
    title:              `${lowStock.length} item${lowStock.length !== 1 ? 's' : ''} below reorder threshold`,
    description:        lowStock.length > 0
      ? `Low stock: ${lowStock.map(i => i.name).join(', ')}`
      : 'All inventory levels are adequate.',
    items:              lowStock.map(i => ({ providerItemId: i.providerItemId, name: i.name, currentStock: i.currentStock, threshold: i.lowStockThreshold })),
    featuredItems:      featured,
    confidenceScore:    1.0,
    reasonCodes:        ['inventory_signal', 'reorder_flag'],
  }
}

/**
 * Calculates a confidence score for a recommendation based on session richness.
 */
export function calculateRecommendationConfidence(session, order) {
  let score = 0.5
  if (session?.mentor?.country) score += 0.1
  if (session?.flavorProfile?.length > 0) score += 0.15
  if (session?.craft?.category) score += 0.1
  if (order?.total > 100) score += 0.05
  if (order?.tableZone === 'VIP Alcove') score += 0.05
  if (session?.passportLevel > 2) score += 0.05
  return parseFloat(Math.min(0.99, score).toFixed(3))
}

/**
 * Prepares a complete staff recommendation payload.
 */
export function prepareStaffRecommendationPayload(session, order, inventory = []) {
  const pairing  = buildPairingRecommendation(session, order)
  const upsell   = buildUpsellRecommendation(session, order, inventory)
  const confidence = calculateRecommendationConfidence(session, order)

  return {
    sessionId:   session?.sessionId || null,
    orderId:     order?.providerOrderId || null,
    tableNumber: order?.tableNumber || null,
    staffId:     order?.staffId || null,
    generatedAt: new Date().toISOString(),
    confidence,
    recommendations: [pairing, upsell],
    summary: `Guest engagement: ${confidence > 0.8 ? 'HIGH' : confidence > 0.6 ? 'MEDIUM' : 'LOW'}. ${pairing.title}.`,
  }
}

/**
 * Persists a recommendation to the database.
 */
export async function saveRecommendation(rec) {
  if (!isDbAvailable()) return null
  try {
    const result = await query(
      `INSERT INTO pos3_recommendations
         (session_id, provider, provider_order_id, recommendation_type, title, description, items, confidence_score)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id`,
      [
        rec.sessionId, rec.provider || 'prototype', rec.orderId,
        rec.recommendationType, rec.title, rec.description,
        JSON.stringify(rec.items || []),
        rec.confidenceScore,
      ]
    )
    return result.rows[0]?.id
  } catch (err) {
    console.warn('[pos3Rec] saveRecommendation:', err.message)
    return null
  }
}

// ── Private helpers ───────────────────────────────────────────

function buildDescription(session, order, rule) {
  const parts = []
  if (session?.mentor?.country) parts.push(`${session.mentor.country} mentor selection`)
  if (session?.craft?.level) parts.push(`${session.craft.level} craft level`)
  if (session?.flavorProfile?.length) parts.push(`${session.flavorProfile.join(', ')} flavor profile`)
  if (order?.tableZone) parts.push(`${order.tableZone} seating`)
  return parts.length > 0
    ? `${rule.title}. Context: ${parts.join(' · ')}.`
    : rule.title
}

function buildReasonCodes(session, order) {
  const codes = []
  if (session?.flavorProfile?.length) codes.push('guest_flavor_match')
  if (session?.mentor)                codes.push('mentor_origin_match')
  if (order?.items?.length)           codes.push('order_pairing_match')
  if (order?.tableZone === 'VIP Alcove') codes.push('vip_zone_premium')
  codes.push('inventory_available')
  return codes
}
