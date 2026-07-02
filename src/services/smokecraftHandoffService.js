/**
 * SmokeCraft Handoff Service — staff ↔ guest mode transitions.
 * Covers both SmokeCraft→E.A.T. and SmokeCraft→POS360 handoffs.
 * PIN verification is handled server-side; this service only initiates/returns.
 */

const BASE = '/api/venues'

async function safeFetch(url, opts = {}) {
  try {
    const res = await fetch(url, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
      ...opts,
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      return { ok: false, error: body.error || `HTTP ${res.status}` }
    }
    return await res.json()
  } catch {
    return null
  }
}

/**
 * Start a staff handoff — guest taps "Staff" button.
 * @param {object} opts
 * @param {'eat'|'pos360'} opts.target
 */
export async function startHandoff({ guestSessionId, venueId, tabletId, target, startRoute, returnRoute, currentVisit, currentSession }) {
  const data = await safeFetch(`${BASE}/handoff/start`, {
    method: 'POST',
    body: JSON.stringify({ guestSessionId, venueId, tabletId, target, startRoute, returnRoute, currentVisit, currentSession }),
  })
  if (data !== null) return data

  // Local fallback — return a stub handoff so the UI can still transition
  const handoffId = `local-hoff-${Date.now()}`
  return {
    ok: true,
    handoffId,
    handoff: { handoff_id: handoffId, guest_session_id: guestSessionId, target, status: 'started' },
    storageMode: 'local_preview',
    localPreview: true,
    notice: 'LOCAL PREVIEW MODE: handoff recorded locally only.',
  }
}

/**
 * Return from staff mode back to guest journey.
 */
export async function returnFromHandoff(handoffId) {
  const data = await safeFetch(`${BASE}/handoff/${handoffId}/return`, {
    method: 'POST',
  })
  if (data !== null) return data

  return { ok: true, handoffId, storageMode: 'local_preview', localPreview: true }
}

/**
 * Send E.A.T. management sync event.
 */
export async function syncToEAT({ guestSessionId, venueId, handoffId, staffUserId, syncType, notes, vipCandidateSignal, recommendedFollowUp, inventoryDemandSignal }) {
  const data = await safeFetch(`${BASE}/eat/sync`, {
    method: 'POST',
    body: JSON.stringify({ guestSessionId, venueId, handoffId, staffUserId, syncType, notes, vipCandidateSignal, recommendedFollowUp, inventoryDemandSignal }),
  })
  if (data !== null) return data

  return {
    ok: false,
    localPreview: true,
    error: 'LOCAL PREVIEW MODE: E.A.T. sync requires backend.',
    notice: 'Backend unavailable. Sync not sent to management.',
  }
}
