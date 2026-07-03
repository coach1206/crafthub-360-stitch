/**
 * SmokeCraft Pairing Service (module layer)
 * Returns pairing recommendations with honest fallback status.
 * Does not claim AI-backed or POS-backed pairing unless an adapter confirms connection.
 */

import { buildPairingFallbackResponse, createPairingRecommendation } from '../data/smokecraftPairingContract.js'

/**
 * Returns recommendations for a given cigar profile and session context.
 * Returns demo_only fallback when the pairing engine is not connected.
 */
export function getRecommendations(cigarProfile, context = {}) {
  return buildPairingFallbackResponse({ cigarProfile, ...context })
}

/**
 * Returns mentor-specific pairing tips based on selected mentor.
 */
export function getMentorPairingTips(mentorId) {
  const tips = MENTOR_PAIRING_TIPS[mentorId]
  if (!tips) {
    return {
      mentorId,
      tips: [],
      status: 'demo_only',
      source: 'local_fallback',
    }
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
    status: 'demo_only',
    preview_only: true,
    message: 'Pairing service is local fallback only. Connect a live pairing engine in Module Build 3.',
  }
}
