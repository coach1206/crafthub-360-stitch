import * as svc from '../services/smokecraft/fillerArrangementService.js'

function sendError(res, err, fallback = 400) {
  const statusByCode = { identity_required: 400 }
  const code = err.code || (typeof err.message === 'string' && err.message.startsWith('invalid_zone') ? err.message : 'internal_error')
  res.status(statusByCode[code] || fallback).json({ success: false, error: code })
}

function guestRef(req) {
  return req.goldenBoxGuestReference || null
}

export async function handleGetNote(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const note = await svc.getNote(ref)
    res.json({ success: true, note })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleSaveNote(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const note = await svc.saveNote(ref, req.body.noteText || '')
    res.json({ success: true, note })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleGetProgress(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const progress = await svc.getProgress(ref)
    res.json({ success: true, progress })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleRecordZoneViewed(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const progress = await svc.recordZoneViewed(ref, req.body.zoneKey)
    res.json({ success: true, progress })
  } catch (err) { sendError(res, err, 400) }
}

export async function handleSubmitQuizAnswer(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const result = await svc.submitQuizAnswer(ref, req.body.questionKey, req.body.isCorrect === true)
    res.json({ success: true, ...result })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleCompleteLesson(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const result = await svc.completeLesson(ref)
    res.json({ success: true, ...result })
  } catch (err) { sendError(res, err, 500) }
}
