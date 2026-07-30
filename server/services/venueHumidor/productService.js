/**
 * Venue Humidor 1A / 1B-2B-1 — product catalog service. Venue-isolated
 * by construction: every query is scoped by a real venue_id parameter.
 * The sole owner of venue_cigar_products create/update/classification
 * writes — the 1B-2B-1 staff admin screens call these same functions
 * rather than duplicating product-ownership logic.
 */
import { getDb } from '../../db/connection.js'
import { getProductAvailability, computeAvailableQuantity } from './inventoryService.js'

export class ProductError extends Error {
  constructor(code) { super(code); this.code = code }
}

const UNIQUE_VIOLATION = '23505'

const STRENGTH_VALUES = ['mild', 'mild_medium', 'medium', 'medium_full', 'full']
const BODY_VALUES = ['light', 'light_medium', 'medium', 'medium_full', 'full']
const EXPERIENCE_VALUES = ['beginner', 'intermediate', 'experienced']
const STATUS_VALUES = ['active', 'sold_out', 'discontinued']

// Fields an admin create/edit form may submit — every one is either
// validated below or passed through as an optional plain column. This
// is the single allow-list both createProduct and updateProduct use,
// so a form field can never silently write to an unintended column.
const EDITABLE_FIELDS = [
  'sku', 'barcode', 'name', 'brand', 'productLine', 'country', 'region',
  'vitola', 'lengthInches', 'ringGauge', 'wrapper', 'binder', 'filler',
  'strength', 'body', 'flavorNotes', 'tags', 'smokeTimeMinutes', 'experienceLevel',
  'priceCents', 'boxPriceCents', 'boxQuantity', 'costCents',
  'reorderThreshold', 'humidorZone', 'storageLocation',
  'supplierName', 'supplierSku', 'primaryImageUrl', 'secondaryImageUrl',
  'venueDescription', 'staffNotes',
]

const COLUMN_BY_FIELD = {
  sku: 'sku', barcode: 'barcode', name: 'name', brand: 'brand', productLine: 'product_line',
  country: 'country', region: 'region', vitola: 'vitola', lengthInches: 'length_inches',
  ringGauge: 'ring_gauge', wrapper: 'wrapper', binder: 'binder', filler: 'filler',
  strength: 'strength', body: 'body', flavorNotes: 'flavor_notes', tags: 'tags',
  smokeTimeMinutes: 'smoke_time_minutes', experienceLevel: 'experience_level',
  priceCents: 'price_cents', boxPriceCents: 'box_price_cents', boxQuantity: 'box_quantity',
  costCents: 'cost_cents', reorderThreshold: 'reorder_threshold', humidorZone: 'humidor_zone',
  storageLocation: 'storage_location', supplierName: 'supplier_name', supplierSku: 'supplier_sku',
  primaryImageUrl: 'primary_image_url', secondaryImageUrl: 'secondary_image_url',
  venueDescription: 'venue_description', staffNotes: 'staff_notes',
}

const JSON_FIELDS = new Set(['flavorNotes', 'tags', 'metadata'])

function validateFieldErrors(payload, { partial } = {}) {
  const errors = {}
  if (!partial || payload.sku !== undefined) {
    if (!payload.sku) errors.sku = 'sku_required'
  }
  if (!partial || payload.name !== undefined) {
    if (!payload.name) errors.name = 'name_required'
  }
  if (!partial || payload.priceCents !== undefined) {
    if (!(Number.isInteger(payload.priceCents) && payload.priceCents >= 0)) errors.priceCents = 'valid_price_required'
  }
  if (payload.strength != null && !STRENGTH_VALUES.includes(payload.strength)) errors.strength = 'invalid_strength'
  if (payload.body != null && !BODY_VALUES.includes(payload.body)) errors.body = 'invalid_body'
  if (payload.experienceLevel != null && !EXPERIENCE_VALUES.includes(payload.experienceLevel)) errors.experienceLevel = 'invalid_experience_level'
  if (payload.costCents != null && !(Number.isInteger(payload.costCents) && payload.costCents >= 0)) errors.costCents = 'invalid_cost'
  if (payload.boxPriceCents != null && !(Number.isInteger(payload.boxPriceCents) && payload.boxPriceCents >= 0)) errors.boxPriceCents = 'invalid_box_price'
  if (payload.boxQuantity != null && !(Number.isInteger(payload.boxQuantity) && payload.boxQuantity > 0)) errors.boxQuantity = 'invalid_box_quantity'
  if (payload.reorderThreshold != null && !(Number.isInteger(payload.reorderThreshold) && payload.reorderThreshold >= 0)) errors.reorderThreshold = 'invalid_reorder_threshold'
  return errors
}

