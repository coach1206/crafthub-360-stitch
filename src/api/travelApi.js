/**
 * DayOne360 Travel API — live endpoints backed by /api/travel.
 * Falls back to a cached local copy of the trip catalog if the network
 * request fails, so the screen never blanks out — but concierge submissions
 * and stamp claims always go through the real backend, never faked locally.
 */
import { TRIPS as LOCAL_TRIPS_FALLBACK } from '../data/dayOneTravelTrips.js'

async function apiFetch(path, opts = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.message || 'API error')
  return json.data
}

export async function getTrips() {
  try {
    const data = await apiFetch('/api/travel/trips')
    return data.trips || []
  } catch {
    return LOCAL_TRIPS_FALLBACK
  }
}

export async function submitConciergeRequest({ userId, tripId, name, contact, notes }) {
  const data = await apiFetch('/api/travel/concierge', {
    method: 'POST',
    body: JSON.stringify({ userId, tripId, name, contact, notes }),
  })
  return data
}

export async function getUserStamps(userId) {
  try {
    const data = await apiFetch(`/api/travel/stamps/${userId}`)
    return data
  } catch {
    return { stamps: [], totalXp: 0, count: 0 }
  }
}

export async function claimStamp({ userId, tripId }) {
  const data = await apiFetch('/api/travel/stamps', {
    method: 'POST',
    body: JSON.stringify({ userId, tripId }),
  })
  return data
}
