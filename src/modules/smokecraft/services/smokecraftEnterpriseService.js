/**
 * SmokeCraft Enterprise Service — Frontend
 * Fetches enterprise packaging and governance data from /api/modules/smokecraft/enterprise/*.
 */

const BASE = '/api/modules/smokecraft/enterprise'

async function safeFetch(url, options = {}) {
  try {
    const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options })
    if (!res.ok) return { error: `HTTP ${res.status}`, url }
    return await res.json()
  } catch (err) {
    return { error: err.message, url }
  }
}

export const getEnterpriseStatus      = ()           => safeFetch(`${BASE}/status`)
export const getEnterprisePackage     = ()           => safeFetch(`${BASE}/package`)
export const getWhiteLabelStatus      = ()           => safeFetch(`${BASE}/white-label`)
export const getTenantStatus          = (tenantId)   => safeFetch(`${BASE}/tenant/${tenantId}`)
export const getLicenseStatus         = ()           => safeFetch(`${BASE}/license`)
export const getMarketplaceDraft      = ()           => safeFetch(`${BASE}/marketplace-draft`)
export const getUpgradeRollback       = ()           => safeFetch(`${BASE}/upgrade-rollback`)
export const getFeatureFlags          = ()           => safeFetch(`${BASE}/feature-flags`)
export const getEntitlements          = (tenantId)   => safeFetch(`${BASE}/entitlements/${tenantId}`)
export const getEnterpriseReadiness   = ()           => safeFetch(`${BASE}/readiness`)
export const getGovernanceAudit       = ()           => safeFetch(`${BASE}/audit`)
