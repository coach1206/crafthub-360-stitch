import * as profileService from '../services/venueManagement/venueProfileService.js'
import * as mediaService from '../services/venueManagement/mediaService.js'
import * as brandingService from '../services/venueManagement/brandingService.js'
import { STORAGE_PROVIDER_STATUS, healthCheck as storageHealthCheck } from '../services/venueManagement/storageAdapter.js'

function sendError(res, err, fallbackStatus = 400) {
  const knownCodes = {
    profile_not_found: 404, media_not_found: 404, media_not_found_or_not_owned: 404,
    version_not_found: 404, stale_version: 409, media_in_use: 409,
    invalid_media_type: 400, unsupported_mime_type: 400, file_too_large: 400,
    invalid_dimensions: 400, unreadable_dimensions: 400, empty_file: 400,
    no_fields_provided: 400, invalid_branding_slot: 400, invalid_branding_removal: 400,
  }
  const code = err.code || 'internal_error'
  const status = knownCodes[code] || (code.startsWith('invalid_transition_from_') ? 409 : fallbackStatus)
  res.status(status).json({ success: false, error: code })
}

export async function handleGetProfile(req, res) {
  try {
    const venueId = req.validatedVenue.venue_id
    let profile = await profileService.getVenueProfile(venueId)
    if (!profile) profile = null
    res.json({
      success: true,
      profile,
      storage: { provider: STORAGE_PROVIDER_STATUS, health: storageHealthCheck() },
    })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleCreateProfile(req, res) {
  try {
    const venueId = req.validatedVenue.venue_id
    const profile = await profileService.createVenueProfile(venueId, req.actorId)
    res.status(201).json({ success: true, profile })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleUpdateProfile(req, res) {
  try {
    const venueId = req.validatedVenue.venue_id
    const { expectedVersion, ...fields } = req.body || {}
    if (typeof expectedVersion !== 'number') return res.status(400).json({ success: false, error: 'expected_version_required' })
    const profile = await profileService.updateVenueProfile(venueId, { expectedVersion, fields, actorId: req.actorId })
    res.json({ success: true, profile })
  } catch (err) { sendError(res, err, 500) }
}

function makeTransitionHandler(fn, extractExtra) {
  return async (req, res) => {
    try {
      const venueId = req.validatedVenue.venue_id
      const extra = extractExtra ? extractExtra(req) : []
      const profile = await fn(venueId, req.actorId, ...extra)
      res.json({ success: true, profile })
    } catch (err) { sendError(res, err, 500) }
  }
}

export const handleSubmitForApproval = makeTransitionHandler(profileService.submitProfileForApproval)
export const handleApprove = makeTransitionHandler(profileService.approveProfile)
export const handleReject = makeTransitionHandler(profileService.rejectProfile, (req) => [req.body?.reason])
export const handlePublish = makeTransitionHandler(profileService.publishProfile)
export const handleUnpublish = makeTransitionHandler(profileService.unpublishProfile)

export async function handleGetVersionHistory(req, res) {
  try {
    const versions = await profileService.getProfileVersionHistory(req.validatedVenue.venue_id)
    res.json({ success: true, versions })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleRestoreVersion(req, res) {
  try {
    const venueId = req.validatedVenue.venue_id
    const versionNumber = Number(req.params.versionNumber)
    const profile = await profileService.restoreProfileVersion(venueId, versionNumber, req.actorId)
    res.json({ success: true, profile })
  } catch (err) { sendError(res, err, 500) }
}

// ── Media ────────────────────────────────────────────────────────
const MAX_BODY_BASE64 = Math.ceil((5 * 1024 * 1024 * 4) / 3) + 1024

export async function handleUploadMedia(req, res) {
  try {
    const venueId = req.validatedVenue.venue_id
    const { filename, mediaType, altText, base64Data } = req.body || {}
    if (!base64Data || typeof base64Data !== 'string' || base64Data.length > MAX_BODY_BASE64) {
      return res.status(400).json({ success: false, error: 'file_too_large' })
    }
    const buffer = Buffer.from(base64Data, 'base64')
    const media = await mediaService.createMedia({
      venueId, buffer, originalFilename: filename, mediaType: mediaType || 'image', altText, actorId: req.actorId,
    })
    res.status(201).json({ success: true, media })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleListMedia(req, res) {
  try {
    const media = await mediaService.listVenueMedia(req.validatedVenue.venue_id)
    res.json({ success: true, media })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleGetMedia(req, res) {
  try {
    const media = await mediaService.getMedia(Number(req.params.mediaId), req.validatedVenue.venue_id)
    if (!media) return res.status(404).json({ success: false, error: 'media_not_found' })
    const usage = await mediaService.checkMediaUsage(media.id, req.validatedVenue.venue_id)
    res.json({ success: true, media, usage })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleUpdateMediaMetadata(req, res) {
  try {
    const media = await mediaService.updateMediaMetadata(Number(req.params.mediaId), req.validatedVenue.venue_id, { altText: req.body?.altText })
    if (!media) return res.status(404).json({ success: false, error: 'media_not_found' })
    res.json({ success: true, media })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleArchiveMedia(req, res) {
  try {
    const media = await mediaService.archiveMedia(Number(req.params.mediaId), req.validatedVenue.venue_id, req.actorId)
    res.json({ success: true, media })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleRestoreMedia(req, res) {
  try {
    const media = await mediaService.restoreMedia(Number(req.params.mediaId), req.validatedVenue.venue_id)
    if (!media) return res.status(404).json({ success: false, error: 'media_not_found' })
    res.json({ success: true, media })
  } catch (err) { sendError(res, err, 500) }
}

// Streams the file bytes for a controlled media URL. Re-validates venue
// ownership on every request rather than trusting a previously issued URL.
export async function handleGetMediaFile(req, res) {
  try {
    const media = await mediaService.getMedia(Number(req.params.mediaId), req.validatedVenue.venue_id)
    if (!media) return res.status(404).end()
    const buf = mediaService.readMediaFile(media.storage_path)
    if (!buf) return res.status(404).end()
    res.setHeader('Content-Type', media.mime_type)
    res.send(buf)
  } catch {
    res.status(500).end()
  }
}

// ── Branding ─────────────────────────────────────────────────────
export async function handleAssignBranding(req, res) {
  try {
    const venueId = req.validatedVenue.venue_id
    const { slot, mediaId } = req.body || {}
    const profile = await brandingService.assignBranding(venueId, { slot, mediaId: Number(mediaId) }, req.actorId)
    res.json({ success: true, profile })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleRemoveBranding(req, res) {
  try {
    const venueId = req.validatedVenue.venue_id
    const { slot } = req.params
    const { mediaId } = req.body || {}
    const profile = await brandingService.removeBranding(venueId, slot, req.actorId, mediaId ? Number(mediaId) : null)
    res.json({ success: true, profile })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleReorderGallery(req, res) {
  try {
    const venueId = req.validatedVenue.venue_id
    const { orderedMediaIds } = req.body || {}
    if (!Array.isArray(orderedMediaIds)) return res.status(400).json({ success: false, error: 'ordered_media_ids_required' })
    const profile = await brandingService.reorderGallery(venueId, orderedMediaIds.map(Number), req.actorId)
    res.json({ success: true, profile })
  } catch (err) { sendError(res, err, 500) }
}
