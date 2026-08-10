/**
 * SmokeCraft Persistence Frontend Service
 */

const BASE = '/api/modules/smokecraft/persistence'

async function safeFetch(url, opts = {}) {
  try {
    const res  = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opts })
    return await res.json()
  } catch {
    return { success: false, error: 'fetch_failed' }
  }
}

export const getPersistenceStatus    = () => safeFetch(`${BASE}/status`)
export const getPersistenceHealth    = () => safeFetch(`${BASE}/health`)
export const getPersistenceRegistry  = () => safeFetch(`${BASE}/registry`)
export const getPersistenceArea      = (areaId) => safeFetch(`${BASE}/area/${areaId}`)
export const getDatabaseStatus       = () => safeFetch(`${BASE}/database`)
export const getMigrationPlan        = () => safeFetch(`${BASE}/migration-plan`)
export const createMigrationPlan     = (body = {}) => safeFetch(`${BASE}/migration-plan/create`, { method: 'POST', body: JSON.stringify(body) })
export const getPersistenceAudit     = () => safeFetch(`${BASE}/audit`)
