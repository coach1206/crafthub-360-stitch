/**
 * Venue Humidor 1B-1 — customer-facing catalog: browsing, search,
 * filters, sorting, and cigar detail. Never trusts a client-supplied
 * venue without server validation; never exposes one venue's cigars
 * to another; excludes archived products; hides sold-out by default.
 */
import { getDb } from '../../db/connection.js'
import { getProductAvailability } from './inventoryService.js'

export class CatalogError extends Error {
  constructor(code) { super(code); this.code = code }
}

/** Validates a venue is real and active — never trusts the client's claim alone. */
export async function validateActiveVenue(venueId) {
  if (!venueId) return null
  const db = getDb()
  const { rows } = await db.query(`SELECT venue_id, name FROM venues WHERE venue_id = $1 AND status = 'active'`, [venueId])
  return rows[0] || null
}

const SORT_COLUMNS = {
  recommended: 'is_featured DESC, is_staff_pick DESC, created_at DESC',
  price_low_to_high: 'price_cents ASC',
  price_high_to_low: 'price_cents DESC',
  strength: `CASE strength WHEN 'mild' THEN 1 WHEN 'mild_medium' THEN 2 WHEN 'medium' THEN 3 WHEN 'medium_full' THEN 4 WHEN 'full' THEN 5 ELSE 6 END ASC`,
  smoking_time: 'smoke_time_minutes ASC NULLS LAST',
  newest: 'created_at DESC',
}

/**
 * Customer-visible catalog: excludes archived and non-customer-visible
 * products always; excludes sold-out UNLESS inStockOnly is explicitly
 * false (sold-out hidden by default). All filters run server-side
 * against real stored columns — never client-side over an unfiltered
 * payload.
 */
export async function browseCatalog(venueId, filters = {}) {
  const db = getDb()
  const conditions = ['venue_id = $1', 'is_archived = false', 'is_customer_visible = true']
  const params = [venueId]

  function addFilter(column, value, exact = true) {
    params.push(exact ? value : `%${value}%`)
    conditions.push(`${column} ${exact ? '=' : 'ILIKE'} $${params.length}`)
  }

  if (filters.search) { params.push(`%${filters.search}%`); conditions.push(`(name ILIKE $${params.length} OR brand ILIKE $${params.length})`) }
  if (filters.brand) addFilter('brand', filters.brand)
  if (filters.country) addFilter('country', filters.country)
  if (filters.wrapper) addFilter('wrapper', filters.wrapper)
  if (filters.vitola) addFilter('vitola', filters.vitola)
  if (filters.strength) addFilter('strength', filters.strength)
  if (filters.body) addFilter('body', filters.body)
  if (filters.flavor) { params.push(JSON.stringify(filters.flavor)); conditions.push(`flavor_notes @> $${params.length}::jsonb`) }
  if (filters.priceMinCents != null) { params.push(Number(filters.priceMinCents)); conditions.push(`price_cents >= $${params.length}`) }
  if (filters.priceMaxCents != null) { params.push(Number(filters.priceMaxCents)); conditions.push(`price_cents <= $${params.length}`) }
  if (filters.smokeTimeMaxMinutes != null) { params.push(Number(filters.smokeTimeMaxMinutes)); conditions.push(`smoke_time_minutes <= $${params.length}`) }
  if (filters.experienceLevel) addFilter('experience_level', filters.experienceLevel)
  if (filters.featured) conditions.push('is_featured = true')
  if (filters.staffPick) conditions.push('is_staff_pick = true')
  if (filters.limitedRelease) conditions.push('is_limited_release = true')

  // Sold-out hidden by default; only shown when the caller explicitly
  // asks for in-stock-only = false (i.e. wants to see everything).
  if (filters.inStockOnly !== false) conditions.push(`status != 'sold_out'`)

  const sortKey = SORT_COLUMNS[filters.sort] ? filters.sort : 'recommended'
  const { rows } = await db.query(
    `SELECT * FROM venue_cigar_products WHERE ${conditions.join(' AND ')} ORDER BY ${SORT_COLUMNS[sortKey]}`,
    params
  )

  const withAvailability = []
  for (const product of rows) {
    const availability = await getProductAvailability(product.product_id)
    withAvailability.push({ ...product, availability })
  }
  return withAvailability
}

/**
 * Loads and validates a cigar against the active venue — a product
 * belonging to a different venue, or an archived/hidden product,
 * returns null (honest not-found, never a cross-venue leak).
 */
export async function getCigarDetail(venueId, productId) {
  const db = getDb()
  const { rows } = await db.query(
    `SELECT * FROM venue_cigar_products WHERE venue_id = $1 AND product_id = $2 AND is_archived = false AND is_customer_visible = true`,
    [venueId, productId]
  )
  const product = rows[0]
  if (!product) return null
  const availability = await getProductAvailability(productId)

  const { rows: similar } = await db.query(
    `SELECT product_id, name, brand, vitola, price_cents, primary_image_url, status
     FROM venue_cigar_products
     WHERE venue_id = $1 AND product_id != $2 AND is_archived = false AND is_customer_visible = true
       AND status != 'sold_out' AND (wrapper = $3 OR strength = $4 OR vitola = $5)
     ORDER BY is_featured DESC LIMIT 4`,
    [venueId, productId, product.wrapper, product.strength, product.vitola]
  )

  return { ...product, availability, similarCigars: similar }
}

export async function addFavorite(venueId, productId, guestReference) {
  const db = getDb()
  const { rows: productRows } = await db.query(`SELECT product_id FROM venue_cigar_products WHERE venue_id = $1 AND product_id = $2`, [venueId, productId])
  if (!productRows[0]) throw new CatalogError('product_not_found')
  const { rows } = await db.query(
    `INSERT INTO venue_cigar_favorites (venue_id, product_id, guest_reference) VALUES ($1,$2,$3)
     ON CONFLICT (guest_reference, product_id) DO NOTHING RETURNING *`,
    [venueId, productId, guestReference]
  )
  if (rows[0]) return { favorite: rows[0], deduplicated: false }
  const { rows: existing } = await db.query(`SELECT * FROM venue_cigar_favorites WHERE guest_reference = $1 AND product_id = $2`, [guestReference, productId])
  return { favorite: existing[0], deduplicated: true }
}

export async function removeFavorite(productId, guestReference) {
  const db = getDb()
  await db.query(`DELETE FROM venue_cigar_favorites WHERE guest_reference = $1 AND product_id = $2`, [guestReference, productId])
  return { removed: true }
}

export async function listFavorites(guestReference) {
  const db = getDb()
  const { rows } = await db.query(
    `SELECT f.product_id, f.created_at, p.* FROM venue_cigar_favorites f
     JOIN venue_cigar_products p ON p.product_id = f.product_id
     WHERE f.guest_reference = $1 ORDER BY f.created_at DESC`,
    [guestReference]
  )
  return rows
}
