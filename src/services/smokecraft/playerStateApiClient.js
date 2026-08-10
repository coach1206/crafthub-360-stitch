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

/**
 * Holistic Fix 5A-2: server-verified named one-time XP activity (Origins
 * module screens). `namedSource` must be a key the server already knows
 * about (server/services/smokecraft/sessionRewardTable.js's
 * NAMED_XP_SOURCES) — the server decides the amount, never the client.
 */
export async function awardNamedXpOnServer(guestId, namedSource, { sourceRoute, deviceId } = {}) {
  const idempotencyKey = makeIdempotencyKey(guestId, `xp:${namedSource}`)
  return postJson('/awards/xp', { idempotencyKey, awardKey: namedSource, sourceRoute, deviceId })
}

/**
 * Holistic Fix 5A-2: submits raw per-question Knowledge Check responses
 * (never a score/correctness value) — the server independently scores
 * them and is the sole authority for the XP grant.
 */
export async function submitKnowledgeCheckOnServer(guestId, moduleId, responses, completionStepId, { sourceRoute, deviceId } = {}) {
  const idempotencyKey = makeIdempotencyKey(guestId, `quiz:${moduleId}`)
  return postJson(`/knowledge-check/${encodeURIComponent(moduleId)}/submit`, { idempotencyKey, responses, completionStepId, sourceRoute, deviceId })
}

/**
 * Holistic Fix 5A-2: submits the 5 raw leaf-id answers (never a score) —
 * the server scores against the real answer key and is the sole
 * authority for XP, the botanist/leaf-scholar badges, and the
 * leaf-recognition Passport stamp.
 */
export async function submitLeafChallengeOnServer(guestId, answers, { sourceRoute, deviceId } = {}) {
  const idempotencyKey = makeIdempotencyKey(guestId, 'leaf-challenge')
  return postJson('/leaf-challenge/submit', { idempotencyKey, answers, sourceRoute, deviceId })
}

/**
 * Holistic Fix 5A-3: submits the raw wrapper/binder/filler selection
 * (structured evidence, not a completion claim) — the server verifies
 * it is well-formed before granting XP/the master-blend Passport stamp.
 */
export async function submitBlendSelectionOnServer(guestId, wrapperIndex, binderIndex, fillerIndices, { sourceRoute, deviceId } = {}) {
  const idempotencyKey = makeIdempotencyKey(guestId, 'blend-submit')
  return postJson('/blend/submit', { idempotencyKey, wrapperIndex, binderIndex, fillerIndices, sourceRoute, deviceId })
}

/**
 * Holistic Fix 5A-3D: server-authoritative tasting draft read/write +
 * completion. Draft save uses the same optimistic-concurrency pattern as
 * the journey-snapshot sync (expectedVersion, 409 on stale write —
 * server value always wins, never silently overwritten).
 */
export async function fetchTastingDraft(activityKey) {
  try {
    const res = await fetch(`${BASE}/tasting/${encodeURIComponent(activityKey)}/draft`, { credentials: 'include' })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data || data.success !== true) return { ok: false, status: res.status }
    return { ok: true, draftData: data.draftData, version: data.version, updatedAt: data.updatedAt }
  } catch (err) {
    return { ok: false, status: 0, error: 'network_unavailable' }
  }
}

export async function saveTastingDraftOnServer(activityKey, draftData, expectedVersion) {
  try {
    const res = await fetch(`${BASE}/tasting/${encodeURIComponent(activityKey)}/draft`, {
      method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ draftData, expectedVersion }),
    })
    if (res.status === 409) {
      const data = await res.json().catch(() => null)
      // Package A draft-persistence correction: a 409 means either a
      // stale-version write (data.current holds the server's real
      // current draft) or the session is already completed — a real,
      // distinct outcome with no draft to fall back to. Conflating the
      // two crashed the caller (reading .draftData off an undefined
      // `current`) whenever a stale save landed after completion.
      if (data?.error === 'already_completed') {
        return { ok: false, alreadyCompleted: true }
      }
      return { ok: false, conflict: true, current: data?.current }
    }
    const data = await res.json().catch(() => null)
    if (!res.ok || !data || data.success !== true) return { ok: false, status: res.status }
    return { ok: true, current: data.current }
  } catch (err) {
    return { ok: false, status: 0, error: 'network_unavailable' }
  }
}

export async function submitTastingCompletionOnServer(guestId, activityKey, selectedCigarId, compareIds, { sourceRoute, deviceId } = {}) {
  const idempotencyKey = makeIdempotencyKey(guestId, `tasting:${activityKey}`)
  return postJson(`/tasting/${encodeURIComponent(activityKey)}/complete`, { idempotencyKey, selectedCigarId, compareIds, sourceRoute, deviceId })
}

/**
 * Required-Interaction Closure Package A — submits real
 * tasting-observation evidence for Sessions 8/12/16 before their
 * generic session-completion call is allowed to succeed server-side.
 */
export async function submitTastingObservationOnServer(guestId, sessionId, notesSelected, personalNotes, { sourceRoute, deviceId } = {}) {
  const idempotencyKey = makeIdempotencyKey(guestId, `tasting-observation:${sessionId}`)
  return postJson(`/tasting-observation/${encodeURIComponent(sessionId)}`, { idempotencyKey, notesSelected, personalNotes, sourceRoute, deviceId })
}

/**
 * Required-Interaction Closure Package B — submits the real 6-category
 * scorecard rating for Session 19 as evidence before the generic
 * session-completion call is allowed to succeed server-side. The
 * server independently computes and owns the weighted overall score.
 */
export async function submitScorecardOnServer(guestId, categories, personalNotes, meta, { sourceRoute, deviceId } = {}) {
  const idempotencyKey = makeIdempotencyKey(guestId, 'scorecard-submit')
  return postJson('/scorecard/submit', { idempotencyKey, categories, personalNotes, meta, sourceRoute, deviceId })
}

/**
 * Required-Interaction Closure Package C — submits one selection/
 * sequencing/matching/hotspot attempt for Sessions 2/5/6/10. The
 * server independently evaluates correctness; the client never claims
 * "correct" itself.
 */
export async function submitSelectionAttemptOnServer(guestId, sessionId, payload, { sourceRoute, deviceId } = {}) {
  const idempotencyKey = makeIdempotencyKey(guestId, `selection-attempt:${sessionId}`)
  return postJson(`/selection/${encodeURIComponent(sessionId)}`, { idempotencyKey, payload, sourceRoute, deviceId })
}

/**
 * Holistic Fix 5A-3E: submits the raw set of viewed cultivation-stage
 * ids as evidence — the server verifies it covers all real required
 * stages before granting XP/the cultivator Passport stamp.
 */
export async function submitCultivatorEvidenceOnServer(guestId, viewedStageIds, { sourceRoute, deviceId } = {}) {
  const idempotencyKey = makeIdempotencyKey(guestId, 'cultivator-submit')
  return postJson('/cultivator/submit', { idempotencyKey, viewedStageIds, sourceRoute, deviceId })
}
