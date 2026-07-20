import * as svc from '../services/goldenBox/leafConstructionService.js'

function sendError(res, err, fallback = 400) {
  const statusByCode = { identity_required: 400, invalid_step: 400, previous_step_not_completed: 409, invalid_item: 400, invalid_decision: 400 }
  res.status(statusByCode[err.code] || fallback).json({ success: false, error: err.code || 'internal_error' })
}
function guestRef(req) { return req.goldenBoxGuestReference || null }

export async function handleGetArrangement(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const arrangement = await svc.getArrangement(ref)
    res.json({ success: true, arrangement })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleSaveArrangement(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const arrangement = await svc.saveArrangement(ref, req.body.arrangement || [])
    res.json({ success: true, arrangement })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleGetRollingProgress(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const progress = await svc.getRollingProgress(ref)
    res.json({ success: true, progress, steps: svc.ROLLING_STEPS })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleAdvanceRollingStep(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const result = await svc.advanceRollingStep(ref, req.params.stepKey)
    res.json({ success: true, ...result })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleGetQualityControl(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const decisions = await svc.getQualityControlDecisions(ref)
    res.json({ success: true, decisions, items: svc.QC_ITEMS })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleSaveQualityControl(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const decision = await svc.saveQualityControlDecision(ref, req.params.itemKey, req.body.decision, req.body.notes)
    res.json({ success: true, decision })
  } catch (err) { sendError(res, err, 500) }
}
