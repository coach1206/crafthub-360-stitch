import * as svc from '../services/smokecraft/pairingEngineService.js'

function sendError(res, err, fallback = 400) {
  const statusByCode = { pairing_type_required: 400, not_found: 404 }
  res.status(statusByCode[err.code] || fallback).json({ success: false, error: err.code || 'internal_error' })
}

function guestRef(req) {
  return req.goldenBoxGuestReference || null
}

function extractInput(body) {
  return {
    cigarShape: body.cigarShape || null,
    wrapper: body.wrapper || null,
    origin: body.origin || null,
    strength: body.strength || null,
    pairingType: body.pairingType || null,
    flavorNotes: Array.isArray(body.flavorNotes) ? body.flavorNotes : [],
    pairingGoal: body.pairingGoal || null,
  }
}

export async function handleRecommend(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const input = extractInput(req.body || {})
    if (!input.pairingType) return res.status(400).json({ success: false, error: 'pairing_type_required' })
    const result = await svc.recommend({ guestReference: ref, sourceRoute: req.body?.sourceRoute || null, input })
    res.json({ success: true, ...result })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleRank(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const input = extractInput(req.body || {})
    const results = await svc.rank({ guestReference: ref, sourceRoute: req.body?.sourceRoute || null, input })
    res.json({ success: true, results })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleSave(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const { idempotencyKey, learnerRating, learnerNotes } = req.body || {}
    if (!idempotencyKey || typeof idempotencyKey !== 'string' || idempotencyKey.length < 8) {
      return res.status(400).json({ success: false, error: 'idempotency_key_required' })
    }
    const input = extractInput(req.body || {})
    if (!input.pairingType) return res.status(400).json({ success: false, error: 'pairing_type_required' })
    const result = await svc.savePairing({ guestReference: ref, sourceRoute: req.body?.sourceRoute || null, input, idempotencyKey, learnerRating, learnerNotes })
    res.status(result.alreadySaved ? 200 : 201).json({ success: true, save: result.save, alreadySaved: result.alreadySaved })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleGetSavedList(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const saves = await svc.getSavedPairings(ref)
    res.json({ success: true, saves })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleGetSavedOne(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const save = await svc.getSavedPairing(ref, req.params.id)
    res.json({ success: true, save })
  } catch (err) { sendError(res, err, 404) }
}

export async function handleRate(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const { expectedVersion, learnerRating, learnerNotes } = req.body || {}
    if (learnerRating !== undefined && learnerRating !== null && (typeof learnerRating !== 'number' || learnerRating < 1 || learnerRating > 5)) {
      return res.status(400).json({ success: false, error: 'invalid_learner_rating' })
    }
    const result = await svc.ratePairing({ guestReference: ref, id: req.params.id, expectedVersion, learnerRating, learnerNotes })
    if (!result.ok && result.conflict) return res.status(409).json({ success: false, error: 'stale_write', current: result.current })
    res.json({ success: true, save: result.save })
  } catch (err) { sendError(res, err, 500) }
}
