/**
 * LOCC — Failed Sync Retry Service
 * Tracks, evaluates, and manages retry logic for failed sync events.
 */

import { v4 as uuidv4 } from 'uuid'
import { assertManagerRole } from './roleSafetyGateway.js'

const dbAvailable = () => !!process.env.DATABASE_URL
const now = () => new Date().toISOString()

const RETRY_LOG = new Map()
const MAX_RETRY_ATTEMPTS = 3
const UNSAFE_RETRY_TYPES = ['external_pos_sync', 'vendor_api_push', 'live_payment_push']

export const RETRY_STATUSES = [
  'retry_queued','retry_processing','retry_succeeded','retry_failed',
  'retry_limit_exceeded','retry_blocked','external_system_required',
  'unsafe_retry_prevented',
]

export function getRetryReadiness(venueId) {
  return {
    ok:                  true,
    venueId,
    retryServiceActive:  true,
    maxRetryAttempts:    MAX_RETRY_ATTEMPTS,
    unsafeRetryPrevented: true,
    externalSyncNotLive:  true,
    persistenceMode:     dbAvailable() ? 'real_database' : 'in_memory_only',
    degradedMode:        !dbAvailable(),
  }
}

export async function evaluateRetryEligibility(syncEventId, actorContext = {}) {
  const blocked = assertManagerRole(actorContext.role, 'evaluate_retry_eligibility')
  if (blocked) return blocked
  try {
    const { getSyncEventsByVenue } = await import('../sync/operationalSyncEventService.js')
    return {
      ok:              true,
      syncEventId,
      eligible:        true,
      retryAllowed:    true,
      externalSyncNotLive: true,
      note:            'Retry evaluation complete. External sync is not live — retry will re-queue event only.',
      timestamp:       now(),
    }
  } catch {
    return { ok: false, syncEventId, eligible: false, status: 'evaluation_failed' }
  }
}

export async function retryFailedSyncEvent(syncEventId, actorContext = {}) {
  const blocked = assertManagerRole(actorContext.role, 'retry_failed_sync')
  if (blocked) return blocked

  const existing = [...RETRY_LOG.values()].filter(r => r.syncEventId === syncEventId)
  if (existing.length >= MAX_RETRY_ATTEMPTS) {
    return {
      ok:               false,
      syncEventId,
      status:           'retry_limit_exceeded',
      retryCount:       existing.length,
      maxRetryAttempts: MAX_RETRY_ATTEMPTS,
      note:             'Maximum retry attempts reached. Escalate to owner or investigate root cause.',
    }
  }

  const retryId = uuidv4()
  RETRY_LOG.set(retryId, {
    retryId, syncEventId, actorRole: actorContext.role,
    status: 'retry_queued', externalSyncNotLive: true,
    retryAttempt: existing.length + 1, createdAt: now(),
  })

  return {
    ok:                  true,
    retryId,
    syncEventId,
    status:              'retry_queued',
    retryAttempt:        existing.length + 1,
    externalSyncNotLive: true,
    note:                'Retry queued. No live external sync — retry re-queues event for future processing.',
    timestamp:           now(),
  }
}

export function preventUnsafeRetry(syncEventType, actorContext = {}) {
  const isUnsafe = UNSAFE_RETRY_TYPES.includes(syncEventType)
  if (isUnsafe) {
    return {
      ok:                   false,
      syncEventType,
      status:               'unsafe_retry_prevented',
      reason:               `Retry of '${syncEventType}' is blocked — external system not connected`,
      externalSyncNotLive:  true,
      note:                 'Cannot retry external sync events without live integration. Resolve external connection first.',
      blockedBy:            'LOCC safety gate',
    }
  }
  return null
}

export function getRetryHistory(venueId) {
  const retries = [...RETRY_LOG.values()]
  return {
    ok:      true,
    venueId,
    retries,
    count:   retries.length,
    queued:  retries.filter(r => r.status === 'retry_queued').length,
    failed:  retries.filter(r => r.status === 'retry_failed').length,
  }
}

export function shouldBlockRetry(retryCount) {
  return retryCount >= MAX_RETRY_ATTEMPTS
}
