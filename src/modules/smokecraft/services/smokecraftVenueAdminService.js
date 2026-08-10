/**
 * SmokeCraft Venue Admin Service
 * Frontend service — fetches venue admin data from /api/modules/smokecraft/admin/*.
 */

const BASE = '/api/modules/smokecraft/admin'

async function safeFetch(url, options = {}) {
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
    if (!res.ok) return { error: `HTTP ${res.status}`, url }
    return await res.json()
  } catch (err) {
    return { error: err.message, url }
  }
}

export async function getAdminStatus() {
  return safeFetch(`${BASE}/status`)
}

export async function getVenueOverview(venueId, actorRole = 'manager', actorId = null) {
  return safeFetch(`${BASE}/venue/${venueId}/overview?actorRole=${actorRole}${actorId ? `&actorId=${actorId}` : ''}`)
}

export async function getStaffQueue(venueId, actorRole = 'manager', actorId = null) {
  return safeFetch(`${BASE}/venue/${venueId}/staff-queue?actorRole=${actorRole}${actorId ? `&actorId=${actorId}` : ''}`)
}

export async function getVenueAnalytics(venueId, actorRole = 'manager', actorId = null, dateRange = null) {
  const params = new URLSearchParams({ actorRole })
  if (actorId) params.set('actorId', actorId)
  if (dateRange) params.set('dateRange', dateRange)
  return safeFetch(`${BASE}/venue/${venueId}/analytics?${params}`)
}

export async function getVenueIntegrations(venueId, actorRole = 'manager', actorId = null) {
  return safeFetch(`${BASE}/venue/${venueId}/integrations?actorRole=${actorRole}${actorId ? `&actorId=${actorId}` : ''}`)
}

export async function getVenueRewards(venueId, actorRole = 'manager', actorId = null) {
  return safeFetch(`${BASE}/venue/${venueId}/rewards?actorRole=${actorRole}${actorId ? `&actorId=${actorId}` : ''}`)
}

export async function getVenuePairings(venueId, actorRole = 'manager', actorId = null) {
  return safeFetch(`${BASE}/venue/${venueId}/pairings?actorRole=${actorRole}${actorId ? `&actorId=${actorId}` : ''}`)
}

export async function getVenueOrders(venueId, actorRole = 'manager', actorId = null) {
  return safeFetch(`${BASE}/venue/${venueId}/orders?actorRole=${actorRole}${actorId ? `&actorId=${actorId}` : ''}`)
}

export async function getVenueAuditLog(venueId, actorRole = 'manager', actorId = null) {
  return safeFetch(`${BASE}/venue/${venueId}/audit?actorRole=${actorRole}${actorId ? `&actorId=${actorId}` : ''}`)
}

export async function executeVenueControl(venueId, action, actorRole, actorId = null, payload = {}) {
  return safeFetch(`${BASE}/venue/${venueId}/control`, {
    method: 'POST',
    body: JSON.stringify({ action, actorRole, actorId, payload }),
  })
}

export async function getStaffAssignedOrders(staffId, actorRole = 'staff', actorId = null) {
  return safeFetch(`${BASE}/staff/${staffId}/assigned-orders?actorRole=${actorRole}${actorId ? `&actorId=${actorId}` : ''}`)
}
