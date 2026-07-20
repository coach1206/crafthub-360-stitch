import * as seedSoilService from '../services/goldenBox/seedSoilService.js'
import * as contentService from '../services/goldenBox/contentService.js'

function sendError(res, err, fallback = 400) {
  const statusByCode = { note_not_found: 404, question_not_found: 404, identity_required: 400 }
  res.status(statusByCode[err.code] || fallback).json({ success: false, error: err.code || 'internal_error' })
}

function guestRef(req) {
  return req.goldenBoxGuestReference || null
}

export async function handleGetNotes(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const notes = await seedSoilService.getNotes(ref)
    res.json({ success: true, notes })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleSaveNote(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const note = await seedSoilService.saveNote(ref, req.body)
    res.json({ success: true, note })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleRecordProgress(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const progress = await seedSoilService.recordProgress(ref, req.body.componentId)
    res.json({ success: true, progress })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleGetProgress(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const progress = await seedSoilService.getProgress(ref)
    res.json({ success: true, progress })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleSubmitQuizAnswer(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const result = await seedSoilService.submitQuizAnswer(ref, req.params.questionId, req.body.selectedAnswer)
    res.json({ success: true, ...result })
  } catch (err) { sendError(res, err, 500) }
}

// Convenience: components by category, for the Seed and Soil screen's
// zones — thin pass-through to Package 3's existing contentService, no
// duplicate content table.
export async function handleListSeedSoilComponents(req, res) {
  try {
    const components = await contentService.listComponents({ category: req.query.category })
    res.json({ success: true, components })
  } catch (err) { sendError(res, err, 500) }
}
