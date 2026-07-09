/**
 * SmokeCraft Handoff Service — staff ↔ guest mode transitions.
 * Covers both SmokeCraft→E.A.T. and SmokeCraft→POS360 handoffs.
 * PIN verification is handled server-side; this service only initiates/returns.
 */

const BASE = '/api/venues'
const POS360_BASE = '/api/pos360/smokecraft'
const POS360_SAFE_CLAIM = 'pos360_smokecraft_order_bridge'

function pos360LocalFallback(area, extra = {}) {
  return {
    ok: false, backendConnected: false, orderStatus: 'local_fallback',
    persistenceMode: 'local_fallback', safeClaim: POS360_SAFE_CLAIM, area, ...extra,
  }
}

async function pos360Fetch(path, opts = {}) {
  try {
    const res = await fetch(`${POS360_BASE}${path}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
      ...opts,
    })
    const json = await res.json()
    return json
  } catch {
    return null
  }
}

export async function createPOS360OrderIntent({
  venueId, guestId, smokecraftSessionId, passportSessionId,
  cigarReference, menuItemReference, quantity, modifiers,
  orderPayload, orderSource, orderType,
}) {
  const json = await pos360Fetch('/order-intent', {
    method: 'POST',
    body: JSON.stringify({
      venueId, guestId, smokecraftSessionId, passportSessionId,
      cigarReference, menuItemReference, quantity, modifiers,
      orderPayload, orderSource, orderType,
    }),
  })
  if (!json?.success || !json?.backendConnected) return pos360LocalFallback('createPOS360OrderIntent')
  return { ok: true, backendConnected: true, orderStatus: json.orderStatus, persistenceMode: json.persistenceMode, safeClaim: POS360_SAFE_CLAIM, orderIntent: json.data?.orderIntent }
}

export async function createPOS360HandoffRequest({
  venueId, guestId, smokecraftSessionId, passportSessionId,
  source, targetSystem, handoffPayload, staffActionRequired,
}) {
  const json = await pos360Fetch('/handoff-request', {
    method: 'POST',
    body: JSON.stringify({
      venueId, guestId, smokecraftSessionId, passportSessionId,
      source, targetSystem, handoffPayload, staffActionRequired,
    }),
  })
  if (!json?.success || !json?.backendConnected) return pos360LocalFallback('createPOS360HandoffRequest')
  return { ok: true, backendConnected: true, orderStatus: json.orderStatus, persistenceMode: json.persistenceMode, safeClaim: POS360_SAFE_CLAIM, handoff: json.data?.handoff }
}

export async function writePOS360AuditEvent({
  venueId, guestId, orderIntentId, handoffId, smokecraftSessionId,
  eventType, syncStatus, backendConnected, summary, metadata,
}) {
  const json = await pos360Fetch('/audit/event', {
    method: 'POST',
    body: JSON.stringify({
      venueId, guestId, orderIntentId, handoffId, smokecraftSessionId,
      eventType, syncStatus, backendConnected, summary, metadata,
    }),
  })
  return json || pos360LocalFallback('writePOS360AuditEvent')
}

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
    handoff: { handoff_id: handoffId, guest_session_id: guestSessionId, target, status: 'initiated_local_only' },
    storageMode: 'local_preview',
    localPreview: true,
    backendConnected: false,
    safeClaim: 'POS360/E.A.T. handoff is preview/internal — provider connection not yet enabled',
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
    backendConnected: false,
    safeClaim: 'E.A.T. management sync is preview/internal — backend connection not enabled',
    error: 'LOCAL PREVIEW MODE: E.A.T. sync requires backend.',
    notice: 'Backend unavailable. Sync not sent to management.',
  }
}
