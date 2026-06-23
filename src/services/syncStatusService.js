/**
 * Sync Status Service — Phase 6D
 * Combines the Phase 6C local outbox (syncQueueService.js), the Phase 6B
 * backend status route (syncApiClient.js), the E.A.T. catch-up cursor
 * (eatCatchUpConsumer.js), and the device identity (deviceIdService.js)
 * into one read-only status snapshot for the staff sync status UI.
 * Invents no new sync behavior — purely aggregates existing state.
 */

import { getQueueStatus } from './syncQueueService.js'
import { fetchSyncStatus } from './syncApiClient.js'
import { getCatchUpSummary } from './eat/eatCatchUpConsumer.js'
import { getDeviceId } from './shared/deviceIdService.js'

export async function getQueueSummary() {
  try {
    return await getQueueStatus()
  } catch (err) {
    return { pending: 0, syncing: 0, synced: 0, failed: 0, total: 0, backendStatus: null, error: err.message }
  }
}

export async function getBackendSummary() {
  const status = await fetchSyncStatus()
  if (!status) return { reachable: false, data: null }
  return { reachable: true, data: status }
}

export function getEatCatchUpSummary() {
  return getCatchUpSummary()
}

export function getDeviceSyncIdentity() {
  return { deviceId: getDeviceId() }
}

/**
 * Full snapshot — fetches queue + backend status concurrently, then
 * attaches catch-up state and device identity (both synchronous/local).
 */
export async function getFullSyncStatus() {
  const [queue, backend] = await Promise.all([getQueueSummary(), getBackendSummary()])
  return {
    queue,
    backend,
    eatCatchUp: getEatCatchUpSummary(),
    device: getDeviceSyncIdentity(),
    generatedAt: Date.now(),
  }
}

/**
 * Maps the raw snapshot to UI-friendly fields. Honest by construction:
 * "synced" only ever reflects backend-confirmed counts already computed
 * upstream — this function does not invent a synced state of its own.
 */
export function formatSyncHealthForUI(snapshot) {
  if (!snapshot) return null
  const { queue, backend, eatCatchUp, device } = snapshot
  return {
    deviceId: device.deviceId,
    queuePending: queue.pending + queue.syncing,
    queueFailed: queue.failed,
    queueSynced: queue.synced,
    queueTotal: queue.total,
    backendReachable: backend.reachable,
    backendDegraded: backend.reachable ? Boolean(backend.data?.degraded) : null,
    catchUpMode: eatCatchUp.mode,
    catchUpStale: eatCatchUp.isStale,
    catchUpLastSuccess: eatCatchUp.lastSuccessfulCatchUpAt,
    catchUpLastError: eatCatchUp.lastError,
  }
}
