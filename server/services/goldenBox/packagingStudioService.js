/**
 * Golden Box Packaging Studio — real, persisted, server-authoritative
 * service. Every write path derives identity from the caller's real
 * server-resolved identity (never a request-body-submitted owner id).
 */
import crypto from 'node:crypto'
import { getDb } from '../../db/connection.js'
import { validateImageBuffer, normalizeFilename } from '../venueManagement/imageValidation.js'
import * as storage from '../venueManagement/storageAdapter.js'

export class PackagingStudioError extends Error {
  constructor(code) { super(code); this.code = code }
}

const WOOD_TYPES = ['spanish_cedar', 'mahogany', 'walnut', 'oak', 'maple', 'cherry', 'black_lacquer', 'natural_unfinished']
const FINISHES = ['natural', 'matte', 'satin', 'gloss', 'high_gloss', 'distressed', 'smoked', 'lacquered']
const LID_STYLES = ['hinged', 'lift_off', 'slide_top', 'book_style', 'magnetic_close']
const CLOSURES = ['none', 'magnetic', 'brass_latch', 'champagne_gold_latch', 'wooden_clasp']
const LININGS = ['natural_cedar', 'suede', 'velvet', 'leather', 'fabric', 'paper_wrap', 'unlined']
const TRAYS = ['single_layer', 'double_layer', 'removable_tray', 'individual_channels', 'open_presentation_bed']
const SURFACES = ['lid_top', 'front', 'left_side', 'right_side', 'interior_lid', 'interior_tray']
const HEX_RE = /^#[0-9a-fA-F]{6}$/
const TEXT_MAX = 200
const NOTES_MAX = 2000

export const OPTIONS = { WOOD_TYPES, FINISHES, LID_STYLES, CLOSURES, LININGS, TRAYS, SURFACES }

function sanitizeText(value, max = TEXT_MAX) {
  if (value === undefined || value === null) return null
  if (typeof value !== 'string') throw new PackagingStudioError('invalid_text_field')
  const trimmed = value.trim()
  if (trimmed.length > max) throw new PackagingStudioError('text_too_long')
  // Reject markup/script injection — plain text only, no tags at all.
  if (/[<>]/.test(trimmed)) throw new PackagingStudioError('unsafe_markup_rejected')
  return trimmed || null
}
function validateHex(value, field) {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string' || !HEX_RE.test(value)) throw new PackagingStudioError(`invalid_${field}`)
  return value.toLowerCase()
}
function validateEnum(value, allowed, field) {
  if (value === undefined || value === null || value === '') return null
  if (!allowed.includes(value)) throw new PackagingStudioError(`invalid_${field}`)
  return value
}
function validateCapacity(value) {
  if (value === undefined || value === null) return null
  const n = Number(value)
  if (!Number.isInteger(n) || n < 1 || n > 200) throw new PackagingStudioError('invalid_cigar_capacity')
  return n
}

/** Builds a validated config object from raw client input — never trusts unknown keys. */
export function buildConfig(input = {}) {
  return {
    boxName: sanitizeText(input.boxName),
    subtitle: sanitizeText(input.subtitle),
    dimensions: input.dimensions ? {
      lengthMm: Number(input.dimensions.lengthMm) || null,
      widthMm: Number(input.dimensions.widthMm) || null,
      heightMm: Number(input.dimensions.heightMm) || null,
    } : null,
    cigarCapacity: validateCapacity(input.cigarCapacity),
    woodType: validateEnum(input.woodType, WOOD_TYPES, 'wood_type'),
    exteriorColor: validateHex(input.exteriorColor, 'exterior_color'),
    interiorAccentColor: validateHex(input.interiorAccentColor, 'interior_accent_color'),
    textColor: validateHex(input.textColor, 'text_color'),
    hardwareColor: validateHex(input.hardwareColor, 'hardware_color'),
    finish: validateEnum(input.finish, FINISHES, 'finish'),
    lidStyle: validateEnum(input.lidStyle, LID_STYLES, 'lid_style'),
    closure: validateEnum(input.closure, CLOSURES, 'closure'),
    interiorLining: validateEnum(input.interiorLining, LININGS, 'interior_lining'),
    trayConfiguration: validateEnum(input.trayConfiguration, TRAYS, 'tray_configuration'),
    engravedText: sanitizeText(input.engravedText, 100),
    frontText: sanitizeText(input.frontText, 100),
    lidText: sanitizeText(input.lidText, 100),
    sideText: sanitizeText(input.sideText, 100),
    interiorLidText: sanitizeText(input.interiorLidText, 200),
    blendName: sanitizeText(input.blendName),
    dedication: sanitizeText(input.dedication, 400),
    fontKey: sanitizeText(input.fontKey, 40),
    textAlign: validateEnum(input.textAlign, ['left', 'center', 'right'], 'text_align'),
    textSize: input.textSize !== undefined && input.textSize !== null
      ? (() => { const n = Number(input.textSize); if (!Number.isFinite(n) || n < 8 || n > 72) throw new PackagingStudioError('invalid_text_size'); return n })()
      : null,
    designNotes: sanitizeText(input.designNotes, NOTES_MAX),
  }
}

