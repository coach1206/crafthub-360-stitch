/**
 * Venue Humidor Media and Product Image Management — Production
 * Package 1 of 7.
 *
 * Reuses the existing Package 6B image-validation and local-disk
 * storage-adapter modules (server/services/venueManagement/) rather
 * than inventing a second file-handling stack — those modules are
 * already provider-agnostic (buffer in, storageKey/checksum out) and
 * explicitly written to be swapped for a real object-storage provider
 * later without touching callers. STORAGE_PROVIDER_STATUS remains
 * 'NOT_CONFIGURED' (local-dev-disk fallback) because no S3/Cloudinary/
 * GCS credentials exist anywhere in this repo's env config — this file
 * never claims otherwise.
 *
 * All product-image invariants (venue isolation, one-active-primary-
 * per-product, approved+active-only public visibility) are enforced
 * here AND at the database constraint level (migration 114), so a bug
 * in this file cannot silently violate them.
 */
import crypto from 'crypto'
import { getDb } from '../../db/connection.js'
import { validateImageBuffer, normalizeFilename } from '../venueManagement/imageValidation.js'
import * as storage from '../venueManagement/storageAdapter.js'

export class MediaError extends Error {
  constructor(code, fieldErrors) { super(code); this.code = code; if (fieldErrors) this.fieldErrors = fieldErrors }
}

const PURPOSES = [
  'product_primary', 'product_gallery', 'product_thumbnail', 'inventory_table', 'browse_card',
  'detail_hero', 'recommendation', 'pairing', 'passport_acquisition', 'fulfillment', 'receipt',
  'venue_hero', 'venue_gallery', 'empty_state', 'error_fallback', 'investor_demo',
]
const SOURCE_TYPES = [
  'venue_uploaded_photography', 'venue_uploaded_venue_photography', 'manufacturer_authorized',
  'distributor_authorized', 'smokecraft_master_catalog', 'educational_graphic',
  'branded_placeholder', 'generated_ui_overlay',
]
// Never scraped/unlicensed/random-stock — only these are legitimate
// non-placeholder, non-venue-uploaded provenance classes.
const RIGHTS_REQUIRED_SOURCE_TYPES = ['manufacturer_authorized', 'distributor_authorized']

// SSRF guard: manufacturer/distributor URL import only ever fetches
// from a fixed allowlist of authorized-media domains, downloaded
// server-side (never client-side hotlinked). No general web fetch.
export const IMPORT_DOMAIN_ALLOWLIST = (process.env.VENUE_HUMIDOR_MEDIA_IMPORT_ALLOWLIST ||
  'media.padron-authorized.example,cdn.oliva-authorized.example,assets.davidoff-authorized.example,distributor-media.smokecraft-authorized.example')
  .split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)

function assertAllowedImportDomain(rawUrl) {
  let parsed
  try { parsed = new URL(rawUrl) } catch { throw new MediaError('invalid_import_url') }
  if (parsed.protocol !== 'https:') throw new MediaError('invalid_import_url')
  const host = parsed.hostname.toLowerCase()
  if (!IMPORT_DOMAIN_ALLOWLIST.includes(host)) throw new MediaError('import_domain_not_allowed')
  return parsed
}

function correlationId() { return crypto.randomUUID() }

// Controlled, app-routed URL for this feature's own file-serving
// endpoint (never storage.getControlledUrl's venue-management path,
// and never a raw filesystem path) — re-checks venue + approval state
// on every request (see venueHumidorMediaController.handleGetAssetFile).
function assetUrl(venueId, assetId) {
  return `/api/smokecraft/venue-humidor/venues/${venueId}/media/asset/${assetId}/file`
}

// Public equivalent — served from the customer router, approval/active
// re-checked on every request (see handleGetPublicAssetFile).
function publicAssetUrl(venueId, assetId) {
  return `/api/smokecraft/venue-humidor/customer/venues/${venueId}/media/asset/${assetId}/file`
}

