/**
 * Venue Humidor 1B-2B-5 — staff-assisted selling and tobacconist/mentor
 * recommendation support. Reuses recommendationService.js's own
 * inventory-aware scoring — no separate staff-only recommendation
 * logic. Mentor is read-only (enforced by requireVenueRead vs
 * requireVenueWrite at the router tier); no mutation route here is
 * reachable by mentor.
 */
import * as recSvc from '../services/venueHumidor/recommendationService.js'

function sendError(res, err, fallback = 400) {
  const statusByCode = { venue_required: 400, customer_required: 400, product_not_found: 404, idempotency_key_required: 400 }
  const code = err.code || 'internal_error'
  res.status(statusByCode[code] || fallback).json({ success: false, error: code })
}

export async function handleAssistedRecommendations(req, res) {
  try {
    const venueId = req.params.venueId
    const { customerReference, preferences, beverageCategory, limit } = req.body || {}
    const result = await recSvc.getRecommendations({ venueId, customerReference: customerReference || null, preferences, beverageCategory, limit })
    res.json({ success: true, ...result })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleAssistedAlternatives(req, res) {
  try {
    const venueId = req.params.venueId
    const result = await recSvc.getAlternatives({ venueId, productId: req.params.productId })
    res.json({ success: true, ...result })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleRecordOutcome(req, res) {
  try {
    const venueId = req.params.venueId
    const { customerReference, productId, outcome, notes, idempotencyKey } = req.body || {}
    if (!productId || !outcome) return res.status(400).json({ success: false, error: 'product_and_outcome_required' })
    const { outcome: row, deduplicated } = await recSvc.recordAssistedSellingOutcome({
      venueId, staffActorId: req.user?.id, staffActorRole: req.venueMembershipType,
      customerReference: customerReference || null, productId, outcome, notes, idempotencyKey,
    })
    res.json({ success: true, outcome: row, deduplicated })
  } catch (err) { sendError(res, err, 500) }
}
