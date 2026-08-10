/**
 * Venue Inventory Service — menu and inventory queries.
 * Falls back to local sample data when API is unavailable.
 *
 * LOCAL PREVIEW MODE: when backend is unavailable, sample data is served.
 * All responses include localPreview:true in that case.
 */
import { VENUE_SAMPLE_INVENTORY } from '../data/venueInventoryData.js'

function getSampleInventory(venueId, category) {
  return VENUE_SAMPLE_INVENTORY.filter(i =>
    i.venue_id === venueId &&
    (!category || i.item_category === category || i.item_category.startsWith(category))
  )
}

function getSampleItem(itemId) {
  return VENUE_SAMPLE_INVENTORY.find(i => i.item_id === itemId) || null
}

const BASE = '/api/venues'

async function safeFetch(url, opts = {}) {
  try {
    const res = await fetch(url, { credentials: 'include', ...opts })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch {
    return null
  }
}

export async function getVenueMenu(venueId, category) {
  const params = category ? `?category=${encodeURIComponent(category)}` : ''
  const data = await safeFetch(`${BASE}/${venueId}/menu${params}`)
  if (data?.ok) return { items: data.items, storageMode: data.storageMode, localPreview: data.localPreview ?? false }
  // Local fallback
  const items = getSampleInventory(venueId, category)
  return {
    items,
    storageMode: 'local_sample',
    localPreview: true,
    notice: 'LOCAL PREVIEW MODE: menu items are sample data. Backend unavailable.',
  }
}

export async function checkItemAvailability(venueId, itemId, quantity = 1) {
  const data = await safeFetch(`${BASE}/${venueId}/inventory/check-availability`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemId, quantity }),
  })
  if (data?.ok) return data
  // Local fallback
  const item = getSampleItem(itemId)
  if (!item) return { available: false, outOfStock: true, localPreview: true }
  const available = item.available && item.stock_quantity >= quantity
  return {
    available,
    stockQuantity: item.stock_quantity,
    lowStock: item.stock_quantity <= item.low_stock_threshold,
    outOfStock: item.stock_quantity === 0,
    localPreview: true,
  }
}

export { getSampleInventory, getSampleItem }
