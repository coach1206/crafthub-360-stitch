import * as svc from '../services/passport360/passport360SyncService.js'

function sendError(res, err, fallback = 400) {
  const statusByCode = { identity_required: 400, passport_backend_unavailable: 503 }
  res.status(statusByCode[err.code] || fallback).json({ success: false, error: err.code || 'internal_error' })
}

function guestRef(req) {
  return req.goldenBoxGuestReference || null
}

export async function handleGetProfile(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const profile = await svc.getProfile(ref)
    res.json({ success: true, profile })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleGetStamps(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const stamps = await svc.getStamps(ref)
    res.json({ success: true, stamps })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleGetConnections(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const connections = await svc.getConnections(ref)
    res.json({ success: true, connections })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleGetActivity(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const limit = parseInt(req.query.limit, 10) || 50
    const activity = await svc.getActivity(ref, limit)
    res.json({ success: true, activity })
  } catch (err) { sendError(res, err, 500) }
}

// No real cross-learner directory architecture exists (the pre-existing
// PassportDirectory.jsx uses hardcoded local fixture people, not a real
// backend). Building one is explicitly out of scope for this pass — this
// endpoint honestly reports unavailable rather than fabricating a
// directory or fake profiles.
export async function handleGetDirectory(req, res) {
  res.json({ success: true, available: false, reason: 'no_approved_privacy_model_or_backend_directory_exists', members: [] })
}

export async function handleSaveFlavorMemory(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const { tasteTags, tastingNotes } = req.body || {}
    const flavorMemory = await svc.saveFlavorMemory(ref, {
      tasteTags: Array.isArray(tasteTags) ? tasteTags : [],
      tastingNotes: (tastingNotes && typeof tastingNotes === 'object') ? tastingNotes : {},
    })
    res.json({ success: true, flavorMemory })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleClaimJourneyStamp(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const result = await svc.claimJourneyCompletionStamp(ref)
    res.json({ success: true, stamp: result.stamp, duplicate: result.duplicate })
  } catch (err) { sendError(res, err, 500) }
}

// Guest-to-user linking requires BOTH a real guest session AND a real
// authenticated-user session present on the same request — never a
// generic "link any guestId to any userId" transfer. The guest
// reference is read only from the caller's own verified guest cookie
// (never a request body field), and the user reference only from the
// caller's own authenticated req.user — so a caller can never link
// someone else's guest record into their own account.
export async function handleLinkGuestToUser(req, res) {
  try {
    if (req.smokecraftIdentity?.type !== 'user' || !req.user?.id) {
      return res.status(401).json({ success: false, error: 'authenticated_user_required' })
    }
    const guestRefFromCookie = req.smokecraftGuestCookieIdentity || null
    if (!guestRefFromCookie) return res.status(400).json({ success: false, error: 'no_active_guest_session_to_link' })
    const result = await svc.linkGuestToUser(guestRefFromCookie, req.user.id)
    res.json({ success: true, ...result })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleSynchronize(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const result = await svc.synchronize(ref)
    res.json({
      success: true,
      newlyAwarded: result.newlyAwarded,
      alreadyOwned: result.alreadyOwned,
      xpSummary: { totalXp: result.realBalance },
      evidenceCount: result.evidenceCount,
    })
  } catch (err) { sendError(res, err, 500) }
}