function ownsDesign(design, identity) {
  const ownsAsUser = !!identity.userId && identity.userId === design.user_id
  const ownsAsGuest = !!identity.guestReference && identity.guestReference === design.guest_reference
  return ownsAsUser || ownsAsGuest
}

export async function listDesigns(identity) {
  const db = getDb()
  const { rows } = await db.query(
    `SELECT * FROM packaging_designs
     WHERE deleted_at IS NULL AND ((user_id = $1 AND $1 IS NOT NULL) OR (guest_reference = $2 AND $2 IS NOT NULL))
     ORDER BY updated_at DESC`,
    [identity.userId || null, identity.guestReference || null]
  )
  return rows
}

export async function getDesign(designId) {
  const db = getDb()
  const { rows } = await db.query(`SELECT * FROM packaging_designs WHERE design_id = $1 AND deleted_at IS NULL`, [designId])
  return rows[0] || null
}

export async function requireOwnedDesign(designId, identity) {
  const design = await getDesign(designId)
  if (!design) throw new PackagingStudioError('design_not_found')
  if (!ownsDesign(design, identity)) throw new PackagingStudioError('design_not_owned_by_caller')
  return design
}

async function createVersionRow(client, designId, versionNumber, parentVersion, changeNote, actorId, snapshot) {
  await client.query(`UPDATE packaging_design_versions SET is_current = false WHERE design_id = $1`, [designId])
  const { rows } = await client.query(
    `INSERT INTO packaging_design_versions (design_id, version_number, parent_version_number, change_note, created_by, snapshot, is_current)
     VALUES ($1,$2,$3,$4,$5,$6,true) RETURNING *`,
    [designId, versionNumber, parentVersion, changeNote || null, actorId, JSON.stringify(snapshot)]
  )
  return rows[0]
}

/** New design starts fully neutral — no field defaulted to a selected option. */
export async function createDesign(identity, entryId) {
  const db = getDb()
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const { rows } = await client.query(
      `INSERT INTO packaging_designs (entry_id, user_id, guest_reference, current_version)
       VALUES ($1,$2,$3,1) RETURNING *`,
      [entryId || null, identity.userId || null, identity.guestReference || null]
    )
    const design = rows[0]
    await createVersionRow(client, design.design_id, 1, null, 'Initial neutral design', identity.userId || identity.guestReference, {})
    await client.query('COMMIT')
    return design
  } catch (e) { await client.query('ROLLBACK'); throw e }
  finally { client.release() }
}

export async function saveDraft(designId, identity, input) {
  const db = getDb()
  const design = await requireOwnedDesign(designId, identity)
  if (design.status === 'submitted') throw new PackagingStudioError('design_locked_cannot_edit')
  const config = buildConfig(input)
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const nextVersion = design.current_version + 1
    const version = await createVersionRow(client, designId, nextVersion, design.current_version, input.changeNote, identity.userId || identity.guestReference, config)
    await client.query(
      `UPDATE packaging_designs SET current_version = $2, box_name = $3, subtitle = $4, design_notes = $5, updated_at = now() WHERE design_id = $1`,
      [designId, nextVersion, config.boxName, config.subtitle, config.designNotes]
    )
    await client.query('COMMIT')
    return version
  } catch (e) { await client.query('ROLLBACK'); throw e }
  finally { client.release() }
}

export async function getCurrentVersion(designId) {
  const db = getDb()
  const { rows } = await db.query(`SELECT * FROM packaging_design_versions WHERE design_id = $1 AND is_current = true ORDER BY version_number DESC LIMIT 1`, [designId])
  return rows[0] || null
}
export async function listVersions(designId) {
  const db = getDb()
  const { rows } = await db.query(`SELECT * FROM packaging_design_versions WHERE design_id = $1 ORDER BY version_number DESC`, [designId])
  return rows
}
export async function getVersion(designId, versionNumber) {
  const db = getDb()
  const { rows } = await db.query(`SELECT * FROM packaging_design_versions WHERE design_id = $1 AND version_number = $2`, [designId, versionNumber])
  return rows[0] || null
}
export async function restoreVersionAsNew(designId, identity, versionNumber) {
  const design = await requireOwnedDesign(designId, identity)
  const target = await getVersion(designId, versionNumber)
  if (!target) throw new PackagingStudioError('version_not_found')
  return saveDraft(designId, identity, { ...target.snapshot, changeNote: `Restored from v${versionNumber}` })
}

