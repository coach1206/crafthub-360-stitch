import * as svc from '../services/goldenBox/packagingStudioService.js'
import * as entryService from '../services/goldenBox/entryService.js'
import * as competitionService from '../services/goldenBox/competitionService.js'
import * as visibilityService from '../services/goldenBox/visibilityService.js'

function identityFrom(req) {
  return {
    userId: req.user?.id && req.user.role !== 'guest' ? req.user.id : null,
    guestReference: req.goldenBoxGuestReference || (req.user?.role === 'guest' ? req.user.id : null),
  }
}
const NOT_FOUND_CODES = new Set(['design_not_found', 'asset_not_found', 'comment_not_found', 'entry_not_found', 'version_not_found', 'share_not_found', 'not_submitted'])
const FORBIDDEN_CODES = new Set(['design_not_owned_by_caller', 'entry_not_owned_by_caller', 'not_authorized_to_comment', 'view_only_share_cannot_comment'])
const CONFLICT_CODES = new Set(['design_locked_cannot_edit', 'share_revoked', 'share_expired', 'share_invalid'])
function sendError(res, err, fallback = 500) {
  const known = err instanceof svc.PackagingStudioError
  if (!known) return res.status(fallback).json({ success: false, error: 'internal_error' })
  const status = NOT_FOUND_CODES.has(err.code) ? 404 : FORBIDDEN_CODES.has(err.code) ? 403 : CONFLICT_CODES.has(err.code) ? 409 : 400
  res.status(status).json({ success: false, error: err.code })
}

export async function handleListDesigns(req, res) {
  try { res.json({ success: true, designs: await svc.listDesigns(identityFrom(req)) }) } catch (err) { sendError(res, err) }
}
export async function handleCreateDesign(req, res) {
  try { res.status(201).json({ success: true, design: await svc.createDesign(identityFrom(req), req.body.entryId) }) } catch (err) { sendError(res, err) }
}
export async function handleGetDesign(req, res) {
  try {
    const design = await svc.getDesign(req.params.designId)
    if (!design) return res.status(404).json({ success: false, error: 'design_not_found' })
    const identity = identityFrom(req)
    const owns = (!!identity.userId && identity.userId === design.user_id) || (!!identity.guestReference && identity.guestReference === design.guest_reference)
    if (!owns) return res.status(403).json({ success: false, error: 'design_not_owned_by_caller' })
    const version = await svc.getCurrentVersion(design.design_id)
    res.json({ success: true, design, currentVersion: version })
  } catch (err) { sendError(res, err) }
}
export async function handleSaveDraft(req, res) {
  try { res.json({ success: true, version: await svc.saveDraft(req.params.designId, identityFrom(req), req.body) }) } catch (err) { sendError(res, err) }
}
export async function handleDuplicateDesign(req, res) {
  try { res.status(201).json({ success: true, design: await svc.duplicateDesign(req.params.designId, identityFrom(req)) }) } catch (err) { sendError(res, err) }
}
export async function handleArchiveDesign(req, res) {
  try { res.json({ success: true, design: await svc.archiveDesign(req.params.designId, identityFrom(req)) }) } catch (err) { sendError(res, err) }
}
export async function handleRestoreDesign(req, res) {
  try { res.json({ success: true, design: await svc.restoreDesign(req.params.designId, identityFrom(req)) }) } catch (err) { sendError(res, err) }
}
export async function handleSoftDeleteDesign(req, res) {
  try { await svc.softDeleteDesign(req.params.designId, identityFrom(req)); res.json({ success: true }) } catch (err) { sendError(res, err) }
}

export async function handleListVersions(req, res) {
  try {
    const design = await svc.requireOwnedDesign(req.params.designId, identityFrom(req))
    res.json({ success: true, versions: await svc.listVersions(design.design_id) })
  } catch (err) { sendError(res, err) }
}
export async function handleGetVersion(req, res) {
  try {
    await svc.requireOwnedDesign(req.params.designId, identityFrom(req))
    const version = await svc.getVersion(req.params.designId, Number(req.params.versionNumber))
    if (!version) return res.status(404).json({ success: false, error: 'version_not_found' })
    res.json({ success: true, version })
  } catch (err) { sendError(res, err) }
}
export async function handleRestoreVersion(req, res) {
  try { res.json({ success: true, version: await svc.restoreVersionAsNew(req.params.designId, identityFrom(req), Number(req.params.versionNumber)) }) } catch (err) { sendError(res, err) }
}

