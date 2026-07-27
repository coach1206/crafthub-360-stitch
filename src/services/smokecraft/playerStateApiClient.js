/**
 * SmokeCraft canonical player-state — client adapter (Holistic Fix 4).
 *
 * Thin fetch wrapper for /api/smokecraft/player-state/*. Always sends
 * credentials so the server-verified guest-identity cookie
 * (smokecraft_guest_session, issued by ensureSmokeCraftGuestIdentity) is
 * included — the server derives guest identity from that cookie alone,
 * never from anything this client sends in the request body.
 *
 * Idempotency keys are deterministic (guestId + logical-action string),
 * not random per call — a page refresh or retry after a dropped
 * response reuses the exact same key, so the server's UNIQUE constraint
 * on idempotency_key naturally recognizes the retry as the same logical
 * mutation rather than depending on the client to remember and resend a
 * previously-generated random key.
 *
 * Every function is fire-and-forget-safe: network failure never throws
 * into the caller's synchronous UI-update path (see
 * GuestSessionContext.jsx's awardSessionRewards) — it resolves to
 * { ok: false } and the caller logs/ignores it. localStorage remains the
 * fast, offline-safe UI cache; this adapter is the write path to the new
 * server authority, not a blocking gate on the UI.
 */

const BASE = '/api/smokecraft/player-state'

export function makeIdempotencyKey(guestId, action) {
  // Deterministic, not random — see file header. Long enough to satisfy
  // the server's >= 8 char validation with room to spare.
  return `${guestId || 'unknown-guest'}::${action}`.slice(0, 200)
}

async function postJson(path, body) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data || data.success !== true) {
      return { ok: false, status: res.status, error: data?.error || 'request_failed' }
    }
    return { ok: true, data }
  } catch (err) {
    // Offline / network error — honest failure, never a fake success.
    return { ok: false, status: 0, error: 'network_unavailable', detail: String(err?.message || err) }
  }
}

export async function fetchPlayerState() {
  try {
    const res = await fetch(BASE, { credentials: 'include' })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data || data.success !== true) return { ok: false, status: res.status }
    return { ok: true, state: data.state }
  } catch (err) {
    return { ok: false, status: 0, error: 'network_unavailable' }
  }
}

export async function completeSessionOnServer(guestId, sessionId, { sourceRoute, deviceId } = {}) {
  const idempotencyKey = makeIdempotencyKey(guestId, `complete:${sessionId}`)
  return postJson(`/sessions/${encodeURIComponent(sessionId)}/complete`, { idempotencyKey, sourceRoute, deviceId })
}

export async function awardBadgeOnServer(guestId, badgeId, { sourceRoute, deviceId } = {}) {
  const idempotencyKey = makeIdempotencyKey(guestId, `badge:${badgeId}`)
  return postJson('/awards/badge', { idempotencyKey, awardKey: badgeId, sourceRoute, deviceId })
}

export async function awardPassportStampOnServer(guestId, stampId, { sourceRoute, deviceId } = {}) {
  const idempotencyKey = makeIdempotencyKey(guestId, `stamp:${stampId}`)
  return postJson('/awards/passport-stamp', { idempotencyKey, awardKey: stampId, sourceRoute, deviceId })
}