export async function duplicateDesign(designId, identity) {
  const db = getDb()
  const original = await requireOwnedDesign(designId, identity)
  const currentVersion = await getCurrentVersion(designId)
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const { rows } = await client.query(
      `INSERT INTO packaging_designs (entry_id, user_id, guest_reference, box_name, subtitle, design_notes, current_version)
       VALUES ($1,$2,$3,$4,$5,$6,1) RETURNING *`,
      [original.entry_id, identity.userId || null, identity.guestReference || null, original.box_name ? `${original.box_name} (Copy)` : null, original.subtitle, original.design_notes]
    )
    const copy = rows[0]
    await createVersionRow(client, copy.design_id, 1, null, 'Duplicated design', identity.userId || identity.guestReference, currentVersion?.snapshot || {})
    await client.query('COMMIT')
    return copy
  } catch (e) { await client.query('ROLLBACK'); throw e }
  finally { client.release() }
}

export async function archiveDesign(designId, identity) {
  await requireOwnedDesign(designId, identity)
  const db = getDb()
  const { rows } = await db.query(`UPDATE packaging_designs SET status = 'archived', updated_at = now() WHERE design_id = $1 RETURNING *`, [designId])
  return rows[0]
}
export async function restoreDesign(designId, identity) {
  await requireOwnedDesign(designId, identity)
  const db = getDb()
  const { rows } = await db.query(`UPDATE packaging_designs SET status = 'draft', updated_at = now() WHERE design_id = $1 AND status = 'archived' RETURNING *`, [designId])
  if (!rows[0]) throw new PackagingStudioError('design_not_archived')
  return rows[0]
}
export async function softDeleteDesign(designId, identity) {
  await requireOwnedDesign(designId, identity)
  const db = getDb()
  await db.query(`UPDATE packaging_designs SET deleted_at = now() WHERE design_id = $1`, [designId])
}

