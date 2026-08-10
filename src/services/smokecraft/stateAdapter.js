/**
 * SmokeCraft shared client state adapter — Holistic Fix 4B.
 *
 * The one place SmokeCraft screens/contexts go through to read/write
 * server-authoritative journey content (tasting notes, selections, quiz
 * answers, pairing, mentor pick, etc. — the "journey snapshot" in
 * smokecraft_player_state, migration 094). localStorage
 * (sc_journey_v1, read/written by SmokeCraftJourneyContext directly)
 * remains the fast, offline-safe cache and pre-login recovery store —
 * this adapter is the sync layer on top of it, not a replacement for
 * it. See SMOKECRAFT_STATE_OWNERSHIP_MAP.md.
 *
 * Contract:
 *   - load(): { ok, status: 'ready'|'error'|'offline', snapshot, version }
 *   - save(snapshot): debounced, retries with backoff, resolves
 *     conflicts by ALWAYS taking the server's current state when a 409
 *     stale-version response arrives (never silently overwrites newer
 *     server state — matches SMOKECRAFT_GUEST_ACCOUNT_MERGE_POLICY.md's
 *     "server-authoritative value wins" rule), then reports
 *     status:'conflict' with the reconciled state so the caller can
 *     update its own cache.
 *   - subscribe(fn): status changes ('idle'|'syncing'|'synced'|'error'|
 *     'offline'|'conflict') for UI sync-status indicators.
 */

const BASE = '/api/smokecraft/player-state'
const SAVE_DEBOUNCE_MS = 1500
const MAX_RETRIES = 4

let currentVersion = 0
let saveTimer = null
let pendingSnapshot = null
let listeners = new Set()
let lastStatus = 'idle'

function setStatus(status) {
  lastStatus = status
  for (const fn of listeners) { try { fn(status) } catch {} }
}

export function subscribe(fn) {
  listeners.add(fn)
  fn(lastStatus)
  return () => listeners.delete(fn)
}

export function getStatus() { return lastStatus }

export async function load() {
  try {
    const res = await fetch(`${BASE}/journey-snapshot`, { credentials: 'include' })
    if (!res.ok) {
      setStatus('error')
      return { ok: false, status: 'error' }
    }
    const data = await res.json()
    if (!data.success) { setStatus('error'); return { ok: false, status: 'error' } }
    currentVersion = data.version
    setStatus('synced')
    return { ok: true, status: 'ready', snapshot: data.snapshot, version: data.version, updatedAt: data.updatedAt }
  } catch {
    setStatus('offline')
    return { ok: false, status: 'offline' }
  }
}

async function doSave(snapshot, attempt = 0) {
  setStatus('syncing')
  try {
    const res = await fetch(`${BASE}/journey-snapshot`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ snapshot, expectedVersion: currentVersion }),
    })
    if (res.status === 409) {
      const data = await res.json()
      // Server has moved on (another tab/device saved first) — take the
      // server's current state as authoritative rather than retrying
      // our own stale write, per the merge policy's "server value wins,
      // no silent overwrite of newer state" rule.
      currentVersion = data.current.version
      setStatus('conflict')
      return { ok: false, conflict: true, current: data.current }
    }
    const data = await res.json().catch(() => null)
    if (!res.ok || !data?.success) {
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, 500 * 2 ** attempt))
        return doSave(snapshot, attempt + 1)
      }
      setStatus('error')
      return { ok: false, status: 'error' }
    }
    currentVersion = data.current.version
    setStatus('synced')
    return { ok: true, current: data.current }
  } catch {
    if (attempt < MAX_RETRIES) {
      await new Promise(r => setTimeout(r, 500 * 2 ** attempt))
      return doSave(snapshot, attempt + 1)
    }
    setStatus('offline')
    return { ok: false, status: 'offline' }
  }
}

/**
 * Debounced save — coalesces rapid successive edits (e.g. typing in a
 * notes field) into one request rather than one per keystroke.
 */
export function save(snapshot) {
  pendingSnapshot = snapshot
  if (saveTimer) clearTimeout(saveTimer)
  return new Promise((resolve) => {
    saveTimer = setTimeout(async () => {
      const result = await doSave(pendingSnapshot)
      resolve(result)
    }, SAVE_DEBOUNCE_MS)
  })
}

/** Immediate, non-debounced save — used on page unload / explicit "save now" actions. */
export function saveNow(snapshot) {
  if (saveTimer) { clearTimeout(saveTimer); saveTimer = null }
  return doSave(snapshot)
}

export function getCurrentVersion() { return currentVersion }

/** Resets adapter state — used on sign-out / guest-to-account conversion (identity changed, version must be re-read). */
export function reset() {
  currentVersion = 0
  pendingSnapshot = null
  if (saveTimer) { clearTimeout(saveTimer); saveTimer = null }
  setStatus('idle')
}
