/**
 * Sync Queue Service — Phase 6C
 * Durable client-side outbox for internal multi-device sync. Backed by
 * IndexedDB (not localStorage) so the queue can hold an unbounded, ordered
 * list of pending events without localStorage's ~5MB ceiling risk under
 * heavy offline use (Phase 6A, Section G).
 *
 * This is purely additive: it sits alongside the existing localStorage
 * flows (opsEventBus/opsStorage, pos3Service, etc.) and the existing
 * fire-and-forget syncService.js — it does not replace or remove any of
 * them. Events are saved here first, then synced to the Phase 6B backend
 * event store (/api/sync/events) by the retry loop below.
 *
 * An event is only ever marked 'synced' after the backend explicitly
 * confirms success (per-event `success: true`, not `degraded`) — never
 * on HTTP 200 alone, and never optimistically.
 */

import { getDeviceId } from './shared/deviceIdService.js'
import { postSyncEvents, getSyncStatus } from './syncApiClient.js'

const DB_NAME    = 'novee_sync_queue'
const DB_VERSION = 1
const STORE_NAME = 'events'
const MAX_RETRIES = 8

let dbPromise = null

function openDb() {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available in this environment'))
      return
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'eventId' })
        store.createIndex('syncStatus', 'syncStatus', { unique: false })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror   = () => reject(req.error)
  })
  return dbPromise
}

async function withStore(mode, fn) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, mode)
    const store = tx.objectStore(STORE_NAME)
    const result = fn(store)
    tx.oncomplete = () => resolve(result)
    tx.onerror    = () => reject(tx.error)
  })
}

function reqToPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror   = () => reject(req.error)
  })
}

/**
 * Saves a new event to the durable outbox.
 * `event` should carry { eventId, sourceSystem, eventType, entityId, payload }.
 * eventId, if omitted, is generated here. Returns the stored record.
 */
export async function saveEvent(event) {
  const eventId = event.eventId || (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`)
  const record = {
    eventId,
    timestamp:       Date.now(),
    sourceDeviceId:  getDeviceId(),
    sourceSystem:    event.sourceSystem,
    eventType:       event.eventType,
    entityId:        event.entityId ?? null,
    payload:         event.payload ?? {},
    syncStatus:      'pending',
    retryCount:      0,
    lastError:       null,
    lastAttemptAt:   null,
  }
  await withStore('readwrite', (store) => store.put(record))
  return record
}

export async function getPendingEvents() {
  const all = await withStore('readonly', (store) => reqToPromise(store.getAll()))
  const resolved = await all
  return resolved.filter((e) => e.syncStatus === 'pending' || e.syncStatus === 'failed')
}

export async function getAllEvents() {
  return withStore('readonly', (store) => reqToPromise(store.getAll()))
}

async function patchEvent(eventId, patch) {
  return withStore('readwrite', async (store) => {
    const existing = await reqToPromise(store.get(eventId))
    if (!existing) return null
    const updated = { ...existing, ...patch }
    store.put(updated)
    return updated
  })
}

export async function markSyncing(eventId) {
  return patchEvent(eventId, { syncStatus: 'syncing', lastAttemptAt: Date.now() })
}

export async function markSynced(eventId) {
  return patchEvent(eventId, { syncStatus: 'synced', lastError: null })
}

export async function markFailed(eventId, error) {
  const existing = await withStore('readonly', (store) => reqToPromise(store.get(eventId)))
  const resolved = await existing
  const retryCount = (resolved?.retryCount || 0) + 1
  return patchEvent(eventId, {
    syncStatus:    retryCount >= MAX_RETRIES ? 'failed' : 'pending',
    retryCount,
    lastError:     error?.message || String(error),
    lastAttemptAt: Date.now(),
  })
}

/**
 * Attempts to flush all pending/failed events to the backend.
 * Never claims an event is synced unless the backend's per-event response
 * explicitly says `success: true` and not `degraded` (Phase 6B contract).
 */
export async function retryPendingEvents() {
  const pending = await getPendingEvents()
  if (pending.length === 0) return { attempted: 0, synced: 0, stillPending: 0 }

  const eligible = pending.filter((e) => e.retryCount < MAX_RETRIES)
  if (eligible.length === 0) return { attempted: 0, synced: 0, stillPending: pending.length }

  for (const evt of eligible) {
    await markSyncing(evt.eventId)
  }

  const response = await postSyncEvents(eligible)

  let synced = 0
  if (response?.success && Array.isArray(response.data?.results)) {
    const byId = new Map(response.data.results.map((r) => [r.eventId, r]))
    for (const evt of eligible) {
      const result = byId.get(evt.eventId)
      if (result && result.success === true && !result.degraded) {
        await markSynced(evt.eventId)
        synced += 1
      } else {
        await markFailed(evt.eventId, new Error(result?.error || 'Sync not confirmed by backend'))
      }
    }
  } else {
    // No response at all (offline/network error/backend down) — keep every
    // event pending, never report a fake success.
    for (const evt of eligible) {
      await markFailed(evt.eventId, new Error('No response from backend (offline or unavailable)'))
    }
  }

  const remaining = await getPendingEvents()
  return { attempted: eligible.length, synced, stillPending: remaining.length }
}

export async function getQueueStatus() {
  const all = await getAllEvents()
  const counts = { pending: 0, syncing: 0, synced: 0, failed: 0, total: all.length }
  for (const e of all) {
    counts[e.syncStatus] = (counts[e.syncStatus] || 0) + 1
  }
  let backendStatus = null
  try {
    backendStatus = await getSyncStatus()
  } catch {
    backendStatus = null
  }
  return { ...counts, backendStatus }
}

export async function clearSyncedEvents() {
  return withStore('readwrite', async (store) => {
    const all = await reqToPromise(store.getAll())
    const synced = all.filter((e) => e.syncStatus === 'synced')
    for (const e of synced) store.delete(e.eventId)
    return synced.length
  })
}

let retryTimerArmed = false

/** Wires retry triggers: app load + browser online event. Call once at startup. */
export function initSyncQueueRetryTriggers() {
  if (retryTimerArmed || typeof window === 'undefined') return
  retryTimerArmed = true

  retryPendingEvents().catch(() => {})

  window.addEventListener('online', () => {
    retryPendingEvents().catch(() => {})
  })
}
