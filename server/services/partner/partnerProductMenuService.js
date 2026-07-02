/**
 * Partner Product/Menu Service
 * Manages partner vendor products and their approval lifecycle.
 */

import { isDbAvailable, query } from '../../db/connection.js'
import { canPartnerSellAtVenue } from './partnerVenueRelationshipService.js'

const productStore = new Map() // key: productId

export async function createPartnerProduct(partnerId, payload) {
  const { productId, productName, productType = 'food_item', ...rest } = payload
  if (!productId || !productName) {
    return { ok: false, status: 'product_setup_required', message: 'productId and productName are required.' }
  }

  const product = {
    partner_id: partnerId,
    product_id: productId,
    product_name: productName,
    product_type: productType,
    status: 'draft',
    commission_eligible: rest.commissionEligible ?? true,
    base_price: rest.basePrice ?? null,
    currency: 'usd',
    ...rest,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  if (isDbAvailable()) {
    try {
      const { rows } = await query(
        `INSERT INTO partner_vendor_products
           (partner_id, product_id, product_name, product_type, base_price, status, commission_eligible, created_by)
         VALUES ($1,$2,$3,$4,$5,'draft',$6,$7)
         ON CONFLICT (product_id) DO UPDATE SET product_name=EXCLUDED.product_name, updated_at=NOW()
         RETURNING *`,
        [partnerId, productId, productName, productType, rest.basePrice ?? null,
         rest.commissionEligible ?? true, rest.createdBy ?? 'system']
      )
      return { ok: true, product: rows[0], storageMode: 'postgres' }
    } catch { /* fallback */ }
  }

  productStore.set(productId, product)
  return { ok: true, product, storageMode: 'memory_fallback', persistenceStatus: 'preview_fallback' }
}

export async function updatePartnerProduct(partnerId, productId, payload) {
  const existing = productStore.get(productId) ?? { partner_id: partnerId, product_id: productId }
  const updated = { ...existing, ...payload, partner_id: partnerId, product_id: productId, updated_at: new Date().toISOString() }
  productStore.set(productId, updated)
  return { ok: true, product: updated, storageMode: 'memory_fallback' }
}

export async function getPartnerProduct(partnerId, productId) {
  if (isDbAvailable()) {
    try {
      const { rows } = await query(
        'SELECT * FROM partner_vendor_products WHERE partner_id=$1 AND product_id=$2 LIMIT 1',
        [partnerId, productId]
      )
      if (rows[0]) return { ok: true, product: rows[0], storageMode: 'postgres' }
    } catch { /* fallback */ }
  }

  const product = productStore.get(productId) ?? null
  return { ok: true, product, productStatus: product?.status ?? 'product_setup_required', storageMode: 'memory_fallback' }
}

export async function listPartnerProducts(partnerId, filters = {}) {
  const products = []
  for (const [, p] of productStore.entries()) {
    if (p.partner_id !== partnerId) continue
    if (filters.status && p.status !== filters.status) continue
    products.push(p)
  }
  return { ok: true, partnerId, products, storageMode: 'memory_fallback' }
}

export async function listVenueEligiblePartnerProducts(venueId, filters = {}) {
  const products = []
  for (const [, p] of productStore.entries()) {
    if (p.status !== 'active') continue
    const rel = await canPartnerSellAtVenue(p.partner_id, venueId)
    if (!rel.canSell) continue
    products.push(p)
  }
  return { ok: true, venueId, products, storageMode: 'memory_fallback' }
}

async function setProductStatus(partnerId, productId, status, actorPayload = {}) {
  const existing = productStore.get(productId) ?? { partner_id: partnerId, product_id: productId }
  const updated = { ...existing, status, ...actorPayload, updated_at: new Date().toISOString() }
  productStore.set(productId, updated)
  return { ok: true, partnerId, productId, status, storageMode: 'memory_fallback' }
}

export async function submitProductForApproval(partnerId, productId) {
  const p = productStore.get(productId)
  if (!p || p.partner_id !== partnerId) return { ok: false, message: 'Product not found.' }
  return setProductStatus(partnerId, productId, 'pending_approval')
}

export async function approvePartnerProduct(partnerId, productId, actorPayload = {}) {
  return setProductStatus(partnerId, productId, 'active', { approved_by: actorPayload.actorId ?? 'system' })
}

export async function rejectPartnerProduct(partnerId, productId, actorPayload = {}) {
  return setProductStatus(partnerId, productId, 'rejected', { rejected_by: actorPayload.actorId ?? 'system', rejection_reason: actorPayload.reason })
}

export async function pausePartnerProduct(partnerId, productId, actorPayload = {}) {
  return setProductStatus(partnerId, productId, 'paused', actorPayload)
}
