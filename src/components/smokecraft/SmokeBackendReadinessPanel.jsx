/**
 * Compact, honest backend-readiness indicator reused across SmokeCraft,
 * POS3, and E.A.T. surfaces. Every row reflects an actual checked value or
 * an explicit "Not checked" / "Pending config" — never a guessed "yes".
 */
import { useEffect } from 'react'
import { getSmokeApiConfigStatus } from '../../services/smokecraft/smokeBackendApiClient.js'
import { getSmokeBackendStatus, getSmokeSharedStorageMode, getSmokeRemoteSyncCache, checkSmokeBackendRouteStatus, getCachedSmokeRouteStatus } from '../../services/smokecraft/smokeSharedStorageService.js'

function Row({ label, value, tone }) {
  const colors = {
    connected: '#7ddca0',
    pending: '#e9c176',
    unknown: '#8b95a3',
    no: '#f0907f',
  }
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '5px 0', fontSize: 11, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <span style={{ color: '#8b95a3' }}>{label}</span>
      <span style={{ color: colors[tone] || colors.unknown, fontWeight: 600, textAlign: 'right' }}>{value}</span>
    </div>
  )
}

function remoteRowFor(cache, key) {
  const entry = cache[key]
  if (!entry) return { value: 'Not checked', tone: 'unknown' }
  if (entry.ok) return { value: 'connected', tone: 'connected' }
  if (entry.status === 'backend_required') return { value: 'pending config', tone: 'pending' }
  return { value: 'pending', tone: 'pending' }
}

export default function SmokeBackendReadinessPanel({ compact = false }) {
  const apiConfig = getSmokeApiConfigStatus()
  const backendStatus = getSmokeBackendStatus()
  const storageMode = getSmokeSharedStorageMode()
  const remoteCache = getSmokeRemoteSyncCache()
  const routeStatus = getCachedSmokeRouteStatus()

  useEffect(() => {
    checkSmokeBackendRouteStatus()
  }, [])

  const reachable = backendStatus.status === 'backend_reachable' ? 'yes'
    : backendStatus.status === 'backend_unreachable' ? 'no'
    : 'unknown'
  const reachableTone = reachable === 'yes' ? 'connected' : reachable === 'no' ? 'no' : 'unknown'

  const routesValue = !routeStatus.checked ? 'not checked' : routeStatus.ok ? 'connected' : 'failed'
  const routesTone = !routeStatus.checked ? 'unknown' : routeStatus.ok ? 'connected' : 'no'

  const dbModeValue = !routeStatus.checked ? 'not checked' : routeStatus.storageMode === 'postgres' ? 'postgres' : routeStatus.storageMode === 'memory_fallback' ? 'memory fallback' : 'none'
  const dbModeTone = !routeStatus.checked ? 'unknown' : routeStatus.storageMode === 'postgres' ? 'connected' : routeStatus.storageMode === 'memory_fallback' ? 'pending' : 'no'

  const sharedStorageValue = storageMode.mode === 'venue_shared' ? 'connected' : 'pending'
  const sharedStorageTone = storageMode.mode === 'venue_shared' ? 'connected' : 'pending'

  const pos3 = remoteRowFor(remoteCache, 'purchaseVerification')
  const eat = remoteRowFor(remoteCache, 'eatHandoffs')
  const leaderboard = remoteRowFor(remoteCache, 'leaderboard')

  return (
    <div style={{ borderRadius: 12, border: '1px solid rgba(212,168,67,0.18)', background: 'rgba(255,255,255,0.03)', padding: compact ? '10px 12px' : '14px 16px' }}>
      <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#d4a843', marginBottom: 6 }}>Backend Readiness</div>
      <Row label="Backend mode" value={storageMode.mode.replaceAll('_', ' ')} tone={storageMode.backendConnected ? 'connected' : 'pending'} />
      <Row label="API base URL configured" value={apiConfig.configured ? 'yes' : 'no'} tone={apiConfig.configured ? 'connected' : 'no'} />
      <Row label="Remote API reachable" value={reachable} tone={reachableTone} />
      <Row label="SmokeCraft API routes" value={routesValue} tone={routesTone} />
      <Row label="Database mode" value={dbModeValue} tone={dbModeTone} />
      <Row label="Local fallback active" value={storageMode.localFallback ? 'yes' : 'no'} tone={storageMode.localFallback ? 'pending' : 'connected'} />
      <Row label="Shared venue storage" value={sharedStorageValue} tone={sharedStorageTone} />
      <Row label="POS3 verification API" value={pos3.value} tone={pos3.tone} />
      <Row label="E.A.T. handoff API" value={eat.value} tone={eat.tone} />
      <Row label="Leaderboard API" value={leaderboard.value} tone={leaderboard.tone} />
      <Row label="Inventory sync" value="pending (no real inventory integration)" tone="pending" />
      <Row label="Audit API" value={routesValue} tone={routesTone} />
    </div>
  )
}
