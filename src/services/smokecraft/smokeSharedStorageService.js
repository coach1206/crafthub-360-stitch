/**
 * SmokeCraft shared storage adapter — honest bridge toward a real
 * multi-device backend. A real NOVEE backend exists (Express + optional
 * Postgres, see server/) and is reachable via apiClient, but it does not
 * yet expose any SmokeCraft-specific persistence endpoints (purchase
 * intents, POS3 verification, E.A.T. handoff, leaderboard). Until those
 * endpoints exist, every read/write here uses a local-storage fallback and
 * says so explicitly — it never claims to be shared/multi-device storage.
 */

import { apiGet } from '../apiClient.js'
import {
  createSmokeSessionRemote,
  createSmokePurchaseIntentRemote,
  getSmokePurchaseIntentsRemote,
  updateSmokePurchaseIntentRemote,
  getSmokeEATHandoffsRemote,
  createSmokeLeaderboardEntryRemote,
  getSmokeLeaderboardEntriesRemote,
  getSmokeBackendRouteStatusRemote,
} from './smokeBackendApiClient.js'

const LOCAL_KEYS = {
  snapshots:   'novee_smoke_shared_session_snapshots',
  intents:     'novee_smoke_shared_purchase_intents',
  eatHandoffs: 'novee_smoke_shared_eat_handoffs',
  leaderboard: 'novee_smoke_shared_leaderboard_entries',
}

/**
 * Last-known outcome of each remote attempt, keyed by operation. These calls
 * are fired in the background (never awaited by the sync local-storage API
 * below) so reads/writes never block on a backend that doesn't expose these
 * endpoints yet. Read via getSmokeRemoteSyncCache() for UI display only —
 * never treated as proof that shared storage is active.
 */
const remoteSyncCache = {}

function attemptRemoteSync(key, remoteCallPromise) {
  remoteCallPromise
    .then((res) => { remoteSyncCache[key] = { ...res, attemptedAt: Date.now() } })
    .catch((err) => { remoteSyncCache[key] = { ok: false, status: 'failed', error: err?.message || 'Remote sync attempt failed', attemptedAt: Date.now() } })
}

/** Last-known remote sync outcome per operation — informational only, never authoritative for storage mode. */
export function getSmokeRemoteSyncCache() {
  return remoteSyncCache
}

let cachedBackendStatus = {
  status: 'backend_required',
  reason: 'Backend connectivity has not been checked yet this session.',
  checkedAt: null,
}

