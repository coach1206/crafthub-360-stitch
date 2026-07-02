/**
 * Partner Availability Service
 * Controls when and where partner products are available.
 */

import { isDbAvailable, query } from '../../db/connection.js'

const availabilityStore = new Map() // key: `${partnerId}::${productId}::${venueId ?? 'global'}`

function avKey(partnerId, productId, venueId = 'global') {
  return `${partnerId}::${productId}::${venueId}`
}

export async function setProductAvailability(partnerId, productId, payload) {
  const venueId = payload.venueId ?? 'global'
  const record = {
    partner_id: partnerId,
    product_id: productId,
    venue_id: venueId === 'global' ? null : venueId,
    availability_status: payload.availabilityStatus ?? 'available',
    available_days_json: payload.availableDays ?? [],
    start_time: payload.startTime ?? null,
    end_time: payload.endTime ?? null,
    quantity_limit: payload.quantityLimit ?? null,
    current_available_quantity: payload.quantityLimit ?? null,
    cutoff_minutes_before_close: payload.cutoffMinutes ?? null,
    updated_at: new Date().toISOString(),
  }
  availabilityStore.set(avKey(partnerId, productId, venueId), record)
  return { ok: true, partnerId, productId, venueId, availability_status: record.availability_status, storageMode: 'memory_fallback' }
}

export async function getProductAvailability(partnerId, productId, venueId = 'global') {
  const stored = availabilityStore.get(avKey(partnerId, productId, venueId))
    ?? availabilityStore.get(avKey(partnerId, productId, 'global'))
    ?? null
  return {
    ok: true,
    partnerId,
    productId,
    venueId,
    availability: stored,
    availability_status: stored?.availability_status ?? 'availability_required',
    storageMode: 'memory_fallback',
  }
}

export async function isProductAvailableNow(partnerId, productId, venueId = 'global') {
  const avResult = await getProductAvailability(partnerId, productId, venueId)
  const av = avResult.availability

  if (!av) return { available: false, reason: 'availability_required' }
  if (av.availability_status === 'sold_out') return { available: false, reason: 'sold_out' }
  if (av.availability_status === 'unavailable') return { available: false, reason: 'unavailable' }
  if (av.availability_status === 'paused') return { available: false, reason: 'paused' }
  if (av.availability_status === 'availability_required') return { available: false, reason: 'availability_required' }

  if (av.current_available_quantity !== null && av.current_available_quantity <= 0) {
    return { available: false, reason: 'sold_out' }
  }

  return { available: true, reason: 'available', availabilityStatus: av.availability_status }
}

export async function getAvailableProductsForVenue(venueId, timestamp = null) {
  const products = []
  for (const [k, av] of availabilityStore.entries()) {
    if (av.venue_id !== venueId && av.venue_id !== null) continue
    if (av.availability_status === 'available' && (av.current_available_quantity === null || av.current_available_quantity > 0)) {
      products.push(av)
    }
  }
  return { ok: true, venueId, availableProducts: products, storageMode: 'memory_fallback' }
}

export async function decrementPartnerProductAvailability(partnerId, productId, quantity = 1) {
  const k = avKey(partnerId, productId, 'global')
  const av = availabilityStore.get(k)
  if (!av) return { ok: false, reason: 'availability_required' }

  if (av.quantity_limit !== null) {
    const next = (av.current_available_quantity ?? av.quantity_limit) - quantity
    if (next < 0) return { ok: false, reason: 'sold_out' }
    av.current_available_quantity = next
    if (next === 0) av.availability_status = 'sold_out'
    availabilityStore.set(k, av)
  }
  return { ok: true, partnerId, productId, remaining: av.current_available_quantity, storageMode: 'memory_fallback' }
}

export async function restorePartnerProductAvailability(partnerId, productId, quantity = 1) {
  const k = avKey(partnerId, productId, 'global')
  const av = availabilityStore.get(k)
  if (!av) return { ok: false, reason: 'availability_required' }

  if (av.quantity_limit !== null) {
    av.current_available_quantity = Math.min((av.current_available_quantity ?? 0) + quantity, av.quantity_limit)
    if (av.availability_status === 'sold_out' && av.current_available_quantity > 0) {
      av.availability_status = 'available'
    }
    availabilityStore.set(k, av)
  }
  return { ok: true, partnerId, productId, remaining: av.current_available_quantity, storageMode: 'memory_fallback' }
}

export async function markProductSoldOut(partnerId, productId) {
  const k = avKey(partnerId, productId, 'global')
  const av = availabilityStore.get(k) ?? { partner_id: partnerId, product_id: productId }
  av.availability_status = 'sold_out'
  av.current_available_quantity = 0
  availabilityStore.set(k, av)
  return { ok: true, partnerId, productId, availability_status: 'sold_out', storageMode: 'memory_fallback' }
}

export async function pauseProductAvailability(partnerId, productId) {
  const k = avKey(partnerId, productId, 'global')
  const av = availabilityStore.get(k) ?? { partner_id: partnerId, product_id: productId }
  av.availability_status = 'paused'
  availabilityStore.set(k, av)
  return { ok: true, partnerId, productId, availability_status: 'paused', storageMode: 'memory_fallback' }
}
