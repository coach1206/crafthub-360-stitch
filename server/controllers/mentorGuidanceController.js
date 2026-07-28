import * as svc from '../services/smokecraft/mentorGuidanceService.js'

function sendError(res, err, fallback = 400) {
  const statusByCode = { mentor_not_selected: 400 }
  res.status(statusByCode[err.code] || fallback).json({ success: false, error: err.code || 'internal_error' })
}

function guestRef(req) {
  return req.goldenBoxGuestReference || null
}

export async function handleGetGuidance(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const { mentorId, screenContext } = req.body || {}
    if (!mentorId) return res.status(400).json({ success: false, error: 'mentor_not_selected' })
    const guidance = await svc.getGuidance({ guestReference: ref, mentorId, screenContext })
    res.json({ success: true, guidance })
  } catch (err) { sendError(res, err, 500) }
}
