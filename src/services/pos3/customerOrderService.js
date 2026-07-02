/**
 * customerOrderService — venue menu + customer self-order frontend service.
 *
 * Dual-write pattern:
 *  1. Calls backend /api/pos3/orders (persistent)
 *  2. On backend failure, writes to localStorage via existing orderService
 *  3. Shows honest sync status: 'synced' | 'local_only' | 'pending_sync' | 'sync_failed'
 *
 * Payment: card payment processor is NOT configured.
 * Only cash/tab orders are accepted until a real processor is added.
 */

import { MENU_CATEGORIES, MENU_CATALOG, getMenuCatalog } from '../../data/pos3/menuCatalog.js'

const API = '/api'
const VENUE_ID = 'novee-grand-lounge'

// ── Menu ─────────────────────────────────────────────────────

export async function fetchVenueMenu({ venueId = VENUE_ID, category, search } = {}) {
  try {
    const params = new URLSearchParams({ venueId })
    if (category) params.set('category', category)
    if (search) params.set('search', search)

    const res = await fetch(`${API}/venue-menu?${params}`, { credentials: 'include' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const json = await res.json()
    return {
      ok: true,
      items: json.data?.items || [],
      storageMode: json.data?.storageMode || 'unknown',
      localPreview: json.data?.localPreview || false,
      seededDevData: json.data?.seededDevData || false,
    }
  } catch {
    // Backend unavailable — use local catalog as fallback
    const catalog = getMenuCatalog()
    const items = catalog
      .filter(i => !category || i.category === category)
      .filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()))
      .map(normalizeLocalItem)

    return {
      ok: true,
      items,
      storageMode: 'local_catalog',
      localPreview: true,
      seededDevData: true,
    }
  }
}

// ── Staff PIN verify ──────────────────────────────────────────

export async function verifyStaffPin(pin, handoffContext = {}) {
  try {
    const res = await fetch(`${API}/auth/staff-pin`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin, venueId: VENUE_ID, handoffContext }),
    })
    const json = await res.json()
    if (!res.ok || !json.data?.success) {
      return {
        ok: false,
        backendAvailable: true,
        error: json.message || 'Invalid PIN',
      }
    }
    return {
      ok: true,
      backendAvailable: true,
      staffUser: json.data.staffUser,
      permissions: json.data.permissions,
    }
  } catch {
    // Backend unavailable — local preview fallback (dev/offline mode only)
    return {
      ok: false,
      backendAvailable: false,
      error: 'Backend unavailable. Staff auth cannot be verified.',
    }
  }
}

// ── Order creation ────────────────────────────────────────────

export async function createOrder({ guestSessionId, tableId, tableNumber, source, staffUserId, items, notes } = {}) {
  const orderPayload = {
    venueId: VENUE_ID,
    guestSessionId,
    tableId,
    tableNumber,
    source: source || 'customer_self_order',
    staffUserId: staffUserId || null,
    items: items.map(item => ({
      menu_item_id:       item.item_id || item.id,
      sku:                item.sku || item.inventorySku || null,
      name:               item.name || item.item_name,
      category:           item.display_category || item.category,
      destination_station:item.destination_station || item.destination || 'staff',
      quantity:           item.quantity || 1,
      unit_price_cents:   Math.round((item.price || 0) * 100),
      modifiers:          item.modifiers || [],
      notes:              item.notes || null,
    })),
    notes,
  }

  try {
    const res = await fetch(`${API}/pos3/orders`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload),
    })
    const json = await res.json()
    if (!res.ok || !json.success) throw new Error(json.message || 'Order create failed')

    return {
      ok: true,
      orderId: json.data.order.order_id,
      order:   json.data.order,
      items:   json.data.items,
      totals:  json.data.totals,
      syncStatus: 'synced',
      storageMode: json.data.storageMode,
    }
  } catch (err) {
    // Backend failed — fall back to localStorage ticket
    const localId = `local_${Date.now()}`
    _writeLocalFallback(localId, orderPayload)
    return {
      ok: true,
      orderId: localId,
      order: { order_id: localId, ...orderPayload, status: 'draft' },
      items: orderPayload.items,
      totals: _calcLocalTotals(orderPayload.items),
      syncStatus: 'local_only',
      storageMode: 'local_fallback',
      localPreview: true,
      syncError: err.message,
    }
  }
}

// ── Order submission ──────────────────────────────────────────

