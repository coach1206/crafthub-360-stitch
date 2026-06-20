/**
 * API Client — safe fetch wrapper for NOVEE OS backend.
 *
 * Rules:
 *  - Uses Vite proxy: /api/* → http://localhost:3001
 *  - 5 second timeout via AbortController
 *  - credentials: 'include' — sends HttpOnly auth cookie on every /api request
 *  - Returns null if offline, timed out, or backend unavailable
 *  - Never throws — never crashes the guest journey
 *  - Console warns in dev only
 */

const DEFAULT_TIMEOUT_MS = 5_000

/** Returns true if the browser reports a live network connection. */
function isOnline() {
  return typeof navigator === 'undefined' || navigator.onLine !== false
}

/**
 * Core fetch wrapper.
 * @returns {Promise<{data:null, status:number}|object|null>} Parsed JSON response, or null on any failure.
 *   On a 401/403 the raw status is attached as `status` on the returned object/null marker so
 *   callers (e.g. AuthContext) can tell "not logged in" apart from a real network/server error
 *   without ever throwing into the render tree.
 */
async function apiFetch(method, path, data) {
  if (!isOnline()) {
    if (import.meta.env?.DEV) {
      console.warn(`[apiClient] Offline — skipped: ${method} ${path}`)
    }
    return null
  }

  const controller = new AbortController()
  const timerId    = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)

  try {
    const opts = {
      method,
      headers:     { 'Content-Type': 'application/json' },
      signal:      controller.signal,
      credentials: 'include',   // Sends HttpOnly novee_auth cookie on every /api request
    }
    if (data !== undefined && method !== 'GET') {
      opts.body = JSON.stringify(data)
    }

    const res = await fetch(path, opts)

    if (!res.ok) {
      // 401/403 on an auth-check endpoint is an expected, routine outcome for
      // guest/public/demo traffic — not an error. Never throw for it; just
      // hand the status back so the caller can decide what "unauthenticated"
      // means for that endpoint instead of treating it as a failure.
      if (res.status === 401 || res.status === 403) {
        return { data: null, status: res.status }
      }
      const json = await res.json().catch(() => ({ message: res.statusText }))
      throw new Error(json.message || `HTTP ${res.status}`)
    }

    return await res.json()
  } catch (err) {
    if (err.name === 'AbortError') {
      if (import.meta.env?.DEV) {
        console.warn(`[apiClient] Timeout: ${method} ${path}`)
      }
    } else if (import.meta.env?.DEV) {
      console.warn(`[apiClient] ${method} ${path} →`, err.message)
    }
    return null
  } finally {
    clearTimeout(timerId)
  }
}

export const apiGet    = (path)       => apiFetch('GET',    path)
export const apiPost   = (path, data) => apiFetch('POST',   path, data)
export const apiPut    = (path, data) => apiFetch('PUT',    path, data)
export const apiDelete = (path)       => apiFetch('DELETE', path)