export async function createProduct(venueId, actorId, payload) {
  const errors = validateFieldErrors(payload, { partial: false })
  if (Object.keys(errors).length > 0) { const e = new ProductError('validation_failed'); e.fieldErrors = errors; throw e }

  const db = getDb()
  const cols = ['venue_id', 'created_by']
  const placeholders = ['$1', '$2']
  const values = [venueId, actorId]
  for (const field of EDITABLE_FIELDS) {
    if (payload[field] === undefined) continue
    cols.push(COLUMN_BY_FIELD[field])
    values.push(JSON_FIELDS.has(field) ? JSON.stringify(payload[field]) : payload[field])
    placeholders.push(`$${values.length}`)
  }
  cols.push('physical_quantity'); values.push(payload.initialQuantity || 0); placeholders.push(`$${values.length}`)
  cols.push('is_featured'); values.push(!!payload.isFeatured); placeholders.push(`$${values.length}`)
  cols.push('is_limited_release'); values.push(!!payload.isLimitedRelease); placeholders.push(`$${values.length}`)
  cols.push('is_staff_pick'); values.push(!!payload.isStaffPick); placeholders.push(`$${values.length}`)
  cols.push('is_venue_exclusive'); values.push(!!payload.isVenueExclusive); placeholders.push(`$${values.length}`)
  cols.push('is_customer_visible'); values.push(payload.isCustomerVisible !== false); placeholders.push(`$${values.length}`)
  cols.push('metadata'); values.push(JSON.stringify(payload.metadata || {})); placeholders.push(`$${values.length}`)

  try {
    const { rows } = await db.query(
      `INSERT INTO venue_cigar_products (${cols.join(', ')}) VALUES (${placeholders.join(',')}) RETURNING *`,
      values
    )
    return rows[0]
  } catch (err) {
    if (err.code === UNIQUE_VIOLATION) {
      if (String(err.constraint || '').includes('barcode')) throw new ProductError('duplicate_barcode')
      throw new ProductError('duplicate_sku')
    }
    throw err
  }
}

// Full field-level validated edit. Never touches quantity/status
// columns — those flow only through inventoryService.applyInventoryEvent()
// and updateProductClassification() respectively, so this is never a
// second path that can silently move authoritative stock.
export async function updateProduct(venueId, productId, actorId, payload) {
  const errors = validateFieldErrors(payload, { partial: true })
  if (Object.keys(errors).length > 0) { const e = new ProductError('validation_failed'); e.fieldErrors = errors; throw e }

  const db = getDb()
  const sets = []
  const values = [venueId, productId]
  for (const field of EDITABLE_FIELDS) {
    if (payload[field] === undefined) continue
    values.push(JSON_FIELDS.has(field) ? JSON.stringify(payload[field]) : payload[field])
    sets.push(`${COLUMN_BY_FIELD[field]} = $${values.length}`)
  }
  if (sets.length === 0) throw new ProductError('no_fields_to_update')
  sets.push('updated_at = now()')

  try {
    const { rows } = await db.query(
      `UPDATE venue_cigar_products SET ${sets.join(', ')} WHERE venue_id = $1 AND product_id = $2 RETURNING *`,
      values
    )
    if (!rows[0]) throw new ProductError('product_not_found')
    return rows[0]
  } catch (err) {
    if (err.code === UNIQUE_VIOLATION) {
      if (String(err.constraint || '').includes('barcode')) throw new ProductError('duplicate_barcode')
      throw new ProductError('duplicate_sku')
    }
    throw err
  }
}

