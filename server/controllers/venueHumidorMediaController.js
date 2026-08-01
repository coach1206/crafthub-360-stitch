/**
 * Venue Humidor Media and Product Image Management — Production
 * Package 1 of 7. Every handler is server-authoritative on identity +
 * RBAC (req.user / req.params.venueId already validated by the
 * requireVenueStaff/requireVenueRole middleware chain in the route
 * file before any handler here runs).
 */
import * as mediaService from '../services/venueHumidor/mediaService.js'
import * as storage from '../services/venueManagement/storageAdapter.js'
import { getDb } from '../db/connection.js'

const MAX_BODY_BYTES = 5 * 1024 * 1024 + 4096

function sendError(res, err, fallback = 400) {
  const statusByCode = {
    asset_not_found: 404, product_not_found: 404, invalid_product_assignment: 422,
    duplicate_asset: 409, master_image_not_found: 404, master_image_product_mismatch: 422,
    import_domain_not_allowed: 422, invalid_import_url: 422, asset_not_approved: 409,
    rights_reference_required: 422, rejection_reason_required: 422,
    file_too_large: 413, unsupported_mime_type: 415, invalid_dimensions: 422,
    unreadable_dimensions: 422, empty_file: 400,
  }
  const code = err.code || 'internal_error'
  const status = statusByCode[code] || fallback
  const payload = { success: false, error: code }
  if (err.fieldErrors) payload.fieldErrors = err.fieldErrors
  res.status(status).json(payload)
}

function decodeBase64Body(req) {
  const { fileBase64, originalFilename } = req.body || {}
  if (!fileBase64) return null
  const buffer = Buffer.from(fileBase64, 'base64')
  if (buffer.length > MAX_BODY_BYTES) return { tooLarge: true }
  return { buffer, originalFilename: originalFilename || 'upload' }
}

