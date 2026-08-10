/**
 * SmokeCraft Ticket Tapper Specials API service.
 * Gracefully falls back to local-preview mode when backend unavailable.
 * Real-Time Ready — wire WebSocket/Supabase realtime here.
 */
import { smokeCraftTicketTapperSpecialsSeed } from '../data/smokeCraftTicketTapperSpecials.js'
import { smokeCraftInventorySeed } from '../data/smokeCraftInventorySeed.js'

const BASE = '/api/smokecraft/ticket-tapper'

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

export async function fetchTicketTapperSpecials(venueId) {
  const result = await apiFetch(`${BASE}/specials/${venueId}`)
  if (result.ok) return result
  return {
    ok: true,
    backendAvailable: false,
    localPreview: true,
    storageMode: 'memory_fallback',
    venueId,
    specials: smokeCraftTicketTapperSpecialsSeed.specials,
    settings: smokeCraftTicketTapperSpecialsSeed.settings,
  }
}

export async function createTicketTapperSpecial(payload) {
  const result = await apiFetch(`${BASE}/specials`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (result.backendAvailable === false) {
    return {
      ok: true,
      localPreview: true,
      specialId: `local-sp-${Date.now()}`,
      status: 'active',
      message: 'Special created locally. Not persisted — backend unavailable.',
    }
  }
  return result
}

export async function updateTicketTapperSpecial(specialId, payload) {
  const result = await apiFetch(`${BASE}/specials/${specialId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  if (result.backendAvailable === false) {
    return { ok: true, localPreview: true, specialId, message: 'Special updated locally. Not persisted.' }
  }
  return result
}

export async function trackTicketTapperSpecialTap(specialId, payload) {
  const result = await apiFetch(`${BASE}/specials/${specialId}/tap`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (result.backendAvailable === false) {
    return { ok: true, localPreview: true, tracked: false, action: 'special_tap' }
  }
  return result
}

export async function trackTicketTapperSpecialAdd(specialId, payload) {
  const result = await apiFetch(`${BASE}/specials/${specialId}/add`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (result.backendAvailable === false) {
    return { ok: true, localPreview: true, tracked: false, action: 'special_added' }
  }
  return result
}

export async function endTicketTapperSpecial(specialId, payload) {
  const result = await apiFetch(`${BASE}/specials/${specialId}/end`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (result.backendAvailable === false) {
    return { ok: true, localPreview: true, specialId, message: 'Special ended locally. Not persisted.' }
  }
  return result
}

export async function fetchTicketTapperInventory(venueId) {
  const result = await apiFetch(`${BASE}/inventory/${venueId}`)
  if (result.ok) return result
  return {
    ok: true,
    backendAvailable: false,
    localPreview: true,
    storageMode: 'memory_fallback',
    venueId,
    items: smokeCraftInventorySeed.items,
  }
}

export async function updateTicketTapperInventory(itemId, payload) {
  const result = await apiFetch(`${BASE}/inventory/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  if (result.backendAvailable === false) {
    return { ok: true, localPreview: true, itemId, message: 'Inventory updated locally. Not persisted.' }
  }
  return result
}

export async function submitSpecialForApproval(specialId, payload) {
  const result = await apiFetch(`${BASE}/specials/${specialId}/submit-approval`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (result.backendAvailable === false) {
    return { ok: true, localPreview: true, specialId, status: 'pending_approval', message: 'Submitted for approval locally. Not persisted — backend unavailable.' }
  }
  return result
}

export async function approveTicketTapperSpecial(specialId, payload) {
  const result = await apiFetch(`${BASE}/specials/${specialId}/approve`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (result.backendAvailable === false) {
    return { ok: true, localPreview: true, specialId, status: 'approved', message: 'Approved locally. Not persisted — backend unavailable.' }
  }
  return result
}

export async function rejectTicketTapperSpecial(specialId, payload) {
  const result = await apiFetch(`${BASE}/specials/${specialId}/reject`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (result.backendAvailable === false) {
    return { ok: true, localPreview: true, specialId, status: 'rejected', message: 'Rejected locally. Not persisted — backend unavailable.' }
  }
  return result
}

export async function publishTicketTapperSpecial(specialId, payload) {
  const result = await apiFetch(`${BASE}/specials/${specialId}/publish`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (result.backendAvailable === false) {
    return { ok: true, localPreview: true, specialId, status: 'active', message: 'Published locally. Not persisted — backend unavailable.' }
  }
  return result
}

export async function fetchSpecialsApprovalQueue(venueId) {
  const result = await apiFetch(`${BASE}/specials-approval-queue/${venueId}`)
  if (result.ok) return result
  return {
    ok: true,
    backendAvailable: false,
    localPreview: true,
    storageMode: 'memory_fallback',
    venueId,
    queue: smokeCraftTicketTapperSpecialsSeed.specials
      .filter(s => s.approval?.status === 'pending_approval'),
  }
}

export async function addSpecialToCart(specialId, payload) {
  const result = await apiFetch(`${BASE}/specials/${specialId}/add-to-cart`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (result.backendAvailable === false) {
    return {
      ok: true,
      localPreview: true,
      specialId,
      addedToCart: true,
      persistenceStatus: 'not_persisted',
      routingStatus: 'routing_preview',
      settlementStatus: 'pending_preview',
      message: 'Added to cart locally. Not persisted — backend unavailable.',
    }
  }
  return result
}

export async function requestTicketTapperInventorySync(venueId) {
  const result = await apiFetch(`${BASE}/inventory/sync-request`, {
    method: 'POST',
    body: JSON.stringify({ venueId }),
  })
  if (result.backendAvailable === false) {
    return {
      ok: true,
      venueId,
      syncStatus: 'provider_not_connected',
      syncRequested: false,
      syncMode: 'preview_fallback',
      message: 'POS provider not connected. Sync request cannot be fulfilled.',
    }
  }
  return result
}

export async function fetchVenueFeatureSettings(venueId) {
  const result = await apiFetch(`${BASE}/venue-feature-settings?venueId=${venueId}`)
  if (result.ok) return result
  return {
    ok: true,
    backendAvailable: false,
    localPreview: true,
    settings: {
      venue_id: venueId,
      ticket_tapper_partner_specials_enabled: false,
      status: 'disabled',
      computedStatus: 'disabled',
      partnerSpecialsAllowed: false,
    },
  }
}

export async function updateVenueFeatureSettings(payload) {
  const result = await apiFetch(`${BASE}/venue-feature-settings`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  if (result.backendAvailable === false) {
    return { ok: true, localPreview: true, message: 'Feature settings updated locally. Not persisted.' }
  }
  return result
}

export async function fetchMoneyBridgePreview({ venueId, partnerFoodSubtotal, deliveryFee }) {
  const params = new URLSearchParams({ venueId: venueId ?? '', partnerFoodSubtotal: partnerFoodSubtotal ?? 0, deliveryFee: deliveryFee ?? 4.50 })
  const result = await apiFetch(`${BASE}/money-bridge/preview?${params}`)
  if (result.ok) return result
  return {
    ok: true,
    backendAvailable: false,
    localPreview: true,
    taxStatus: 'preview_only',
    settlementStatus: 'pending_preview',
    settlementProcessorStatus: 'integration_required',
    note: 'Preview calculation only — backend unavailable.',
  }
}

export async function fetchKitchenRoutingPreview(payload) {
  const result = await apiFetch(`${BASE}/kitchen-routing/preview`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (result.backendAvailable === false) {
    return {
      ok: true,
      localPreview: true,
      routingStatus: 'routing_preview',
      kdsIntegration: false,
      message: 'Kitchen routing in preview mode — backend unavailable.',
    }
  }
  return result
}

export async function fetchTicketTapperSpecialsReport(venueId) {
  const result = await apiFetch(`${BASE}/specials-report/${venueId}`)
  if (result.ok) return result
  return {
    ok: true,
    backendAvailable: false,
    localPreview: true,
    storageMode: 'memory_fallback',
    report: {
      venueId,
      mode: 'local_preview',
      generatedAt: new Date().toISOString(),
      totalSpecialsShown: 0,
      totalSpecialTaps: 0,
      totalSpecialAdds: 0,
      totalSpecialCheckouts: 0,
      totalSoldOutBlocks: 0,
      topSpecials: [],
      rolePerformance: {
        manager: { specialsCreated: 0, taps: 0, revenue: 0 },
        bartender: { specialsCreated: 0, taps: 0, revenue: 0 },
        cook: { specialsCreated: 0, taps: 0, revenue: 0 },
        server: { specialsCreated: 0, taps: 0, revenue: 0 },
      },
      inventoryAlerts: [],
    },
    message: 'Report unavailable — backend not connected. Showing local-preview placeholder.',
  }
}
