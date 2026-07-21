import * as svc from '../services/smokecraft/challengeHubService.js'

function sendError(res, err, fallback = 400) {
  const statusByCode = {
    identity_required: 400,
    challenge_not_found: 404,
  }
  const code = (err.code || '').split(':')[0]
  if (code === 'challenge_not_available') return res.status(409).json({ success: false, error: err.code })
  res.status(statusByCode[code] || fallback).json({ success: false, error: err.code || 'internal_error' })
}

function guestRef(req) {
  return req.goldenBoxGuestReference || null
}

function serializeEntry(entry) {
  const { definition, instance, timeStatus, participationState, progress, missingRequirements, serverNow } = entry
  return {
    challengeKey: definition.challenge_key,
    title: definition.display_title,
    description: definition.description,
    cadence: definition.cadence,
    category: definition.category,
    challengeType: definition.challenge_type,
    targetValue: definition.target_value,
    xpReward: definition.xp_reward,
    goldenBoxRelevance: definition.golden_box_relevance,
    instance: {
      instanceKey: instance.instance_key,
      effectiveStart: instance.effective_start,
      effectiveEnd: instance.effective_end,
    },
    timeStatus,
    participationState,
    progress,
    missingRequirements,
    serverNow,
  }
}

export async function handleGetHub(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const entries = await svc.getHub(ref)
    res.json({ success: true, challenges: entries.map(serializeEntry), serverNow: new Date() })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleGetChallenge(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const entry = await svc.getChallenge(ref, req.params.challengeKey)
    res.json({ success: true, challenge: serializeEntry(entry) })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleStartChallenge(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    await svc.startChallenge(ref, req.params.challengeKey)
    const entry = await svc.getChallenge(ref, req.params.challengeKey)
    res.json({ success: true, challenge: serializeEntry(entry) })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleRecalculate(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const entries = await svc.getHub(ref)
    res.json({ success: true, challenges: entries.map(serializeEntry) })
  } catch (err) { sendError(res, err, 500) }
}