const MAX_BODY_BASE64 = Math.ceil((8 * 1024 * 1024 * 4) / 3) + 1024
export async function handleUploadAsset(req, res) {
  try {
    const { assetType, filename, base64Data } = req.body || {}
    if (!base64Data || typeof base64Data !== 'string' || base64Data.length > MAX_BODY_BASE64) {
      return res.status(400).json({ success: false, error: 'file_too_large' })
    }
    const buffer = Buffer.from(base64Data, 'base64')
    const asset = await svc.recordAssetUpload(req.params.designId, identityFrom(req), { assetType, originalFilename: filename, buffer })
    res.status(201).json({ success: true, asset })
  } catch (err) { sendError(res, err) }
}
export async function handleGetAssetFile(req, res) {
  try {
    const design = await svc.requireOwnedDesign(req.params.designId, identityFrom(req))
    const db = (await import('../db/connection.js')).getDb()
    const { rows } = await db.query(`SELECT * FROM packaging_assets WHERE asset_id = $1 AND design_id = $2 AND removed_at IS NULL`, [req.params.assetId, design.design_id])
    const asset = rows[0]
    if (!asset) return res.status(404).json({ success: false, error: 'asset_not_found' })
    const buffer = svc.readAssetBuffer(asset.stored_filename)
    if (!buffer) return res.status(404).json({ success: false, error: 'asset_file_missing' })
    res.set('Content-Type', asset.mime_type)
    res.send(buffer)
  } catch (err) { sendError(res, err) }
}
export async function handleRemoveAsset(req, res) {
  try { await svc.removeAsset(req.params.assetId, identityFrom(req)); res.json({ success: true }) } catch (err) { sendError(res, err) }
}
export async function handleSetPlacement(req, res) {
  try { res.json({ success: true, placement: await svc.setAssetPlacement(req.params.assetId, identityFrom(req), req.body) }) } catch (err) { sendError(res, err) }
}

export async function handleCreateShare(req, res) {
  try {
    const { share, token } = await svc.createShare(req.params.designId, identityFrom(req), req.body)
    res.status(201).json({ success: true, share, token })
  } catch (err) { sendError(res, err) }
}
export async function handleListShares(req, res) {
  try { res.json({ success: true, shares: await svc.listShares(req.params.designId, identityFrom(req)) }) } catch (err) { sendError(res, err) }
}
export async function handleRevokeShare(req, res) {
  try { await svc.revokeShare(Number(req.params.shareId), identityFrom(req)); res.json({ success: true }) } catch (err) { sendError(res, err) }
}
export async function handleReadShared(req, res) {
  try {
    const { share, design, version } = await svc.resolveShare(req.params.shareToken)
    res.json({ success: true, accessType: share.access_type, shareId: share.id, design: { boxName: design.box_name, subtitle: design.subtitle, status: design.status }, version })
  } catch (err) { sendError(res, err) }
}

export async function handleAddComment(req, res) {
  try { res.status(201).json({ success: true, comment: await svc.addComment(req.params.designId, identityFrom(req), req.body) }) } catch (err) { sendError(res, err) }
}
export async function handleAddSharedComment(req, res) {
  try {
    const { share, design } = await svc.resolveShare(req.params.shareToken)
    const comment = await svc.addComment(design.design_id, identityFrom(req), { ...req.body, shareId: share.id })
    res.status(201).json({ success: true, comment })
  } catch (err) { sendError(res, err) }
}
export async function handleResolveComment(req, res) {
  try { res.json({ success: true, comment: await svc.resolveComment(Number(req.params.commentId), identityFrom(req)) }) } catch (err) { sendError(res, err) }
}
export async function handleListComments(req, res) {
  try {
    await svc.requireOwnedDesign(req.params.designId, identityFrom(req))
    res.json({ success: true, comments: await svc.listComments(req.params.designId) })
  } catch (err) { sendError(res, err) }
}

export async function handleSubmitFinal(req, res) {
  try { res.json({ success: true, submission: await svc.submitFinalDesign(req.params.designId, identityFrom(req), req.body.entryId) }) } catch (err) { sendError(res, err) }
}
// Judge/mentor visibility reuses the same visibilityService policy
// already proven for the Golden Box entry/results routes (Phase 8's
// results-visibility fix) — the submitted packaging snapshot is
// entrant-scoped evidence attached to a real Golden Box entry, so it
// must pass through the same recipe-access check, not a bare lookup.
export async function handleGetFinalSubmission(req, res) {
  try {
    const entry = await entryService.getEntry(req.params.entryId)
    if (!entry) return res.status(404).json({ success: false, error: 'entry_not_found' })
    const competition = await competitionService.getCompetition(entry.competition_id)
    const identity = identityFrom(req)
    const visibility = await visibilityService.getVisibility(entry, competition, identity)
    if (!visibility.canViewRecipe) return res.status(403).json({ success: false, error: 'submission_not_authorized' })
    const submission = await svc.getFinalSubmission(req.params.entryId)
    if (!submission) return res.status(404).json({ success: false, error: 'not_submitted' })
    res.json({ success: true, submission })
  } catch (err) { sendError(res, err) }
}
