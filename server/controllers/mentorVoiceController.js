import * as svc from '../services/smokecraft/mentorVoiceService.js'

function sendError(res, err, fallback = 400) {
  const statusByCode = { mentor_not_found: 404, invalid_voice_enabled: 400, invalid_captions_enabled: 400, invalid_mentor: 400 }
  res.status(statusByCode[err.code] || fallback).json({ success: false, error: err.code || 'internal_error' })
}

function guestRef(req) {
  return req.goldenBoxGuestReference || null
}

export async function handleListProfiles(_req, res) {
  res.json({ success: true, profiles: svc.listVoiceProfiles() })
}

export async function handlePreview(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const { mentorId, speed } = req.body || {}
    if (!mentorId || typeof mentorId !== 'string') {
      return res.status(400).json({ success: false, error: 'mentor_not_selected' })
    }
    const result = await svc.generatePreview({ mentorId, speed })
    res.json({ success: true, preview: result })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleGetPreferences(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const prefs = await svc.getVoicePreferences(ref)
    res.json({ success: true, preferences: prefs })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleSavePreferences(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const { voiceEnabled, playbackSpeed, captionsEnabled, lastPreviewedMentorId } = req.body || {}
    const prefs = await svc.saveVoicePreferences(ref, { voiceEnabled, playbackSpeed, captionsEnabled, lastPreviewedMentorId })
    res.json({ success: true, preferences: prefs })
  } catch (err) { sendError(res, err, 400) }
}