// ── Assets ──
// Reuses the exact repository-approved local-development storage adapter
// and manual image-validation (magic-byte MIME sniffing, PNG/JPEG header
// dimension parsing, no execute-capable file types) already built for
// Venue Management media (server/services/venueManagement/storageAdapter.js,
// imageValidation.js) — same "PRODUCTION STORAGE STATUS: NOT CONFIGURED"
// honesty label applies here; no new storage mechanism was invented, and
// no raw base64 blob is ever written into a core database row (only the
// server-generated storage key/filename is persisted).
const ASSET_TYPES = ['logo', 'lid_artwork', 'side_artwork', 'interior_artwork', 'pattern_overlay']
export async function recordAssetUpload(designId, identity, { assetType, originalFilename, buffer }) {
  await requireOwnedDesign(designId, identity)
  if (!ASSET_TYPES.includes(assetType)) throw new PackagingStudioError('invalid_asset_type')
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) throw new PackagingStudioError('empty_upload')
  const result = validateImageBuffer(buffer)
  if (!result.ok) throw new PackagingStudioError(result.error)
  const filename = normalizeFilename(originalFilename || 'artwork')
  const { storageKey } = storage.upload({ venueId: designId, buffer, mimeType: result.mimeType })
  const db = getDb()
  try {
    const { rows } = await db.query(
      `INSERT INTO packaging_assets (design_id, uploaded_by_user_id, uploaded_by_guest_reference, asset_type, original_filename, stored_filename, mime_type, file_size_bytes, width_px, height_px)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [designId, identity.userId || null, identity.guestReference || null, assetType, filename, storageKey, result.mimeType, buffer.length, result.width, result.height]
    )
    return rows[0]
  } catch (err) {
    storage.remove(storageKey)
    throw err
  }
}
export function readAssetBuffer(storageKey) { return storage.readBuffer(storageKey) }
export async function removeAsset(assetId, identity) {
  const db = getDb()
  const { rows: assetRows } = await db.query(`SELECT * FROM packaging_assets WHERE asset_id = $1`, [assetId])
  const asset = assetRows[0]
  if (!asset) throw new PackagingStudioError('asset_not_found')
  await requireOwnedDesign(asset.design_id, identity)
  await db.query(`UPDATE packaging_assets SET removed_at = now() WHERE asset_id = $1`, [assetId])
}
export async function setAssetPlacement(assetId, identity, placement) {
  const db = getDb()
  const { rows: assetRows } = await db.query(`SELECT * FROM packaging_assets WHERE asset_id = $1 AND removed_at IS NULL`, [assetId])
  const asset = assetRows[0]
  if (!asset) throw new PackagingStudioError('asset_not_found')
  await requireOwnedDesign(asset.design_id, identity)
  const surface = validateEnum(placement.surface, SURFACES, 'surface')
  if (!surface) throw new PackagingStudioError('invalid_surface')
  const x = Number(placement.x), y = Number(placement.y), w = Number(placement.width), h = Number(placement.height)
  const rotation = Number(placement.rotation || 0), scale = Number(placement.scale || 1)
  if (![x, y, w, h].every(n => Number.isFinite(n))) throw new PackagingStudioError('invalid_placement_geometry')
  if (x < 0 || x > 1 || y < 0 || y > 1 || w <= 0 || w > 1 || h <= 0 || h > 1) throw new PackagingStudioError('invalid_placement_bounds')
  if (x - w / 2 < -0.001 || x + w / 2 > 1.001 || y - h / 2 < -0.001 || y + h / 2 > 1.001) throw new PackagingStudioError('placement_outside_surface')
  if (rotation < -45 || rotation > 45) throw new PackagingStudioError('invalid_rotation')
  if (scale < 0.1 || scale > 3) throw new PackagingStudioError('invalid_scale')
  const { rows } = await db.query(
    `INSERT INTO packaging_asset_placements (asset_id, surface, x_position, y_position, width, height, rotation_degrees, scale, layer_order, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,now())
     ON CONFLICT DO NOTHING RETURNING *`,
    [assetId, surface, x, y, w, h, rotation, scale, placement.layerOrder || 0]
  )
  if (rows[0]) return rows[0]
  const { rows: updated } = await db.query(
    `UPDATE packaging_asset_placements SET surface=$2, x_position=$3, y_position=$4, width=$5, height=$6, rotation_degrees=$7, scale=$8, layer_order=$9, updated_at=now()
     WHERE asset_id = $1 RETURNING *`,
    [assetId, surface, x, y, w, h, rotation, scale, placement.layerOrder || 0]
  )
  return updated[0]
}

// ── Sharing ──
export function generateShareToken() { return crypto.randomBytes(32).toString('base64url') }
function hashToken(token) { return crypto.createHash('sha256').update(token).digest('hex') }

export async function createShare(designId, identity, { accessType, expiresAt }) {
  await requireOwnedDesign(designId, identity)
  if (!['view_only', 'comment_enabled'].includes(accessType)) throw new PackagingStudioError('invalid_access_type')
  const token = generateShareToken()
  const db = getDb()
  const { rows } = await db.query(
    `INSERT INTO packaging_shares (design_id, share_token_hash, access_type, created_by_user_id, created_by_guest_reference, expires_at)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [designId, hashToken(token), accessType, identity.userId || null, identity.guestReference || null, expiresAt || null]
  )
  return { share: rows[0], token }
}
export async function listShares(designId, identity) {
  await requireOwnedDesign(designId, identity)
  const db = getDb()
  const { rows } = await db.query(`SELECT id, design_id, access_type, expires_at, revoked_at, last_accessed_at, access_count, created_at FROM packaging_shares WHERE design_id = $1 ORDER BY created_at DESC`, [designId])
  return rows
}
export async function revokeShare(shareId, identity) {
  const db = getDb()
  const { rows } = await db.query(`SELECT * FROM packaging_shares WHERE id = $1`, [shareId])
  const share = rows[0]
  if (!share) throw new PackagingStudioError('share_not_found')
  await requireOwnedDesign(share.design_id, identity)
  await db.query(`UPDATE packaging_shares SET revoked_at = now() WHERE id = $1`, [shareId])
}
export async function resolveShare(token) {
  const db = getDb()
  const { rows } = await db.query(`SELECT * FROM packaging_shares WHERE share_token_hash = $1`, [hashToken(token)])
  const share = rows[0]
  if (!share) throw new PackagingStudioError('share_not_found')
  if (share.revoked_at) throw new PackagingStudioError('share_revoked')
  if (share.expires_at && new Date(share.expires_at) < new Date()) throw new PackagingStudioError('share_expired')
  await db.query(`UPDATE packaging_shares SET last_accessed_at = now(), access_count = access_count + 1 WHERE id = $1`, [share.id])
  const design = await getDesign(share.design_id)
  if (!design) throw new PackagingStudioError('design_not_found')
  const version = await getCurrentVersion(share.design_id)
  return { share, design, version }
}