export async function getProduct(venueId, productId) {
  const db = getDb()
  const { rows } = await db.query(`SELECT * FROM venue_cigar_products WHERE venue_id = $1 AND product_id = $2`, [venueId, productId])
  const product = rows[0]
  if (!product) return null
  const availability = await getProductAvailability(productId)
  return { ...product, availability }
}

export async function listProducts(venueId, filters = {}) {
  const db = getDb()
  const conditions = ['venue_id = $1']
  const params = [venueId]
  if (filters.status) { params.push(filters.status); conditions.push(`status = $${params.length}`) }
  if (filters.isFeatured != null) { params.push(filters.isFeatured); conditions.push(`is_featured = $${params.length}`) }
  const { rows } = await db.query(
    `SELECT * FROM venue_cigar_products WHERE ${conditions.join(' AND ')} ORDER BY name ASC`,
    params
  )
  return rows
}

// Admin dashboard read: every product for the venue plus its real,
// live-computed availability breakdown (never a stored/cached
// aggregate) — reuses the exact same computeAvailableQuantity used by
// checkout and the customer browser.
export async function listProductsForAdmin(venueId, filters = {}) {
  const db = getDb()
  const conditions = ['venue_id = $1']
  const params = [venueId]
  if (filters.includeArchived !== true) conditions.push('is_archived = false')
  if (filters.status) { params.push(filters.status); conditions.push(`status = $${params.length}`) }
  if (filters.search) {
    params.push(`%${filters.search}%`)
    conditions.push(`(name ILIKE $${params.length} OR sku ILIKE $${params.length} OR barcode ILIKE $${params.length} OR brand ILIKE $${params.length})`)
  }
  const { rows } = await db.query(
    `SELECT * FROM venue_cigar_products WHERE ${conditions.join(' AND ')} ORDER BY name ASC`,
    params
  )
  const client = await db.connect()
  try {
    const withAvailability = []
    for (const product of rows) {
      const availability = await computeAvailableQuantity(client, product.product_id)
      withAvailability.push({ ...product, availability, isLowStock: availability.availableQuantity <= product.reorder_threshold })
    }
    return withAvailability
  } finally {
    client.release()
  }
}

export async function updateProductStatus(venueId, productId, status) {
  const db = getDb()
  if (!STATUS_VALUES.includes(status)) throw new ProductError('invalid_status')
  const { rows } = await db.query(
    `UPDATE venue_cigar_products SET status = $3, updated_at = now() WHERE venue_id = $1 AND product_id = $2 RETURNING *`,
    [venueId, productId, status]
  )
  if (!rows[0]) throw new ProductError('product_not_found')
  return rows[0]
}

// Single entry point for every classification/visibility toggle
// (archive/restore, activate/deactivate, customer visibility,
// featured, staff pick, limited release, venue exclusive). Each flag
// is set to an explicit target value, so re-sending the same change
// is naturally idempotent — no separate idempotency key required.
const CLASSIFICATION_COLUMN = {
  status: 'status', isArchived: 'is_archived', isCustomerVisible: 'is_customer_visible',
  isFeatured: 'is_featured', isStaffPick: 'is_staff_pick', isLimitedRelease: 'is_limited_release',
  isVenueExclusive: 'is_venue_exclusive',
}

export async function updateProductClassification(venueId, productId, patch) {
  const db = getDb()
  const sets = []
  const values = [venueId, productId]
  for (const [field, column] of Object.entries(CLASSIFICATION_COLUMN)) {
    if (patch[field] === undefined) continue
    if (field === 'status' && !STATUS_VALUES.includes(patch.status)) throw new ProductError('invalid_status')
    values.push(patch[field])
    sets.push(`${column} = $${values.length}`)
  }
  if (sets.length === 0) throw new ProductError('no_fields_to_update')
  sets.push('updated_at = now()')
  const { rows } = await db.query(
    `UPDATE venue_cigar_products SET ${sets.join(', ')} WHERE venue_id = $1 AND product_id = $2 RETURNING *`,
    values
  )
  if (!rows[0]) throw new ProductError('product_not_found')
  return rows[0]
}
