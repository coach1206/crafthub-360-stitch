/**
 * SmokeCraft Venue Directory API service — Venue Data Source pass.
 * Fetches the real, active venue directory for Venue Selection from the
 * backend `venues` table. Never returns sample/mock venue data: a failed or
 * unavailable request resolves to an empty list with `backendAvailable`
 * telling the caller whether to show an error state or an honest empty
 * state — the caller decides which, this service never fabricates rows.
 */
const BASE = '/api/smokecraft/venue-commerce'

export async function fetchSmokeCraftVenues() {
  try {
    const res = await fetch(`${BASE}/venues`, { headers: { 'Content-Type': 'application/json' } })
    if (!res.ok) return { ok: false, backendAvailable: true, venues: [] }
    const data = await res.json()
    return { ok: true, backendAvailable: true, venues: Array.isArray(data.venues) ? data.venues : [] }
  } catch {
    return { ok: false, backendAvailable: false, venues: [] }
  }
}