export async function submitOrder(orderId) {
  if (orderId.startsWith('local_')) {
    return { ok: true, orderId, status: 'routed', syncStatus: 'local_only', localPreview: true }
  }

  try {
    const res = await fetch(`${API}/pos3/orders/${orderId}/submit`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
    const json = await res.json()
    if (!res.ok || !json.success) throw new Error(json.message)
    return {
      ok: true,
      orderId,
      order: json.data.order,
      routeResult: json.data.routeResult,
      syncStatus: 'synced',
      storageMode: json.data.storageMode,
    }
  } catch (err) {
    return { ok: false, error: err.message, syncStatus: 'sync_failed' }
  }
}

// ── Staff attach ──────────────────────────────────────────────

export async function attachStaffToOrder(orderId, staffUser, source = 'staff_assisted_order') {
  if (orderId.startsWith('local_')) {
    return { ok: true, syncStatus: 'local_only', localPreview: true }
  }
  try {
    const res = await fetch(`${API}/pos3/orders/${orderId}/staff-attach`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffUserId: staffUser?.id, source }),
    })
    const json = await res.json()
    if (!res.ok || !json.success) throw new Error(json.message)
    return { ok: true, order: json.data.order, syncStatus: 'synced' }
  } catch (err) {
    return { ok: false, error: err.message, syncStatus: 'sync_failed' }
  }
}

// ── Order status ──────────────────────────────────────────────

export async function getOrderStatus(orderId) {
  if (orderId.startsWith('local_')) {
    const local = _loadLocalFallback(orderId)
    return { ok: !!local, order: local, syncStatus: 'local_only', localPreview: true }
  }
  try {
    const res = await fetch(`${API}/pos3/orders/${orderId}`, { credentials: 'include' })
    const json = await res.json()
    if (!res.ok || !json.success) throw new Error(json.message)
    return { ok: true, order: json.data.order, items: json.data.items, syncStatus: 'synced' }
  } catch (err) {
    return { ok: false, error: err.message, syncStatus: 'sync_failed' }
  }
}

// ── Backend station queue ─────────────────────────────────────

export async function fetchStationQueue(station, venueId = VENUE_ID) {
  try {
    const params = new URLSearchParams({ venueId })
    if (station) params.set('station', station)
    const res = await fetch(`${API}/pos3/station-queue?${params}`, { credentials: 'include' })
    const json = await res.json()
    if (!res.ok || !json.success) throw new Error(json.message)
    return { ok: true, entries: json.data.entries, storageMode: json.data.storageMode, localPreview: json.data.localPreview || false }
  } catch {
    return { ok: false, entries: [], storageMode: 'unavailable', localPreview: true }
  }
}

export async function updateQueueItemStatus(queueId, status) {
  try {
    const res = await fetch(`${API}/pos3/station-queue/${queueId}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    const json = await res.json()
    return { ok: json.success, entry: json.data?.entry }
  } catch {
    return { ok: false }
  }
}

// ── EAT live feed ─────────────────────────────────────────────

export async function fetchEatPosLiveFeed(venueId = VENUE_ID) {
  try {
    const res = await fetch(`${API}/eat/pos3-live?venueId=${venueId}`, { credentials: 'include' })
    const json = await res.json()
    if (!res.ok || !json.success) throw new Error(json.message)
    return { ok: true, ...json.data }
  } catch {
    return { ok: false, localPreview: true }
  }
}

// ── Helpers ───────────────────────────────────────────────────

function normalizeLocalItem(item) {
  return {
    item_id:            item.id,
    sku:                item.inventorySku,
    item_name:          item.name,
    display_category:   item.category,
    price:              item.price,
    destination_station:item.destination,
    prep_time_minutes:  item.prepTimeMinutes,
    modifier_schema:    item.modifiers || [],
    age_restricted:     item.ageRestricted || false,
    available:          item.availabilityStatus === 'available',
    taxable:            item.taxable !== false,
    storageMode:        'local_catalog',
  }
}

function _calcLocalTotals(items) {
  const TAX = 0.085
  const subtotalCents = items.reduce((s, i) => s + (i.unit_price_cents || 0) * (i.quantity || 1), 0)
  const taxCents = Math.round(subtotalCents * TAX)
  return { subtotalCents, taxCents, serviceFeeCents: 0, discountCents: 0, totalCents: subtotalCents + taxCents }
}

function _writeLocalFallback(id, payload) {
  try { localStorage.setItem(`customer_order_${id}`, JSON.stringify(payload)) } catch {}
}
function _loadLocalFallback(id) {
  try { return JSON.parse(localStorage.getItem(`customer_order_${id}`) || 'null') } catch { return null }
}

// Re-export categories for UI
export { MENU_CATEGORIES }
