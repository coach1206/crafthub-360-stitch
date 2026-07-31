/**
 * Venue Humidor 1B-2B-5 — customer-facing inventory-aware
 * recommendations, pairing, and alternatives.
 */
import * as recSvc from '../services/venueHumidor/recommendationService.js'

function guestRef(req) {
  if (!req.smokecraftIdentity) return null
  return req.smokecraftIdentity.type === 'user' ? `user:${req.smokecraftIdentity.id}` : req.smokecraftIdentity.id
}

function sendError(res, err, fallback = 400) {
  const statusByCode = {
    venue_required: 400, customer_required: 400, product_not_found: 404,
    idempotency_key_required: 400, non_canonical_recommendation_event_type: 400,
  }
  const code = err.code || 'internal_error'
  res.status(statusByCode[code] || fallback).json({ success: false, error: code })
}

export async function handleGetRecommendations(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const { venueId, preferences, beverageCategory, limit } = req.body || {}
    if (!venueId) return res.status(400).json({ success: false, error: 'venue_required' })
    const result = await recSvc.getRecommendations({ venueId, customerReference: ref, preferences, beverageCategory, limit })
    const idempotencyKey = req.body?.idempotencyKey || `rec-req-${ref}-${venueId}-${Date.now()}`
    await recSvc.recordRecommendationAnalytics({
      guestReference: ref, venueId, eventType: 'venue_humidor_recommendation_requested',
      payload: { preferences: preferences || {}, beverageCategory: beverageCategory || null, resultCount: result.results.length },
      idempotencyKey,
    })
    if (result.results.length) {
      await recSvc.recordRecommendationAnalytics({
        guestReference: ref, venueId, eventType: 'venue_humidor_recommendation_shown',
        payload: { rankedProductIds: result.results.map(r => r.productId) },
        idempotencyKey: `${idempotencyKey}-shown`,
      })
    }
    res.json({ success: true, ...result })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleGetAlternatives(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const venueId = req.query.venueId
    if (!venueId) return res.status(400).json({ success: false, error: 'venue_required' })
    const result = await recSvc.getAlternatives({ venueId, productId: req.params.productId })
    if (result.alternatives.length) {
      await recSvc.recordRecommendationAnalytics({
        guestReference: ref, venueId, eventType: 'venue_humidor_recommendation_alternative_shown',
        payload: { targetProductId: req.params.productId, alternativeProductIds: result.alternatives.map(a => a.productId) },
        idempotencyKey: `rec-alt-${ref}-${req.params.productId}-${Date.now()}`,
      })
    }
    res.json({ success: true, ...result })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleSavePreferences(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const { preferences, idempotencyKey } = req.body || {}
    const saved = await recSvc.savePreferences(ref, preferences, idempotencyKey)
    res.json({ success: true, preferences: saved })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleGetMyPreferences(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const preferences = await recSvc.getPreferences(ref)
    res.json({ success: true, preferences })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleRecordOutcome(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const { venueId, productId, outcome, idempotencyKey } = req.body || {}
    if (!venueId) return res.status(400).json({ success: false, error: 'venue_required' })
    const eventType = outcome === 'accepted' ? 'venue_humidor_recommendation_accepted' : 'venue_humidor_recommendation_declined'
    const result = await recSvc.recordRecommendationAnalytics({
      guestReference: ref, venueId, eventType, payload: { productId }, idempotencyKey: idempotencyKey || `rec-outcome-${ref}-${productId}-${Date.now()}`,
    })
    res.json({ success: true, ...result })
  } catch (err) { sendError(res, err, 500) }
}
