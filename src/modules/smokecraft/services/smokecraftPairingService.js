/**
 * SmokeCraft Pairing Service (module layer)
 * Calls backend pairing intelligence routes where safe.
 * Falls back to local_intelligence response when backend is unavailable.
 * Does not claim AI-backed pairing unless provider adapter confirms connection.
 */

import { buildPairingFallbackResponse } from '../data/smokecraftPairingContract.js'

const BASE = '/api/modules/smokecraft/pairing'

async function safeFetch(path, options = {}) {
  try {
    const res = await fetch(path, options)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

/**
 * Returns the current pairing provider status from the backend.
 */
export async function getPairingProviderStatus() {
  const result = await safeFetch(`${BASE}/provider/status`)
  return result ?? {
    providerConnected: false,
    aiBacked: false,
    recommendationStatus: 'local_intelligence',
    message: 'Unable to reach pairing backend.',
  }
}

/**
 * Generates a pairing recommendation via the backend intelligence engine.
 * Falls back to local pairing contract response if backend is unavailable.
 */
export async function getRecommendations(cigarProfile, context = {}) {
  const result = await safeFetch(`${BASE}/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cigarProfile, ...context }),
  })
  if (result?.recommendation) return result.recommendation
  return buildPairingFallbackResponse({ cigarProfile, ...context })
}

/**
 * Returns menu recommendations for the current venue + session context.
 */
export async function getMenuRecommendations(payload) {
  const result = await safeFetch(`${BASE}/menu-recommendations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return result ?? {
    recommendations: [],
    venueMenuBacked: false,
    menuSource: 'local_fallback',
    syncStatus: 'not_connected',
    message: 'Menu recommendations unavailable. Backend unreachable.',
  }
}

/**
 * Submits a Flavor Memory capture to the backend.
 */
export async function submitFlavorMemory(payload) {
  const result = await safeFetch(`${BASE}/flavor-memory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return result ?? { error: 'flavor_memory_unavailable' }
}

/**
 * Updates the customer pairing preference profile.
 */
export async function updatePairingProfile(payload) {
  const result = await safeFetch(`${BASE}/profile/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return result ?? { error: 'profile_update_unavailable' }
}

/**
 * Returns mentor-specific pairing tips (local data, no backend needed).
 */
export function getMentorPairingTips(mentorId) {
  const tips = MENTOR_PAIRING_TIPS[mentorId]
  if (!tips) {
    return { mentorId, tips: [], status: 'demo_only', source: 'local_fallback' }
  }
  return { mentorId, tips, status: 'ready', source: 'local_data' }
}

const MENTOR_PAIRING_TIPS = {
  dominican: [
    'Pair with aged rum — the volcanic soil complexity harmonizes with barrel notes.',
    'Try a bold espresso to match the earthy Olor wrapper character.',
  ],
  cuban: [
    'Aged cognac or single malt Scotch complement the cedar and leather notes.',
    'Dark chocolate brings out the nuances of Vuelta Abajo leaf.',
  ],
  nicaraguan: [
    'Full-bodied bourbon enhances the peppery ligero tobacco of Nicaragua.',
    'Sharp blue cheese or charcuterie stand up to the strength.',
  ],
}

export function buildPairingServiceReport() {
  return {
    moduleId: 'smokecraft-experience',
    pairingEngineConnected: false,
    aiBacked: false,
    posBacked: false,
    venueMenuBacked: false,
    status: 'local_intelligence',
    preview_only: false,
    message: 'Pairing service upgraded to local_intelligence in Module Build 4. Connect a live AI provider for aiBacked recommendations.',
  }
}
