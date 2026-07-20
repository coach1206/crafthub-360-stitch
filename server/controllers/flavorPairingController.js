import * as svc from '../services/goldenBox/flavorPairingService.js'

function sendError(res, err, fallback = 400) {
  const statusByCode = {
    identity_required: 400, invalid_stage: 400, draft_not_found: 404,
    invalid_event: 400, session_not_active: 409, session_not_found: 404,
  }
  res.status(statusByCode[err.code] || fallback).json({ success: false, error: err.code || 'internal_error' })
}
function guestRef(req) { return req.goldenBoxGuestReference || null }

export async function handleGetFlavorStages(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const stages = await svc.getFlavorStages(ref)
    res.json({ success: true, stages })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleSaveFlavorStage(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const stage = await svc.saveFlavorStage(ref, req.params.stage, req.body)
    res.json({ success: true, stage })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleListPairingDrafts(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const drafts = await svc.listPairingDrafts(ref)
    res.json({ success: true, drafts })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleGetPairingDraft(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const draft = await svc.getPairingDraft(ref, req.params.id)
    res.json({ success: true, draft })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleSavePairingDraft(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const result = await svc.savePairingDraft(ref, req.body)
    res.json({ success: true, ...result })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleReviseDraft(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const draft = await svc.reviseDraft(ref, req.params.id, req.body)
    res.json({ success: true, draft })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleGetDraftRevisions(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const revisions = await svc.getDraftRevisions(ref, req.params.id)
    res.json({ success: true, revisions })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleGetCadenceSession(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const session = await svc.getCadenceSession(ref)
    res.json({ success: true, session })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleStartCadence(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const session = await svc.startCadence(ref)
    res.json({ success: true, session })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleRecordCadenceEvent(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const session = await svc.recordCadenceEvent(ref, req.params.eventType)
    res.json({ success: true, session })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleStopCadence(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const result = await svc.stopCadence(ref)
    res.json({ success: true, ...result })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleGetRecommendations(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const result = await svc.getRecommendations(ref)
    res.json({ success: true, ...result })
  } catch (err) { sendError(res, err, 500) }
}