// ── Comments ──
export async function addComment(designId, identity, { targetType, targetRef, versionNumber, body, parentCommentId, shareId }) {
  const cleanBody = sanitizeText(body, 2000)
  if (!cleanBody) throw new PackagingStudioError('empty_comment')
  const db = getDb()
  const design = await getDesign(designId)
  if (!design) throw new PackagingStudioError('design_not_found')
  let authorShareId = null
  if (shareId) {
    const { rows } = await db.query(`SELECT * FROM packaging_shares WHERE id = $1 AND design_id = $2`, [shareId, designId])
    const share = rows[0]
    if (!share || share.revoked_at || (share.expires_at && new Date(share.expires_at) < new Date())) throw new PackagingStudioError('share_invalid')
    if (share.access_type !== 'comment_enabled') throw new PackagingStudioError('view_only_share_cannot_comment')
    authorShareId = share.id
  } else if (!ownsDesign(design, identity)) {
    const { rows } = await db.query(`SELECT 1 FROM packaging_collaborators WHERE design_id = $1 AND collaborator_user_id = $2 AND removed_at IS NULL AND role IN ('commenter','mentor')`, [designId, identity.userId])
    if (!rows[0]) throw new PackagingStudioError('not_authorized_to_comment')
  }
  const { rows } = await db.query(
    `INSERT INTO packaging_comments (design_id, version_number, target_type, target_ref, parent_comment_id, author_user_id, author_guest_reference, author_share_id, body)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [designId, versionNumber || null, targetType || 'design', targetRef || null, parentCommentId || null, identity.userId || null, authorShareId ? null : (identity.guestReference || null), authorShareId, cleanBody]
  )
  return rows[0]
}
export async function resolveComment(commentId, identity) {
  const db = getDb()
  const { rows } = await db.query(`SELECT * FROM packaging_comments WHERE id = $1`, [commentId])
  const comment = rows[0]
  if (!comment) throw new PackagingStudioError('comment_not_found')
  await requireOwnedDesign(comment.design_id, identity)
  const { rows: updated } = await db.query(
    `UPDATE packaging_comments SET status = 'resolved', resolved_at = now(), resolved_by_user_id = $2 WHERE id = $1 RETURNING *`,
    [commentId, identity.userId || identity.guestReference]
  )
  return updated[0]
}
export async function listComments(designId) {
  const db = getDb()
  const { rows } = await db.query(`SELECT * FROM packaging_comments WHERE design_id = $1 ORDER BY created_at ASC`, [designId])
  return rows
}

// ── Final submission ──
export async function submitFinalDesign(designId, identity, entryId) {
  const design = await requireOwnedDesign(designId, identity)
  if (!entryId) throw new PackagingStudioError('entry_required')
  const db = getDb()
  const { rows: entryRows } = await db.query(`SELECT * FROM golden_box_entries WHERE entry_id = $1`, [entryId])
  const entry = entryRows[0]
  if (!entry) throw new PackagingStudioError('entry_not_found')
  const ownsEntry = (!!identity.userId && identity.userId === entry.user_id) || (!!identity.guestReference && identity.guestReference === entry.guest_reference)
  if (!ownsEntry) throw new PackagingStudioError('entry_not_owned_by_caller')
  const version = await getCurrentVersion(designId)
  if (!version) throw new PackagingStudioError('no_current_version')
  const snapshot = version.snapshot || {}
  if (!snapshot.woodType || !snapshot.finish || !snapshot.lidStyle) throw new PackagingStudioError('incomplete_design')
  const idempotencyKey = `packaging_final:${entryId}`
  const { rows } = await db.query(
    `INSERT INTO packaging_final_submissions (entry_id, design_id, version_number, snapshot, submitted_by_user_id, submitted_by_guest_reference, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (idempotency_key) DO NOTHING RETURNING *`,
    [entryId, designId, version.version_number, JSON.stringify(snapshot), identity.userId || null, identity.guestReference || null, idempotencyKey]
  )
  if (!rows[0]) {
    const { rows: existing } = await db.query(`SELECT * FROM packaging_final_submissions WHERE entry_id = $1`, [entryId])
    return existing[0]
  }
  await db.query(`UPDATE packaging_designs SET status = 'submitted', updated_at = now() WHERE design_id = $1`, [designId])
  return rows[0]
}
export async function getFinalSubmission(entryId) {
  const db = getDb()
  const { rows } = await db.query(`SELECT * FROM packaging_final_submissions WHERE entry_id = $1`, [entryId])
  return rows[0] || null
}