function readLocal(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

/**
 * Pings the real NOVEE backend health endpoint. Even when reachable, this
 * does NOT mean SmokeCraft shared storage exists server-side — no such
 * endpoints have been built yet — so it only updates general backend
 * reachability, never the storage mode itself.
 */
export async function checkSmokeBackendConnectivity() {
  try {
    const res = await apiGet('/api/health')
    cachedBackendStatus = res
      ? { status: 'backend_reachable', reason: 'NOVEE backend is reachable, but no SmokeCraft shared-storage endpoints exist yet — local fallback remains active.', checkedAt: Date.now() }
      : { status: 'backend_unreachable', reason: 'NOVEE backend is unreachable — using local fallback only.', checkedAt: Date.now() }
  } catch {
    cachedBackendStatus = { status: 'backend_unreachable', reason: 'NOVEE backend is unreachable — using local fallback only.', checkedAt: Date.now() }
  }
  return cachedBackendStatus
}

/** Last-known backend reachability (sync read of the cached check). */
export function getSmokeBackendStatus() {
  return cachedBackendStatus
}

let cachedRouteStatus = { checked: false, ok: false, storageMode: 'none' }

/**
 * Checks the SmokeCraft route-foundation status (Phase 10). Routes now exist
 * server-side, but "shared venue storage" is only true when the server
 * reports storageMode "postgres" — a server using its in-memory fallback
 * (no DATABASE_URL, or the smoke_* tables not migrated in — this repo has no
 * migration runner, so 011_smokecraft_schema.sql isn't auto-applied) is NOT
 * shared/durable storage even though the routes respond successfully.
 */
export async function checkSmokeBackendRouteStatus() {
  const res = await getSmokeBackendRouteStatusRemote()
  cachedRouteStatus = {
    checked: true,
    ok: res.ok === true,
    storageMode: res.ok ? res.storageMode : 'none',
    checkedAt: Date.now(),
  }
  return cachedRouteStatus
}

/** Last-known route-status check (sync read) — informational only. */
export function getCachedSmokeRouteStatus() {
  return cachedRouteStatus
}

/**
 * SmokeCraft's actual storage mode. Local fallback (localStorage) remains
 * the always-available baseline. "venue_shared" is reported ONLY when the
 * most recent route-status check confirmed storageMode "postgres" — never
 * for memory_fallback, even though the route foundation itself is real.
 */
export function getSmokeSharedStorageMode() {
  if (cachedRouteStatus.checked && cachedRouteStatus.ok && cachedRouteStatus.storageMode === 'postgres') {
    return {
      mode: 'venue_shared',
      backendConnected: true,
      localFallback: true,
      reason: 'SmokeCraft backend routes are connected to Postgres — purchase intents, POS3 verification, E.A.T. handoff, and leaderboard data are shared venue-wide.',
    }
  }
  if (cachedRouteStatus.checked && cachedRouteStatus.ok && cachedRouteStatus.storageMode === 'memory_fallback') {
    return {
      mode: 'route_foundation_memory_fallback',
      backendConnected: false,
      localFallback: true,
      reason: 'SmokeCraft backend routes exist and respond, but the server itself is using in-memory fallback storage (no Postgres connection) — this is not shared/durable venue storage. Local browser fallback remains the source of truth for this guest session.',
    }
  }
  return {
    mode: 'local_fallback',
    backendConnected: false,
    localFallback: true,
    reason: 'SmokeCraft backend route status has not been confirmed this session. Purchase intents, POS3 verification, E.A.T. handoff, and leaderboard data stay local to this browser/session only.',
  }
}

export function saveSmokeSessionSnapshot(session) {
  const sessionId = session?.sessionId || 'unknown-session'
  const all = readLocal(LOCAL_KEYS.snapshots) || {}
  all[sessionId] = { smokeCraft: session?.smokeCraft || null, savedAt: Date.now() }
  const ok = writeLocal(LOCAL_KEYS.snapshots, all)
  attemptRemoteSync('session', createSmokeSessionRemote({ sessionId, ...session?.smokeCraft }))
  return ok
    ? { status: 'local_fallback', reason: 'Session snapshot saved to local fallback storage — not yet synced to a shared backend.' }
    : { status: 'failed', reason: 'Local storage write failed.' }
}

export function loadSmokeSessionSnapshot(sessionId) {
  const all = readLocal(LOCAL_KEYS.snapshots) || {}
  const entry = all[sessionId] || null
  return { status: 'local_fallback', data: entry, reason: entry ? 'Loaded from local fallback storage.' : 'No snapshot found in local fallback storage.' }
}

export function saveSmokePurchaseIntent(session, intent) {
  if (!intent?.intentId) return { status: 'failed', reason: 'No purchase intent to save.' }
  const list = readLocal(LOCAL_KEYS.intents) || []
  const idx = list.findIndex(i => i.intentId === intent.intentId)
  const record = { ...intent, sessionId: session?.sessionId || null, savedAt: Date.now() }
  if (idx >= 0) list[idx] = record
  else list.push(record)
  const ok = writeLocal(LOCAL_KEYS.intents, list)
  attemptRemoteSync('purchaseIntent', createSmokePurchaseIntentRemote(record))
  return ok
    ? { status: 'local_fallback', reason: 'Purchase intent saved to local fallback — shared venue storage pending backend implementation.' }
    : { status: 'failed', reason: 'Local storage write failed.' }
}

export function loadSmokePurchaseIntents() {
  const list = readLocal(LOCAL_KEYS.intents) || []
  attemptRemoteSync('purchaseIntentsList', getSmokePurchaseIntentsRemote())
  return { status: 'local_fallback', data: list, reason: 'Loaded from local fallback storage — only intents created on this browser are visible.' }
}

export function updateSmokePurchaseVerification(intentId, verificationPayload = {}) {
  const list = readLocal(LOCAL_KEYS.intents) || []
  const idx = list.findIndex(i => i.intentId === intentId)
  if (idx < 0) return { status: 'failed', reason: 'No matching local purchase intent found.' }
  list[idx] = { ...list[idx], ...verificationPayload, updatedAt: Date.now() }
  const ok = writeLocal(LOCAL_KEYS.intents, list)
  attemptRemoteSync('purchaseVerification', updateSmokePurchaseIntentRemote(intentId, verificationPayload))
  return ok
    ? { status: 'local_fallback', reason: 'Verification update saved to local fallback only — not yet visible to other devices.' }
    : { status: 'failed', reason: 'Local storage write failed.' }
}

export function saveSmokeEATHandoff(session, handoff) {
  const sessionId = session?.sessionId || 'unknown-session'
  const all = readLocal(LOCAL_KEYS.eatHandoffs) || {}
  all[sessionId] = { ...handoff, savedAt: Date.now() }
  const ok = writeLocal(LOCAL_KEYS.eatHandoffs, all)
  return ok
    ? { status: 'local_fallback', reason: 'E.A.T. handoff saved to local fallback — not visible to other devices yet.' }
    : { status: 'failed', reason: 'Local storage write failed.' }
}

export function loadSmokeEATHandoffs() {
  const all = readLocal(LOCAL_KEYS.eatHandoffs) || {}
  attemptRemoteSync('eatHandoffs', getSmokeEATHandoffsRemote())
  return { status: 'local_fallback', data: Object.values(all), reason: 'Loaded from local fallback storage only.' }
}

export function saveSmokeLeaderboardEntry(session, leaderboardEntry) {
  const sessionId = session?.sessionId || 'unknown-session'
  const all = readLocal(LOCAL_KEYS.leaderboard) || {}
  all[sessionId] = { ...leaderboardEntry, savedAt: Date.now() }
  const ok = writeLocal(LOCAL_KEYS.leaderboard, all)
  attemptRemoteSync('leaderboard', createSmokeLeaderboardEntryRemote({ sessionId, ...leaderboardEntry }))
  return ok
    ? { status: 'local_fallback', reason: 'Leaderboard entry saved to local fallback — a real community leaderboard requires shared backend storage.' }
    : { status: 'failed', reason: 'Local storage write failed.' }
}

export function loadSmokeLeaderboardEntries() {
  const all = readLocal(LOCAL_KEYS.leaderboard) || {}
  attemptRemoteSync('leaderboardList', getSmokeLeaderboardEntriesRemote())
  return { status: 'local_fallback', data: Object.values(all), reason: 'Loaded from local fallback storage only — not a real shared/community leaderboard yet.' }
}

/**
 * Builds the session.smokeCraft.{sharedStorage,backendStatus,syncStatus}
 * fragment for callers to persist via GuestSessionContext's update(). Keeps
 * every consumer (Scorecard, EventChallenge, POS3Home, etc.) writing the
 * exact same honest shape instead of re-deriving it ad hoc.
 */
export function buildSmokeStorageStatusFields(action, syncResult) {
  const mode = getSmokeSharedStorageMode()
  const backend = getSmokeBackendStatus()
  return {
    sharedStorage: { mode: mode.mode, backendConnected: mode.backendConnected, localFallback: mode.localFallback },
    backendStatus: { status: backend.status, reason: backend.reason },
    syncStatus: {
      lastAttemptAt: Date.now(),
      lastAction: action,
      lastResult: syncResult?.status || 'unknown',
    },
  }
}
