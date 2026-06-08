/**
 * Sync Service — bridges localStorage prototype data to the backend API.
 *
 * Rules:
 *  - localStorage is always the source of truth first
 *  - Backend sync is additive, never destructive
 *  - Failed syncs are queued locally and retried on next flush
 *  - Guest journey NEVER blocks on sync failure
 *  - All functions are fire-and-forget safe
 */

import { apiPost } from './apiClient.js'
import { preparePOS3Payload } from './pos3ActivityService.js'
import { prepareCommandCenterPayload } from './eatAnalyticsService.js'

const QUEUE_KEY = 'novee_sync_queue'
const MAX_QUEUE = 50

// ── Queue helpers ─────────────────────────────────────────────

function getQueue() {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]') } catch { return [] }
}

function persistQueue(q) {
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q.slice(-MAX_QUEUE))) } catch {}
}

/** Adds a failed sync item to the offline queue for later retry. */
export function queueOfflineSync(type, payload) {
  const q = getQueue()
  q.push({ type, payload, enqueuedAt: Date.now(), retries: 0 })
  persistQueue(q)
}

// ── Individual sync functions ─────────────────────────────────

/** Syncs the guest session record (upsert). */
export async function syncSessionToBackend(session) {
  if (!session?.sessionId) return

  const result = await apiPost('/api/sessions', {
    sessionId:            session.sessionId,
    selectedCraft:        session.selectedCraft,
    selectedMentor:       session.selectedMentor,
    selectedMentorCountry: session.selectedMentorCountry,
    selectedLevel:        session.selectedLevel,
    lastVisitedRoute:     session.system?.lastVisitedRoute || session.lastVisitedRoute,
    sourceModule:         session.system?.sourceModule,
    schemaVersion:        4,
  })

  if (!result) {
    queueOfflineSync('session', { sessionId: session.sessionId })
  }
}

/** Syncs the most recently earned passport stamp. */
export async function syncPassportToBackend(session) {
  const earned    = session?.passport?.earnedStamps || []
  const passportId = session?.passport?.passportId
  if (!passportId || !earned.length) return

  const latestStamp = earned[earned.length - 1]
  const result = await apiPost(`/api/passport/${passportId}/stamps`, {
    passportId,
    sessionId: session.sessionId,
    ...latestStamp,
  })

  if (!result) {
    queueOfflineSync('passport', { passportId, sessionId: session.sessionId, stamp: latestStamp })
  }
}

/** Syncs the leaderboard score for this session. */
export async function syncLeaderboardToBackend(session) {
  const score = session?.leaderboard?.score ?? session?.leaderboardScore ?? 0
  if (!session?.sessionId || !score) return

  const result = await apiPost('/api/leaderboard', {
    sessionId:   session.sessionId,
    displayName: session.leaderboard?.displayName || session.profile?.nickname || 'Lounge Guest',
    score,
  })

  if (!result) {
    queueOfflineSync('leaderboard', { sessionId: session.sessionId, score })
  }
}

/** Syncs the POS 3 activity payload. */
export async function syncPOS3ToBackend(session) {
  if (!session?.sessionId) return

  const payload = preparePOS3Payload(session)
  const result  = await apiPost('/api/pos3/activity', payload)

  if (!result) {
    queueOfflineSync('pos3', { sessionId: session.sessionId })
  }
}

/** Syncs the E.A.T. Command analytics payload. */
export async function syncEATToBackend(session) {
  if (!session?.sessionId) return

  const payload = prepareCommandCenterPayload(session)
  const result  = await apiPost('/api/eat/analytics', payload)

  if (!result) {
    queueOfflineSync('eat', { sessionId: session.sessionId })
  }
}

/** Runs all sync functions in parallel (non-blocking). */
export async function syncAll(session) {
  if (!session?.sessionId) return
  await Promise.allSettled([
    syncSessionToBackend(session),
    syncPassportToBackend(session),
    syncLeaderboardToBackend(session),
    syncPOS3ToBackend(session),
    syncEATToBackend(session),
  ])
}

/**
 * Flushes the offline sync queue.
 * Call once on app startup (in main.jsx) and after reconnect events.
 * Silently no-ops if queue is empty or backend is unavailable.
 */
export async function flushOfflineQueue() {
  const q = getQueue()
  if (!q.length) return

  const remaining = []

  for (const item of q) {
    let synced = false
    try {
      if (item.type === 'session') {
        const r = await apiPost('/api/sessions', item.payload)
        synced = !!r
      } else if (item.type === 'passport') {
        const pid = item.payload?.passportId
        if (pid) {
          const r = await apiPost(`/api/passport/${pid}/stamps`, item.payload)
          synced = !!r
        }
      } else if (item.type === 'leaderboard') {
        const r = await apiPost('/api/leaderboard', item.payload)
        synced = !!r
      } else if (item.type === 'pos3') {
        const r = await apiPost('/api/pos3/activity', item.payload)
        synced = !!r
      } else if (item.type === 'eat') {
        const r = await apiPost('/api/eat/analytics', item.payload)
        synced = !!r
      }
    } catch { /* keep in queue */ }

    if (!synced) {
      const retries = (item.retries || 0) + 1
      if (retries <= 3) {
        remaining.push({ ...item, retries })
      }
      // Drop after 3 retries to prevent queue overflow
    }
  }

  persistQueue(remaining)
}
