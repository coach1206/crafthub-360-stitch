import { getDb } from '../../db/connection.js'
import { validateImageBuffer, normalizeFilename } from './imageValidation.js'
import * as storage from './storageAdapter.js'

const pool = { query: (...args) => getDb().query(...args) }

export class MediaValidationError extends Error {
  constructor(code) { super(code); this.code = code }
}

export async function createMedia({ venueId, buffer, originalFilename, mediaType, altText, actorId }) {
  const result = validateImageBuffer(buffer)
  if (!result.ok) throw new MediaValidationError(result.error)
  if (!['image', 'logo', 'banner', 'document'].includes(mediaType)) {
    throw new MediaValidationError('invalid_media_type')
  }

  const { storageKey } = storage.upload({ venueId, buffer, mimeType: result.mimeType })
  const filename = normalizeFilename(originalFilename)

  try {
    const { rows } = await pool.query(
      `INSERT INTO venue_management_media
         (venue_id, media_type, storage_path, mime_type, size_bytes, width, height, alt_text, uploaded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id, venue_id, media_type, mime_type, size_bytes, width, height, alt_text, in_use, uploaded_by, created_at`,
      [venueId, mediaType, storageKey, result.mimeType, buffer.length, result.width, result.height, altText || null, actorId]
    )
    return { ...rows[0], filename, url: storage.getControlledUrl(rows[0].id) }
  } catch (err) {
    // Clean up the just-written file if the DB insert fails.
    storage.remove(storageKey)
    throw err
  }
}

export async function listVenueMedia(venueId) {
  const { rows } = await pool.query(
    `SELECT id, venue_id, media_type, mime_type, size_bytes, width, height, alt_text, in_use, uploaded_by, created_at, deleted_at
     FROM venue_management_media WHERE venue_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC`,
    [venueId]
  )
  return rows.map((r) => ({ ...r, url: storage.getControlledUrl(r.id) }))
}

export async function getMedia(mediaId, venueId) {
  const { rows } = await pool.query(
    `SELECT * FROM venue_management_media WHERE id = $1 AND venue_id = $2 AND deleted_at IS NULL`,
    [mediaId, venueId]
  )
  return rows[0] || null
}

export async function updateMediaMetadata(mediaId, venueId, { altText }) {
  const { rows } = await pool.query(
    `UPDATE venue_management_media SET alt_text = $3
     WHERE id = $1 AND venue_id = $2 AND deleted_at IS NULL RETURNING *`,
    [mediaId, venueId, altText ?? null]
  )
  return rows[0] || null
}

export async function checkMediaUsage(mediaId, venueId) {
  const { rows } = await pool.query(
    `SELECT
        EXISTS(SELECT 1 FROM venue_management_profiles WHERE venue_id=$2 AND is_current AND (logo_media_id=$1 OR hero_media_id=$1)) AS assigned_branding,
        EXISTS(SELECT 1 FROM venue_management_profiles WHERE venue_id=$2 AND is_current AND gallery_media_ids @> to_jsonb($1::bigint)) AS in_gallery`,
    [mediaId, venueId]
  )
  const row = rows[0]
  return { inUse: !!(row.assigned_branding || row.in_gallery), assignedBranding: row.assigned_branding, inGallery: row.in_gallery }
}

export async function archiveMedia(mediaId, venueId, actorId) {
  const usage = await checkMediaUsage(mediaId, venueId)
  if (usage.inUse) throw new MediaValidationError('media_in_use')
  const { rows } = await pool.query(
    `UPDATE venue_management_media SET deleted_at = now()
     WHERE id = $1 AND venue_id = $2 AND deleted_at IS NULL RETURNING *`,
    [mediaId, venueId]
  )
  if (!rows[0]) throw new MediaValidationError('media_not_found')
  return rows[0]
}

export async function restoreMedia(mediaId, venueId) {
  const { rows } = await pool.query(
    `UPDATE venue_management_media SET deleted_at = NULL
     WHERE id = $1 AND venue_id = $2 RETURNING *`,
    [mediaId, venueId]
  )
  return rows[0] || null
}

export function readMediaFile(storageKey) {
  return storage.readBuffer(storageKey)
}
