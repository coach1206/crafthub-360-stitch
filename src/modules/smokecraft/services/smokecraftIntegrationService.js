/**
 * SmokeCraft Integration Service — Frontend
 * Fetches integration status from /api/modules/smokecraft/integrations/*.
 * Never receives raw secret values from backend.
 */

const BASE = '/api/modules/smokecraft/integrations'

async function safeFetch(url, options = {}) {
  try {
    const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options })
    if (!res.ok) return { error: `HTTP ${res.status}`, url }
    return await res.json()
  } catch (err) {
    return { error: err.message, url }
  }
}

export const getIntegrationStatus      = ()           => safeFetch(`${BASE}/status`)
export const getEnvironmentValidation  = ()           => safeFetch(`${BASE}/environment`)
export const getDatabaseReadiness      = ()           => safeFetch(`${BASE}/database`)
export const getConnectors             = ()           => safeFetch(`${BASE}/connectors`)
export const getIntegrationHealth      = ()           => safeFetch(`${BASE}/health`)
export const getProductionReadiness    = ()           => safeFetch(`${BASE}/production-readiness`)
export const getSyncEvents             = ()           => safeFetch(`${BASE}/sync/events`)
export const getIntegrationAudit       = (connectorType) =>
  safeFetch(`${BASE}/audit${connectorType ? `?connectorType=${connectorType}` : ''}`)

export const queueSyncEvent = (targetSystem, payload) =>
  safeFetch(`${BASE}/sync/queue`, {
    method: 'POST',
    body: JSON.stringify({ targetSystem, payload }),
  })

export const retrySyncEvent = (syncEventId) =>
  safeFetch(`${BASE}/sync/${syncEventId}/retry`, { method: 'POST' })