// ── Upload ───────────────────────────────────────────────────────────
export async function handleUploadAsset(req, res) {
  try {
    const decoded = decodeBase64Body(req)
    if (!decoded) return res.status(400).json({ success: false, error: 'file_required' })
    if (decoded.tooLarge) return res.status(413).json({ success: false, error: 'file_too_large' })
    const { productId, scope, purpose, sourceType, sourceName, sourceUrl, rightsReference, altText, caption } = req.body
    const asset = await mediaService.uploadAsset({
      venueId: req.params.venueId, productId: productId || null, scope: scope || (productId ? 'product' : 'venue'),
      purpose, buffer: decoded.buffer, originalFilename: decoded.originalFilename, sourceType, sourceName,
      sourceUrl, rightsReference, altText, caption, actorId: req.user.id, actorRole: req.venueMembershipType,
    })
    res.status(201).json({ success: true, asset })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleListVenueMedia(req, res) {
  try {
    const media = await mediaService.listVenueMedia(req.params.venueId, req.query)
    res.json({ success: true, media })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleListProductGallery(req, res) {
  try {
    const gallery = await mediaService.listProductGallery(req.params.venueId, req.params.productId, { includeUnapproved: true })
    res.json({ success: true, gallery })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleAssignToProduct(req, res) {
  try {
    const asset = await mediaService.assignToProduct(req.params.venueId, req.params.assetId, req.body.productId, req.user.id, req.venueMembershipType)
    res.json({ success: true, asset })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleEditMetadata(req, res) {
  try {
    const asset = await mediaService.editMetadata(req.params.venueId, req.params.assetId, req.user.id, req.venueMembershipType, req.body)
    res.json({ success: true, asset })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleSetPrimary(req, res) {
  try {
    const asset = await mediaService.setPrimary(req.params.venueId, req.params.productId, req.body.assetId, req.user.id, req.venueMembershipType)
    res.json({ success: true, asset })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleReorderGallery(req, res) {
  try {
    const gallery = await mediaService.reorderGallery(req.params.venueId, req.params.productId, req.body.orderedAssetIds || [], req.user.id, req.venueMembershipType)
    res.json({ success: true, gallery })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleApprove(req, res) {
  try {
    const asset = await mediaService.approve(req.params.venueId, req.params.assetId, req.user.id, req.venueMembershipType)
    res.json({ success: true, asset })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleReject(req, res) {
  try {
    const asset = await mediaService.reject(req.params.venueId, req.params.assetId, req.user.id, req.venueMembershipType, req.body.reason)
    res.json({ success: true, asset })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleActivate(req, res) {
  try {
    const asset = await mediaService.activate(req.params.venueId, req.params.assetId, req.user.id, req.venueMembershipType)
    res.json({ success: true, asset })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleRetire(req, res) {
  try {
    const asset = await mediaService.retire(req.params.venueId, req.params.assetId, req.user.id, req.venueMembershipType, req.body.reason)
    res.json({ success: true, asset })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleImportUrl(req, res) {
  try {
    const asset = await mediaService.importFromUrl({ venueId: req.params.venueId, ...req.body, actorId: req.user.id, actorRole: req.venueMembershipType })
    res.status(201).json({ success: true, asset })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleCsvDryRun(req, res) {
  try {
    const result = await mediaService.runCsvImport(req.params.venueId, req.body.csv || '', req.user.id, { dryRun: true })
    res.json({ success: true, ...result })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleCsvImport(req, res) {
  try {
    const result = await mediaService.runCsvImport(req.params.venueId, req.body.csv || '', req.user.id, { dryRun: false })
    res.json({ success: true, ...result })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleMissingImageReport(req, res) {
  try {
    const report = await mediaService.missingImageReport(req.params.venueId, req.query)
    res.json({ success: true, report })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleListMasterCatalog(req, res) {
  try {
    const catalog = await mediaService.listMasterCatalog(req.query)
    res.json({ success: true, catalog })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleAssignMaster(req, res) {
  try {
    const asset = await mediaService.assignMasterToProduct(req.params.venueId, req.params.productId, req.body.masterImageId, req.user.id, req.venueMembershipType)
    res.status(201).json({ success: true, asset })
  } catch (err) { sendError(res, err, 500) }
}

// ── Public (customer-facing), approved+active only ──────────────────
export async function handlePublicProductMedia(req, res) {
  try {
    const media = await mediaService.getPublicProductMedia(req.params.venueId, req.params.productId)
    res.json({ success: true, media })
  } catch (err) { sendError(res, err, 500) }
}

// ── File streaming (both admin + public) — re-checks venue ownership
// and, for the public route, approval/active state on every request.
export async function handleGetAssetFile(req, res) {
  try {
    const db = getDb()
    const { rows } = await db.query(`SELECT * FROM venue_cigar_media_assets WHERE asset_id = $1 AND venue_id = $2`, [req.params.assetId, req.params.venueId])
    const asset = rows[0]
    if (!asset) return res.status(404).json({ success: false, error: 'not_found' })
    const buf = storage.readBuffer(asset.storage_key)
    if (!buf) return res.status(404).json({ success: false, error: 'not_found' })
    res.set('Content-Type', asset.mime_type)
    res.send(buf)
  } catch (err) { sendError(res, err, 500) }
}

export async function handleGetPublicAssetFile(req, res) {
  try {
    const db = getDb()
    const { rows } = await db.query(
      `SELECT * FROM venue_cigar_media_assets WHERE asset_id = $1 AND venue_id = $2 AND approval_state = 'approved' AND active_state = 'active'`,
      [req.params.assetId, req.params.venueId]
    )
    const asset = rows[0]
    if (!asset) return res.status(404).json({ success: false, error: 'not_found' })
    const buf = storage.readBuffer(asset.storage_key)
    if (!buf) return res.status(404).json({ success: false, error: 'not_found' })
    res.set('Content-Type', asset.mime_type)
    res.send(buf)
  } catch (err) { sendError(res, err, 500) }
}
