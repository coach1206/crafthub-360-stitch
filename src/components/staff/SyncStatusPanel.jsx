/**
 * Sync Status Panel — Phase 6D, staff-only.
 * Surfaces the Phase 6C local outbox + Phase 6B backend status + Phase 6D
 * E.A.T. catch-up cursor in one panel. Never displays a "synced" badge
 * unless the underlying snapshot actually reports backend-confirmed counts —
 * this component renders state, it does not invent any.
 */
import { useState } from 'react'
import { Card, KpiCard, Pill, Btn, GOLD } from '../eat/ui.jsx'
import { getFullSyncStatus, formatSyncHealthForUI } from '../../services/syncStatusService.js'
import { processCatchUpEvents } from '../../services/eat/eatCatchUpConsumer.js'
import { retryPendingEvents } from '../../services/syncQueueService.js'

function backendTone(health) {
  if (!health) return 'info'
  if (!health.backendReachable) return 'critical'
  if (health.backendDegraded) return 'warning'
  return 'open'
}

function backendLabel(health) {
  if (!health) return 'Unknown'
  if (!health.backendReachable) return 'Backend Unreachable'
  if (health.backendDegraded) return 'Backend Degraded'
  return 'Backend Reachable'
}

function catchUpTone(mode) {
  if (mode === 'caught_up') return 'open'
  if (mode === 'catching_up') return 'pending'
  if (mode === 'error' || mode === 'degraded') return 'critical'
  return 'info'
}

export default function SyncStatusPanel() {
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(false)
  const [lastAction, setLastAction] = useState(null)

  async function refreshStatus() {
    setLoading(true)
    try {
      const snapshot = await getFullSyncStatus()
      setHealth(formatSyncHealthForUI(snapshot))
    } finally {
      setLoading(false)
    }
  }

  async function runCatchUp() {
    setLoading(true)
    try {
      const result = await processCatchUpEvents()
      setLastAction(result.success
        ? `Catch-up processed ${result.processed} of ${result.total} events.`
        : `Catch-up failed: ${result.error}`)
      await refreshStatus()
    } finally {
      setLoading(false)
    }
  }

  async function runRetry() {
    setLoading(true)
    try {
      const result = await retryPendingEvents()
      setLastAction(`Retry: ${result.synced} synced, ${result.stillPending} still pending (of ${result.attempted} attempted).`)
      await refreshStatus()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontWeight: 700 }}>Sync Status — Staff Only</div>
        <Pill label={backendLabel(health)} tone={backendTone(health)} />
      </div>

      {!health && (
        <div style={{ color: '#8b95a3', marginBottom: 12 }}>
          No status loaded yet — click "Refresh Status" to check the local sync queue and backend.
        </div>
      )}

      {health && (
        <>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <KpiCard label="Local Pending" value={health.queuePending} accent={health.queuePending ? GOLD : undefined} />
            <KpiCard label="Local Failed" value={health.queueFailed} accent={health.queueFailed ? '#f0907f' : undefined} />
            <KpiCard label="Local Synced" value={health.queueSynced} />
            <KpiCard label="Local Total" value={health.queueTotal} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Pill label={`E.A.T. Catch-Up: ${health.catchUpMode}`} tone={catchUpTone(health.catchUpMode)} />
            {health.catchUpStale && <Pill label="Stale" tone="warning" />}
          </div>
          <div style={{ fontSize: 12, color: '#8b95a3', marginBottom: 12 }}>
            Device: {health.deviceId}
            {health.catchUpLastSuccess && ` · Last catch-up: ${new Date(health.catchUpLastSuccess).toLocaleString()}`}
            {health.catchUpLastError && ` · Last catch-up error: ${health.catchUpLastError}`}
          </div>
        </>
      )}

      {lastAction && <div style={{ fontSize: 12, color: GOLD, marginBottom: 12 }}>{lastAction}</div>}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Btn tone="blue" onClick={refreshStatus} disabled={loading}>Refresh Status</Btn>
        <Btn tone="purple" onClick={runCatchUp} disabled={loading}>Run E.A.T. Catch-Up</Btn>
        <Btn tone="orange" onClick={runRetry} disabled={loading}>Retry Failed Local Events</Btn>
      </div>
    </Card>
  )
}
