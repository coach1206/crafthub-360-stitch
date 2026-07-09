/**
 * Passport 360 SmokeCraft Adapter — Phase F.5
 *
 * Makes real API calls to /api/passport-360/smokecraft.
 * Returns backendConnected: true only when the API confirms successful backend persistence.
 * Falls back to local-only response on any network or server error.
 * Never blocks the guest screen on failure.
 */

const BASE = '/api/passport-360/smokecraft'
const SAFE_CLAIM = 'passport_360_smokecraft_persistence'

function localFallback(area, extra = {}) {
  return {
    ok: false,
    backendConnected: false,
    persistenceMode: 'local_fallback',
    error: 'backend_unavailable',
    safeClaim: SAFE_CLAIM,
    area,
    ...extra,
  }
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  const json = await res.json()
  return json
}

// ── Health ────────────────────────────────────────────────────

export async function getPassportBackendHealth() {
  try {
    const json = await apiFetch('/health')
    return json?.data || json
  } catch {
    return localFallback('getPassportBackendHealth')
  }
}

// ── Guest resolve ─────────────────────────────────────────────

export async function resolveGuestProfile({ venueId, guestReference, displayName, emailHash, phoneHash, tenantId }) {
  try {
    const json = await apiFetch('/guest/resolve', {
      method: 'POST',
      body: { venueId, guestReference, displayName, emailHash, phoneHash, tenant_id: tenantId },
    })
    if (!json?.success || !json?.backendConnected) return localFallback('resolveGuestProfile')
    return json.data
  } catch {
    return localFallback('resolveGuestProfile')
  }
}

// ── Session complete ──────────────────────────────────────────

export async function syncSmokeCraftSessionToBackend({
  tenantId, venueId, guestId, smokecraftSessionId, sessionStatus,
  completedRoute, completedSteps, tasteProfile, xpSummary, stampSummary,
  startedAt, completedAt,
}) {
  try {
    const json = await apiFetch('/session/complete', {
      method: 'POST',
      body: {
        tenant_id: tenantId, venueId, guestId, smokecraftSessionId, sessionStatus,
        completedRoute, completedSteps, tasteProfile, xpSummary, stampSummary,
        startedAt, completedAt,
      },
    })
    if (!json?.success || !json?.backendConnected) return localFallback('syncSmokeCraftSessionToBackend')
    return { ...json.data, backendConnected: true, persistenceMode: 'database' }
  } catch {
    return localFallback('syncSmokeCraftSessionToBackend')
  }
}

// ── Stamp award ───────────────────────────────────────────────

export async function awardStampToBackend({ tenantId, venueId, guestId, stampId, moduleKey, sourceSessionId, sourceRoute, xpAwarded }) {
  try {
    const json = await apiFetch('/stamp/award', {
      method: 'POST',
      body: { tenant_id: tenantId, venueId, guestId, stampId, moduleKey, sourceSessionId, sourceRoute, xpAwarded },
    })
    if (!json?.success || !json?.backendConnected) return localFallback('awardStampToBackend')
    return { ...json.data, backendConnected: true, persistenceMode: 'database' }
  } catch {
    return localFallback('awardStampToBackend')
  }
}

// ── XP award ─────────────────────────────────────────────────

export async function awardXPToBackend({ tenantId, venueId, guestId, moduleKey, xpAmount, lastSessionKey, lastCompletedRoute }) {
  try {
    const json = await apiFetch('/xp/award', {
      method: 'POST',
      body: { tenant_id: tenantId, venueId, guestId, moduleKey, xpAmount, lastSessionKey, lastCompletedRoute },
    })
    if (!json?.success || !json?.backendConnected) return localFallback('awardXPToBackend')
    return { ...json.data, backendConnected: true, persistenceMode: 'database' }
  } catch {
    return localFallback('awardXPToBackend')
  }
}

// ── Flavor memory ─────────────────────────────────────────────

export async function saveFlavorMemoryToBackend({ tenantId, venueId, guestId, sourceSessionId, tasteTags, tastingNotes, flavorProfileSource, dataQualityStatus }) {
  try {
    const json = await apiFetch('/flavor-memory/save', {
      method: 'POST',
      body: { tenant_id: tenantId, venueId, guestId, sourceSessionId, tasteTags, tastingNotes, flavorProfileSource, dataQualityStatus },
    })
    if (!json?.success || !json?.backendConnected) return localFallback('saveFlavorMemoryToBackend')
    return { ...json.data, backendConnected: true, persistenceMode: 'database' }
  } catch {
    return localFallback('saveFlavorMemoryToBackend')
  }
}

// ── Read: guest progress ──────────────────────────────────────

export async function getGuestProgress({ guestId, moduleKey = 'smokecraft-360' }) {
  try {
    const json = await apiFetch(`/guest/${guestId}/progress?module_key=${moduleKey}`)
    if (!json?.success || !json?.backendConnected) return localFallback('getGuestProgress')
    return { ...json.data, backendConnected: true, persistenceMode: 'database' }
  } catch {
    return localFallback('getGuestProgress')
  }
}

// ── Read: earned stamps ───────────────────────────────────────

export async function getBackendEarnedStamps({ guestId, moduleKey = 'smokecraft-360' }) {
  try {
    const json = await apiFetch(`/guest/${guestId}/stamps?module_key=${moduleKey}`)
    if (!json?.success || !json?.backendConnected) return localFallback('getBackendEarnedStamps')
    return { stamps: json.data?.stamps || [], backendConnected: true, persistenceMode: 'database' }
  } catch {
    return localFallback('getBackendEarnedStamps')
  }
}

// ── Read: return visits ───────────────────────────────────────

export async function getReturnVisitProgress({ guestId, moduleKey = 'smokecraft-360' }) {
  try {
    const json = await apiFetch(`/guest/${guestId}/return-visits?module_key=${moduleKey}`)
    if (!json?.success || !json?.backendConnected) return localFallback('getReturnVisitProgress')
    return { ...json.data, backendConnected: true, persistenceMode: 'database' }
  } catch {
    return localFallback('getReturnVisitProgress')
  }
}

// ── Audit event ───────────────────────────────────────────────

export async function writeSyncAuditEvent({ tenantId, venueId, guestId, eventType, syncStatus, backendConnected, summary, metadata }) {
  try {
    await apiFetch('/audit/event', {
      method: 'POST',
      body: { tenant_id: tenantId, venueId, guestId, eventType, syncStatus, backendConnected, summary, metadata },
    })
  } catch {
    // audit is fire-and-forget; swallow errors silently
  }
}
