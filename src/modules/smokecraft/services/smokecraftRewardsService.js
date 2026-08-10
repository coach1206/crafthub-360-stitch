/**
 * SmokeCraft Rewards Service (module layer)
 * Calls backend rewards routes. Falls back gracefully when backend unavailable.
 */

const BASE = '/api/modules/smokecraft/rewards'

async function safeFetch(path, options = {}) {
  try {
    const res = await fetch(path, options)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function getUserRewards(userId) {
  return await safeFetch(`${BASE}/user/${userId}`) ?? { userId, rewards: [], summary: null, error: 'unavailable' }
}

export async function evaluatePassportEligibility(payload) {
  return await safeFetch(`${BASE}/passport/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }) ?? { eligible: false, blockedReasons: ['backend_unavailable'] }
}

export async function awardPassportStamp(payload) {
  return await safeFetch(`${BASE}/passport/award`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }) ?? { awarded: false, error: 'backend_unavailable' }
}

export async function evaluateOrderRewards(payload) {
  return await safeFetch(`${BASE}/order/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }) ?? { orderRewards: [], error: 'backend_unavailable' }
}

export async function evaluatePairingRewards(payload) {
  return await safeFetch(`${BASE}/pairing/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }) ?? { pairingRewards: [], error: 'backend_unavailable' }
}

export async function getMonetizationPreview(venueId) {
  return await safeFetch(`${BASE}/monetization/${venueId}`) ?? {
    previewModels: [],
    billingStatus: 'preview_only',
    licenseStatus: 'license_not_enforced',
    marketplaceStatus: 'not_live_marketplace',
    previewOnly: true,
  }
}

export async function getRewardsStatus() {
  return await safeFetch(`${BASE}/status`) ?? {
    posVerified: false,
    eatSyncStatus: 'not_connected',
    billingStatus: 'preview_only',
    licenseStatus: 'license_not_enforced',
    marketplaceStatus: 'not_live_marketplace',
  }
}
