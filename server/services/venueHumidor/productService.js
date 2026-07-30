/**
 * Venue Humidor 1A — product catalog service. Venue-isolated by
 * construction: every query is scoped by a real venue_id parameter.
 */
import { getDb } from '../../db/connection.js'
import { getProductAvailability } from './inventoryService.js'

export class ProductError extends Error {
  constructor(code) { super(code); this.code = code }
}

const UNIQUE_VIOLATION = '23505'

export async function createProduct(venueId, actorId, payload) {
  const db = getDb()
  const { sku, barcode, name, brand, vitola, wrapper, strength, priceCents, initialQuantity, reorderThreshold, isFeatured, isLimitedRelease, metadata } = payload
  if (!sku) throw new ProductError('sku_required')
  if (!name) throw new ProductError('name_required')
  if (!(Number.isInteger(priceCents) && priceCents >= 0)) throw new ProductError('valid_price_required')
  try {
    const { rows } = await db.query(
      `INSERT INTO venue_cigar_products (
         venue_id, sku, barcode, name, brand, vitola, wrapper, strength, price_cents,
         physical_quantity, reorder_threshold, is_featured, is_limited_release, metadata, created_by
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [
        venueId, sku, barcode || null, name, brand || null, vitola || null, wrapper || null,
        strength || null, priceCents, initialQuantity || 0, reorderThreshold ?? 5,
        !!isFeatured, !!isLimitedRelease, JSON.stringify(metadata || {}), actorId,
      ]
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

export async function updateProductStatus(venueId, productId, status) {
  const db = getDb()
  const { rows } = await db.query(
    `UPDATE venue_cigar_products SET status = $3, updated_at = now() WHERE venue_id = $1 AND product_id = $2 RETURNING *`,
    [venueId, productId, status]
  )
  if (!rows[0]) throw new ProductError('product_not_found')
  return rows[0]
}
