/**
 * SmokeCraft Management Sync Service (module layer) — Phase F.7
 *
 * Makes real API calls to /api/eat-360/smokecraft.
 * Returns backendConnected: true only when the API confirms successful DB sync.
 * Falls back to local-only response on any network or server error.
 * Never claims demo_only as a permanent final state when backend is available.
 */

const BASE = '/api/eat-360/smokecraft'
const SAFE_CLAIM = 'eat_smokecraft_live_sync'

function localFallback(area, extra = {}) {
  return {
    synced: false,
    backendConnected: false,
    syncStatus: 'local_fallback',
    eatConnected: false,
    persistenceMode: 'local_fallback',
    safeClaim: SAFE_CLAIM,
    area,
    syncedAt: null,
    ...extra,
  }
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  return res.json()
}

// ── Health ────────────────────────────────────────────────────

export async function getEATSyncHealth() {
  try {
    const json = await apiFetch('/health')
    return json?.data || json
  } catch {
    return localFallback('getEATSyncHealth')
  }
}

// ── Session sync ──────────────────────────────────────────────

export async function syncManagement(payload = {}) {
  try {
    const json = await apiFetch('/session/sync', {
      method: 'POST',
      body: {
        venueId:             payload.venueId || null,
        guestId:             payload.guestId || null,
        smokecraftSessionId: payload.smokecraftSessionId || null,
        passportSessionId:   payload.passportSessionId || null,
        sessionStatus:       payload.sessionStatus || 'completed',
        completedRoute:      payload.completedRoute || null,
        completedSteps:      payload.completedSteps || [],
        xpSummary:           payload.xpSummary || {},
        stampSummary:        payload.stampSummary || [],
        tasteProfile:        payload.tasteProfile || {},
      },
    })
    if (!json?.success || !json?.backendConnected) return localFallback('syncManagement')
    return {
      synced: true,
      backendConnected: true,
      syncStatus: 'ok',
      eatConnected: true,
      persistenceMode: 'database',
      safeClaim: SAFE_CLAIM,
      sync: json.data?.sync,
      syncedAt: new Date().toISOString(),
    }
  } catch {
    return localFallback('syncManagement')
  }
}

// ── Guest activity ────────────────────────────────────────────

export async function recordGuestActivity(payload = {}) {
  try {
    const json = await apiFetch('/guest-activity', {
      method: 'POST',
      body: payload,
    })
    if (!json?.success || !json?.backendConnected) return localFallback('recordGuestActivity')
    return { backendConnected: true, syncStatus: 'ok', persistenceMode: 'database', safeClaim: SAFE_CLAIM, activity: json.data?.activity }
  } catch {
    return localFallback('recordGuestActivity')
  }
}

// ── Handoff queue ─────────────────────────────────────────────

export async function createHandoffQueueItem(payload = {}) {
  try {
    const json = await apiFetch('/handoff', {
      method: 'POST',
      body: payload,
    })
    if (!json?.success || !json?.backendConnected) return localFallback('createHandoffQueueItem')
    return { backendConnected: true, syncStatus: 'ok', persistenceMode: 'database', safeClaim: SAFE_CLAIM, handoff: json.data?.handoff }
  } catch {
    return localFallback('createHandoffQueueItem')
  }
}

// ── Manager alert ─────────────────────────────────────────────

export async function createManagerAlertSync(payload = {}) {
  try {
    const json = await apiFetch('/manager-alert', {
      method: 'POST',
      body: payload,
    })
    if (!json?.success || !json?.backendConnected) return localFallback('createManagerAlertSync')
    return { backendConnected: true, syncStatus: 'ok', persistenceMode: 'database', safeClaim: SAFE_CLAIM, alert: json.data?.alert }
  } catch {
    return localFallback('createManagerAlertSync')
  }
}

// ── Inventory signal ──────────────────────────────────────────

export async function createInventorySignalSync(payload = {}) {
  try {
    const json = await apiFetch('/inventory-signal', {
      method: 'POST',
      body: payload,
    })
    if (!json?.success || !json?.backendConnected) return localFallback('createInventorySignalSync')
    return { backendConnected: true, syncStatus: 'ok', persistenceMode: 'database', safeClaim: SAFE_CLAIM, signal: json.data?.signal }
  } catch {
    return localFallback('createInventorySignalSync')
  }
}

// ── Status reads ──────────────────────────────────────────────

export async function getManagementSyncStatus(venueId) {
  try {
    const json = await apiFetch('/health')
    const connected = json?.backendConnected || json?.data?.backendConnected || false
    return {
      venueId,
      eatConnected: connected,
      backendConnected: connected,
      syncStatus: connected ? 'connected' : 'not_connected',
      persistenceMode: connected ? 'database' : 'local_fallback',
      safeClaim: SAFE_CLAIM,
      lastSyncedAt: null,
    }
  } catch {
    return {
      venueId,
      eatConnected: false,
      backendConnected: false,
      syncStatus: 'not_connected',
      persistenceMode: 'local_fallback',
      safeClaim: SAFE_CLAIM,
      lastSyncedAt: null,
    }
  }
}

export async function buildManagementSyncReport() {
  const health = await getEATSyncHealth().catch(() => null)
  const connected = health?.backendConnected || false
  return {
    moduleId: 'smokecraft-experience',
    eatConnected: connected,
    backendConnected: connected,
    syncStatus: connected ? 'connected' : 'not_connected',
    persistenceMode: connected ? 'database' : 'local_fallback',
    safeClaim: SAFE_CLAIM,
    message: connected
      ? 'E.A.T. backend connected. SmokeCraft management sync active.'
      : 'E.A.T. backend not available. Using local fallback — no data leaves this device.',
  }
}

// ── Audit event (fire-and-forget) ────────────────────────────

export async function writeEATSyncAuditEvent(payload = {}) {
  try {
    await apiFetch('/audit/event', { method: 'POST', body: payload })
  } catch {
    // fire-and-forget; swallow errors silently
  }
}
