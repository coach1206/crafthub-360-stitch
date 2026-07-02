/**
 * SmokeCraft Venue Commerce API service.
 * All functions fall back to local-preview data when backend unavailable.
 */
import {
  SMOKECRAFT_VENUE_PROFILE,
  SMOKECRAFT_CIGARS,
  SMOKECRAFT_DRINKS,
  PARTNER_ESTABLISHMENTS,
  PARTNER_FOODS,
} from '../data/smokeCraftVenueCommerce.js'
import { calculateSmokeCraftMoneyBridge } from '../utils/smokeCraftMoneyBridge.js'

const BASE = '/api/smokecraft/venue-commerce'

async function apiFetch(path, options = {}) {
  try {
    const res = await fetch(path, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
    if (!res.ok) return { ok: false, status: res.status, backendAvailable: true }
    const data = await res.json()
    return { ...data, backendAvailable: true }
  } catch {
    return { ok: false, backendAvailable: false }
  }
}

export async function fetchVenueProfile(venueId = 'smokecraft-360-main') {
  const result = await apiFetch(`${BASE}/profile/${venueId}`)
  if (result.ok) return result
  return {
    ok: true,
    backendAvailable: false,
    localPreview: true,
    storageMode: 'memory_fallback',
    profile: SMOKECRAFT_VENUE_PROFILE,
  }
}

export async function fetchVenueMenu(venueId = 'smokecraft-360-main') {
  const result = await apiFetch(`${BASE}/menu/${venueId}`)
  if (result.ok) return result
  return {
    ok: true,
    backendAvailable: false,
    localPreview: true,
    storageMode: 'memory_fallback',
    cigars: SMOKECRAFT_CIGARS,
    drinks: SMOKECRAFT_DRINKS,
    partnerEstablishments: PARTNER_ESTABLISHMENTS,
    partnerFoods: PARTNER_FOODS,
  }
}

export async function trackPartnerClick({ venueId, tableLabel, partnerId, partnerName, action = 'logo_click' }) {
  const event = {
    eventType: 'partner_attribution',
    action,
    venueId,
    tableLabel,
    partnerId,
    partnerName,
    timestamp: new Date().toISOString(),
  }
  const result = await apiFetch(`${BASE}/partner-click`, {
    method: 'POST',
    body: JSON.stringify(event),
  })
  if (result.backendAvailable === false) {
    return { ok: true, localPreview: true, tracked: false, event }
  }
  return result
}

export async function trackPartnerFoodAdd({ venueId, tableLabel, partnerId, partnerName, item, moneyBridge }) {
  const event = {
    eventType: 'partner_food_add',
    action: 'food_add',
    venueId,
    tableLabel,
    partnerId,
    partnerName,
    itemId: item.item_id,
    itemName: item.item_name,
    unitPrice: item.price,
    smokeCraftCommission: moneyBridge?.smokeCraftTotalCommission,
    venueReferral: moneyBridge?.venueTotalReferral,
    timestamp: new Date().toISOString(),
  }
  const result = await apiFetch(`${BASE}/money-bridge-event`, {
    method: 'POST',
    body: JSON.stringify(event),
  })
  if (result.backendAvailable === false) {
    return { ok: true, localPreview: true, tracked: false, event }
  }
  return result
}

export async function submitVenueOrder({ venueId, tableLabel, guestSessionId, orderSource, cartItems, moneyBridge, staffPin }) {
  const payload = {
    venueId,
    tableLabel,
    guestSessionId,
    orderSource: orderSource || 'customer_self_order',
    staffPin: staffPin || null,
    items: cartItems,
    moneyBridge,
    requestedAt: new Date().toISOString(),
  }
  const result = await apiFetch(`${BASE}/orders`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (result.backendAvailable === false) {
    const bridge = calculateSmokeCraftMoneyBridge({
      venueItems: cartItems.filter(i => !i.isPartnerItem),
      partnerItems: cartItems.filter(i => i.isPartnerItem),
    })
    return {
      ok: true,
      localPreview: true,
      storageMode: 'memory_fallback',
      orderId: `local-${Date.now()}`,
      status: 'local_preview_only',
      paymentNote: 'Cash / Tab at end of service. Card payment processor not currently configured.',
      moneyBridge: bridge,
      message: 'Order recorded locally. Not synced to backend — backend unavailable.',
    }
  }
  return result
}

export async function submitStaffRequest({ venueId, tableLabel, guestSessionId, cartItems, staffNote }) {
  const payload = {
    venueId,
    tableLabel,
    guestSessionId,
    orderSource: 'staff_assisted_order',
    items: cartItems,
    staffNote: staffNote || '',
    requestedAt: new Date().toISOString(),
  }
  const result = await apiFetch(`${BASE}/staff-request`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (result.backendAvailable === false) {
    return {
      ok: true,
      localPreview: true,
      requestId: `local-sr-${Date.now()}`,
      status: 'local_preview_only',
      message: 'Staff request logged locally. Backend unavailable — staff will need to be flagged in person.',
    }
  }
  return result
}

export async function fetchRevenueReport(venueId = 'smokecraft-360-main') {
  const result = await apiFetch(`${BASE}/revenue-report/${venueId}`)
  if (result.ok) return result
  return {
    ok: true,
    localPreview: true,
    storageMode: 'memory_fallback',
    report: {
      venueId,
      generatedAt: new Date().toISOString(),
      totalVenueRevenue: 0,
      totalPartnerRevenue: 0,
      totalSmokeCraftCommission: 0,
      totalVenueReferral: 0,
      totalPartnerPayout: 0,
      partnerBreakdown: PARTNER_ESTABLISHMENTS.map(p => ({
        partnerId: p.partnerId,
        partnerName: p.name,
        clicks: 0,
        menuOpens: 0,
        foodAdds: 0,
        checkouts: 0,
        revenue: 0,
        smokeCraftCommission: 0,
        venueReferral: 0,
        partnerPayout: 0,
        settlementStatus: 'pending',
      })),
    },
    message: 'Revenue report unavailable — backend not connected. Showing local-preview placeholder.',
  }
}