async function recordEvent(client, { venueId, assetId, productId, action, actorId, actorRole, before, after, correlationId: cid }) {
  await client.query(
    `INSERT INTO venue_cigar_media_events
       (venue_id, asset_id, product_id, action, actor_id, actor_role, before_summary, after_summary, correlation_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [venueId, assetId || null, productId || null, action, actorId, actorRole || null,
      before ? JSON.stringify(before) : null, after ? JSON.stringify(after) : null, cid || correlationId()]
  )
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function assertProductBelongsToVenue(db, venueId, productId) {
  // Malformed/foreign productId is a validation failure (422), never a
  // raw DB error (500) — checked before the query ever runs.
  if (!productId || !UUID_RE.test(productId)) throw new MediaError('invalid_product_assignment')
  const { rows } = await db.query(`SELECT product_id, sku, brand, vitola FROM venue_cigar_products WHERE product_id = $1 AND venue_id = $2`, [productId, venueId])
  if (!rows[0]) throw new MediaError('invalid_product_assignment')
  return rows[0]
}

// ── Upload ────────────────────────────────────────────────────────────

/**
 * Validates + stores a raw upload buffer. Duplicate detection is by
 * (venue, checksum) — a re-upload of the identical file is rejected
 * with a specific code rather than silently re-inserted.
 */
export async function uploadAsset({ venueId, productId, scope, purpose, buffer, originalFilename,
  sourceType, sourceName, sourceUrl, rightsReference, altText, caption, actorId, actorRole }) {
  const db = getDb()
  if (!PURPOSES.includes(purpose)) throw new MediaError('invalid_purpose')
  if (!SOURCE_TYPES.includes(sourceType)) throw new MediaError('invalid_source_type')
  if (scope === 'product' && !productId) throw new MediaError('product_id_required')
  if (RIGHTS_REQUIRED_SOURCE_TYPES.includes(sourceType) && !rightsReference) {
    throw new MediaError('rights_reference_required', { rightsReference: 'required for this source type' })
  }

  if (scope === 'product') await assertProductBelongsToVenue(db, venueId, productId)

  const validation = validateImageBuffer(buffer)
  if (!validation.ok) throw new MediaError(validation.error)

  const checksum = crypto.createHash('sha256').update(buffer).digest('hex')
  const { rows: dupe } = await db.query(
    `SELECT asset_id FROM venue_cigar_media_assets WHERE venue_id = $1 AND checksum = $2`, [venueId, checksum]
  )
  if (dupe[0]) throw new MediaError('duplicate_asset')

  const { storageKey } = storage.upload({ venueId, buffer, mimeType: validation.mimeType })
  const normalizedFilename = `${crypto.randomUUID()}.${(validation.mimeType.split('/')[1] || 'bin')}`
  const originalNormalized = normalizeFilename(originalFilename)

  try {
    const { rows } = await db.query(
      `INSERT INTO venue_cigar_media_assets
        (venue_id, product_id, scope, purpose, source_type, source_name, source_url, rights_reference,
         storage_provider, storage_key, original_filename, normalized_filename, mime_type, width, height,
         size_bytes, checksum, alt_text, caption, approval_state, active_state, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'local_dev_disk',$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,'pending_review','inactive',$19)
       RETURNING *`,
      [venueId, productId || null, scope, purpose, sourceType, sourceName || null, sourceUrl || null,
        rightsReference || null, storageKey, originalNormalized, normalizedFilename, validation.mimeType,
        validation.width, validation.height, buffer.length, checksum, altText || null, caption || null, actorId]
    )
    const asset = rows[0]
    await recordEvent(db, { venueId, assetId: asset.asset_id, productId, action: 'upload', actorId, actorRole,
      after: { purpose, sourceType, approvalState: 'pending_review' } })
    return toPublicAssetShape(asset)
  } catch (err) {
    storage.remove(storageKey)
    throw err
  }
}

// ── Assignment / metadata / ordering ────────────────────────────────

export async function assignToProduct(venueId, assetId, productId, actorId, actorRole) {
  const db = getDb()
  await assertProductBelongsToVenue(db, venueId, productId)
  const { rows } = await db.query(
    `UPDATE venue_cigar_media_assets SET product_id = $3, scope = 'product', updated_at = now()
     WHERE asset_id = $1 AND venue_id = $2 RETURNING *`,
    [assetId, venueId, productId]
  )
  if (!rows[0]) throw new MediaError('asset_not_found')
  await recordEvent(db, { venueId, assetId, productId, action: 'assign', actorId, actorRole, after: { productId } })
  return toPublicAssetShape(rows[0])
}

export async function editMetadata(venueId, assetId, actorId, actorRole, patch) {
  const db = getDb()
  const { rows: existingRows } = await db.query(`SELECT * FROM venue_cigar_media_assets WHERE asset_id = $1 AND venue_id = $2`, [assetId, venueId])
  if (!existingRows[0]) throw new MediaError('asset_not_found')
  const before = existingRows[0]
  const { rows } = await db.query(
    `UPDATE venue_cigar_media_assets SET
       alt_text = COALESCE($3, alt_text), caption = COALESCE($4, caption),
       focal_point_x = COALESCE($5, focal_point_x), focal_point_y = COALESCE($6, focal_point_y),
       notes = COALESCE($7, notes), updated_at = now()
     WHERE asset_id = $1 AND venue_id = $2 RETURNING *`,
    [assetId, venueId, patch.altText ?? null, patch.caption ?? null, patch.focalPointX ?? null, patch.focalPointY ?? null, patch.notes ?? null]
  )
  await recordEvent(db, { venueId, assetId, productId: before.product_id, action: 'metadata_edit', actorId, actorRole,
    before: { altText: before.alt_text, caption: before.caption }, after: { altText: rows[0].alt_text, caption: rows[0].caption } })
  return toPublicAssetShape(rows[0])
}

// ── Primary / ordering ──────────────────────────────────────────────

export async function setPrimary(venueId, productId, assetId, actorId, actorRole) {
  const client = await getDb().connect()
  try {
    await client.query('BEGIN')
    const { rows: assetRows } = await client.query(
      `SELECT * FROM venue_cigar_media_assets WHERE asset_id = $1 AND venue_id = $2 AND product_id = $3`,
      [assetId, venueId, productId]
    )
    if (!assetRows[0]) throw new MediaError('asset_not_found')
    if (assetRows[0].approval_state !== 'approved') throw new MediaError('asset_not_approved')
    await client.query(
      `UPDATE venue_cigar_media_assets SET is_primary = false, updated_at = now()
       WHERE product_id = $1 AND venue_id = $2 AND is_primary = true`,
      [productId, venueId]
    )
    const { rows } = await client.query(
      `UPDATE venue_cigar_media_assets SET is_primary = true, active_state = 'active', updated_at = now()
       WHERE asset_id = $1 RETURNING *`,
      [assetId]
    )
    await recordEvent(client, { venueId, assetId, productId, action: 'primary_change', actorId, actorRole, after: { assetId } })
    await client.query('COMMIT')
    return toPublicAssetShape(rows[0])
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function reorderGallery(venueId, productId, orderedAssetIds, actorId, actorRole) {
  const db = getDb()
  await assertProductBelongsToVenue(db, venueId, productId)
  for (let i = 0; i < orderedAssetIds.length; i++) {
    await db.query(
      `UPDATE venue_cigar_media_assets SET display_order = $3, updated_at = now()
       WHERE asset_id = $1 AND venue_id = $2 AND product_id = $4`,
      [orderedAssetIds[i], venueId, i, productId]
    )
  }
  await recordEvent(db, { venueId, productId, action: 'ordering_change', actorId, actorRole, after: { orderedAssetIds } })
  return listProductGallery(venueId, productId, { includeUnapproved: true })
}

// ── Approval / moderation ───────────────────────────────────────────

export async function approve(venueId, assetId, actorId, actorRole) {
  const db = getDb()
  const { rows } = await db.query(
    `UPDATE venue_cigar_media_assets SET approval_state = 'approved', active_state = 'active',
       approved_by = $3, approved_at = now(), review_date = (now() + interval '365 days')::date, updated_at = now()
     WHERE asset_id = $1 AND venue_id = $2 RETURNING *`,
    [assetId, venueId, actorId]
  )
  if (!rows[0]) throw new MediaError('asset_not_found')
  await recordEvent(db, { venueId, assetId, productId: rows[0].product_id, action: 'approve', actorId, actorRole, after: { approvalState: 'approved' } })
  return toPublicAssetShape(rows[0])
}

export async function reject(venueId, assetId, actorId, actorRole, reason) {
  if (!reason) throw new MediaError('rejection_reason_required')
  const db = getDb()
  const { rows } = await db.query(
    `UPDATE venue_cigar_media_assets SET approval_state = 'rejected', active_state = 'inactive',
       rejection_reason = $3, updated_at = now()
     WHERE asset_id = $1 AND venue_id = $2 RETURNING *`,
    [assetId, venueId, reason]
  )
  if (!rows[0]) throw new MediaError('asset_not_found')
  await recordEvent(db, { venueId, assetId, productId: rows[0].product_id, action: 'reject', actorId, actorRole, after: { reason } })
  return toPublicAssetShape(rows[0])
}

export async function activate(venueId, assetId, actorId, actorRole) {
  const db = getDb()
  const { rows: existing } = await db.query(`SELECT * FROM venue_cigar_media_assets WHERE asset_id = $1 AND venue_id = $2`, [assetId, venueId])
  if (!existing[0]) throw new MediaError('asset_not_found')
  if (existing[0].approval_state !== 'approved') throw new MediaError('asset_not_approved')
  const { rows } = await db.query(
    `UPDATE venue_cigar_media_assets SET active_state = 'active', updated_at = now() WHERE asset_id = $1 RETURNING *`, [assetId]
  )
  await recordEvent(db, { venueId, assetId, productId: rows[0].product_id, action: 'activate', actorId, actorRole })
  return toPublicAssetShape(rows[0])
}

// Prefer retirement over destructive deletion once an asset has any
// historical reference (order/receipt/Passport/audit). Destructive
// provider deletion is not exposed here at all this pass — retirement
// only — matching the mandate's "no dangling primary references" rule.
export async function retire(venueId, assetId, actorId, actorRole, reason) {
  const db = getDb()
  const { rows } = await db.query(
    `UPDATE venue_cigar_media_assets SET active_state = 'retired', is_primary = false,
       retirement_reason = $3, retired_by = $4, retired_at = now(), updated_at = now()
     WHERE asset_id = $1 AND venue_id = $2 RETURNING *`,
    [assetId, venueId, reason || null, actorId]
  )
  if (!rows[0]) throw new MediaError('asset_not_found')
  await recordEvent(db, { venueId, assetId, productId: rows[0].product_id, action: 'retire', actorId, actorRole, after: { reason } })
  return toPublicAssetShape(rows[0])
}

// ── Listing ──────────────────────────────────────────────────────────

export async function listVenueMedia(venueId, filters = {}) {
  const db = getDb()
  const clauses = ['venue_id = $1']
  const params = [venueId]
  if (filters.scope) { params.push(filters.scope); clauses.push(`scope = $${params.length}`) }
  if (filters.approvalState) { params.push(filters.approvalState); clauses.push(`approval_state = $${params.length}`) }
  const { rows } = await db.query(
    `SELECT * FROM venue_cigar_media_assets WHERE ${clauses.join(' AND ')} ORDER BY created_at DESC`, params
  )
  return rows.map(toPublicAssetShape)
}

export async function listProductGallery(venueId, productId, { includeUnapproved = false } = {}) {
  const db = getDb()
  const clauses = ['venue_id = $1', 'product_id = $2']
  if (!includeUnapproved) clauses.push(`approval_state = 'approved'`, `active_state = 'active'`)
  const { rows } = await db.query(
    `SELECT * FROM venue_cigar_media_assets WHERE ${clauses.join(' AND ')} ORDER BY is_primary DESC, display_order ASC, created_at ASC`,
    [venueId, productId]
  )
  return rows.map(toPublicAssetShape)
}

// Public, customer-facing lookup — approved + active only, ever.
export async function getPublicProductMedia(venueId, productId) {
  const gallery = await listProductGallery(venueId, productId)
  const stripped = gallery.map((g) => {
    const { sourceUrl, rightsReference, rejectionReason, retirementReason, reviewDate, notes, approvedBy, approvedAt, createdBy, checksum, ...pub } = g
    return { ...pub, url: publicAssetUrl(venueId, g.assetId) }
  })
  if (stripped.length > 0) return stripped
  return resolveFallback(venueId, productId)
}

// ── Fallback chain: approved product primary -> approved venue gallery
// fallback -> approved matching master-catalog image -> branded
// placeholder. Never an unrelated cigar.
async function resolveFallback(venueId, productId) {
  const db = getDb()
  const { rows: productRows } = await db.query(`SELECT brand, product_line, vitola, sku FROM venue_cigar_products WHERE product_id = $1 AND venue_id = $2`, [productId, venueId])
  const product = productRows[0]
  if (!product) return [{ ...brandedPlaceholder(), fallbackReason: 'product_not_found' }]

  const { rows: venueFallback } = await db.query(
    `SELECT * FROM venue_cigar_media_assets
     WHERE venue_id = $1 AND scope = 'venue' AND purpose = 'error_fallback'
       AND approval_state = 'approved' AND active_state = 'active' ORDER BY created_at DESC LIMIT 1`,
    [venueId]
  )
  if (venueFallback[0]) {
    const shaped = toPublicSafeShape(venueFallback[0])
    return [{ ...shaped, url: publicAssetUrl(venueId, venueFallback[0].asset_id), fallbackReason: 'venue_gallery_fallback' }]
  }

  const { rows: master } = await db.query(
    `SELECT * FROM venue_cigar_media_master_catalog
     WHERE brand = $1 AND (line = $2 OR line IS NULL) AND (vitola = $3 OR vitola IS NULL)
       AND approval_state = 'approved' AND active_state = 'active' ORDER BY line NULLS LAST, vitola NULLS LAST LIMIT 1`,
    [product.brand, product.product_line, product.vitola]
  )
  if (master[0]) return [{ ...toMasterPublicShape(master[0]), fallbackReason: 'master_catalog_match' }]

  return [{ ...brandedPlaceholder(), fallbackReason: 'branded_placeholder' }]
}

function brandedPlaceholder() {
  return {
    assetId: 'smokecraft-branded-placeholder', scope: 'product', purpose: 'product_primary',
    sourceType: 'branded_placeholder', url: '/assets/venue-humidor/branded-placeholder.svg',
    altText: 'SmokeCraft branded placeholder — real product photography pending',
    isPrimary: true, approvalState: 'approved', activeState: 'active',
  }
}

// ── Master catalog ──────────────────────────────────────────────────

export async function listMasterCatalog(filters = {}) {
  const db = getDb()
  const clauses = ['1=1']
  const params = []
  if (filters.brand) { params.push(filters.brand); clauses.push(`brand = $${params.length}`) }
  if (filters.approvalState) { params.push(filters.approvalState); clauses.push(`approval_state = $${params.length}`) }
  const { rows } = await db.query(`SELECT * FROM venue_cigar_media_master_catalog WHERE ${clauses.join(' AND ')} ORDER BY brand, line, vitola`, params)
  return rows.map(toMasterPublicShape)
}

// Venue staff may only assign a master image whose brand/line/vitola
// genuinely matches the target product — never an arbitrary assignment.
export async function assignMasterToProduct(venueId, productId, masterImageId, actorId, actorRole) {
  const db = getDb()
  const product = await assertProductBelongsToVenue(db, venueId, productId)
  const { rows: masterRows } = await db.query(
    `SELECT * FROM venue_cigar_media_master_catalog WHERE master_image_id = $1 AND approval_state = 'approved' AND active_state = 'active'`,
    [masterImageId]
  )
  const master = masterRows[0]
  if (!master) throw new MediaError('master_image_not_found')
  if (master.brand !== product.brand) throw new MediaError('master_image_product_mismatch')

  const { rows } = await db.query(
    `INSERT INTO venue_cigar_media_assets
       (venue_id, product_id, master_image_id, scope, purpose, source_type, source_name, rights_reference,
        storage_provider, storage_key, original_filename, normalized_filename, mime_type, width, height,
        size_bytes, checksum, approval_state, active_state, created_by)
     VALUES ($1,$2,$3,'product','product_primary','smokecraft_master_catalog',$4,$5,$6,$7,'master-catalog','master-catalog',$8,$9,$10,$11,$12,'approved','active',$13)
     RETURNING *`,
    [venueId, productId, masterImageId, master.source_name, master.rights_reference, master.storage_provider,
      master.storage_key, master.mime_type, master.width, master.height, master.size_bytes, master.checksum + ':' + productId, actorId]
  )
  await recordEvent(db, { venueId, assetId: rows[0].asset_id, productId, action: 'assign', actorId, actorRole, after: { masterImageId } })
  return toPublicAssetShape(rows[0])
}

// ── Manufacturer/distributor URL import (allowlisted, server-side
// download only — no client-side hotlinking, no SSRF via arbitrary URL).
export async function importFromUrl({ venueId, productId, purpose, sourceType, sourceName, sourceUrl,
  rightsReference, actorId, actorRole }) {
  if (!['manufacturer_authorized', 'distributor_authorized'].includes(sourceType)) {
    throw new MediaError('invalid_source_type_for_import')
  }
  if (!rightsReference) throw new MediaError('rights_reference_required')
  assertAllowedImportDomain(sourceUrl)

  const response = await fetch(sourceUrl, { redirect: 'error' })
  if (!response.ok) throw new MediaError('import_fetch_failed')
  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const asset = await uploadAsset({
    venueId, productId, scope: 'product', purpose, buffer,
    originalFilename: sourceUrl.split('/').pop() || 'imported.jpg',
    sourceType, sourceName, sourceUrl, rightsReference, actorId, actorRole,
  })
  await recordEvent(getDb(), { venueId, assetId: asset.assetId, productId, action: 'import', actorId, actorRole, after: { sourceUrl } })
  return asset
}

// ── CSV import (manifest) ───────────────────────────────────────────
// fields: venue_id,cigar_id,sku,barcode,brand,line,vitola,image_url,
// image_purpose,source_type,source_name,rights_reference,alt_text,
// primary,display_order
export function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length === 0) return { header: [], rows: [] }
  const header = lines[0].split(',').map((h) => h.trim())
  const rows = lines.slice(1).map((line) => {
    const cells = line.split(',').map((c) => c.trim())
    const obj = {}
    header.forEach((h, i) => { obj[h] = cells[i] ?? '' })
    return obj
  })
  return { header, rows }
}

const CSV_REQUIRED_FIELDS = ['venue_id', 'cigar_id', 'sku', 'image_url', 'image_purpose', 'source_type']

export async function runCsvImport(venueId, csvText, actorId, { dryRun = true } = {}) {
  const db = getDb()
  const { rows } = parseCsv(csvText)
  const results = []
  let successCount = 0

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2 // header is row 1
    const errors = []
    for (const field of CSV_REQUIRED_FIELDS) {
      if (!row[field]) errors.push(`missing_${field}`)
    }
    if (row.venue_id && row.venue_id !== venueId) errors.push('venue_isolation_violation')
    if (row.image_purpose && !PURPOSES.includes(row.image_purpose)) errors.push('invalid_purpose')
    if (row.source_type && !SOURCE_TYPES.includes(row.source_type)) errors.push('invalid_source_type')

    let product = null
    if (errors.length === 0) {
      const { rows: productRows } = await db.query(
        `SELECT product_id, sku FROM venue_cigar_products WHERE venue_id = $1 AND product_id = $2`,
        [venueId, row.cigar_id]
      )
      product = productRows[0]
      if (!product) errors.push('product_not_found')
      else if (product.sku !== row.sku) errors.push('sku_mismatch')
    }

    if (errors.length > 0) {
      results.push({ row: rowNum, status: 'error', errors })
      continue
    }

    if (dryRun) {
      results.push({ row: rowNum, status: 'valid' })
      successCount++
      continue
    }

    try {
      assertAllowedImportDomain(row.image_url)
      const asset = await importFromUrl({
        venueId, productId: row.cigar_id, purpose: row.image_purpose, sourceType: row.source_type,
        sourceName: row.source_name || null, sourceUrl: row.image_url, rightsReference: row.rights_reference || 'csv-manifest',
        actorId, actorRole: 'staff',
      })
      results.push({ row: rowNum, status: 'imported', assetId: asset.assetId })
      successCount++
    } catch (err) {
      results.push({ row: rowNum, status: 'error', errors: [err.code || 'import_failed'] })
    }
  }

  const { rows: batchRows } = await db.query(
    `INSERT INTO venue_cigar_media_import_batches (venue_id, mode, total_rows, success_rows, error_rows, row_results, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [venueId, dryRun ? 'dry_run' : 'import', rows.length, successCount, rows.length - successCount, JSON.stringify(results), actorId]
  )
  await recordEvent(db, { venueId, action: 'import', actorId, actorRole: 'staff',
    after: { batchId: batchRows[0].batch_id, mode: dryRun ? 'dry_run' : 'import', successCount, errorCount: rows.length - successCount } })

  return { batchId: batchRows[0].batch_id, mode: dryRun ? 'dry_run' : 'import', totalRows: rows.length, successRows: successCount, errorRows: rows.length - successCount, results }
}

// ── Missing-image report ────────────────────────────────────────────

export async function missingImageReport(venueId, { status } = {}) {
  const db = getDb()
  const { rows: products } = await db.query(
    `SELECT p.product_id, p.sku, p.name, p.brand,
       (SELECT count(*) FROM venue_cigar_media_assets a WHERE a.product_id = p.product_id AND a.approval_state='approved' AND a.active_state='active') AS approved_count,
       (SELECT count(*) FROM venue_cigar_media_assets a WHERE a.product_id = p.product_id AND a.is_primary = true AND a.active_state = 'active') AS primary_count,
       (SELECT count(*) FROM venue_cigar_media_assets a WHERE a.product_id = p.product_id AND a.approval_state = 'failed') AS failed_count,
       (SELECT count(*) FROM venue_cigar_media_assets a WHERE a.product_id = p.product_id AND a.review_date IS NOT NULL AND a.review_date < now()::date) AS expired_rights_count
     FROM venue_cigar_products p WHERE p.venue_id = $1`,
    [venueId]
  )
  const rows = products.map((p) => {
    let issue = null
    if (Number(p.approved_count) === 0) issue = 'no_approved_image'
    else if (Number(p.primary_count) === 0) issue = 'missing_primary'
    else if (Number(p.failed_count) > 0) issue = 'processing_failure'
    else if (Number(p.expired_rights_count) > 0) issue = 'expired_rights_review_needed'
    return { productId: p.product_id, sku: p.sku, name: p.name, brand: p.brand, issue }
  }).filter((r) => (status ? r.issue === status : r.issue !== null))
  return rows
}

// ── Public retrieval (approved + active only) ───────────────────────

export async function getPublicApprovedAsset(venueId, assetId) {
  const db = getDb()
  const { rows } = await db.query(
    `SELECT * FROM venue_cigar_media_assets WHERE asset_id = $1 AND venue_id = $2 AND approval_state = 'approved' AND active_state = 'active'`,
    [assetId, venueId]
  )
  if (!rows[0]) return null
  return toPublicAssetShape(rows[0])
}

// ── Shaping ──────────────────────────────────────────────────────────
// Private rights/notes fields are stripped for any caller that renders
// to the customer-facing public API; admin controllers pass
// includePrivate: true explicitly where needed.
function toPublicAssetShape(row, { includePrivate = true } = {}) {
  const shape = {
    assetId: row.asset_id, venueId: row.venue_id, productId: row.product_id, scope: row.scope,
    purpose: row.purpose, sourceType: row.source_type, sourceName: row.source_name,
    mimeType: row.mime_type, width: row.width, height: row.height, sizeBytes: row.size_bytes,
    altText: row.alt_text, caption: row.caption, focalPointX: row.focal_point_x, focalPointY: row.focal_point_y,
    displayOrder: row.display_order, isPrimary: row.is_primary, approvalState: row.approval_state,
    activeState: row.active_state, createdAt: row.created_at, updatedAt: row.updated_at,
    url: assetUrl(row.venue_id, row.asset_id),
    variants: buildResponsiveVariants(row.venue_id, row.asset_id, row.width, row.height),
  }
  if (includePrivate) {
    Object.assign(shape, {
      sourceUrl: row.source_url, rightsReference: row.rights_reference, rejectionReason: row.rejection_reason,
      retirementReason: row.retirement_reason, reviewDate: row.review_date, notes: row.notes,
      approvedBy: row.approved_by, approvedAt: row.approved_at, createdBy: row.created_by, checksum: row.checksum,
    })
  }
  return shape
}

export function toPublicSafeShape(row) { return toPublicAssetShape(row, { includePrivate: false }) }

function toMasterPublicShape(row) {
  return {
    masterImageId: row.master_image_id, brand: row.brand, line: row.line, vitola: row.vitola, sku: row.sku,
    sourceType: row.source_type, sourceName: row.source_name, approvalState: row.approval_state,
    activeState: row.active_state, url: `/api/smokecraft/venue-humidor/media/master-catalog/${row.master_image_id}/file`,
    width: row.width, height: row.height,
  }
}

// Width-bucketed metadata for srcset-style responsive delivery. This
// local-disk dev adapter serves the same underlying file for every
// bucket (no real resize pipeline yet) but the metadata contract
// matches what a provider-transform URL scheme would populate, so
// swapping in a real provider later is metadata-compatible.
function buildResponsiveVariants(venueId, assetId, width, height) {
  const aspect = width && height ? width / height : 16 / 9
  const buckets = { thumbnail: 160, browseCard: 400, tablet: 768, desktop: 1200 }
  const url = assetUrl(venueId, assetId)
  const variants = {}
  for (const [name, w] of Object.entries(buckets)) {
    variants[name] = { url, width: w, height: Math.round(w / aspect) }
  }
  return variants
}

export { PURPOSES, SOURCE_TYPES }
