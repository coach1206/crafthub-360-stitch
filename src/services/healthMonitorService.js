/**
 * Health Monitor Service — Phase 11
 * Polls backend endpoints and returns a system health summary.
 * Used by SystemHealthBadge and DeviceStatus page.
 */

let _lastResult = null
let _polling    = false

const ENDPOINTS = [
  { key: 'api',   url: '/api/health',                          label: 'Core API' },
  { key: 'voice', url: '/api/voice/capability',                label: 'Voice' },
  { key: 'pos3',  url: '/api/pos3/providers/prototype/status', label: 'POS 3' },
]

async function _ping(url) {
  const start = Date.now()
  try {
    const r = await fetch(url, { credentials: 'include', cache: 'no-store', signal: AbortSignal.timeout(4000) })
    const ms = Date.now() - start
    const json = await r.json().catch(() => null)
    return { ok: r.ok, ms, status: r.status, data: json }
  } catch (err) {
    return { ok: false, ms: Date.now() - start, error: err.message }
  }
}

/**
 * Runs a single health check pass and returns the result.
 * Also caches it in _lastResult.
 */
export async function checkHealth() {
  const results = await Promise.allSettled(
    ENDPOINTS.map(async ({ key, url, label }) => {
      const r = await _ping(url)
      return { key, label, ...r }
    })
  )

  const checks = results.map((r, i) =>
    r.status === 'fulfilled'
      ? r.value
      : { key: ENDPOINTS[i].key, label: ENDPOINTS[i].label, ok: false, error: 'Request failed' }
  )

  const allOk      = checks.every(c => c.ok)
  const someOk     = checks.some(c => c.ok)
  const apiOk      = checks.find(c => c.key === 'api')?.ok ?? false
  const pos3Avail  = checks.find(c => c.key === 'pos3')?.ok ?? false

  let overallStatus = 'offline'
  if (allOk)                           overallStatus = 'online'
  else if (apiOk && !allOk)            overallStatus = 'degraded'
  else if (!apiOk && pos3Avail)        overallStatus = 'degraded'
  else if (!apiOk && someOk)           overallStatus = 'degraded'

  // Special: if API is online but pos3 uses prototype, mark as prototype mode
  if (apiOk) {
    const pos3Data = checks.find(c => c.key === 'pos3')?.data
    if (pos3Data?.data?.isPrototype || !pos3Avail) overallStatus = apiOk ? 'prototype' : overallStatus
    if (allOk) overallStatus = 'online'
  }

  _lastResult = { checks, overallStatus, checkedAt: new Date().toISOString() }
  return _lastResult
}

/** Returns the last cached health check result without re-fetching. */
export function getLastHealth() { return _lastResult }

/**
 * Starts periodic health polling.
 * Returns a stop function.
 */
export function startHealthPolling(onUpdate, intervalMs = 30_000) {
  if (_polling) return () => {}
  _polling = true

  checkHealth().then(onUpdate)
  const id = setInterval(() => checkHealth().then(onUpdate), intervalMs)

  return () => {
    clearInterval(id)
    _polling = false
  }
}
