/**
 * SmokeCraft Progress Service — save and resume guest session commerce state.
 * Falls back to sessionStorage when backend unavailable.
 */

const BASE = '/api/smokecraft'

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

const SS_KEY = (id) => `sc_progress_${id}`

export async function saveGuestProgress(guestSessionId, data) {
  // Always mirror to sessionStorage for instant local restore
  try { sessionStorage.setItem(SS_KEY(guestSessionId), JSON.stringify(data)) } catch {}

  const result = await safeFetch(`${BASE}/progress/save`, {
    method: 'POST',
    body: JSON.stringify({ guestSessionId, ...data }),
  })
  if (result?.ok) return result

  return {
    ok: true,
    storageMode: 'session_storage_fallback',
    localPreview: true,
    notice: 'Progress saved to local storage only. Backend unavailable.',
  }
}

export async function resumeGuestSession(guestSessionId) {
  const result = await safeFetch(`${BASE}/resume/${guestSessionId}`)
  if (result?.ok) return result

  // Fallback to sessionStorage
  try {
    const raw = sessionStorage.getItem(SS_KEY(guestSessionId))
    if (raw) {
      return { ok: true, session: JSON.parse(raw), storageMode: 'session_storage_fallback', localPreview: true }
    }
  } catch {}

  return { ok: false, error: 'No saved session found', storageMode: 'local_preview', localPreview: true }
}
