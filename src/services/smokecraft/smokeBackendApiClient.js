/**
 * SmokeCraft backend API client — calls the endpoints documented in
 * docs/smokecraft-api-contract.md. None of those endpoints exist server-side
 * yet (only the unrelated pairing-order routes are mounted at /api/smokecraft),
 * so every call here will currently resolve to `failed` or `backend_required`.
 * This file exists so the wiring is real and honest the moment those routes
 * are implemented — it must never report `backend_connected` unless the
 * backend actually returned a successful response.
 */
import { apiGet, apiPost, apiPut } from '../apiClient.js'

/** Same-origin relative path, same pattern as the rest of the app (apiClient.js) — no VITE_*_API_BASE_URL exists in this repo. */
export function getSmokeApiBaseUrl() {
  return '/api/smokecraft'
}

/** Honest config status — there is no separate base-URL env var to misconfigure; the Vite proxy is always present in dev. Whether the *specific* SmokeCraft endpoints exist server-side is a separate question answered per-call. */
export function getSmokeApiConfigStatus() {
  return { configured: true, baseUrl: getSmokeApiBaseUrl(), reason: 'Using the existing relative /api proxy pattern — no dedicated SmokeCraft API base URL is configured or required.' }
}

function ok(data, source = 'remote') {
  return { ok: true, status: 'backend_connected', data, error: null, source }
}
function failed(error) {
  return { ok: false, status: 'failed', data: null, error, source: 'remote' }
}
function backendRequired(reason) {
  return { ok: false, status: 'backend_required', data: null, error: reason, source: 'none' }
}

async function safeGet(path) {
  try {
    const res = await apiGet(path)
    if (res && res.ok !== false) return ok(res)
    return failed(`No successful response from ${path}`)
  } catch (err) {
    return failed(err?.message || `Request to ${path} failed`)
  }
}

async function safePost(path, payload) {
  try {
    const res = await apiPost(path, payload)
    if (res && res.ok !== false) return ok(res)
    return failed(`No successful response from ${path}`)
  } catch (err) {
    return failed(err?.message || `Request to ${path} failed`)
  }
}

async function safePatch(path, payload) {
  try {
    const res = await apiPut(path, payload)
    if (res && res.ok !== false) return ok(res)
    return failed(`No successful response from ${path}`)
  } catch (err) {
    return failed(err?.message || `Request to ${path} failed`)
  }
}

const BASE = getSmokeApiBaseUrl()

export const createSmokeSessionRemote        = (payload)            => safePost(`${BASE}/sessions`, payload)
export const getSmokeSessionRemote           = (sessionId)          => safeGet(`${BASE}/sessions/${encodeURIComponent(sessionId)}`)
export const updateSmokeSessionRemote        = (sessionId, payload) => safePatch(`${BASE}/sessions/${encodeURIComponent(sessionId)}`, payload)
export const postSmokeSessionEventRemote     = (sessionId, event)   => safePost(`${BASE}/sessions/${encodeURIComponent(sessionId)}/events`, event)

export const createSmokePurchaseIntentRemote = (payload)            => safePost(`${BASE}/purchase-intents`, payload)
export const getSmokePurchaseIntentsRemote   = ()                   => safeGet(`${BASE}/purchase-intents`)
export const updateSmokePurchaseIntentRemote = (intentId, payload)  => safePatch(`${BASE}/purchase-intents/${encodeURIComponent(intentId)}`, payload)
export const verifySmokePurchaseIntentRemote = (intentId, payload)  => safePost(`${BASE}/purchase-intents/${encodeURIComponent(intentId)}/verify`, payload)
export const rejectSmokePurchaseIntentRemote = (intentId, payload)  => safePost(`${BASE}/purchase-intents/${encodeURIComponent(intentId)}/reject`, payload)

export const getSmokeEATHandoffsRemote       = ()                    => safeGet('/api/eat/smokecraft/handoffs')
export const updateSmokeEATHandoffRemote     = (handoffId, payload)  => safePatch(`/api/eat/smokecraft/handoffs/${encodeURIComponent(handoffId)}`, payload)

export const createSmokeLeaderboardEntryRemote = (payload)          => safePost(`${BASE}/leaderboard`, payload)
export const getSmokeLeaderboardEntriesRemote  = ()                 => safeGet(`${BASE}/leaderboard`)

export const postSmokeAuditEventRemote       = (payload)            => safePost(`${BASE}/audit-events`, payload)

// Re-exported for callers that want to short-circuit before attempting a remote call.
export function isSmokeApiConfigMissing() {
  return !getSmokeApiConfigStatus().configured
}
