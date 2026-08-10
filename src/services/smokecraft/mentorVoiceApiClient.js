/**
 * Holistic Fix 5B-2B-1 — client adapter for the server-authoritative
 * SmokeCraft mentor-voice service (/api/smokecraft/mentor-voice/*).
 * Thin fetch wrapper only — the client never synthesizes audio itself,
 * never holds an API key, and never sends arbitrary preview text (only
 * a mentorId and a bounded speed value).
 */
const BASE = '/api/smokecraft/mentor-voice'

async function request(path, { method = 'POST', body, timeoutMs = 15000 } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(`${BASE}${path}`, {
      method, credentials: 'include', signal: controller.signal,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
    let json = null
    try { json = await res.json() } catch { /* non-JSON */ }
    if (!res.ok) return { ok: false, status: res.status, error: json?.error || 'internal_error' }
    return { ok: true, status: res.status, ...json }
  } catch (err) {
    if (err.name === 'AbortError') return { ok: false, status: 0, error: 'timeout' }
    return { ok: false, status: 0, error: 'offline' }
  } finally {
    clearTimeout(timer)
  }
}

export const fetchVoiceProfiles = () => request('/profiles', { method: 'GET' })
export const fetchVoicePreview = (mentorId, speed) => request('/preview', { body: { mentorId, speed } })
export const fetchGuidanceNarration = (mentorId, screenContext, pairingContext, speed) => request('/narrate', { body: { mentorId, screenContext, pairingContext, speed } })
export const fetchVoicePreferences = () => request('/preferences', { method: 'GET' })
export const saveVoicePreferences = (prefs) => request('/preferences', { body: prefs })
